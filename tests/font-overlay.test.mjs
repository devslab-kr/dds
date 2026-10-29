import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';
import { createFontOverlay, readTarGz, writeTarGz, FULL_FONT_PATH, FULL_FONT_SHA256 } from '../scripts/pack-font-overlay.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const sri = bytes => `sha512-${createHash('sha512').update(bytes).digest('base64')}`;
const json = value => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
const entry = (data, mode = 0o644) => ({ data: Buffer.isBuffer(data) ? data : Buffer.from(data), mode });
const font = Buffer.from('wOF2 tiny unmodified upstream fixture bytes');
function fixture(version = '0.21.0') {
  const manifest = {
    name: '@devslab/site-kit', version, type: 'module',
    dependencies: { '@devslab/dds-solid': version, 'custom-vendor-only': '2.3.4' },
    peerDependencies: { 'solid-js': '1.9.15', react: '^18.0.0' },
    peerDependenciesMeta: { react: { optional: true } },
    exports: { '.': './src/core/index.mjs', './react-chrome': { import: './dist/react-chrome.js', types: './dist/react-chrome.d.ts' }, './fonts.css': './fonts.css', './fonts/*': './fonts/*' },
    files: ['dist', 'fonts', 'src/core', 'fonts.css'], sideEffects: ['./fonts.css'],
    customVendor: { preserve: ['react-chrome', 'auth-shell'], setting: false },
  };
  const fonts = { generatedBy: 'pinned-upstream-vendor', families: [
    { family: 'Geist', dir: 'geist', weight: '100 900', source: { version: '5.3.0' }, faces: [{ file: 'latin.woff2', bytes: 12, sha256: 'unchanged', unicodeRange: 'U+0-FF' }] },
    { family: 'Pretendard', dir: 'pretendard', weight: '45 920', source: { package: 'pretendard', version: '1.3.9', integrity: 'upstream-integrity' }, license: { file: 'LICENSE.txt', sha256: 'license-digest' }, faces: [{ file: 'subset.woff2', bytes: 8, sha256: 'legacy-digest', unicodeRange: 'U+AC00' }] },
  ] };
  const base = new Map([
    ['package.json', entry(json(manifest))], ['fonts.css', entry('/* legacy stylesheet byte-for-byte */\r\n')],
    ['fonts/manifest.json', entry(json(fonts))], ['src/core/fonts.mjs', entry('export const legacy = true;\n')],
    ['src/core/fonts.d.mts', entry('export declare const legacy: true;\n')],
    ['dist/react-chrome.js', entry(Buffer.from([0, 255, 10, 13, 39, 96, 128]), 0o755)],
    ['dist/react-chrome.d.ts', entry('export declare const Chrome: unknown;\r\n')],
    ['fonts/pretendard/subset.woff2', entry(Buffer.from([119, 79, 70, 50, 0, 250, 2, 7]))],
    ['fonts/pretendard/LICENSE.txt', entry('Upstream license preserved.\n')],
  ]);
  const canonical = structuredClone(fonts);
  canonical.families[1].atomicFace = { file: 'PretendardVariable.woff2', bytes: font.length, sha256: hash(font), sourcePath: 'dist/web/variable/woff2/PretendardVariable.woff2' };
  const sourceFiles = new Map([
    ['fonts.css', Buffer.from(base.get('fonts.css').data)], ['fonts/manifest.json', json(canonical)],
    ['fonts-atomic.css', Buffer.from('@font-face { font-family: "Pretendard"; font-display: optional; src: url("./fonts/pretendard/PretendardVariable.woff2") format("woff2"); }\n')],
    ['src/core/fonts.mjs', Buffer.from('export const legacy = true;\nexport const atomic = true;\n')],
    ['src/core/fonts.d.mts', Buffer.from('export declare const legacy: true;\nexport declare const atomic: true;\n')],
    [FULL_FONT_PATH, font],
  ]);
  const baseArchive = writeTarGz(base);
  return { base, manifest, fonts, options: { baseArchive, baseIntegrity: sri(baseArchive), expectedVersion: version, sourceFiles, sourceCommit: 'a'.repeat(40), expectedFullFontSha256: hash(font) } };
}
function mutateHeader(archive, change, updateChecksum = true) {
  const tar = gunzipSync(archive);
  change(tar.subarray(0, 512));
  if (updateChecksum) {
    tar.fill(32, 148, 156);
    const checksum = tar.subarray(0, 512).reduce((sum, byte) => sum + byte, 0);
    tar.write(`${checksum.toString(8).padStart(6, '0')}\0 `, 148, 8, 'ascii');
  }
  return gzipSync(tar);
}

