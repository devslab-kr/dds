import {useState} from 'react';
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {expect, it} from 'vitest';
import {DatePicker} from '../date-picker';
import type {DatePickerValidity as Validity,DatePickerProps} from '../index';

// Real source component; exported callback declaration is checked separately by tsc.
function Example({required=false,min,max,readOnly=false,disabled=false}: {
  required?:boolean; min?:string; max?:string; readOnly?:boolean; disabled?:boolean;
}) {
  const [value,setValue]=useState('2028-02-28');
  const [validity,setValidity]=useState<Validity | null>(null);
  const props:DatePickerProps={locale:'en-US',label:'Date',value,onChange:setValue,required,min,max,readOnly,disabled,
    onValidityChange:setValidity};
  return <><DatePicker {...props}/><button type="button">Outside</button>
    <output aria-label="Canonical value">{value}</output>
    <output aria-label="Draft validity">{JSON.stringify(validity)}</output></>;
}
async function replaceDraft(text:string) {
  const user=userEvent.setup(); const input=screen.getByLabelText(/^Date(?:\s*\*)?$/) as HTMLInputElement;
  await user.click(input); await user.keyboard('{Control>}a{/Control}');
  await user.keyboard(text); return {user,input};
}

// Catches selected-only notifications, permissive leap-date parsing and blur reversion.
it('retains an impossible leap-date draft on blur and makes native validity false',async()=>{
  render(<Example/>);
  const {user,input}=await replaceDraft('2027-02-29');
  await user.click(screen.getByRole('button',{name:'Outside'}));
  await waitFor(()=>expect(input).toHaveValue('2027-02-29'));
  expect(input.checkValidity()).toBe(false);
  expect(screen.getByLabelText('Canonical value')).toHaveTextContent('2028-02-28');
  expect(JSON.parse(screen.getByLabelText('Draft validity').textContent!)).toMatchObject({
    inputValue:'2027-02-29',valid:false,reason:'invalid'});
});

// Catches the separate INPUT.ENTER path which can reselect an old focused date.
it('does not replace an incomplete draft with the old selection on Enter',async()=>{
  render(<Example/>); const {user,input}=await replaceDraft('2027-02-');
  await user.keyboard('{Enter}');
  await waitFor(()=>expect(input).toHaveValue('2027-02-'));
  expect(input.checkValidity()).toBe(false);
  expect(JSON.parse(screen.getByLabelText('Draft validity').textContent!)).toMatchObject({
    inputValue:'2027-02-',valid:false,reason:'incomplete'});
});

it('reports raw invalid draft before blur so button Save can block immediately',async()=>{
  render(<Example/>); const {input}=await replaceDraft('2027-02-29');
  expect(input).toHaveFocus();
  expect(JSON.parse(screen.getByLabelText('Draft validity').textContent!)).toMatchObject({
    inputValue:'2027-02-29',valid:false,reason:'invalid'});
});

it.each([
  {text:'2028-02-27',reason:'rangeUnderflow'},
  {text:'2028-03-02',reason:'rangeOverflow'},
])('does not silently clamp out-of-range draft $text',async({text,reason})=>{
  render(<Example min="2028-02-28" max="2028-03-01"/>);
  const {user,input}=await replaceDraft(text);
  await user.click(screen.getByRole('button',{name:'Outside'}));
  await waitFor(()=>expect(input).toHaveValue(text));
  expect(input.checkValidity()).toBe(false);
  expect(JSON.parse(screen.getByLabelText('Draft validity').textContent!)).toMatchObject({
    inputValue:text,valid:false,reason});
});

it('correcting an invalid draft commits the real leap day and clears custom validity',async()=>{
  render(<Example/>); await replaceDraft('2027-02-29');
  const {user,input}=await replaceDraft('2028-02-29');
  await user.click(screen.getByRole('button',{name:'Outside'}));
  await waitFor(()=>expect(screen.getByLabelText('Canonical value')).toHaveTextContent('2028-02-29'));
  expect(input.checkValidity()).toBe(true);
  expect(JSON.parse(screen.getByLabelText('Draft validity').textContent!)).toMatchObject({
    inputValue:'2028-02-29',valid:true,reason:'valid'});
});

it.each([false,true])('clearing distinguishes optional from required (required=%s)',async(required)=>{
  render(<Example required={required}/>);
  const user=userEvent.setup();const input=screen.getByLabelText(/^Date(?:\s*\*)?$/) as HTMLInputElement;
  await user.clear(input);await user.click(screen.getByRole('button',{name:'Outside'}));
  await waitFor(()=>expect(screen.getByLabelText('Canonical value')).toBeEmptyDOMElement());
  expect(input.checkValidity()).toBe(!required);
  expect(input.required).toBe(required);
  expect(JSON.parse(screen.getByLabelText('Draft validity').textContent!)).toMatchObject({
    inputValue:'',valid:!required,reason:required?'required':'valid'});
});

