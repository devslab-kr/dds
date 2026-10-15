import {forwardRef,useEffect,useRef,useState,type InputHTMLAttributes} from 'react';
import {DatePicker as ArkDatePicker,parseDate} from '@ark-ui/react/date-picker';
import {Portal} from '@ark-ui/react/portal';
import {Button,Field} from './controls';

export interface DatePickerValidity {
  /** Exact displayed draft; never persist this display text as an API date. */
  inputValue:string;
  /** Valid ISO date, optional empty string, or null when invalid/incomplete. */
  value:string|null;
  valid:boolean;
  reason:'valid'|'required'|'incomplete'|'invalid'|'rangeUnderflow'|'rangeOverflow';
}
export interface DatePickerProps {
  label:string;
  /** ISO calendar date (YYYY-MM-DD), or an empty string. */
  value:string;
  onChange:(value:string)=>void;
  locale?:string;
  timeZone?:string;
  disabled?:boolean;
  readOnly?:boolean;
  required?:boolean;
  /** Initial mount and semantic draft changes, deduped across callback identity changes. Key by editor identity for a fresh initial report. Button/API saves must guard validity and use its canonical value. */
  onValidityChange?:(state:DatePickerValidity)=>void;
  min?:string;
  max?:string;
}
// Ark merges its defaultValue even when a local override is undefined. Strip it
// at the final native boundary so the actual text input has one controlled owner.
const ControlledDateInput=forwardRef<HTMLInputElement,InputHTMLAttributes<HTMLInputElement>>(
  function ControlledDateInput({defaultValue:_defaultValue,...props},ref){return <input {...props} ref={ref}/>;}
);
function CalendarIcon(){return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="15" rx="2"/><path d="M7.5 3v5M16.5 3v5M3.5 10.5h17"/></svg>;}
function Chevron({next=false}:{next?:boolean}){return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d={next?'m9 5 7 7-7 7':'m15 5-7 7 7 7'}/></svg>;}


// Date-only Gregorian validation: never let a permissive parser repair user text.
function isCalendarDate(value:string){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const year=Number(value.slice(0,4)),month=Number(value.slice(5,7)),day=Number(value.slice(8,10));
  if(year<1||month<1||month>12||day<1)return false;
  const leap=year%4===0&&(year%100!==0||year%400===0);
  return day<=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31][month-1]!;
}
function isKorean(locale:string){return /^ko(?:-|$)/i.test(locale);}
function displayDate(value:string,locale:string){
  return isKorean(locale)&&isCalendarDate(value)?value.replaceAll('-','/'):value;
}
function canonicalInput(inputValue:string,locale:string){
  return isKorean(locale)&&/^\d{4}\/\d{2}\/\d{2}$/.test(inputValue)?inputValue.replaceAll('/','-'):inputValue;
}
function validateInput(inputValue:string,required:boolean,min?:string,max?:string,locale='en-US'):DatePickerValidity{
  const canonical=canonicalInput(inputValue,locale);
  const incomplete=inputValue.length<10&&(/^\d{0,4}(?:-\d{0,2}(?:-\d{0,2})?)?$/.test(inputValue)
    ||(isKorean(locale)&&/^\d{0,4}(?:\/\d{0,2}(?:\/\d{0,2})?)?$/.test(inputValue)));
  let reason:DatePickerValidity['reason']='valid';
  if(inputValue==='')reason=required?'required':'valid';
  else if(!isCalendarDate(canonical))reason=incomplete?'incomplete':'invalid';
  else if((min&&!isCalendarDate(min))||(max&&!isCalendarDate(max))||(min&&max&&min>max))reason='invalid';
  else if(min&&canonical<min)reason='rangeUnderflow';
  else if(max&&canonical>max)reason='rangeOverflow';
  return {inputValue,value:reason==='valid'?canonical:null,valid:reason==='valid',reason};
}
function calendarSelection(value:string){return isCalendarDate(value)?[parseDate(value)]:[];}

