# @devslab/dds-icons

Directional consumers add `dds-icon--directional`; the packaged
`direction-policy.json` is the source of truth for icons that mirror in RTL
and icons whose physical direction must stay unchanged.

🌐 [한국어](README.ko.md)

The DDS icon set — one SVG source per icon (24 grid, `currentColor`, round
caps), shipped in the three shapes consumers actually need. Spec §3.7, as
amended by [D-013](../../docs/decisions.md).

| Artifact | Import | For |
| --- | --- | --- |
| `dist/svg/*.svg` | `@devslab/dds-icons/svg/phone.svg` | build pipelines, `<img>`, design tools |
| `dist/icons.svg` | `@devslab/dds-icons/icons.svg` | web sprite — `<use href="…/icons.svg#dds-phone">` |
| `dist/icons.js` (+ `.d.ts`) | `@devslab/dds-icons` | any runtime that builds its own element (RN, `createElementNS` renderers, SSR) |

```js
import { icons } from "@devslab/dds-icons";

const i = icons.phone; // { viewBox, strokeWidth, set, body }
```

```html
<!-- inline, inherits the surrounding color and font-size-independent size -->
<button class="dds-iconbtn" aria-label="Call">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <!-- icons.phone.body -->
  </svg>
</button>
```

## Two sets

- **core** (`svg/*.svg`, stroke 1.6) — product UI. Names are function-shaped
  (`chevron-down`, `external-link`); the 22 names inherited from the AskLinq
  widget keep their exact spelling, because renaming them would break live
  card icons.
- **site** (`svg/site/site-*.svg`, stroke 1.8) — devslab.kr only, drawn for
  32–40px marketing display. The `site-` prefix is part of the name; the
  folder is only organization.

## Rules (enforced by `scripts/check-icons.mjs`, so CI fails, not review)

- `viewBox="0 0 24 24"`, `width`/`height` 24
- `fill="none"`, `stroke="currentColor"`, round cap and join
- no color literal anywhere in the file, and no `stroke`/`fill`/`style`
  overrides in the body — color and weight are inherited, always
- stroke width is the set's (1.6 core / 1.8 site); a third value means an
  icon was dropped in from somewhere else
- lowercase kebab-case names, no size or color in the name

## Not here on purpose

No React/Vue/RN components are generated. Per spec §2 a framework package
exists only once that framework's product does; a map of path data is what
every consumer can build from today.

Live gallery: `preview/icons.html` (run `pnpm build` first).
