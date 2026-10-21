# @devslab/dds-react

## 0.26.0

### Minor Changes

- cf70f0f: A loading Button keeps its size (D-043). The spinner used to sit beside the label and widened the button by about 24px, so neighbours moved and wrapped labels wrapped again whenever progress started. Now the label and icons stay in place and in the accessibility tree (the accessible name does not change) but are not painted, and the spinner is centred over them in the button's text color. Existing markup works unchanged, including text and a `.dds-spinner` placed directly in `.dds-btn` and `<a class="dds-btn">`; the React and Solid Buttons render the same markup as before. Keep the label the same while loading: the hidden text still sets the width. Products that reserved room for the spinner at all times can remove that workaround.

  A loading Button or IconButton is no longer dimmed, even when it is also `[disabled]` (the framework components set both): dimmed to 0.45 the spinner fell to about 2:1 against the button, below the 3:1 a status graphic needs. Pointer blocking and the disabled semantics are unchanged.

  Also fixed: under reduced motion the spinner stopped after one frame instead of slowing down, and in forced colors its gap filled in, leaving a still ring. It now keeps turning at half speed under reduced motion, and in forced colors it paints itself in system colors (a loading button uses the button face, a `GrayText` border and a `ButtonText` spinner).

### Patch Changes

- Updated dependencies [cf70f0f]
  - @devslab/dds-css@0.26.0
  - @devslab/dds-tokens@0.26.0
  - @devslab/dds-icons@0.26.0

## 0.25.1

### Patch Changes

- 437ae34: Put a Combobox, SelectPicker or TimePicker `id` on the visible control: the text box (Combobox, TimePicker) or the button (SelectPicker). Before this, the id only seeded Ark's prefixed part IDs, so the input was `combobox:<id>:input` and no element carried `<id>` itself. A form field that renders its own `<label for={id}>` could not reach the control: clicking the label did nothing and the control had no accessible name. Now the label names the control and focuses it on click. Other part IDs (`combobox:<id>:content`, `select:<id>:label`, …) are unchanged. Code that targeted `combobox:<id>:input` or `select:<id>:trigger` by string should use `<id>` instead.
- 437ae34: Render Combobox, SelectPicker and TimePicker without `style` attributes, so pages with a strict `style-src-attr` CSP no longer log violations. The hidden validation input and the option list carried inline copies of rules `choice.css` already has. Solid writes a static style object into the HTML it clones, and both frameworks server-render it as a `style` attribute, which such a CSP blocks (FM saw two per TimePicker). The rules now come only from `.dds-choice-validation` and `.dds-choice-content`. Load `@devslab/dds-css` (`dds.css` or `components/choice.css`) for the validation input to stay hidden, as for every other DDS component.
  - @devslab/dds-tokens@0.25.1
  - @devslab/dds-css@0.25.1
  - @devslab/dds-icons@0.25.1

## 0.25.0

### Minor Changes

- e36292c: Add `TimePicker`, `DateRangePicker`, `MonthPicker`, `SegmentedControl` and `NumberInput` to `@devslab/dds-react`, each from the root and its own subpath (`/time-picker`, `/date-range-picker`, `/month-picker`, `/segmented-control`, `/number-input`), with the same props and value contracts as the Solid versions (D-042).

  Fix: clicking a form's reset button now restores React Combobox/SelectPicker and Input (React and Solid) values; the restore used to run before the browser cleared the controls.

### Patch Changes

- @devslab/dds-tokens@0.25.0
- @devslab/dds-css@0.25.0
- @devslab/dds-icons@0.25.0

## 0.24.0

### Patch Changes

- Updated dependencies [a9630e0]
  - @devslab/dds-css@0.24.0
  - @devslab/dds-tokens@0.24.0
  - @devslab/dds-icons@0.24.0

## 0.23.0

### Minor Changes

- 1ba4fd4: Add `createPendingAction` (Solid) and `usePendingAction` (React) to track which of a screen's actions is running. Give each button its own key: `is(key)` drives only that button's loading state and `busy` locks the others. `run(key, task)` clears the state when the task settles and ignores a second start while one runs; `{ replace: true }` lets the latest request win instead. The task receives an `AbortSignal` that aborts on `reset()`, on a replacing run and when the component goes away, so screens no longer need their own request counters or mounted flags. Screens that passed one shared flag to every button spun all of them on a single click.

### Patch Changes

- @devslab/dds-tokens@0.23.0
- @devslab/dds-css@0.23.0
- @devslab/dds-icons@0.23.0

## 0.22.1

### Patch Changes

- Updated dependencies [4532626]
  - @devslab/dds-css@0.22.1
  - @devslab/dds-tokens@0.22.1
  - @devslab/dds-icons@0.22.1

## 0.22.0

### Minor Changes

- 52d463b: Add matching general-purpose Input/InputGroup, virtualized Combobox and SelectPicker, DropdownMenu, Popover, and standalone Calendar to Solid and React. Share calendar views with DatePicker while preserving draft validation and ISO storage. Publish explicit component subpaths without adding table engines to UI imports.

  Rename the Solid table implementation to @devslab/dds-table-solid. Keep @devslab/dds-table as a compatible same-version re-export, preserving existing consumers. No external consumer migration is required by this release.

### Patch Changes

- Updated dependencies [52d463b]
  - @devslab/dds-css@0.22.0
  - @devslab/dds-tokens@0.22.0
  - @devslab/dds-icons@0.22.0

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
