# DDS Shared Layout and Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** React·Solid·Vue·Svelte에 같은 Layout·LeftNav·TopNav와 간격·타이포 규격을 제공하고 검증한 새 버전을 npm에 발행한다.
**Architecture:** 공통 CSS 한 벌이 크기·간격·모양을 소유하고 각 프레임워크는 얇은 상태·슬롯 구현을 제공한다. ConsoleShell은 기존 API를 보존하며 Layout과 LeftNav를 조립한다. 업무 권한·라우팅·서버 데이터는 소비 서비스 책임이다.
**Tech Stack:** pnpm workspace, Changesets fixed group, React 18/19, SolidJS, Vue 3.5, Svelte 5, Vitest, Playwright, 공유 DDS CSS/tokens.
**Spec:** `docs/superpowers/specs/2026-10-22-shared-layout-navigation-design.md` (사용자 승인 2026-10-22).

## Global Constraints

- 기존 폴더 `C:/Users/jlc48/workspace/dds`의 현재 `feat/console-shell-collapsible-nav` 브랜치에서 진행한다. 새 worktree/clone을 만들지 않는다.
- 기존 사용자 파일·stash·ignored bundle-probe를 보존하고 이 작업 파일만 커밋한다.
- 공개 이름은 `Layout`, `LeftNav`, `TopNav`; 별도 dds-layout/dds-menu npm 패키지를 만들지 않는다.
- `ConsoleShell`의 기존 props·슬롯과 일반 nav 배열 사용법을 유지한다. 기존 export 이름은 삭제하지 않는다.
- 제목 24/32/700, 20/28/600, 17/24/600; 본문 14/20/400, 읽기 16/24/400, 라벨 13/16/500, 보조 12/16/400을 기존 DDS 토큰으로 연결한다.
- 레일 232px, 상단 최소 56px, 본문 32px/모바일16px, 본문폭 1100/900/800/full, 섹션32·패널24/모바일16·필드16·아이콘간격8px.
- 모바일 전환 56.25rem, 메뉴 행 데스크톱40/모바일44px 이상. 글자 확대·줄바꿈 시 영역을 고정 높이로 잘라내지 않는다.
- 모든 프레임워크는 같은 CSS와 의미 구조를 사용한다. Svelte는 이번 구성 요소만 제공하며 전체 컨트롤/테이블 지원으로 홍보하지 않는다.
- 앱별 임의 CSS 생성·권한 변경·Admin/FM 운영 마이그레이션은 이 패키지 릴리스에 섞지 않는다. 소비 서비스 반영은 후속 작업이다.
- 같은 SHA에서 성공한 검사를 반복하지 않으며, 실패 재시도는 실패 job 우선이다. 필수 CI/릴리스 검사를 생략하지 않는다.

## Review Focus

1. 모바일에서 접힌 메뉴 링크로 Tab이 들어가거나 Escape 후 초점이 사라짐: Task 2와 Task 5에서 실제 키보드 검증.
2. 다중 인스턴스·SSR/hydration의 ID 충돌과 초기 상태 차이: Task 2~4의 SSR/제어 상태 검증.
3. 긴 한국어·영문, RTL, 확대 시 제목/메뉴/칩 잘림: Task 5의 브라우저 검증.
4. 같은 화면의 프레임워크별 글자·여백 편차: Task 5의 동일 fixture 실측 비교.
5. npm tarball에서 공유 CSS·타입·새 export 누락 또는 다른 UI 런타임 유입: Task 4와 Task 6의 새 소비 프로젝트 검증.

## 인터페이스와 파일 경계

공통 의미 인터페이스(노드 타입만 ReactNode/JSX.Element/Vue slot/Svelte Snippet으로 다름):
- `Layout`: `navigationPosition?: 'left'|'top'` (기본 left), `contentWidth?: 'workspace'|'form'|'settings'|'full'` (기본 workspace), `labels: {skip:string; menuOpen:string; menuClose:string}`. 콘텐츠 슬롯: `header`, `navigation`, `railStart`, `railEnd`, `footer`, 기본 본문.
- Vue는 named slot, Svelte는 같은 이름 snippet prop, React/Solid는 같은 이름 node prop을 사용한다. 본문은 기존 children/default slot이다.
- Layout이 전체 모바일 탐색 열기·닫기·Escape·초점 복귀를 담당한다. 탐색 영역의 링크 클릭은 기본 라우팅을 가로채지 않고 drawer만 닫는다.
- `LeftNav`: 현재 nav 모델(surface, activePath, nav, labels.nav/badge)을 유지한다. group id/collapsible, item icon, expandedGroups/defaultExpandedGroups/onExpandedGroupsChange 및 onNavigate를 제공한다. Vue만 update:expandedGroups/navigate emit을 사용한다.
- `TopNav`: 같은 nav 모델과 onNavigate/navigate를 사용한다. 그룹 제목은 네이티브 disclosure(`<details><summary>`)이며 일반 링크 탐색이다. 별도 menubar role/화살표 키 모델을 혼합하지 않는다. Escape와 외부 클릭은 열린 하위 탐색을 닫고 Escape는 해당 summary로 초점을 돌린다.
- LeftNav와 TopNav 자체에는 두 번째 모바일 햄버거를 넣지 않는다. Layout 밖에서는 자체 탐색 요소로 작동하며 작은 화면에서 세로로 배치된다.
- ConsoleShell은 Layout(left)에 브랜드/context/foot와 기존 header를 전달하고 기본 메뉴로 LeftNav를 조립한다. 기존 navigation 사용자 슬롯도 보존한다.
- 기존 ConsoleNavItem/ConsoleNavGroup 타입은 호환성을 위해 보존한다. 신규 alias/DSL을 추가하지 않는다. React의 미발행 ConsoleNav 컴포넌트는 LeftNav로 정리한다.

