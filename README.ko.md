# DDS — DevsLab Design System

🌐 [English](README.md)

데브스랩 제품군 (devslab.kr, Linq 패밀리, 이후의 앱들) 을 위한 디자인 언어 —
웹과 모바일이 공유하는 하나의 토큰·규칙 세트.
구조는 [토스 디자인 시스템 (TDS)](https://tossmini-docs.toss.im/tds-react-native/)
를 참조 모델로 하되 프레임워크 중립적이다: 코어는 토큰 + CSS 이고
React · Vue · Ionic · React Native 는 소비자다.

## 구성

| 경로 | 내용 |
| --- | --- |
| [`docs/design-system.ko.md`](docs/design-system.ko.md) | 규칙 명세 (v0): 원칙, 아키텍처, 파운데이션, 컴포넌트 계약, 거버넌스 |
| [`docs/decisions.md`](docs/decisions.md) | 결정 로그 — 파운데이션·아키텍처 결정과 근거 |
| [`tokens/`](tokens/) | 디자인 토큰 소스 ([W3C 포맷](https://design-tokens.github.io/community-group/format/)): 원시 팔레트, 라이트/다크 시맨틱 매핑, 타이포·간격·라운드·그림자·모션 |
| [`packages/dds-tokens/`](packages/dds-tokens/) | `@devslab/dds-tokens` — 토큰 빌드 파이프라인: `tokens.css`, Tailwind v4 `@theme` + v3 preset, `tokens.ts` (RN·런타임), `ionic.css` |
| [`packages/dds-css/`](packages/dds-css/) | `@devslab/dds-css` — CSS 컴포넌트 레이어, 스펙 §4.3 v1 인벤토리 (Button, IconButton, TextField, Textarea, Select, Checkbox/Radio, Switch, Badge, Chip, Avatar, Spinner/Skeleton, Divider, Card, ListRow, Tabs, Dialog, Toast, Tooltip, EmptyState); 가이드는 [`docs/components.ko.md`](docs/components.ko.md) |
| [`packages/dds-icons/`](packages/dds-icons/) | `@devslab/dds-icons` — 아이콘 세트: 코어 40종(24 그리드·1.6 스트로크) + devslab.kr `site-` 7종. SVG 파일·스프라이트·path 데이터 맵 3형태 출하 |
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
- `pnpm verify:names` — 최종 `@devslab/*` 스코프에서 벗어난 패키지명을 거부
- `pnpm verify:foundation` — 코어 검사와 Storybook 빌드, CJK·RTL·키보드,
  200% 확대, 고대비 모드, 모션 감소, 터치 타깃, axe 브라우저 검사
- `pnpm verify:release` — 패키지를 실제로 묶어 임시 신규 소비자에서 불러오고
  `npm publish --dry-run`까지 검증

세 파운데이션 패키지는 restricted internal 패키지이며 Changesets의 lockstep 그룹으로 릴리스한다. 방향성
아이콘에는 `dds-icon--directional`을 사용하며 mirror/유지 목록은
`@devslab/dds-icons/direction-policy.json`으로 함께 배포한다.

## 로드맵

우선순위는 [`docs/backlog.md`](docs/backlog.md)에. 패키지는 소비자가 생길
때만 만든다 (명세 §8):
`@devslab/dds-tokens` (✅ 2026-08-13) → `dds-css` v1 인벤토리 (Core 6종 ✅ 2026-08-13, +13종 ✅ 2026-08-15) →
AskLinq 적용 → `dds-icons` (✅ 2026-08-15) → 모바일 방향에 따라 `dds-native` (RN) 또는 Ionic
테마 매핑.
