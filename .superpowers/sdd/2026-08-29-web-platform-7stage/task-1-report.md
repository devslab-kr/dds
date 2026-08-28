# Task 1 completion report

- status: partial
- commits:
  - `7277c4116c3d311266dd6aedc36b0dc016feb6fc` — initial canary
  - `fc81b11fcc6061db92997c8844842f51dfe46d50` — initial report
  - `fa3636c89be15ce6ac0981c0de169b069abb3d9e` — review hardening
  - `f0fb1a9c85c24a74c4d8bcc43edcdf29394c0381` — hardened review evidence
  - `6de3bf30349393f773ed502a218708c8ee57747c` — exact sentinel secret gates

## Exact selected version matrix

- `solid-js`: `2.0.0-rc.3`
- `@solidjs/web`: `2.0.0-rc.3`
- `@tanstack/solid-start`: `2.0.0-rc.3`
- `@tanstack/solid-router`: `2.0.0-rc.3`
- `@tanstack/solid-query`: `6.0.0-rc.0`
- `@solidjs/vite-plugin`: `3.0.0-next.32`
- `@cloudflare/vite-plugin`: `1.54.1`
- `vite`: `8.2.1`
- `wrangler`: `4.123.0`
- `typescript`: `7.0.2`
- `@playwright/test`: `1.62.1`

## RED evidence

- Command: `node --test packages/compatibility-canary/tests/contracts.test.mjs`
- Result before implementation: 4 tests failed with consumer-visible assertions: empty SSR output did not carry localized head/hydration state; the server function returned `{}` instead of request/service context; an unknown route returned 200 instead of 404; and unsafe diagnostics were accepted.
- Review regression command: `node --test --test-name-pattern="diagnostic gate" packages/compatibility-canary/tests/contracts.test.mjs`
- Review RED: the exact `Hydration completed with 1 unclaimed server-rendered node(s)` warning was accepted.
- Application-binding RED: `application-contracts.test.mjs` failed on `solid-js@2.0.0-rc.1` and missing install/artifact verification entry points.
- Secret-gate RED: quoted JSON (`"CLOUDFLARE_API_TOKEN":"abcdefghijklmnop"`) and a value-only high-entropy sentinel both passed undetected; the application-contract test also failed because sentinel injection was absent.

## GREEN evidence

- `node --test packages/compatibility-canary/tests/contracts.test.mjs packages/compatibility-canary/tests/application-contracts.test.mjs`: 7 passed, 0 failed.
- `node --check` for the install, build-scan, route-generation, and preview scripts: all passed.
- JSON parsing for the root and canary manifests, matrix, and matrix schema: passed.
- `node packages/compatibility-canary/scripts/verify-dependencies.mjs`: expected blocked failure, `@solidjs/web@2.0.0-rc.3 is missing from the canary lockfile importer`.
- `pnpm install --offline --frozen-lockfile`: blocked; the empty local store caused registry requests that were denied with `EACCES` and entered retry backoff, so the command was terminated rather than represented as passing.
- `pnpm verify:canary:dependencies`, `pnpm verify:canary:build`, and `pnpm verify:canary:preview`: not passed because the exact dependencies and lockfile importer could not be installed without registry access.

## Files changed

- `package.json`
- `packages/compatibility-canary/README.md`
- `packages/compatibility-canary/compatibility-matrix.json`
- `packages/compatibility-canary/compatibility-matrix.schema.json`
- `packages/compatibility-canary/package.json`
- `packages/compatibility-canary/public/canary.svg`
- `packages/compatibility-canary/scripts/preview-smoke.mjs`
- `packages/compatibility-canary/scripts/generate-route-tree.mjs`
- `packages/compatibility-canary/scripts/run-clean.mjs`
- `packages/compatibility-canary/scripts/scan-build.mjs`
- `packages/compatibility-canary/scripts/secret-sentinels.mjs`
- `packages/compatibility-canary/scripts/verify-dependencies.mjs`
- `packages/compatibility-canary/scripts/verify-install.mjs`
- `packages/compatibility-canary/src/canary-contracts.mjs`
- `packages/compatibility-canary/src/router.tsx`
- `packages/compatibility-canary/src/routeTree.gen.ts`
- `packages/compatibility-canary/src/routes/__root.tsx`
- `packages/compatibility-canary/src/routes/index.tsx`
- `packages/compatibility-canary/src/server-canary.ts`
- `packages/compatibility-canary/tests/contracts.test.mjs`
- `packages/compatibility-canary/tests/application-contracts.test.mjs`
- `packages/compatibility-canary/tsconfig.json`
- `packages/compatibility-canary/vite.config.ts`
- `packages/compatibility-canary/wrangler.jsonc`
- `.superpowers/sdd/2026-08-29-web-platform-7stage/task-1-report.md`

## Upstream limitations and unresolved concerns

- SolidJS 2, `@solidjs/web`, TanStack Solid Start/Router 2, Solid Query 6, and the Solid Vite plugin are prerelease lines and must advance through this gate as a coordinated matrix.
- TanStack Solid Start 2.0.0-rc.0 has a reported unclaimed-node hydration warning for `head().scripts`; the fixture avoids that API and the smoke gate rejects every hydration warning.
- TypeScript 7.0.2 is the project compiler and lacks the legacy JavaScript programmatic compiler API; no TypeScript 6 alias was added because no verified tool requirement was encountered.
- The dependency gate now forces a frozen, strict-peer install and scans its diagnostics; build output is scanned for likely secrets, and preview checks raw SSR before hydration. These gates remain unexecuted because dependencies are unavailable offline.
- Build and preview inject a fixed high-entropy sentinel through `DDS_CANARY_SECRET_SENTINEL`; artifact and raw-SSR scans reject its exact value even if a bundler removes or renames the environment key.
- Minor: offline application-contract tests bind to actual source files but cannot replace a compiled framework-level test; the dependency-backed build and preview remain the authoritative behavioral gates.
- The selected matrix is authoritative and exact but not compatibility-proven in this environment. A registry-enabled frozen install followed by dependency, typecheck/build, and workerd/Chrome preview smoke is still required before the canary can be marked done.
