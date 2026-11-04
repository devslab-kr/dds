# Shared notify/auth progress — 2026-11-04

Plan: [2026-11-04-shared-notify-auth.md](2026-11-04-shared-notify-auth.md)

## Current work

- Notify reusable adapter package: published `@devslab-kr/notify-provider@0.1.0`, source `757dd391a8c74eb6ac2a88318ccde1c12958d8e5`; registry integrity matches verified tarball. Registry install, Node-only/DOM types, Node and real Workers execution PASS.
- DDS auth/LoginPanel package: published `@devslab-kr/dds-auth@0.1.0`, source `8026adaf9b2c0b289a5639d9193eeda48c32ade3`; registry integrity matches verified tarball. Registry install and Node worker/SSR/hydration/error interaction PASS.
- qoqo/JN: library release/install gate passed; source integration authorized. Existing uncommitted files remain outside this task.
- JN templates: both created and submitted, `INSPECTING`; approval/sendability pending; no real send.
- Publishing: both exact versions published to existing GitHub Packages infrastructure. Public npm credentials were not created/copied. Separate auth package is excluded from the existing public npm Changesets release train.
- User added JN Windows PC release, matching qoqo's architecture. Web/mobile/PC all require actual login/return checks; qoqo Windows OAuth bridge is itself missing, so no ready-PC-login claim.
- JN Naver app registered after user approved terms. PC/Mobile web callback configuration entered, optional name/contact email/mobile; development state, review/login pending. User completed Client Secret reissue and entered credentials. After explicit activation approval, JN Supabase `custom:naver` is ENABLED (OIDC issuer nid.naver.com, openid/profile, provider-local email optional). Google/Kakao and global Confirm email remain enabled. Temporary credential variables cleared; no raw credential in source/files/commits.
- Naver branding: existing JN 512px symbol and business category saved and verified by reload. No review submitted, no actual OAuth acceptance yet. Naver documents a 30-day overlap for reissued secrets; reissue is not evidence of immediate revocation of the prior key.
- qoqo integration source is frozen on `sexysinny/shared-platform-libraries` from `d7d5be3b6ee6dbf0daeeb17a60d1d1b6853ae072`. Exact package versions installed; Worker167, social server/state26, native UI103, workspace types, web/native builds and Worker dry-run PASS. Same compiled web build `RX-jYrP0gu8F0y_WQyhMQ`: nine cases PASS, then failed/affected four PASS, covering twelve distinct cases. Independent review pending; no commit/deployment/live OAuth/send.
- User explicitly requires JN screens/assets inside the app and offline operation. Windows design reuses the real JN DDS UI, encrypted scope-bound GET snapshots and explicit draft restore. Financial/contract/send mutations require online current authority/CAS and never auto-submit on reconnect. Root business-only desktop proxy has ten focused tests PASS; the Windows client/installer is not implemented yet.

## JN release isolation — current hold

The source UI chat explicitly requested release isolation for its already committed UI work plus its own authentication-test fix. All agents stopped JN writes/tests/builds. Our 58 owned JN files are preserved in named stash `codex-jn-shared-auth-notify-desktop-2026-11-04-release-isolation`, object **`4ea6f8a8fe30c083dc2f5c3c12384ba96402d60b`**, created on source UI HEAD `339c811a24520a7f983565cee112054e0a2084f2` and branch `sexysinny/list-search-loading`.

Preserved groups: auth23 (including new Naver profile/shared social UI/query isolation), notifications27 (including disabled completion outbox SQL/protected dispatcher/template policy), root8 (package.json, package-lock.json, .npmrc, desktop proxy/map/route/test and Windows implementation document). New files are in the stash's third parent. Use the object ID rather than a mutable stash index to restore after the separate release; inspect any intervening source changes first. Do not drop the stash before verified restoration.

