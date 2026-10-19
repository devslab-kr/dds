import {createComponent as h,createSignal} from 'solid-js';
import {Input,InputGroup,Combobox,SelectPicker,Calendar,TimePicker,SegmentedControl,NumberInput} from '@devslab/dds-solid';
export const events=[];
const items=[{value:'a',label:'Apple'},{value:'b',label:'Banana'}];
export function App(){
 const [text,setText]=createSignal('Hydrated text'),[date,setDate]=createSignal('2026-10-17');
 return [
  h(InputGroup,{id:'component-group',get start(){return 'Prefix';},get children(){return h(Input,{id:'component-input',label:'Packed inside input',labelPlacement:'inside',clearable:true,clearLabel:'Clear packed input',get value(){return text();},onValueChange:value=>{events.push(['input',value]);setText(value);}});}}),
  h(Combobox,{id:'component-combo',label:'Packed combo',items,defaultValue:'a',onValueChange:value=>events.push(['combo',value])}),
  h(SelectPicker,{id:'component-select',label:'Packed select',items,defaultValue:'b',onValueChange:value=>events.push(['select',value])}),
  h(Calendar,{label:'Packed inline calendar',locale:'en-US',get value(){return date();},onChange:value=>{events.push(['calendar',value]);setDate(value);}}),
  h(TimePicker,{id:'component-time',label:'Packed time',name:'closing',defaultValue:'18:30:00',onValueChange:value=>events.push(['time',value])}),
  h(SegmentedControl,{id:'component-segmented',label:'Packed view',name:'view',items:[{value:'day',label:'Day'},{value:'week',label:'Week'}],defaultValue:'day',onValueChange:value=>events.push(['segmented',value])}),
  h(NumberInput,{id:'component-number',label:'Packed amount',name:'amount',suffix:'KRW',defaultValue:1234,min:0,max:5000,onValueChange:value=>events.push(['number',value])}),
 ];
}
