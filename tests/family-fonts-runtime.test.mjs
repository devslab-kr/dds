import test from 'node:test';
import assert from 'node:assert/strict';
let runtime={};
try { runtime=await import('../packages/site-kit/src/family-fonts/runtime.mjs'); } catch(e) { if(e.code!=='ERR_MODULE_NOT_FOUND')throw e; }
const manifest={schemaVersion:1,css:{file:'fonts.css'},assets:[
{id:'latin',file:'fonts/geist-latin-111111111111.woff2'},
{id:'korean',file:'fonts/PretendardVariable-222222222222.woff2'},
{id:'mono',file:'fonts/geist-mono-latin-333333333333.woff2'}],preload:{default:['latin','korean'],monospace:['mono']}};
const ready=typeof runtime.createFamilyFontAPI==='function';
test('family font runtime exposes the public factory',()=>assert.equal(typeof runtime.createFamilyFontAPI,'function'));
test('static head resolves the canonical two fonts, optional mono, and framework attribute casing',{skip:!ready},()=>{
 const api=runtime.createFamilyFontAPI(manifest);
 const html=api.getFontHeadLinks('/dds-fonts',{format:'html'});assert.equal(html.length,3);assert.equal(html[0].href,'/dds-fonts/fonts/geist-latin-111111111111.woff2');assert.equal(html[0].crossorigin,'anonymous');assert.ok(!('crossOrigin'in html[0]));assert.equal(html.at(-1).rel,'stylesheet');
 const react=api.getFontHeadLinks('/dds-fonts/',{format:'react',monospace:true});assert.equal(react.length,4);assert.equal(react[2].href,'/dds-fonts/fonts/geist-mono-latin-333333333333.woff2');assert.equal(react[0].crossOrigin,'anonymous');assert.ok(!('crossorigin'in react[0]));
 for(const base of ['https://foreign.test/fonts','//foreign.test','/x/../secret','/x?y','/x#y','/x"bad'])assert.throws(()=>api.getFontHeadLinks(base));
});
test('immutable font responses retain status, ETag, MIME and bytes for GET/HEAD and 200/304',{skip:!ready},async()=>{
 const api=runtime.createFamilyFontAPI(manifest);
 for(const method of ['GET','HEAD'])for(const status of [200,304]){
  const body=status===304||method==='HEAD'?null:'font bytes';const response=new Response(body,{status,headers:{'Content-Type':'font/woff2','Cache-Control':'public,max-age=0',ETag:'"v1"'}});
  const result=api.withFamilyFontCache(new Request('https://app.test/assets/PretendardVariable-222222222222-AbCd1234.woff2',{method}),response);
  assert.notEqual(result,response);assert.equal(result.status,status);assert.equal(result.headers.get('cache-control'),'public, max-age=31536000, immutable');assert.equal(result.headers.get('etag'),'"v1"');assert.equal(result.headers.get('content-type'),'font/woff2');assert.equal(await result.text(),body??'');
 }
});
test('private, partial, errors, missing MIME, non-font and unknown asset responses are returned untouched',{skip:!ready},()=>{
 const api=runtime.createFamilyFontAPI(manifest),path='/assets/PretendardVariable-222222222222-AbCd1234.woff2';
 const cases=[{method:'POST'},{request:{Authorization:'x'}},{request:{Range:'bytes=0-2'}},{response:{'Set-Cookie':'x=1'}},{response:{'Cache-Control':'private,max-age=0'}},{response:{'Cache-Control':'public,no-store'}},{status:404},{status:500},{status:206},{status:304,mime:null},{mime:'text/html'},{mime:'application/json'},{path:'/fonts/NotoSansKR-Regular.ttf'},{path:'/assets/PretendardVariable.woff2'},{path:'/assets/unknown-12345678.woff2'},{path:'/uploads/fonts/PretendardVariable-222222222222.woff2'},{path:'/api/fonts/PretendardVariable-222222222222.woff2'},{path:'/_serverFn/fonts/PretendardVariable-222222222222.woff2'},{path:'/account/assets/PretendardVariable-222222222222-AbCd1234.woff2'},{path:'/dds-fonts/fonts/PretendardVariable-222222222222.woff2'}];
 for(const item of cases){const status=item.status??200;const headers=new Headers({'Content-Type':'font/woff2','Cache-Control':'public,max-age=0',...item.response});if(item.mime===null)headers.delete('Content-Type');else if(item.mime)headers.set('Content-Type',item.mime);const response=new Response(status===304?null:'body',{status,headers});const request=new Request('https://app.test'+(item.path??path),{method:item.method??'GET',headers:item.request});assert.equal(api.withFamilyFontCache(request,response),response,JSON.stringify(item));}
});
test('bundle resolution owns selection and rejects missing, ambiguous and foreign emitted font URLs',{skip:!ready},()=>{
 const api=runtime.createFamilyFontAPI(manifest);
 const bundle=Object.fromEntries(manifest.assets.map((a,i)=>['a'+i,{type:'asset',names:[a.file.split('/').at(-1)],fileName:'assets/'+a.file.split('/').at(-1).replace('.woff2','-AbCd1234.woff2')}]));
 const links=api.getBundleFontPreloadLinks(bundle,{format:'react',monospace:true});assert.equal(links.length,3);assert.equal(links[0].crossOrigin,'anonymous');assert.match(links[1].href,/PretendardVariable-222222222222-AbCd1234/);
 assert.throws(()=>api.getBundleFontPreloadLinks({}),/one emitted/i);assert.throws(()=>api.getBundleFontPreloadLinks({...bundle,duplicate:bundle.a0}),/one emitted/i);assert.throws(()=>api.getBundleFontPreloadLinks({...bundle,a0:{...bundle.a0,fileName:'//foreign.test/font.woff2'}}));
});
test('cache descriptors allow only known content-hashed font paths and contain no HTML/API policy',{skip:!ready},()=>{
 const api=runtime.createFamilyFontAPI(manifest);const paths=['/assets/geist-latin-111111111111-AbCd1234.woff2','/dds-fonts/fonts/PretendardVariable-222222222222.woff2'];
 assert.deepEqual(api.fontAssetHeaders(paths),paths.map(path=>({path,headers:{'Cache-Control':'public, max-age=31536000, immutable'}})));
 assert.throws(()=>api.fontAssetHeaders(['/api/user']));assert.throws(()=>api.fontAssetHeaders(['//foreign.test/fonts/geist-latin-111111111111.woff2']));
});

