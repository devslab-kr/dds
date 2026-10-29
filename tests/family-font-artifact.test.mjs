import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,existsSync,symlinkSync,cpSync}from'node:fs';
import {tmpdir}from'node:os';import{resolve,join,dirname,basename,sep}from'node:path';import{fileURLToPath}from'node:url';import{createHash}from'node:crypto';
import{buildFamilyFontArtifact}from'../packages/site-kit/scripts/build-family-font-artifact.mjs';
import{exportFamilyFonts}from'../packages/site-kit/src/family-fonts/export.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const sha=b=>createHash('sha256').update(b).digest('hex');
const bundle=buildFamilyFontArtifact({sourceRoot:root,sourceRef:'test-source'});
function fixture(t){const dir=mkdtempSync(join(tmpdir(),'dds-font-artifact-test-'));t.after(()=>{const checked=resolve(dir);if(!checked.startsWith(resolve(tmpdir())+sep)||!basename(checked).startsWith('dds-font-artifact-test-'))throw Error('Unexpected cleanup target');rmSync(checked,{recursive:true,force:true});});const pkg=join(dir,'package');for(const[file,entry]of bundle.files){const target=join(pkg,file);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,entry.data);}return{dir,pkg};}

test('private font bundle is reproducible, framework-free and describes every face and license',()=>{
 const again=buildFamilyFontArtifact({sourceRoot:root,sourceRef:'test-source'});assert.deepEqual(bundle.archive,again.archive);assert.equal(bundle.manifest.assets.length,12);assert.equal(bundle.manifest.licenses.length,3);
 const pkg=JSON.parse(bundle.files.get('package.json').data);assert.equal(pkg.private,true);assert.equal(pkg.name,'@devslab/family-fonts');assert.equal(pkg.dependencies,undefined);assert.equal(pkg.peerDependencies,undefined);assert.equal(pkg.scripts,undefined);
 const css=bundle.files.get('fonts.css').data.toString();assert.equal((css.match(/@font-face/g)||[]).length,12);assert.ok(css.includes('DDS Pretendard Atomic'));assert.ok(css.includes('--dds-font-family-mono:'));assert.ok(!/\bsrc\s*:[^;]*\blocal\s*\(/i.test(css));assert.ok(!/PretendardVariable\.subset/.test(css));
 for(const asset of bundle.manifest.assets){assert.equal(sha(bundle.files.get(asset.file).data),asset.sha256);assert.ok(css.includes('./'+asset.file));}
 const korean=bundle.manifest.assets.find(a=>a.id==='pretendard/PretendardVariable.woff2');assert.equal(korean.bytes,2057688);assert.equal(korean.sha256,'9599f12fd42fc0bce1cd50b47a0c022e108d7aa64dd0d1bb0ed44f3282d900b4');
 for(const license of bundle.manifest.licenses)assert.equal(sha(bundle.files.get(license.file).data),license.sha256);
});

test('static export uses the same CSS, complete hash-named assets, license and preload metadata',t=>{
 const{dir,pkg}=fixture(t),out=join(dir,'public/dds-fonts'),head=join(dir,'overrides/dds-fonts.html');const result=exportFamilyFonts({packageDir:pkg,outDir:out,baseURL:'/dds-fonts',headOutput:head,monospace:true});
 assert.equal(result.assetCount,12);assert.equal(result.links.length,4);assert.equal(result.cache.length,12);assert.deepEqual(readFileSync(join(out,'fonts.css')),bundle.files.get('fonts.css').data);
 for(const a of bundle.manifest.assets)assert.equal(sha(readFileSync(join(out,a.file))),a.sha256);
 const html=readFileSync(head,'utf8');for(const link of result.links)assert.ok(html.includes('href="'+link.href+'"'));assert.equal((html.match(/crossorigin="anonymous"/g)||[]).length,3);
 assert.ok(result.cache.every(x=>x.path.startsWith('/dds-fonts/fonts/')&&x.headers['Cache-Control'].includes('immutable')));
});

test('corrupted font or license aborts export before writing output',t=>{
 const{dir,pkg}=fixture(t),a=bundle.manifest.assets[0];writeFileSync(join(pkg,a.file),'corrupted');const out=join(dir,'not-written');assert.throws(()=>exportFamilyFonts({packageDir:pkg,outDir:out,baseURL:'/dds-fonts'}),/integrity failure/);assert.equal(existsSync(out),false);
 writeFileSync(join(pkg,a.file),bundle.files.get(a.file).data);writeFileSync(join(pkg,bundle.manifest.licenses[0].file),'corrupted license');assert.throws(()=>exportFamilyFonts({packageDir:pkg,outDir:out,baseURL:'/dds-fonts'}),/integrity failure/);assert.equal(existsSync(out),false);
});

test('static export rejects unsafe manifest destinations and external base URLs before output',t=>{
 const{dir,pkg}=fixture(t),out=join(dir,'not-written');assert.throws(()=>exportFamilyFonts({packageDir:pkg,outDir:out,baseURL:'https://foreign.test/fonts'}),/same-origin/);
 const manifest=structuredClone(bundle.manifest);manifest.licenses[0].file='../outside.txt';writeFileSync(join(pkg,'manifest.json'),JSON.stringify(manifest));assert.throws(()=>exportFamilyFonts({packageDir:pkg,outDir:out,baseURL:'/dds-fonts'}),/Invalid DDS artifact path|escapes/);assert.equal(existsSync(out),false);
});

test('reserved application routes reject static export before any output is written',t=>{
 const{dir,pkg}=fixture(t),out=join(dir,'not-written');
 assert.throws(()=>exportFamilyFonts({packageDir:pkg,outDir:out,baseURL:'/api'}),/known content-hashed/);
 assert.equal(existsSync(out),false);
});

test('static export rejects metadata symlinks before writing any asset or external target',t=>{
 for(const file of ['manifest.json','cache-descriptors.json']){
  const{dir,pkg}=fixture(t),out=join(dir,'export'),target=join(dir,'unrelated.json');mkdirSync(out);writeFileSync(target,'preserve');
  try{symlinkSync(target,join(out,file),'file');}catch(error){if(['EPERM','EACCES','ENOSYS'].includes(error.code)){t.skip('File symlinks unavailable here; covered on CI Linux');return;}throw error;}
  assert.throws(()=>exportFamilyFonts({packageDir:pkg,outDir:out,baseURL:'/dds-fonts'}),/symbolic-link/);
  assert.equal(readFileSync(target,'utf8'),'preserve');assert.equal(existsSync(join(out,bundle.manifest.assets[0].file)),false);
 }
});


test('DDS source text line endings do not change the pinned font distribution',t=>{
 const{dir}=fixture(t),copy=join(dir,'dds-source'),kit=join(copy,'packages/site-kit');mkdirSync(kit,{recursive:true});
 cpSync(join(root,'packages/site-kit/fonts'),join(kit,'fonts'),{recursive:true});
 for(const file of ['tokens/foundation.json','LICENSE','packages/site-kit/fonts-atomic.css','packages/site-kit/src/family-fonts/runtime.mjs','packages/site-kit/src/family-fonts/runtime.d.mts','packages/site-kit/src/family-fonts/export.mjs']){
  const dest=join(copy,file);mkdirSync(dirname(dest),{recursive:true});writeFileSync(dest,readFileSync(join(root,file),'utf8').replace(/\r?\n/g,'\r\n'));
 }
 const windows=buildFamilyFontArtifact({sourceRoot:copy,sourceRef:'test-source'});assert.deepEqual(windows.archive,bundle.archive);
 for(const file of ['runtime.mjs','runtime.d.mts','export.mjs','fonts.css','provenance/build-family-font-artifact.mjs'])assert.ok(!bundle.files.get(file).data.includes(13));
});
