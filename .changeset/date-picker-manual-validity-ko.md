---
"@devslab/dds-react": patch
---

Preserve invalid and incomplete DatePicker drafts, validate real Gregorian dates and ranges, and expose raw draft validity with a canonical API value. Prevent stale delayed controlled echoes from replacing newer input, forward required/readOnly constraints, and close the calendar when editing is locked.

Use YYYY/MM/DD for Korean display while retaining YYYY-MM-DD for value, onChange, min/max and valid callback values. Consumers must guard API/button saves with validity, use the canonical callback value, and key separate editor identities to receive fresh initial reports.