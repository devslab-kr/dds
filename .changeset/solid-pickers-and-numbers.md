---
"@devslab/dds-solid": minor
"@devslab/dds-css": minor
---

Add `TimePicker` to `@devslab/dds-solid` (also at `@devslab/dds-solid/time-picker`): a time-of-day field that replaces the native `type="time"` dropdown with the Combobox control and list. Values are 24-hour `HH:MM` strings (`HH:MM:SS` input is shown as `HH:MM`), the list steps every `step` minutes (default 10) and opens centered on the selection, typing filters by the start of the time, and a complete typed time is accepted even off the step. Solid only for now (React parity is a follow-up).

Fix: Combobox and SelectPicker controls are now 40px tall like Input and DatePicker (they were 42px because the 40px minimum applied inside the border).
