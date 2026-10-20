import {createElement as h,StrictMode,useState} from 'react';
import {InputGroup,Combobox,SelectPicker,Calendar,TimePicker} from '@devslab/dds-react';
import {Input} from '@devslab/dds-react/input';
export const events=[];
const items=[{value:'a',label:'Apple'},{value:'b',label:'Banana'}];
function Components(){
 const [text,setText]=useState('Hydrated text'),[date,setDate]=useState('2026-10-17');
 return h('section',null,
  h(InputGroup,{id:'component-group',start:'Prefix'},h(Input,{id:'component-input',label:'Packed inside input',labelPlacement:'inside',clearable:true,clearLabel:'Clear packed input',value:text,onValueChange:value=>{events.push(['input',value]);setText(value);}})),
  h(Combobox,{id:'component-combo',label:'Packed combo',items,defaultValue:'a',onValueChange:value=>events.push(['combo',value])}),
  h(SelectPicker,{id:'component-select',label:'Packed select',items,defaultValue:'b',onValueChange:value=>events.push(['select',value])}),
  h(Calendar,{label:'Packed inline calendar',locale:'en-US',value:date,onChange:value=>{events.push(['calendar',value]);setDate(value);}}),
  h(TimePicker,{id:'component-time',label:'Packed time',name:'closing',defaultValue:'18:30:00',onValueChange:value=>events.push(['time',value])}),
 );
}
export function App(){return h(StrictMode,null,h(Components));}
