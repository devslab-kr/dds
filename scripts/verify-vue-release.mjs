import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const workspace = fileURLToPath(new URL('..', import.meta.url));
const temp = await mkdtemp(join(tmpdir(), 'dds-vue-release-'));
const npm = process.platform === 'win32' ? process.execPath : 'npm';
const npmPrefix = process.platform === 'win32' ? [join(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js')] : [];
const pnpmPath = process.env.npm_execpath;
assert.ok(pnpmPath, 'Run this gate with pnpm run verify:vue:release');
const pnpmIsScript = /\.[cm]?js$/.test(pnpmPath);
const pnpm = pnpmIsScript ? process.execPath : pnpmPath;
const pnpmPrefix = pnpmIsScript ? [pnpmPath] : [];
function run(command, args, cwd) {
  const env = { ...process.env, NPM_CONFIG_REGISTRY: 'https://registry.npmjs.org' };
  delete env.NODE_AUTH_TOKEN;
  delete env.NPM_TOKEN;
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', env });
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stdout}\n${result.stderr}`);
  return result.stdout;
}
try {
  for (const file of ['packages/dds-tokens/build.mjs', 'packages/dds-css/build.mjs', 'packages/dds-icons/build.mjs']) {
    run(process.execPath, [join(workspace, file)], workspace);
  }
  const tarballs = [];
  for (const directory of ['dds-tokens', 'dds-css', 'dds-icons', 'dds-vue']) {
    run(pnpm, [...pnpmPrefix, 'pack', '--pack-destination', temp], join(workspace, 'packages', directory));
    const manifest = JSON.parse(await readFile(join(workspace, 'packages', directory, 'package.json'), 'utf8'));
    tarballs.push(join(temp, `devslab-${directory}-${manifest.version}.tgz`));
  }
  const vueTarball = tarballs.at(-1);
  const report = JSON.parse(run(npm, [...npmPrefix, 'publish', vueTarball, '--dry-run', '--ignore-scripts', '--provenance=false', '--json'], workspace));
  const files = report.files.map(file => file.path);
  for (const file of ['LICENSE', 'dist/index.js', 'dist/index.d.ts', 'dist/date-only.js', 'dist/dds-vue.css', 'styles.css']) {
    assert.ok(files.includes(file), `${file} must be published`);
  }
  await writeFile(join(temp, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  run(npm, [...npmPrefix, 'install', '--ignore-scripts', '--no-audit', '--no-fund', ...tarballs, 'vue@3.5.39'], temp);
  run(process.execPath, ['--input-type=module', '--eval', `
    import assert from 'node:assert/strict';
    import { createSSRApp, h } from 'vue';
    import { renderToString } from 'vue/server-renderer';
    import { Input, DatePicker, Button, Icon } from '@devslab/dds-vue';
    import { validateDateInput } from '@devslab/dds-vue/date-only';
    assert.ok(Input && DatePicker && Button && Icon);
    assert.equal(validateDateInput('2026/10/22').value, '2026-10-22');
    const html = await renderToString(createSSRApp({ render: () => h(DatePicker, { label: 'Service date', modelValue: '2026-10-22' }) }));
    assert.ok(html.includes('2026/10/22'));
  `], temp);
  const manifest = JSON.parse(await readFile(join(temp, 'node_modules/@devslab/dds-vue/package.json'), 'utf8'));
  assert.ok(!Object.keys({ ...manifest.dependencies, ...manifest.peerDependencies }).some(name => /react|solid/.test(name)));
  assert.ok((await readFile(join(temp, 'node_modules/@devslab/dds-css/dist/components/date-picker.css'), 'utf8')).includes('.dds-date-picker-content'));
  console.log('DDS Vue release verified: packed exports/types/styles/license, publish dry-run, fresh Vue consumer, SSR and canonical date API; no React/Solid runtime.');
} finally {
  assert.equal(dirname(temp), resolve(tmpdir()), 'Only remove this gate’s generated temporary directory');
  assert.ok(basename(temp).startsWith('dds-vue-release-'));
  await rm(temp, { recursive: true, force: true });
}
