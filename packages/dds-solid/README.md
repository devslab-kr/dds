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

## DatePicker

```tsx
import { DatePicker } from "@devslab/dds-solid";
const [date, setDate] = createSignal("");
<DatePicker label="시작 날짜" value={date()} onChange={setDate} />
```

Ark UI owns focus, selection and keyboard navigation; DDS owns styling. Controlled `value` uses `YYYY-MM-DD` or an empty string. `locale` defaults to `ko-KR`, `timeZone` to `Asia/Seoul`; optional `min`, `max` and `disabled` constrain selection. Time remains a separate field.

## Inputs, choices, overlays and shared calendars

Input/InputGroup are general-purpose native inputs, not search-only, with label placement and clear actions. Combobox/SelectPicker support fixed-row virtualization; DropdownMenu/Popover provide accessible overlays; Calendar/DatePicker share a calendar view, which DateRangePicker (start ~ end period) and MonthPicker (YYYY-MM) also use.

Use explicit subpaths `@devslab/dds-solid/input`, `/combobox`, `/select-picker`, `/dropdown-menu`, `/popover`, `/calendar`, `/date-picker`, `/date-range-picker`, `/month-picker`, or the existing root exports. Keep importing `styles.css` once. See the [common usage guide](https://github.com/devslab-kr/dds/blob/main/docs/components-input-choice-calendar.md).
