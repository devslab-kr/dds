# DDS — DevsLab Design System

🌐 [한국어](README.ko.md)

The design language for DevsLab products (devslab.kr, the Linq family, and
future apps): one framework-neutral set of tokens, components, and rules
shared by web and mobile. The core is tokens + CSS; React, Vue, Ionic, and
React Native are consumers.

## What's here

| Path | Contents |
| --- | --- |
| [`docs/design-system.md`](docs/design-system.md) | The rules spec (v0): principles, architecture, foundations, component contract, governance |
| [`docs/decisions.md`](docs/decisions.md) | Decision log — foundation/architecture decisions with rationale |
| [`tokens/`](tokens/) | Design token source ([W3C format](https://design-tokens.github.io/community-group/format/)): raw palette, light/dark semantic mappings, typography/spacing/radius/elevation/motion |
| [`packages/dds-tokens/`](packages/dds-tokens/) | `@devslab/dds-tokens` — token build pipeline: `tokens.css`, Tailwind v4 `@theme` + v3 preset, `tokens.ts` (RN/runtime), `ionic.css` |
| [`packages/dds-css/`](packages/dds-css/) | `@devslab/dds-css` — CSS component layer, the spec §4.3 v1 inventory (Button, IconButton, TextField, Textarea, Select, Checkbox/Radio, Switch, Badge, Chip, Avatar, Spinner/Skeleton, Divider, Card, ListRow, Tabs, Dialog, Toast, Tooltip, EmptyState); guide in [`docs/components.md`](docs/components.md) |
| [`packages/dds-icons/`](packages/dds-icons/) | `@devslab/dds-icons` — the icon set: 40 core (24 grid, 1.6 stroke) + 7 devslab.kr `site-` icons, shipped as SVG files, a sprite and a path-data map |
| [`packages/dds-solid/`](packages/dds-solid/) | `@devslab/dds-solid` — SolidJS accessible primitives with controlled/uncontrolled state, SSR/hydration, keyboard, focus, and lifecycle contracts |
| [`packages/site-kit/`](packages/site-kit/) | `@devslab/site-kit` — public infrastructure for product sites: strict 14-locale i18n, SEO/GEO builders, TanStack Start metadata adapter, and accessible SolidJS shared shells |
| [`preview/index.html`](preview/index.html) | Self-contained foundations & components preview — open in a browser (`components.html`, `icons.html` alongside) |
| [`brand/index.html`](brand/index.html) | Brand identity guide: logo rules, Electric Cyan, motifs, voice & tone |

## Brand anchors

- **Electric Cyan** `#06B6D4` (hover `#22D3EE`) on **zinc** neutrals — extracted
  from devslab.kr's live styles
- Light default + dark toggle; both semantic mappings are first-class
- Geist / Geist Mono; Korean falls back to Pretendard → system gothic
- Text on cyan surfaces is `zinc.950`, not white (WCAG AA: 2.3:1 vs ~8:1)

## Development

pnpm workspace. `pnpm install`, then:

- `pnpm build` — build all packages
- `pnpm verify` — build + token validation + docs/preview↔token drift check
  (what CI runs)
- `pnpm storybook` — component/foundation stories at :6006 (theme switch in
  the toolbar); `pnpm build-storybook` for the static site (also CI-checked)
- `pnpm verify:names` — reject package-name, license, or public-registry drift
- `pnpm verify:foundation` — core checks, Storybook build, CJK/RTL/keyboard,
  200% zoom, forced-colors, reduced-motion, touch-target, and axe browser checks
- `pnpm verify:release` — build artifacts are packed, exercised from a fresh
  temporary consumer, and passed through `npm publish --dry-run`
- `pnpm verify:solid:test`, `verify:solid:a11y`, `verify:solid:release` — Solid
  behavior/type/build, axe, SSR/hydration, pack, fresh-consumer and publish dry-run gates
- `pnpm verify:site-kit:i18n`, `verify:site-kit:ui`, `verify:site-kit:seo`,
  `verify:site-kit:release` — exact locale/catalog contracts, shared UI behavior,
  localized discovery documents, pack, fresh-consumer and publish dry-run gates

The five public packages release in lockstep through Changesets, and the release
is automatic: every push to `main` runs `.github/workflows/release.yml`, which
passes the full verification gate and then lets `changesets/action` either open
the "chore: release dds" version PR (when changeset files are waiting) or publish
whatever version is on `main` but not yet on npm (when that PR has just merged).
Merging the version PR is the release decision; no tag is pushed by hand.
Directional icons use `dds-icon--directional`; the authoritative mirror/keep
lists ship as `@devslab/dds-icons/direction-policy.json`.

All distributable DDS packages use `@devslab/*` on the public npm registry under the
DevsLab Source-Available License 1.0. The compatibility canary remains private and
unpublished. Releases use npm provenance and the repository `NPM_TOKEN` secret.

## Roadmap

Priorities live in [`docs/backlog.md`](docs/backlog.md). Packages are created
only when a consumer exists (spec §8):
`@devslab/dds-tokens` (✅ 2026-08-13) → `dds-css` v1 inventory (Core 6 ✅ 2026-08-13, +13 ✅ 2026-08-15) →
AskLinq adoption → `dds-icons` (✅ 2026-08-15) → `dds-solid` + `site-kit` → `dds-native` (RN) or an Ionic
theme mapping, depending on how mobile goes.