test('request-only static adapters require an exact generated base and preserve request negative guards',()=>{
 const api=runtime.createFamilyFontAPI(manifest),url='https://app.test/dds-fonts/fonts/geist-latin-111111111111.woff2';
 assert.equal(api.isFamilyFontAssetRequest(new Request(url),{baseURL:'/dds-fonts'}),true);
 assert.equal(api.isFamilyFontAssetRequest(new Request(url,{method:'HEAD'}),{baseURL:'/dds-fonts'}),true);
 for(const init of [{method:'POST'},{headers:{Authorization:'x'}},{headers:{Range:'bytes=0-2'}}])assert.equal(api.isFamilyFontAssetRequest(new Request(url,init),{baseURL:'/dds-fonts'}),false);
 for(const path of ['/elsewhere/fonts/geist-latin-111111111111.woff2','/dds-fonts/fonts/missing-111111111111.woff2','/dds-fonts/fonts/geist-latin-111111111111-AbCd1234.woff2','/dds-fonts/fonts/NotoSansKR-Regular.ttf'])assert.equal(api.isFamilyFontAssetRequest(new Request('https://app.test'+path),{baseURL:'/dds-fonts'}),false);
});
test('bundle cache adapters ignore unrelated assets and own DDS font selection',()=>{
 const api=runtime.createFamilyFontAPI(manifest),asset=manifest.assets[0],known={type:'asset',names:[asset.file.split('/').at(-1)],fileName:'assets/geist-latin-111111111111-AbCd1234.woff2'};
 const headers=api.getBundleFontAssetHeaders({known,js:{type:'chunk',fileName:'assets/app-AbCd1234.js'},other:{type:'asset',names:['other.woff2'],fileName:'assets/other-AbCd1234.woff2'}});
 assert.deepEqual(headers,[{path:'/assets/geist-latin-111111111111-AbCd1234.woff2',headers:{'Cache-Control':runtime.FAMILY_FONT_CACHE_CONTROL}}]);
 assert.deepEqual(api.getBundleFontAssetHeaders({}),[]);
});

test('static request adapters never classify upload or API routes as public font assets',()=>{
 const api=runtime.createFamilyFontAPI(manifest);
 for(const base of ['/uploads','/api','/_serverFn']){const path=base+'/fonts/geist-latin-111111111111.woff2';assert.equal(api.isFamilyFontAssetRequest(new Request('https://app.test'+path),{baseURL:base}),false);assert.throws(()=>api.fontAssetHeaders([path]));}
});
