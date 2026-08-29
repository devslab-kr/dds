# DDS compatibility canary

This private workspace package is the admission gate for the production Solid and TanStack web stack and for future framework upgrades. The exact candidate matrix and upstream constraints live in `compatibility-matrix.json`; the package manifest must match it byte-for-byte at the version level.

The fixture covers TanStack Start SSR/client hydration, a server function reading its request, TanStack Router with a custom 404, TanStack Query hydration state, Korean head metadata, a static SVG, and Cloudflare Vite/workerd preview. The `fixtures/binding-gateway` Worker binds `CANARY_SERVICE` to the test-only `fixtures/binding-service` sibling Worker through Wrangler configuration; its response also proves CSP nonce propagation from the response policy into serialized script state.

Run from the repository root:

```text
pnpm install --frozen-lockfile
pnpm verify:canary:dependencies
pnpm verify:canary:test
pnpm verify:canary:build
pnpm verify:canary:preview
```

Build and preview output is rejected when it contains hydration mismatches, peer-dependency warnings/overrides, unhandled-route diagnostics, or secret-shaped assignments. Preview uses an installed Chrome channel and never deploys.

The current production matrix is registry-installed and verified through typecheck, framework builds, browser hydration, Cloudflare service bindings, CSP nonce propagation, and a local workerd preview. Solid 2 remains behind this gate until its public RC packages expose a mutually compatible browser/runtime boundary.
