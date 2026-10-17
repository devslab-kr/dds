# DDS React

Accessible React primitives using Ark UI 5.39.3 and shared DDS tokens, CSS and icons. React and React DOM are peers (18.3 or 19). Import CSS once in the application:

```tsx
import '@devslab/dds-react/styles.css';
import { Button, Field, Select, Dialog, Tabs, TabList, Tab, TabPanel } from '@devslab/dds-react';

<Field label="Country" helpText="Choose a country">
  {control => <Select {...control} defaultValue="kr"><option value="kr">Korea</option></Select>}
</Field>
<Button tone="primary" onClick={() => setOpen(true)}>Edit</Button>
<Dialog open={open} onOpenChange={setOpen} title="Edit country" description="Changes apply to your profile">
  <Button onClick={() => setOpen(false)}>Done</Button>
</Dialog>
<Tabs defaultValue="overview">
  <TabList aria-label="Sections"><Tab value="overview">Overview</Tab></TabList>
  <TabPanel value="overview">Content</TabPanel>
</Tabs>
```

Exports: `Button`, `IconButton`, `Field`, `Checkbox`, `Radio`, `Select`, `Switch`, `RadioGroup`, `Dialog`, `Tabs`, `TabList`, `Tab`, `TabPanel`, `Tooltip`, `Icon`, `ToastProvider`, `useToast`, `ConsoleShell`, and their prop types. Labels, tooltip messages, dialog titles and notification copy come from the caller. There is no translated fallback copy.

Native DOM attributes use React spelling (`className`, `htmlFor`, `onChange`). DOM components accept React object or callback refs; Select refs target its select and Dialog refs target content. Button defaults to `type="button"`; loading prevents activation and preserves its name. Checkbox, Radio and Switch accept `checked`/`defaultChecked`, `onCheckedChange(boolean)` and native input attributes. Select uses native `value`/`defaultValue` and `onChange`. RadioGroup takes `label` and `options: { value, label, disabled? }[]`, with `value`/`defaultValue` and `onValueChange(string)`.

Tabs extends Ark root options, with `onValueChange(string)`; parts accept normal Ark DOM props including `asChild`. Dialog accepts Ark root options with `onOpenChange(boolean)`, `closeOnOutside`, `initialFocus`, `finalFocus`, `contentProps`, `actions`, `frame(parts)` and `unstyled`. Dialog portals by default; use `portal={false}` for inline markup, including open SSR content. Ark owns nested modal isolation, focus, Escape handling and scroll locking. Additional focus containers from the Solid package are not emulated; use Ark `persistentElements` and `modal`/`trapFocus` according to application needs.

Tooltip accepts one element child (Ark `asChild`) or a render function receiving native button trigger props. Use a focusable trigger and preserve the supplied events. `ToastProvider` accepts optional caller `regionLabel` and `dismissLabel` (string or record-to-string function); without `dismissLabel` it renders no close button. `useToast()` returns `show({ message, tone?, duration? })`, `dismiss(id)`, and `clear()`; duration 0 persists. Providers clear their notifications on unmount.

Advanced compositional parts are exported as `ArkDialog`, `ArkTabs`, `ArkTooltip`, `ArkRadioGroup`, `ArkCheckbox`, `ArkSwitch`, `ArkField`, and `ArkToast`. They are the pinned upstream Ark namespaces, useful inside convenience component children or for application-owned composition.

ConsoleShell accepts caller brand/navigation/header/labels/foot slots and unique per-instance landmark IDs. Its rail uses caller route state; no router or business store is included. Imports and server rendering require no browser globals; client-only effects start after mounting. React `useId` keeps label associations stable through hydration. React JSX, React refs and Ark `asChild` element composition differ from Solid render callbacks/accessors. The grid is a separate dependency: use `@devslab/dds-table-react` for AG Grid.

ESM and declarations are shipped; React, React DOM and Ark remain external to the DDS bundle. This package is source-available under the included LICENSE, matching the DDS repository.

## DatePicker

```tsx
import { DatePicker } from "@devslab/dds-react";
<DatePicker label="시작 날짜" value={date} onChange={setDate} />
```

Controlled `value` uses `YYYY-MM-DD` or an empty string. `locale` defaults to `ko-KR`, `timeZone` to `Asia/Seoul`. Optional `min`, `max` and `disabled` constrain selection. Import the package stylesheet. Time selection is a separate field. Ark owns calendar focus, keyboard navigation and popup dismissal.

## createStatusPill

```tsx
const StatusPill = createStatusPill({
  tones: { job: { ready: "success" } },
  label: (domain, value, locale) => value === "ready" ? "준비됨" : undefined,
});
<StatusPill domain="job" value="ready" locale="ko" />
```

