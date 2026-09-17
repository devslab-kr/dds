# @devslab/site-kit

## 0.12.2

### Patch Changes

- f19fde6: `StatusBanner` reads its `children` once. `<StatusBanner><ul>…</ul></StatusBanner>` compiles to a getter, and the banner checked it for truthiness and then inserted it — two reads, so the first built a list (and every `<li>` under it) that was thrown away, each with a hydration key the server never wrote into the HTML. Solid's production build clones a template when a key is missing, so nothing showed; the development build throws `Hydration Mismatch`, so a consumer's status page fell to its error boundary in `vite dev` (BookLinq, 0.12.1). A memo is now both the check and the insert, evaluated at the same point in the tree on both sides. A hydration test renders two banners with inline children and hydrates them with the development build.

  `StatusBanner`가 `children`을 한 번만 읽는다. `<StatusBanner><ul>…</ul></StatusBanner>`는 게터로 컴파일되는데, 배너가 진위 검사 뒤 삽입으로 두 번 읽어서 첫 읽기가 만든 목록(과 그 아래 `<li>` 전부)이 버려지면서 서버 HTML엔 없는 하이드레이션 키를 각각 소모했다. Solid 프로덕션 빌드는 없는 키에 템플릿을 복제해 아무것도 안 보였지만, 개발 빌드는 `Hydration Mismatch`를 던져 소비자의 상태 페이지가 `vite dev`에서 에러 경계로 떨어졌다(BookLinq, 0.12.1). 이제 메모 하나가 검사와 삽입을 겸하고 양쪽에서 트리의 같은 지점에 한 번 평가된다. 하이드레이션 테스트가 배너 둘을 인라인 children으로 렌더해 개발 빌드로 하이드레이션한다.
  - @devslab/dds-solid@0.12.2

## 0.12.1

### Patch Changes

- 076b65f: `MarketingShell` reads its `header` and `footer` once. `header={{ … }}` compiles to a getter, and spreading `props.header` straight into `SiteHeader` re-evaluated that literal on every prop read — any JSX built eagerly inside it was built again each time and consumed hydration keys, a different number of times on the server than on the client. From the first drift the client rebuilt the whole header from templates, and the flag sprite (0.11.0) came back empty: the first consumer to ship the sprite showed a blank flag box in every browser while its server HTML carried all the symbols. A memo evaluates the literal exactly once per side, at the same point in the tree. And a sprite that reaches the client empty now loads its bodies whatever the reason — it looks at the element, not at whether hydration is running.

  `MarketingShell`이 `header`·`footer`를 한 번만 읽는다. `header={{ … }}`는 게터로 컴파일되는데 `props.header`를 `SiteHeader`에 그대로 펼치면 prop을 읽을 때마다 그 리터럴이 다시 평가됐다 — 안에서 즉시 만들어진 JSX가 매번 다시 만들어지며 하이드레이션 키를 소모했고, 서버와 클라이언트의 횟수가 달랐다. 첫 어긋남부터 클라이언트가 헤더 전체를 템플릿에서 다시 만들었고 국기 스프라이트(0.11.0)는 빈 채로 돌아왔다: 스프라이트를 처음 출하한 소비자의 서버 HTML엔 심볼이 다 있었는데 모든 브라우저에서 국기 칸이 비어 있었다. 메모는 리터럴을 양쪽에서 정확히 한 번, 트리의 같은 지점에서 평가한다. 그리고 클라이언트에 빈 채로 도착한 스프라이트는 이유가 무엇이든 본문을 로드한다 — 하이드레이션 여부가 아니라 엘리먼트를 본다.
  - @devslab/dds-solid@0.12.1

## 0.12.0

### Minor Changes

- ee2bee6: `brandIconLinks()` and `BRAND_ICON_FILES`: one place that says which `@devslab/linq-brand` icon files a page head links, and in what order — SVG first, a 48px PNG so search engines have a declared square of the size they ask for, the 16/32/48 ICO for the bare-URL convention, the 180px apple-touch icon. `toTanStackHead(metadata, { icons })` appends them (`true` for the `/brand` default, or `{ basePath }`); omitted, nothing changes. Before this, the four family sites each linked a different subset, and one linked none — its search result kept showing the icon from before the mark changed.

  `brandIconLinks()`와 `BRAND_ICON_FILES`: 페이지 head가 `@devslab/linq-brand`의 어떤 아이콘 파일을 어떤 순서로 링크하는지 정하는 한 자리 — SVG 먼저, 검색엔진이 요구하는 크기의 선언된 정사각형으로 48px PNG, 주소만으로 요청되는 관례용 16/32/48 ICO, 180px 애플 터치 아이콘. `toTanStackHead(metadata, { icons })`가 이를 덧붙인다(`true`면 `/brand` 기본값, 또는 `{ basePath }`). 생략하면 아무것도 바뀌지 않는다. 이전에는 가족 사이트 넷이 각자 다른 부분집합을 링크했고, 하나는 아무것도 링크하지 않아 마크가 바뀐 뒤에도 검색 결과가 옛 아이콘을 계속 보여줬다.

### Patch Changes

- @devslab/dds-solid@0.12.0

## 0.11.1

### Patch Changes

- @devslab/dds-solid@0.11.1

## 0.11.0

### Patch Changes

- Updated dependencies [6f4a2bc]
  - @devslab/dds-solid@0.11.0

## 0.10.0

### Minor Changes