### Task 1: 공통 화면 CSS 규격

**Files:** Create `packages/dds-css/src/layout.css`, `packages/dds-css/src/top-nav.css`; Modify `packages/dds-css/src/console-shell.css`, `packages/dds-css/build.mjs`.
**Produces:** `.dds-layout`, `[data-navigation-position="left"|"top"]`, `.dds-layout__header`, `.dds-layout__navigation`, `.dds-layout__main`, `.dds-layout__content[data-width]`, `.dds-layout__footer`, `.dds-layout__section`, `.dds-layout__panel`, `.dds-layout__fields`, `.dds-layout__reading`, `.dds-layout__caption`, `.dds-top-nav` 및 자식 클래스. 기존 rail nav 클래스는 LeftNav 공용으로 유지한다.

- [ ] `graft callers ConsoleShell --depth all`로 실제 사용처와 SSR/browser/패키지 진입점을 확인하고, 고정 ID/클래스에 의존하는 공개 계약을 기록한다. 오래된 그래프가 누락한 새 파일만 rg로 보완한다.
- [ ] Task 5에서 확장할 공통 fixture 파일과 실측 검증을 먼저 만들고, 초기에는 표준 클래스의 정적 HTML로 `24px/32px` 제목, `14px/20px` 본문, `32px/16px` 여백을 확인하고 아직 없는 규격 때문에 실패하는 것을 확인한다.
- [ ] Global Constraints 수치를 토큰으로 연결한다. 제목 h1/h2/h3와 기본 컨트롤 타이포는 Layout 내부에 한정한다. `[hidden]`과 모바일 닫힘 상태에서 표시·초점이 새지 않게 한다. 상태 칩에 고정 원형 너비를 주지 않는다.
- [ ] Run `pnpm run verify:foundation:core`; PASS: CSS 토큰/색상/hidden/bundle 검사가 모두 통과한다. 실제 크기 검증은 Task 5에서 확정한다.
- [ ] Commit: `feat(css): define shared application layout and navigation rules`.

### Task 2: React 조립형 Layout·LeftNav·TopNav와 호환 adapter

**Files:** Create `packages/dds-react/src/layout.tsx`, `packages/dds-react/src/left-nav.tsx` (현재 console-nav.tsx에서 이동), `packages/dds-react/src/top-nav.tsx`, `packages/dds-react/src/__tests__/layout.test.tsx`; Modify `src/console-shell.tsx`, `src/index.ts`, `src/__tests__/console-shell.test.tsx`, `src/__tests__/ssr.test.tsx` (모두 packages/dds-react 아래).
**Consumes:** Task 1 CSS. **Produces:** 인터페이스 절의 Layout/LeftNav/TopNav 및 각 Props 타입, ConsoleShell 기존 API.

- [ ] 행동 테스트 추가: 독립 LeftNav 조립, legacy 그룹 펼침, `defaultExpandedGroups=[]`, 부모 제어 상태 존중, TopNav summary로 하위 링크 열기·Escape 닫기, Layout 모바일 열기/닫기와 초점 복귀, 다중 인스턴스 unique targets. 실패를 먼저 확인한다.
- [ ] Layout은 프레임워크 기본 상태/ID/lifecycle만 사용한다. 모바일 여부는 SSR 초기 상태를 바꾸지 않고 mount 이후 반영한다. 모바일 닫힘은 CSS visibility와 접근성 상태로 키보드 진입을 막고, 열린 drawer에서는 초점이 본문으로 빠지지 않게 한다. 외부 제어 nav 상태를 내부에서 덮어쓰지 않는다.
- [ ] ConsoleShell을 공통 Layout 조립으로 바꾸고 기존 data-action/class hooks와 props/ref 전달을 보존한다. standalone navigation 클릭·사용자 라우터 이벤트를 가로채지 않는다.
- [ ] Run `pnpm --filter @devslab/dds-react run test` 및 `run check`, `run build`; PASS: 기존 전체 suite와 새 행동/SSR 테스트 통과.
- [ ] Commit: `feat(react): compose shared Layout LeftNav and TopNav`.

