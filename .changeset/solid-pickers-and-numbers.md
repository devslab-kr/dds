---
"@devslab/dds-solid": minor
"@devslab/dds-css": minor
---

Add five Solid components, each exported from the root and from its own subpath (D-041; React parity is a follow-up):

- `TimePicker` (`/time-picker`): replaces the native `type="time"` dropdown with the Combobox control and list. Values are 24-hour `HH:MM` (`HH:MM:SS` is shown as `HH:MM`), the list steps every `step` minutes (default 10) and opens centered on the selection, typing filters by the start of the time, and a complete typed time is accepted even off the step.
- `DateRangePicker` (`/date-range-picker`): one field for a `{ start, end }` period with a range calendar and optional presets; submits `startName` / `endName`.
- `MonthPicker` (`/month-picker`): `YYYY-MM` with a year-paged month grid.
- `SegmentedControl` (`/segmented-control`): single-choice segmented buttons with radio semantics, `md` (40px) and `sm` (32px).
- `NumberInput` (`/number-input`): `number | null` with thousands separators, min/max/step, steppers and a unit suffix; submits the plain number.

Fixes: Combobox and SelectPicker controls are now 40px tall like Input and DatePicker (they were 42px) and no longer carry an empty 4px line below the control, so they line up with neighbouring fields; the Solid DatePicker text input now has the DDS input style, and clicking a form's reset button now restores Solid Combobox/SelectPicker values (the restore used to run before the browser cleared the controls).
