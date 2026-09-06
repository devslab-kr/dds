---
"@devslab/site-kit": minor
---

`SiteFooter` renders the family footer: an optional language row (`locale`, `localeRegistry`, `onLocaleSelect`), the brand mark it already accepted but dropped, middot-separated `family` links after the brand name, and a copyright isolated in `<bdi>` with an optional `copyrightHref`. `styles.css` gains the `.site-footer__langs` / `__row` / `__brand` rules. Additive — a caller passing only brand/links/copyright/messages keeps its single row, plus its mark. VisionLinq, BookLinq and TraceLinq each carried a hand-written copy of this footer, and each left a note saying extending `SiteFooter` was a dds release they were waiting on; this is that release.

`SiteFooter`가 가족 푸터를 그립니다 — 선택적 언어 행(`locale`·`localeRegistry`·`onLocaleSelect`), 받고도 버리던 브랜드 마크, 브랜드 이름 뒤 가운뎃점으로 이어지는 `family` 링크, `<bdi>`로 감싼 저작권(선택적 `copyrightHref`). `styles.css`에 `.site-footer__langs`·`__row`·`__brand` 규칙 추가. 덧붙이기만 하므로 brand/links/copyright/messages만 넘기던 호출부는 한 행 그대로에 마크만 더해집니다. VisionLinq·BookLinq·TraceLinq가 각자 이 푸터를 손으로 짜 놓고 저마다 "SiteFooter 확장은 기다려야 할 dds 릴리스"라고 적어 뒀는데, 그 릴리스입니다.
