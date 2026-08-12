# DDS — DevsLab Design System

🌐 [한국어](README.ko.md)

The design language for DevsLab products (devslab.kr, the Linq family, and
future apps): one set of tokens and rules shared by web and mobile.
Structurally modeled on [Toss Design System (TDS)](https://tossmini-docs.toss.im/tds-react-native/),
but framework-neutral — the core is tokens + CSS; React, Vue, Ionic, and
React Native are consumers.

## What's here

| Path | Contents |
| --- | --- |
| [`docs/design-system.md`](docs/design-system.md) | The rules spec (v0): principles, architecture, foundations, component contract, governance |
| [`docs/decisions.md`](docs/decisions.md) | Decision log — foundation/architecture decisions with rationale |
| [`tokens/`](tokens/) | Design token source ([W3C format](https://design-tokens.github.io/community-group/format/)): raw palette, light/dark semantic mappings, typography/spacing/radius/elevation/motion |
| [`packages/dds-tokens/`](packages/dds-tokens/) | `@devslab-kr/dds-tokens` — token build pipeline: `tokens.css`, Tailwind v4 `@theme` + v3 preset, `tokens.ts` (RN/runtime), `ionic.css` |
| [`packages/dds-css/`](packages/dds-css/) | `@devslab-kr/dds-css` — CSS component layer, Core 6 (Button, TextField, Badge, Spinner/Skeleton, Dialog, Toast); guide in [`docs/components.md`](docs/components.md) |
| [`preview/index.html`](preview/index.html) | Self-contained foundations & components preview — open in a browser |
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

## Roadmap

Priorities live in [`docs/backlog.md`](docs/backlog.md). Packages are created
only when a consumer exists (spec §8):
`@devslab-kr/dds-tokens` (✅ 2026-08-13) → `dds-css` Core 6 (✅ 2026-08-13) →
AskLinq adoption → `dds-icons` → `dds-native` (RN) or an Ionic theme mapping,
depending on how mobile goes.
