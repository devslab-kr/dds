# DDS — DevsLab Design System

🌐 [English](README.md)

데브스랩 제품군 (devslab.kr, Linq 패밀리, 이후의 앱들) 을 위한 디자인 언어 —
웹과 모바일이 공유하는 프레임워크 중립적 토큰·컴포넌트·규칙 세트다.
코어는 토큰 + CSS 이고 React · Vue · Ionic · React Native 는 소비자다.

## 구성

| 경로 | 내용 |
| --- | --- |
| [`docs/design-system.ko.md`](docs/design-system.ko.md) | 규칙 명세 (v0): 원칙, 아키텍처, 파운데이션, 컴포넌트 계약, 거버넌스 |
| [`docs/decisions.md`](docs/decisions.md) | 결정 로그 — 파운데이션·아키텍처 결정과 근거 |
| [`tokens/`](tokens/) | 디자인 토큰 소스 ([W3C 포맷](https://design-tokens.github.io/community-group/format/)): 원시 팔레트, 라이트/다크 시맨틱 매핑, 타이포·간격·라운드·그림자·모션 |
| [`packages/dds-tokens/`](packages/dds-tokens/) | `@devslab/dds-tokens` — 토큰 빌드 파이프라인: `tokens.css`, Tailwind v4 `@theme` + v3 preset, `tokens.ts` (RN·런타임), `ionic.css` |
| [`packages/dds-css/`](packages/dds-css/) | `@devslab/dds-css` — CSS 컴포넌트 레이어, 스펙 §4.3 v1 인벤토리 (Button, IconButton, TextField, Textarea, Select, Checkbox/Radio, Switch, Badge, Chip, Avatar, Spinner/Skeleton, Divider, Card, ListRow, Tabs, Dialog, Toast, Tooltip, EmptyState); 가이드는 [`docs/components.ko.md`](docs/components.ko.md) |
| [`packages/dds-icons/`](packages/dds-icons/) | `@devslab/dds-icons` — 아이콘 세트: 코어 40종(24 그리드·1.6 스트로크) + devslab.kr `site-` 7종. SVG 파일·스프라이트·path 데이터 맵 3형태 출하 |
| [`packages/dds-solid/`](packages/dds-solid/) | `@devslab/dds-solid` — controlled/uncontrolled 상태, SSR·hydration, 키보드, 포커스, 수명주기 계약을 갖춘 SolidJS 접근성 primitive |
| [`packages/site-kit/`](packages/site-kit/) | `@devslab/site-kit` — 엄격한 14개 로케일 i18n, SEO/GEO 생성기, TanStack Start 메타데이터 어댑터, 접근 가능한 SolidJS 공통 셸을 담은 공개 제품 사이트 인프라 |
| [`preview/index.html`](preview/index.html) | 파운데이션·컴포넌트 미리보기 (단일 파일, 브라우저에서 바로 열림 — `components.html`, `icons.html`도 함께) |
| [`brand/index.html`](brand/index.html) | 브랜드 아이덴티티 가이드: 로고 규정, Electric Cyan, 모티프, 보이스 & 톤 |

## 브랜드 기준

- **Electric Cyan** `#06B6D4` (hover `#22D3EE`) + **zinc** 뉴트럴 —
  devslab.kr 실제 스타일에서 추출
- 라이트 기본 + 다크 토글, 두 시맨틱 매핑 모두 1급
- Geist / Geist Mono, 한글은 Pretendard → 시스템 고딕 폴백
- cyan 면 위 텍스트는 흰색이 아니라 `zinc.950` (WCAG AA: 2.3:1 vs 약 8:1)

## 개발

pnpm 워크스페이스. `pnpm install` 후:

- `pnpm build` — 전 패키지 빌드
- `pnpm verify` — 빌드 + 토큰 검증 + 문서·preview↔토큰 불일치 검사 (CI와 동일)
- `pnpm storybook` — 컴포넌트·파운데이션 스토리 (:6006, 툴바에서 테마 전환);
  정적 사이트는 `pnpm build-storybook` (CI에서도 빌드 검증)
- `pnpm verify:names` — 패키지명·라이선스·공개 레지스트리 설정 드리프트를 거부
- `pnpm verify:foundation` — 코어 검사와 Storybook 빌드, CJK·RTL·키보드,
  200% 확대, 고대비 모드, 모션 감소, 터치 타깃, axe 브라우저 검사
- `pnpm verify:release` — 패키지를 실제로 묶어 임시 신규 소비자에서 불러오고
  `npm publish --dry-run`까지 검증
- `pnpm verify:solid:test`, `verify:solid:a11y`, `verify:solid:release` — Solid
  동작·타입·빌드, axe, SSR·hydration, 패키징, 신규 소비자, publish dry-run 게이트
- `pnpm verify:site-kit:i18n`, `verify:site-kit:ui`, `verify:site-kit:seo`,
  `verify:site-kit:release` — 정확한 로케일·카탈로그 계약, 공통 UI 동작,
  다국어 검색 문서, 패키징·신규 소비자·publish dry-run 게이트

다섯 공개 패키지는 Changesets의 lockstep 그룹으로 릴리스하며, 릴리스는
자동이다: `main`에 푸시될 때마다 `.github/workflows/release.yml`이 전체 검증
게이트를 통과한 뒤 `changesets/action`이 — 대기 중인 changeset 파일이 있으면
"chore: release dds" 버전 PR을 열고, 그 PR이 방금 머지됐으면 `main`에는 있지만
npm에는 아직 없는 버전을 배포한다. 버전 PR 머지가 곧 릴리스 결정이고, 손으로
태그를 푸시하지 않는다. 방향성 아이콘에는 `dds-icon--directional`을 사용하며
mirror/유지 목록은 `@devslab/dds-icons/direction-policy.json`으로 함께 배포한다.

배포 가능한 DDS 패키지는 모두 공개 npm의 `@devslab/*`를 사용하며 DevsLab
Source-Available License 1.0을 따른다. compatibility canary는 비공개·미배포로
유지한다. 릴리스는 npm provenance와 저장소 `NPM_TOKEN` 시크릿을 사용한다.

## 로드맵

우선순위는 [`docs/backlog.md`](docs/backlog.md)에. 패키지는 소비자가 생길
때만 만든다 (명세 §8):
`@devslab/dds-tokens` (✅ 2026-08-13) → `dds-css` v1 인벤토리 (Core 6종 ✅ 2026-08-13, +13종 ✅ 2026-08-15) →
AskLinq 적용 → `dds-icons` (✅ 2026-08-15) → `dds-solid` + `site-kit` → 모바일 방향에 따라 `dds-native` (RN) 또는 Ionic
테마 매핑.
