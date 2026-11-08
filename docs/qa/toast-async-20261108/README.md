# Async Toast verification — 2026-11-08

[한국어](README.ko.md)

Source baseline: `fb83b8e3294a1f9c943963a3194706f2fa8ad02a`; feature branch:
`sexysinny/dds-toast-async`. The PR's required CI identifies the final commit SHA.

## Scope and result

- Existing Ark UI retained. React/Solid/Vue expose matching loading, update,
  awaitable promise and action contracts; no new runtime dependency.
- Focused tests were observed failing before implementation. Additional review
  regressions reproduced reentrant message getter overwrites and duplicate
  provider region IDs before their fixes.
- React full suite before the final provider/getter refinements: 189 DOM tests
  and 8 SSR tests passed. Final affected primitive suite: 23 passed; final SSR:
  8 passed. Typecheck and declaration/runtime build passed afterward.
- Solid: full 177 DOM + 10 SSR tests, typecheck and client/SSR/declaration builds
  passed. Vue: full 71 tests across 9 files, typecheck and build passed.
- Framework entry/source contracts: 9 passed. Docs/token sync and diff checks
  passed. The Changesets plan resolves the twelve-package fixed group to 0.30.0.
- Real Chromium: 8 cases per framework, 24 distinct cases passed. Tests exercise
  stable IDs through loading/update/promise, action pointer/Enter activation,
  native button/form behavior, close-before-settlement and long localized text.
  Layout was checked at desktop/mobile in both themes; scoped desktop axe passed.
  React's affected 8 cases were rerun after the final runtime refinement; Solid
  was unchanged after its passing run and Vue used its final build.
- Independent final review found no remaining actionable defect. The single
  Impeccable source scan returned `[]`. Taste preserved the existing operational
  DDS hierarchy/tokens; Polish checked actual representative captures for
  spacing, alignment, wrapping, dark theme and action visibility. No redesign.
- Packed consumers passed: direct Solid release script (fresh import, SSR and
  hydration), direct React release scripts for 19.3.0 and 18.3.1 (fresh installs,
  types, Node/worker-condition SSR, hydration/disposal and export identity), and
  `pnpm run verify:vue:release` (fresh install, template types and Node SSR).
  These existing packed fixtures are general compatibility checks; new Toast
  interactions are exercised by the unit/browser cases above. Temporary
  consumers were removed by the scripts.

## Local environment limitations

The first full protected CI on `86d8402` passed source contracts and the package
gates through Vue/Svelte/table consumers, then failed two new Vue dark-theme
layout checks. A controlled-RAF browser diagnostic reproduced the exact
1110px bottom coordinate: Ark starts at `--y:100%`, opacity 0, before placement;
even after `data-mounted`, a short transition can remain until the next paint.
The settled bottom was 884px in the 900px viewport. Layout checks now wait for
Ark mount and whole-toast viewport entry before measuring, retaining every
original boundary/wrapping assertion. No product CSS change was justified.
Required CI runs again on the amended PR head; earlier skipped steps are not
reported as passing.

`pnpm run verify` completed all workspace builds, package checks and docs/token
sync, then failed the existing local-only consumer check: AskLinq's vendored
`apps/api/src/dds/tokens.ts` is stale. Token sources and the AskLinq repository
were not changed by this feature.

`verify:solid:release` and `verify:react:release` stopped at the unchanged
foundation-contract scanner because ignored artifacts from a different branch
leave `packages/dds-auth/` without a manifest. Those pre-existing artifacts were
preserved. The direct existing packed-consumer scripts are run separately;
protected CI/release retains the full original gates in a clean checkout.

Vue's packed gate checks Node SSR and template types; Worker SSR and browser
hydration are NOT RUN by that gate. Native OS screen-reader, IME and physical
mobile hardware checks are NOT RUN; browser keyboard/axe/viewport tests and
existing CSS reduced-motion/forced-color rules provide the recorded coverage.

## Captures

Six final representative screenshots are retained in this directory:
`{react,solid,vue}-{desktop-light,mobile-dark}.png`. They are reusable verification
artifacts; generated dependency consumers are temporary and removed by their
release scripts. UI fixture controls are demonstration controls, not business
success claims.
Set `DDS_CAPTURE_TOAST_QA=1` only when intentionally refreshing these captures.
Normal local/CI/release tests run every assertion without rewriting tracked
screenshots, keeping the publication worktree free of platform-specific capture
changes. The current Changesets git-cli version path resets first; the publish
path does not, so a clean test run matters independently of version-PR staging.

Publication status is recorded by the feature/version PRs, the GitHub
`Release public packages` workflow and npm provenance. A source change or this
local verification record alone does not establish publication.
