# Vue component parity and table implementation plan

> Execute inline with superpowers:executing-plans; one fresh whole-branch reviewer after implementation.

Goal: extend the approved native DDS Vue architecture to the existing React/Solid public component inventory and publish a separate `@devslab/dds-table-vue`.

User intent: proactively prepare the remaining components now, rather than waiting for individual EDS consumers. The user explicitly said to proceed. Existing token/CSS identity and the published four Vue components remain compatible.

Architecture: Vue components use Vue slots, v-model and native Ark Vue primitives. DDS CSS/tokens/icons remain the visual authority. Table uses AG Grid Community 36.2.0, matching the current React table; no Enterprise modules. AG Grid remains outside dds-vue's dependency graph. Maintain the existing lockstep version train and PR/Changesets release workflow.

## Inventory and deliverables
- [x] Controls: IconButton, Field, Select, Checkbox, Radio, Switch, RadioGroup, InputGroup, NumberInput, SegmentedControl.
- [x] Navigation/overlays: Tabs/TabList/Tab/TabPanel, Dialog, Tooltip, DropdownMenu, Popover, ToastProvider/useToast, ConsoleShell.
- [x] Choices/dates: Combobox, SelectPicker, Calendar, DateRangePicker, MonthPicker, TimePicker; public isolated subpath imports.
- [x] Helpers: usePendingAction/createPendingAction, createStatusPill; preserve date-only exports.
- [x] Table: DataTable, DataTableProps, DataTableDensity, GridApi exposure and semantic ddsGridTheme; reactive rows/columns/label, dense mode, loading, grid options/callbacks, SSR placeholder.
- [x] Test real selection/change, disabled/readonly, keyboard focus, validation and pending cancellation before implementing each group. Preserve existing 23 Vue tests. Table gets SSR and real browser sorting/filtering/resize/selection coverage.
- [x] Build/package gates: declarations, packed subpaths/CSS/license, fresh consumer, no React/Solid runtime, no table/virtualizer in basic input entry. Add table to lockstep/package registry and CI/release.
- [x] Bilingual package docs and component parity matrix; record explicit Vue slot/model conventions and remaining platform differences.
- [ ] One independent review, address material findings, PR/CI, Changesets version PR, publish and verify public registry installation. Update EDS to the release and recheck typecheck/build/store behavior.

## Review focus
1. Locked controls never emit user changes or lose native form semantics.
2. Overlay focus/portals belong to the enclosing dialog, Escape closes only the top layer.
3. Canonical date/month/time values reject invalid or reversed ranges without committing stale drafts.
4. Replaced/unmounted async actions abort and cannot clear a newer action's busy state.
5. AG Grid options/callbacks and reactive updates remain usable; SSR never constructs a DOM grid.

## Verification
Run focused Vue unit suites after each RED/GREEN group; `pnpm run verify:vue:test`, `pnpm run verify:vue:release`, table Vue equivalents and browser fixtures after integration. Run the required repository CI/release gates without bypass. No unsolicited redesign, EDS token promotion, application deployment or bulk EDS table migration.

## Ledger
- Ruling: match React's AG Grid implementation instead of Solid's TanStack implementation — React is the current advanced grid contract, and AG Grid has an official Vue adapter. Existing Solid package remains unchanged.
- Ruling: preserve previous native inline execution and release authorization; this is an extension of the already approved DDS Vue package architecture, and the user explicitly requested proactive parity and said to proceed.

## Final review and implementation evidence

Native Vue components and the separate Community grid are implemented. Vue unit suite: 44 passing; table unit/SSR: 2 passing; browser: 2 passing including actual range completion, nested overlays, grid sorting/filtering/resizing/selection, light/dark axe and desktop overflow. Source contracts 101 pass, repository build/check passes, frozen lockfile and 11-package names pass. Both packed release consumers pass (base gate repeated after review fixes).

One independent reviewer found four Important issues and no critical/minor issues. Range tentative selection, external date/time form validation, SelectPicker external form submission and numeric formatted blur were reproduced RED and fixed GREEN in a single pass. No deferred minors.

Rulings: choice virtualization/custom message-object parity remains explicitly deferred (cost: later extension for those consumers); publication/downstream EDS adoption are separate remaining verification gates; exhaustive AG Grid capabilities remain native consumer integrations while core Community interactions are tested. Product palettes and EDS table migration remain outside this request.
