---
"@devslab/dds-solid": patch
"@devslab/dds-react": patch
---

Render Combobox, SelectPicker and TimePicker without `style` attributes, so pages with a strict `style-src-attr` CSP no longer log violations. The hidden validation input and the option list carried inline copies of rules `choice.css` already has. Solid writes a static style object into the HTML it clones, and both frameworks server-render it as a `style` attribute, which such a CSP blocks (FM saw two per TimePicker). The rules now come only from `.dds-choice-validation` and `.dds-choice-content`. Load `@devslab/dds-css` (`dds.css` or `components/choice.css`) for the validation input to stay hidden, as for every other DDS component.
