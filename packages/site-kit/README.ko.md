# @devslab/site-kit

DevsLab 제품의 공개 웹사이트를 위한 restricted internal 인프라 패키지다. 엄격한 14개 로케일 카탈로그, 로케일 협상, SEO/GEO 문서 생성기, 접근 가능한 SolidJS 2 사이트 셸을 제공한다. 제품명·주장·내비게이션·번역 문구는 항상 소비 앱이 소유한다.

## 진입점

- `@devslab/site-kit` — 런타임 중립 로케일·카탈로그·SEO·사이트맵·robots·검증된 사실 유틸리티
- `@devslab/site-kit/solid` — 헤더·푸터·언어/테마 컨트롤·마케팅/법률/상태/오류 레이아웃·접근 요청 폼
- `@devslab/site-kit/tanstack-start` — 중립 메타데이터를 TanStack Start head descriptor로 변환
- `@devslab/site-kit/styles.css` — 논리 속성과 RTL을 지원하는 공통 사이트 스타일

카탈로그 생성은 의도적으로 엄격하다. 14개 로케일 모두 동일한 키와 이름 기반 placeholder를 가져야 하며 런타임 문구 폴백은 없다.
