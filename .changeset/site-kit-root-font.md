---
"@devslab/site-kit": patch
---

`styles.css` now gives the page root the family face: `:where(html) { font-family: var(--dds-font-family-sans); }`. Bare text (a hero `h1`, a legal page's paragraphs) has no `dds-*` class, so nothing set its font, and a product that did not add its own root rule rendered every Latin heading and paragraph in the browser's serif (AskLinq's public pages did). The rule has zero specificity, so a product rule on `html`, `:root`, `body` or `:lang()` still wins whatever the source order. VisionLinq, BookLinq and TraceLinq already have such a rule and render exactly as before. The stack is system and local faces only; nothing is downloaded.

`styles.css`가 페이지 뿌리에 가족 서체를 준다: `:where(html) { font-family: var(--dds-font-family-sans); }`. 맨 텍스트(히어로 `h1`, 법적 페이지의 문단)에는 `dds-*` 클래스가 없어 아무도 서체를 정하지 않았고, 뿌리 규칙을 따로 두지 않은 제품은 라틴 제목·문단을 전부 브라우저의 세리프로 그렸다(AskLinq 공개 페이지가 그랬다). 명시도가 0이라 `html`·`:root`·`body`·`:lang()`에 둔 제품 규칙은 소스 순서와 상관없이 이긴다. VisionLinq·BookLinq·TraceLinq는 이미 그런 규칙이 있어 지금과 똑같이 그린다. 스택은 기기에 설치된 글꼴뿐이고 내려받는 것은 없다.
