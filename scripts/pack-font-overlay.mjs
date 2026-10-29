/** Offline font-only overlay. No installation, build, subprocess, registry, or network access. */
import { createHash, timingSafeEqual } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, lstatSync, realpathSync, existsSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, isAbsolute, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync, gunzipSync } from 'node:zlib';
import { isDeepStrictEqual } from 'node:util';

export const FULL_FONT_SHA256 = '9599f12fd42fc0bce1cd50b47a0c022e108d7aa64dd0d1bb0ed44f3282d900b4';
export const FULL_FONT_PATH = 'fonts/pretendard/PretendardVariable.woff2';
export const SOURCE_FILES = Object.freeze(['fonts.css', 'fonts-atomic.css', 'fonts/manifest.json', 'src/core/fonts.mjs', 'src/core/fonts.d.mts', FULL_FONT_PATH]);
const PROVENANCE = 'fonts/atomic-overlay.json';
const MUTABLE = new Set(['package.json', ...SOURCE_FILES.filter(p => p !== 'fonts.css'), PROVENANCE]);
const hash = (data, algorithm = 'sha256', encoding = 'hex') => createHash(algorithm).update(data).digest(encoding);
const json = value => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
const fail = message => { throw new Error(message); };
const sorted = values => [...values].sort();

function safePath(path) {
  if (typeof path !== 'string' || !path || /[\\\x00-\x1f\x7f:]/.test(path) || path.startsWith('/')) fail(`Unsafe tar path: ${JSON.stringify(path)}`);
  if (path.split('/').some(part => !part || part === '.' || part === '..' || /[. ]$/.test(part))) fail(`Unsafe tar path: ${JSON.stringify(path)}`);
  return path;
}
function field(header, offset, length) {
  const bytes = header.subarray(offset, offset + length);
  const end = bytes.indexOf(0);
  return new TextDecoder('utf-8', { fatal: true }).decode(end < 0 ? bytes : bytes.subarray(0, end));
}
function octal(header, offset, length) {
  const text = field(header, offset, length).trim();
  if (!/^[0-7]*$/.test(text)) fail('Invalid or unsupported tar numeric field');
  const value = text ? Number.parseInt(text, 8) : 0;
  if (!Number.isSafeInteger(value)) fail('Tar number exceeds safe integer range');
  return value;
}
function readPax(data) {
  let offset = 0, path;
  while (offset < data.length) {
    const space = data.indexOf(32, offset);
    if (space < 0) fail('Invalid PAX record');
    const length = data.subarray(offset, space).toString('ascii');
    if (!/^[1-9][0-9]*$/.test(length)) fail('Invalid PAX length');
    const end = offset + Number(length);
    if (!Number.isSafeInteger(end) || end > data.length || end <= space + 1 || data[end - 1] !== 10) fail('Invalid PAX record length');
    const record = new TextDecoder('utf-8', { fatal: true }).decode(data.subarray(space + 1, end - 1));
    const equal = record.indexOf('=');
    if (equal < 1) fail('Invalid PAX key');
    const key = record.slice(0, equal);
    if (key === 'linkpath' || key === 'size' || key.startsWith('GNU.sparse')) fail(`Unsupported PAX key: ${key}`);
    if (key === 'path') {
      if (path !== undefined) fail('Duplicate PAX path');
      path = record.slice(equal + 1);
    }
    offset = end;
  }
  return path;
}

