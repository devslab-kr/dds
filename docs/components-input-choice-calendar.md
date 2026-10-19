# DDS input, choice, overlay and calendar components

Use `@devslab/dds-solid` for Solid or `@devslab/dds-react` for React. Both expose the same named features at the root and at explicit component subpaths. Import the framework package's `styles.css` once at the application boundary.

```tsx
import '@devslab/dds-react/styles.css';
import { Input, InputGroup } from '@devslab/dds-react/input';
import { Combobox } from '@devslab/dds-react/combobox';
import { SelectPicker } from '@devslab/dds-react/select-picker';
import { DropdownMenu } from '@devslab/dds-react/dropdown-menu';
import { Popover } from '@devslab/dds-react/popover';
import { Calendar } from '@devslab/dds-react/calendar';
import { DatePicker } from '@devslab/dds-react/date-picker';
```

## General inputs

Input is not search-only. It supports native text/search/email/tel/url/password/number semantics, refs, events, name/form, required, readOnly and disabled. Number is the native HTML control, not a new custom spinbutton. InputGroup lays out a single Input with optional start/end icons, units or action buttons. It does not own the input value.

```tsx
<Input type="email" name="email" label="Email" required />
<Input type="password" name="password" label="Password" autoComplete="current-password" />
<Input label="Name" labelPlacement="inside" value={name} onValueChange={setName}
  clearable clearLabel="Clear name" />
<InputGroup end={<button type="submit">Search</button>}>
  <Input type="search" label="Query" labelPlacement="hidden" name="query" />
</InputGroup>
```

labelPlacement is outside (default), inside (floating on focus/value/autofill), or hidden (visually hidden, still accessible). If label is omitted, supply aria-label or aria-labelledby; a placeholder is not a label. Field render-prop ID/ARIA props can be spread onto Input instead of adding a duplicate label. Changing label placement does not remount the control.

Use value/onValueChange for controlled inputs, or defaultValue for uncontrolled inputs. Clear sends one empty-string notification, returns focus, and does not submit the form. Clearing required inputs makes them invalid. Disabled/readOnly inputs cannot be cleared. Native form reset is respected, including prevented resets and parent-owned controlled values. A composing Enter is not treated as a search submission.

## Selecting values

Select keeps its existing native-select behavior. SelectPicker provides a custom non-searchable single-value selector. Combobox combines query entry and selection; it is not a free-text storage control.

```tsx
<Combobox label="Customer" items={items} value={customerId} onValueChange={setCustomerId}
  virtualization={{ itemHeight: 40, overscan: 5 }} clearable
  messages={{ open: 'Open options', clear: 'Clear customer', empty: 'No matches' }} />
<SelectPicker label="Category" items={items} name="category" required />
```

Options have unique nonempty string value IDs, label, optional description and disabled. Empty string means no selection. Callbacks receive IDs. defaultValue is available. Virtualization defaults off; enabled lists use fixed-height rows (minimum 40px; smaller values are clamped) and a maximum 320px viewport. Descriptions do not change row height. Grouped virtualization, infinite loading and multiple selection are outside this release.

For remote search use filterMode="external" and pass server-filtered items. Control inputValue/onInputValueChange and expose loading/error/onRetry. selectedOption supplies the label for a selected value absent from the current page. DDS performs no network requests, authentication or debounce; guard stale responses in the application's data layer with AbortController or request generations.

Typing alone does not commit an option. Blurring an uncommitted query with an existing selection restores that selection's label. Clear resets both query and selected ID. Native form data contains the selected ID rather than the label. Required invalidity focuses the visible control. readOnly prevents selection changes.

## Menus and popovers

DropdownMenu exposes Root, Trigger, Content, Item, Group, Label, Separator, CheckboxItem, RadioGroup, RadioItem, ItemText, ItemIndicator, Submenu and SubmenuTrigger. Item.onSelect runs an action; Root.onSelect receives an ID and Root.onOpenChange receives a boolean. Compose submenus from Submenu + SubmenuTrigger + Content. Use the framework's Ark asChild convention for native links or existing DDS buttons; do not nest buttons.

