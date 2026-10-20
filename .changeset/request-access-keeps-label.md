---
"@devslab/site-kit": patch
---

`RequestAccessForm` keeps its submit label while sending. A loading Button now hides its label and keeps its width (D-043), so swapping the label for `messages.submitting` still resized the button, changed its accessible name and showed nothing. The button keeps `messages.submit`, and `messages.submitting` is shown and announced in the form's status region until the result replaces it.