export function DatePicker({label,value,onChange,locale='ko-KR',timeZone='Asia/Seoul',disabled=false,readOnly=false,required=false,onValidityChange,min,max}:DatePickerProps){
  const [draft,setDraft]=useState(()=>displayDate(value,locale));
  const [selection,setSelection]=useState(()=>calendarSelection(value));
  const [open,setOpen]=useState(false);
  const inputRef=useRef<HTMLInputElement>(null);
  const observedValue=useRef(value);
  const observedLocale=useRef(locale);
  // Every outstanding emission is retained, including repeated B/C/B values.
  // Entries end on acknowledgement, an unmatched external reset, or unmount.
  const pendingEchoes=useRef<string[]>([]);
  const emittedValue=useRef(value);
  const notified=useRef('');
  // Convert a complete draft before reporting validity in the new locale.
  const canonicalDraft=canonicalInput(draft,observedLocale.current);
  const effectiveDraft=observedLocale.current!==locale&&isCalendarDate(canonicalDraft)
    ?displayDate(canonicalDraft,locale):draft;
  const validity=validateInput(effectiveDraft,required,min,max,locale);
  const error=validity.valid?undefined:locale.toLowerCase().startsWith('ko')
    ?(validity.reason==='required'?'날짜를 입력해 주세요.':'YYYY/MM/DD 형식의 유효한 범위 내 날짜를 입력해 주세요.')
    :(validity.reason==='required'?'Enter a date.':'Enter a valid date within the allowed range (YYYY-MM-DD).');
  useEffect(()=>{
    const previousLocale=observedLocale.current;
    observedLocale.current=locale;
    if(observedValue.current===value){
      if(previousLocale!==locale)setDraft(effectiveDraft);
      return;
    }
    observedValue.current=value;
    // A matched outstanding value is an acknowledgement, not a draft reset.
    const acknowledged=pendingEchoes.current.indexOf(value);
    if(acknowledged!==-1){pendingEchoes.current.splice(acknowledged,1);return;}
    pendingEchoes.current=[];
    emittedValue.current=value;
    setDraft(displayDate(value,locale));
    if(value===''||isCalendarDate(value))setSelection(calendarSelection(value));
  },[value,locale]);
  useEffect(()=>{
    inputRef.current?.setCustomValidity(error??'');
    const key=JSON.stringify(validity);
    if(onValidityChange&&notified.current!==key){notified.current=key;onValidityChange(validity);}
  },[draft,required,min,max,locale,error,onValidityChange]);
  useEffect(()=>{if(disabled||readOnly)setOpen(false);},[disabled,readOnly]);
  function commit(next:string){
    const state=validateInput(next,required,min,max,locale);
    if(next!==''&&!state.valid)return;
    const canonical=next===''?'':state.value!;
    setSelection(calendarSelection(canonical));
    // Blur/Enter must not emit the same local commit again while props lag.
    if(canonical!==emittedValue.current){
      emittedValue.current=canonical;
      pendingEchoes.current.push(canonical);
      onChange(canonical);
    }
  }
  function changeDraft(next:string){
    setDraft(next);
    const state=validateInput(next,required,min,max,locale);
    // Native form submission and callback-based saves both see this edit.
    inputRef.current?.setCustomValidity(state.valid?'':(error??'Enter a valid date (YYYY-MM-DD).'));
    if(next===''||state.valid){
      setDraft(displayDate(state.value??'',locale));
      commit(next);
    }
  }
  return (
    <Field label={label} required={required} error={error}>
      {control=><ArkDatePicker.Root locale={locale} timeZone={timeZone} disabled={disabled} readOnly={readOnly} required={required} invalid={!validity.valid} open={open&&!disabled&&!readOnly} onOpenChange={details=>setOpen(details.open&&!disabled&&!readOnly)} min={min&&isCalendarDate(min)?parseDate(min):undefined} max={max&&isCalendarDate(max)?parseDate(max):undefined} startOfWeek={0} minView="day" maxView="day" fixedWeeks translations={{dayCell:state=>`${state.valueText} 선택`,clearTrigger:'선택 날짜 지우기'}} value={selection} format={v=>displayDate(v.toString(),locale)} onValueChange={details=>{const next=details.value[0]?.toString()||'';if(next!==''&&!validateInput(next,required,min,max,locale).valid)return;setDraft(displayDate(next,locale));commit(next);}} positioning={{placement:'bottom-start',gutter:8}}>
        <ArkDatePicker.Control className="dds-date-picker-control">
          <ArkDatePicker.Input asChild {...control} ref={inputRef} value={effectiveDraft} onChange={()=>{}} fixOnBlur={false} required={required} readOnly={readOnly} placeholder={isKorean(locale)?"YYYY/MM/DD":"YYYY-MM-DD"} autoComplete="off"
            onBeforeInputCapture={event=>event.stopPropagation()}
            onInputCapture={event=>{if(disabled||readOnly)return;event.stopPropagation();changeDraft(event.currentTarget.value);}}
            onBlur={()=>{if(!disabled&&!readOnly)commit(effectiveDraft);}}
            onKeyDownCapture={event=>{if(event.key==='Enter'&&!event.nativeEvent.isComposing){event.preventDefault();event.stopPropagation();if(!disabled&&!readOnly)commit(effectiveDraft);}}}><ControlledDateInput/></ArkDatePicker.Input>
          <ArkDatePicker.Trigger asChild><Button type="button" tone="secondary" aria-label={`${label} 달력 열기`}><CalendarIcon/></Button></ArkDatePicker.Trigger>
        </ArkDatePicker.Control>
        <Portal><ArkDatePicker.Positioner className="dds-date-picker-positioner"><ArkDatePicker.Content className="dds-date-picker-content" aria-label={`${label} 날짜 선택`}>
          <ArkDatePicker.View view="day">
            <ArkDatePicker.Context>{picker=><>
              <ArkDatePicker.ViewControl className="dds-date-picker-header">
                <ArkDatePicker.PrevTrigger asChild><Button type="button" tone="secondary" aria-label="이전 달"><Chevron/></Button></ArkDatePicker.PrevTrigger>
                <ArkDatePicker.RangeText/>
                <ArkDatePicker.NextTrigger asChild><Button type="button" tone="secondary" aria-label="다음 달"><Chevron next/></Button></ArkDatePicker.NextTrigger>
              </ArkDatePicker.ViewControl>
              <ArkDatePicker.Table className="dds-date-picker-table">
                <ArkDatePicker.TableHead><ArkDatePicker.TableRow>{picker.weekDays.map((day,index)=><ArkDatePicker.TableHeader key={index}>{day.short}</ArkDatePicker.TableHeader>)}</ArkDatePicker.TableRow></ArkDatePicker.TableHead>
                <ArkDatePicker.TableBody>{picker.weeks.map((week,index)=><ArkDatePicker.TableRow key={index}>{week.map(day=><ArkDatePicker.TableCell key={day.toString()} value={day}><ArkDatePicker.TableCellTrigger>{day.day}</ArkDatePicker.TableCellTrigger></ArkDatePicker.TableCell>)}</ArkDatePicker.TableRow>)}</ArkDatePicker.TableBody>
              </ArkDatePicker.Table>
              <div className="dds-date-picker-footer"><Button type="button" tone="secondary" onClick={()=>picker.selectToday()}>오늘</Button><ArkDatePicker.ClearTrigger hidden={false} asChild><Button type="button" tone="secondary" onClick={()=>{if(!disabled&&!readOnly){setDraft('');commit('');}}}>지우기</Button></ArkDatePicker.ClearTrigger></div>
            </>}</ArkDatePicker.Context>
          </ArkDatePicker.View>
        </ArkDatePicker.Content></ArkDatePicker.Positioner></Portal>
      </ArkDatePicker.Root>}
    </Field>
  );
}
