# @devslab/dds-react

## 0.21.2

### Patch Changes

- a0031b0: Preserve invalid and incomplete DatePicker drafts, validate real Gregorian dates and ranges, and expose raw draft validity with a canonical API value. Prevent stale delayed controlled echoes from replacing newer input, forward required/readOnly constraints, and close the calendar when editing is locked.

  Use YYYY/MM/DD for Korean display while retaining YYYY-MM-DD for value, onChange, min/max and valid callback values. Consumers must guard API/button saves with validity, use the canonical callback value, and key separate editor identities to receive fresh initial reports.
  - @devslab/dds-tokens@0.21.2
  - @devslab/dds-css@0.21.2
  - @devslab/dds-icons@0.21.2

## 0.21.1

### Patch Changes

- Updated dependencies [73ae274]
  - @devslab/dds-css@0.21.1
  - @devslab/dds-tokens@0.21.1
  - @devslab/dds-icons@0.21.1

## 0.21.0

### Minor Changes

- f62eb14: Add a DDS DatePicker built on Ark UI with controlled ISO dates, Korean calendar labels, timezone selection, date bounds, keyboard navigation and DDS token styling.
- ee945e0: Add Ark-based DatePicker to Solid with matching React behavior and DDS styling. Add createStatusPill to React with the same status catalog, localized labels and open-domain fallback semantics as Solid.

### Patch Changes

- @devslab/dds-tokens@0.21.0
- @devslab/dds-css@0.21.0
- @devslab/dds-icons@0.21.0

## 0.20.0

### Minor Changes

- da365ec: Add Ark UI based React primitives and a DDS themed AG Grid Community React table. Share existing DDS tokens and styles, retain native engine APIs, and verify SSR, hydration, accessibility, real browser interactions, and packed consumers. Existing Solid packages remain supported.

### Patch Changes

- @devslab/dds-tokens@0.20.0
- @devslab/dds-css@0.20.0
- @devslab/dds-icons@0.20.0
