# DDS React and AG Grid support

## Approved intent and boundary

The user approved Ark UI as the common UI foundation and separate framework packages. Implement `@devslab/dds-react` and `@devslab/dds-table-react` in DDS only. Do not edit, install, test, migrate, merge, or deploy FM. Retain existing Solid packages and `dds-table` names and behavior. Do not create engine factories or new Solid table aliases in this change.

## React primitives

Provide the existing DDS basic component inventory in React: Button, IconButton, Field, Checkbox, Radio, Select, Switch, RadioGroup, Dialog, Tabs/TabList/Tab/TabPanel, Tooltip, Icon, ToastProvider/useToast, and ConsoleShell. Reuse DDS CSS/tokens/icons. Native semantic controls can remain native where the Solid API does; Ark owns composite keyboard, focus, modal, and toast behavior. Use React refs/hooks rather than emulating Solid accessors. Components expose normal React DOM props, caller-provided labels, controlled/uncontrolled modes where applicable, and stable IDs. No product business state or hard-coded locale copy. Expose parts/advanced Ark options where needed without reconstructing Ark internals.

Pin Ark React 5.39.3 to match existing Solid Ark. React and React DOM are peers (18.3 or 19); validate initially with React 19.3.0 and its corresponding type packages. Ship ESM, declarations, and explicit CSS export; imports and server rendering must work without browser globals. Document unavoidable framework differences.

## React data grid

Use `ag-grid-react` and `ag-grid-community` 36.2.0, no Enterprise dependency or commercial key. Export a typed generic `DataTable` with convenient `rows`, `columns`, accessible `label`, DDS density/theme defaults, and a documented way to pass native AG Grid configuration, callbacks, custom React cell renderers, modules and access its API. Do not implement sorting, filtering, resizing, editing, selection or virtualization anew. DDS theme maps semantic tokens to AG Grid theme parameters. Default useful Community column settings without changing server-side ordering or processing loaded pages as if they were the whole result.

AG Grid is browser UI: SSR emits a stable named loading/placeholder region; initial hydration matches it, then mounts the real grid in the browser. Do not claim SSR-rendered rows or a native HTML table. Support empty/loading data, changed rows, named multiple grids, keyboard navigation, actual sorting/filtering/selection/editing/resizing through AG Grid, and custom React cell content. Community/Enterprise feature boundaries and server datasource options are explicit in docs. Enterprise remains consumer-managed, not bundled by DDS.

## Distribution and verification

Follow repository licensing/public provenance conventions. Add new packages to the existing fixed release group at 0.19.0 and add a changeset describing the new React surface. Integrate meaningful DOM, SSR and browser tests, build/typecheck, accessibility and packed fresh-consumer import/render/hydration verification into CI and release. Verify browser React resolutions avoid Solid plugins, test unmount cleanup and refs, and check new dependencies do not enter existing Solid bundles. Add dedicated React examples and bilingual public READMEs without changing existing consumers. Keep AG Grid implementation separate so importing primitives does not import the grid engine.

## Review risks

- Nested overlays must close the intended layer and restore focus, including React StrictMode mount/unmount.
- React callback refs and controlled state must update without recreating Ark ownership.
- SSR/worker import must not read document/window; hydration must retain server markup before grid mount.
- AG Grid's virtualization requires real-browser geometry and keyboard testing, not only jsdom mocks.
- Dark/light tokens, touch widths, long labels, and caller locale text must retain readable DDS styling.
