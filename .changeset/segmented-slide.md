---
"@devslab/dds-css": minor
"@devslab/dds-react": minor
"@devslab/dds-solid": minor
"@devslab/dds-vue": minor
---

SegmentedControl's chosen face slides to the new choice (D-055): one `.dds-segmented__indicator` in the track, placed on the chosen item and moved over `motion.duration.base` with the standard easing when the choice changes (not on resize; 0ms under `prefers-reduced-motion`). Until a script has measured it — server-rendered first paint, plain HTML — the chosen item keeps drawing its own face. React and Solid render Ark's `SegmentGroup.Indicator`; Vue measures it itself.
