# @devslab/site-kit

DevsLab 제품의 공개 웹사이트를 위한 공개 인프라 패키지다. 가족 로케일에 대한 엄격한 카탈로그(제품별 확장 가능), 로케일 협상, SEO/GEO 문서 생성기, 접근 가능한 SolidJS 2 사이트 셸을 제공한다. 제품명·주장·내비게이션·번역 문구는 항상 소비 앱이 소유한다.

## 진입점

- `@devslab/site-kit` — 런타임 중립 로케일·카탈로그·SEO·사이트맵·robots·검증된 사실 유틸리티
- `@devslab/site-kit/solid` — 헤더·푸터·언어/테마 컨트롤·마케팅/법률/상태/오류 레이아웃·접근 요청 폼
- `@devslab/site-kit/tanstack-start` — 중립 메타데이터를 TanStack Start head descriptor로 변환
- `@devslab/site-kit/styles.css` — 논리 속성과 RTL을 지원하는 공통 사이트 스타일

카탈로그 생성은 의도적으로 엄격하다. 레지스트리의 모든 로케일이 동일한 키와 이름 기반 placeholder를 가져야 하며 런타임 문구 폴백은 없다.

사이트맵은 레지스트리 로케일마다 alternate 하나와 `x-default`를 출력한다.
`buildVerifiedJsonLd`는 검토된 schema type과 claim allowlist만 허용하고 모든
claim leaf가 검증된 사실 레지스트리를 참조하도록 강제한다. `buildRobots`의
기존 environment-only 출력은 유지되며, 선택적 `policies`로 검색 인덱싱,
인용 crawler, 모델 학습 crawler를 각각 제어할 수 있다.

## 섹션

가족 랜딩 페이지를 위한 상태 없는 원시 컴포넌트 여섯 개, VisionLinq에서 추출했다. `@devslab/site-kit/solid`에서 import한다; 스타일시트는 `styles.css` 안에 들어 있다.

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

`defineLocaleRegistry({ only: ["ko", "en", "ja"] })`는 그 가족 로케일들만 남긴다(가족 순서, `extra`보다 먼저). 이 레지스트리를 `SiteHeader localeRegistry`와 `validateCatalogs(…, { registry })`에 넘긴다; 부분집합 밖 로케일을 요청하는 방문자는 `defaultLocale`로 귀결된다.

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

## 로케일 메뉴 variant

`LocaleMenu`는 기본으로 네이티브 `<select>`를 렌더링한다. `variant="flag"`는
트리거가 현재 로케일의 국기이고 행마다 국기 + 자국어 이름 링크인 `<details>`
디스클로저를 렌더링한다 — JavaScript 없이도 동작하며, Solid는 Escape로 닫기와
`onLocaleChange(locale, href)` 콜백을 더한다. `SiteHeader`는 `localeVariant`를
그대로 전달한다. 국기 데이터(`FLAG_COUNTRY`, `LOCALE_FLAGS`, `flagFor`)는
런타임 중립 `.` entry가 아니라 전용 서브패스 `@devslab/site-kit/flags`에서
export된다 — 벤더링한 아트워크가 SVG ~110 KB라 대부분의 소비자는 국기 메뉴를
렌더링하지 않기 때문이다. 아트워크는 flag-icons에서 벤더링했다(MIT,
`flags/LICENSE-flag-icons.txt`). 국기는 `dds-icons` 항목이 아니라 site-kit
데이터다 — 아이콘 세트의 계약이 단색 `currentColor` 스트로크를 요구하기
때문이다.
