#!/usr/bin/env node
/** Static materialization of the same DDS manifest; output files are generated, never a new source. */
import {readFileSync,writeFileSync,mkdirSync,lstatSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,resolve,join,relative,isAbsolute,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createFamilyFontAPI} from './runtime.mjs';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function within(root,file){if(typeof file!=='string'||/[\\\x00-\x1f:]/.test(file)||file.split('/').some(p=>!p||p==='.'||p==='..'))throw Error('Invalid DDS artifact path');const dest=resolve(root,file),rel=relative(root,dest);if(!rel||rel==='..'||rel.startsWith('..'+sep)||isAbsolute(rel))throw Error('DDS asset escapes destination');return dest;}
function noLinks(file){let current=resolve(file);while(true){if(existsSync(current)&&lstatSync(current).isSymbolicLink())throw Error('DDS export rejects symbolic-link paths');const parent=dirname(current);if(parent===current)break;current=parent;}}
export function exportFamilyFonts({packageDir=dirname(fileURLToPath(import.meta.url)),outDir,baseURL,headOutput,monospace=false}){
 if(!outDir||!baseURL)throw Error('Expected outDir and baseURL');
 const root=resolve(packageDir),output=resolve(outDir),manifest=JSON.parse(readFileSync(join(root,'manifest.json'),'utf8')),api=createFamilyFontAPI(manifest);
 const links=api.getFontHeadLinks(baseURL,{monospace,format:'html'}),cache=api.getFontAssetHeaders(baseURL);
 const records=[manifest.css,...manifest.assets,...manifest.licenses];const verified=[];
 for(const record of records){const source=within(root,record.file);noLinks(source);const data=readFileSync(source);if(!Number.isSafeInteger(record.bytes)||data.length!==record.bytes||sha(data)!==record.sha256)throw Error('DDS export integrity failure: '+record.file);const target=within(output,record.file);noLinks(target);verified.push({target,data});}
 noLinks(output);for(const file of ['manifest.json','cache-descriptors.json'])noLinks(join(output,file));if(headOutput)noLinks(resolve(headOutput));
 for(const item of verified){mkdirSync(dirname(item.target),{recursive:true});writeFileSync(item.target,item.data);}
 mkdirSync(output,{recursive:true});writeFileSync(join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 writeFileSync(join(output,'cache-descriptors.json'),JSON.stringify(cache,null,2)+'\n');
 const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
 const head=links.map(attrs=>'<link '+Object.entries(attrs).map(([k,v])=>k+'="'+escape(v)+'"').join(' ')+'>').join('\n')+'\n';
 if(headOutput){mkdirSync(dirname(resolve(headOutput)),{recursive:true});writeFileSync(resolve(headOutput),head);}
 return {source:manifest.source,manifestPath:join(output,'manifest.json'),cssPath:join(output,manifest.css.file),assetCount:manifest.assets.length,licenseCount:manifest.licenses.length,links,cache};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const options={};const names={'--out-dir':'outDir','--base-url':'baseURL','--head-output':'headOutput','--package-dir':'packageDir'};for(let i=2;i<process.argv.length;i++){if(process.argv[i]==='--monospace'){options.monospace=true;continue;}const key=names[process.argv[i]];if(!key||!process.argv[i+1]||options[key])throw Error('Unknown or duplicate font export option');options[key]=process.argv[++i];}console.log(JSON.stringify(exportFamilyFonts(options),null,2));}catch(e){console.error(e.message);process.exitCode=1;}
}