for (const version of ['0.29.0', '0.21.2', '0.21.0']) test(`preserves ${version} package, custom vendor exports and every untouched file`, () => {
  const { base, manifest, fonts, options } = fixture(version);
  const { archive, provenance } = createFontOverlay(options), files = readTarGz(archive);
  const finalManifest = JSON.parse(files.get('package.json').data);
  for (const key of Object.keys(manifest)) if (!['exports', 'files', 'sideEffects'].includes(key)) assert.deepEqual(finalManifest[key], manifest[key]);
  for (const [key, value] of Object.entries(manifest.exports)) assert.deepEqual(finalManifest.exports[key], value);
  assert.deepEqual(finalManifest.exports['./fonts'], { types: './src/core/fonts.d.mts', import: './src/core/fonts.mjs' });
  assert.equal(finalManifest.exports['./fonts-atomic.css'], './fonts-atomic.css');
  assert.deepEqual(finalManifest.files, [...manifest.files, 'fonts-atomic.css']);
  assert.deepEqual(finalManifest.sideEffects, [...manifest.sideEffects, './fonts-atomic.css']);
  const changed = new Set(['package.json', 'fonts/manifest.json', 'src/core/fonts.mjs', 'src/core/fonts.d.mts']);
  for (const [path, before] of base) if (!changed.has(path)) {
    assert.equal(hash(files.get(path).data), hash(before.data), path);
    assert.equal(files.get(path).mode, before.mode, `${path} mode`);
  }
  const afterFonts = JSON.parse(files.get('fonts/manifest.json').data);
  assert.deepEqual(afterFonts.families[0], fonts.families[0]);
  delete afterFonts.families[1].atomicFace;
  assert.deepEqual(afterFonts, fonts);
  assert.deepEqual(JSON.parse(files.get('fonts/atomic-overlay.json').data), provenance);
  assert.equal(provenance.base.version, version);
  assert.equal(provenance.base.integrity, options.baseIntegrity);
  assert.equal(provenance.base.sha256, hash(options.baseArchive));
  assert.equal(provenance.sourceCommit, options.sourceCommit);
  assert.equal(provenance.untouchedCount, base.size - changed.size);
  for (const [path, digest] of Object.entries(provenance.patchFileSha256)) assert.equal(hash(files.get(path).data), digest);
  assert.equal(files.size, base.size + 3);
});

test('deterministic bytes, sorted entries, zero tar and gzip mtime', () => {
  const { options } = fixture();
  const first = createFontOverlay(options), second = createFontOverlay({ ...options, sourceFiles: new Map([...options.sourceFiles].reverse()) });
  assert.deepEqual(first.archive, second.archive);
  assert.deepEqual(first.provenance, second.provenance);
  assert.equal(first.archive.readUInt32LE(4), 0);
  const tar = gunzipSync(first.archive), paths = [];
  for (let offset = 0; tar[offset] !== 0;) {
    const h = tar.subarray(offset, offset + 512);
    paths.push(h.subarray(0, 100).toString().replace(/\0.*$/s, ''));
    assert.equal(Number.parseInt(h.subarray(136, 148).toString().replace(/\0.*$/s, ''), 8), 0);
    const size = Number.parseInt(h.subarray(124, 136).toString().replace(/\0.*$/s, ''), 8);
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  assert.deepEqual(paths, [...paths].sort());
});

test('base integrity and expected package version are enforced before overlay', () => {
  const { options } = fixture();
  assert.throws(() => createFontOverlay({ ...options, baseIntegrity: `sha512-${Buffer.alloc(64).toString('base64')}` }), /integrity mismatch/);
  assert.throws(() => createFontOverlay({ ...options, baseIntegrity: 'sha256-not-sha512' }), /sha512 SRI/);
  assert.throws(() => createFontOverlay({ ...options, expectedVersion: '9.9.9' }), /Unexpected base package\/version/);
  assert.throws(() => createFontOverlay({ ...options, expectedFullFontSha256: FULL_FONT_SHA256 }), /Full Pretendard SHA-256 mismatch/);
});

test('legacy CSS, source whitelist, and non-atomic manifest mutations are rejected', () => {
  const { options } = fixture();
  assert.throws(() => createFontOverlay({ ...options, sourceFiles: new Map([...options.sourceFiles, ['dist/react-chrome.js', Buffer.from('changed')]]) }), /Extraneous source change/);
  const css = new Map(options.sourceFiles); css.set('fonts.css', Buffer.from('changed legacy css'));
  assert.throws(() => createFontOverlay({ ...options, sourceFiles: css }), /legacy fonts.css differs byte-for-byte/);
  const manifest = JSON.parse(options.sourceFiles.get('fonts/manifest.json'));
  manifest.families[0].weight = '999';
  const modified = new Map(options.sourceFiles); modified.set('fonts/manifest.json', json(manifest));
  assert.throws(() => createFontOverlay({ ...options, sourceFiles: modified }), /extraneous changes outside/);
});

test('path traversal, absolute paths, Windows aliases and outside-package paths are rejected', () => {
  const { options } = fixture();
  for (const name of ['package/../escape', '/absolute', 'package/a\\b', 'package/C:evil', 'not-package/file', 'package/a/../b', 'package/alias.']) {
    const bad = mutateHeader(options.baseArchive, header => { header.fill(0, 0, 100); header.write(name, 0, 'utf8'); });
    assert.throws(() => readTarGz(bad), /Unsafe tar path|outside package/, name);
  }
});

test('symlinks, hardlinks, device and unknown tar entry types are rejected', () => {
  const { options } = fixture();
  for (const type of ['1', '2', '3', '4', '6', 'S', 'z']) {
    const bad = mutateHeader(options.baseArchive, header => { header[156] = type.charCodeAt(0); });
    assert.throws(() => readTarGz(bad), /Unsupported tar entry type/, type);
  }
});

test('checksum corruption and duplicate paths are rejected', () => {
  const { options } = fixture();
  const corrupted = mutateHeader(options.baseArchive, header => { header[0] ^= 1; }, false);
  assert.throws(() => readTarGz(corrupted), /checksum mismatch/);
  const tar = gunzipSync(options.baseArchive);
  const size = Number.parseInt(tar.subarray(124, 136).toString().replace(/\0.*$/s, ''), 8);
  const firstLength = 512 + Math.ceil(size / 512) * 512;
  const duplicated = gzipSync(Buffer.concat([tar.subarray(0, firstLength), tar]));
  assert.throws(() => readTarGz(duplicated), /Duplicate tar path/);
});

test('USTAR prefix paths round-trip without changing binary content', () => {
  const path = `${'directory/'.repeat(13)}file.bin`;
  const bytes = Buffer.from([0, 13, 10, 255, 128]);
  const archive = writeTarGz(new Map([[path, entry(bytes, 0o755)]]));
  assert.deepEqual(readTarGz(archive).get(path), entry(bytes, 0o755));
});
