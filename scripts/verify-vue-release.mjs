import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const mode = process.argv[2] ?? 'vue';
assert.ok(['vue', 'table-vue'].includes(mode));
const target = `dds-${mode}`;
const workspace = fileURLToPath(new URL('..', import.meta.url));
const temp = await mkdtemp(join(tmpdir(), `dds-${mode}-release-`));
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
  for (const directory of ['dds-tokens', 'dds-css', 'dds-icons', target]) {
    run(pnpm, [...pnpmPrefix, 'pack', '--pack-destination', temp], join(workspace, 'packages', directory));
    const manifest = JSON.parse(await readFile(join(workspace, 'packages', directory, 'package.json'), 'utf8'));
    tarballs.push(join(temp, `devslab-${directory}-${manifest.version}.tgz`));
  }
  const vueTarball = tarballs.at(-1);
  try { run(npm, [...npmPrefix, 'publish', vueTarball, '--dry-run', '--ignore-scripts', '--provenance=false', '--json'], workspace) }
  catch (error) {
    // A working-tree build can share the current registry version. Validate its
    // exact packed files and fresh consumer below; never actually republish it.
    if (!/cannot publish over the previously published versions/i.test(String(error))) throw error;
    console.log('Published version already exists; publish dry-run collision only.');
  }
  // npm publish JSON differs across npm majors; pack owns the file-list contract.
  const [report] = JSON.parse(run(npm, [...npmPrefix, 'pack', vueTarball, '--dry-run', '--ignore-scripts', '--json'], temp));
  const files = report.files.map(file => file.path);
  for (const file of ['LICENSE', 'dist/index.js', 'dist/index.d.ts', 'styles.css', ...(mode === 'vue' ? ['dist/date-only.js', 'dist/dds-vue.css'] : [])]) {
    assert.ok(files.includes(file), `${file} must be published`);
  }
  await writeFile(join(temp, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  run(npm, [...npmPrefix, 'install', '--ignore-scripts', '--no-audit', '--no-fund', ...tarballs, 'vue@3.5.39'], temp);
  run(process.execPath, ['--input-type=module', '--eval', mode === 'vue' ? `
    import assert from 'node:assert/strict';
    import { createSSRApp, h } from 'vue';
    import { renderToString } from 'vue/server-renderer';
    import { Input, DatePicker, Button, Icon } from '@devslab/dds-vue';
    import { validateDateInput } from '@devslab/dds-vue/date-only';
    assert.ok(Input && DatePicker && Button && Icon);
    assert.equal(validateDateInput('2026/10/22').value, '2026-10-22');
    const html = await renderToString(createSSRApp({ render: () => h(DatePicker, { label: 'Service date', modelValue: '2026-10-22' }) }));
    assert.ok(html.includes('2026/10/22'));
  ` : `
    import assert from 'node:assert/strict';
    import { createSSRApp, h } from 'vue';
    import { renderToString } from 'vue/server-renderer';
    import { DataTable, ddsGridTheme } from '@devslab/dds-table-vue';
    assert.ok(ddsGridTheme);
    const html = await renderToString(createSSRApp({ render: () => h(DataTable, { label: 'Orders', rows: [], columns: [] }) }));
    assert.ok(html.includes('aria-label="Orders"'));
    assert.ok(html.includes('aria-busy="true"'));
    assert.ok(!html.includes('ag-root-wrapper'));
  `], temp);
  const manifest = JSON.parse(await readFile(join(temp, 'node_modules/@devslab', target, 'package.json'), 'utf8'));
  assert.ok(!Object.keys({ ...manifest.dependencies, ...manifest.peerDependencies }).some(name => /react|solid/.test(name)));
  assert.ok((await readFile(join(temp, 'node_modules/@devslab/dds-css/dist/components/date-picker.css'), 'utf8')).includes('.dds-date-picker-content'));
  const exportedFiles = value => typeof value === 'string' ? [value] : Object.values(value ?? {}).flatMap(exportedFiles);
  for (const file of exportedFiles(manifest.exports)) await readFile(join(temp, 'node_modules/@devslab', target, file));
  if (mode === 'vue') {
    const visited = new Set();
    async function inspect(file) {
      if (visited.has(file)) return; visited.add(file);
      const source = await readFile(file, 'utf8');
      assert.doesNotMatch(source, /ag-grid|@tanstack|@ark-ui\/(?:react|solid)|from ["']react/);
      for (const match of source.matchAll(/(?:from\s*|import\s*)["'](\.[^"']+\.js)["']/g)) await inspect(resolve(dirname(file), match[1]));
    }
    await inspect(join(temp, 'node_modules/@devslab/dds-vue/dist/input.js'));
  }
  await writeFile(join(temp, 'consumer.vue'), mode === 'vue' ? `<script setup lang="ts">
import { ref } from 'vue'
import { Input, Field, Tabs, TabList, Tab, TabPanel, NumberInput, Combobox, Dialog } from '@devslab/dds-vue'
const text = ref(''); const tab = ref('one'); const number = ref<number | null>(1); const open = ref(false)
</script>
<template><Field label="Name" v-slot="{ control }"><input v-bind="control" /></Field><Input v-model="text" label="Name" /><NumberInput v-model="number" label="Quantity" /><Combobox v-model="text" label="Name" :items="[{value:'a',label:'A'}]" /><Tabs v-model="tab"><TabList><Tab value="one">One</Tab></TabList><TabPanel value="one">Content</TabPanel></Tabs><Dialog v-model:open="open" title="Confirm">Content</Dialog></template>` : `<script setup lang="ts">
import { DataTable, type DataTableRef } from '@devslab/dds-table-vue'
import type { ColDef } from 'ag-grid-community'
import { ref } from 'vue'
const rows = [{id:1}]; const columns: ColDef<{id:number}>[] = [{field:'id'}]
const grid = ref<DataTableRef<{id:number}> | null>(null)
</script>
<template><DataTable ref="grid" label="Orders" :rows="rows" :columns="columns" :grid-props="{getRowId:p=>String(p.data.id)}" /></template>`);
  await writeFile(join(temp, 'tsconfig.json'), JSON.stringify({ compilerOptions: {target:'ES2022',module:'ESNext',moduleResolution:'Bundler',strict:true,skipLibCheck:true,lib:['ESNext','DOM'],types:[]},vueCompilerOptions:{strictTemplates:true},include:['consumer.vue'] }));
  run(process.execPath, [join(workspace, 'packages/dds-vue/node_modules/vue-tsc/bin/vue-tsc.js'), '--noEmit', '-p', join(temp, 'tsconfig.json')], temp);
  console.log(`${target}: fresh Vue template typecheck passed`);
  console.log('DDS Vue release verified: packed exports/types/styles/license, publish dry-run, fresh Vue consumer, SSR and canonical date API; no React/Solid runtime.');
} finally {
  assert.equal(dirname(temp), resolve(tmpdir()), 'Only remove this gate’s generated temporary directory');
  assert.ok(basename(temp).startsWith(`dds-${mode}-release-`));
  await rm(temp, { recursive: true, force: true });
}