/** Read package/ regular files in memory. Safe directory and local PAX metadata are recognized. */
export function readTarGz(archive) {
  const tar = gunzipSync(archive, { maxOutputLength: 128 * 1024 * 1024 });
  if (tar.length % 512) fail('Truncated tar block');
  const files = new Map();
  let pendingPath, pendingPax = false, ended = false;
  for (let offset = 0; offset < tar.length;) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every(byte => byte === 0)) {
      if (pendingPax || tar.length - offset < 1024 || !tar.subarray(offset).every(byte => byte === 0)) fail('Invalid tar terminator');
      ended = true;
      break;
    }
    let sum = 0;
    for (let i = 0; i < 512; i++) sum += i >= 148 && i < 156 ? 32 : header[i];
    if (octal(header, 148, 8) !== sum) fail('Tar header checksum mismatch');
    const size = octal(header, 124, 12);
    const next = offset + 512 + Math.ceil(size / 512) * 512;
    if (next > tar.length) fail('Truncated tar file');
    const data = tar.subarray(offset + 512, offset + 512 + size);
    const prefix = field(header, 345, 155), name = field(header, 0, 100);
    const rawPath = prefix ? `${prefix}/${name}` : name;
    const type = header[156] === 0 ? '0' : String.fromCharCode(header[156]);
    if (type === 'x') {
      if (pendingPax) fail('Consecutive PAX headers');
      safePath(rawPath);
      pendingPath = readPax(data);
      pendingPax = true;
      offset = next;
      continue;
    }
    if (type !== '0' && type !== '5') fail(`Unsupported tar entry type: ${JSON.stringify(type)}`);
    const actual = pendingPath ?? rawPath;
    pendingPath = undefined;
    pendingPax = false;
    const path = safePath(type === '5' ? actual.replace(/\/$/, '') : actual);
    if (type === '5') {
      if (size !== 0 || (path !== 'package' && !path.startsWith('package/'))) fail('Invalid package directory');
    } else {
      if (!path.startsWith('package/')) fail(`Tar file outside package/: ${path}`);
      const key = safePath(path.slice(8));
      if (files.has(key)) fail(`Duplicate tar path: ${key}`);
      files.set(key, { data: Buffer.from(data), mode: octal(header, 100, 8) & 0o777 });
      if (files.size > 20000) fail('Too many tar files');
    }
    offset = next;
  }
  if (!ended) fail('Tar has no complete terminator');
  for (const path of files.keys()) {
    const parts = path.split('/');
    for (let i = 1; i < parts.length; i++) if (files.has(parts.slice(0, i).join('/'))) fail(`File/directory collision: ${path}`);
  }
  return files;
}
function putOctal(header, offset, length, value) {
  if (!Number.isSafeInteger(value) || value < 0) fail('Invalid tar output number');
  const text = value.toString(8).padStart(length - 1, '0');
  if (text.length >= length) fail('Tar numeric field overflow');
  header.write(text, offset, length - 1, 'ascii');
}

