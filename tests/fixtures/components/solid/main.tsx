import {createSignal} from 'solid-js';
import {render} from 'solid-js/web';
import {Input,InputGroup} from '../../../../packages/dds-solid/src/input';
import {Combobox} from '../../../../packages/dds-solid/src/combobox';
import {SelectPicker} from '../../../../packages/dds-solid/src/select-picker';
import {DropdownMenu} from '../../../../packages/dds-solid/src/dropdown-menu';
import {Popover} from '../../../../packages/dds-solid/src/popover';
import {Calendar} from '../../../../packages/dds-solid/src/calendar';
import {DatePicker} from '../../../../packages/dds-solid/src/date-picker';
import {TimePicker} from '../../../../packages/dds-solid/src/time-picker';
import {DateRangePicker} from '../../../../packages/dds-solid/src/date-range-picker';
import {MonthPicker} from '../../../../packages/dds-solid/src/month-picker';
import {Dialog} from '../../../../packages/dds-solid/src/dialog';
import {ToastProvider,useToast} from '../../../../packages/dds-solid/src/toast';
import {SegmentedControl} from '../../../../packages/dds-solid/src/segmented-control';
import {NumberInput} from '../../../../packages/dds-solid/src/number-input';
import '../../../../packages/dds-solid/styles.css';
import '../layout.css';
import {items,externalItems,retainedOption} from '../data';
// A real-length Korean notice: the toast must take the width of its text, not of its empty region.
function Notices(){
 const toast=useToast();
 return <section aria-label="Toasts"><h2>Toasts</h2><button onClick={()=>toast.show({message:'연결된 서비스에서 결과를 확인하지 못했습니다. 잠시 후 다시 시도하고, 계속되면 관리자에게 문의해 주세요.',tone:'danger',duration:0})}>Show long notice</button><button onClick={()=>toast.show({message:'저장했습니다.',tone:'success',duration:0})}>Show short notice</button></section>;
}
// Solid-only for now: SegmentedControl and NumberInput (React parity is a recorded follow-up).
function SegmentsAndNumbers(){
 const [view,setView]=createSignal('day'),[amount,setAmount]=createSignal<number|null>(15000),[submitted,setSubmitted]=createSignal('');
 const views=[{value:'day',label:'Day'},{value:'week',label:'Week'},{value:'month',label:'Month'}];
 const filters=[{value:'all',label:'전체'},{value:'open',label:'접수'},{value:'held',label:'보류 중인 요청 전체 보기'},{value:'done',label:'완료',disabled:true}];
 return <section aria-label='Segments and numbers'><h2>Segments and numbers</h2>
 <form aria-label='Number form' onSubmit={event=>{event.preventDefault();const data=new FormData(event.currentTarget);setSubmitted(String(data.get('view'))+'|'+String(data.get('amount')));}}>
 <SegmentedControl label='View' name='view' items={views} value={view()} onValueChange={setView}/><output aria-label='View value'>{view()}</output>
 <SegmentedControl aria-label='Status filter' items={filters} defaultValue='open' size='sm' fullWidth/>
 <NumberInput label='Amount' name='amount' suffix='원' min={0} max={1000000} value={amount()} onValueChange={setAmount}/><output aria-label='Amount value'>{amount()===null?'empty':String(amount())}</output>
 <NumberInput label='Quantity' locale='en-US' min={1} max={10} defaultValue={1}/>
 <div class='control-grid'><Input label='Memo' placeholder='Memo'/><SelectPicker label='Unit' items={items.slice(0,3)} defaultValue='item-1'/><NumberInput label='Minutes' suffix='분' defaultValue={30} min={0}/><SegmentedControl label='Mode' items={views.slice(0,2)} defaultValue='day'/></div>
 <button type='submit'>Submit number form</button><button type='reset'>Reset number form</button><output aria-label='Number submission'>{submitted()}</output>
 </form></section>;
}
function App(){
 const [combo,setCombo]=createSignal(''),[select,setSelect]=createSignal('');
 const [external,setExternal]=createSignal('saved'),[results,setResults]=createSignal([retainedOption]);
 const [date,setDate]=createSignal('2026-10-17'),[picked,setPicked]=createSignal('2026-10-17');
 const [dialog,setDialog]=createSignal(false),[action,setAction]=createSignal('none'),[submitted,setSubmitted]=createSignal('');
 const [checked,setChecked]=createSignal(false),[density,setDensity]=createSignal('comfortable'),[direction,setDirection]=createSignal<'ltr'|'rtl'>('ltr');
 const [nestedChoice,setNestedChoice]=createSignal('');
 const [time,setTime]=createSignal('09:00'),[nestedTime,setNestedTime]=createSignal(''),[note,setNote]=createSignal('memo');
 const [period,setPeriod]=createSignal({start:'2026-10-05',end:'2026-10-09'}),[month,setMonth]=createSignal('2026-10'),[neighbor,setNeighbor]=createSignal('2026-10-17'),[periodSubmitted,setPeriodSubmitted]=createSignal('');
 return <main><h1>DDS components · Solid</h1>
 <section aria-label="General inputs"><h2>General inputs</h2>
 <form aria-label="Input form" onSubmit={event=>{event.preventDefault();setSubmitted(String(new FormData(event.currentTarget).get('email')));}}>
 <Input type="email" label="Email" name="email" required clearable defaultValue="name@example.com" />
 <Input type="password" label="Password" labelPlacement="inside" placeholder="Enter password" defaultValue="secret" />
 <InputGroup start={<span aria-hidden="true">⌕</span>}><Input type="search" label="Search" labelPlacement="hidden" clearable placeholder="Search records" /></InputGroup>
 <Input label="Floating label" labelPlacement="inside" placeholder="Example" />
 <button type="submit">Submit input form</button><button type="reset">Reset input form</button><output aria-label="Submitted email">{submitted()}</output>
 </form></section>
 <section aria-label="Virtual choices"><h2>10,000 options</h2>
 <div class="examples"><Combobox label="Virtual combo" items={items} value={combo()} onValueChange={setCombo} virtualization={{}} clearable /><output aria-label="Combo value">{combo()}</output>
 <SelectPicker label="Virtual select" items={items} value={select()} onValueChange={setSelect} virtualization={{}} /><output aria-label="Select value">{select()}</output></div>
 <SelectPicker label="Inside empty select" labelPlacement="inside" placeholder="Choose an option" items={items.slice(0,3)} />
 <form aria-label="Choice form" onSubmit={event=>event.preventDefault()}><SelectPicker label="Required choice" items={items.slice(0,3)} name="choice" required /><button type="submit">Submit choice form</button><button type="reset">Reset choice form</button></form></section>
 <section aria-label="External search"><h2>External search</h2>
 <Combobox label="External combo" items={results()} selectedOption={retainedOption} value={external()} onValueChange={setExternal} filterMode="external" />
 <button onClick={()=>setResults(externalItems)}>Replace results</button><output aria-label="External value">{external()}</output></section>
 <section aria-label="Overlays"><h2>Overlays</h2>
 <button onClick={()=>setDirection(direction()==='ltr'?'rtl':'ltr')}>Toggle menu direction</button><output aria-label="Menu direction">{direction()}</output>
 <DropdownMenu.Root dir={direction()} onSelect={setAction}><DropdownMenu.Trigger>Actions</DropdownMenu.Trigger><DropdownMenu.Content aria-label="Record actions"><DropdownMenu.Item value="export">Export records</DropdownMenu.Item><DropdownMenu.Item value="blocked" disabled>Unavailable action</DropdownMenu.Item>
 <DropdownMenu.Submenu dir={direction()} onSelect={setAction}><DropdownMenu.SubmenuTrigger>More actions</DropdownMenu.SubmenuTrigger><DropdownMenu.Content aria-label="More actions menu"><DropdownMenu.Item value="archive">Archive records</DropdownMenu.Item></DropdownMenu.Content></DropdownMenu.Submenu>
 <DropdownMenu.Separator/>
 <DropdownMenu.CheckboxItem value="notifications" checked={checked()} onCheckedChange={setChecked} closeOnSelect={false}>Notifications</DropdownMenu.CheckboxItem>
 <DropdownMenu.RadioGroup value={density()} onValueChange={details=>setDensity(details.value)}><DropdownMenu.RadioItem value="comfortable" closeOnSelect={false}>Comfortable</DropdownMenu.RadioItem><DropdownMenu.RadioItem value="compact" closeOnSelect={false}>Compact</DropdownMenu.RadioItem></DropdownMenu.RadioGroup>
 <DropdownMenu.Item value="link" asChild={attrs=><a {...attrs} href="#menu-link-target">Open linked destination</a>} /></DropdownMenu.Content></DropdownMenu.Root>
 <output aria-label="Notifications value">{checked()?'on':'off'}</output><output aria-label="Density value">{density()}</output><p id="menu-link-target" tabIndex={-1}>Linked destination</p>
 <Popover.Root><Popover.Trigger>Open standalone popover</Popover.Trigger><Popover.Content><Popover.Title>Popover options</Popover.Title><Popover.Description>Review the available options</Popover.Description><Popover.CloseTrigger aria-label="Close popover options">Close popover options</Popover.CloseTrigger></Popover.Content></Popover.Root>
 <output aria-label="Action value">{action()}</output><button onClick={()=>setDialog(true)}>Open dialog</button>
 <Dialog title="Parent dialog" open={dialog()} onOpenChange={setDialog}><Popover.Root><Popover.Trigger>Nested popover</Popover.Trigger><Popover.Content><Popover.Title>Details</Popover.Title><Popover.Description>Nested details</Popover.Description><Popover.CloseTrigger>Close details</Popover.CloseTrigger></Popover.Content></Popover.Root><Combobox label="Dialog combo" items={items.slice(0,3)} value={nestedChoice()} onValueChange={setNestedChoice}/><output aria-label="Dialog choice value">{nestedChoice()}</output><DatePicker label="Nested date" locale="en-US" value={picked()} onChange={setPicked}/><TimePicker label="Dialog time" locale="en-US" value={nestedTime()} onValueChange={setNestedTime}/><DateRangePicker label="Nested period" locale="en-US" defaultValue={{start:'2026-10-05',end:'2026-10-09'}}/><button onClick={()=>setDialog(false)}>Close dialog</button></Dialog></section>
 <section aria-label="Times"><h2>Times</h2><div class="examples"><TimePicker label="Closing time" locale="en-US" value={time()} onValueChange={setTime} clearable/><output aria-label="Time value">{time()}</output><SelectPicker label="Aligned select" items={items.slice(0,3)}/><TimePicker label="Off step time" locale="en-US" defaultValue="10:45:00"/><form aria-label="Time form"><TimePicker label="Reset time" locale="en-US" name="resetTime" defaultValue="08:30"/><Input label="Reset note" name="note" value={note()} onValueChange={setNote}/><button type="reset">Reset time form</button></form></div></section>
 <section aria-label="Calendars"><h2>Calendars</h2><Calendar label="Inline calendar" locale="en-US" value={date()} onChange={setDate}/><output aria-label="Calendar value">{date()}</output><DatePicker label="Picked date" locale="en-US" value={picked()} onChange={setPicked}/><output aria-label="Picked value">{picked()}</output></section>
 <SegmentsAndNumbers/>
 <section aria-label="Periods"><h2>Periods</h2>
 <form aria-label="Period form" onSubmit={event=>{event.preventDefault();const data=new FormData(event.currentTarget);setPeriodSubmitted(`${data.get('from')}~${data.get('to')}|${data.get('month')}`);}}>
 <DatePicker label="기준 날짜" value={neighbor()} onChange={setNeighbor}/>
 <DateRangePicker label="Billing period" locale="en-US" value={period()} onValueChange={setPeriod} startName="from" endName="to" presets={[{label:'October 2026',value:{start:'2026-10-01',end:'2026-10-31'}},{label:'First week',value:{start:'2026-10-01',end:'2026-10-07'}},{label:'Out of range',value:{start:'2027-02-01',end:'2027-02-03'}}]} max="2026-12-31"/>
 <output aria-label="Period value">{period().start}~{period().end}</output>
 <DateRangePicker label="조회 기간" defaultValue={{start:'2026-10-01',end:'2026-10-20'}}/>
 <MonthPicker label="Billing month" locale="en-US" defaultValue="2026-10" name="month" min="2026-03" max="2026-11" showThisMonth={false}/>
 <MonthPicker label="청구 월" value={month()} onValueChange={setMonth}/>
 <output aria-label="Month value">{month()}</output>
 <button type="submit">Submit period form</button><button type="reset">Reset period form</button><output aria-label="Submitted period">{periodSubmitted()}</output>
 </form></section>
 </main>;
}
render(()=><ToastProvider regionLabel="Notifications" dismissLabel="Close notice"><App/><Notices/></ToastProvider>,document.getElementById('root')!);
