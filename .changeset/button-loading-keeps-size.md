---
"@devslab/dds-css": minor
"@devslab/dds-react": minor
"@devslab/dds-solid": minor
---

A loading Button keeps its size (D-042). The spinner used to sit beside the label and widened the button by about 24px, so neighbours moved and wrapped labels wrapped again whenever progress started. Now the label and icons stay in place and in the accessibility tree (the accessible name does not change) but are not painted, and the spinner is centred over them in the button's text color. Existing markup works unchanged, including text and a `.dds-spinner` placed directly in `.dds-btn` and `<a class="dds-btn">`; the React and Solid Buttons render the same markup as before. Keep the label the same while loading: the hidden text still sets the width. Products that reserved room for the spinner at all times can remove that workaround.

A loading Button or IconButton is no longer dimmed, even when it is also `[disabled]` (the framework components set both): dimmed to 0.45 the spinner fell to about 2:1 against the button, below the 3:1 a status graphic needs. Pointer blocking and the disabled semantics are unchanged.

Also fixed: under reduced motion the spinner stopped after one frame instead of slowing down, and in forced colors its gap filled in, leaving a still ring. It now keeps turning at half speed under reduced motion, and in forced colors it paints itself in system colors (a loading button uses the button face, a `GrayText` border and a `ButtonText` spinner).