### Task 3: Solid·Vue 동일 계약

**Files Solid:** Create `packages/dds-solid/src/layout.tsx`, `src/top-nav.tsx`, `src/__tests__/layout.test.tsx`; Modify `src/left-nav.tsx`, `src/console-shell.tsx`, `src/index.ts`, `src/__tests__/primitives.test.tsx`, `src/__tests__/ssr.test.tsx`.
**Files Vue:** Create `packages/dds-vue/src/Layout.vue`, `src/TopNav.vue`, `src/__tests__/layout.test.ts`; Modify `src/LeftNav.vue`, `src/ConsoleShell.vue`, `src/console-shell.types.ts`, `src/index.ts`, `src/__tests__/console-shell.test.ts`, `src/__tests__/ssr.test.ts`.
**Consumes/Produces:** Task 2와 같은 의미 API/공통 CSS; Solid signal/JSX, Vue props/slot/emit만 다르다.

- [ ] 각 프레임워크에 Task 2와 같은 legacy/empty-default/controlled/standalone/TopNav/Escape/mobile/SSR 동작 테스트를 추가하고 실패를 확인한다. Vue 다중 앱 루트는 문서화된 app idPrefix를 사용하는 조건도 검증한다.
- [ ] 프레임워크 전용 CSS나 다른 UI 런타임 bridge 없이 구현한다. Solid onCleanup, Vue unmount에서 이벤트를 해제한다. 기존 ConsoleShell은 공통 Layout/LeftNav adapter로 교체한다.
- [ ] Run `pnpm --filter @devslab/dds-solid run test`, `run check`, `run build`; 같은 방식으로 dds-vue 실행. PASS: 각 전체 suite·타입·빌드 통과.
- [ ] Commit: `feat(solid): share application layout and navigation`; 이어 Vue 파일만 `feat(vue): share application layout and navigation`.

### Task 4: Svelte 최소 공개 패키지 완성

**Files:** `packages/dds-svelte/package.json`, `svelte.config.js`, `tsconfig.json`, `vite.config.ts`, `vitest.ssr.config.ts`, `styles.css`, `LICENSE`; Create/complete `src/lib/Layout.svelte`, `LeftNav.svelte`, `TopNav.svelte`, `ConsoleShell.svelte`, `types.ts`, `index.ts`, `tests/console-shell.test.ts`, `tests/layout.test.ts`, `tests/ssr.test.ts`.
**Consumes/Produces:** 같은 의미 API/CSS, Svelte 5 props/snippets, controlled callback. 기존 미완성 placeholder는 완성 전 공개하지 않는다.

- [ ] 현재 3개 RED 테스트 기록을 보존하고, Layout/TopNav/다중 SSR ID/controlled parent update/장식 아이콘/초점 복귀의 실패 테스트를 추가한다.
- [ ] Svelte $props/$state/$derived와 SSR-safe $props.id(), snippet으로 구현한다. browser 전역 접근은 mount 이후 실행하고 unmount에서 해제한다. CSS는 토큰과 dds-css만 import한다.
- [ ] `svelte-package`로 타입과 .svelte 배포물을 생성하고 `pnpm --filter @devslab/dds-svelte run test`, `run check`, `run build` PASS를 확인한다.
- [ ] Commit: `feat(svelte): add shared layout and navigation package`.

### Task 5: 네 프레임워크 동일 화면 검증과 사용 문서

**Files:** Create `tests/fixtures/layouts/` 아래 `react.tsx`, `solid.tsx`, `vue.vue`, `svelte.svelte`, `index.html`, `vite.config.ts`; Create `tests/browser/layouts.spec.ts`, `playwright.layouts.config.ts`, `docs/layouts.md`, `docs/layouts.ko.md`; Modify 각 패키지 `README.md`, `README.ko.md`, `packages/react-canary/src/console-demo.tsx`, `tests/browser/react.spec.ts`, root `package.json`.
**Produces:** `pnpm run verify:foundation:layouts`가 실행하는 같은 콘텐츠·메뉴의 두 유형 × 네 프레임워크 예시. 작업용 fixture는 npm 배포물에 포함하지 않는다.

