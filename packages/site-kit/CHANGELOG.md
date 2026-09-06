# @devslab/site-kit

## 0.8.1

### Patch Changes

- 86a80d4: `.site-footer__links` gets the body-2 size. The kit gave the row layout and colour but no size, so the footer inherited the 16px body and read a step larger than the same row on a sibling product's page; every consumer that noticed had added the rule locally, which is the drift the footer release exists to end.

  `.site-footer__links`에 body-2 크기 지정. kit이 이 행에 레이아웃과 색만 주고 크기를 안 줘서 푸터가 16px 본문 크기를 물려받아 형제 제품의 같은 행보다 한 단계 크게 읽혔습니다. 알아챈 소비자마다 로컬로 규칙을 넣어 뒀는데, 그 드리프트가 바로 이 푸터 릴리스가 끝내려는 것입니다.
  - @devslab/dds-solid@0.8.1

## 0.8.0

### Minor Changes

- 329979a: Add framework-neutral publisher identity, Organization references, safe JSON-LD and static attribution rendering, with a shared bilingual DevsLab preset at `@devslab/site-kit/devslab`.

### Patch Changes

- @devslab/dds-solid@0.8.0

## 0.7.0

### Minor Changes

- 1249d1a: `SiteFooter` renders the family footer: an optional language row (`locale`, `localeRegistry`, `onLocaleSelect`), the brand mark it already accepted but dropped, middot-separated `family` links after the brand name, and a copyright isolated in `<bdi>` with an optional `copyrightHref`. `styles.css` gains the `.site-footer__langs` / `__row` / `__brand` rules. Additive — a caller passing only brand/links/copyright/messages keeps its single row, plus its mark. VisionLinq, BookLinq and TraceLinq each carried a hand-written copy of this footer, and each left a note saying extending `SiteFooter` was a dds release they were waiting on; this is that release.

  `SiteFooter`가 가족 푸터를 그립니다 — 선택적 언어 행(`locale`·`localeRegistry`·`onLocaleSelect`), 받고도 버리던 브랜드 마크, 브랜드 이름 뒤 가운뎃점으로 이어지는 `family` 링크, `<bdi>`로 감싼 저작권(선택적 `copyrightHref`). `styles.css`에 `.site-footer__langs`·`__row`·`__brand` 규칙 추가. 덧붙이기만 하므로 brand/links/copyright/messages만 넘기던 호출부는 한 행 그대로에 마크만 더해집니다. VisionLinq·BookLinq·TraceLinq가 각자 이 푸터를 손으로 짜 놓고 저마다 "SiteFooter 확장은 기다려야 할 dds 릴리스"라고 적어 뒀는데, 그 릴리스입니다.

### Patch Changes

- @devslab/dds-solid@0.7.0

## 0.6.0

### Minor Changes

- fc15c3f: Section primitives (`SectionBlock`, `SectionHead`, `HeroSplit`, `StepFlow`, `FeatureRows`, `PricingNote`) extracted from VisionLinq's landing, with `site-sections.css` inside `styles.css`. `StepFlow` numbers steps with ring numerals — a different glyph system from the section index. `defineLocaleRegistry({ only })` for products that sell in a subset of the family languages. `globe` joins the core icon set.

  섹션 원시 여섯 개(VisionLinq 랜딩에서 추출), `StepFlow`는 원형 숫자로 단계를 셈(섹션 인덱스와 다른 글리프 체계), `defineLocaleRegistry({ only })` 부분집합 레지스트리, `globe` 아이콘 추가.

### Patch Changes

- @devslab/dds-solid@0.6.0

## 0.5.2

### Patch Changes

- @devslab/dds-solid@0.5.2

## 0.5.1

### Patch Changes

- 2a91469: `toTanStackHead` and `toHtmlAttributes` are generic over the locale code, matching the builders that feed them. Metadata built with a product registry (`SiteMetadata<string>`) no longer needs a cast or a module augmentation to reach the TanStack head.
  - @devslab/dds-solid@0.5.1

## 0.5.0

### Minor Changes

- bc72681: Products can ship languages the family does not carry.

  `defineLocaleRegistry({ extra })` builds the family's fourteen plus a product's
  own, and every locale-aware helper accepts one — `validateCatalogs`,
  `buildMetadata`, `buildSitemap`, `localizedPath`, `localizedUrl`, `LocaleMenu`,
  `SiteHeader`. Omitted, they use the family registry, so existing consumers are
  unchanged. An extra locale names a `flagCountry` this package already vendors
  rather than shipping artwork, and `flagFor(locale, registry)` resolves it;
  `FLAGS_BY_COUNTRY` is the new country-keyed index.

  The motivating case: BookLinq sells to salons in India and its assistant
  already answers in Tamil, Telugu, Bengali, Marathi, Gujarati and Kannada. Those
  are not family languages and putting them in `LOCALES` would give AskLinq and
  devslab.kr six entries they have no copy for.

  Two bugs fixed along the way:

  - **`SelectLocaleMenu` marked no option selected under SSR.** It set
    `value` on the `<select>`, which is a DOM property with no matching content
    attribute, so server-rendered markup left the browser to pick `option[0]`.
    Every visitor, in every language, saw the first locale as their current one,
    and touching the control switched them to it. It now sets `selected` on the
    option.
  - **`localeAttributes` decided direction by testing for Arabic.** It read
    `canonical === "ar" ? "rtl" : "ltr"`, correct only while Arabic was the
    family's one RTL language; direction now comes from the locale definition, so
    a product adding Urdu or Hebrew gets it right.

### Patch Changes

- @devslab/dds-solid@0.5.0
