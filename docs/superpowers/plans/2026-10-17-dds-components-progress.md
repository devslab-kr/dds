# Execution ledger — plan: docs/superpowers/plans/2026-10-17-dds-components.md

## Scope and baseline

- User approved design and requested planning plus implementation in this run. Input is general-purpose, not search-only.
- Worktree: managed dds-components checkout; branch sexysinny/dds-components, based on main 64c4dd3 plus design document.
- DDS only. FM-dental is excluded entirely from mutations and verification.
- Baseline main CI was already successful at 64c4dd3; dependency installation is performed in this new checkout. New changes require fresh verification.
- Pre-flight: Tasks 1–3 own disjoint source/test modules; integration owns manifests, CSS, exports, configs and lockfile. Calendar/DatePicker does not depend on Input implementation during parallel work; input layout CSS is shared at integration.
- Ruling: preserve framework packages and component subpaths, rather than a runtime factory; this keeps framework/engine dependencies explicit.

## Progress

- Plan: written; scope correction incorporated in spec.
- Task 1: complete. General Input/InputGroup in both frameworks; reset, dynamic form association and clear focus regressions fixed.
- Task 2: complete. Choice reset/controlled query issues fixed. Menu submenu registration and explicit RTL support fixed and covered in browser/tests.
- Task 3: complete. Shared calendar view, DatePicker parity and browser physical-focus regression verified in both frameworks.
- Task 4: multi-entry builds and table rename/compatibility implemented. Both framework checks/builds and table old/new builds passed. Name check 9 packages; 17 foundation/table/react contract checks and 5 component-entry checks passed. Added shared CSS and changeset.
- Task 5: isolated React/Solid fixtures and final 30/30 Playwright cases passed, including axe, nested popups and LTR/RTL submenu selection. Bilingual guides complete. Final full suites: React 89 DOM + 3 SSR; Solid 80 DOM + 5 SSR. Final checks/builds, entry checks 5/5, contracts 17/17, naming 9 packages passed. Packed React 19, React 18 and Solid fresh consumers all passed.

## Integration rulings and findings

- Ruling: preserve existing native `.dds-input` CSS by scoping new wrapper layout to `[data-label-placement]`. Avoid changing existing Field/native inputs.
- Ruling: compatibility table is exercised by the canonical table-solid release gate, with old/new export identity checks; do not duplicate full suites for the wrapper. Existing root verify:table:* commands remain equivalent aliases.
- Ruling: use existing Dialog layer 1000 plus shared `--dds-overlay-z-index` fallback 1001 for popups; no independent huge z-index values.
- Review: floating SelectPicker placeholder needed hiding when an inside label occupies the same space; CSS added.
- No FM files were opened for implementation or verification, and no external consumer edits were made.

## Final integration review

- General Input/InputGroup implemented in both frameworks, including email/password/search/native number use; external form association and clear focus regressions resolved. Solid 18 and React 17 Input tests pass.
- Choices now restore off-list selected labels on reset and controlled query blur, keep active virtual rows mounted, validate unique string IDs, and clamp row heights to a finite minimum of 40px.
- Standalone calendar uses the shared private view within Ark Content so keyboard highlight also moves physical focus. Browser focus regression passes both frameworks.
- Review found body portals hidden by modal isolation; Choice, Menu, Popover and DatePicker now resolve their enclosing dialog and use fixed positioning. Explicit portal overrides remain available on compound overlays. Final browser and fresh package verification passed.
- Full pnpm verify passed before final overlay adjustments; full UI tests passed Solid 78 DOM + 5 SSR and React 87 DOM + 3 SSR. Solid table 20 DOM + 2 SSR and fresh old/new compatibility installation passed. Final affected UI verification is repeated after overlay fixes.
- Browser tests use isolated DDS fixtures rather than expanding unrelated app pages; production consumer repositories are not required. Initial 18/18 browser cases passed; expanded cases revealed actual modal and submenu defects; final fixes verified in all 30 cases.
- Fresh consumer tests exercise root/subpath identity, browser-free SSR, worker SSR, StrictMode React hydration and Solid hydration. Missing jsdom CSS/HTMLHeadElement globals and popup-open timing were fixed in the harness; no diagnostic assertions were removed.

## Final verification

- `pnpm verify`: passed (workspace source/type/build and existing canary checks); final overlay changes subsequently passed both affected UI checks/builds.
- UI final DOM/SSR: React 89 + 3; Solid 80 + 5, all passed. Thread pool/maxWorkers=1 used under host load; previous fork startup timeouts were not counted as passes.
- `playwright test --config playwright.components.config.ts`: final 30/30 passed. Multi-surface axe test gets 90s for four analyses, keeping functional assertions unchanged.
- Entry checks: 5/5; foundation/table/react contracts: 17/17; package naming: 9/9.
- Solid table: 20 DOM + 2 SSR; canonical/compatibility fresh installation and export identity passed.
- Packed React 19.3.0 and React 18.3.1: fresh installation/types, Node/worker SSR, preserved server DOM hydration and disposal passed.
- Packed Solid: fresh installation/types, browser-free SSR, root/subpath identity, hydration and disposal passed; existing-version publish dry-run was skipped by the existing release gate.
- Native OS IME composition was not automated; composition event/Enter protections are covered in browser tests.
- No npm publish, remote push, deployment or FM-dental change/test performed.

## Completion

- All five implementation tasks completed, peer review findings resolved, final verification green. Implementation retained on `sexysinny/dds-components` in the managed DDS worktree.
- Final Popover description linkage assertions passed in both four-case overlay suites after the full UI suites. No implementation changes were made after final package builds.
- Existing repository versions remain unchanged; Changesets records the next release. Remote integration and publication remain outside this execution.