- [ ] fixture에서 상단/왼쪽형을 전환하고 같은 제목·본문·패널·필드·상태 칩을 표시한다. 새 프레임워크 런타임은 fixture의 개발 의존성으로만 추가한다.
- [ ] 브라우저에서 실제 computed styles/bounding boxes를 비교한다: title 24/32/700, body14/20, rail232, desktoppadding32/mobile16, 각 폭 상한, 두 메뉴형의 주요 간격이 프레임워크마다 동일해야 한다. 소스 문자열 snapshot은 사용하지 않는다.
- [ ] 1280px/390px, 밝음/어두움, RTL, 200% 글자 확대 및 긴 한국어/영문에서 잘림·가로 넘침·키보드 누출을 확인한다. TopNav 하위 링크·Escape/외부 클릭·LeftNav 그룹·모바일 opener 초점 복귀·닫힌 링크 Tab 제외를 검사한다. Axe 중대 위반 0건.
- [ ] 문서는 짧은 조립 예시, 확정 규격표, 새/기존 ConsoleShell 사용법, 앱이 소유하는 라우터·권한·저장소 책임과 소비 서비스 버전 채택 절차를 설명한다.
- [ ] `pnpm run verify:foundation:layouts` PASS 및 예시 화면 검토 후 Commit: `test: verify shared layout parity across frameworks`.

### Task 6: 새 패키지 연결·릴리스 검증·버전 발행

**Files:** Modify `.changeset/config.json`, `scripts/verify-package-names.mjs`, `tests/foundation-contracts.test.mjs`, root `package.json`, `.github/workflows/ci.yml`, `.github/workflows/release.yml`, `README.md`, `README.ko.md`, package manifests/CHANGELOGs, `pnpm-lock.yaml`; Create `scripts/verify-svelte-release.mjs`; Extend `scripts/verify-react-release.mjs`, `scripts/verify-vue-release.mjs`, `scripts/verify-solid-release.mjs`의 새 export 소비 검증.
**Produces:** 필수 CI에 `verify:svelte:test`, `verify:svelte:release`, `verify:foundation:layouts` 연결, fixed group에 Svelte 포함, npm 공개 버전과 근거.

- [ ] 패키지명/라이선스/exports/styles/타입/필수 workflow 연결 테스트를 보강하고 새 Svelte가 누락된 현재 설정에서 실패를 확인한다. 기존 foundation fixed-group 계약을 새 11개 패키지로 명시적으로 갱신한다.
- [ ] 새 소비 프로젝트에 tarball을 설치해 Layout/LeftNav/TopNav 타입·스타일·SSR 및 실제 client mount를 검증한다. Svelte 배포물에 .svelte와 d.ts 포함, 다른 UI 프레임워크 의존성 없음, npm publish --dry-run 성공을 확인한다. 생성한 임시 폴더만 검사 후 제거한다.
- [ ] 최신 origin/main과 npm 버전을 재확인한다. 현재 로컬 Changesets가 준비한 0.28.0이 여전히 다음 버전이면 유지하고 Svelte를 같은 fixed group에 포함한다. 이미 발행되었으면 미공개 다음 버전을 Changesets로 다시 계산한다. 수동 강제 덮어쓰기나 토큰 노출은 하지 않는다.
- [ ] 새 버전에서 install --frozen-lockfile, 영향별 테스트·release gates·전체 필수 CI를 통과하고 새 컨텍스트 전체 변경 리뷰를 받는다. 중요 결함은 수정 후 영향 검증을 다시 한다.
- [ ] PR #117 제목·본문을 최종 범위(Layout/LeftNav/TopNav 네 프레임워크)로 갱신하고 ready 처리한다. 통과 SHA를 확인해 머지한다. 기존 Release workflow의 publish 결과와 npm의 실제 네 프레임워크 버전/exports를 조회해 확인한다.
- [ ] 기존 canonical main을 동기화하고 발행 버전·PR·검증 결과·소비 서비스 적용 상태를 결과에 기록한다. Admin/FM 배포가 이번 패키지 발행과 동시에 끝났다고 보고하지 않는다.

## Self-review

Spec의 구조·타이포·간격은 Task 1~4, 두 유형/네 프레임워크 실제 비교는 Task 5, 공개 계약·배포는 Task 6에 대응한다.
Review Focus 5개를 행동/브라우저/새 소비 프로젝트 검증에 배정했다. 기존 미완성 작업은 새 작업으로 중복 구현하지 않고 검증하며 통합한다.
설계 범위 밖의 서비스 업무 코드·인증·배포 자동화 포털 구현은 이 계획에 넣지 않았다.

## 실행 방식 제안

직접 구현(Native)을 권장한다. 공통 CSS와 인터페이스를 한 세션에서 일관되게 통합하고, 완료 후 별도 컨텍스트 리뷰를 한 번 수행한다.
선택 대안은 작업별 구현·리뷰 에이전트를 사용하는 Subagent-driven이다. 두 방식 모두 사용자 승인 범위인 버전 상승·머지·npm 발행까지 포함한다.