Excluded files were hashed before/after and unchanged: `tests/client/validated-form-render.test.ts` (source UI's seven passing cases), both existing Android documents and `next-env.d.ts`. Existing untracked Android/design/browser material remains untouched. Numkey0.6.1 is retained in the restored HEAD manifests. The remaining tracked dirty files are exactly those four exclusions. Extra installed package directories are not deployable source.

JN source verification before isolation: notification focused16files171 tests PASS; auth runtime90 PASS and UI keyboard/loading/responsive/axe checks PASS, with earlier affected checks recorded separately in the stashed guides. No combined final suite/build was run after the latest changes. The independent auth review found remote-session cleanup incomplete in identity-link post-exchange exceptions; fix plus regression is pending restoration. Also investigate synthetic Naver contact checks across password/recovery paths and BFCache transient navigation-lock reset. Completion outbox still needs an automatic bounded postcommit scheduling path before claiming end-to-end completion notifications.

JN modifications remain frozen until the source UI release finishes. Other repositories may continue. No JN remote SQL, deployment, financial write, OTP/send, or store submission was performed by this task.

## Cleanup exception

The two root registry-check tarball files were safely removed individually. Automatic approval review rejected recursive removal of this task's Notify registry consumer dependency/cache directories before dispatch (`blocked by policy`). They remain at `C:\\Users\\jlc48\\Documents\\Codex\\2026-10-17\\separation\\notify\\packages\\notify-provider\\tests\\consumer\\node_modules` and sibling `.wrangler`; no alternative deletion method was used to bypass that rejection. Existing qoqo artifacts and the DDS reusable consumer dependencies were preserved.

## Page tracking

| Page/surface | Current composition | Intended change and reason | Preserved behavior | Status |
| --- | --- | --- | --- | --- |
| DDS shared LoginPanel (new) | No component | Configurable brand, three providers, loading/error/unavailable/legal links; controlled SocialLoginOptions for existing apps | DDS button, focus, tokens; app-owned auth/session | Implemented; Taste/Polish and checks passed |
| DDS React canary `/login.html` | No fixture | Isolated, clearly labelled adapter simulation to verify states/mobile/theme/accessibility | Existing canary pages | Implemented; responsive/browser checks passed |
| qoqo `/ops` login | Existing form440px / outer490px | Common provider buttons, truthful status/branding | Credential form, roles, current width/spacing | Advance notice sent; integration next |
| qoqo `/manager` menu/translations/quick/staff login | Shared login branch/card | Same controlled common provider list | Business panels, photos, dirty/CAS and navigation | Advance notice sent; integration next |
| qoqo `/store` staff/kitchen/tables login | Existing480px/frame gates | Common provider rendering | PIN/device/store roles, existing forms and dimensions | Advance notice sent; integration next |
| qoqo photo-editor login | Wide working modal | Common provider list only | Wide editing space, photo workflow and modal scope | Advance notice sent; integration next |
| qoqo `/account` | Login card and five equal48px tabs | Common login UI; existing social-link/security semantics | Five tabs, successful-provider preference, link UUID/CAS | Advance notice sent; integration next |
| qoqo `/join` | Provider-first520px invitation signup | Common provider UI | Age14/legal/current version/contact proof/invitation binding | Advance notice sent; integration next |
| qoqo `/confirm` | Existing520px recovery/reauth | Common provider rendering where present | Recovery/reauth UUID and server result rules | Advance notice sent; integration next |
| JN `/login` | DDS ServiceAuthFrame, credentials, two provider rows | Common UI/official marks, three truthful provider rows and Naver adapter | Form width, MFA/password/recovery/migration/next flow | Advance notice sent; integration next |
| JN `/join/[token]` | Invitation summary, verified contact/OTP | Shared login continuation | Server-bound invitation/contact and membership acceptance | Advance notice sent; integration next |
| JN `/app` account security | Existing password/social-link/TOTP UI | Naver availability/link adapter, shared provider semantics | Reauth/MFA/CAS and current app shell | Advance notice sent; integration next |
| JN invitation forms | Email/SMS plus Kakao pending hint | Truthful native fallback policy/config state | Claim/outbox/authority/contact recheck; no unknown resend | Advance notice sent; integration next |
| JN contract sending/completion | Native SIM and external share; actual document states | Separate server-provider intents/events and completion outbox | Android SIM path, original document/rights/revision/link checks | Advance notice sent; integration next |
| JN `/s/[token]` | Public signing/details | Review status meaning; no unsupported confirmation claim | Existing signed/confirmed public projection and signing integrity | Review/maintain unless justified by actual integration |
| JN mobile authorize/Windows PC (new) | Android BFF handoff; no desktop package | Accurate device copy, isolated Electron local DDS bundle/transport and browser auth return | Existing BFF/session/role boundaries; Android SIM only on Android | Advance notice sent; implementation next |

## Verification evidence

- 2026-11-04: registry metadata read verified contract 0.3.0/UI 0.2.0/DDS React 0.29.2; JN template list empty.
- 2026-11-04 16:37–16:38 KST: request `KA01TP261104073723957S96EdmWErcJ`, completed `KA01TP261104073737484vV01ms4SKOq`; SOLAPI responses confirm `INSPECTING`. Fixed domain/button links and category 008002 verified. Completion recipient/event/outbox integration remains pending.
- DDS base `91c5fa2cafc829bdd26f4a38d6725f2406a62559` + owned package changes: 28 core + 9 UI tests PASS; package check/build and isolated login canary check/build PASS. Public DDS 0.29.2 packed consumer types/Node worker/SSR/hydration/error interaction PASS. Browser suite 2/2 PASS, followed by affected responsive 1/1 PASS after final CSS: six width/theme axe scans, keyboard focus, 48px targets, no overflow, actual logo load/contrast and Korean whole-word wrapping.
- Independent review found query escaping/trust revocation defects and Notify text-type/bytes/receipt-count gaps. Focused red→green regressions cover fixes. Root inspected desktop light/mobile dark screenshots; Korean wrapping fix followed that inspection.
- Taste retained quiet operational DDS hierarchy/tokens and actual brand assets; Impeccable Polish checked layout, spacing, focus, loading/error/unavailable states, desktop/tablet/mobile, both themes, long Korean text and dark Kakao mark visibility. Detector returned no findings. No marketing redesign or fake provider success.
- Existing full React-canary typecheck has unrelated ConsoleDemo nav shape/missing table declarations; login-specific config isolates the changed fixture. Full workspace/browser matrix was not rerun for this isolated new package.
- Notify final provider 63 tests/typecheck/packed types+Node+real Workers PASS; existing API 25 files/382 tests PASS and queued full workspace build/old contract+UI dry-run pack PASS on committed tree. Earlier unchanged contract59/core50/UI28 tests passed separately; do not add these into a fabricated single-run total.
- Published integrity: auth `sha512-oIrfAvIeg7EwaUFLLrjJ0zQdcFVRLHSX5D2mE8INcw+b3gBt9HjcO2jzJXZ6RmCdFjZvpLkF2chHK8F5yn1brg==`; provider `sha512-fJyA6ZB3Jx0iZAV8u9v6jcBxccII44C6E/67akWdKpBTgq/HSuPsT09dVF4/efbf0eRMeDz9aFJR/htlloqplw==`.
- NOT RUN: app integration checks, real auth/send, web/Android/Windows and store release. These are incomplete gates, not successful checks.
