import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
const {html}=JSON.parse(await readFile(new URL('./component-ssr.json',import.meta.url),'utf8'));
const dom=new JSDOM('<!doctype html><html><body><main id="root">'+html+'</main></body></html>',{pretendToBeVisual:true,url:'http://localhost'});
for(const key of ['window','document','CSS','Node','Element','HTMLElement','HTMLInputElement','HTMLButtonElement','HTMLFormElement','SVGElement','Document','ShadowRoot','MutationObserver','navigator','CustomEvent','getComputedStyle','requestAnimationFrame','cancelAnimationFrame']){
 const value=dom.window[key];Object.defineProperty(globalThis,key,{value:typeof value==='function'&&/^[a-z]/.test(key)?value.bind(dom.window):value,configurable:true,writable:true});
}
globalThis.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};
HTMLElement.prototype.scrollTo=function(){};
const diagnostics=[],warn=console.warn,error=console.error;
console.warn=(...values)=>diagnostics.push(values.join(' '));console.error=(...values)=>diagnostics.push(values.join(' '));
const host=document.querySelector('#root');
const serverNodes=[...host.querySelectorAll('#component-group,#component-input,.dds-choice,.dds-choice-input,.dds-choice-trigger,.dds-choice-label,.dds-calendar,.dds-calendar [data-part="content"],.dds-calendar [data-part="table"],.dds-calendar [data-part="table-cell-trigger"]')];
assert.equal(host.querySelector('#component-input')?.value,'Hydrated text','Inside input missing from SSR');
assert.equal(host.querySelector('.dds-choice-input')?.value,'Apple','Combo default selection missing from SSR');
assert.ok(host.querySelector('[data-scope="select"][data-part="trigger"]')?.textContent.includes('Banana'),'Select default selection missing from SSR');
assert.ok(host.querySelector('.dds-calendar [data-value="2026-10-17"][data-selected]'),'Calendar selection missing from SSR');
const {createElement:h}=await import('react');const {hydrateRoot}=await import('react-dom/client');const {App,events}=await import('./component-app.mjs');
const pause=()=>new Promise(resolve=>setTimeout(resolve,20));
async function until(predicate,message){for(let i=0;i<250;i++){if(predicate())return;await pause();}throw new Error(message+(diagnostics.length?'\n'+diagnostics.join('\n'):''));}
let root;
try{
 root=hydrateRoot(host,h(App),{onRecoverableError:issue=>diagnostics.push(String(issue))});await pause();await pause();
 for(const node of serverNodes)assert.ok(host.contains(node),'Hydration replaced new component server DOM: '+node.outerHTML);
 const input=host.querySelector('#component-input'),setInput=Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value').set;
 setInput.call(input,'Edited after hydration');input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
 await until(()=>events.some(([kind,value])=>kind==='input'&&value==='Edited after hydration'),'Hydrated input edit failed');
 host.querySelector('[aria-label="Clear packed input"]').click();
 await until(()=>input.value==='','Hydrated input clear failed');
 assert.equal(events.filter(([kind,value])=>kind==='input'&&value==='').length,1,'Clear emitted more than once');
 assert.equal(document.activeElement,input,'Clear did not restore input focus');
 const comboTrigger=host.querySelector('[data-scope="combobox"][data-part="trigger"]');
 comboTrigger.click();
 await until(()=>{const content=document.querySelector('[data-scope="combobox"][data-part="content"]');return comboTrigger.getAttribute('aria-expanded')==='true'&&content?.getAttribute('data-state')==='open'&&!content.hidden;},'Hydrated combo did not open');
 document.querySelector('[data-scope="combobox"][data-part="item"][data-value="b"]').click();
 await until(()=>events.some(([kind,value])=>kind==='combo'&&value==='b'),'Hydrated combo selection failed');
 const selectTrigger=host.querySelector('[data-scope="select"][data-part="trigger"]');
 selectTrigger.click();
 await until(()=>{const content=document.querySelector('[data-scope="select"][data-part="content"]');return selectTrigger.getAttribute('aria-expanded')==='true'&&content?.getAttribute('data-state')==='open'&&!content.hidden;},'Hydrated select did not open');
 document.querySelector('[data-scope="select"][data-part="item"][data-value="a"]').click();
 await until(()=>events.some(([kind,value])=>kind==='select'&&value==='a'),'Hydrated select selection failed');
 host.querySelector('.dds-calendar [data-part="table-cell-trigger"][data-value="2026-10-18"]').click();
 await until(()=>events.some(([kind,value])=>kind==='calendar'&&value==='2026-10-18'),'Hydrated Calendar selection failed');
}finally{root?.unmount();console.warn=warn;console.error=error;dom.window.close();}
assert.deepEqual(diagnostics,[],'New component SSR hydration emitted diagnostics');
