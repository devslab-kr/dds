# @devslab/site-kit

## 0.17.1

### Patch Changes

- be3ad5d: A link to an `id` on a page with the kit header (`/privacy#analytics` from the consent bar) now stops the target 16px below the sticky header instead of under it: `scroll-margin-block-start` = `--site-header-block-size` + 1px border + 16px, at zero specificity, on every `id` after `.site-header`. Sections and the hero keep their 8px offset; a product's own `scroll-margin` wins (D-035).
  - @devslab/dds-solid@0.17.1

## 0.17.0

### Minor Changes

- 2b91f53: Consent fixes from the first product adoption, and the owner's short banner copy (D-034).

  - **Exports.** The root entry now exports everything its types declare: in 0.16.0 `CONSENT_RECORD_MAX_BYTES`, `CONSENT_MAX_AGE_SECONDS`, `CONSENT_POLICY_VERSION_PATTERN`, `CONSENT_ANONYMOUS_ID_PATTERN`, `CONSENT_ACTIONS`, `GA_COOKIE_PATTERN`, `parseConsentCookie`, `formatConsentCookie`, `serializeConsentCookie` and `normalizeConsentPath` type-checked from `@devslab/site-kit` but were `undefined` at runtime, so the README's record size check never fired. The release check now installs the packed tarball and compares every entry point's declared value exports with what each built file exports.
  - **Layout.** A button label wraps only at a space, never inside a word (Korean keeps whole words). The bar follows its own width — one row, then the copy above a row of three, and at 36rem and below the choices stack full width at equal height (the settings dialog likewise) — so long product labels (German, Spanish, Portuguese, Tamil, Telugu) no longer break mid-word on a phone, and the one-row bar no longer squeezes the copy on a tablet.
  - **Copy.** The bar is short: KO "이용 통계 수집 동의 (선택)" / "서비스를 더 낫게 만들기 위해 이용 통계를 수집합니다. 동의는 선택이며, 동의하지 않아도 모든 기능을 쓸 수 있습니다." + "자세히 보기"; EN "Analytics (optional)" / "We collect usage statistics to improve the service. It's optional, and everything works without it." + "Learn more". "자세히 보기 / Learn more" is a link to the new **required** `ConsentBanner` prop `learnMoreHref` (the bar no longer links `privacyHref`). The settings dialog is minimal: necessary and analytics one line each, the `privacyHref` link, and two equal buttons, 취소 / Cancel and 선택 저장 / Save choices (모두 허용 and 거부 stay on the bar). The kit's default strings no longer name Google LLC, the United States or 14 months. New message keys: `learnMore`, `cancel`.

  **Breaking for adopters (minor, pre-1.0): `ConsentBanner` requires `learnMoreHref`, and `ConsentMessages` has two new keys.** What a product must do when it upgrades: (1) pass `learnMoreHref` — its privacy policy's section on analytics and overseas transfer, with the anchor (`/ko/privacy#analytics`); without a `#fragment` the banner throws `RangeError`. (2) Make sure that section carries the full disclosure: Google Analytics 4, the recipient Google LLC, the transfer to the United States, the retention period (14 months), that it is not used for advertising, and how to withdraw (the footer's 쿠키 설정 / Cookie settings). (3) Bring its other locales to this tone — a short bar, a one-line panel — and add `learnMore` and `cancel` to each.

  첫 제품 적용에서 나온 동의 수정과, 소유자가 정한 짧은 배너 문구(D-034).

  - **export.** 루트 진입점이 타입이 선언한 것을 전부 내보낸다: 0.16.0에서는 `CONSENT_RECORD_MAX_BYTES`·`CONSENT_MAX_AGE_SECONDS`·`CONSENT_POLICY_VERSION_PATTERN`·`CONSENT_ANONYMOUS_ID_PATTERN`·`CONSENT_ACTIONS`·`GA_COOKIE_PATTERN`·`parseConsentCookie`·`formatConsentCookie`·`serializeConsentCookie`·`normalizeConsentPath`가 `@devslab/site-kit`에서 타입 검사는 통과하고 실행 시에는 `undefined`였다 — 그래서 README의 기록 크기 검사가 한 번도 걸리지 않았다. 릴리스 검사가 이제 실제 tarball을 설치해 진입점마다 선언된 값 export와 빌드된 파일이 실제로 내보내는 것을 비교한다.
  - **배치.** 버튼 라벨은 공백에서만 줄을 바꾸고 단어 중간에서는 끊지 않는다(한국어는 단어를 통째로). 바는 자기 너비를 따른다 — 한 줄, 다음은 문구 아래 세 칸 한 줄, 36rem 이하에서는 선택을 전체 너비·같은 높이로 쌓는다(설정 대화상자도 같다). 그래서 제품의 긴 라벨(독일어·스페인어·포르투갈어·타밀어·텔루구어)이 휴대폰에서 단어 중간에 끊기지 않고, 태블릿 너비의 한 줄 바가 문구를 짓누르지 않는다.
  - **문구.** 바는 짧다: 한국어 "이용 통계 수집 동의 (선택)" / "서비스를 더 낫게 만들기 위해 이용 통계를 수집합니다. 동의는 선택이며, 동의하지 않아도 모든 기능을 쓸 수 있습니다." + "자세히 보기", 영어 "Analytics (optional)" / "We collect usage statistics to improve the service. It's optional, and everything works without it." + "Learn more". "자세히 보기 / Learn more"는 새 **필수** prop `learnMoreHref`로 가는 링크다(바는 더 이상 `privacyHref`를 링크하지 않는다). 설정 대화상자는 최소한으로: 필수·분석 한 줄씩, `privacyHref` 링크, 같은 무게의 버튼 둘 — 취소 / 선택 저장(모두 허용·거부는 바에 남는다). 킷의 기본 문구는 더 이상 Google LLC·미국·14개월을 말하지 않는다. 새 메시지 키: `learnMore`, `cancel`.

  **적용한 제품에는 깨지는 변경(1.0 전이라 minor): `ConsentBanner`에 `learnMoreHref`가 필수가 되고 `ConsentMessages`에 키 둘이 늘었다.** 제품이 올릴 때 할 일: (1) `learnMoreHref`를 넘긴다 — 개인정보처리방침에서 이용 통계와 국외 이전을 다루는 절, 앵커까지(`/ko/privacy#analytics`). `#fragment`가 없으면 배너가 `RangeError`를 던진다. (2) 그 절에 전부 있는지 확인한다: Google Analytics 4, 받는 곳 Google LLC, 미국으로의 이전, 보관 기간(14개월), 광고에 쓰지 않는다는 것, 철회 방법(바닥글의 쿠키 설정). (3) 다른 로케일 문구를 이 톤으로 맞춘다 — 짧은 바, 한 줄씩인 설정 — 그리고 로케일마다 `learnMore`·`cancel`을 더한다.

