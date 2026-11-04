# DDS email template — 2026-11-04

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

Pre-commit implementation checks PASS: 123 security/content tests and strict JS/declaration typecheck; preliminary tarball Node import, NodeNext without DOM and DOM Bundler without Node types; real local Miniflare5/workerd rendering/error equality, no nodejs_compat. Preliminary tarball predates final docs/polish and is not a release artifact. Final commit-based build/pack/registry verification is pending below.

Final browser correction round: **25/25 PASS** (7 fixtures x 320/768/1280, JN/stress image-blocked and 200% text). Chromium151.0.7922.34, axe0, network failures0, unexpected requests0, overflow0, CTA keyboard focus PASS and minimum52px. The first batch was24/25: JN OTP8 at320px/200% text overflowed due to nowrap; removed that restriction, retained exact eight-digit DOM/plain text. No further browser rounds are required for unchanged source. Real logos loaded with correct intrinsic/display ratios. Blocked JN alt fallback may wrap in a browser-specific box, but the independent live service name stays readable.

Taste retained approved names/logo/color and quiet operational hierarchy. Polish inspected spacing/alignment/type, whole-word Korean and long identifier/URL/button wrapping, footer contrast, native focus, alternative text and mobile/tablet/desktop. JN footer uses its existing body color on outer background because the old muted color fell below4.5:1 there. No animation, marketing typography, invented data or auth state. Manual Impeccable detector on all generated HTML returned `[]`.

Independent source review: no remaining actionable findings; 123tests/typecheck PASS plus32invalid-input probes and deterministic rendering of7fixtures. A P3 language metadata documentation mismatch was resolved by explicitly documenting the supported ASCII tag shape and consumer-owned full validity. Final renderer Git blob `177803595c032f279b64625a05e79364e44dc8e5`; SHA256 `a1b29049e47c77b434f42b66123681bfab589c1caf79774cb1b0c74c4ba8c146`; fixtures SHA256 `689f095a77339e0b61738056b7a23216070eaff882eda043982ba55cdac40506`. Browser batch verified source unchanged.

Local reviewable evidence (ignored, synthetic only):

- `test-results/dds-email-template/previews/index.html` and seven HTML/text pairs plus manifest.
- `test-results/dds-email-template/browser-round-2/report.json` and25screenshots.
- `test-results/dds-email-template/impeccable-detect.json` = `[]`.
- Final `local-consumer.json` / `registry-consumer.json` to be regenerated at the source commit.

Frozen lockfile check: `pnpm --filter @devslab-kr/dds-email-template install --frozen-lockfile --ignore-scripts --offline` PASS. No new dependencies; new empty workspace importer only.

Release pending: exact source commit, commit-based tests/check/build/pack, publish the tested tarball, verify registry integrity and clean fixed-version registry installation (prior local installed package removed after exact path/name/version checks). Existing GitHub Packages login `jlc488` was confirmed; new package/version not present before publication. Existing auth package visibility is internal; no visibility change requested.

Tooling references checked: [GitHub npm registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry), [Cloudflare local development/workerd](https://developers.cloudflare.com/workers/local-development/), [Miniflare modules](https://developers.cloudflare.com/workers/testing/miniflare/core/modules/).

NOT RUN: production JN/qoqo integration, real mail receipt, live Auth/SMTP/hook change, DB, app deployment and operational installation credentials. These are outside this package task. No GitHub Actions manual run.

Registry authentication must use current authorized gh identity in child-process memory only. Never print/persist tokens or copy broad local gh credentials into Vercel/CF. Operational installs still require a separate read:packages credential.
