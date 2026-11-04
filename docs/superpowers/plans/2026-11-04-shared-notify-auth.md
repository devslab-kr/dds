# Shared notification and login libraries Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development for independent library tasks and a fresh review before release. Track actual evidence here; do not treat source completion as production verification.

**Goal:** Supply reusable, versioned notification and DDS login packages, then connect qoqo/JN while preserving their authorization, sessions and duplicate prevention. JN release targets include web, mobile/Android and Windows PC (user clarification).

**Architecture:** Notify owns a provider-neutral server notification package and the SOLAPI adapter. DDS owns a separate headless auth contract and React login package; each app supplies its existing server/session adapter. Tax invoice issuance remains a separate future capability.

**Tech Stack:** TypeScript, ESM, injected Fetch/Web Crypto, React/DDS, existing npm/pnpm workspaces, existing Vitest/Workers/browser checks.

**Spec:** `C:/Users/jlc48/code/workspace/virtus-settlement/docs/platform-libraries-and-jn-release-handoff-2026-11-04.md` (user-provided continuation requirements).

## Global constraints

- Complete and verify fixed library versions before changing consumer app source.
- Do not create temporary folders, worktrees, or new GitHub Actions. Use existing repositories and preserve other work.
- Preserve qoqo UUID/outbox/CAS/unknown recovery and JN permission, invitation and linking checks.
- SOLAPI ATA uses native SMS fallback in one request; never send a second SMS after an unknown outcome.
- Never copy service keys, tokens, sessions or operational data between apps or into logs/source/commits.
- Google, Kakao and Naver are baseline provider names; configuration/support/readiness must be explicit.
- Preserve qoqo Supabase SSR and JN encrypted database BFF sessions. Accounts remains a migration integration.
- UI changes require advance notice, actual Taste review and final Impeccable Polish.
- Preserve Android signing identity and release records. No store submission before real web/Android verification.
- No actual tax invoice issuance or claim of implemented Popbill support.

## Review focus

1. A request times out after remote acceptance: return unknown, retain evidence and prohibit automatic resend.
2. HTTP success with malformed/partial acceptance: do not report completion; correlation is not idempotency.
3. Missing or duplicate auth provider configuration: fail closed and show a usable explanation.
4. Callback/return path manipulation: preserve original flow binding and reject unsafe redirect inputs.
5. Login unmount, rejection or repeated clicks: no duplicate starts, stale updates or stuck inaccessible state.

## Task 1: Notify provider package

**Owner:** `notify_library` agent, Notify repo only.
**Files:** `packages/notify-provider/*`, workspace manifest/lock, package documentation and reusable pack checks.
**Interface:** `NotificationProvider.send` distinguishes accepted/rejected/unknown. `lookup` distinguishes found/not_found/unknown. `createSolapiProvider` injects credentials, Fetch, Crypto and timeout.

- [x] Add failing behavior tests for ATA native fallback, timeout/5xx/malformed responses, safe recovery and replacement adapter.
- [x] Implement zero-runtime-dependency SOLAPI adapter without altering Notify billing/HTTP contracts.
- [x] Run package tests, typecheck/build and packed Node/Workers consumer verification.
- [x] Review exact artifact and publish/install fixed `@devslab-kr/notify-provider@0.1.0` after all gates pass.

## Task 2: DDS auth and login package

**Owner:** `dds_login` agent, DDS package/canary/docs only; controller owns this plan and progress file.
**Files:** `packages/dds-auth/*`, isolated React canary login fixture, workspace manifest/lock and package guide.
**Interface:** provider availability, safe auth errors and start/callback/session/sign-out adapter contracts; `LoginPanel` delegates start/navigation to app-supplied client.

- [x] Add failing behavior tests for configuration, errors, duplicate starts, redirects, keyboard/ARIA and SSR.
- [x] Implement `@devslab-kr/dds-auth@0.1.0`, React entry and styles using stable published DDS dependency range.
- [x] Apply Taste to the operational login composition and record final Polish on spacing, focus, wrapping, states and responsive layouts.
- [x] Run package tests/check/build, browser/accessibility checks and packed install verification.
- [x] Review exact artifact and publish/install the fixed version after all gates pass.

## Task 3: Consumer integration

**Owner:** assign after Tasks 1–2 release/install gate; current `consumer_audit` work is read-only.
**Files:** qoqo/JN manifests, existing notify providers and login UI/server adapters, existing focused regression tests.
**Consumes:** the two verified exact npm versions; existing app business events, recovery records and session backends.

