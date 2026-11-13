---
"@devslab/dds-tokens": minor
"@devslab/dds-css": minor
---

New semantic token `color.bg.raised` (`--dds-color-bg-raised`): white in light, `zinc.800` in dark — a face raised above `bg.subtle`. The chosen SegmentedControl segment uses it, so in the dark theme it is one step lighter than its track instead of darker (it read as a hole). The light theme looks the same; the level-1 shadow stays (D-054).
