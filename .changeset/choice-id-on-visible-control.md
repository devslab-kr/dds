---
"@devslab/dds-solid": patch
"@devslab/dds-react": patch
---

Put a Combobox, SelectPicker or TimePicker `id` on the visible control: the text box (Combobox, TimePicker) or the button (SelectPicker). Before this, the id only seeded Ark's prefixed part IDs, so the input was `combobox:<id>:input` and no element carried `<id>` itself. A form field that renders its own `<label for={id}>` could not reach the control: clicking the label did nothing and the control had no accessible name. Now the label names the control and focuses it on click. Other part IDs (`combobox:<id>:content`, `select:<id>:label`, …) are unchanged. Code that targeted `combobox:<id>:input` or `select:<id>:trigger` by string should use `<id>` instead.
