// Hand-written .dds-btn markup, no framework: the shapes consumers write
// directly (docs/components.md), which the framework Buttons never produce —
// aria-busy without [disabled], the spinner after the text, a link styled as a
// button, and an emoji in the label. Served by the Solid fixture server only
// because it needs one; nothing here uses Solid.
import '../../../../packages/dds-tokens/dist/tokens.css';
import '../../../../packages/dds-css/dist/dds.css';
import '../layout.css';
import '../button.css';
import {sizes,tones} from '../buttons';

const shapes=[
 {id:'busy',tag:'button',text:'저장',spinner:'first',disabled:false},
 {id:'spinner-after',tag:'button',text:'저장',spinner:'last',disabled:false},
 {id:'busy-disabled',tag:'button',text:'저장',spinner:'first',disabled:true},
 {id:'link',tag:'a',text:'열기',spinner:'first',disabled:false},
 {id:'emoji',tag:'button',text:'저장 ✅',spinner:'first',disabled:false},
] as const;

const root=document.getElementById('root')!;
root.innerHTML=`<main><h1>DDS buttons · Markup</h1>
 <button type="button" id="toggle">Toggle loading</button><output aria-label="Clicks">0</output>
 <section aria-label="Buttons" class="button-grid"></section></main>`;
const grid=root.querySelector('section')!;
const output=root.querySelector('output')!;
let clicks=0;
for(const tone of tones) for(const size of sizes) for(const shape of shapes){
 const item=document.createElement('div');
 item.className='button-case';
 item.dataset.case=`markup ${tone} ${size} ${shape.id}`;
 item.dataset.name=shape.text;
 const sizeClass=size==='md'?'':` dds-btn--${size}`;
 item.innerHTML=shape.tag==='a'
  ? `<a class="dds-btn dds-btn--${tone}${sizeClass}" href="#clicked">${shape.text}</a>`
  : `<button type="button" class="dds-btn dds-btn--${tone}${sizeClass}">${shape.text}</button>`;
 item.insertAdjacentHTML('beforeend','<span class="button-after" aria-hidden="true"></span>');
 const target=item.firstElementChild as HTMLElement;
 target.dataset.spinner=shape.spinner;
 if(shape.disabled) target.dataset.disableWhileBusy='';
 target.addEventListener('click',event=>{event.preventDefault();output.textContent=String(++clicks);});
 grid.append(item);
}
document.getElementById('toggle')!.addEventListener('click',()=>{
 for(const target of grid.querySelectorAll<HTMLElement>('.dds-btn')){
  const spinner=target.querySelector(':scope > .dds-spinner');
  if(spinner){
   spinner.remove();
   target.removeAttribute('aria-busy');
   target.removeAttribute('disabled');
  }else{
   target.insertAdjacentHTML(target.dataset.spinner==='last'?'beforeend':'afterbegin','<span class="dds-spinner" aria-hidden="true"></span>');
   target.setAttribute('aria-busy','true');
   if('disableWhileBusy' in target.dataset) target.setAttribute('disabled','');
  }
 }
});
