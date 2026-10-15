import {StrictMode,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {DatePicker} from '@devslab/dds-react';
import '@devslab/dds-react/styles.css';

// Test-only CUA harness: no date validation implementation is duplicated here.
// The real DDS callback is the sole draft/validity authority for button saves.
type Validity={inputValue:string;value:string|null;valid:boolean;reason:string};
function Fixture(){
  const query=new URLSearchParams(location.search);
  const initial=query.get('initial')??'2028-02-28';
  const [value,setValue]=useState(initial);
  const [validity,setValidity]=useState<Validity|null>(initial==='2028-02-28'?{inputValue:initial,value:initial,valid:true,reason:'valid'}:null);
  const [required,setRequired]=useState(query.get('required')==='1');
  const [disabled,setDisabled]=useState(false);
  const [readOnly,setReadOnly]=useState(false);
  const [attempts,setAttempts]=useState(0);
  const [payloads,setPayloads]=useState<unknown[]>([]);
  const [status,setStatus]=useState('Ready');
  async function save(){
    if(validity?.valid!==true||validity.value===null){setStatus('Blocked');return;}
    setAttempts(n=>n+1);
    const payload={date:validity.value};
    // Memory-only consumer action. No HTTP request is made by this fixture.
    setPayloads(items=>[...items,payload]);setStatus('Saved');
  }
  const props={label:'Fixture date',value,onChange:setValue,required,disabled,readOnly,
    min:query.get('min')??undefined,max:query.get('max')??undefined,
    onValidityChange:setValidity};
  return <main style={{padding:24,maxWidth:520}}>
    <h1>DDS date validity fixture</h1>
    <p>CUA keyboard typing only. Form save tests native validity; API save tests callback guard.</p>
    <form onSubmit={event=>{event.preventDefault();void save();}}>
      <DatePicker {...props}/>
      <button type="submit">Form Save</button>
      <button type="button" onClick={()=>void save()}>API Save</button>
    </form>
    <button type="button" onClick={()=>setDisabled(v=>!v)}>Toggle disabled</button>
    <button type="button" onClick={()=>setReadOnly(v=>!v)}>Toggle readOnly</button>
    <button type="button" onClick={()=>setRequired(v=>!v)}>Toggle required</button>
    <button type="button" onClick={()=>setValue('2028-03-01')}>External reset</button>
    <dl><dt>Canonical value</dt><dd><output aria-label="Canonical value">{value}</output></dd>
      <dt>Draft validity</dt><dd><output aria-label="Draft validity">{JSON.stringify(validity)}</output></dd>
      <dt>Save count (memory)</dt><dd><output aria-label="Save count">{attempts}</output></dd>
      <dt>Save bodies (memory)</dt><dd><output aria-label="Save bodies">{JSON.stringify(payloads)}</output></dd>
      <dt>Status</dt><dd><output aria-label="Save status">{status}</output></dd></dl>
  </main>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><Fixture/></StrictMode>);