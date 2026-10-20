---
"@devslab/dds-react": minor
"@devslab/dds-solid": patch
---

Add `TimePicker`, `DateRangePicker`, `MonthPicker`, `SegmentedControl` and `NumberInput` to `@devslab/dds-react`, each from the root and its own subpath (`/time-picker`, `/date-range-picker`, `/month-picker`, `/segmented-control`, `/number-input`), with the same props and value contracts as the Solid versions (D-042).

Fix: clicking a form's reset button now restores React Combobox/SelectPicker and Input (React and Solid) values; the restore used to run before the browser cleared the controls.