Unknown closed-domain status values throw to expose incomplete catalogs. Domains listed in `openDomains` instead show the unknown value as escaped text.

### DatePicker manual input and saving

`value`/`onChange` remain canonical date-only `YYYY-MM-DD` strings (or intentional clear `''`). Complete real dates commit while typing; invalid/incomplete text stays visible and never becomes a replacement date. `required` forwards native/accessible required state; `readOnly` prevents edits/calendar opening. Locked transitions close the portal. Invalid persisted values render an error without being parsed or cleared.

Subscribe to `onValidityChange(state: DatePickerValidity)` for the exact displayed `inputValue`, canonical `value` (or null while invalid), `valid`, and reason (`valid`, `required`, `incomplete`, `invalid`, `rangeUnderflow`, `rangeOverflow`). Native forms use the visible input's custom validity. API/button/shortcut saves MUST also check the callback state; a canonical parent value may still contain the last valid selection while the visible draft is invalid. Start unknown/blocked until the initial callback. Do not infer validity from `value` alone.

```tsx
const [date, setDate] = useState('2028-02-28');
const [dateValidity, setDateValidity] = useState<DatePickerValidity | null>(null);
<DatePicker label="Date" value={date} onChange={setDate}
  required onValidityChange={setDateValidity} />
// In every save handler (including shortcuts):
if (!dateValidity?.valid || dateValidity.value === null) return;
await save({ date: dateValidity.value });
```

Strict Gregorian dates and inclusive min/max are validated without timezone normalization or silent clamping. Clearing always reports `onChange('')`; required clear remains invalid. Keep authoritative server validation. Library tests alone do not establish that a consumer's request handler uses this guard.
Korean (`ko`, `ko-KR`, including the default locale) displays `YYYY/MM/DD`; `value`, `onChange`, min/max and `DatePickerValidity.value` remain `YYYY-MM-DD`. Consumers must not replace separators or persist `inputValue`. ISO paste is accepted by the common parser and normalized only once it is a complete valid date. Date-only values do not shift with timeZone.

`onValidityChange` reports initially and on semantic draft/constraint/controlled-value changes, including invalid/partial edits that do not emit `onChange`. Use it for dirty/navigation guards and to cancel a pending publish confirmation when input changes. Replacing only the callback function does not replay an identical report: this prevents inline setState render loops. Key the owning editor by document identity/reset revision, and keep callbacks stable with useCallback. A new keyed instance receives a fresh initial report even for an identical date. Compare canonical value for valid dates and the raw inputValue for invalid drafts when tracking the pristine baseline; do not generate a consumer-side display formatter. Remount/reset that baseline only on an intentional editor change/reset.

```tsx
<PolicyDateEditor key={`${document.id}:${document.revision}`} document={document} />
// Inside PolicyDateEditor (one editor identity):
const baseline = useRef<string | undefined>(undefined);
const previous = useRef<string | undefined>(undefined);
const onDateValidity = useCallback((state: DatePickerValidity) => {
  setDateValidity(state);
  const stateKey = JSON.stringify(state.valid ? [true, state.value] : [false, state.inputValue]);
  if (baseline.current === undefined) baseline.current = stateKey;
  setDirty(stateKey !== baseline.current);
  if (previous.current !== undefined && previous.current !== stateKey) {
    closePublishConfirmation();
  }
  previous.current = stateKey;
}, [closePublishConfirmation]); // Keep closePublishConfirmation stable too.
// Every button/API/shortcut Save checks valid and persists state.value only.
```

Delayed controlled echoes matching an outstanding local emission acknowledge that occurrence without replacing a newer draft. Repeated B/C/B is retained as three occurrences; duplicate blur/Enter does not emit again. A changed value not among pending emissions is an external reset and clears pending history. The string-only API cannot distinguish an intentional reset to a still-outstanding identical value from its acknowledgement; use a keyed editor remount for an explicit reset. Keep local controlled state synchronous and persist to the server separately. Unacknowledged emissions are retained until acknowledgement, external reset or unmount.
## Inputs, choices, overlays and shared calendars

Input/InputGroup are general-purpose native inputs, not search-only, with label placement and clear actions. Combobox/SelectPicker support fixed-row virtualization; DropdownMenu/Popover provide accessible overlays; Calendar/DatePicker share a calendar view.

Use explicit subpaths `@devslab/dds-react/input`, `/combobox`, `/select-picker`, `/dropdown-menu`, `/popover`, `/calendar`, `/date-picker`, or the existing root exports. Keep importing `styles.css` once. See the [common usage guide](https://github.com/devslab-kr/dds/blob/main/docs/components-input-choice-calendar.md).
