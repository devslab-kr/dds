# DDS Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Ship matching Solid/React input, overlay, virtualized choice and calendar surfaces with explicit package entries and a compatible Solid table rename.

**Architecture:** Keep framework packages and Ark behavior. UI parts share DDS semantic CSS; Calendar and DatePicker share an internal calendar view within each framework. The root and subpath entries expose the same modules. TanStack Virtual is used only by choice components.

**Tech Stack:** TypeScript, Solid 1.9.15, React 18.3/19, Ark UI 5.39.3, Vite, Vitest, Playwright, pnpm 9.12.3, Changesets.

**Spec:** `docs/superpowers/specs/2026-10-17-dds-components-and-packages-design.ko.md`

## Global Constraints

- DDS only; no edits, installs, tests or migrations in fm-dental.
- Input is general purpose: text/search/email/tel/url/password/number, not search-only.
- Keep existing native Select and DatePicker API; add SelectPicker separately.
- Both framework packages must have matching feature names and meanings; native ref/events/classes keep framework conventions.
- New choices use single string IDs; no implicit free-text commits. Virtualization defaults off; enabled defaults are 40px rows, overscan 5, maximum popup height 320px.
- Solid table becomes dds-table-solid; dds-table remains a same-version compatibility re-export.
- Preserve React DatePicker draft/validity/acknowledgement regression behavior; align Solid.
- No npm publication, remote push, external consumer edits or deployment in this run.

## Review Focus

- A required input is cleared: one change, form invalidity, visible control focus (Tasks 1, 2).
- Parent selection persists outside asynchronously replaced options: label and ID remain correct (Task 2).
- Far-offscreen option receives keyboard focus: active descendant exists and selection follows (Tasks 2, 5).
- Root/subpath modules are mixed: one provider/context and no duplicated framework runtimes (Task 4).
- DatePicker gets delayed repeated parent values or changes locale mid-draft: no reverted draft or duplicate callback (Task 3).

## File Ownership and Integration

Independent workers may implement Tasks 1–3 concurrently after reading the spec and this plan. They must not edit package manifests, indexes, build configs, shared CSS, lockfile or root scripts; the integrating worker owns Tasks 4–5. No worker may revert another worker's changes. Each worker records failing and passing targeted tests; commands involving setup wait for dependency installation.

### Task 1: General Input and InputGroup in both frameworks

**Files:** Create `packages/dds-{solid,react}/src/input.tsx` and `src/__tests__/input.test.tsx`.

**Interfaces:** `Input`, `InputGroup`, `InputProps`, `InputGroupProps`, `LabelPlacement = 'outside' | 'inside' | 'hidden'`. Input owns value/defaultValue/onValueChange, label/labelPlacement, clearable/clearLabel and field linkage; InputGroup owns start/end slots around one child. Shared CSS uses `dds-input-*` and `dds-input-group*` classes; no inline color values.

- [x] Add tests for email/password/type forwarding, external value updates, uncontrolled typing, one clear notification, required invalidity, readOnly, disabled, form reset, hidden and floating labels.
- [x] Run each file with its framework Vitest config; observe missing-implementation failure.
- [x] Implement using native inputs and existing Field conventions; pointer clear does not blur before commit and returns focus. Search icon/buttons are slots, not mandatory UI. IME Enter does not submit accidentally.
- [x] Run targeted tests and package type checks. Report CSS selectors needed to integrator.

### Task 2: Choices and overlays in both frameworks

**Files:** Create `packages/dds-{solid,react}/src/{choice-types,combobox,select-picker,dropdown-menu,popover}.tsx` (types may use .ts), focused `src/__tests__/choices.test.tsx` and `overlays-menu.test.tsx`.

**Interfaces:** Both frameworks export `Combobox`, `SelectPicker`, `DropdownMenu` and `Popover`. Compound overlay parts delegate to Ark. Choice options are `{ value: string; label: string; description?: string; disabled?: boolean }`; selection callbacks receive string IDs. Shared property names follow spec section 6. Explicit `filterMode='external'` bypasses local filtering; selectedOption supplies off-list labels; messages localize state labels. Integrator installs `@tanstack/solid-virtual` and `@tanstack/react-virtual`.

