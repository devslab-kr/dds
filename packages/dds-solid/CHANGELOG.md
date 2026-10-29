# @devslab/dds-solid

## 0.29.3

### Patch Changes

- @devslab/dds-tokens@0.29.3
- @devslab/dds-css@0.29.3
- @devslab/dds-icons@0.29.3

## 0.29.2

### Patch Changes

- Updated dependencies [6ab7a49]
  - @devslab/dds-tokens@0.29.2
  - @devslab/dds-css@0.29.2
  - @devslab/dds-icons@0.29.2

## 0.29.1

### Patch Changes

- Updated dependencies
  - @devslab/dds-css@0.29.1
  - @devslab/dds-icons@0.29.1
  - @devslab/dds-tokens@0.29.1

## 0.29.0

### Minor Changes

- c645ff6: Add composable Layout, LeftNav and TopNav with shared geometry and typography across React, Solid, Vue and Svelte. Preserve ConsoleShell compatibility, add optional group disclosure and decorative icons, and unify mobile focus and keyboard navigation. Includes the new minimal Svelte application-shell package.

### Patch Changes

- Updated dependencies [c645ff6]
  - @devslab/dds-css@0.29.0
  - @devslab/dds-tokens@0.29.0
  - @devslab/dds-icons@0.29.0

## 0.28.0

### Patch Changes

- @devslab/dds-tokens@0.28.0
- @devslab/dds-css@0.28.0
- @devslab/dds-icons@0.28.0

## 0.27.0

### Patch Changes

- 867b98b: Move framework-neutral calendar styles to DDS CSS so Vue/Ark consumers can share DatePicker visuals without a React or Solid runtime. Existing framework styles continue importing DDS CSS.
- Updated dependencies [867b98b]
- Updated dependencies [867b98b]
  - @devslab/dds-css@0.27.0
  - @devslab/dds-icons@0.27.0
  - @devslab/dds-tokens@0.27.0

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

### Patch Changes

- e36292c: Add `TimePicker`, `DateRangePicker`, `MonthPicker`, `SegmentedControl` and `NumberInput` to `@devslab/dds-react`, each from the root and its own subpath (`/time-picker`, `/date-range-picker`, `/month-picker`, `/segmented-control`, `/number-input`), with the same props and value contracts as the Solid versions (D-042).

  Fix: clicking a form's reset button now restores React Combobox/SelectPicker and Input (React and Solid) values; the restore used to run before the browser cleared the controls.
  - @devslab/dds-tokens@0.25.0
  - @devslab/dds-css@0.25.0
  - @devslab/dds-icons@0.25.0

## 0.24.0

### Minor Changes

- a9630e0: Add five Solid components, each exported from the root and from its own subpath (D-041; React parity is a follow-up):

  - `TimePicker` (`/time-picker`): replaces the native `type="time"` dropdown with the Combobox control and list. Values are 24-hour `HH:MM` (`HH:MM:SS` is shown as `HH:MM`), the list steps every `step` minutes (default 10) and opens centered on the selection, typing filters by the start of the time, and a complete typed time is accepted even off the step.
  - `DateRangePicker` (`/date-range-picker`): one field for a `{ start, end }` period with a range calendar and optional presets; submits `startName` / `endName`.
  - `MonthPicker` (`/month-picker`): `YYYY-MM` with a year-paged month grid.
  - `SegmentedControl` (`/segmented-control`): single-choice segmented buttons with radio semantics, `md` (40px) and `sm` (32px).
  - `NumberInput` (`/number-input`): `number | null` with thousands separators, min/max/step, steppers and a unit suffix; submits the plain number.

  Fixes: Combobox and SelectPicker controls are now 40px tall like Input and DatePicker (they were 42px) and no longer carry an empty 4px line below the control, so they line up with neighbouring fields; the Solid DatePicker text input now has the DDS input style, and clicking a form's reset button now restores Solid Combobox/SelectPicker values (the restore used to run before the browser cleared the controls).

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

- ee945e0: Add Ark-based DatePicker to Solid with matching React behavior and DDS styling. Add createStatusPill to React with the same status catalog, localized labels and open-domain fallback semantics as Solid.