it('keeps an invalid persisted controlled value visible without throwing or clearing it',()=>{
  const props={locale:'en-US',label:'Date',value:'2027-02-29',onChange:()=>{},onValidityChange:()=>{}};
  expect(()=>render(<DatePicker {...props}/>)).not.toThrow();
  const input=screen.getByLabelText(/^Date(?:\s*\*)?$/) as HTMLInputElement;
  expect(input).toHaveValue('2027-02-29');expect(input.checkValidity()).toBe(false);
});

it('external controlled reset replaces a pending invalid draft and clears native error',async()=>{
  const view=render(<DatePicker locale="en-US" label="Date" value="2028-02-28" onChange={()=>{}}/>);
  const {input}=await replaceDraft('2027-02-29');
  view.rerender(<DatePicker locale="en-US" label="Date" value="2028-03-01" onChange={()=>{}}/>);
  await waitFor(()=>expect(input).toHaveValue('2028-03-01'));
  expect(input.checkValidity()).toBe(true);
});

it('readOnly prevents typing and opening the calendar',async()=>{
  render(<Example readOnly/>);const user=userEvent.setup();
  const input=screen.getByLabelText(/^Date(?:\s*\*)?$/) as HTMLInputElement;
  expect(input.readOnly).toBe(true);
  await user.type(input,'2027');expect(input).toHaveValue('2028-02-28');
  const trigger=screen.getByRole('button',{name:/Date.*달력/});
  await user.click(trigger);expect(screen.queryByRole('application')).not.toBeInTheDocument();
});

it('a disabled transition closes the already-open portal',async()=>{
  const view=render(<Example/>);const user=userEvent.setup();
  await user.click(screen.getByRole('button',{name:/Date.*달력/}));
  expect(screen.getByRole('application')).toBeInTheDocument();
  view.rerender(<Example disabled/>);
  await waitFor(()=>expect(screen.queryByRole('application')).not.toBeInTheDocument());
  expect(screen.getByLabelText(/^Date(?:\s*\*)?$/)).toBeDisabled();
});
it('a complete valid typed date updates canonical state before a focused button shortcut can save',async()=>{
  render(<Example/>);const {input}=await replaceDraft('2028-02-29');
  expect(input).toHaveFocus();
  expect(screen.getByLabelText('Canonical value')).toHaveTextContent('2028-02-29');
});

