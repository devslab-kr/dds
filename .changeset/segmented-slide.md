---
"@devslab/dds-css": minor
"@devslab/dds-react": minor
"@devslab/dds-solid": minor
"@devslab/dds-vue": minor
---

SegmentedControl's chosen face slides to the new choice (D-055): one `.dds-segmented__indicator` in the track, placed on the chosen item and moved over `motion.duration.base` with the standard easing when the choice changes (not on a first placement or a resize; 0ms under `prefers-reduced-motion`). React, Solid and Vue measure it with the same small function. Where there is no `ResizeObserver` — a server render, a jsdom test, an old browser — it does nothing: the indicator stays hidden and the chosen item paints its own face, as before, so consumers' tests need no polyfill.
