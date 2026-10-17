import {createSignal} from 'solid-js';
import {render} from 'solid-js/web';
import {Input,InputGroup} from '../../../../packages/dds-solid/src/input';
import {Combobox} from '../../../../packages/dds-solid/src/combobox';
import {SelectPicker} from '../../../../packages/dds-solid/src/select-picker';
import {DropdownMenu} from '../../../../packages/dds-solid/src/dropdown-menu';
import {Popover} from '../../../../packages/dds-solid/src/popover';
import {Calendar} from '../../../../packages/dds-solid/src/calendar';
import {DatePicker} from '../../../../packages/dds-solid/src/date-picker';
import {Dialog} from '../../../../packages/dds-solid/src/dialog';
import '../../../../packages/dds-solid/styles.css';
import '../layout.css';
import {items,externalItems,retainedOption} from '../data';
function App(){
 const [combo,setCombo]=createSignal(''),[select,setSelect]=createSignal('');
 const [external,setExternal]=createSignal('saved'),[results,setResults]=createSignal([retainedOption]);
 const [date,setDate]=createSignal('2026-10-17'),[picked,setPicked]=createSignal('2026-10-17');
 const [dialog,setDialog]=createSignal(false),[action,setAction]=createSignal('none'),[submitted,setSubmitted]=createSignal('');
 const [checked,setChecked]=createSignal(false),[density,setDensity]=createSignal('comfortable'),[direction,setDirection]=createSignal<'ltr'|'rtl'>('ltr');
 const [nestedChoice,setNestedChoice]=createSignal('');
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
 <Dialog title="Parent dialog" open={dialog()} onOpenChange={setDialog}><Popover.Root><Popover.Trigger>Nested popover</Popover.Trigger><Popover.Content><Popover.Title>Details</Popover.Title><Popover.Description>Nested details</Popover.Description><Popover.CloseTrigger>Close details</Popover.CloseTrigger></Popover.Content></Popover.Root><Combobox label="Dialog combo" items={items.slice(0,3)} value={nestedChoice()} onValueChange={setNestedChoice}/><output aria-label="Dialog choice value">{nestedChoice()}</output><DatePicker label="Nested date" locale="en-US" value={picked()} onChange={setPicked}/><button onClick={()=>setDialog(false)}>Close dialog</button></Dialog></section>
 <section aria-label="Calendars"><h2>Calendars</h2><Calendar label="Inline calendar" locale="en-US" value={date()} onChange={setDate}/><output aria-label="Calendar value">{date()}</output><DatePicker label="Picked date" locale="en-US" value={picked()} onChange={setPicked}/><output aria-label="Picked value">{picked()}</output></section>
 </main>;
}
render(()=><App/>,document.getElementById('root')!);