/** Sorted USTAR, zero uid/gid/mtime, zero gzip mtime and fixed gzip OS. */
export function writeTarGz(files) {
  const blocks = [];
  for (const path of sorted(files.keys())) {
    safePath(path);
    let name = `package/${path}`, prefix = '';
    if (Buffer.byteLength(name) > 100) {
      const split = [...name.matchAll(/\//g)].map(match => match.index).reverse().find(i => Buffer.byteLength(name.slice(0, i)) <= 155 && Buffer.byteLength(name.slice(i + 1)) <= 100);
      if (split === undefined) fail(`Tar path too long for USTAR: ${path}`);
      prefix = name.slice(0, split);
      name = name.slice(split + 1);
    }
    const entry = files.get(path);
    if (!Buffer.isBuffer(entry?.data)) fail(`Tar data must be a Buffer: ${path}`);
    const header = Buffer.alloc(512);
    header.write(name, 0, 100, 'utf8');
    header.write(prefix, 345, 155, 'utf8');
    putOctal(header, 100, 8, entry.mode ?? 0o644);
    putOctal(header, 108, 8, 0);
    putOctal(header, 116, 8, 0);
    putOctal(header, 124, 12, entry.data.length);
    putOctal(header, 136, 12, 0);
    header.fill(32, 148, 156);
    header[156] = 48;
    header.write('ustar\0', 257, 6, 'ascii');
    header.write('00', 263, 2, 'ascii');
    const sum = header.reduce((total, byte) => total + byte, 0);
    header.write(`${sum.toString(8).padStart(6, '0')}\0 `, 148, 8, 'ascii');
    blocks.push(header, entry.data, Buffer.alloc((512 - entry.data.length % 512) % 512));
  }
  blocks.push(Buffer.alloc(1024));
  const archive = gzipSync(Buffer.concat(blocks), { level: 9, mtime: 0 });
  archive.fill(0, 4, 8);
  archive[9] = 255;
  return archive;
}
function required(files, path) {
  const data = files.get(path)?.data;
  if (!Buffer.isBuffer(data)) fail(`Missing base file: ${path}`);
  return data;
}
function validateSources(source) {
  if (!(source instanceof Map)) fail('sourceFiles must be a Map of paths to Buffers');
  for (const [path, data] of source) {
    if (!SOURCE_FILES.includes(path)) fail(`Extraneous source change: ${path}`);
    if (!Buffer.isBuffer(data)) fail(`Source must be a Buffer: ${path}`);
  }
  for (const path of SOURCE_FILES) if (!source.has(path)) fail(`Missing source file: ${path}`);
}
function addExport(exports, key, value) {
  if (Object.hasOwn(exports, key) && !isDeepStrictEqual(exports[key], value)) fail(`Conflicting base export: ${key}`);
  exports[key] = value;
}

/** Pure API. expectedFullFontSha256 is a tiny-fixture seam; CLI cannot override production SHA. */
export function createFontOverlay({ baseArchive, baseIntegrity, expectedVersion, sourceFiles, sourceCommit, expectedFullFontSha256 = FULL_FONT_SHA256 }) {
  if (!Buffer.isBuffer(baseArchive)) fail('baseArchive must be a Buffer');
  if (typeof baseIntegrity !== 'string' || !/^sha512-[A-Za-z0-9+/]{86}==$/.test(baseIntegrity)) fail('baseIntegrity must be one sha512 SRI value');
  const expected = Buffer.from(baseIntegrity.slice(7), 'base64'), actual = createHash('sha512').update(baseArchive).digest();
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) fail('Base SHA-512 integrity mismatch');
  if (!/^[0-9a-f]{40}(?:[0-9a-f]{24})?$/i.test(sourceCommit ?? '')) fail('sourceCommit must be full 40 or 64 hex');
  if (!/^[0-9a-f]{64}$/i.test(expectedFullFontSha256)) fail('Invalid expected full-font SHA-256');
  validateSources(sourceFiles);
  const source = sourceFiles, base = readTarGz(baseArchive);
  const manifest = JSON.parse(required(base, 'package.json').toString('utf8'));
  if (manifest.name !== '@devslab/site-kit' || !expectedVersion || manifest.version !== expectedVersion) fail(`Unexpected base package/version: ${manifest.name}@${manifest.version}`);
  for (const path of ['fonts-atomic.css', FULL_FONT_PATH, PROVENANCE]) if (base.has(path)) fail(`Base already contains overlay path: ${path}`);
  if (!required(base, 'fonts.css').equals(source.get('fonts.css'))) fail('Canonical legacy fonts.css differs byte-for-byte from base');
  required(base, 'src/core/fonts.mjs');
  required(base, 'src/core/fonts.d.mts');
  const fullFont = source.get(FULL_FONT_PATH);
  if (hash(fullFont) !== expectedFullFontSha256.toLowerCase()) fail('Full Pretendard SHA-256 mismatch');
  const baseFonts = JSON.parse(required(base, 'fonts/manifest.json').toString('utf8'));
  const canonical = JSON.parse(source.get('fonts/manifest.json').toString('utf8'));
  const families = canonical.families?.filter(f => f.family === 'Pretendard' && f.dir === 'pretendard');
  if (families?.length !== 1) fail('Source manifest must contain one Pretendard family');
  const atomicFace = families[0].atomicFace;
  if (!atomicFace || atomicFace.file !== 'PretendardVariable.woff2' || atomicFace.bytes !== fullFont.length || atomicFace.sha256 !== expectedFullFontSha256.toLowerCase() || atomicFace.sourcePath !== 'dist/web/variable/woff2/PretendardVariable.woff2') fail('atomicFace does not identify pinned full font');
  delete families[0].atomicFace;
  if (!isDeepStrictEqual(baseFonts, canonical)) fail('Source font manifest has extraneous changes outside Pretendard atomicFace');
  const family = baseFonts.families.find(f => f.family === 'Pretendard' && f.dir === 'pretendard');
  if (Object.hasOwn(family, 'atomicFace')) fail('Base manifest already has atomicFace');
  family.atomicFace = atomicFace;
  if (!manifest.exports || typeof manifest.exports !== 'object' || Array.isArray(manifest.exports) || !Array.isArray(manifest.files) || !Array.isArray(manifest.sideEffects)) fail('Unsupported base package manifest shape');
  addExport(manifest.exports, './fonts-atomic.css', './fonts-atomic.css');
  addExport(manifest.exports, './fonts', { types: './src/core/fonts.d.mts', import: './src/core/fonts.mjs' });
  for (const key of ['files', 'sideEffects']) {
    const value = key === 'files' ? 'fonts-atomic.css' : './fonts-atomic.css';
    if (!manifest[key].includes(value)) manifest[key].push(value);
  }
  const output = new Map([...base].map(([path, entry]) => [path, { data: Buffer.from(entry.data), mode: entry.mode }]));
  const put = (path, data) => output.set(path, { data, mode: base.get(path)?.mode ?? 0o644 });
  for (const path of SOURCE_FILES) if (path !== 'fonts.css' && path !== 'fonts/manifest.json') put(path, source.get(path));
  put('package.json', json(manifest));
  put('fonts/manifest.json', json(baseFonts));
  const patchFileSha256 = {};
  for (const path of sorted(MUTABLE)) if (output.has(path) && path !== PROVENANCE) patchFileSha256[path] = hash(output.get(path).data);
  const untouched = sorted(base.keys()).filter(path => !MUTABLE.has(path));
  const provenance = {
    schemaVersion: 1, kind: 'devslab-site-kit-atomic-font-overlay',
    base: { name: manifest.name, version: manifest.version, integrity: baseIntegrity, sha256: hash(baseArchive) },
    sourceCommit: sourceCommit.toLowerCase(), patchFileSha256, untouchedCount: untouched.length,
    untouchedManifestSha256: hash(Buffer.from(untouched.map(path => `${path}\0${hash(base.get(path).data)}\0${base.get(path).mode}\n`).join(''))),
  };
  put(PROVENANCE, json(provenance));
  const archive = writeTarGz(output), verified = readTarGz(archive);
  for (const [path, entry] of base) {
    const after = verified.get(path);
    if (!after || (!MUTABLE.has(path) && (!after.data.equals(entry.data) || after.mode !== entry.mode))) fail(`Untouched base file changed: ${path}`);
  }
  for (const path of verified.keys()) if (!base.has(path) && !MUTABLE.has(path)) fail(`Extraneous output file: ${path}`);
  const originalManifest = JSON.parse(base.get('package.json').data), finalManifest = JSON.parse(verified.get('package.json').data);
  for (const key of new Set([...Object.keys(originalManifest), ...Object.keys(finalManifest)])) if (!['exports', 'files', 'sideEffects'].includes(key) && !isDeepStrictEqual(originalManifest[key], finalManifest[key])) fail(`Base manifest field changed: ${key}`);
  return { archive, provenance };
}
function readRegular(path, boundary) {
  if (!lstatSync(path).isFile()) fail(`Not a regular source file: ${path}`);
  const actual = realpathSync(path);
  if (boundary) {
    const rel = relative(boundary, actual);
    if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) fail(`Source escapes sourceRoot: ${path}`);
  }
  return readFileSync(actual);
}
/** sourceRoot is a DDS repository root. Existing output paths are never overwritten. */
export function packFontOverlay({ sourceArchivePath, baseIntegrity, expectedVersion, sourceRoot, sourceCommit, outputPath }) {
  const root = realpathSync(resolve(sourceRoot));
  const source = new Map(SOURCE_FILES.map(path => [path, readRegular(join(root, 'packages', 'site-kit', path), root)]));
  const result = createFontOverlay({ baseArchive: readRegular(sourceArchivePath), baseIntegrity, expectedVersion, sourceFiles: source, sourceCommit });
  const expectedFilename = `${basename(sourceArchivePath).replace(/\.(?:tgz|tar\.gz)$/i, '')}-atomic-fonts.tgz`;
  if (basename(outputPath) !== expectedFilename) fail(`outputPath filename must be ${expectedFilename}`);
  const sidecarPath = `${outputPath}.json`;
  if (existsSync(outputPath) || existsSync(sidecarPath)) fail('Output archive or sidecar exists; refusing overwrite');
  const sidecar = { ...result.provenance, artifact: { filename: basename(outputPath), bytes: result.archive.length, sha256: hash(result.archive), integrity: `sha512-${hash(result.archive, 'sha512', 'base64')}` } };
  mkdirSync(dirname(resolve(outputPath)), { recursive: true });
  writeFileSync(outputPath, result.archive, { flag: 'wx' });
  writeFileSync(sidecarPath, json(sidecar), { flag: 'wx' });
  return { outputPath: resolve(outputPath), sidecarPath: resolve(sidecarPath), ...sidecar };
}
const USAGE = 'node pack-font-overlay.mjs --source-archive <base.tgz> --base-integrity <sha512-SRI> --expected-version <version> --source-root <DDS-root> --source-commit <full-SHA> --output-path <base-atomic-fonts.tgz>';
function cli(argv) {
  if (argv.length === 1 && argv[0] === '--help') { process.stdout.write(`${USAGE}\n`); return; }
  const keys = { '--source-archive': 'sourceArchivePath', '--base-integrity': 'baseIntegrity', '--expected-version': 'expectedVersion', '--source-root': 'sourceRoot', '--source-commit': 'sourceCommit', '--output-path': 'outputPath' }, options = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = keys[argv[i]];
    if (!key || options[key] !== undefined || !argv[i + 1] || argv[i + 1].startsWith('--')) fail(`Invalid argument: ${argv[i] ?? ''}\n${USAGE}`);
    options[key] = argv[i + 1];
  }
  for (const key of Object.values(keys)) if (!options[key]) fail(`Missing ${key}\n${USAGE}`);
  process.stdout.write(`${JSON.stringify(packFontOverlay(options), null, 2)}\n`);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { cli(process.argv.slice(2)); } catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
