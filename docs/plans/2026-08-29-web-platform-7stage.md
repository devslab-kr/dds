# Seven-stage DevsLab web platform implementation

Spec: C:\Users\jlc48\Documents\Codex\2026-08-25\new-chat-2\outputs\web-standardization-audit\INTEGRATED_PLAN.md

## Global Constraints

- Execute all seven tasks in order without intermediate approval.
- Use exact dependency versions; no caret, tilde, latest, next, or floating prerelease tags in the migration package set.
- TypeScript project compiler is exactly 7.0.2. A TypeScript 6 compatibility alias is allowed only for tools that require the programmatic compiler API.
- Required locales are exactly ko, en, ja, zh-HK, zh-TW, hi, vi, id, th, pt-BR, fr, de, es, ar.
- Product-chrome catalogs have strict key and placeholder parity with no runtime English or Korean fallback. Arabic requires dir=rtl.
- Existing Hono API Workers and externally visible routes remain compatible.
- New behavior follows test-driven development. Each task must include a failing test observed before implementation.
- Product work happens on codex/web-platform-7stage branches in the isolated clones under C:\Users\jlc48\Documents\Codex\2026-08-25\new-chat-2\implementation.
- Deployment, publishing, pushing, merging, DNS changes, and production data writes remain external side effects and require explicit authorization at the moment they are performed.

## Task 1: Compatibility canary

Repository: implementation/dds

Create a workspace package that proves an exact SolidJS 2 RC + TanStack Solid Start/Router/Query + Cloudflare Vite plugin + Vite + Wrangler + TypeScript 7.0.2 matrix. It must exercise SSR, hydration, a server function, request context, a service-binding-shaped interface, localized head tags, custom 404, static assets, and workerd preview build. Add automated tests that fail on hydration warnings, peer overrides, secret leakage, or unhandled routes. Record the exact matrix and upstream limitations.

Acceptance: clean offline-or-normal install, test, typecheck, build, and workerd preview smoke pass without dependency range drift or hydration warnings.

## Task 2: DDS foundation hardening

Repository: implementation/dds

Rename the existing packages to @devslab-kr/dds-tokens, @devslab-kr/dds-css, and @devslab-kr/dds-icons before first publish. Add changesets, lockstep versioning, pack and fresh-consumer verification, publish dry-run, and TypeScript 7.0.2. Fix CJK button wrapping, 44x44 touch targets, logical RTL properties, forced-colors, reduced motion, and direction-aware icon policy. Preserve framework neutrality.

Acceptance: verify, Storybook, pack, fresh consumer, long-label/CJK, Arabic RTL, keyboard, axe, zoom, forced-colors, and package-name scans pass.

## Task 3: dds-solid

Repository: implementation/dds

Create @devslab-kr/dds-solid using the exact canary matrix. Implement accessible Solid primitives for Button, IconButton, Field, Select, Checkbox, Radio, Switch, Dialog, Tabs, Toast, Tooltip, and Icon. Consume existing token/CSS contracts. Cover controlled/uncontrolled state, native semantics, accessible naming, keyboard behavior, focus trap/return, lifecycle, SSR, and hydration.

Acceptance: red-green tests, typecheck, build, package dry-run, fresh consumer SSR/hydration, keyboard and axe checks all pass.

## Task 4: site-kit

Repository: implementation/dds

Create @devslab-kr/site-kit with runtime-neutral core and explicit Solid/TanStack Start adapter. Implement the exact 14-locale manifest, resolver precedence, html lang/dir, strict catalog key and placeholder validation, locale-aware metadata, canonical, hreflang plus x-default, sitemap, robots policy, fact-validated JSON-LD, SiteHeader, LocaleMenu, ThemeToggle, marketing shells, SiteFooter, LegalLayout, StatusBanner, RequestAccessForm shell, and not-found/error layouts. Product copy and facts are injected.

Acceptance: missing/extra/placeholder mismatch tests fail correctly; all 14 locale fixtures pass; Arabic RTL desktop/mobile, metadata/schema snapshots, SSR/hydration, accessibility, and Worker fixture pass.

## Task 5: VisionLinq migration

Repository: implementation/visionlinq

Replace the public web runtime with the verified SolidJS 2 + TanStack Start stack and consume DDS packages. Preserve nine route slugs, request-access behavior, CSP nonce, www 308 path/query, static assets, D1, rate limiting, Turnstile, origin allowlist, and idempotency. Add 14 locales, RTL, localized metadata/legal pages, verified-fact GEO, sitemap, favicon, social metadata, custom 404, and preview noindex. Do not alter control, document, provider, converter, queue, workflow, or container APIs.

Acceptance: original black-box contracts plus unit, E2E, locale, RTL, security-header, SEO/GEO, bundle, and Worker preview tests pass. Production cutover and rollback commands are documented and dry-run verified.

## Task 6: BookLinq migration

Repository: implementation/booklinq

Replace the web runtime with the verified stack while preserving the internal Hono API service binding, 32 routes, sessions, cookies, booking state transitions, PWA behavior, and merchant content. Move India-first assumptions into product configuration. Migrate marketing/status/legal, auth/signup, customer booking, owner, then admin. Adopt the exact 14-locale strict contract, localized metadata, RTL, GEO, security headers, and real frontend unit tests. Make E2E a production deployment gate.

Acceptance: route and booking black-box contracts, frontend unit tests, API tests, E2E, locale/RTL, PWA, security, SEO/GEO, bundle, and Worker preview tests pass. Production cutover and rollback commands are documented and dry-run verified.

## Task 7: AskLinq migration

Repository: implementation/asklinq

Split the public web runtime from the existing Hono service without changing public URLs. The new Solid/TanStack web Worker owns marketing, signup, legal, and progressively migrated admin UI. It must pass through /api/*, /c/*, /embed.js, /widget/*, /admin/* until migrated, QR, files, vCard, favicon, health, cookies, content types, cache headers, status codes, download disposition, and AskLinq embed globals to Hono without redirects. Remove runtime CDN UI dependencies, add strict 14 locales, Arabic RTL, SEO/GEO, CSP/security headers, staging/preview, and a fully non-skipped integration suite.

Acceptance: legacy black-box contracts, full unit and integration tests with zero unexplained skips, admin vertical-slice E2E, widget/embed tests, locale/RTL, security, SEO/GEO, bundle, Worker preview, cutover, and rollback dry-run pass.

## Final integration

Reverify every task from leaf to root. Run a broad multi-repository code review, fix all Critical and Important findings, list every ruling, and use the finishing-a-development-branch process. Do not publish, merge, push, or deploy without explicit authorization for those external side effects.
