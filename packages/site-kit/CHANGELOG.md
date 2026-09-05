# @devslab/site-kit

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
