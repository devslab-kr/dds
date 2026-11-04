# Shared notify/auth progress — 2026-11-04

Plan: [2026-11-04-shared-notify-auth.md](2026-11-04-shared-notify-auth.md)

## Current work

- Notify reusable adapter package: implementing; no app source changes authorized until release/install gate.
- DDS auth/LoginPanel package: implementation frozen; package/unit/packed consumer/browser checks passed. Commit/publish/registry install pending.
- qoqo/JN: read-only audit; existing uncommitted files preserved.
- JN templates: both created and submitted, `INSPECTING`; approval/sendability pending; no real send.
- Publishing: GitHub Packages read access verified; public npm authentication absent. Exact package release still pending.
- User added JN Windows PC release, matching qoqo's architecture. Web/mobile/PC all require actual login/return checks; qoqo Windows OAuth bridge is itself missing, so no ready-PC-login claim.
- JN Naver app registered after user approved terms. PC/Mobile web callback configuration entered, optional name/contact email/mobile; development state, review/login pending. User handoff for Client Secret reissue before protected Supabase setup; do not read/print full credential overview.

## Page tracking

| Page/surface | Current composition | Intended change and reason | Preserved behavior | Status |
| --- | --- | --- | --- | --- |
| DDS shared LoginPanel (new) | No component | Configurable brand, three providers, loading/error/unavailable/legal links; controlled SocialLoginOptions for existing apps | DDS button, focus, tokens; app-owned auth/session | Implemented; Taste/Polish and checks passed |
| DDS React canary `/login.html` | No fixture | Isolated, clearly labelled adapter simulation to verify states/mobile/theme/accessibility | Existing canary pages | Implemented; responsive/browser checks passed |
| qoqo login | Audit pending | Shared UI/client adapter after fixed package gate | SSR cookie/PKCE, invitation/link and device/store permissions | Read-only |
| JN login | Google/Kakao runtime, Naver UI type only | Shared UI and real Naver server boundary after fixed package gate | Encrypted BFF sessions, membership/organization/invitation/link rules | Read-only |
| JN Windows PC (new) | No desktop package | Local DDS bundle and isolated Electron transport, browser auth/PKCE return | Existing JN service/session/role boundaries; Android SIM only on Android | Read-only architecture audit; implementation pending |

## Verification evidence

- 2026-11-04: registry metadata read verified contract 0.3.0/UI 0.2.0/DDS React 0.29.2; JN template list empty.
- 2026-11-04 16:37–16:38 KST: request `KA01TP261104073723957S96EdmWErcJ`, completed `KA01TP261104073737484vV01ms4SKOq`; SOLAPI responses confirm `INSPECTING`. Fixed domain/button links and category 008002 verified. Completion recipient/event/outbox integration remains pending.
- DDS base `91c5fa2cafc829bdd26f4a38d6725f2406a62559` + owned package changes: 28 core + 9 UI tests PASS; package check/build and isolated login canary check/build PASS. Public DDS 0.29.2 packed consumer types/Node worker/SSR/hydration/error interaction PASS. Browser suite 2/2 PASS, followed by affected responsive 1/1 PASS after final CSS: six width/theme axe scans, keyboard focus, 48px targets, no overflow, actual logo load/contrast and Korean whole-word wrapping.
- Independent review found query escaping/trust revocation defects and Notify text-type/bytes/receipt-count gaps. Focused red→green regressions cover fixes. Root inspected desktop light/mobile dark screenshots; Korean wrapping fix followed that inspection.
- Taste retained quiet operational DDS hierarchy/tokens and actual brand assets; Impeccable Polish checked layout, spacing, focus, loading/error/unavailable states, desktop/tablet/mobile, both themes, long Korean text and dark Kakao mark visibility. Detector returned no findings. No marketing redesign or fake provider success.
- Existing full React-canary typecheck has unrelated ConsoleDemo nav shape/missing table declarations; login-specific config isolates the changed fixture. Full workspace/browser matrix was not rerun for this isolated new package.
- NOT RUN: registry release/install, app integration checks, real auth/send, web/Android/Windows and store release. These are incomplete gates, not successful checks.
