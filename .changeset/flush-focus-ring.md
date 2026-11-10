---
"@devslab/dds-tokens": patch
"@devslab/dds-css": patch
"@devslab/site-kit": patch
---

Focus rings on controls with their own border or fill now sit flush on that
edge instead of 2px outside it, so border and ring read as one line rather than
border, gap, ring (D-047). New foundation token `focus.offset` (0) ships as
`--dds-focus-offset` in tokens.css and `focus.offset` in tokens.ts. Flush:
Button (all variants and sizes), IconButton, Chip, TopNav trigger/item, console
rail item and group toggle, calendar popup focus, and the site-kit flag-menu
trigger. Unfilled buttons (secondary, ghost), every IconButton and chips also paint
their 1px border in the focus color while focused, so border and ring are one
edge of one colour. The Input clear button moves inside its own box. Checkbox, radio,
switch, the table sort label and the site-kit footer/consent text links keep
their 2px gap. Ring width, the focus color and forced-colors behaviour are
unchanged. Shared by CSS, Solid, React, Vue and Svelte.
