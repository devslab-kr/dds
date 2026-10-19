import {createComponent as h,createSignal} from 'solid-js';
import {Input,InputGroup,Combobox,SelectPicker,Calendar,DateRangePicker,MonthPicker} from '@devslab/dds-solid';
export const events=[];
const items=[{value:'a',label:'Apple'},{value:'b',label:'Banana'}];
export function App(){
 const [text,setText]=createSignal('Hydrated text'),[date,setDate]=createSignal('2026-10-17');
 return [
  h(InputGroup,{id:'component-group',get start(){return 'Prefix';},get children(){return h(Input,{id:'component-input',label:'Packed inside input',labelPlacement:'inside',clearable:true,clearLabel:'Clear packed input',get value(){return text();},onValueChange:value=>{events.push(['input',value]);setText(value);}});}}),
  h(Combobox,{id:'component-combo',label:'Packed combo',items,defaultValue:'a',onValueChange:value=>events.push(['combo',value])}),
  h(SelectPicker,{id:'component-select',label:'Packed select',items,defaultValue:'b',onValueChange:value=>events.push(['select',value])}),
  h(Calendar,{label:'Packed inline calendar',locale:'en-US',get value(){return date();},onChange:value=>{events.push(['calendar',value]);setDate(value);}}),
  h(DateRangePicker,{id:'component-range',label:'Packed period',locale:'en-US',startName:'from',endName:'to',defaultValue:{start:'2026-10-01',end:'2026-10-20'},onValueChange:value=>events.push(['range',value.start+'~'+value.end])}),
  h(MonthPicker,{id:'component-month',label:'Packed month',locale:'en-US',name:'month',defaultValue:'2026-10',onValueChange:value=>events.push(['month',value])}),
 ];
}
