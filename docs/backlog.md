# DDS 백로그

우선순위순. 항목을 시작하면 상태를 `진행 중`으로, 끝나면 `완료`로 갱신하고
필요 시 하위 항목을 쪼갠다. 스펙 근거는 `design-system.ko.md`의 §번호로 표기.

상태: `대기` / `진행 중` / `완료` / `보류`

---

## P1 — Phase 1: 토큰 파이프라인과 첫 소비자

### 1. 토큰 빌드 파이프라인 (`@devslab/dds-tokens`) — `완료` (2026-08-13)
스펙 §2. 레포를 pnpm 워크스페이스로 전환하고 `packages/dds-tokens` 생성.
[Style Dictionary](https://styledictionary.com/) v4로 `tokens/*.json`에서
한 소스 → 전 산출물 생성:
- [x] `dist/tokens.css` — CSS 커스텀 프로퍼티 (`--dds-color-bg-brand: …`),
      라이트 기본 + `[data-theme="dark"]` 다크 매핑 (서브트리 고정 가능 — D-003)
- [x] `dist/tailwind/` — Tailwind v4 `@theme` CSS + v3 `preset.js`(+`.cjs`)
      (색 이름은 시맨틱 경로 유지, spacing은 TW 기본 그리드 위임 — D-004)
- [x] `dist/tokens.ts` — TypeScript 상수 (RN·런타임용, +`tokens.js`/`tokens.d.ts`)
- [x] `dist/ionic.css` — Ionic 테마 변수 매핑 (`--ion-color-primary` 등)
- [x] CI (GitHub Actions): 빌드 + JSON 스키마 검증 + 문서·토큰 값 불일치 검사
      (`pnpm verify` — 라이트/다크 패리티, 참조 해석, docs/preview 드리프트)
- 완료 기준 충족: `pnpm build` 한 번으로 4개 산출물, CI 초록. 결정 기록
  D-001~D-005 (`docs/decisions.md`).

### 2. CSS 컴포넌트 레이어 (`@devslab/dds-css`) Core 6종 — `완료` (2026-08-13)
스펙 §2, §4. `preview/index.html`에 프로토타입된 스타일을 클래스 기반
패키지로 정식화. 토큰 CSS 변수만 참조(하드코딩 금지 — `check-css.mjs`가
hex/rgb/hsl/color-mix를 CI에서 기계 차단, D-007).
- [x] Button (primary/secondary/ghost/danger × sm/md/lg × 전 상태 §4.2 —
      loading은 `aria-busy`, danger 텍스트는 신규 `color.text.on-status` D-006)
- [x] TextField (라벨·헬프·에러 — `aria-invalid` 훅 포함)
- [x] Badge (brand + 상태 4종, 색 단독 신호 방지 도트)
- [x] Spinner / Skeleton (모션 감소 대응 — 스피너는 감속, 스켈레톤은 정지)
- [x] Dialog (+ 딤 오버레이, 네이티브 `<dialog>`/`::backdrop` 겸용)
- [x] Toast (리전 + 상태 도트 + 진입 모션)
- [x] 각 컴포넌트 접근성 체크 (§6) + do/don't 문서 (§4.4) —
      `docs/components.md` + `.ko.md`
- 시각검증: `preview/components.html` (라이트/다크 트윈 + 루트 토글 —
  `[data-theme="light"]` 되고정은 D-003 개정) 브라우저 실측 — variant·size·
  상태·hover(brand-hover 실측)·focus 링(2px/offset 2px)·테마 고정 확인.

### 3. AskLinq에 적용 (첫 소비자) — `완료` (2026-08-13)
스펙 8장 Phase 1. asklinq 레포의 위젯·SSR 페이지가 `dds-tokens`/`dds-css`를
소비하도록 전환. 기존 teal(`#14b8a6`)을 cyan으로 수렴.
- 참고: 이 작업의 전사(前史) 문서는 asklinq 레포에서 이 레포로 이동됨
- [x] **토큰 소비 + 브랜드 정리** (asklinq#195 → 같은 날 D-051로 개정):
      cyan 수렴은 소유자 반려("홈페이지랑 같은 색") → **멀티 브랜드로 확정**
      (dds D-010, 스펙 3.1 개정) — AskLinq는 제품 teal 유지, 뉴트럴·상태는
      vendored DDS 토큰에서(관리자/가입/메일 slate→zinc 리테마), 파비콘
      마크는 on-brand 규칙대로 zinc.950. 테넌트 저장색 불변.
- [x] **멀티브랜드 CSS 규약 확정** (2026-08-15, **D-012**): 제품이 매핑
      CSS 를 소유하고 dds 는 `data-brand` 규약 + "덮어도 되는 여섯 토큰"만
      문서화(스펙 §3.1). `preview/components.html` 에 asklinq·booklinq ×
      라이트·다크 4조합 실측 패널 — booklinq 의 흰 전경은 on-brand 규칙의
      예외가 아니라 적용례(teal.700 위 약 5.5:1).
- `dds-css` 클래스 소비는 미착수 — asklinq 관리자/위젯 CSS는 자체 체계
  (`admin/styles.ts` 등)라 클래스 교체는 별도 리팩토링. 토큰 값 수렴이
  Phase 1의 목적(색 한 소스)이며, 컴포넌트 레이어 전환은 실익이 생길 때.

---

## P2 — 확장

### 4. 쇼케이스 사이트 — `완료` (2026-08-13)
`preview/` + `brand/`를 GitHub Pages(또는 org 허브 devslab-kr.github.io에
링크)로 배포. 장기적으로 Storybook 도입 검토 (스펙 4.4의 스토리 요구사항).
- [x] **쇼케이스 배포 — GitHub Pages 대신 devslab.kr에 실어서** (devlab.kr#31):
      repo 공개 없이 공개 URL 확보. `preview/index.html` → devslab.kr/dds/,
      `preview/components.html` → /dds/components.html (vendored 사본 +
      sync 스크립트, D-009 모델). brand/는 사이트 자체 /brand 페이지가 대체.
      /brand의 design system 블록에서 링크. **preview를 고치면
      devlab.kr에서 `node scripts/sync-dds-showcase.mjs` 재실행 필요.**
      (2026-08-15 devlab.kr#34로 `icons.html` 추가 — sync 스크립트가 이제
      페이지·에셋·rewrite 배열 구조라 페이지가 늘어도 배열만 고치면 된다.)
- Storybook 정적 사이트의 공개 배포만 미배포로 남음 — "DDS 공개 여부"
  결정에 종속(로컬 `pnpm storybook`으로 충분, 소유자 배포 보류 선택).
- [x] **Storybook 도입** (`pnpm storybook` / `build-storybook`, html-vite —
      React 비의존, D-008): Core 6종 전 variant·size·상태 스토리 +
      Foundations 토큰 표(생성된 tokens.js에서 렌더 — 드리프트 불가) +
      테마 툴바(data-theme 스위치). CI가 storybook build를 검증.
      매니저 UI는 DDS 브랜드 테마(zinc 다크 크롬 + cyan, `.storybook/manager.js`
      — 값은 tokens.js에서, 선택 하이라이트는 on-brand 규칙 준용 cyan.700).
- [ ] **배포 보류** — GitHub Pages는 private repo에서 플랜 제한으로 거부됨
      (editor-ruler에서 실증). "DDS 공개 여부"(아래 미해결 질문)가 정해져야
      진행. 공개 전환 시: pages.yml 추가 + storybook-static 배포 + org 허브
      링크.

### 5. 다크모드 토글 표준화 — `대기`
devslab.kr과 동일한 `localStorage 'theme'` 키 + `data-theme` 속성 패턴을
`dds-css`의 공식 스니펫으로 문서화 (허브 README에 기존 구현 있음).

### 6. 아이콘 파이프라인 (`@devslab/dds-icons`) — `완료` (2026-08-15)
스펙 §3.7(D-013으로 개정). 단일 SVG 소스 → 파일·스프라이트·path 데이터 맵.
- [x] `packages/dds-icons` 신설. 코어 40종(업스트림 22 + 내비 글리프 18종
      신규 제작: chevron/arrow 4+2, close, search, plus, minus, menu,
      more-horizontal, trash, edit, download, upload, external-link,
      refresh) + devslab.kr 전용 `site-` 7종(`svg/site/`).
- [x] `scripts/check-icons.mjs` — 24 그리드·`currentColor`·라운드 캡·세트별
      스트로크(1.6/1.8)·색 리터럴 금지·body의 stroke/fill 오버라이드 금지·
      kebab 이름·dist 드리프트를 CI에서 기계 차단. (실제로 site-mobile·
      site-sun의 중복 stroke 속성을 잡아냈다.)
- [x] 스펙 §3.7 개정 — 스트로크 1.5 → **1.6 코어 / 1.8 site**(D-013).
      이름은 AskLinq 위젯 키와 1:1이라 변경 금지.
- [x] `preview/icons.html` 갤러리(라이트/다크 트윈, 24 그리드 상자 표시,
      16·20·24·32 크기) 실측.
- 프레임워크 컴포넌트 codegen은 **미착수(의도)** — 스펙 §2대로 그 프레임워크
  제품이 생길 때.
- [x] **쇼케이스 배포 완료** (2026-08-15, devlab.kr#34):
      https://devslab.kr/dds/icons.html 라이브. sync 스크립트를 페이지·에셋·
      rewrite 배열 구조로 바꿔 `icons.html` + `dist/icons.js`를 싣고,
      /brand의 design system 블록에 `> ./dds --icons` 링크 추가(ko·en).
      세 쇼케이스 페이지는 서로 상호 링크(#15).

### 7. Composite 컴포넌트 확충 — `완료` (2026-08-15)
스펙 §4.3 v1 인벤토리의 나머지 13종을 `dds-css`에 반영 (업스트림 시안
`upstream/dds-css/src/` 기반, 하우스 스타일로 재작성).
- [x] IconButton, Textarea, Select, Checkbox/Radio, Switch, Chip, Avatar,
      Divider, Card, ListRow, Tabs, Tooltip(웹), EmptyState — 총 20종
      (`dds.css` 번들 21파일). 문서 `docs/components(.ko).md` 19섹션,
      `preview/components.html` 라이트/다크 트윈, 스토리 4파일 추가.
- [x] 시안 대비 교정: ① Card의 `[data-theme="dark"]` 분기 제거(컴포넌트는
      테마로 분기하지 않는다 — Dialog/Toast와 같이 elevation 토큰 그대로),
      ② Tooltip이 `text.primary`를 배경으로 쓰던 것을 신규 시맨틱 페어
      `bg.inverse`/`text.on-inverse`로 교체(**D-011**), ③ 체크박스 disabled가
      라벨·박스 양쪽에서 opacity를 곱해 두 번 흐려지던 것 수정,
      ④ ListRow 제목/부제에 `display:block`(span 마크업에서 한 줄로 붙던
      실버그 — 브라우저 실측이 발견), ⑤ Select 셰브론 수직 정렬을
      flex 정렬 의존에서 `top:50%` 기준으로.
- **BottomSheet은 의도적 제외** (지시서 2번): 웹 Modal ↔ 네이티브
  BottomSheet 역할 매핑만 문서화하고 네이티브 구현은 Phase 3(네이티브
  소비자가 생길 때).
- 시각검증: 1280·375 양 폭에서 라이트/다크 트윈 실측 — 포커스 링(키보드
  Tab), 행 높이 균일(60px), 긴 제목 말줄임, 가로 오버플로 0.

### 8. 홈페이지 /brand 페이지 마무리 — `완료` (2026-08-13)
`jlc488/devlab.kr`의 `claude/brand-page` 브랜치(별도 세션이 작업)를 리뷰.
`brand/index.html` 시안과 대조 — 특히 로고 설명 문구가 구버전("건축 도면")
이면 "코드 블록을 쌓아 SaaS의 골격을 세우는 아키텍처 설계"로 교체 확인.
장기적으로 devslab.kr 자체도 `dds-tokens`를 소비하도록 전환.
- [x] 브랜치 리뷰·머지 (devlab.kr#29) — **로고 문구가 실제로 구버전이었고
      ko/en 모두 교체.** 실제 명함 앞면 4종(2인×2테마) 추가, 뒷면은
      직통 번호+vCard QR이라 공개 웹 미게재(소유자 요청 반영, 개인정보).
- [x] devslab.kr의 `dds-tokens` 소비 전환 (devlab.kr#30, D-009 — vendored
      사본 + sync 스크립트): body·electric 스케일·시맨틱 유틸리티가 토큰
      한 소스, ThemeProvider가 class+data-theme 동시 스위치, ::selection
      on-brand 규칙 적용(기존 흰 글자 2.3:1 수정).

### 9. 폰트 전략 확정 — `대기`
Geist/Geist Mono 셀프호스팅 여부, Pretendard 서브셋, RN 번들 전략.
결정을 `docs/decisions.md`에 기록.

### 12. site-kit 국기 로케일 피커 — `완료` (2026-09-02)
D-017. `LocaleMenu variant="flag"` + 국기 데이터 14개. 첫 소비자 TraceLinq 랜딩.

---

## P3 — 모바일 이후

### 10. 모바일 방향 결정: RN vs Ionic — `보류` (모바일 착수 시)
스펙 §8 Phase 3. 네이티브 성능·제스처 필요 → RN(`dds-native` 구현),
웹 코드 재사용 우선 → Ionic(기존 `ionic.css` + `dds-css` 재사용, 신규 패키지
불필요). 결정을 decisions.md에 기록. **그 전에 모바일 패키지를 미리 만들지
않는다** — 소비자 없는 구현은 썩는다.

### 11. 릴리스 파이프라인 — `보류` (패키지 2개 이상 생기면)
스펙 §7. changesets 기반 lockstep semver, deprecation 정책(minor 1개 경고
후 major 제거) 자동화.

---

## 미해결 질문 (오너 확인 필요)

- **로고 스토리**: `brand/index.html`의 마크 해석("코드 블록 + 아키텍처
  설계")은 형태를 보고 붙인 것. 실제 제작 의도가 따로 있으면 교체.
- ~~**DDS 공개 여부**~~: **해소 (2026-08-31, D-015)** — 레포 공개 + 공개 npm
  `@devslab/*` 배포, DevsLab Source-Available License 1.0 적용(오픈소스 아님).
  남은 오너 액션: ① GitHub 레포 Public 전환, ② 레포 시크릿 `NPM_TOKEN` 확인,
  ③ `dds-v*` 태그 푸시로 릴리스 워크플로 가동.
- **브랜드 페이지 i18n 범위**: devslab.kr의 14개 로케일을 /brand에도 전부
  적용할지, ko/en만 유지할지.

## 참고 링크

- 미리보기 아티팩트: 파운데이션 https://claude.ai/code/artifact/0df45005-15d3-4567-a61d-71d0419498b9 · 브랜드 https://claude.ai/code/artifact/05925654-5d02-4f80-a58a-3b1e171f0eab
- 토큰 포맷: [W3C Design Tokens](https://design-tokens.github.io/community-group/format/)