### Patch Changes

- @devslab/dds-tokens@0.21.0
- @devslab/dds-css@0.21.0
- @devslab/dds-icons@0.21.0

## 0.20.0

### Patch Changes

- @devslab/dds-tokens@0.20.0
- @devslab/dds-css@0.20.0
- @devslab/dds-icons@0.20.0

## 0.19.0

### Patch Changes

- Updated dependencies [22d2cea]
  - @devslab/dds-css@0.19.0
  - @devslab/dds-tokens@0.19.0
  - @devslab/dds-icons@0.19.0

## 0.18.0

### Minor Changes

- 8c14e54: Use Ark UI internally for accessible interactions while preserving DDS public APIs and visual tokens. Add a simple RadioGroup, retained tab panels with reactive disabled navigation, toast interaction pausing, and native form reset compatibility. Acknowledge Ark UI on DDS pages.

  Add optional manual tab activation, consumer element IDs, unstyled native composition, and a DDS-owned dialog frame/portal API. Authorized external focus containers participate in the modal's focus cycle and accessibility isolation, preserving retry actions without exposing Ark APIs.

  Allow native section dialog content while preserving dialog attributes, presence, and focus behavior for existing consumer markup contracts.

### Patch Changes

- @devslab/dds-tokens@0.18.0
- @devslab/dds-css@0.18.0
- @devslab/dds-icons@0.18.0

## 0.17.1

### Patch Changes

- @devslab/dds-tokens@0.17.1
- @devslab/dds-css@0.17.1
- @devslab/dds-icons@0.17.1

## 0.17.0

### Patch Changes

- @devslab/dds-tokens@0.17.0
- @devslab/dds-css@0.17.0
- @devslab/dds-icons@0.17.0

## 0.16.0

### Patch Changes

- @devslab/dds-tokens@0.16.0
- @devslab/dds-css@0.16.0
- @devslab/dds-icons@0.16.0

## 0.15.0

### Patch Changes

- @devslab/dds-tokens@0.15.0
- @devslab/dds-css@0.15.0
- @devslab/dds-icons@0.15.0

## 0.14.1

### Patch Changes

- @devslab/dds-tokens@0.14.1
- @devslab/dds-css@0.14.1
- @devslab/dds-icons@0.14.1

## 0.14.0

### Patch Changes

- @devslab/dds-tokens@0.14.0
- @devslab/dds-css@0.14.0
- @devslab/dds-icons@0.14.0

## 0.13.0

### Patch Changes

- @devslab/dds-tokens@0.13.0
- @devslab/dds-css@0.13.0
- @devslab/dds-icons@0.13.0

## 0.12.2

### Patch Changes

- @devslab/dds-tokens@0.12.2
- @devslab/dds-css@0.12.2
- @devslab/dds-icons@0.12.2

## 0.12.1

### Patch Changes

- @devslab/dds-tokens@0.12.1
- @devslab/dds-css@0.12.1
- @devslab/dds-icons@0.12.1

## 0.12.0

### Patch Changes

- @devslab/dds-tokens@0.12.0
- @devslab/dds-css@0.12.0
- @devslab/dds-icons@0.12.0

## 0.11.1

### Patch Changes

- Updated dependencies [c99f56e]
  - @devslab/dds-css@0.11.1
  - @devslab/dds-tokens@0.11.1
  - @devslab/dds-icons@0.11.1

## 0.11.0

### Minor Changes

