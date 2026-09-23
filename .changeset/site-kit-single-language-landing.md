---
"@devslab/site-kit": minor
---

Header and footer options for a single-language landing and a footer that prints business details (D-029). The new props are optional:

- `SiteHeader` `locale` is optional; without it no language picker renders.
- `SiteBrand.label` names the header brand link; a wordmark `logo` with `name: ""` prints once and leaves no empty `<strong>` in the footer.
- `SiteFooter` `details` (a block under the brand line) and `linksLabel` (wraps the links in `<nav aria-label>`); `SiteLink.emphasis` draws a link heavier.
- Sections and the hero stop below the sticky header (`scroll-margin-block-start`, header height `--site-header-block-size`); `--site-hero-eyebrow-tracking` and `--site-hero-eyebrow-weight` tune the hero eyebrow.
- The header and footer read `brand` (and the footer `details`) once, so inline JSX stays one build per side outside the shell too.

Applies to every consumer:

- The narrow-screen menu closes on Escape (focus back on the menu button) and when a link inside it is followed. Buttons, links that open a new tab or window, and an Escape handled by a control inside the header or an `aria-modal` element leave it open.
- On touch, the brand link and header, footer and footer-language links are 44px targets.
- At 720px and below the closed header's first row is 64px with no block padding: phone headers of products without a global `box-sizing: border-box` reset (TraceLinq, BookLinq) get 24px shorter (89px to 65px), and products with a 44px menu button 4px shorter. The open menu is 44px link rows with 12px under the controls. Check the phone header when upgrading.
- Footer links are baseline-aligned; a footer row with details aligns on its first line. The 16px footer mark size now applies only beside a printed name.

Type change: `SiteHeaderProps["locale"]` is now optional. Code that reads it from a `SiteHeaderProps` value must narrow it (BookLinq's `MarketingFrame` reads `props.header.locale.locale`).
