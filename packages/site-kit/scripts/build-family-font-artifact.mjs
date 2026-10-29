/** DDS-owned offline distribution. No registry publication or framework dependencies. */
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {dirname,join,resolve,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {writeTarGz} from '../../../scripts/pack-font-overlay.mjs';
import {FAMILY_FONT_CACHE_CONTROL} from '../src/family-fonts/runtime.mjs';

const defaultRoot=resolve(dirname(fileURLToPath(import.meta.url)),'../../..');
const hash=(bytes,algo='sha256',encoding='hex')=>createHash(algo).update(bytes).digest(encoding);
const json=x=>Buffer.from(JSON.stringify(x,null,2)+'\n');
const apiNames=['fontManifest','getFontHeadLinks','getFontAssetHeaders','fontAssetHeaders','withFamilyFontCache','getBundleFontPreloadLinks','getBundleFontAssetHeaders','isFamilyFontAssetRequest'];

export function buildFamilyFontArtifact({sourceRoot=defaultRoot,sourceRef='working-tree'}={}){
 if(!/^[A-Za-z0-9._+-]{1,100}$/.test(sourceRef))throw Error('Invalid DDS source reference');
 const kit=join(sourceRoot,'packages/site-kit'),legacy=JSON.parse(readFileSync(join(kit,'fonts/manifest.json'),'utf8'));
 const tokens=JSON.parse(readFileSync(join(sourceRoot,'tokens/foundation.json'),'utf8'));
 const originalCss=readFileSync(join(kit,'fonts-atomic.css'),'utf8');
 const sources=new Map(legacy.families.map(f=>[f.dir,f]));
 const assets=[],licenses=[],files=new Map(),urlMap=new Map();
 const put=(file,data,mode=0o644)=>files.set(file,{data:Buffer.isBuffer(data)?data:Buffer.from(data),mode});
 for(const match of originalCss.matchAll(/url\("\.\/fonts\/([a-z0-9-]+)\/([^"/]+\.woff2)"\)/g)){
  const [url,dir,name]=match,family=sources.get(dir);if(!family)throw Error('Unknown DDS font family '+dir);
  const face=[...family.faces,...(family.atomicFace?[family.atomicFace]:[])].find(x=>x.file===name);
  if(!face)throw Error('Font absent from DDS source manifest '+name);
  const bytes=readFileSync(join(kit,'fonts',dir,name)),sha256=hash(bytes);
  if(sha256!==face.sha256||bytes.length!==face.bytes)throw Error('DDS font integrity mismatch '+name);
  const file='fonts/'+dir+'-'+basename(name,'.woff2')+'-'+sha256.slice(0,12)+'.woff2',id=dir+'/'+name;
  if(!assets.some(a=>a.id===id)){assets.push({id,file,family:family.family,bytes:bytes.length,sha256,license:'OFL-1.1',source:family.source});put(file,bytes);}
  urlMap.set(url,'url("./'+file+'")');
 }
 if(assets.length!==12)throw Error('Expected the complete DDS atomic twelve-face bundle');
 for(const [dir,family]of sources){
  const bytes=readFileSync(join(kit,'fonts',dir,family.license.file)),sha256=hash(bytes);
  if(sha256!==family.license.sha256)throw Error('DDS license integrity mismatch '+dir);
  const file='licenses/'+dir+'.txt';licenses.push({family:family.family,file,bytes:bytes.length,sha256,license:family.source.license});put(file,bytes);
 }
 let css=originalCss.replace(/url\("\.\/fonts\/([a-z0-9-]+)\/([^"/]+\.woff2)"\)/g,url=>urlMap.get(url));
 css=css.replace(':root {',':root {\n  --dds-font-family-mono: '+tokens.font.family.mono.$value+';');
 if(/\bsrc\s*:[^;]*\blocal\s*\(/i.test(css)||/PretendardVariable\.subset/.test(css))throw Error('Unexpected local or split Korean source');
 put('fonts.css',css);
 for(const file of ['runtime.mjs','runtime.d.mts','export.mjs'])put(file,readFileSync(join(kit,'src/family-fonts',file)),file==='export.mjs'?0o755:0o644);
 put('provenance/build-family-font-artifact.mjs',readFileSync(fileURLToPath(import.meta.url)));
 const rootLicense=join(sourceRoot,'LICENSE');if(existsSync(rootLicense))put('LICENSE',readFileSync(rootLicense));
 const sourceDigest=hash(Buffer.concat([...files].sort(([a],[b])=>a.localeCompare(b)).flatMap(([name,entry])=>[Buffer.from(name+'\0'),entry.data])));
 const manifest={schemaVersion:1,source:{repository:'https://github.com/devslab-kr/dds',ref:sourceRef,contentSha256:sourceDigest},css:{file:'fonts.css',bytes:Buffer.byteLength(css),sha256:hash(css)},tokens:{sans:css.match(/--dds-font-family-sans:\s*([^;]+);/)[1],mono:tokens.font.family.mono.$value},assets,licenses,preload:{default:['geist/geist-latin-wght-normal.woff2','pretendard/PretendardVariable.woff2'],monospace:['geist-mono/geist-mono-latin-wght-normal.woff2']},cache:{control:FAMILY_FONT_CACHE_CONTROL,scope:'Exact known content-hashed public WOFF2 paths only; host adapter preserves private/error responses'}};
 put('manifest.json',json(manifest));put('manifest.mjs','export default '+JSON.stringify(manifest,null,2)+';\n');
 put('index.mjs',"import manifest from './manifest.mjs';\nimport {createFamilyFontAPI} from './runtime.mjs';\nexport {FAMILY_FONT_CACHE_CONTROL} from './runtime.mjs';\nexport const {"+apiNames.join(',')+"}=createFamilyFontAPI(manifest);\n");
 put('index.d.mts',"import {createFamilyFontAPI} from './runtime.mjs';\nexport {FAMILY_FONT_CACHE_CONTROL} from './runtime.mjs';\ndeclare const api:ReturnType<typeof createFamilyFontAPI>;\n"+apiNames.map(k=>'export declare const '+k+':typeof api.'+k+';').join('\n')+'\n');
 const chosen=[...manifest.preload.default,...manifest.preload.monospace].map(id=>assets.find(a=>a.id===id));
 put('vite-entry.mjs',chosen.map((a,i)=>'import font'+i+' from '+JSON.stringify('./'+a.file+'?url')+';').join('\n')+"\nimport manifest from './manifest.mjs';\nimport {fontPreloadLinksFromUrls} from './runtime.mjs';\nconst urls={"+chosen.map((a,i)=>JSON.stringify(a.id)+':font'+i).join(',')+"};\nexport function getFontPreloadLinks({monospace=false,format='html'}={}){return fontPreloadLinksFromUrls([...manifest.preload.default,...(monospace?manifest.preload.monospace:[])].map(id=>urls[id]),{format});}\n");
 put('vite-entry.d.mts',"import type {FontLink,FontOptions} from './runtime.mjs';\nexport declare function getFontPreloadLinks(options?:FontOptions):FontLink[];\n");
 put('README.md','# DDS family fonts\n\nPrivate generated font-only distribution from DDS. Do not edit consumer copies. Regenerate from the DDS source reference and verify the archive SRI. No framework, runtime dependency, lifecycle hook, or npm publication.\n\nUse fonts.css and the Vite entry in bundled apps. Run `node export.mjs --out-dir DIR --base-url /PREFIX --head-output FILE [--monospace]` for static/Next/MkDocs. Source provenance, face SHA256, licenses, and preload information are in manifest.json.\n');
 put('package.json',json({name:'@devslab/family-fonts',version:'0.0.0-dds.'+sourceDigest.slice(0,12),private:true,type:'module',description:'DDS generated framework-free family font distribution',exports:{'.':{types:'./index.d.mts',import:'./index.mjs',default:'./index.mjs'},'./vite':{types:'./vite-entry.d.mts',import:'./vite-entry.mjs'},'./vite-entry':{types:'./vite-entry.d.mts',import:'./vite-entry.mjs'},'./fonts.css':'./fonts.css','./manifest.json':'./manifest.json','./export.mjs':'./export.mjs','./package.json':'./package.json'}}));
 const archive=writeTarGz(files),sha256=hash(archive),filename='devslab-family-fonts-'+sha256.slice(0,12)+'.tgz';
 return {archive,files,manifest,metadata:{schemaVersion:1,name:'@devslab/family-fonts',filename,bytes:archive.length,sha256,integrity:'sha512-'+hash(archive,'sha512','base64'),source:manifest.source,assetCount:assets.length,licenseCount:licenses.length}};
}
export function writeFamilyFontArtifact(options){const {outputDir,...build}=options;const result=buildFamilyFontArtifact(build);mkdirSync(outputDir,{recursive:true});const outputPath=join(outputDir,result.metadata.filename);if(existsSync(outputPath)&&!readFileSync(outputPath).equals(result.archive))throw Error('Refusing artifact overwrite');if(!existsSync(outputPath))writeFileSync(outputPath,result.archive,{flag:'wx'});writeFileSync(outputPath+'.json',json(result.metadata));return{...result.metadata,outputPath};}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const options={};const fields={'--source-root':'sourceRoot','--source-ref':'sourceRef','--output-dir':'outputDir'};for(let i=2;i<process.argv.length;i+=2){const key=fields[process.argv[i]];if(!key||!process.argv[i+1]||options[key])throw Error('Expected --source-root, --source-ref and --output-dir');options[key]=process.argv[i+1];}if(!options.outputDir)throw Error('Missing --output-dir');console.log(JSON.stringify(writeFamilyFontArtifact(options),null,2));}catch(e){console.error(e.message);process.exitCode=1;}
}
