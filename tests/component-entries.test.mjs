import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const read=async path=>JSON.parse(await readFile(new URL(`../${path}`,import.meta.url),'utf8'));
const paths=['input','combobox','select-picker','dropdown-menu','popover','calendar','date-picker'];
// Solid-only until React parity lands (DDS 0.24 date additions).
const solidOnlyPaths=['date-range-picker','month-picker'];
for(const framework of ['solid','react']) test(`${framework} component subpaths ship declarations and runtime modules`,async()=>{
 const manifest=await read(`packages/dds-${framework}/package.json`);
 for(const subpath of framework==='solid'?[...paths,...solidOnlyPaths]:paths){
  const entry=manifest.exports[`./${subpath}`];
  assert.ok(entry,`${subpath} is a documented public entry`);
  const outputs=new Set(Object.values(entry));
  for(const output of outputs) await access(new URL(`../packages/dds-${framework}/${output}`,import.meta.url));
 }
});
for(const framework of ['solid','react']) test(`${framework} Input entry excludes virtualizers, grids and the other framework`,async()=>{
 const manifest=await read(`packages/dds-${framework}/package.json`);
 const entry=manifest.exports['./input'].browser??manifest.exports['./input'].import;
 const first=fileURLToPath(new URL(`../packages/dds-${framework}/${entry}`,import.meta.url));
 const visited=new Set();
 async function visit(file){
  if(visited.has(file))return;visited.add(file);
  const source=await readFile(file,'utf8');
  assert.doesNotMatch(source,/@tanstack\/(?:react|solid)-virtual|ag-grid/);
  assert.doesNotMatch(source,framework==='react'?/["']solid-js(?:\/|["'])/:/["']react(?:-dom)?(?:\/|["'])/);
  for(const match of source.matchAll(/(?:from\s*|import\s*)["'](\.[^"']+\.js)["']/g))await visit(resolve(dirname(file),match[1]));
 }
 await visit(first);
});
test('Solid table has an explicit framework name and the legacy package delegates to it',async()=>{
 const current=await read('packages/dds-table-solid/package.json');
 const legacy=await read('packages/dds-table/package.json');
 assert.equal(current.name,'@devslab/dds-table-solid');
 assert.equal(legacy.dependencies[current.name],`workspace:${current.version}`);
 assert.equal(legacy.version,current.version);
 const source=await readFile(new URL('../packages/dds-table/src/index.ts',import.meta.url),'utf8');
 assert.match(source,/export \* from ["']@devslab\/dds-table-solid["']/);
});
