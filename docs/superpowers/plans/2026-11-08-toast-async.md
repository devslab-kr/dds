# DDS async Toast Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement task-by-task.

**Goal:** Add matching loading/update/promise/action Toast contracts in React,
Solid and Vue, update documentation, and publish the verified release.

**Architecture:** Keep the existing pinned Ark UI engine and DDS provider-owned
state. Each framework renders its native content type with identical lifecycle
and action behavior; shared CSS owns appearance.

**Tech Stack:** Ark UI 5.39.3, React 18/19, Solid, Vue 3, TypeScript, Vitest,
Playwright, pnpm, Changesets and GitHub npm trusted publishing.

**Spec:** `docs/superpowers/specs/2026-11-08-toast-async-design.md`

## Global Constraints

- Preserve provider isolation and existing API, localization and duration rules.
- No new runtime dependency, auto retry, optimistic business completion or SSR singleton.
- Promise completion must not undo explicit dismiss/clear/update/disposal.
- Work only in this existing folder; preserve four pre-existing unrelated docs.
- User explicitly authorized documentation updates, integration and deployment.

## Review Focus

- Late success/rejection after dismissal, manual update, clear or unmount.
- Rejection identity and a synchronous throw from the once-only task factory.
- Provider identity and a stale React API reference after prop rerender/StrictMode.
- Removing/replacing actions and keyboard activation inside a form.
- Loading-to-terminal expiry and long localized action/message layout.

## Tasks

- [x] 1. Extend existing React behavior tests and observe missing-feature failures;
  implement `toast.tsx`, exported types and package README pair. Verify DOM/SSR,
  typecheck and build. Root owns React and shared styling.
- [x] 2. Extend Solid existing primitive tests first, observe failures, implement
  the same contract and export types. Preserve scoped-document provider behavior.
  Update Solid README pair. Solid implementer owns only these Solid files.
- [x] 3. Extend Vue existing overlay tests first, observe failures, implement the
  same contract and exported types. Preserve OwnedPortal. Update Vue README pair.
  Vue implementer owns only these Vue files.
- [x] 4. Add DDS loading/action styles, update stories/framework browser fixtures,
  Ark and component guide pairs, and minor Changeset. Run behavior/browser tests,
  bounded desktop/mobile/light/dark Polish and detector once.
- [ ] 5. Independent API/lifecycle review; fix any concrete findings and recheck
  affected areas. Run repository required gates and record SHA/results.
- [ ] 6. Push PR, pass required CI, merge, complete Changesets release, verify npm,
  clean this task's local branch and temporary artifacts after main push.

## Progress and rulings

- Baseline main: `fb83b8e3294a1f9c943963a3194706f2fa8ad02a` (0.29.2).
- Branch: `sexysinny/dds-toast-async`; no new worktree.
- Preserved four existing docs byte-for-byte after switching from the older
  shared-notify-auth branch. Backup stash `4e40565ae3c015f1a1f64f76a4b1e567b651c664`
  is user-data preservation, not a task artifact to discard.
- Ruling: use awaitable Promise plus readonly id so callers can both await and
  supersede a pending notification without a second Promise API.
- Ruling: user selected Ark extension and explicitly requested implementation
  and release; proceed with the documented API choices without reapproval.
- Local implementation and independent review are complete; no remaining
  actionable finding. Unit/SSR/type/build, 24 distinct browser cases, three
  framework packed-consumer gates (React 18/19), documentation sync and the
  single Impeccable detector passed within the scope recorded in
  `docs/qa/toast-async-20261108/README.md`.
- Local full verify reached the unchanged AskLinq consumer-copy drift failure;
  React/Solid wrapper gates reached an unchanged scanner's manifest error for
  original ignored dds-auth artifacts. No checks were weakened, no sibling
  source/artifact was changed. Protected clean-checkout CI is still required.
- Next: feature PR, protected CI, merge, Changesets 0.30.0 version PR and npm
  trusted publishing; actual publication must be checked in the workflow and
  registry, not inferred from these local results.
- Feature PR: https://github.com/devslab-kr/dds/pull/129. Initial full CI on
  `86d8402` passed source/package gates, then caught two Vue geometry reads
  before Ark's placement transition had settled. A controlled-RAF diagnostic
  reproduced bottom 1110 -> 884 in a 900px viewport. Ruling: wait for mounted
  and full viewport entry, then preserve the original bounds assertions;
  no product CSS change. Rerun affected local browser checks and required CI
  on the amended head; do not retry an unchanged failing SHA to seek a pass.
