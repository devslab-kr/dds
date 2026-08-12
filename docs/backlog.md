# DDS 백로그

우선순위순. 항목을 시작하면 상태를 `진행 중`으로, 끝나면 `완료`로 갱신하고
필요 시 하위 항목을 쪼갠다. 스펙 근거는 `design-system.ko.md`의 §번호로 표기.

상태: `대기` / `진행 중` / `완료` / `보류`

---

## P1 — Phase 1: 토큰 파이프라인과 첫 소비자

### 1. 토큰 빌드 파이프라인 (`@devslab-kr/dds-tokens`) — `대기`
스펙 §2. 레포를 pnpm 워크스페이스로 전환하고 `packages/dds-tokens` 생성.
[Style Dictionary](https://styledictionary.com/) v4로 `tokens/*.json`에서
한 소스 → 전 산출물 생성:
- [ ] `dist/tokens.css` — CSS 커스텀 프로퍼티 (`--dds-color-bg-brand: …`),
      라이트 기본 + `[data-theme="dark"]` 다크 매핑
- [ ] `dist/tailwind/` — Tailwind v4 `@theme` CSS + v3 `preset.js`
- [ ] `dist/tokens.ts` — TypeScript 상수 (RN·런타임용)
- [ ] `dist/ionic.css` — Ionic 테마 변수 매핑 (`--ion-color-primary` 등)
- [ ] CI (GitHub Actions): 빌드 + JSON 스키마 검증 + 문서·토큰 값 불일치 검사
- 완료 기준: `pnpm build` 한 번으로 4개 산출물이 나오고 CI가 초록색

### 2. CSS 컴포넌트 레이어 (`@devslab-kr/dds-css`) Core 6종 — `대기`
스펙 §2, §4. `preview/index.html`에 프로토타입된 스타일을 클래스 기반
패키지로 정식화. 토큰 CSS 변수만 참조(하드코딩 금지).
- [ ] Button (primary/secondary/ghost/danger × sm/md/lg × 전 상태 §4.2)
- [ ] TextField (라벨·헬프·에러)
- [ ] Badge (brand + 상태 4종)
- [ ] Spinner / Skeleton
- [ ] Dialog (+ 딤 오버레이)
- [ ] Toast
- [ ] 각 컴포넌트 접근성 체크 (§6) + do/don't 문서 (§4.4)

### 3. AskLinq에 적용 (첫 소비자) — `대기`
스펙 §8 Phase 1. asklinq 레포의 위젯·SSR 페이지가 `dds-tokens`/`dds-css`를
소비하도록 전환. 기존 teal(`#14b8a6`)을 cyan으로 수렴.
- 참고: asklinq `claude/tds-react-native-design-ohuzj0` 브랜치에 이 작업의
  전사(前史)가 있다 (문서는 이 레포로 이동됨, 커밋 `b396978` 참조)

---

## P2 — 확장

### 4. 쇼케이스 사이트 — `대기`
`preview/` + `brand/`를 GitHub Pages(또는 org 허브 devslab-kr.github.io에
링크)로 배포. 장기적으로 Storybook 도입 검토 (§4.4의 스토리 요구사항).

### 5. 다크모드 토글 표준화 — `대기`
devslab.kr과 동일한 `localStorage 'theme'` 키 + `data-theme` 속성 패턴을
`dds-css`의 공식 스니펫으로 문서화 (허브 README에 기존 구현 있음).

### 6. 아이콘 파이프라인 (`@devslab-kr/dds-icons`) — `대기`
스펙 §3.7. 단일 SVG 소스 → 웹/RN 컴포넌트 codegen. 24px 그리드,
1.5px 스트로크, `currentColor`.

### 7. Composite 컴포넌트 확충 — `대기`
스펙 §4.3 v1 인벤토리의 나머지: Tabs, ListRow, Checkbox/Radio/Switch,
Select/Textarea, Chip, Avatar, Card, Divider, Tooltip(웹), EmptyState,
Modal(웹)↔BottomSheet(네이티브) 역할 매핑.

### 8. 홈페이지 /brand 페이지 마무리 — `대기`
`jlc488/devlab.kr`의 `claude/brand-page` 브랜치(별도 세션이 작업)를 리뷰.
`brand/index.html` 시안과 대조 — 특히 로고 설명 문구가 구버전("건축 도면")
이면 "코드 블록을 쌓아 SaaS의 골격을 세우는 아키텍처 설계"로 교체 확인.
장기적으로 devslab.kr 자체도 `dds-tokens`를 소비하도록 전환.

### 9. 폰트 전략 확정 — `대기`
Geist/Geist Mono 셀프호스팅 여부, Pretendard 서브셋, RN 번들 전략.
결정을 `docs/decisions.md`에 기록.

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
- **DDS 공개 여부**: 레포/패키지를 공개(오픈소스)할지, npm 스코프 배포
  방식(공개 vs GitHub Packages)을 어떻게 할지.
- **브랜드 페이지 i18n 범위**: devslab.kr의 14개 로케일을 /brand에도 전부
  적용할지, ko/en만 유지할지.

## 참고 링크

- 미리보기 아티팩트: 파운데이션 https://claude.ai/code/artifact/0df45005-15d3-4567-a61d-71d0419498b9 · 브랜드 https://claude.ai/code/artifact/05925654-5d02-4f80-a58a-3b1e171f0eab
- 구조 참조: [TDS React Native](https://tossmini-docs.toss.im/tds-react-native/)
- 토큰 포맷: [W3C Design Tokens](https://design-tokens.github.io/community-group/format/)
