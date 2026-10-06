# @devslab/site-kit

DevsLab 제품의 공개 웹사이트를 위한 공개 인프라 패키지다. 가족 로케일에 대한 엄격한 카탈로그(제품별 확장 가능), 로케일 협상, SEO/GEO 문서 생성기, 접근 가능한 SolidJS 2 사이트 셸을 제공한다. 제품명·주장·내비게이션·번역 문구는 항상 소비 앱이 소유한다.

## 진입점

- `@devslab/site-kit` — 런타임 중립 로케일·카탈로그·SEO·사이트맵·robots·검증된 사실·Google Tag Manager·분석 동의 유틸리티
- `@devslab/site-kit/solid` — 헤더·푸터·언어/테마 컨트롤·마케팅/법률/상태/오류 레이아웃·접근 요청 폼·동의 바
- `@devslab/site-kit/tanstack-start` — 중립 메타데이터를 TanStack Start head descriptor로 변환(브랜드 아이콘과 동의 게이트를 거친 Tag Manager 로더는 옵트인)
- `@devslab/site-kit/styles.css` — 논리 속성과 RTL을 지원하는 공통 사이트 스타일. 페이지 뿌리에 가족 서체(`:where(html) { font-family: var(--dds-font-family-sans) }`)도 주어 맨 제목·문단이 브라우저 세리프로 남지 않는다. 명시도가 0이라 제품이 `html`·`:root`·`body`·`:lang()`에 둔 규칙이 이긴다.
- `@devslab/site-kit/fonts.css` — 가족 서체(Geist·Geist Mono·Pretendard)를 토큰의 패밀리 이름으로 등록한 자체 호스팅 woff2. [가족 서체](#가족-서체) 참고

카탈로그 생성은 의도적으로 엄격하다. 레지스트리의 모든 로케일이 동일한 키와 이름 기반 placeholder를 가져야 하며 런타임 문구 폴백은 없다.

사이트맵은 레지스트리 로케일마다 alternate 하나와 `x-default`를 출력한다.
`buildVerifiedJsonLd`는 검토된 schema type과 claim allowlist만 허용하고 모든
claim leaf가 검증된 사실 레지스트리를 참조하도록 강제한다. `buildRobots`의
기존 environment-only 출력은 유지되며, 선택적 `policies`로 검색 인덱싱,
인용 crawler, 모델 학습 crawler를 각각 제어할 수 있다.

## 하이드레이션

`MarketingShell`은 아무것도 렌더하기 전에 `header`·`footer`를 한 번(메모) 읽는다. `header={{ … }}`는 게터로 컴파일되므로 셸이 prop마다 다시 읽으면 리터럴 안에서 즉시 만들어진 JSX(`actions` 앵커, 로고)가 읽을 때마다 다시 만들어져 하이드레이션 키를 소모하고 — 서버와 브라우저의 횟수가 다르다 — 클라이언트는 헤더를 템플릿에서 다시 만든다. 셸 밖에서 `SiteHeader`·`SiteFooter`를 직접 마운트하는 제품은 같은 방식으로 자기 props를 한 번만 읽어야 한다. 국기 스프라이트는 이유가 무엇이든 클라이언트에 빈 채로 도착하면 본문을 로드한다.

헤더와 푸터는 `brand`(푸터는 `details`도)를 스스로 한 번만 읽는다. 그래서 셸 밖에서도 인라인으로 만든 로고·details 블록이 서버와 브라우저에서 각각 한 번씩만 만들어진다(D-029).

## 헤더·푸터 옵션

한 언어만 쓰는 제품과, 사업자 정보를 바닥에 적어야 하는 제품을 위한 옵션(D-029). props는 모두 선택이고, 아무것도 넘기지 않는 제품은 전과 같은 마크업을 받는다. 다만 모든 제품에 적용되는 기본값 몇 가지가 있다(옵션 목록 뒤).

```tsx
<MarketingShell
  mainWidth="bleed"
  header={{
    brand: { name: "", href: "/", label: "Acme 첫 화면", logo: <Wordmark /> }, // 워드마크가 로고 — 이름이 두 번 찍히지 않게 name ""
    navigation: [{ href: "#how", label: "이용 방법" }, { href: "#contact", label: "문의" }],
    messages,
    get actions() { return <a class="dds-btn dds-btn--primary" href="#contact">이용 문의</a>; },
    // locale 없음: 언어 메뉴 없음
  }}
  footer={{
    brand: { name: "", href: "/", logo: <Wordmark /> },
    get details() { return <><p>상호 Acme · 사업자등록번호 000-00-00000</p><address>서울 …</address></>; },
    linksLabel: "바닥 메뉴",
    links: [{ href: "/terms", label: "이용약관" }, { href: "/privacy", label: "개인정보처리방침", emphasis: true }],
    copyright: "© Acme",
    messages,
  }}
  messages={messages}
>…</MarketingShell>
```

- `SiteHeader`의 `locale`은 선택이다. 넘기지 않으면 언어 메뉴를 그리지 않는다 — 언어가 하나뿐인 메뉴는 고장 난 것처럼 보인다. 푸터의 `locale`은 원래 이렇게 동작했다.
- `SiteBrand.label`은 헤더 브랜드 링크의 이름(`aria-label`)이다. 화면에 보이는 이름으로 시작한다. 워드마크를 `logo`로 넘기면 `name: ""` — 그러면 푸터도 빈 `<strong>`을 그리지 않는다.
- 좁은 화면의 메뉴는 Esc로 닫히고(포커스는 메뉴 버튼으로 돌아감), 안의 링크를 따라가도 닫힌다 — 같은 페이지 앵커도. 안 그러면 열린 메뉴가 방금 고른 섹션을 가린다. 안의 버튼(테마 전환)과 새 탭·새 창으로 여는 링크는 메뉴를 닫지 않는다. 헤더 안의 컨트롤(국기 메뉴)이 이미 처리한 Esc와 `aria-modal` 요소 안에서 온 Esc는 그 컨트롤에 맡긴다.
- 터치(`pointer: coarse`): 브랜드 링크·내비게이션·푸터·푸터 언어 링크가 버튼처럼 44px 누르는 면이다. 720px 이하에서 열린 메뉴의 링크는 44px 줄이고, 닫힌 헤더의 첫 줄은 64px 그대로다.
- `SiteFooter`의 `details`: 브랜드 줄 아래 블록(사업자 정보, `<address>`), 줄 간격 4px·문단 여백 없음. `linksLabel`은 링크를 `<nav aria-label>`로 감싼다 — 헤더 내비게이션과 다른 이름으로. `logo`로 넘긴 푸터 워드마크(`name: ""`)는 자기 크기를 지킨다 — 16px은 이름 옆 아이콘 마크용 — 그리고 접근 가능한 이름을 스스로 가진다(`<img alt>`나 글자). `label`은 헤더 링크의 이름일 뿐이다.
- `SiteLink.emphasis`는 링크를 굵게 그린다(헤더 내비게이션·푸터 링크·패밀리 링크). 법이 눈에 띄게 하라는 개인정보처리방침용.
- `SiteFooter` `consentSettings: { controller, label }`는 링크 뒤, 저작권 앞에 동의 설정을 다시 여는 "쿠키 설정" 버튼을 둔다(D-034). 다른 링크와 같아 보이고 터치에서는 44px 대상이다. [동의](#동의-옵트인-분석) 참고.
- 섹션(그리고 히어로)은 같은 페이지 링크로 이동하면 붙어 있는 헤더 아래에 멈춘다: `scroll-margin-block-start` = 헤더 높이 + 8px. 헤더 높이는 `--site-header-block-size`(기본 64px) — `:root`나 `.site-shell`(헤더와 `<main>`의 공통 조상)에 정한다. `.site-header`에 정하면 섹션은 64px 간격 그대로다.
- 킷 헤더 뒤의 다른 모든 `id` 요소(개인정보처리방침의 `#analytics` 제목, `<main id="main-content">`)도 링크로 이동하면(다른 페이지에서 오든 같은 페이지 안이든) 헤더와 그 테두리 아래 16px에 멈춘다: `scroll-margin-block-start` = 헤더 높이 + 1px + 16px(D-035). 명시도 0이라 제품이 대상에 준 `scroll-margin`이 이기고, 섹션은 8px 그대로다. 닫힌 헤더 기준이다 — 어떤 폭에서 헤더가 두 줄로 접히는 제품은 그 폭에서 `--site-header-block-size`를 올린다.
- `--site-hero-eyebrow-tracking`(기본 `.18em`)과 `--site-hero-eyebrow-weight`(기본 `normal`)로 히어로 키커를 조정한다. 넓은 모노 자간은 라틴 대문자에 맞고, 키커가 한국어인 제품은 랜딩 뿌리에서 자간을 `0`으로 둔다.

새 props를 쓰든 안 쓰든 모든 제품에 적용되는 기본값: 위의 44px 터치 누르는 면, 좁은 헤더 첫 줄이 `--site-header-block-size`(64px)이고 위아래 패딩 없음 — 전역 `box-sizing: border-box` 리셋이 없는 제품은 휴대폰 헤더가 24px 낮아지고(64px에 위아래 12px 패딩이었음), 메뉴 버튼이 44px인 제품은 4px 낮아진다 — 열린 메뉴의 링크는 간격 없는 44px 줄이고 컨트롤 줄 아래 12px, 섹션·히어로의 스크롤 간격, Esc·링크로 메뉴 닫힘, 푸터 링크의 기준선 정렬과 details가 있는 줄의 첫 줄 정렬.

타입 메모: `SiteHeaderProps["locale"]`은 이제 `LocaleState | undefined`다. `SiteHeaderProps` 값에서 읽는 코드(`header.locale.locale`)는 좁혀야 한다 — 예를 들어 제품이 늘 넘긴다면 그 값을 `SiteHeaderProps & { locale: LocaleState }`로 타입한다.

## 가족 서체

가족 서체 — 라틴·숫자는 Geist, 코드·라벨은 Geist Mono, 한글은 Pretendard — 를 woff2 파일과 스타일시트 하나로 여기서 한 번만 싣는다(D-033). 모든 제품이 같은 파일을 자기 도메인에서 서빙하므로 `font-src 'self'` CSP가 그대로 유지되고, 글꼴 요청이 제품 도메인 밖으로 나가지 않는다.

| 패밀리 | 파일 | 원본 | 라이선스 |
|---|---|---|---|
| `Geist` | 문자권별 5개(latin 29 KB, latin-ext, vietnamese, cyrillic, cyrillic-ext), 가변 100–900 | `@fontsource-variable/geist` 5.3.0 | SIL OFL 1.1 — `fonts/geist/LICENSE.txt` |
| `Geist Mono` | 6개(latin 23 KB, …, symbols2), 가변 100–900 | `@fontsource-variable/geist-mono` 5.3.0 | SIL OFL 1.1 — `fonts/geist-mono/LICENSE.txt` |
| `Pretendard` | 동적 서브셋 92개(각 8–44 KB, 전체 2.9 MB), 가변 45–920 | `pretendard` 1.3.9 | SIL OFL 1.1 — `fonts/pretendard/LICENSE.txt` |

**패밀리 이름이 곧 토큰의 이름이다.** `--dds-font-family-sans`는 `Geist, Pretendard, …`, `--dds-font-family-mono`는 `'Geist Mono', …`이고, `fonts.css`는 정확히 `"Geist"`·`"Pretendard"`·`"Geist Mono"`를 등록한다. 스타일시트를 불러오기만 하면 토큰(과 `styles.css`의 페이지 뿌리 규칙)이 이름을 바꾸지 않고 이 파일들로 이어진다. `"Geist Variable"`·`"Pretendard Variable"`이 아니다: 그것은 원본 패키지가 자기 사본에 붙인 이름이고, 그 이름을 적은 스택은 이 파일들을 집지 않는다.

**페이지는 그리는 글자만큼만 받는다.** 모든 face에 `unicode-range`가 있어, 페이지에 그 범위의 글자가 있을 때만 파일을 받는다. 영어 페이지는 Geist latin(29 KB)만 받는다. 한국어 랜딩은 Pretendard 서브셋 12–16개를 더 받는다 — getasklinq.app 305 KB, gettracelinq.app/ko 347 KB, getbooklinq.app 한국어 424 KB(Chromium 실측) — 2 MB짜리 단일 `PretendardVariable.woff2` 대신. 모든 face가 `font-display: swap`이라 글자는 폴백 서체로 바로 그려지고 face가 도착하면 바뀐다.

### 적용 (Vite, Workers 위의 TanStack Start)

모든 페이지가 불러오는 CSS(또는 엔트리)에서 스타일시트를 한 번 import한다.

```css
/* src/styles/app.css */
@import "@devslab/site-kit/fonts.css";
```

Vite가 상대 `url()`을 따라 `node_modules/@devslab/site-kit/fonts/`의 face를 빌드의 `assets/`로 해시 이름을 붙여 복사하고, 스타일시트를 `/assets/…woff2`로 고쳐 쓴다. Worker가 그것을 제품 자기 도메인의 정적 자산으로 서빙한다. 모든 face가 Vite의 인라인 한도(4 KB)보다 커서 `data:` URI(`font-src 'self'`가 막는다)가 되는 것은 없다 — 제품이 `build.assetsInlineLimit`을 올렸다면 글꼴은 빼 둔다: `assetsInlineLimit: (file) => (file.endsWith(".woff2") ? false : undefined)`.

모든 페이지가 쓰는 라틴 face는 미리 받아 둘 수 있다. `?url`로 import하면 스타일시트가 쓰게 되는 바로 그 해시 URL이 나오고, 그것을 head에 넘긴다.

```ts
import geistLatin from "@devslab/site-kit/fonts/geist/geist-latin-wght-normal.woff2?url";

head: () => toTanStackHead(metadata, { icons: true, fontPreload: geistLatin }),
```

`fontPreload`는 `fontPreloadLinks(geistLatin)` — `{ rel: "preload", as: "font", type: "font/woff2", crossorigin: "anonymous" }` — 를 덧붙인다. 같은 도메인이어도 `crossorigin`은 필요하다: 글꼴은 CORS 모드로 받기 때문에, 이것이 없는 preload는 한 번 더 내려받힌다. `.woff2`로 끝나는 같은 도메인 경로만 받는다. `FAMILY_FONT_PRELOAD_FILE`이 패키지 안의 파일 경로다. 다른 것은 preload하지 않는다: 어느 Pretendard 서브셋이 필요한지는 페이지 글자에 달렸다.

### 번들러 없이

`fonts.css`와 `fonts/`를 구조를 유지한 채 나란히, 사이트가 서빙하는 디렉터리에 복사하고 스타일시트를 링크한다.

```js
// scripts/copy-fonts.mjs
import { cpSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const kit = dirname(createRequire(import.meta.url).resolve("@devslab/site-kit/fonts.css"));
cpSync(join(kit, "fonts.css"), "public/site-kit/fonts.css");
cpSync(join(kit, "fonts"), "public/site-kit/fonts", { recursive: true });
```

```html
<link rel="stylesheet" href="/site-kit/fonts.css">
```

`url()`은 `fonts.css` 기준 상대 경로라, 둘을 어디에 복사하든 `/site-kit/fonts/…`로 풀린다. 함께 복사되는 `fonts/manifest.json`에 파일마다 원본 패키지·버전·크기·sha256이 적혀 있다.

### 제품 자체 사본에서 옮겨 오기

1. 제품의 Geist·Geist Mono·Pretendard `@font-face` 규칙, woff2를 `public/fonts/`로 복사하는 스크립트(와 `.gitignore` 줄), `@fontsource-variable/*` import, 그리고 `@fontsource-variable/geist`·`@fontsource-variable/geist-mono`·`pretendard` 의존성을 지운다.
2. 위처럼 `@devslab/site-kit/fonts.css`를 import한다.
3. 제품 자체 스택에서 `"Geist Variable"` → `Geist`, `"Geist Mono Variable"` → `"Geist Mono"`, `"Pretendard Variable"` → `Pretendard`로 바꾼다 — 또는 토큰 스택을 되풀이할 뿐인 뿌리 규칙은 지운다: `styles.css`가 이미 `:where(html) { font-family: var(--dds-font-family-sans) }`를 준다(D-032). `:lang(ko) { font-family: Pretendard, Geist, … }` 같은 한글 우선 순서는 제품의 선택으로 남고, 이 face들로 그대로 동작한다.
4. 손으로 쓴 `<link rel="preload" href="/fonts/geist.woff2">`는 `fontPreload`로 바꾸고, 옛 이름으로 글꼴을 불러오거나 확인하는 테스트(`document.fonts.check('1rem "Pretendard Variable"')` → `"Pretendard"`)를 고친다.

### 라이선스

세 패밀리 모두 SIL Open Font License 1.1이다. `fonts/` 아래 디렉터리마다 라이선스 원문이 있고, 패키지는 파일을 수정 없이 재배포한다. Pretendard는 글꼴 이름을 예약(Reserved Font Name)했으므로 수정본(예: 다른 사람이 잘라 낸 서브셋)은 Pretendard라고 부를 수 없다: 이 파일들은 저작자 자신의 서브셋이고, `scripts/build-fonts.mjs`는 배포된 패키지에서 바이트 그대로 복사할 뿐 다시 자르지 않는다. `node scripts/build-fonts.mjs --check`(`check`에 포함)는 파일이 매니페스트와 다르면 실패하고, `--vendor`는 버전을 올릴 때 고정된 원본 tarball을 npm integrity를 확인하며 다시 받는다.

## 브랜드 아이콘

모든 제품의 아이콘 파일은 `@devslab/linq-brand`(`dist/<product>/`)에서 온다. `brandIconLinks()`는 그중 어떤 파일을 페이지 head가 어떤 순서로 링크하는지 정하는 유일한 자리다.

| 링크 | 파일 | 이유 |
|---|---|---|
| `icon` `image/svg+xml` | `favicon.svg` | 탭 아이콘. SVG를 아는 브라우저가 래스터를 받지 않도록 맨 앞 |
| `icon` `48x48` | `mark-48.png` | 검색엔진은 `<link>`로 선언된 48px 이상 정사각형을 원한다(구글: "최소 8x8px, 48x48px 초과 권장") |
| `icon` `16x16 32x32 48x48` | `favicon.ico` | 주소만으로 요청되는 관례, 세 크기를 한 컨테이너에 |
| `apple-touch-icon` `180x180` | `apple-touch-icon.png` | iOS 홈 화면 |

`BRAND_ICON_FILES`는 같은 네 파일명을 나열하므로 제품은 한 디렉터리에서 그대로 서빙할 수 있다. 기본 `basePath`는 `/brand`이고, 다른 곳에서 서빙하는 제품은 자기 경로를 넘긴다. 같은 오리진 경로만 받는다 — 아이콘은 제품이 직접 서빙한다.

```ts
toTanStackHead(metadata, { icons: true });               // …/brand/favicon.svg, …
toTanStackHead(metadata, { icons: { basePath: "/" } }); // /favicon.svg, /mark-48.png, …
```

옵션을 생략하면 어댑터는 아이콘 링크를 내지 않는다. 제품이 파일을 어디서 서빙하는지 어댑터가 알 수 없고, 서버가 404를 내는 아이콘을 링크한 head는 아무것도 링크하지 않은 head보다 나쁘기 때문이다.

## Google Tag Manager

제품 사이트마다 자기 컨테이너 ID로 공개 마케팅·법적 페이지에 Tag Manager를 싣는다. 콘솔·대시보드·채팅 위젯은 제외한다. 스니펫은 여기 한 곳에 둔다(D-031).

**분석은 옵트인이다(D-034).** 아래의 `toTanStackHead(…, { gtm })`와 `gtmHeadEntry`는 묻지 않고 페이지를 열 때마다 Tag Manager를 로드한다. 호환을 위해 남겨 두며, 가족 제품은 [동의](#동의-옵트인-분석)의 동의 게이트 경로로 옮긴다. 같은 로더를 허용 뒤에만 낸다.

| 내보내기 | 진입점 | 무엇인가 |
|---|---|---|
| `gtmHeadScript(id)` | `@devslab/site-kit` | head 로더의 스크립트 본문. `<script>` 태그도 nonce도 없음 |
| `gtmNoscriptIframe(id)` | `@devslab/site-kit` | `<body>`가 열리자마자 오는 `<noscript>` 안의 `<iframe>` HTML |
| `GTM_CSP_SOURCES` | `@devslab/site-kit` | Tag Manager + GA4에 필요한 CSP 출처, 지시어별 |
| `GTM_CONTAINER_ID_PATTERN` | `@devslab/site-kit` | `/^GTM-[A-Z0-9]+$/` |
| `toTanStackHead(metadata, { gtm })` | `@devslab/site-kit/tanstack-start` | 로더를 `scripts[0]`에 담은 라우트 head |
| `gtmHeadEntry(id)` | `@devslab/site-kit/tanstack-start` | 같은 `scripts` 항목. head를 직접 만드는 라우트용 |

로더는 구글의 [Use Tag Manager with a Content Security Policy](https://developers.google.com/tag-platform/security/guides/csp)에 실린 nonce 대응 스니펫을 바이트 그대로 쓴다. 표준 스니펫에 문장 하나를 더한 것으로, 페이지의 nonce를 `gtm.js` 요소에 옮겨 Tag Manager가 자기가 추가하는 스크립트에 넘길 수 있게 한다. `GTM_CONTAINER_ID_PATTERN`에 맞지 않는 ID는 스크립트 문자열에 닿기 전에 `RangeError`를 던진다. `""`도 마찬가지이니 "여기는 Tag Manager 없음"은 빈 환경 변수가 아니라 `undefined`로 넘긴다.

**Head, 라우트별.** 실을 라우트에서만 켠다.

```ts
// 공개 라우트
head: () => toTanStackHead(metadata, { icons: true, gtm: GTM_ID }),
```

항목에는 자기 nonce가 없다. `HeadContent`가 렌더하는 모든 head 스크립트에 `router.options.ssr.nonce`를 찍으므로, 로더는 meta·link 태그와 같은 길로 요청의 nonce를 받는다. 그래서 라우터에 요구 사항이 둘 생기고, 둘 다 라우터를 만들 때 정한다(asklinq#427).

- **서버:** `ssr.nonce`는 요청의 nonce. 없으면 로더가 nonce 없이 렌더되고 CSP가 막는다.
- **클라이언트:** `ssr.nonce`는 `""`. 헤더로 CSP를 받은 페이지에서 브라우저는 `getAttribute`로부터 nonce를 숨기므로, 서버가 렌더한 로더는 `nonce=""`로 읽힌다. 라우터의 하이드레이션 검사는 이것을 클라이언트의 `ssr.nonce`와 비교해 다르면 사본을 하나 더 붙인다. `""`이면 원본을 찾아 아무것도 붙이지 않고, 다른 값이면 그 사본이 CSP에 막혀 페이지를 열 때마다 위반을 기록한다.

로더는 그것을 가진 라우트의 전체 페이지 로드에서 돈다. 그런 페이지에서 클라이언트 내비게이션으로 떠나도 Tag Manager는 살아 있다(페이지뷰는 History Change 트리거로). 반대로 로더가 없는 라우트에서 클라이언트 내비게이션으로 들어오면 로드되지 않는다. 그때 라우터가 붙이는 사본은 CSP에 막히고, 그 덕에 Tag Manager가 두 번 로드되는 일도 없다.

**Body.** 셸은 `<body>` 자체가 아니라 그 안을 렌더하므로, 제품의 루트 문서가 같은 라우트 조건 뒤에서 noscript를 `<body>`의 첫 자식으로 렌더한다.

```tsx
<body>
  <Show when={gtmIdForThisRoute()}>{(id) => <noscript innerHTML={gtmNoscriptIframe(id())} />}</Show>
  {props.children}
</body>
```

`tests/site-kit-gtm-noscript-hydration.test.mjs`가 바로 이 코드를 Solid 컴파일러로 컴파일해 개발 빌드로 하이드레이션한다. 불일치 없음, 잃은 키 없음, 자바스크립트가 켜져 있으면 noscript는 텍스트로 남는다.

**CSP.** `GTM_CSP_SOURCES`의 각 목록을 같은 이름의 지시어에 더한다.

| 지시어 | 출처 |
|---|---|
| `script-src` | `https://www.googletagmanager.com` |
| `connect-src` | `https://www.googletagmanager.com https://*.google-analytics.com https://*.google.com` |
| `img-src` | `https://www.googletagmanager.com https://*.google-analytics.com` |
| `frame-src` | `https://www.googletagmanager.com` |

Tag Manager 컨테이너와 "Ads 기능 없는 Google Analytics"에 대한 구글의 목록에, noscript iframe용 `frame-src`를 더한 것이다. 구글은 `script-src-elem`으로 적지만 그 지시어가 없는 정책은 `script-src`로 넘어간다. `*.google.com`은 `www.google.com`과 GA4의 `*.analytics.google.com` 호스트도 덮는다. 포함하지 않은 것(컨테이너가 필요로 하면 같은 가이드에서 더한다): 미리보기 모드(`tagmanager.google.com`, `gstatic`, Google Fonts), 맞춤 자바스크립트 변수(`'unsafe-eval'`), Ads·Google 신호 호스트(`*.g.doubleclick.net`, `pagead2.googlesyndication.com`, `www.googleadservices.com`, `*.google.<TLD>`).

## 동의 (옵트인 분석)

가족 사이트의 분석은 옵트인이다(D-034). 방문자가 현재 정책 버전에 대해 분석을 허용하기 전에는 구글에 닿는 것이 하나도 돌지 않는다. Tag Manager 로더도, gtag도, GA 쿠키도 없다. 페이지는 Consent Mode v2 기본값(신호 넷 모두 거부)을 자기 `dataLayer`에 넣을 뿐이다. 결정 없음, "거부", 닫아 버린 바, 예전 정책 버전에서 한 결정은 모두 같은 뜻이다. 아무것도 로드하지 않는다. 동의하지 않아도 모든 기능이 동작한다.

| 내보내기 | 진입점 | 무엇인가 |
|---|---|---|
| `createConsentManager(options)` | `@devslab/site-kit` | 브라우저 쪽: 동의 쿠키 읽기·쓰기, Consent Mode, 허용 시 Tag Manager 로드, 철회 |
| `readConsentCookie(cookie, { policyVersion })` / `consentCookieGrantsAnalytics(…)` | `@devslab/site-kit` | Cookie 헤더나 `document.cookie`에서 현재 버전의 유효한 결정(서버·브라우저 모두) |
| `consentHeadScript({ granted, gtm })` | `@devslab/site-kit` | head 스크립트 본문: 기본값만, 또는 기본값 + 허용 + 구글 로더 |
| `toTanStackHead(metadata, { consent })` / `consentHeadEntry(…)` | `@devslab/site-kit/tanstack-start` | 같은 스크립트를 라우트 `scripts` 항목으로. 요청의 쿠키로 정한다 |
| `CONSENT_RESPONSE_HEADERS` | 둘 다 | 쿠키로 head를 정한 모든 응답에 보낼 `Cache-Control: private, no-store`와 `Vary: Cookie` |
| `ConsentBanner`, `ConsentSettingsButton` | `@devslab/site-kit/solid` | 바와 설정 대화상자, 그리고 어디에나 둘 수 있는 "쿠키 설정" 버튼 |
| `SiteFooter consentSettings` | `@devslab/site-kit/solid` | 같은 버튼을 바닥글 링크 끝에 |
| `postConsentRecord(path)`, `parseConsentRecord(body, …)`, `isSameOriginRequest(…)` | `@devslab/site-kit` | 기록: 보내기, 서버에서 검증하기, 다른 사이트의 쓰기 거부하기 |
| `CONSENT_MESSAGES_KO`, `CONSENT_MESSAGES_EN` | `@devslab/site-kit` | 기본 문구. 같은 키로 자기 문구를 넘겨도 된다 |

**약속.**

- 항목: *필수*(항상 켜짐, 정보로만 보여 주고 조작 요소가 아님)와 *분석*(Tag Manager를 거친 Google Analytics 4. 켜기 전까지 꺼짐, 미리 체크하지 않음). 광고 항목은 없다. `ad_storage`·`ad_user_data`·`ad_personalization`은 늘 거부.
- 쿠키: `site_consent=v=<정책>&a=<0|1>&t=<유닉스 초>&id=<16진 32자>`. 퍼스트파티, `Path=/`, `SameSite=Lax`, `Secure`, 12개월, `HttpOnly` 아님(배너가 읽는다). `id`는 무작위이고 방문자에게서 끌어낸 값이 아니다. 파서는 이 네 키만 받는다.
- 정책 버전은 제품마다 문자열 하나(`"2026-10-05"`). 개인정보처리방침이 분석에 대해 하는 말이 바뀌면 올린다. 모든 방문자에게 다시 묻고, 답하기 전에는 아무것도 로드하지 않는다. 익명 id는 이어지므로 기록끼리 연결된다.
- 허용하면 `gtag('consent','update',{analytics_storage:'granted'})`를 넣고 Tag Manager를 한 번, 페이지의 nonce로 로드한다(`csp-nonce` meta, 없으면 첫 `[nonce]` 요소, 없으면 `options.nonce`).
- 철회하면 업데이트를 `denied`로 되돌리고, `measurementIds`의 모든 id에 `ga-disable-<id>`를 켜고(`gtm`을 주면 필수 — 이미 초기화된 GA4 태그의 자체 리스너(히스토리 페이지뷰·스크롤·외부 링크 클릭)를 멈추는 유일한 스위치라, 없으면 새로고침 전까지 쿠키 없는 핑이 계속 나간다. 없으면 `createConsentManager`가 던진다), 호스트와 모든 상위 도메인에서 `_ga`·`_ga_*`·`_gid`·`_gat*`를 지우고, `dataLayer`를 닫는다. 분석이 허용되지 않은 동안 페이지의 `dataLayer`는 동의 명령만 받고 나머지는 버린다. 그래서 동의 전에 넣은 이벤트가 나중에 로드될 Tag Manager를 기다리며 쌓이지 않고, 철회 뒤의 이벤트는 이미 로드된 Tag Manager에 닿지 않는다. Tag Manager 자체는 다음 페이지 로드까지 메모리에 남는다.
- 기록의 action: `grant`(이 버전에서 분석이 허용됨), `deny`(첫 결정이 거부), `withdraw`(허용 → 거부), `update`(같은 선택을 다시 저장).

**TanStack Start.** 매니저는 모듈 하나가 갖는다.

```ts
// src/consent.ts
import { createConsentManager, postConsentRecord } from "@devslab/site-kit";

export const CONSENT_POLICY_VERSION = "2026-10-05"; // 개인정보처리방침의 분석 조항이 바뀌면 올린다
export const GTM_ID = "GTM-XXXXXXX";
export const consent = createConsentManager({
  policyVersion: CONSENT_POLICY_VERSION,
  gtm: GTM_ID,
  measurementIds: ["G-XXXXXXXXXX"], // 컨테이너가 보내는 GA4 스트림 전부. gtm을 주면 필수
  onChange: postConsentRecord("/api/consent"),
});
```

공개 라우트마다 요청의 쿠키로 head를 정한다. 하이드레이션 양쪽이 같은 쿠키를 읽으므로 같은 스크립트를 렌더한다.

```ts
import { createIsomorphicFn } from "@tanstack/solid-start";
import { getRequestHeader } from "@tanstack/solid-start/server";

export const requestCookie = createIsomorphicFn()
  .server(() => getRequestHeader("cookie"))
  .client(() => document.cookie);

head: () => toTanStackHead(metadata, {
  icons: true,
  consent: { policyVersion: CONSENT_POLICY_VERSION, gtm: GTM_ID, cookie: requestCookie() },
}),
```

현재 버전의 허용이 없으면 항목은 기본값뿐이고 head 어디에도 구글 호스트가 나오지 않는다. 허용이 있으면 구글의 nonce 대응 로더를 더하되, `gtm.js`가 이미 페이지에 있으면 건너뛴다. 라우터는 맨 로더와 똑같이 `ssr.nonce`를 찍는다([Google Tag Manager](#google-tag-manager)의 nonce 요구 사항이 그대로 적용된다). `gtm`과 `consent`를 같이 넘기면 던진다. `gtm`만 쓰면 묻지 않고 Tag Manager를 로드하기 때문이다. noscript iframe은 `consentCookieGrantsAnalytics(requestCookie(), { policyVersion })`가 참일 때만 렌더한다. 자바스크립트가 없는 방문자는 허용할 방법이 없으니 받지 않는다.

**이 페이지는 공유 캐시에 절대 들어가면 안 된다.** head가 방문자의 쿠키에 따라 달라진다. 허용한 방문자의 HTML에는 Tag Manager 로더가 들어 있어서, CDN이나 엣지 캐시가 그것을 저장하면 동의하지 않은 방문자도 로더를 받는다 — 허용 전에 구글에 닿는 것이다. `consent`를 쓰는 라우트는 모두 `CONSENT_RESPONSE_HEADERS`(`Cache-Control: private, no-store`와 `Vary: Cookie`)를 보낸다.

```ts
import { CONSENT_RESPONSE_HEADERS } from "@devslab/site-kit/tanstack-start";

export const Route = createRootRoute({
  headers: () => ({ ...CONSENT_RESPONSE_HEADERS }),
  head: () => toTanStackHead(metadata, { consent: { … } }),
});
```

캐시되어야 하는 라우트는 모두에게 거부 쪽 head(허용 없는 `consentHeadScript()`)를 렌더하고, 아래 정적 내보내기처럼 하이드레이션 뒤에 매니저가 Tag Manager를 로드하게 한다.

배너는 `<body>`의 첫 요소로 한 번만 붙여 키보드 사용자가 가장 먼저 닿게 하고, 바닥글에 트리거를 둔다.

```tsx
<body>
  <ConsentBanner controller={consent} messages={lang() === "ko" ? CONSENT_MESSAGES_KO : CONSENT_MESSAGES_EN} learnMoreHref={`/${lang()}/privacy#analytics`} privacyHref={`/${lang()}/privacy`} />
  <MarketingShell
    footer={{ …, consentSettings: { controller: consent, label: t("cookieSettings") } }}
    …
  />
</body>
```

배너는 서버에서도, 하이드레이션 중에도 아무것도 렌더하지 않는다. 바는 마운트 뒤에 브라우저 자신의 쿠키를 보고 나온다(`tests/site-kit-consent-hydration.test.mjs`가 바로 이 구성을 개발 빌드로 하이드레이션한다). 바의 글은 짧다 — 제목과, 무엇을 왜 수집하는지·선택이라는 한두 문장 — 그리고 *자세히 보기*(`learnMore`)는 `learnMoreHref`로 가는 평범한 링크다. **개인정보처리방침에서 이용 통계와 국외 이전을 다루는 절, 앵커까지**(필수 — `#fragment`가 없으면 배너가 `RangeError`를 던진다). 킷의 기본 문구는 받는 곳·국가·보관 기간을 말하지 않는다. 그 절에 전부 있어야 한다 — Google Analytics 4, 받는 곳 Google LLC, 미국으로의 이전, 보관 기간, 광고에 쓰지 않는다는 것, 철회 방법(바닥글의 쿠키 설정). 세 선택 — 모두 허용, 거부, 설정 — 은 같은 버튼, 같은 크기다. 제품의 라벨은 이보다 길 수 있다: 바는 자기 너비를 따라 넓으면 한 줄, 60rem 이하는 문구 아래 세 칸 한 줄, 36rem 이하는 세 선택을 전체 너비·같은 높이로 쌓고(설정 대화상자도 같다), 라벨은 공백에서만 줄을 바꾸며 단어 중간에서는 끊지 않는다(한국어는 단어를 통째로). ✕와 Esc는 결정 없이 닫는다. 설정 대화상자는 포커스를 가두고, Esc로 저장 없이 닫히고, *필수*는 글로, *분석*은 꺼진 스위치로 한 줄씩 보여 주고, `privacyHref` 링크와 같은 무게의 버튼 둘 — 취소(✕처럼 저장 없이 닫기)·선택 저장 — 을 둔다. 바닥글 버튼(또는 `ConsentSettingsButton`, 또는 `consent.openSettings()`)으로 언제든 다시 열어 바꾸거나 철회한다.

비밀을 담은 경로는 가려서 기록한다: `createConsentManager({ …, recordPath: (path) => path.replace(/\/k\/[^/]+/, "/k/:key") })`.

**동의 기록(서버).** 결정마다 제품 자기 백엔드로 기록을 POST한다.

```json
{ "policyVersion": "2026-10-05", "analytics": true, "action": "grant", "anonymousId": "<16진 32자>", "decidedAt": 1759650000, "source": "web", "path": "/ko/pricing" }
```

이 엔드포인트가 추적 통로가 되면 안 된다. 같은 출처만, 정확히 이 페이로드만, 요청 수 제한.

```ts
import { CONSENT_RECORD_MAX_BYTES, isSameOriginRequest, parseConsentRecord } from "@devslab/site-kit";

if (request.method !== "POST") return new Response(null, { status: 405 });
if (!isSameOriginRequest(request, "https://getasklinq.app")) return new Response(null, { status: 403 });
if (Number(request.headers.get("content-length") ?? 0) > CONSENT_RECORD_MAX_BYTES) return new Response(null, { status: 413 });
const ip = request.headers.get("cf-connecting-ip") ?? "";
if (!(await env.CONSENT_RATE_LIMIT.limit({ key: ip })).success) return new Response(null, { status: 429 });
const record = parseConsentRecord(await request.text(), { policyVersion: CONSENT_POLICY_VERSION });
if (!record) return new Response(null, { status: 400 });
await insertConsentRecord(env, { ...record, receivedAt: new Date().toISOString(), ip, userAgent: (request.headers.get("user-agent") ?? "").slice(0, 256) });
return new Response(null, { status: 204 });
```

`parseConsentRecord`는 정확히 일곱 키, 아는 정책 버전(이전 버전에서 만든 기록이 아직 올 수 있는 동안에는 목록으로 넘긴다), `analytics`와 맞는 action, 쿼리 없는 경로, 미래도 아니고 31일보다 오래되지도 않은 `decidedAt`만 받는다. 실패한 POST(네트워크·429·5xx)는 `localStorage`에 남았다가 다음 페이지에서 다시 보낸다. 4xx는 버린다. 참고용 테이블(애플리케이션에는 추가만 허용):

```sql
CREATE TABLE consent_records (
  id             TEXT PRIMARY KEY,                -- 서버가 만든 값
  received_at    TEXT NOT NULL,                   -- 서버 시각, UTC
  decided_at     INTEGER NOT NULL,                -- 기록의 decidedAt (쿠키의 t)
  subject_type   TEXT NOT NULL CHECK (subject_type IN ('user', 'anonymous')),
  subject_id     TEXT NOT NULL,                   -- 로그인했으면 내부 사용자 id, 아니면 익명 id
  login_id       TEXT,                            -- 로그인했을 때의 로그인 id 사본
  anonymous_id   TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  analytics      INTEGER NOT NULL CHECK (analytics IN (0, 1)),
  action         TEXT NOT NULL CHECK (action IN ('grant', 'deny', 'withdraw', 'update')),
  source         TEXT NOT NULL CHECK (source IN ('web', 'app')),
  path           TEXT NOT NULL,
  ip             TEXT,
  user_agent     TEXT                             -- 앞 256자
);
CREATE INDEX consent_records_by_visitor ON consent_records (anonymous_id, decided_at);
CREATE TRIGGER consent_records_append_only BEFORE UPDATE ON consent_records
BEGIN SELECT RAISE(ABORT, 'consent records are append-only'); END;
```

기록은 그 동의가 유효한 동안과, 끝난 뒤 보관 기간(기본 3년 — 설정으로 두고 개인정보처리방침에 적는다) 동안 둔다. 동의는 같은 방문자가 다시 결정하거나 `decided_at`에서 12개월이 지나 만료될 때 중 먼저 오는 때에 끝난다. 보관 기간 정리 작업만 `DELETE`를 한다.

```sql
DELETE FROM consent_records AS r
WHERE MIN(
  COALESCE((SELECT MIN(n.decided_at) FROM consent_records AS n
            WHERE n.anonymous_id = r.anonymous_id AND n.decided_at > r.decided_at), r.decided_at + 31536000),
  r.decided_at + 31536000
) + :retention_seconds < :now_seconds;
```

Postgres에서는 두 인자 `MIN`을 `LEAST`로 쓰고, 애플리케이션 역할에 `SELECT, INSERT`만 주어 추가 전용으로 둔다(정리 작업은 다른 역할로 돈다).

**Solid 없이 (devslab.kr, Next.js 정적 내보내기).** 정적 페이지는 빌드할 때 쿠키를 읽을 수 없으므로 head에는 기본값만 싣고, 쿠키가 허용하면 매니저가 하이드레이션 뒤에 Tag Manager를 로드한다.

```tsx
// pages/_document.tsx — Tag Manager 로더와 noscript iframe을 대신한다
<Head>
  <script dangerouslySetInnerHTML={{ __html: consentHeadScript() }} />
</Head>
```

```tsx
// src/consent.ts
import { createConsentManager } from "@devslab/site-kit";
export const consent = createConsentManager({ policyVersion: "2026-10-05", gtm: "GTM-XXXXXXX", measurementIds: ["G-XXXXXXXXXX"] });

// src/components/ConsentBar.tsx — 마크업은 제품 것, 동작과 문구는 킷 것
import { useEffect, useState } from "react";
import { CONSENT_MESSAGES_KO as m } from "@devslab/site-kit";
import { consent } from "../consent";

export function ConsentBar() {
  const [ask, setAsk] = useState(false);
  const [settings, setSettings] = useState(false);
  useEffect(() => {
    consent.start(); // 저장된 허용을 적용: Tag Manager를 한 번 로드
    const sync = () => setAsk(consent.needsDecision() && !consent.dismissed());
    sync();
    const off = consent.subscribe((event) => (event.type === "open-settings" ? setSettings(true) : sync()));
    const unbind = consent.bindTriggers(); // 어떤 [data-consent-settings]든 설정을 연다
    return () => { off(); unbind(); };
  }, []);
  // `ask`인 동안 바를 렌더: m.title, m.body, /privacy#analytics로 가는 m.learnMore 링크, 같은 무게의 버튼 셋 —
  // consent.acceptAll(), consent.rejectAll(), setSettings(true). Esc → consent.dismiss().
  // 설정 대화상자: m.necessaryTitle은 글로, m.analyticsSwitch는 꺼진 스위치로,
  // /privacy 링크, 같은 무게의 버튼 둘: m.cancel(닫기)과 m.save → consent.save({ analytics }).
  return null;
}

// 바닥글:
// <a href="#cookie-settings" data-consent-settings>{m.trigger}</a>
```

쿠키는 호스트 단위이고 `Path=/`이므로, 같은 호스트에서 React를 싣지 않는 정적 HTML 페이지는 모듈 스크립트에서 `consent.start()`만 부르면 된다. 그 호스트의 어느 페이지에서 한 결정이든 그 페이지에도 적용된다.

**코드로 할 수 없는 콘솔 작업.** Tag Manager에서 GA4 태그마다 동의 설정을 *태그 실행에 추가 동의 필요: `analytics_storage`*로 둔다. 철회 뒤 Tag Manager가 메모리에 남아 있어도 거부된 페이지에서 태그가 실행되지 않는다. GA4에서는 데이터 보관 기간을 방침의 그 절이 말하는 값으로 두고(가족 사이트는 14개월), Google 신호 데이터와 광고 개인 최적화는 끈다(광고 항목이 없다).

## 섹션

가족 랜딩 페이지를 위한 상태 없는 원시 컴포넌트 여섯 개, VisionLinq에서 추출했다. `@devslab/site-kit/solid`에서 import한다; 스타일시트는 `styles.css` 안에 들어 있다. 이 원시 컴포넌트들은 full-bleed — 각자 자기 내부 너비를 갖는다 — 라서 이걸로 구성한 페이지는 `<MarketingShell mainWidth="bleed">` 안에서 렌더해야 한다; 그렇지 않으면 셸의 기본 `<main>` 인셋이 이중으로 안쪽 여백을 주고 `tone="band"`가 박스형 사각형이 되어 버린다.

| 원시 컴포넌트 | 렌더 |
|---|---|
| `SectionBlock` | `<section>` + 콘텐츠 셸; `tone="band"`는 배경을 토큰 한 단계 낮춘다 |
| `SectionHead` | 모노 zero-padded `index`(장식용), `h2`, 선택적 lede |
| `HeroSplit` | 카피 6 / aside 5; aside `figure`에는 높이 규칙이 없다 — 각자의 장면에서 고쳐야 한다 |
| `StepFlow` | 단계 `<ol>`, **원형 숫자 1 2 3** — 섹션 인덱스와 다른 글리프 체계 |
| `FeatureRows` | 선택적 `dds-badge`가 있는 헤어라인 행; 카드 그리드는 절대 아님 |
| `PricingNote` | 문단 블록 하나 + 액션 하나 |

```tsx
<SectionBlock id="how" labelledBy="how-title">
  <SectionHead index="01" titleId="how-title" title={t("how.title")} lede={t("how.lede")} />
  <StepFlow label={t("how.title")} steps={[{ title: t("how.1.title"), body: t("how.1.body") }, …]} />
</SectionBlock>
```

### 로케일 부분집합

`defineLocaleRegistry({ only: ["ko", "en", "ja"] })`는 그 가족 로케일들만 남긴다(가족 순서, `extra`보다 먼저). 이 레지스트리를 `SiteHeader localeRegistry`와 `validateCatalogs(…, { registry })`에 넘긴다; 부분집합 밖 로케일을 요청하는 방문자는 `defaultLocale`로 귀결된다. `defaultLocale` 자체가 `only` 안에 있어야 한다; 별칭의 대상이 부분집합 밖에 있으면(예: `zh` → `zh-TW`인데 `zh-HK`만 남긴 경우) `undefined`로 귀결되어 `defaultLocale`로 떨어질 뿐, 다른 문자 체계로 넘어가는 일은 없다.

## 제품 로케일

`LOCALES`는 **가족 목록**이다 — devslab.kr이 마케팅하는 14개 언어이자 모든
제품이 기본으로 받는 바닥. 모든 제품의 목록은 아니다. 가족이 갖지 않은
언어로 파는 제품은 레지스트리를 만든다:

```js
import { defineLocaleRegistry } from "@devslab/site-kit";

export const locales = defineLocaleRegistry({
  extra: [
    { code: "ta", language: "Tamil", nativeName: "தமிழ்", dir: "ltr", flagCountry: "in" },
  ],
});
```

로케일을 다루는 헬퍼는 전부 이것을 받는다: `validateCatalogs(catalogs, "en", { registry })`,
`buildMetadata({ …, registry })`, `buildSitemap({ …, registry })`,
`localizedPath(path, locale, defaultLocale, registry)`,
`<SiteHeader localeRegistry={…}>`. 안 넘기면 가족 레지스트리이므로
`defineLocaleRegistry`를 부른 적 없는 소비자는 영향이 없다.

`flagCountry`는 이 패키지가 **이미 벤더링한** 나라를 지목해야 한다
(`FLAG_COUNTRY` 참조). 제품은 국기 아트워크를 싣지 않는다 — 라이선스가 있고,
생성되며, 여기서 스캔된다. 그리고 국기는 나라를 가리키지 언어를 가리키지
않으므로 인도 로케일 7개가 정당하게 `in`을 공유한다.

레지스트리는 전부 넘기거나 전혀 안 넘기거나다. 레지스트리로 그린 페이지의
메타데이터를 레지스트리 없이 만들면, 페이지는 타밀어로 렌더되면서 검색
엔진에는 타밀어가 없다고 말한다.

## 제작사 표시

루트 entry는 프레임워크 중립 `definePublisher`, `buildPublisher`,
`serializeJsonLd`, `renderPublisherHtml`을 제공한다. DevsLab 제품과 OSS는
별도 entry `@devslab/site-kit/devslab`의 공통 설정을 사용한다.

```js
import { buildPublisher, renderPublisherHtml } from "@devslab/site-kit";
import { DEVSLAB_PUBLISHER } from "@devslab/site-kit/devslab";

const publisher = buildPublisher(DEVSLAB_PUBLISHER, { locale: "ko" });
// footer에는 publisher.link.href / .label을 사용한다.
// JSON-LD graph에는 publisher.organization을 넣고,
// 제품/WebSite publisher에는 publisher.reference를 사용한다.
const html = renderPublisherHtml(DEVSLAB_PUBLISHER);
// 정적 페이지 빌드에서 삽입: 보이는 링크 + Organization.
```

`PublisherIdentity`의 필수 필드는 `id`, `name`, `url`이다. 선택 필드
`alternateName`, `sameAs`, `labels`, `defaultLabel`은 정체성만 표현하며
제품 기능 주장을 추가하지 않는다. URL은 사용자 정보 없는 절대 HTTP(S)만
허용한다. 설정은 복사 후 동결한다. 라벨은 정확한 locale, 소문자/기본 언어,
`defaultLabel`(없으면 `name`) 순서다. DevsLab 기본 라벨은
`데브스랩(DevsLab)`이고 `en`은 `DevsLab`이다. 공식 홈페이지·한국어 이름·
공식 `sameAs` 링크는 이 설정이 소유한다.

`renderPublisherHtml`은 링크와 JSON-LD를 escape하며 CSP용 `nonce`를
선택적으로 받는다. DOM이나 Solid 없이 문자열을 반환하므로 Node 빌드,
MkDocs 준비 작업, SSR에서 공통으로 쓴다. 기존 graph를 script에 넣을 때는
`serializeJsonLd`를 사용한다. Organization은 페이지마다 한 번 출력한다.
다른 제작사는 자체 설정으로 `definePublisher`를 호출한다. 기능 주장은
계속 `VerifiedFactRegistry`로 검증한다. robots·동의·분석·학습 정책은
이 API가 변경하지 않는다.

## 로케일 메뉴 렌더링

`LocaleMenu`는 기본으로 네이티브 `<select>`를 렌더링한다. `variant="flag"`는
트리거가 현재 로케일의 국기이고 행마다 국기 + 자국어 이름 링크인 `<details>`
디스클로저를 렌더링한다 — JavaScript 없이도 동작하며, Solid는 Escape로 닫기와
`onLocaleChange(locale, href)` 콜백을 더한다. `SiteHeader`는 `localeVariant`를
그대로 전달한다. 국기 데이터(`FLAG_COUNTRY`, `LOCALE_FLAGS`, `flagFor`,
`flagCountryFor`)는 런타임 중립 `.` entry가 아니라 전용 서브패스
`@devslab/site-kit/flags`에서 export된다 — 벤더링한 아트워크가 SVG ~110 KB라
대부분의 소비자는 국기 메뉴를 렌더링하지 않기 때문이다. 아트워크는
flag-icons에서 벤더링했다(MIT, `flags/LICENSE-flag-icons.txt`). 국기는
`dds-icons` 항목이 아니라 site-kit 데이터다 — 아이콘 세트의 계약이 단색
`currentColor` 스트로크를 요구하기 때문이다.

국기 메뉴는 그 아트워크를 **브라우저 번들에서도** 뺀다. 메뉴 하나가
`<symbol>` 스프라이트 하나(나라당 본문 하나)를 렌더링하고 모든 국기는 그것을
`<svg><use href="#…">`로 참조하므로, 클라이언트에서 로케일이 바뀌어도
`href`만 바뀐다. 스프라이트 마크업은 **서버 빌드**가 쓰고 하이드레이션은 그
마크업을 그대로 인수하며, 브라우저 빌드는 본문을 동적 `import()`(자기 청크
`dist/flag-bodies.js`)로만 닿는다 — 서버 HTML 없이 국기 메뉴가 렌더링될
때(클라이언트 전용 앱, jsdom 테스트)에만 가져온다. 그래서 `SiteHeader`를
import하는 소비자는 kit 전체로 클라이언트 JS ~150 KB가 아니라 ~40 KB를 싣는다.
`pnpm check`가 최소 소비자(`fixtures/bundle-probe`)를 빌드해 국기 본문이 메인
청크로 되돌아오면 실패시킨다. 본문은 서버 렌더 HTML에는 여전히 실린다 —
가져오는 파일로 옮기는 것은 별도 결정이다.