- 81b3abd: The flag artwork leaves the browser bundle. `@devslab/site-kit/solid` was one 138 KB file, and a consumer that imported only `SiteHeader` shipped nearly all of it — not because tree-shaking failed (importing every export adds just 13 KB) but because the menu imported the fourteen vendored flag SVGs statically (~115 KB; Spain's coat of arms alone is 85 KB) and re-wrote them into the DOM on the client, hydration included. `LocaleMenu` decides `select` vs `flag` at runtime, so every header reached them.

  Now each flag menu renders one `<symbol>` sprite and every flag is an `<svg><use href="#…">` of it, so a locale change on the client only swaps an `href`. The server build writes the sprite; hydration adopts it; the browser build reaches the bodies only through a dynamic `import()` — emitted as its own chunk, `dist/flag-bodies.js` — taken when a flag menu renders with no server HTML (a client-only app, a jsdom test). The generated data splits into `flag-countries.mjs` (the map the menu needs) and `flag-bodies.mjs`; `@devslab/site-kit/flags` keeps its API and gains `flagCountryFor` and `FLAG_VIEWBOX`. `pnpm check` now builds a minimal consumer (`fixtures/bundle-probe`) with Vite + vite-plugin-solid and fails if a flag body ever returns to the main chunk. No consumer code changes.

  Measured, gzip in parentheses. `dist/solid.js`: 138.2 KB (32.5) → 28.7 KB (8.2). Minimal consumer importing `SiteHeader` only: 147.5 KB (38.8) → 42.8 KB (15.1). TraceLinq landing (`packages/landing`, TanStack Start, main client chunk): 291.0 KB (86.5) → 186.3 KB (62.1); the 105 KB (23.7) flag chunk is emitted beside it and is not requested by a hydrated page. Server-rendered HTML still carries the bodies, once per country per menu instead of the current locale twice.

  국기 아트워크가 브라우저 번들에서 빠집니다. `@devslab/site-kit/solid`는 138 KB 파일 하나였고 `SiteHeader`만 import한 소비자도 거의 통째로 실었습니다 — tree-shaking 실패가 아니라(전부 import해도 13 KB 차이) 메뉴가 벤더링한 국기 SVG 14개(~115 KB, 스페인 문장 하나가 85 KB)를 정적으로 import하고 클라이언트에서, 하이드레이션 중에도, DOM에 다시 쓰고 있었기 때문입니다. `LocaleMenu`가 `select`/`flag`를 런타임에 고르므로 모든 헤더가 거기에 닿았습니다.

  이제 국기 메뉴마다 `<symbol>` 스프라이트 하나를 렌더링하고 모든 국기는 그것을 `<svg><use href="#…">`로 참조하므로, 클라이언트에서 로케일이 바뀌어도 `href`만 바뀝니다. 스프라이트는 서버 빌드가 쓰고, 하이드레이션은 그대로 인수하며, 브라우저 빌드는 본문을 동적 `import()`(자기 청크 `dist/flag-bodies.js`)로만 닿습니다 — 서버 HTML 없이 국기 메뉴가 렌더링될 때(클라이언트 전용 앱, jsdom 테스트)에만. 생성 데이터는 `flag-countries.mjs`(메뉴가 필요한 지도)와 `flag-bodies.mjs`로 나뉘고 `@devslab/site-kit/flags`는 API를 유지한 채 `flagCountryFor`·`FLAG_VIEWBOX`를 얻습니다. `pnpm check`가 최소 소비자(`fixtures/bundle-probe`)를 Vite + vite-plugin-solid로 빌드해 국기 본문이 메인 청크로 되돌아오면 실패합니다. 소비자 코드 변경은 없습니다.

  측정(괄호는 gzip). `dist/solid.js`: 138.2 KB (32.5) → 28.7 KB (8.2). `SiteHeader`만 import한 최소 소비자: 147.5 KB (38.8) → 42.8 KB (15.1). TraceLinq 랜딩(`packages/landing`, TanStack Start, 클라이언트 메인 청크): 291.0 KB (86.5) → 186.3 KB (62.1); 105 KB (23.7) 국기 청크는 옆에 생성되지만 하이드레이션된 페이지는 요청하지 않습니다. 서버 렌더 HTML에는 본문이 여전히 실립니다 — 현재 로케일 두 번 대신 메뉴당 나라마다 한 번.

### Patch Changes

- @devslab/dds-solid@0.10.0

## 0.9.0

### Minor Changes

- bd21fb4: `SiteFooter`'s language row collapses into a `<details>` menu triggered by the current language's own name. Every locale anchor stays in the document open or closed, so crawlers still follow them and it works without JavaScript; Escape closes it and returns focus to the trigger, as the header's flag menu does. The flat row was a different length in every product — ten locales in one, twenty in another — so the same footer carried a different visual weight depending on how many languages the product sells in.

  `SiteFooter`의 언어 행이 `<details>` 메뉴로 접힙니다. 트리거는 **현재 언어의 자기 이름**입니다(페이지를 못 읽는 사람도 알아보는 유일한 라벨). 열려 있든 접혀 있든 로케일 앵커는 전부 문서에 남아 크롤러가 따라가고 JS 없이 동작하며, Esc로 닫고 포커스가 트리거로 돌아옵니다(헤더 국기 메뉴와 동일). 평평한 행은 제품마다 길이가 달라(10개·14개·20개) 같은 푸터가 파는 언어 수에 따라 다른 무게를 지고 있었습니다.

### Patch Changes

- @devslab/dds-solid@0.9.0

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
