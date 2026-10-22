# @devslab/dds-solid

Public SolidJS primitives for DDS. Import `@devslab/dds-solid/styles.css`
once in the application shell, then consume the native-semantic components from
`@devslab/dds-solid`.

Stateful components accept both controlled (`value`/`open`/`checked`) and
uncontrolled (`defaultValue`/`defaultOpen`/`defaultChecked`) forms. Dialog owns
focus trap/return and Escape/outside dismissal; Tabs implements the WAI-ARIA
keyboard model; ToastProvider owns lifecycle timers; Tooltip requires a render
prop so `aria-describedby` is always attached to the actual trigger.

Pass a localized `dismissLabel` to `ToastProvider` when toasts need a manual
dismiss control. Omitting it preserves the existing provider API while leaving
out the control, so the package never emits an English accessible-name fallback.

Interactive primitives use [Ark UI](https://ark-ui.com/) internally while DDS owns
the public API and visual tokens. Existing imports and callback values stay the
same. See [the migration guide](../../docs/ark-migration.md) for integration details.

`RadioGroup` adds a labelled group from `options` (`value`, `label`, optional
`disabled`), with `name`, `value`/`defaultValue` and `onValueChange`. Existing standalone
`Radio` remains native. Use one application-level `ToastProvider`; inject a localized
`regionLabel` if the notification region needs a name. Toast timers pause during
pointer/focus interaction and when the browser page is idle. A non-positive duration
keeps the toast until dismissed.

## Button loading

`loading` keeps the button's size and accessible name: the label is hidden, not removed, and the
spinner is drawn over it, so the controls beside it do not move and a wrapped label does not wrap
again (D-043). Keep the label the same while loading; the hidden text still sets the width.

## createPendingAction

A screen with several buttons needs to know which one started the work. Pass one shared flag
to every button and they all spin on a single click.

```tsx
import { Button, createPendingAction } from "@devslab/dds-solid";
const action = createPendingAction<"approve" | "reject">();
<Button tone="danger" loading={action.is("reject")} disabled={action.busy()}
  onClick={() => action.run("reject", () => decide("reject"))}>Reject</Button>
<Button loading={action.is("approve")} disabled={action.busy()}
  onClick={() => action.run("approve", () => decide("approve"))}>Approve</Button>
```

`is(key)` is true only for the running action, so only that control shows progress; `busy()`
locks the rest. `run` clears the state when the task settles, passes its error on, and does
nothing while another action runs, so a second click cannot start a second request. Pass
`{ replace: true }` where the latest request should win instead, such as a list reload.

The task receives an `AbortSignal` that aborts when its run stops counting: `reset()`, a run that
replaced it, or the component going away. Check `signal.aborted` after each await before touching
the screen, or pass the signal to `fetch`; no separate request counter or "still mounted" flag is
needed. A late completion never clears a newer action.

```tsx
const list = createPendingAction<"search" | "page">();
const reload = (key: "search" | "page") => list.run(key, async (signal) => {
  const rows = await loadRows(filter());
  if (!signal.aborted) setRows(rows);
}, { replace: true });
```

## ConsoleShell navigation groups

Groups remain open by default. Set `collapsible: true` on a group to render a native disclosure button, and give it a stable `id` for expansion state (otherwise the key is `group-${index}`). Only active collapsible groups open initially, using the same route matching and item `active` override as the navigation links.

`LeftNav` is also exported separately for composing a menu in your own layout. It takes `surface`, `activePath`, `nav`, `labels` (`nav` and `badge`), the expansion props below, and optional `onNavigate`. To compose it inside `ConsoleShell`, pass it as `navigation={<LeftNav ... />}`; the slot replaces the built-in menu and the shell's `nav` can be omitted. The shell continues to own branding, the header, content and mobile drawer. For a custom menu, connect `onNavigate` to any application-specific drawer handling.

```tsx
const [expandedGroups, setExpandedGroups] = createSignal<readonly string[]>(["build"]);
<ConsoleShell
  {...shellProps}
  nav={[{ id: "build", label: "Build", collapsible: true, items: [
    { id: "projects", href: "/dashboard/projects", label: "Projects", icon: <svg viewBox="0 0 16 16"><path d="M2 3h5l2 2h5v8H2z" /></svg> },
  ] }]}
  expandedGroups={expandedGroups()}
  onExpandedGroupsChange={setExpandedGroups}
>Content</ConsoleShell>
```

Use `defaultExpandedGroups` for uncontrolled initial state; `[]` explicitly closes every collapsible group. Use `expandedGroups` and `onExpandedGroupsChange` for controlled state. Later route-driven expansion and persistence belong to the application. Item `icon` is decorative; `label` still supplies the link name and badges keep their accessible labels.

## DatePicker

```tsx
import { DatePicker } from "@devslab/dds-solid";
const [date, setDate] = createSignal("");
<DatePicker label="시작 날짜" value={date()} onChange={setDate} />
```

Ark UI owns focus, selection and keyboard navigation; DDS owns styling. Controlled `value` uses `YYYY-MM-DD` or an empty string. `locale` defaults to `ko-KR`, `timeZone` to `Asia/Seoul`; optional `min`, `max` and `disabled` constrain selection. Time of day uses TimePicker.

## TimePicker

```tsx
import { TimePicker } from "@devslab/dds-solid";
const [closing, setClosing] = createSignal("18:00");
<TimePicker label="마감 시간" value={closing()} onValueChange={setClosing} clearable />
```

Replaces the native `type="time"` dropdown with the Combobox control and list. Values are 24-hour `HH:MM` or an empty string; `HH:MM:SS` from a server is shown as `HH:MM`. The list steps every `step` minutes (default 10) and opens centered on the selection; typing `10` filters to 10:00–10:50, and a complete typed time (even off the step, e.g. `10:45`) is accepted with Enter or on leaving the field.

## Inputs, choices, overlays and shared calendars

Input/InputGroup are general-purpose native inputs, not search-only, with label placement and clear actions. Combobox/SelectPicker support fixed-row virtualization; DropdownMenu/Popover provide accessible overlays; Calendar/DatePicker share a calendar view. SegmentedControl picks one of a few visible options (radio-group semantics); NumberInput is a localized number field with optional − / + buttons and a unit, whose value is a number or null.

Use explicit subpaths `@devslab/dds-solid/input`, `/combobox`, `/select-picker`, `/dropdown-menu`, `/popover`, `/calendar`, `/date-picker`, `/time-picker`, `/segmented-control`, `/number-input`, `/date-range-picker`, `/month-picker`, or the existing root exports. Keep importing `styles.css` once. See the [common usage guide](https://github.com/devslab-kr/dds/blob/main/docs/components-input-choice-calendar.md).
Input/InputGroup are general-purpose native inputs, not search-only, with label placement and clear actions. Combobox/SelectPicker support fixed-row virtualization; DropdownMenu/Popover provide accessible overlays; Calendar/DatePicker share a calendar view, which DateRangePicker (start ~ end period) and MonthPicker (YYYY-MM) also use.



## Shared application layouts

Layout, LeftNav and TopNav use the common geometry and typography rules. See [composition and exact dimensions](../../docs/layouts.md).
