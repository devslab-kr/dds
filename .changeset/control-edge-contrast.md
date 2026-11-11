---
"@devslab/dds-tokens": minor
"@devslab/dds-css": minor
---

The edge of a form control is now 3:1 against its surface. New palette steps
`zinc.450` (`#8e8e97`) and `zinc.550` (`#696972`), and a new semantic token
`color.border.control` (`--dds-color-border-control`): 3.25:1 on a light page,
3.26:1 on a dark card, where `border.strong` was about 1.5:1. Inputs, textareas,
selects, number and date inputs, checkboxes, radios, choice cards and the
segmented control's frame use it; card edges, dividers and labelled buttons
keep `border.default` / `border.strong`, whose values are unchanged.

Dark theme: `color.text.muted` moves from `zinc.500` to `zinc.450`, so
placeholder text clears 4.5:1 (4.1:1 → 6.0:1 on the page).

If you draw your own input borders with `--dds-color-border-strong`, switch
them to `--dds-color-border-control` (D-050).
