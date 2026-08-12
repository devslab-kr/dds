# @devslab-kr/dds-css

🌐 [한국어](README.ko.md)

DDS CSS component layer — class-based and framework-neutral (spec §2: the
core is CSS; React/Vue/Ionic/SSR are consumers). Core 6: **Button,
TextField, Badge, Spinner/Skeleton, Dialog, Toast**.

```html
<link rel="stylesheet" href=".../dds-tokens/tokens.css"> <!-- first -->
<link rel="stylesheet" href=".../dds-css/dds.css">
<button class="dds-btn dds-btn--primary">Save</button>
```

- Every value is a semantic token reference (`var(--dds-*)`) —
  `scripts/check-css.mjs` mechanically bans hex/rgb/hsl/color-mix in `src/`,
  so a hardcoded color fails CI, not review.
- Dark mode is free: `data-theme="dark"` on `<html>` or any subtree
  (`data-theme="light"` pins back). No component has a dark branch.
- Per-component imports: `@devslab-kr/dds-css/components/button.css` etc.
- Markup contracts, states, accessibility checklists and do/don't per
  component: [`docs/components.md`](../../docs/components.md).
  Live reference: `preview/components.html` (run `pnpm build` first).
