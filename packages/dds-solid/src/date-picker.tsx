import {DatePicker as ArkDatePicker,parseDate} from '@ark-ui/solid/date-picker';
import {Portal} from 'solid-js/web';
import {For} from 'solid-js';
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
function CalendarIcon(){return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="15" rx="2"/><path d="M7.5 3v5M16.5 3v5M3.5 10.5h17"/></svg>;}
function Chevron(props:{next?:boolean}){return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d={props.next?'m9 5 7 7-7 7':'m15 5-7 7 7 7'}/></svg>;}


export function DatePicker(props:DatePickerProps){
  return (
    <Field label={props.label}>
      {control=><ArkDatePicker.Root locale={props.locale??'ko-KR'} timeZone={props.timeZone??'Asia/Seoul'} disabled={props.disabled} min={props.min?parseDate(props.min):undefined} max={props.max?parseDate(props.max):undefined} startOfWeek={0} minView="day" maxView="day" fixedWeeks translations={{dayCell:state=>`${state.valueText} 선택`,clearTrigger:'선택 날짜 지우기'}} value={props.value?[parseDate(props.value)]:[]} format={v=>v.toString()} onValueChange={details=>props.onChange(details.valueAsString[0]||'')} positioning={{placement:'bottom-start',gutter:8}}>
        <ArkDatePicker.Control class="dds-date-picker-control">
          <ArkDatePicker.Input {...control} placeholder="YYYY-MM-DD" autocomplete="off"/>
          <ArkDatePicker.Trigger class="dds-btn dds-btn--secondary" aria-label={`${props.label} 달력 열기`}><CalendarIcon/></ArkDatePicker.Trigger>
        </ArkDatePicker.Control>
        <Portal><ArkDatePicker.Positioner class="dds-date-picker-positioner"><ArkDatePicker.Content class="dds-date-picker-content" aria-label={`${props.label} 날짜 선택`}>
          <ArkDatePicker.View view="day">
            <ArkDatePicker.Context>{picker=><>
              <ArkDatePicker.ViewControl class="dds-date-picker-header">
                <ArkDatePicker.PrevTrigger class="dds-btn dds-btn--secondary" aria-label="이전 달"><Chevron/></ArkDatePicker.PrevTrigger>
                <ArkDatePicker.RangeText/>
                <ArkDatePicker.NextTrigger class="dds-btn dds-btn--secondary" aria-label="다음 달"><Chevron next/></ArkDatePicker.NextTrigger>
              </ArkDatePicker.ViewControl>
              <ArkDatePicker.Table class="dds-date-picker-table">
                <ArkDatePicker.TableHead><ArkDatePicker.TableRow><For each={picker().weekDays}>{day=><ArkDatePicker.TableHeader>{day.short}</ArkDatePicker.TableHeader>}</For></ArkDatePicker.TableRow></ArkDatePicker.TableHead>
                <ArkDatePicker.TableBody><For each={picker().weeks}>{week=><ArkDatePicker.TableRow><For each={week}>{day=><ArkDatePicker.TableCell value={day}><ArkDatePicker.TableCellTrigger>{day.day}</ArkDatePicker.TableCellTrigger></ArkDatePicker.TableCell>}</For></ArkDatePicker.TableRow>}</For></ArkDatePicker.TableBody>
              </ArkDatePicker.Table>
              <div class="dds-date-picker-footer"><Button type="button" tone="secondary" onClick={()=>picker().selectToday()}>오늘</Button><ArkDatePicker.ClearTrigger class="dds-btn dds-btn--secondary">지우기</ArkDatePicker.ClearTrigger></div>
            </>}</ArkDatePicker.Context>
          </ArkDatePicker.View>
        </ArkDatePicker.Content></ArkDatePicker.Positioner></Portal>
      </ArkDatePicker.Root>}
    </Field>
  );
}