- [ ] Record per-page current behavior and intended changes before source edits.
- [ ] Replace app SOLAPI transport duplication through the shared package while retaining app-owned intent/authorization/outbox/CAS/recovery.
- [ ] Connect real DDS LoginPanel clients/server adapters. Add JN Naver runtime/schema/profile verification through service-local Supabase custom provider.
- [ ] Preserve service-local account/invitation/link rules, all cookie/PKCE/callback checks and logout cleanup.
- [ ] Run targeted auth/notification tests and app-required checks. Record exact source revision and working-tree status.

## Task 4: JN template and release gates

- [x] Re-read handoff and query JN channel templates: 0 templates on 2026-11-04.
- [x] Verify existing event names, valid detail routes and recipient boundaries before creating request/completion templates (source audit; no operational records read).
- [x] Create and submit approved text. Both responses are INSPECTING; approval/sendable verification remains pending.
- [ ] Verify real Kakao/SMS fallback and all three logins on web/Android with authorized recipients/accounts.
- [ ] Only after those gates, prepare existing-identity store artifacts and continue One Store/Google Play registration; distinguish submission/review/publication.
- [ ] Implement and verify JN Windows app using qoqo's local React/DDS + isolated Electron main-process architecture; verify actual external browser return before PC release. qoqo's current Windows social handoff is not implemented and must not be claimed as working reference behavior.

## Decisions and verification record

- Ruling: the detailed continuation spec supplies implementation authorization; do not add a design approval loop.
- Ruling: use permanent plan/progress files and existing repos; user prohibition overrides skill scratch-workspace/worktree defaults.
- Ruling: isolate login in `@devslab-kr/dds-auth` instead of changing/releasing the existing DDS fixed train. Local DDS is 0.29.1, public latest is 0.29.2; preserve unrelated branch changes.
- Ruling: GitHub Packages matches Notify's existing package registry and authenticated access. Public npm `whoami` returns E401; no public npm credentials are created or copied. Exclude the separate GitHub auth package from the existing public npm Changesets train to preserve its release path.
- Registry evidence: Notify contract latest 0.3.0, Notify UI latest 0.2.0. Authenticated read succeeds using existing GitHub credential in process memory; no secret written.
- Baselines: DDS `91c5fa2`; Notify `2165aee`; qoqo `d7d5be3` (existing unrelated changes); JN `803fc80` (existing unrelated changes).
- State stack: login uses local ephemeral interaction state; no server-data cache or business input form introduced. Preserve each app's existing Query/Form/store design; reassess only if integration changes that scope.
- Both package release/install gates passed; see the progress record for versions, source commits, published integrity and Node/Workers evidence. NOT RUN: real provider login/send, web/Android/Windows acceptance and store submission.
- 2026-11-04 16:37–16:38 KST: created and submitted JN request template `KA01TP261104073723957S96EdmWErcJ` and completed template `KA01TP261104073737484vV01ms4SKOq`; both `INSPECTING`. No real message sent. Category 008002 was verified against current provider categories.
- Source event boundaries: invitation claim verifies recipient and `/join/<token>`; PG signing request verifies document/revision/rights/recipient and `/s/<token>`. Completed invitation acceptance/signing/confirmation exist, but completion notification event/outbox and verified recipient selection are not connected yet. No payout event inferred.
- User confirmed JN has no existing Naver app and requested setup after logging in. Registered service-local `정산나우` after explicit action-time approval of Naver API terms/privacy duties. PC/Mobile web use jeongsan.now and JN's own Supabase callback; name/contact email/mobile are optional. Development state only, review/login NOT RUN.
- Naver credential handling exception: newly created overview returned Client Secret in a tool result. No credential copied to source/files/commits. User completed reissue in console after a temporary reauthentication loop, entered credentials and approved provider activation. JN Supabase now shows `custom:naver` ENABLED; temporary credential variables were cleared. Do not repeat values or read the full credential overview again.
- Windows evidence: qoqo Electron 45.2.1/builder 26.18.0 builds local DDS bundles and NSIS installers; registered schemes alone do not handle OAuth. JN has no desktop scaffolding. Existing JN mobile BFF state/PKCE/one-time handoff can underpin a protected main-process adapter, but native route coverage, safeStorage and real cold/warm process callbacks require implementation/tests.