- 6f4a2bc: A DataTable package, a status-pill factory and a console shell.

  `@devslab/dds-table` ships a `DataTable` component built on TanStack Table (pinned to the exact version `9.2.4`). Sorting is decided by the data shape, not a flag: `sort="client"` for a table holding its whole list, `sort={{ statedOrder }}` for a server-ordered, cursor-paged one — sorting a single page of the latter would misreport the whole. Paging is a plain link (`page.nextHref`), never a button, so cursor pagination works without JavaScript. Folding narrow columns is a CSS media query, not client-side column-visibility state. Every label the component renders is a required prop; none are baked in. `@devslab/dds-solid` adds `createStatusPill` — a factory whose rule is fixed (an unknown value in a closed domain throws, in an open domain it renders as raw text) while the domains, tones and labels are entirely the consumer's — and `ConsoleShell`, a rail-and-main layout with a skip link, a responsive nav drawer, and a page header; navigation items, copy, and routing are the product's. `@devslab/dds-css` gains the `.dds-table*` and `.dds-console-shell*` styles those two consume, plus a `.dds-visually-hidden` utility.

  DataTable 패키지, status-pill 팩토리, 콘솔 셸.

  `@devslab/dds-table`은 TanStack Table(`9.2.4` 정확히 고정) 위에 지은 `DataTable` 컴포넌트를 낸다. 정렬은 플래그가 아니라 데이터 모양이 정한다 — 테이블이 전체 목록을 들고 있으면 `sort="client"`, 서버가 정렬해 커서로 페이징한 것이면 `sort={{ statedOrder }}`(후자의 한 페이지만 정렬하면 전체를 잘못 보고하게 된다). 페이징은 버튼이 아니라 평범한 링크(`page.nextHref`)라 JavaScript 없이도 커서 페이징이 동작한다. 좁은 컬럼 접기는 클라이언트 쪽 컬럼 표시 상태가 아니라 CSS 미디어 쿼리다. 컴포넌트가 렌더링하는 모든 라벨은 필수 prop이고, 내장된 것은 하나도 없다. `@devslab/dds-solid`는 `createStatusPill`을 추가한다 — 규칙은 고정(닫힌 도메인의 미지 값은 throw, 열린 도메인은 원문 텍스트로 렌더링)이고 도메인·톤·라벨은 전적으로 소비자 몫이다 — 그리고 `ConsoleShell`(skip 링크·반응형 내비 드로어·페이지 헤더를 가진 레일+본문 레이아웃이며, 내비 항목·문구·라우팅은 제품이 정한다). `@devslab/dds-css`는 이 둘이 쓰는 `.dds-table*`·`.dds-console-shell*` 스타일과 `.dds-visually-hidden` 유틸리티를 얻는다.

### Patch Changes

- Updated dependencies [6f4a2bc]
  - @devslab/dds-css@0.11.0
  - @devslab/dds-tokens@0.11.0
  - @devslab/dds-icons@0.11.0

## 0.10.0

### Patch Changes

- @devslab/dds-tokens@0.10.0
- @devslab/dds-css@0.10.0
- @devslab/dds-icons@0.10.0

## 0.9.0

### Patch Changes

- @devslab/dds-tokens@0.9.0
- @devslab/dds-css@0.9.0
- @devslab/dds-icons@0.9.0

## 0.8.1

### Patch Changes

- @devslab/dds-tokens@0.8.1
- @devslab/dds-css@0.8.1
- @devslab/dds-icons@0.8.1

## 0.8.0

### Patch Changes

- @devslab/dds-tokens@0.8.0
- @devslab/dds-css@0.8.0
- @devslab/dds-icons@0.8.0

## 0.7.0

### Patch Changes

- @devslab/dds-tokens@0.7.0
- @devslab/dds-css@0.7.0
- @devslab/dds-icons@0.7.0

## 0.6.0

### Patch Changes

- Updated dependencies [fc15c3f]
  - @devslab/dds-icons@0.6.0
  - @devslab/dds-tokens@0.6.0
  - @devslab/dds-css@0.6.0

## 0.5.2

### Patch Changes

- Updated dependencies [487046d]
  - @devslab/dds-css@0.5.2
  - @devslab/dds-tokens@0.5.2
  - @devslab/dds-icons@0.5.2

## 0.5.1

### Patch Changes

- @devslab/dds-tokens@0.5.1
- @devslab/dds-css@0.5.1
- @devslab/dds-icons@0.5.1

## 0.5.0

### Patch Changes

- @devslab/dds-tokens@0.5.0
- @devslab/dds-css@0.5.0
- @devslab/dds-icons@0.5.0
