import {DatePicker as ArkDatePicker,parseDate} from '@ark-ui/react/date-picker';
import {Portal} from '@ark-ui/react/portal';
import {Button,Field} from './controls';

export interface DatePickerProps {
  label:string;
  /** ISO calendar date (YYYY-MM-DD), or an empty string. */
  value:string;
  onChange:(value:string)=>void;
  locale?:string;
  timeZone?:string;
  disabled?:boolean;
  min?:string;
  max?:string;
}
function CalendarIcon(){return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="15" rx="2"/><path d="M7.5 3v5M16.5 3v5M3.5 10.5h17"/></svg>;}
function Chevron({next=false}:{next?:boolean}){return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d={next?'m9 5 7 7-7 7':'m15 5-7 7 7 7'}/></svg>;}


export function DatePicker({label,value,onChange,locale='ko-KR',timeZone='Asia/Seoul',disabled=false,min,max}:DatePickerProps){
  return (
    <Field label={label}>
      {control=><ArkDatePicker.Root locale={locale} timeZone={timeZone} disabled={disabled} min={min?parseDate(min):undefined} max={max?parseDate(max):undefined} startOfWeek={0} minView="day" maxView="day" fixedWeeks translations={{dayCell:state=>`${state.valueText} 선택`,clearTrigger:'선택 날짜 지우기'}} value={value?[parseDate(value)]:[]} format={v=>v.toString()} onValueChange={details=>onChange(details.valueAsString[0]||'')} positioning={{placement:'bottom-start',gutter:8}}>
        <ArkDatePicker.Control className="dds-date-picker-control">
          <ArkDatePicker.Input {...control} placeholder="YYYY-MM-DD" autoComplete="off"/>
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
              <div className="dds-date-picker-footer"><Button type="button" tone="secondary" onClick={()=>picker.selectToday()}>오늘</Button><ArkDatePicker.ClearTrigger asChild><Button type="button" tone="secondary">지우기</Button></ArkDatePicker.ClearTrigger></div>
            </>}</ArkDatePicker.Context>
          </ArkDatePicker.View>
        </ArkDatePicker.Content></ArkDatePicker.Positioner></Portal>
      </ArkDatePicker.Root>}
    </Field>
  );
}
