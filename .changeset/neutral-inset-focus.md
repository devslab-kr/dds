---
"@devslab/dds-tokens": patch
"@devslab/dds-css": patch
---

Use a shared neutral focus color in both themes: #52606d in light mode and
#b0bbc4 in dark mode. Text, multiline, select, choice, number and date/range
inputs now draw their 2px focus ring inside the existing border box. Calendar
popup focus uses the same semantic focus color. Keyboard behavior, error
borders, disabled states and the outer ring placement of small controls remain
unchanged. These defaults are shared by CSS, Solid, React, Vue and Svelte.
