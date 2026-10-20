import {createElement as h,StrictMode,useState} from 'react';
import {InputGroup,Combobox,SelectPicker,Calendar,DateRangePicker,MonthPicker} from '@devslab/dds-react';
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
  h(DateRangePicker,{id:'component-range',label:'Packed period',locale:'en-US',startName:'from',endName:'to',defaultValue:{start:'2026-10-01',end:'2026-10-20'},onValueChange:value=>events.push(['range',value.start+'~'+value.end])}),
  h(MonthPicker,{id:'component-month',label:'Packed month',locale:'en-US',name:'month',defaultValue:'2026-10',onValueChange:value=>events.push(['month',value])}),
 );
}
export function App(){return h(StrictMode,null,h(Components));}
