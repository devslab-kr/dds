# @devslab/dds-tokens

## 0.35.0

## 0.34.0

### Minor Changes

- 9ecb4a7: New semantic token `color.bg.raised` (`--dds-color-bg-raised`): white in light, `zinc.800` in dark — a face raised above `bg.subtle`. The chosen SegmentedControl segment uses it, so in the dark theme it is one step lighter than its track instead of darker (it read as a hole). The light theme looks the same; the level-1 shadow stays (D-054).

## 0.33.0

### Minor Changes

- 79314c2: The edge of a form control is now 3:1 against its surface. New palette steps
  `zinc.450` (`#8e8e97`) and `zinc.550` (`#696972`), and a new semantic token
  `color.border.control` (`--dds-color-border-control`): 3.25:1 on a light page,
  3.26:1 on a dark card, where `border.strong` was about 1.5:1. Inputs, textareas,
  selects, number and date inputs, checkboxes, radios, choice cards and the
  segmented control's frame use it; card edges, dividers and labelled buttons
  keep `border.default` / `border.strong`, whose values are unchanged.

  Dark theme: `color.text.muted` moves from `zinc.500` to `zinc.450`, so
  placeholder text clears 4.5:1 (4.1:1 → 6.1:1 on the page).

  Upgrade `@devslab/dds-tokens` together with `@devslab/dds-css`. With an older token
  sheet the controls fall back to `border.strong` — the old, paler edge — rather than
  losing their edge.

  If you draw your own input borders with `--dds-color-border-strong`, switch
  them to `--dds-color-border-control` (D-050).

## 0.32.2

### Patch Changes

- f5c4c49: Dark theme: `color.status.danger` and `color.status.info` are one step lighter
  (`red.300`, `blue.300`), so error and notice text clears 4.5:1 on its own
  status background (was 3.62:1 and 4.07:1). The palette and the light theme are
  unchanged (D-049).

## 0.32.1

### Patch Changes

- ca0cd38: Focus rings on controls with their own border or fill now sit flush on that
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

## 0.32.0

## 0.31.0

## 0.30.0

## 0.29.2

### Patch Changes

- 6ab7a49: Use a shared neutral focus color in both themes: #52606d in light mode and
  #b0bbc4 in dark mode. Text, multiline, select, choice, number and date/range
  inputs now draw their 2px focus ring inside the existing border box. Calendar
  popup focus uses the same semantic focus color. Keyboard behavior, error
  borders, disabled states and the outer ring placement of small controls remain
  unchanged. These defaults are shared by CSS, Solid, React, Vue and Svelte.

## 0.29.1

## 0.29.0

## 0.28.0

## 0.27.0

## 0.26.0

## 0.25.1

## 0.25.0

## 0.24.0

## 0.23.0

## 0.22.1

## 0.22.0

## 0.21.2

## 0.21.1

## 0.21.0

## 0.20.0

## 0.19.0

## 0.18.0

## 0.17.1

## 0.17.0

## 0.16.0

## 0.15.0

## 0.14.1

## 0.14.0

## 0.13.0

## 0.12.2

## 0.12.1

## 0.12.0

## 0.11.1

## 0.11.0

## 0.10.0

## 0.9.0

## 0.8.1

## 0.8.0

## 0.7.0

## 0.6.0

## 0.5.2

## 0.5.1

## 0.5.0