### Patch Changes

- @devslab/dds-solid@0.17.0

## 0.16.0

### Minor Changes

- 9ac065d: Analytics consent, opt-in (D-034). Until a visitor grants analytics for the current policy version nothing that contacts Google runs — no Tag Manager loader, no gtag, no GA cookies; the page only pushes Consent Mode v2 defaults (all denied) into its own `dataLayer`. New in the core: `createConsentManager` (the `site_consent` cookie — `v`, `a`, `t`, random `id`; first-party, `SameSite=Lax`, `Secure`, 12 months — Consent Mode updates, a one-time nonce-carrying Tag Manager load on grant, and on withdrawal `denied`, `ga-disable-<id>` and deletion of `_ga`/`_ga_*` on every parent domain; while analytics is not granted the `dataLayer` keeps only consent commands), `readConsentCookie` / `consentCookieGrantsAnalytics` for the server, `consentHeadScript`, and the record helpers `postConsentRecord` (same-origin POST, failed sends retried on the next page), `parseConsentRecord` (strict server-side validation) and `isSameOriginRequest`, plus `CONSENT_MESSAGES_KO` / `CONSENT_MESSAGES_EN`. New in Solid: `ConsentBanner` (a bottom bar whose three choices — 모두 허용, 거부, 설정 — are the same button at the same size, and a settings dialog with focus trap where necessary cookies are information and analytics an unticked switch; renders only after mount), `ConsentSettingsButton`, and `SiteFooter`'s `consentSettings` ("쿠키 설정"). New in the TanStack adapter: `toTanStackHead(metadata, { consent: { policyVersion, gtm, cookie } })` and `consentHeadEntry`, which add Google's loader only when the request's cookie grants the current version. `gtm` / `gtmHeadEntry` still load Tag Manager unconditionally for compatibility; family products move to `consent` (passing both throws). The README has the adoption steps, a record endpoint, a reference table with a 3-year retention sweep, and a snippet for a non-Solid site.

  분석 동의, 옵트인(D-034). 방문자가 현재 정책 버전에 대해 분석을 허용하기 전에는 구글에 닿는 것이 하나도 돌지 않는다 — Tag Manager 로더도, gtag도, GA 쿠키도 없고, 페이지는 Consent Mode v2 기본값(전부 denied)을 자기 `dataLayer`에 넣을 뿐이다. 코어 신규: `createConsentManager`(`site_consent` 쿠키 — `v`·`a`·`t`·무작위 `id`, 퍼스트파티·`SameSite=Lax`·`Secure`·12개월 — Consent Mode 업데이트, 허용 시 nonce를 실은 Tag Manager 한 번 로드, 철회 시 `denied`·`ga-disable-<id>`·모든 상위 도메인의 `_ga`/`_ga_*` 삭제, 분석이 허용되지 않은 동안 `dataLayer`는 동의 명령만 받음), 서버용 `readConsentCookie`·`consentCookieGrantsAnalytics`, `consentHeadScript`, 기록 도구 `postConsentRecord`(같은 출처 POST, 실패하면 다음 페이지에서 재전송)·`parseConsentRecord`(서버 쪽 엄격 검증)·`isSameOriginRequest`, 그리고 `CONSENT_MESSAGES_KO`·`CONSENT_MESSAGES_EN`. Solid 신규: `ConsentBanner`(세 선택 — 모두 허용·거부·설정 — 이 같은 버튼·같은 크기인 아래 바와, 포커스를 가두고 필수는 정보로·분석은 꺼진 스위치로 보여 주는 설정 대화상자. 마운트 뒤에만 렌더), `ConsentSettingsButton`, `SiteFooter`의 `consentSettings`("쿠키 설정"). TanStack 어댑터 신규: `toTanStackHead(metadata, { consent: { policyVersion, gtm, cookie } })`와 `consentHeadEntry` — 요청 쿠키가 현재 버전의 허용일 때만 구글 로더를 더한다. `gtm`·`gtmHeadEntry`는 호환을 위해 여전히 묻지 않고 로드하며, 가족 제품은 `consent`로 옮긴다(둘을 같이 주면 던짐). README에 적용 절차, 기록 엔드포인트, 3년 보관 정리를 포함한 참고 테이블, Solid가 아닌 사이트용 코드가 있다.