it('calendar Clear also clears an invalid persisted draft with no previous selection',async()=>{
  function Invalid(){const [value,setValue]=useState('2027-02-29');return <DatePicker locale="en-US" label="Date" value={value} onChange={setValue}/>;}
  render(<Invalid/>);const user=userEvent.setup();
  await user.click(screen.getByRole('button',{name:/Date.*달력/}));
  await user.click(screen.getByRole('button',{name:'선택 날짜 지우기'}));
  await waitFor(()=>expect(screen.getByLabelText(/^Date(?:\s*\*)?$/)).toHaveValue(''));
});
// Review regression: observed assertion RED on the original patch. A single pendingEcho loses B when C
// commits before B is acknowledged. Parent updates are actual controlled props.
it('keeps newest draft when two canonical commits receive delayed parent echoes',async()=>{
  function DeferredParent(){
    const [value,setValue]=useState('2028-02-28');
    const [sent,setSent]=useState<string[]>([]);
    return <><DatePicker locale="en-US" label="Date" value={value} onChange={next=>setSent(items=>[...items,next])}/>
      <button type="button" onClick={()=>setValue('2028-02-29')}>Acknowledge B</button>
      <button type="button" onClick={()=>setValue('2028-03-01')}>Acknowledge C</button>
      <output aria-label="Sent dates">{JSON.stringify(sent)}</output></>;
  }
  render(<DeferredParent/>);
  await replaceDraft('2028-02-29');
  const {user,input}=await replaceDraft('2028-03-01');
  expect(screen.getByLabelText('Sent dates')).toHaveTextContent('2028-02-29');
  expect(screen.getByLabelText('Sent dates')).toHaveTextContent('2028-03-01');
  expect(input).toHaveValue('2028-03-01');
  await user.click(screen.getByRole('button',{name:'Acknowledge B'}));
  await waitFor(()=>expect(input).toHaveValue('2028-03-01'));
  await user.click(screen.getByRole('button',{name:'Acknowledge C'}));
  await waitFor(()=>expect(input).toHaveValue('2028-03-01'));
});
// Source-only review follow-ups: not executed after the delayed-echo correction.
function LaggingParent(){
  const [value,setValue]=useState('2028-02-28');
  const [sent,setSent]=useState<string[]>([]);
  return <><DatePicker locale="en-US" label="Date" value={value} onChange={next=>setSent(items=>[...items,next])}/>
    <button type="button" onClick={()=>setValue('2028-02-29')}>Ack B</button>
    <button type="button" onClick={()=>setValue('2028-03-01')}>Ack C</button>
    <button type="button" onClick={()=>setValue('2028-04-01')}>Reset X</button>
    <output aria-label="Sent sequence">{JSON.stringify(sent)}</output></>;
}
it('represents repeated B C B emissions without duplicate blur commits',async()=>{
  render(<LaggingParent/>);
  await replaceDraft('2028-02-29');await replaceDraft('2028-03-01');
  const {user,input}=await replaceDraft('2028-02-29');
  await user.click(screen.getByRole('button',{name:'Ack B'}));
  await user.click(screen.getByRole('button',{name:'Ack C'}));
  expect(input).toHaveValue('2028-02-29');
  await user.click(screen.getByRole('button',{name:'Ack B'}));
  expect(input).toHaveValue('2028-02-29');
  expect(JSON.parse(screen.getByLabelText('Sent sequence').textContent!)).toEqual([
    '2028-02-29','2028-03-01','2028-02-29']);
});
it('older B C acknowledgements preserve a newer invalid draft',async()=>{
  render(<LaggingParent/>);
  await replaceDraft('2028-02-29');await replaceDraft('2028-03-01');
  const {user,input}=await replaceDraft('2027-02-29');
  await user.click(screen.getByRole('button',{name:'Ack B'}));
  await user.click(screen.getByRole('button',{name:'Ack C'}));
  expect(input).toHaveValue('2027-02-29');expect(input.checkValidity()).toBe(false);
});
it('an unmatched external reset replaces a newer invalid draft and pending history',async()=>{
  render(<LaggingParent/>);await replaceDraft('2028-02-29');
  const {user,input}=await replaceDraft('2027-02-29');
  await user.click(screen.getByRole('button',{name:'Reset X'}));
  await waitFor(()=>expect(input).toHaveValue('2028-04-01'));
  expect(input.checkValidity()).toBe(true);
});
// Callback lifecycle/consumer guard candidates: source-only until next lease.
it('does not replay unchanged validity on each inline callback identity change',async()=>{
  let reports=0;
  function Inline(){
    const [validity,setValidity]=useState<DatePickerProps['value']>('');
    const [tick,setTick]=useState(0);
    return <><DatePicker locale="en-US" label="Date" value="2028-02-28" onChange={()=>{}}
      onValidityChange={state=>{reports++;setValidity(state.inputValue);}}/>
      <button type="button" onClick={()=>setTick(n=>n+1)}>Rerender {tick}</button>
      <output aria-label="Last report">{validity}</output></>;
  }
  render(<Inline/>);expect(reports).toBe(1);
  await userEvent.setup().click(screen.getByRole('button',{name:'Rerender 0'}));
  expect(reports).toBe(1);expect(screen.getByLabelText('Last report')).toHaveTextContent('2028-02-28');
});
it('a new keyed editor receives its own initial report even for the same date',async()=>{
  const reports:string[]=[];
  function Editors(){const[id,setId]=useState('one');return <>
    <DatePicker key={id} locale="en-US" label="Date" value="2028-02-28" onChange={()=>{}}
      onValidityChange={state=>reports.push(`${id}:${state.value}`)}/>
    <button type="button" onClick={()=>setId('two')}>Switch editor</button></>;}
  render(<Editors/>);await userEvent.setup().click(screen.getByRole('button',{name:'Switch editor'}));
  expect(reports).toEqual(['one:2028-02-28','two:2028-02-28']);
});
it('invalid typing can mark dirty and cancel confirmation without a canonical onChange',async()=>{
  const emitted:string[]=[];
  function Guard(){
    const[baseline,setBaseline]=useState<string|null>(null),[dirty,setDirty]=useState(false),[confirm,setConfirm]=useState(true);
    return <><DatePicker locale="en-US" label="Date" value="2028-02-28" onChange={next=>emitted.push(next)}
      onValidityChange={state=>{if(baseline===null){setBaseline(state.inputValue);return;}
        setDirty(state.inputValue!==baseline);if(state.inputValue!==baseline)setConfirm(false);}}/>
      <output aria-label="Dirty">{String(dirty)}</output><output aria-label="Confirm">{String(confirm)}</output></>;
  }
  render(<Guard/>);await replaceDraft('2027-02-29');
  expect(emitted).toEqual([]);expect(screen.getByLabelText('Dirty')).toHaveTextContent('true');
  expect(screen.getByLabelText('Confirm')).toHaveTextContent('false');
});