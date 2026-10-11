# DDS React and AG Grid Implementation Plan

> Use test-driven package implementation and integrate independently testable primitives and grid tasks. The user explicitly selected implementation of the agreed architecture in this chat.

**Goal:** Add Ark-based React DDS components and an AG Grid Community React wrapper without changing FM.

**Architecture:** Shared DDS design assets, separate React primitives and grid dependencies. Existing Solid APIs remain unchanged; no universal engine factory.

**Spec:** `docs/superpowers/specs/2026-10-11-react-ark-aggrid-design.md`

## Global constraints

- DDS only; FM untouched.
- React/React DOM peers `^18.3.0 || ^19.0.0`, verification React 19.3.0.
- Ark React 5.39.3; AG Grid React/Community 36.2.0, no Enterprise dependency.
- Existing fixed group 0.19.0 conventions and source-available license.
- Caller-provided words and labels; DDS semantic tokens and CSS.

## Tasks

### 1. Ark React primitives

- [ ] Add `packages/dds-react` manifest/config and failing behavior/SSR tests.
- [ ] Implement the component inventory and styling adapter; run RED/GREEN tests.
- [ ] Validate controlled modes, refs, nested overlays/focus restoration, StrictMode cleanup, labels and accessibility.
- [ ] Build ESM and declarations, document API and examples.

### 2. AG Grid React wrapper

- [ ] Add `packages/dds-table-react` manifest/config and failing SSR/theme/prop tests.
- [ ] Implement typed DataTable/native AG escape hatch and named hydration-safe browser boundary.
- [ ] Validate real Community behavior, updates, React cell renderers, refs/API and cleanup.
- [ ] Build ESM/declarations and document Community/Enterprise limits.

### 3. Integration and verification

- [ ] Update single workspace lockfile, package inventory/fixed group and changeset.
- [ ] Add a dedicated React browser fixture and tests for actual focus, overlays, grid keyboard/sort/filter/edit/selection, density and themes.
- [ ] Add packed fresh-consumer SSR/hydration/import verification and wire all new gates into normal CI/release.
- [ ] Run existing affected contracts and regression gates, review package contents and dependency boundaries.
- [ ] Commit complete implementation and create an attached reviewable DDS PR with exact verification evidence.

## Review focus

Nested overlays/StrictMode cleanup; controlled prop/ref updates; browser-free imports and stable initial hydration; real grid geometry/keyboard behavior; themed/long-label/mobile appearance. These must be covered by behavior tests, not implementation snapshots alone.
