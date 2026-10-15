import {useState} from 'react';
import {fireEvent,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {expect,it} from 'vitest';
import {DatePicker} from '../date-picker';
import type {DatePickerValidity} from '../index';

// Korean display and canonical ISO persistence regressions.
function Korean({required=false,min,max,timeZone='Asia/Seoul'}:{required?:boolean;min?:string;max?:string;timeZone?:string}){
  const [value,setValue]=useState('2028-02-28');
  const [validity,setValidity]=useState<DatePickerValidity|null>(null);
  return <><DatePicker label="날짜" locale="ko-KR" timeZone={timeZone} value={value} onChange={setValue}
    required={required} min={min} max={max} onValidityChange={setValidity}/>
    <button type="button">바깥</button>
    <output aria-label="API 날짜">{value}</output>
    <output aria-label="입력 검증">{JSON.stringify(validity)}</output></>;
}
async function typeDate(text:string){
  const user=userEvent.setup();const input=screen.getByLabelText(/^날짜(?:\s*\*)?$/) as HTMLInputElement;
  await user.click(input);await user.keyboard('{Control>}a{/Control}');await user.keyboard(text);
  return {user,input};
}
it('Korean default renders slash display while the public model remains ISO',()=>{
  render(<DatePicker label="날짜" value="2028-02-29" onChange={()=>{}}/>);
  expect(screen.getByLabelText('날짜')).toHaveValue('2028/02/29');
  expect(screen.getByLabelText('날짜')).toHaveAttribute('placeholder','YYYY/MM/DD');
});
it('Korean slash typing exposes an ISO validity.value and onChange without consumer formatting',async()=>{
  render(<Korean/>);const {input}=await typeDate('2028/02/29');
  expect(input).toHaveValue('2028/02/29');
  expect(screen.getByLabelText('API 날짜')).toHaveTextContent('2028-02-29');
  expect(JSON.parse(screen.getByLabelText('입력 검증').textContent!)).toEqual({
    inputValue:'2028/02/29',value:'2028-02-29',valid:true,reason:'valid'});
});
it.each([
  {text:'2027/02/29',reason:'invalid'},
  {text:'2028/02/',reason:'incomplete'},
  {text:'2028/02/30',reason:'invalid'},
  {text:'2028/03/02',reason:'rangeOverflow'},
  {text:'2028/02/27',reason:'rangeUnderflow'},
])('Korean $text stays visible and cannot become an API date',async({text,reason})=>{
  render(<Korean min="2028-02-28" max="2028-03-01"/>);
  const {user,input}=await typeDate(text);await user.keyboard('{Enter}');await user.click(screen.getByRole('button',{name:'바깥'}));
  expect(input).toHaveValue(text);expect(input.checkValidity()).toBe(false);
  expect(JSON.parse(screen.getByLabelText('입력 검증').textContent!)).toEqual({
    inputValue:text,value:null,valid:false,reason});
});
it.each([false,true])('Korean clear keeps optional/required canonical semantics (required=%s)',async(required)=>{
  render(<Korean required={required}/>);const user=userEvent.setup();
  await user.clear(screen.getByLabelText(/^날짜(?:\s*\*)?$/));
  expect(JSON.parse(screen.getByLabelText('입력 검증').textContent!)).toEqual({
    inputValue:'',value:required?null:'',valid:!required,reason:required?'required':'valid'});
});
it.each(['Asia/Seoul','UTC','America/Los_Angeles'])('Korean date-only display never shifts in %s',(timeZone)=>{
  render(<DatePicker label="날짜" locale="ko-KR" timeZone={timeZone} value="2028-01-01" onChange={()=>{}}/>);
  expect(screen.getByLabelText('날짜')).toHaveValue('2028/01/01');
});
it('calendar selection has Korean display but ISO callback and validity.value',async()=>{
  const user=userEvent.setup();
  function Calendar(){const[value,setValue]=useState('2026-10-12');const[validity,setValidity]=useState<DatePickerValidity|null>(null);return <>
    <DatePicker label="날짜" value={value} onChange={setValue} onValidityChange={setValidity}/><output aria-label="선택 ISO">{value}</output><output aria-label="선택 검증">{JSON.stringify(validity)}</output></>;}
  render(<Calendar/>);await user.click(screen.getByRole('button',{name:'날짜 달력 열기'}));
  await user.click(screen.getByRole('button',{name:'2026년 10월 13일 화요일 선택'}));
  await waitFor(()=>expect(screen.getByLabelText('날짜')).toHaveValue('2026/10/13'));
  await waitFor(()=>expect(screen.getByLabelText('날짜')).toHaveFocus());
  expect(screen.getByLabelText('선택 ISO')).toHaveTextContent('2026-10-13');
  expect(JSON.parse(screen.getByLabelText('선택 검증').textContent!).value).toBe('2026-10-13');
});
// Source-identified follow-up: display conversion must not briefly report an
// invalid API value when an existing canonical date changes display locale.
it('changing display locale keeps the canonical date valid through every report',async()=>{
  const reports:DatePickerValidity[]=[];
  const props={label:'Date',value:'2028-02-29',onChange:()=>{},onValidityChange:(state:DatePickerValidity)=>reports.push(state)};
  const view=render(<DatePicker {...props} locale="ko-KR"/>);
  view.rerender(<DatePicker {...props} locale="en-US"/>);
  await waitFor(()=>expect(screen.getByLabelText('Date')).toHaveValue('2028-02-29'));
  expect(reports.length).toBeGreaterThan(0);
  expect(reports.every(state=>state.valid&&state.value==='2028-02-29')).toBe(true);
});
it('retains the newest invalid draft after pending canonical synchronization frames',async()=>{
  render(<Korean/>);
  const input=screen.getByLabelText('날짜') as HTMLInputElement;
  fireEvent.input(input,{target:{value:'2028/02/29'}});
  fireEvent.input(input,{target:{value:'2028/02/31'}});
  await new Promise(resolve=>setTimeout(resolve,70));
  expect(input).toHaveValue('2028/02/31');
  expect(input.checkValidity()).toBe(false);
  expect(JSON.parse(screen.getByLabelText('입력 검증').textContent!)).toEqual({
    inputValue:'2028/02/31',value:null,valid:false,reason:'invalid'});
  fireEvent.input(input,{target:{value:''}});
  fireEvent.input(input,{target:{value:'2028/02/'}});
  await new Promise(resolve=>setTimeout(resolve,70));
  expect(input).toHaveValue('2028/02/');
  expect(input.checkValidity()).toBe(false);
  expect(JSON.parse(screen.getByLabelText('입력 검증').textContent!)).toEqual({
    inputValue:'2028/02/',value:null,valid:false,reason:'incomplete'});
});