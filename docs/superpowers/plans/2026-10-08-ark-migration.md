# DDS Ark migration

The approved design keeps DDS public imports, simple props, semantic CSS tokens and licensing. Ark UI owns accessible interaction inside DDS wrappers. Native buttons and native selects retain native semantics. No second design-system package is created.

## Sequence

- [x] Establish browser and server test baselines; distinguish infrastructure errors from regressions.
- [x] Delegate tabs, dialogs, tooltips, checkable controls and toast behavior to Ark, preserving controlled/uncontrolled state, native form behavior and retained panels.
- [x] Verify keyboard navigation, focus restoration, reactive disabled state, form submission, timer disposal, SSR and accessibility. Update implementation-specific source assertions to delegation contracts supported by runtime tests.
- [x] Add linked Ark UI credits to DDS pages, bilingual migration guidance and a decision superseding the old reference-credit restriction for actual dependencies.
- [ ] Build and verify the package and review the complete diff before integration.
- [ ] Finish framework-neutral Workspace OSS and its adapters, then migrate consumers after DDS validation. FM remains read-only until its concurrent work is complete.
- [ ] Clean temporary checkout and branch after integrated changes are preserved.

## Review risks

The read-only reviewer found no remaining critical or important issues after compatibility fixes. Packed-package SSR and interactive browser-entry hydration pass in a fresh consumer. Browser interaction checks pass at 390×844 and 1280×720. Integration and temporary checkout cleanup remain pending.

Portal placement must not break CSS positioning or accessibility coverage. Reactive props must not become snapshots. Hidden panels must preserve instances. Radio grouping must remain native-form-compatible. Ark details objects must not escape DDS callbacks. Browser-only effects must not run during SSR. Package export conditions and bundled dependencies must work in consumers.

## Constraints

Work in the isolated `dds-ark` checkout on `codex/ark-wrappers`; preserve existing local DDS changes. Do not publish packages, deploy, or change FM business integrations. Homepage credits describe the actual Ark UI dependency, not authorship of the DevsLab visual design.