- [x] Add behavior tests for controlled/uncontrolled selection, local/external filtering, retained off-list labels, disabled/readOnly, empty/loading/error/retry, required/reset/name, IME and clear.
- [x] Run before implementing, record failure. Inspect installed Ark types for correct hooks/context, rather than copying obsolete samples.
- [x] Implement Ark choices and virtualizer integration. Cache highlighted row in rendered range as needed for valid active descendant, preserving logical collection navigation. Avoid all-option hidden selects. Implement native validation bridge with focus redirection.
- [x] Implement compound DropdownMenu with checkbox/radio/submenu and nonmodal Popover. Avoid nested native buttons. Preserve Ark focus/portal layering.
- [x] Run targeted tests and checks; document needed CSS selectors and browser-only validation gaps.

### Task 3: Calendar sharing and DatePicker parity

**Files:** Create `packages/dds-{solid,react}/src/{calendar,calendar-view}.tsx`; modify `src/date-picker.tsx`; extend date-picker tests and add calendar tests.

**Interfaces:** `Calendar` is controlled single-date inline Ark root with label/value/onChange/locale/timeZone/min/max/disabled/readOnly/startOfWeek/messages. `CalendarView` is private and consumes the enclosing Ark context; it never creates another root. `DatePicker` retains its existing value/onChange and validity contract; add labelPlacement and messages consistently. Date-only ISO storage never converts via UTC.

- [x] Pin independent calendar selection/month navigation/disabled/readOnly and DatePicker invalid-draft/required/locale/reset/delayed acknowledgement regressions before refactoring.
- [x] Observe failing new tests, then extract view and align Solid's input validation with existing React semantics. Preserve original React regression suites.
- [x] Run both framework date/calendar suites and package checks; report existing/new CSS selectors.

### Task 4: Package boundaries, styling and Solid table rename

**Files:** UI `src/index.ts`, package.json, Vite browser/server configs and styles.css; `packages/dds-css/src/{input,choice,menu,popover}.css`; table packages; Changesets config; root scripts; canary; name/release verification scripts and existing contract tests.

**Interfaces:** Explicit `./input`, `./combobox`, `./select-picker`, `./dropdown-menu`, `./popover`, `./calendar`, `./date-picker` entries and preserved root/CSS exports. All point to the same built modules with declarations; Solid server entries maintain browser/node/worker/workerd conditions. New package dds-table-solid owns table implementation, legacy re-exports all public types and DataTable.

- [x] Add executable packed-import checks for detailed entry paths and old/new table identity; run them to observe missing-path/package failure.
- [x] Move table implementation with its tests/configs/docs; replace old package with small compatibility re-export. Update every repository first-party dependency, script/filter, release list and package-name inventory (historical changelog text remains historical).
- [x] Implement multi-entry builds without duplicated contexts and explicitly externalize virtualizer dependencies. Add token-only CSS with input floating labels, focus-within, RTL logical layout, popup dimensions and disabled/touch states.
- [x] Install/update lockfile, add a changeset for the fixed group including the new package. Keep all packages at current version until Changesets release handling.
- [x] Run foundation/core checks, both framework tests/checks/builds, table contracts/tests/builds and packed import checks. Fix contracts that explicitly described the old package name without removing behavior protection.

### Task 5: Real browser, documentation and release verification

**Files:** React canary fixture, Solid preview fixture, `tests/browser` component-focused spec and config, package bilingual READMEs, relevant root README and verification scripts.

**Interfaces:** Examples cover general input (email/password/search), inside/outside/hidden label, clear and form, external search, 10,000-item choices, nested modal overlays, inline and popup date selection; no FM dependencies.

- [x] Add browser tests for far-index keyboard navigation with real active descendant, bounded option count, filter/reset/reopen scroll, required invalid focus, overlay Escape nesting, IME, and SSR/hydration where feasible in existing release harnesses.
- [x] Run focused Playwright cases; fix actual browser failures, do not use jsdom geometry mocks as acceptance evidence.
- [x] Update bilingual usage docs, show exact imports/styles and native-vs-custom Select distinction, table compatibility transition and Input's general purpose.
- [x] Run `pnpm verify`, framework and table tests/build/check, touched contract suites, meaningful browser suite and packed release gates. Record commands/results and any unavailable external-tool checks without claiming they passed.
- [x] Perform final branch review, fix actionable regressions, commit DDS changes and report branch/SHA, verification and remaining boundaries. Do not publish/deploy.

## Execution Ledger

Progress and deviations are recorded in `docs/superpowers/plans/2026-10-17-dds-components-progress.md`. Approval to implement was supplied by the user with the request to create the plan and proceed; there is no extra plan approval round. Work is isolated from the previous branch in the managed dds-components checkout.
