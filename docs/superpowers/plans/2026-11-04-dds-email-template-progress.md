# DDS email template — 2026-11-04

**Published:** `@devslab-kr/dds-email-template@0.1.0` to existing GitHub Packages, internal visibility inherited from `devslab-kr/dds`. [Package](https://github.com/orgs/devslab-kr/packages/npm/package/dds-email-template) · [version 0.1.0](https://github.com/orgs/devslab-kr/packages/npm/dds-email-template/1500647863). Created 2026-11-04 20:16:39 KST. Source commit **`14ac038f050a2b22196ee422f63d8b91101fc8e9`** on existing shared branch; no main merge or branch switch.

Final commit-based 123 tests, strict typecheck, build, packed Node/Node-types/DOM-types/real Workers execution, clean fixed-version registry installation and tarball/registry integrity all PASS. Final browser 25/25 covers identical source/fixture hashes at this commit. Independently reviewed with no remaining actionable findings.

Original session: install this exact version and import `renderEmail`. Retain only brand configuration and purpose-specific content builders in consumers; do not copy template source. See [package README](../../../packages/dds-email-template/README.md) for complete JN/qoqo brand settings, type/API examples, registry setup and the separate Supabase/CF integration boundary. Existing auth/provider 0.1.0 are unchanged.

## Scope and ownership

- Authorized: reusable pure renderer `@devslab-kr/dds-email-template@0.1.0`, real-brand configuration fixtures, previews, tests, packed Node/Workers verification, independent review, GitHub Packages publication and consumer guide.
- Workspace: existing `C:/Users/jlc48/code/workspace/dds`, shared `sexysinny/shared-notify-auth`. No worktree, scratch project, branch switch, main merge, full staging or manual Actions dispatch.
- Own only `packages/dds-email-template/**`, this document, new empty lock importer and Changesets ignore entry. Existing shared notify/auth progress document belongs to the other session and must remain unstaged.
- Do not change published auth/provider 0.1.0, JN/qoqo consumer source, SMTP/hook, Auth, environment keys, DB, deployment or billing.

## Design and page tracking

Read installed Taste `C:/Users/jlc48/.agents/skills/design-taste-frontend/SKILL.md` and Impeccable `C:/Users/jlc48/.agents/skills/impeccable/SKILL.md`, `reference/polish.md`, `reference/craft-floor.md`, `reference/operate.md`. Ran `impeccable context` once for the new package target; no package PRODUCT/DESIGN existed. This is a scoped extraction of incumbent email identities, not an approved replacement visual world. Use service source as visual authority; no root product context invented. Operate/Read, design variance 3, motion 0, density 4. Email inline CSS, presentation tables and installed system fonts take precedence over web landing defaults.

Advance notice sent before implementation: shared logo/name, title/divider, introduction, real details, explicit code and/or action, supplied safety/footer. No invented expiration, authority, performance or delivery state.

| Surface | Existing evidence and retained identity | Intended change and reason | Status |
| --- | --- | --- | --- |
| Shared frame | Existing table-based Korean operational emails | One pure renderer; safe input/config replaces copied template source | Implemented; Taste/Polish reviewed |
| JN OTP8 | `supabase/templates`: 32px JN symbol, 정산나우, cyan/dark CTA, 8-digit email OTP | Configured shared frame; requesting-screen expiry language supplied by fixture | Implemented; normal/200%/blocked-image PASS |
| JN code variants | email-change/magic-link local previews, not saved operationally | Preserve code-only semantics; do not imply production save | Email-change8 fixture and shared OTP8 support implemented; upstream unchanged |
| qoqo OTP6 | Existing 코코 renderer, 184x68 logo, blue CTA | Explicit six digits only for this use case | Implemented; three viewport widths PASS |
| qoqo details/action | Existing introduction/detail/action/safety/footer order | Shared renderer with supplied detail fields and safe action | Implemented; three viewport widths and keyboard PASS |
| Stress/images hidden | Long Korean/email/action; narrow viewport | Verify wrapping, no horizontal overflow, readable logo fallback and text alternative | Implemented; mobile/desktop/blocked images/200% PASS |

JN sources read only: `C:/Users/jlc48/code/workspace/virtus-settlement/supabase/templates/{confirmation,recovery,email-change,magic-link}.html`. qoqo source read only: `C:/Users/jlc48/workspace/qoqo/apps/ai-worker/src/email-templates.ts` and tests. Brand fixture provenance will live next to fixtures. No real recipient, auth token or production callback is used in examples.

## Implementation decisions

- Framework-free ESM and `.d.mts` declarations; no runtime dependencies, React, Node-only APIs or network access.
- `renderEmail({brand, content, policy, language?})` returns `{subject, html, text}`. Explicit six/eight digit verification. No mail transport or auth permissions.
- Add `colors.onPrimary`, `colors.heading` and `brand.align` to preserve current CTA foreground/title/logo arrangements. No raw HTML/style option.
- Fail closed on invalid input; escaped body/attributes; strict hex colors and HTTPS exact-origin allowlists; input values never enter validation messages. Action/asset allowlists are separate.
- React/Next Query/Form/shared-state comparison: not applicable; package contains no React application, server state, forms or shared UI state.
- New package excluded from existing public npm Changesets release train, as existing GitHub Packages auth package is.

## Verification and release

Pre-commit implementation checks PASS: 123 security/content tests and strict JS/declaration typecheck; preliminary tarball Node import, NodeNext without DOM and DOM Bundler without Node types; real local Miniflare 5/workerd rendering/error equality, no nodejs_compat. Preliminary tarball predates final docs/polish and was replaced by the verified release tarball. Final commit-based evidence follows below.

Final browser correction round: **25/25 PASS** (7 fixtures x 320/768/1280, JN/stress image-blocked and 200% text). Chromium 151.0.7922.34, axe 0, network failures 0, unexpected requests 0, overflow 0, CTA keyboard focus PASS and minimum 52px. The first batch was 24/25: JN OTP8 at 320px/200% text overflowed due to nowrap; removed that restriction, retained exact eight-digit DOM/plain text. No further browser rounds are required for unchanged source. Real logos loaded with correct intrinsic/display ratios. Blocked JN alt fallback may wrap in a browser-specific box, but the independent live service name stays readable.

Taste retained approved names/logo/color and quiet operational hierarchy. Polish inspected spacing/alignment/type, whole-word Korean and long identifier/URL/button wrapping, footer contrast, native focus, alternative text and mobile/tablet/desktop. JN footer uses its existing body color on outer background because the old muted color fell below 4.5:1 there. No animation, marketing typography, invented data or auth state. Manual Impeccable detector on all generated HTML returned `[]`.

Independent source review: no remaining actionable findings; 123 tests/typecheck PASS plus 32 invalid-input probes and deterministic rendering of 7 fixtures. A P3 language metadata documentation mismatch was resolved by explicitly documenting the supported ASCII tag shape and consumer-owned full validity. Final renderer Git blob `177803595c032f279b64625a05e79364e44dc8e5`; SHA256 `a1b29049e47c77b434f42b66123681bfab589c1caf79774cb1b0c74c4ba8c146`; fixtures SHA256 `689f095a77339e0b61738056b7a23216070eaff882eda043982ba55cdac40506`. Browser batch verified source unchanged.

Local reviewable evidence (ignored, synthetic only):

- `test-results/dds-email-template/previews/index.html` and seven HTML/text pairs plus manifest.
- `test-results/dds-email-template/browser-round-2/report.json` and 25 screenshots.
- `test-results/dds-email-template/impeccable-detect.json` = `[]`.
- `final-source-tests.log`, `local-consumer.json`, `publication.json`, `registry-consumer.json`, all recorded at source commit 14ac038.

Frozen lockfile check: `pnpm --filter @devslab-kr/dds-email-template install --frozen-lockfile --ignore-scripts --offline` PASS. No new dependencies; new empty workspace importer only.

## Release evidence and handoff

- Source `14ac038f050a2b22196ee422f63d8b91101fc8e9`; only 25 owned files committed. Other session's dirty shared notify/auth progress document was excluded. No branch switch, main merge, manual Actions dispatch or republish of auth/provider.
- `pnpm --filter @devslab-kr/dds-email-template run check` PASS, strict JS+declarations.
- `node --test --test-reporter=spec packages/dds-email-template/tests/render-email.test.mjs` PASS 123/123, zero skipped/failures, same source commit.
- `node packages/dds-email-template/scripts/verify-package.mjs --keep-tarball` PASS: build, actual tarball install, Node 24.12.0, TypeScript 7.0.2 NodeNext without DOM / DOM Bundler without Node ambient declarations; actual Miniflare 5.20260828.0-alpha/workerd 1.20260828.1 output and generic validation errors equal Node. No nodejs_compat or DOM mocks.
- Tarball inspected: exactly 5 files (`LICENSE`, `package.json`, `README.md`, `dist/index.mjs`, `dist/index.d.mts`), 11.7kB packed/31.3kB unpacked, zero runtime/peer dependencies. Published the exact tested tarball with authorized existing gh identity `jlc488`; npm token only in child-process environment, no token file/output/commit. npm logs disabled during authenticated operations.
- Registry integrity **`sha512-g2Tfv53VbEaky/5cpi/OUCR7OoHf6Lq3vz22Lp6q6qNQKEkYMhasx4miOiVezm1rOZhE8nRShhzZqyQBqiPYLQ==`** equals local verified bytes. SHA1 `a1e3c887b902f8420348dff55e4eeb39bc87926f`; SHA512 hex `8364dfbf9dd56c46a4cbfe5ca62fce50247b3a81dfe8bab7bf3db62e9eaaeaa3502849183216acc789a23a255ece6d6b399844f27452861cd9ab2401aa23d82d`.
- `node packages/dds-email-template/scripts/verify-package.mjs --registry=https://npm.pkg.github.com` PASS under transient auth env. Registry metadata matches local integrity; prior local installed package removed only after exact resolved-path/name/version checks; fresh separate registry cache; exact remote 0.1.0 installed. Installed renderer/declarations match source-built dist, Node/types/real Workers rerun PASS. Release tarball removed by verifier after verification; permanent fixture and reusable installed dependency/evidence remain.
- GitHub API read-only verification: package linked to `devslab-kr/dds`, visibility `internal`, version `0.1.0`; no access/visibility mutation.
- Full workspace tests/build: NOT RUN; isolated new package and its minimal workspace/Changesets entry do not change the existing DDS packages. Existing repository-wide browser/release matrix was not claimed. No CI run was manually started.

Consumer installation requires a separately provisioned `read:packages` build credential. Do not copy broad local gh credentials into Vercel/CF. Configure `@devslab-kr:registry=https://npm.pkg.github.com`, env-reference auth in consumer npm config, and install `--save-exact @devslab-kr/dds-email-template@0.1.0`; commit its lockfile. Rendering is `renderEmail({brand,content,policy,language?}) -> {subject,html,text}` with explicit 6/8 digits and independent action/asset origin allowlists. Full JN/qoqo logo/color settings and usage are in package README and synthetic fixtures.

The library is ready for the other session's consumer integration. It does not make JN/qoqo operationally complete. Hosted Supabase HTML templates cannot import npm modules; an authorized CF sender/hook integration remains separate. Actual Gmail/Outlook/Apple Mail receipt/rendering, live auth callbacks, SMTP/hook configuration, production sends, DB, deployment, app acceptance and operational build-secret setup are NOT RUN/out of scope. Supabase/CF plans/billing were not changed. No invented expiration or authority policy was installed.

Tooling references checked: [GitHub npm registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry), [Cloudflare local development/workerd](https://developers.cloudflare.com/workers/local-development/), [Miniflare modules](https://developers.cloudflare.com/workers/testing/miniflare/core/modules/).

NOT RUN: production JN/qoqo integration, real mail receipt, live Auth/SMTP/hook change, DB, app deployment and operational installation credentials. These are outside this package task. No GitHub Actions manual run.

Registry authentication must use current authorized gh identity in child-process memory only. Never print/persist tokens or copy broad local gh credentials into Vercel/CF. Operational installs still require a separate read:packages credential.
