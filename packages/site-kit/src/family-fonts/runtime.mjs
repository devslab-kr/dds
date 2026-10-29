/** Runtime-neutral DDS UI font policy. Asset data is generated from site-kit only. */
export const FAMILY_FONT_CACHE_CONTROL='public, max-age=31536000, immutable';
function formatOf(format='html'){if(format!=='html'&&format!=='react')throw new TypeError('Font link format must be html or react');return format;}
function originPath(value){if(typeof value!=='string'||!/^\/(?!\/)/.test(value)||/[\\\s<>"'?#%]/.test(value)||value.includes('//')||value.split('/').some(x=>x==='.'||x==='..'))throw new TypeError('Expected a same-origin absolute font path');return value;}
function basePath(value){return originPath(value).replace(/\/+$/,'');}
export function fontPreloadLinksFromUrls(hrefs,{format='html'}={}){
 formatOf(format);return hrefs.map(href=>{originPath(href);if(!href.endsWith('.woff2'))throw new TypeError('Font preload must reference WOFF2');return {rel:'preload',href,as:'font',type:'font/woff2',[format==='react'?'crossOrigin':'crossorigin']:'anonymous'};});
}
export function createFamilyFontAPI(manifest){
 if(manifest?.schemaVersion!==1||manifest.css?.file!=='fonts.css'||!Array.isArray(manifest.assets))throw new TypeError('Unsupported family font manifest');
 const byId=new Map(),names=new Set();
 for(const a of manifest.assets){if(!a.id||byId.has(a.id)||!/^fonts\/[A-Za-z0-9._-]+-[0-9a-f]{12}\.woff2$/.test(a.file)||names.has(a.file))throw new TypeError('Invalid or duplicate family font asset');byId.set(a.id,a);names.add(a.file);}
 const selected=monospace=>[...manifest.preload.default,...(monospace?manifest.preload.monospace:[])].map(id=>{const asset=byId.get(id);if(!asset)throw new TypeError('Unknown preload font '+id);return asset;});
 selected(true);
 const escape=value=>value.replace(/[.*+?^$()|[\]\\]/g,'\\$&');
 const patterns=manifest.assets.map(a=>new RegExp('^'+escape(a.file.split('/').at(-1).replace(/\.woff2$/,''))+'(?:-[A-Za-z0-9_-]{8,})?\\.woff2$'));
 function isFontPath(path){try{originPath(path);}catch{return false;}return /^\/assets\/[^/]+$/.test(path)&&patterns.some(re=>re.test(path.split('/').at(-1)));}
 function isStaticFontPath(path){try{originPath(path);}catch{return false;}if(/^\/(?:uploads|api|_serverFn)(?:\/|$)/.test(path))return false;return manifest.assets.some(asset=>path.endsWith('/'+asset.file));}
 function fontAssetHeaders(paths){return [...new Set(paths)].map(path=>{if(!isFontPath(path)&&!isStaticFontPath(path))throw new TypeError('Cache headers require a known content-hashed DDS WOFF2 path');return {path,headers:{'Cache-Control':FAMILY_FONT_CACHE_CONTROL}};});}
 function getFontHeadLinks(baseURL,{monospace=false,format='html'}={}){const base=basePath(baseURL);return [...fontPreloadLinksFromUrls(selected(monospace).map(a=>base+'/'+a.file),{format}),{rel:'stylesheet',href:base+'/'+manifest.css.file}];}
 function getFontAssetHeaders(baseURL){const base=basePath(baseURL);return fontAssetHeaders(manifest.assets.map(a=>base+'/'+a.file));}
 function isFamilyFontAssetRequest(request,{baseURL}={}){let path;try{path=new URL(request.url).pathname;}catch{return false;}const base=basePath(baseURL);return isStaticFontPath(path)&&['GET','HEAD'].includes(request.method)&&!request.headers.has('Authorization')&&!request.headers.has('Range')&&manifest.assets.some(a=>path===base+'/'+a.file);}
 function getBundleFontAssetHeaders(bundle){const assets=Object.values(bundle??{}).filter(a=>a?.type==='asset');const paths=assets.filter(a=>(a.names??(a.name?[a.name]:[])).some(n=>manifest.assets.some(font=>n.split(/[\\/]/).at(-1)===font.file.split('/').at(-1)))).map(a=>'/'+a.fileName);return fontAssetHeaders(paths);}
 function withFamilyFontCache(request,response){
  let path;try{path=new URL(request.url).pathname;}catch{return response;}
  if(!['GET','HEAD'].includes(request.method)||!isFontPath(path)||![200,304].includes(response.status)||!/^font\/woff2(?:\s*;|$)/i.test(response.headers.get('Content-Type')??'')||request.headers.has('Authorization')||request.headers.has('Range')||response.headers.has('Set-Cookie')||/\b(?:private|no-store)\b/i.test(response.headers.get('Cache-Control')??''))return response;
  const headers=new Headers(response.headers);headers.set('Cache-Control',FAMILY_FONT_CACHE_CONTROL);return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
 }
 function getBundleFontPreloadLinks(bundle,{monospace=false,format='html'}={}){
  const assets=Object.values(bundle??{}).filter(a=>a?.type==='asset');
  const urls=selected(monospace).map(font=>{const name=font.file.split('/').at(-1);const matches=assets.filter(a=>(a.names??(a.name?[a.name]:[])).some(n=>n.split(/[\\/]/).at(-1)===name));if(matches.length!==1)throw new Error('DDS font preload must resolve one emitted asset: '+name);const file=matches[0].fileName;if(typeof file!=='string'||file.startsWith('/'))throw new TypeError('Expected relative emitted font fileName');return '/'+file;});
  return fontPreloadLinksFromUrls(urls,{format});
 }
 return {fontManifest:manifest,getFontHeadLinks,getFontAssetHeaders,fontAssetHeaders,withFamilyFontCache,getBundleFontPreloadLinks,getBundleFontAssetHeaders,isFamilyFontAssetRequest};
}
