# @devslab/site-kit

DevsLab 제품의 공개 웹사이트를 위한 공개 인프라 패키지다. 엄격한 14개 로케일 카탈로그, 로케일 협상, SEO/GEO 문서 생성기, 접근 가능한 SolidJS 2 사이트 셸을 제공한다. 제품명·주장·내비게이션·번역 문구는 항상 소비 앱이 소유한다.

## 진입점

- `@devslab/site-kit` — 런타임 중립 로케일·카탈로그·SEO·사이트맵·robots·검증된 사실 유틸리티
- `@devslab/site-kit/solid` — 헤더·푸터·언어/테마 컨트롤·마케팅/법률/상태/오류 레이아웃·접근 요청 폼
- `@devslab/site-kit/tanstack-start` — 중립 메타데이터를 TanStack Start head descriptor로 변환
- `@devslab/site-kit/styles.css` — 논리 속성과 RTL을 지원하는 공통 사이트 스타일

카탈로그 생성은 의도적으로 엄격하다. 14개 로케일 모두 동일한 키와 이름 기반 placeholder를 가져야 하며 런타임 문구 폴백은 없다.

사이트맵은 14개 로케일 alternate와 `x-default`를 출력한다.
`buildVerifiedJsonLd`는 검토된 schema type과 claim allowlist만 허용하고 모든
claim leaf가 검증된 사실 레지스트리를 참조하도록 강제한다. `buildRobots`의
기존 environment-only 출력은 유지되며, 선택적 `policies`로 검색 인덱싱,
인용 crawler, 모델 학습 crawler를 각각 제어할 수 있다.

## 로케일 메뉴 variant

`LocaleMenu`는 기본으로 네이티브 `<select>`를 렌더링한다. `variant="flag"`는
트리거가 현재 로케일의 국기이고 행마다 국기 + 자국어 이름 링크인 `<details>`
디스클로저를 렌더링한다 — JavaScript 없이도 동작하며, Solid는 Escape로 닫기와
`onLocaleChange(locale, href)` 콜백을 더한다. `SiteHeader`는 `localeVariant`를
그대로 전달한다. 국기 데이터(`FLAG_COUNTRY`, `LOCALE_FLAGS`, `flagFor`)는
런타임 중립 entry에서 export되며, 아트워크는 flag-icons에서 벤더링했다(MIT,
`flags/LICENSE-flag-icons.txt`). 국기는 `dds-icons` 항목이 아니라 site-kit
데이터다 — 아이콘 세트의 계약이 단색 `currentColor` 스트로크를 요구하기
때문이다.