Popover exposes Root, Trigger, Content, Title, Description, CloseTrigger and Anchor. It is nonmodal by default; keep Dialog for modal tasks. Content portals by default; nested overlays mount inside the nearest dialog to preserve modal accessibility and focus. portal={false} or portalMount controls placement. Supply localized accessible close names, including `aria-label` on CloseTrigger. DDS overlays share `--dds-overlay-z-index` for custom shell layering.

## Calendars and date entry

```tsx
<Calendar label="Booking date" value={date} onChange={setDate} locale="en-US" />
<DatePicker label="Due date" value={date} onChange={setDate} required
  labelPlacement="inside" onValidityChange={setValidity} />
```

Calendar renders an always-visible single-date calendar. DatePicker adds editable text and a popup. Within each framework both use one private CalendarView under their own single Ark root. Dates remain YYYY-MM-DD or empty strings, never UTC-converted timestamps. Korean display uses YYYY/MM/DD. min/max are inclusive; timeZone controls today's date, not stored date conversion. startOfWeek defaults to Sunday (0) and accepts 0–6.

DatePicker preserves invalid/incomplete drafts and reports onValidityChange. Callback-based saves must check validity.valid and use canonical value. Delayed parent acknowledgements do not blindly reset drafts. Use keyed editor remounts for explicit resets indistinguishable from pending identical values. Both frameworks support readOnly/disabled, localized messages, showToday, clearable and labelPlacement. Standalone Calendar is controlled. Range selection lives in the Solid DateRangePicker below; scheduling calendars are a separate future feature.

## Date ranges and months (Solid)

Solid-only for now (React parity is a follow-up). Import from `@devslab/dds-solid/date-range-picker` and `@devslab/dds-solid/month-picker`, or from the root.

```tsx
<DateRangePicker label="Period" value={range} onValueChange={setRange}
  startName="from" endName="to" min="2026-01-01" max="2026-12-31"
  presets={[{ label: 'This month', value: { start: '2026-10-01', end: '2026-10-31' } }]} />
<MonthPicker label="Billing month" value={month} onValueChange={setMonth}
  name="month" min="2026-01" max="2026-12" />
```

DateRangePicker replaces two separate date fields for a period. Its value is `{ start, end }`, each YYYY-MM-DD or `""`. One bordered control holds a start and an end input with a `~` separator and the calendar button; each input has its own accessible name (messages.startLabel/endLabel) and the field label names the group. Typing follows DatePicker's rules on each side. A typed end before the start is shown as invalid and is never swapped or reported. onValueChange runs only on user changes, never with start after end; an emptied side is reported as `""`, and required only marks both sides as needed. In the calendar the first click chooses the start and the second the end (Ark orders them); hovering previews the period, and closing after only one click keeps the committed period. presets are consumer data shown as footer buttons; presets outside min/max are disabled, and DDS ships no built-in list. There is no single-date Today action in range mode. Forms receive the API dates under `startName` and `endName` (display text is never submitted). labelPlacement is outside or hidden; inside is not offered because two inputs share one label.

MonthPicker replaces product month inputs (for example a billing month). Its value is YYYY-MM or `""`. Typing accepts YYYY-MM, YYYY/MM, YYYY.MM and YYYYMM; Korean display is YYYY/MM. The popup pages by year and shows a 3 × 4 month grid; months outside the inclusive YYYY-MM min/max are disabled, the current month (by timeZone) is underlined and the selected month is filled. showThisMonth and clearable choose the footer actions. `name` submits YYYY-MM. labelPlacement supports outside, inside and hidden like DatePicker.

Both take value/defaultValue/onValueChange, locale (ko/en defaults), messages, required, disabled, readOnly, invalid, form, id and aria-label/labelledby/describedby. Form reset restores defaultValue (or the controlled value). Escape closes the popup and returns focus to the calendar button; inside a Dialog the popup mounts in that dialog.

## Solid table name

Use `@devslab/dds-table-solid` for new Solid code. `@devslab/dds-table-react` is unchanged. The previous `@devslab/dds-table` package remains a same-version compatibility re-export of the Solid implementation and types. Solid table CSS still comes from tokens.css and dds-css/components/table.css. No external consumer migration or registry deprecation is performed by this change.