### Patch Changes

- d16b85a: Consent review fixes (D-034, follow-up to #77). `createConsentManager` now throws `RangeError` when `gtm` is given without `measurementIds`: `ga-disable-<id>` is the only switch that stops a GA4 tag Tag Manager already initialised, whose own listeners would otherwise keep sending cookieless pings after a withdrawal until the page reloads. New `CONSENT_RESPONSE_HEADERS` (`Cache-Control: private, no-store`, `Vary: Cookie`), exported from the core and the TanStack adapter, for every response whose head was decided from the consent cookie, so a shared cache never serves one visitor's granted head to another.

  동의 리뷰 수정(D-034, #77 후속). `gtm`을 주고 `measurementIds`가 없으면 `createConsentManager`가 `RangeError`를 던진다 — 이미 초기화된 GA4 태그를 멈추는 유일한 스위치가 `ga-disable-<id>`라, 없으면 철회 뒤에도 새로고침 전까지 쿠키 없는 핑이 나간다. 새 `CONSENT_RESPONSE_HEADERS`(`Cache-Control: private, no-store`, `Vary: Cookie`)를 코어와 TanStack 어댑터에서 내보낸다. 동의 쿠키로 head를 정한 응답에 보내서 공유 캐시가 한 방문자의 허용 head를 다른 방문자에게 주지 않게 한다.
  - @devslab/dds-solid@0.16.0

## 0.15.0

### Minor Changes

- 4b4bfd1: The family font ships here once: `@devslab/site-kit/fonts.css` plus `fonts/` — Geist and Geist Mono (fontsource script subsets, variable 100–900) and Pretendard (the author's 92 dynamic subsets, variable 45–920) as woff2, each with its SIL OFL 1.1 license and a manifest of upstream versions and checksums (D-033). The `@font-face` names are the token's names (`Geist`, `Geist Mono`, `Pretendard`), so importing the stylesheet makes `--dds-font-family-sans` / `-mono` and the page-root rule resolve to the self-hosted files with nothing renamed. Every face has a `unicode-range` and `font-display: swap`; a Korean landing page fetches 12–16 Pretendard subsets (305–424 KB measured) instead of the 2 MB single file. The `url()`s are package-relative, so Vite/TanStack Start copies the faces into the product's own `/assets` (`font-src 'self'` holds); without a bundler, copy `fonts.css` and `fonts/` side by side. New: `fontPreloadLinks()`, `FAMILY_FONT_PRELOAD_FILE`, and `toTanStackHead(metadata, { fontPreload })` for a same-origin `crossorigin` preload of the Latin face. Opt-in — `styles.css` does not import it, so a product that loads nothing renders as before. Products that registered `"Geist Variable"` / `"Pretendard Variable"` themselves rename those to `Geist` / `Pretendard` when they move over (README: "Moving off a product's own copy").

  가족 서체를 여기서 한 번 싣는다: `@devslab/site-kit/fonts.css`와 `fonts/` — Geist·Geist Mono(fontsource 문자권 서브셋, 가변 100–900)와 Pretendard(저작자의 동적 서브셋 92개, 가변 45–920) woff2, 패밀리마다 SIL OFL 1.1 라이선스, 원본 버전·체크섬 매니페스트(D-033). `@font-face` 이름이 토큰의 이름(`Geist`·`Geist Mono`·`Pretendard`)이라 스타일시트를 import하면 `--dds-font-family-sans`/`-mono`와 페이지 뿌리 규칙이 이름을 바꾸지 않고 자체 호스팅 파일로 이어진다. 모든 face에 `unicode-range`와 `font-display: swap`이 있고, 한국어 랜딩은 2 MB 단일 파일 대신 Pretendard 서브셋 12–16개(실측 305–424 KB)를 받는다. `url()`이 패키지 기준 상대 경로라 Vite/TanStack Start가 face를 제품 자기 `/assets`로 복사한다(`font-src 'self'` 유지). 번들러가 없으면 `fonts.css`와 `fonts/`를 나란히 복사한다. 새 API: 라틴 face를 같은 도메인·`crossorigin`으로 미리 받는 `fontPreloadLinks()`, `FAMILY_FONT_PRELOAD_FILE`, `toTanStackHead(metadata, { fontPreload })`. 옵트인 — `styles.css`가 import하지 않으므로 아무것도 불러오지 않는 제품은 전과 같다. `"Geist Variable"`·`"Pretendard Variable"`을 직접 등록하던 제품은 옮겨 올 때 그 이름을 `Geist`·`Pretendard`로 바꾼다(README "제품 자체 사본에서 옮겨 오기").

### Patch Changes

- @devslab/dds-solid@0.15.0

## 0.14.1

### Patch Changes

- 408e028: `styles.css` now gives the page root the family face: `:where(html) { font-family: var(--dds-font-family-sans); }`. Bare text (a hero `h1`, a legal page's paragraphs) has no `dds-*` class, so nothing set its font, and a product that did not add its own root rule rendered every Latin heading and paragraph in the browser's serif (AskLinq's public pages did). The rule has zero specificity, so a product rule on `html`, `:root`, `body` or `:lang()` still wins whatever the source order. VisionLinq, BookLinq and TraceLinq already have such a rule and render exactly as before. The stack is system and local faces only; nothing is downloaded.

  `styles.css`가 페이지 뿌리에 가족 서체를 준다: `:where(html) { font-family: var(--dds-font-family-sans); }`. 맨 텍스트(히어로 `h1`, 법적 페이지의 문단)에는 `dds-*` 클래스가 없어 아무도 서체를 정하지 않았고, 뿌리 규칙을 따로 두지 않은 제품은 라틴 제목·문단을 전부 브라우저의 세리프로 그렸다(AskLinq 공개 페이지가 그랬다). 명시도가 0이라 `html`·`:root`·`body`·`:lang()`에 둔 제품 규칙은 소스 순서와 상관없이 이긴다. VisionLinq·BookLinq·TraceLinq는 이미 그런 규칙이 있어 지금과 똑같이 그린다. 스택은 기기에 설치된 글꼴뿐이고 내려받는 것은 없다.
  - @devslab/dds-solid@0.14.1

## 0.14.0

### Minor Changes

- e003c3c: Google Tag Manager, written once for the family sites. `gtmHeadScript(id)` is Google's nonce-aware head loader (from "Use Tag Manager with a Content Security Policy", byte for byte, id substituted), `gtmNoscriptIframe(id)` is the noscript iframe, `GTM_CSP_SOURCES` lists the CSP sources Tag Manager and GA4 without Ads features need, and an id that does not match `/^GTM-[A-Z0-9]+$/` throws `RangeError` before it reaches a script string. `toTanStackHead(metadata, { gtm })` adds the loader as a head script, and `gtmHeadEntry(id)` is the same entry for a route that builds its own head. The entry has no nonce: the router stamps `ssr.nonce` on it, so set `ssr.nonce` to the request's nonce on the server and to `""` on the client (see the README). Omitted, nothing changes.

  Google Tag Manager를 가족 사이트를 위해 한 번만 쓴다. `gtmHeadScript(id)`는 구글의 nonce 대응 head 로더("Use Tag Manager with a Content Security Policy"의 것을 바이트 그대로, ID만 치환), `gtmNoscriptIframe(id)`는 noscript iframe, `GTM_CSP_SOURCES`는 Tag Manager와 Ads 기능 없는 GA4에 필요한 CSP 출처이고, `/^GTM-[A-Z0-9]+$/`에 맞지 않는 ID는 스크립트 문자열에 닿기 전에 `RangeError`를 던진다. `toTanStackHead(metadata, { gtm })`가 로더를 head 스크립트로 더하고, `gtmHeadEntry(id)`는 head를 직접 만드는 라우트를 위한 같은 항목이다. 항목에는 nonce가 없다. 라우터가 `ssr.nonce`를 찍으므로 서버에서는 요청의 nonce, 클라이언트에서는 `""`로 정한다(README 참고). 옵션을 생략하면 아무것도 바뀌지 않는다.

### Patch Changes

- @devslab/dds-solid@0.14.0

## 0.13.0

### Minor Changes

- cafe757: Header and footer options for a single-language landing and a footer that prints business details (D-029). The new props are optional:

  - `SiteHeader` `locale` is optional; without it no language picker renders.
  - `SiteBrand.label` names the header brand link; a wordmark `logo` with `name: ""` prints once and leaves no empty `<strong>` in the footer.
  - `SiteFooter` `details` (a block under the brand line) and `linksLabel` (wraps the links in `<nav aria-label>`); `SiteLink.emphasis` draws a link heavier.
  - Sections and the hero stop below the sticky header (`scroll-margin-block-start`, header height `--site-header-block-size`); `--site-hero-eyebrow-tracking` and `--site-hero-eyebrow-weight` tune the hero eyebrow.
  - The header and footer read `brand` (and the footer `details`) once, so inline JSX stays one build per side outside the shell too.

  Applies to every consumer:

  - The narrow-screen menu closes on Escape (focus back on the menu button) and when a link inside it is followed. Buttons, links that open a new tab or window, and an Escape handled by a control inside the header or an `aria-modal` element leave it open.
  - On touch, the brand link and header, footer and footer-language links are 44px targets.
  - At 720px and below the closed header's first row is 64px with no block padding: phone headers of products without a global `box-sizing: border-box` reset (TraceLinq, BookLinq) get 24px shorter (89px to 65px), and products with a 44px menu button 4px shorter. The open menu is 44px link rows with 12px under the controls. Check the phone header when upgrading.
  - Footer links are baseline-aligned; a footer row with details aligns on its first line. The 16px footer mark size now applies only beside a printed name.

  Type change: `SiteHeaderProps["locale"]` is now optional. Code that reads it from a `SiteHeaderProps` value must narrow it (BookLinq's `MarketingFrame` reads `props.header.locale.locale`).

### Patch Changes

- @devslab/dds-solid@0.13.0

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
