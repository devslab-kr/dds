# @devslab-kr/dds-tokens

🌐 [한국어](README.ko.md)

DDS design tokens, built from the single source at the repo root
(`tokens/*.json`, W3C Design Tokens format) into every consumption shape
(spec §2). `pnpm build` produces:

| Artifact | Import | Consumer |
| --- | --- | --- |
| `dist/tokens.css` | `@devslab-kr/dds-tokens/tokens.css` | Every web surface. `--dds-*` custom properties — light on `:root`, dark on `[data-theme="dark"]` |
| `dist/tailwind/theme.css` | `@devslab-kr/dds-tokens/tailwind/theme.css` | Tailwind v4 (`@theme`) |
| `dist/tailwind/preset.js` / `.cjs` | `@devslab-kr/dds-tokens/tailwind/preset` | Tailwind v3 (`presets: [...]`) |
| `dist/tokens.ts` (+ `tokens.js` / `tokens.d.ts`) | `@devslab-kr/dds-tokens` | RN and any runtime code — raw numbers (px on web, pt on RN) |
| `dist/ionic.css` | `@devslab-kr/dds-tokens/ionic.css` | Ionic apps — `--ion-*` mapped onto `--dds-*`: brand color (`primary` + `-rgb`/`-shade`/`-tint`/`-contrast`), the three status colors with their `-contrast`, page background/text/border, font, and app chrome (`item`, `toolbar`, `tab-bar`, `card`) |

## Usage notes

- **Load order.** `tokens.css` first; `theme.css` / `ionic.css` reference its
  variables. Tailwind color utilities resolve through `var(--dds-*)`, so they
  follow the theme at runtime.
- **Dark mode.** Set `data-theme="dark"` on `<html>` (or any subtree —
  `data-theme="light"` pins a subtree back, so panels can be fixed to either
  theme). No media query is emitted; auto-follow is the consumer's call,
  same as devslab.kr's toggle.
- **The raw palette is not in the CSS.** Components may only use semantic
  tokens (spec §3.1); what the CSS doesn't ship can't be hardcoded against.
  Palette values are available from `tokens.ts` for mapping-definition code.
- **Tailwind naming.** Color names keep the semantic path: `bg-bg-brand`,
  `text-text-primary`, `border-border-default`. Flattening ("brand") would
  collide — `color.bg.brand` and `color.text.brand` are different values.
  Spacing is not overridden: Tailwind's default quarter-rem grid already
  equals the DDS 4px scale (`p-1`=4px … `p-16`=64px; DDS `space.2` = `p-0.5`).

## Scripts

- `pnpm build` — Style Dictionary v4 resolves `tokens/*.json`; explicit
  formatters emit the artifacts (an unknown `$type` fails the build).
- `pnpm check` — token JSON validation (leaf shape, reference resolution,
  light/dark parity, value shapes) + `tsc --strict` on the generated TS.

The repo-level `pnpm verify` additionally runs `scripts/check-docs-sync.mjs`,
which fails CI when `docs/design-system*.md` or `preview/index.html` drift
from the token values.
