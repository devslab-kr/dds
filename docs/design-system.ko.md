# DevsLab Design System (DDS) — 규칙 명세 v0

🌐 [English](design-system.md)

데브스랩 제품군 (AskLinq, BookLinq, FlowLinq — Linq 패밀리) 의 **웹과 모바일 앱을
하나의 디자인 언어로 묶는 규칙**. [토스 디자인 시스템 (TDS)](https://tossmini-docs.toss.im/tds-react-native/)
의 구조 — 토큰 기반 파운데이션 + 플랫폼별 컴포넌트 패키지 — 를 참조 모델로 삼되,
특정 프레임워크에 종속되지 않게 설계한다 (TDS 2.x 는 토스 자체 RN 프레임워크인
Granite 에 종속된다 — 우리는 그 종속을 만들지 않는다).

> **위치에 대한 노트.** 이 문서는 스펙이 확정될 때까지 asklinq 레포에 둔다.
> 구현이 시작되면 [linq-kit](https://github.com/devslab-kr/linq-kit) 레벨의
> 공유 패키지 (또는 별도 `devslab-kr/dds` 레포) 로 승격한다. AskLinq 는 첫
> 소비자일 뿐, 시스템의 주인이 아니다.

---

## 1. 원칙

1. **토큰이 유일한 진실이다.** 색·타이포·간격·라운드·그림자·모션 등 모든 시각
   값은 토큰에서 나온다. 컴포넌트와 제품 코드에 hex 값·px 값 하드코딩 금지.
2. **하나의 언어, 두 개의 런타임.** 웹 (React) 과 모바일 (React Native) 은
   같은 컴포넌트 이름, 같은 props 계약, 같은 토큰을 쓴다. 다른 것은 구현뿐이다.
3. **시맨틱 > 원시값.** 컴포넌트는 원시 팔레트 (`cyan-500`) 를 직접 참조하지
   않고 시맨틱 토큰 (`color.bg.brand`) 만 참조한다. 다크 모드는 시맨틱 레이어의
   매핑 교체만으로 얻는다.
4. **접근성은 기본값이다.** 대비·터치 타깃·포커스 표시는 옵션이 아니라 컴포넌트가
   통과해야 하는 최소 조건이다.
5. **시스템은 부품을, 제품은 화면을 소유한다.** 페이지 레이아웃과 비즈니스 흐름은
   제품 코드의 몫이고, 시스템은 재사용 가능한 부품과 규칙만 제공한다.

---

## 2. 아키텍처

3 개 레이어. 아래로 갈수록 플랫폼 중립적이다.

```text
[ 컴포넌트 ]   Button, TextField, Dialog …          ← 플랫폼별 구현 (web / native)
[ 프리미티브 ] Text, Box, Stack, Pressable …        ← 얇은 플랫폼 어댑터
[ 토큰 ]      color / typography / spacing / …      ← 순수 JSON, 플랫폼 중립
```

### 패키지 구성 (구현 시)

| 패키지 | 내용 | 소비자 |
| --- | --- | --- |
| `@devslab-kr/dds-tokens` | 토큰 JSON + 빌드 산출물 (아래 표) | 모든 곳 |
| `@devslab-kr/dds-css` | CSS 컴포넌트 레이어 (클래스 기반, 프레임워크 무관) | SSR 페이지, 바닐라 위젯, Vue, React, Ionic |
| `@devslab-kr/dds-native` | React Native 컴포넌트 | 모바일 앱 (RN 선택 시) |
| `@devslab-kr/dds-icons` | 아이콘 (SVG 단일 소스 → 플랫폼별 코드 생성) | 모든 곳 |

토큰 빌드는 [Style Dictionary](https://styledictionary.com/) 계열 도구로
**한 소스에서** 모든 플랫폼 산출물을 생성한다. 웹과 네이티브가 각자 값을 들고
있는 순간 일관성은 끝난다.

**`dds-tokens` 빌드 산출물** — 프레임워크마다 소비 형태가 다르므로 토큰
패키지가 전부 뽑아준다:

| 산출물 | 형태 | 소비자 |
| --- | --- | --- |
| CSS 커스텀 프로퍼티 | `tokens.css` (`--dds-color-bg-brand: …`) | 모든 웹 (SSR, Vue, React, Ionic) |
| Tailwind 프리셋 | v4 `@theme` CSS + v3 `preset.js` | Tailwind 쓰는 모든 프로젝트 |
| TypeScript 상수 | `tokens.ts` | RN, 런타임에서 토큰이 필요한 코드 |
| Ionic 테마 매핑 | `ionic.css` (`--ion-color-primary: var(--dds-color-bg-brand)` …) | Ionic 앱 (선택 시) |

### 프레임워크 전략 — "코어는 CSS, 프레임워크는 소비자"

현재 데브스랩 웹 스택은 프레임워크가 없다 (AskLinq = Hono SSR + 바닐라 JS
위젯). 이건 제약이 아니라 기회다 — 특정 프레임워크에 컴포넌트를 묶지 않고
**CSS 레이어를 코어로** 두면 React·Vue·Ionic·SSR 전부가 같은 부품을 쓴다.

- **Tailwind** — 토큰의 배포 채널이지 별도 시스템이 아니다. `dds-tokens` 가
  Tailwind 프리셋을 뽑아주므로 `bg-brand`, `text-primary`, `p-4` 같은
  유틸리티가 곧 DDS 토큰이다. Tailwind 임의값 (`bg-[#06b6d4]`, `p-[13px]`)
  사용은 토큰 하드코딩과 동일한 위반이다.
- **Vue** — 별도 `dds-vue` 패키지를 만들지 않는다. Vue 프로젝트는
  `dds-css` 클래스 + Tailwind 유틸리티를 그대로 쓰고, 래핑이 필요하면 제품
  레포 안에서 얇게 감싼다. Vue 제품이 실제로 둘 이상 생기면 그때 패키지
  승격을 검토한다 (§4.3 승격 규칙과 동일한 논리).
- **Ionic** — Ionic 컴포넌트는 CSS 변수 (`--ion-color-*`) 로 테마되는 웹
  컴포넌트이므로, `dds-tokens` 의 Ionic 매핑 파일 하나로 Ionic 전체가 DDS
  색·타이포를 입는다. 모바일을 RN 대신 Ionic 으로 가더라도 토큰·계약 레이어는
  그대로다 (§8 Phase 3 참조).
- **React** — 마찬가지로 소비자다. React 제품이 생기면 `dds-css` 위에 얇은
  래퍼를 얹는다.

**규칙.** 프레임워크별 컴포넌트 패키지는 **그 프레임워크로 만든 제품이 실제로
존재할 때만** 만든다. 소비자 없는 프레임워크 바인딩은 유지보수 부채다.

토큰 포맷은 [W3C Design Tokens](https://design-tokens.github.io/community-group/format/)
형식을 따른다:

```json
{
  "color": {
    "bg": {
      "brand": { "$value": "{palette.cyan.500}", "$type": "color" }
    }
  }
}
```

---

## 3. 파운데이션

### 3.1 컬러

컬러 시스템은 TDS 의 구조를 그대로 차용한다: **원시 팔레트 (색상별 50–900
10단계) + 알파 스케일 + 시맨틱 (어댑티브) 토큰** 의 3층. TDS 가
`colors.blue500` 같은 팔레트와 `colors.background` / `colors.greyBackground` /
`colors.layeredBackground` 같은 어댑티브 토큰을 분리하듯, DDS 도 팔레트와
시맨틱을 분리하고 컴포넌트는 시맨틱만 본다.

**브랜드 기준색은 데브스랩 홈페이지 (devslab.kr) 다.** AskLinq 의 teal 은
잠정값이었고, 홈페이지가 실제로 쓰는 **cyan** (`#06b6d4`, hover `#22d3ee`) 과
**zinc 뉴트럴** (`#09090b` 다크 배경, `#fafafa` 라이트) 을 시스템 기준으로
확정한다. AskLinq 는 Phase 1 에서 토큰으로 갈아탈 때 cyan 으로 수렴한다.

**원시 팔레트 — 브랜드 & 뉴트럴 (전체 스케일).**

| 단계 | `cyan` (브랜드) | `zinc` (뉴트럴) |
| --- | --- | --- |
| 50 | `#ecfeff` | `#fafafa` |
| 100 | `#cffafe` | `#f4f4f5` |
| 200 | `#a5f3fc` | `#e4e4e7` |
| 300 | `#67e8f9` | `#d4d4d8` |
| 400 | `#22d3ee` | `#a1a1aa` |
| 500 | `#06b6d4` | `#71717a` |
| 600 | `#0891b2` | `#52525b` |
| 700 | `#0e7490` | `#3f3f46` |
| 800 | `#155e75` | `#27272a` |
| 900 | `#164e63` | `#18181b` |
| 950 | — | `#09090b` |

**원시 팔레트 — 상태색 (기준값, 전체 스케일은 토큰 JSON 에서 확정).**

| 스케일 | 용도 | 기준값 |
| --- | --- | --- |
| `red.50–900` | 위험·오류 | `red.500 = #ef4444`, `red.700 = #b91c1c`, `red.50 = #fef2f2` |
| `amber.50–900` | 경고 | `amber.500 = #f59e0b`, `amber.700 = #b45309`, `amber.50 = #fffbeb` |
| `green.50–900` | 성공 | `green.500 = #22c55e`, `green.700 = #15803d`, `green.50 = #f0fdf4` |
| `blue.50–900` | 정보·링크 | `blue.500 = #3b82f6`, `blue.700 = #1d4ed8`, `blue.50 = #eff6ff` |

**알파 스케일** — TDS 의 greyOpacity 에 해당. 오버레이·pressed·딤 처리는 회색
불투명값이 아니라 알파로 푼다 (배경색과 무관하게 자연스럽게 겹치기 위해).
홈페이지가 실제 쓰는 값 기준:

| 토큰 | 값 | 용도 |
| --- | --- | --- |
| `alpha.black.5` | `#0000000d` | hover 틴트 (라이트) |
| `alpha.black.8` | `#00000014` | pressed 틴트 (라이트) |
| `alpha.black.10` | `#0000001a` | 얇은 구분선·딤 보더 |
| `alpha.black.25` | `#00000040` | 딤 오버레이 (모달 뒤) |
| `alpha.white.8` | `#ffffff14` | hover/pressed 틴트 (다크) |
| `alpha.white.85` | `#ffffffd9` | 다크 위 반투명 텍스트 |

**시맨틱 토큰** — 컴포넌트가 실제로 참조하는 유일한 레이어. 라이트/다크 두 개의
매핑을 가진다. 홈페이지와 동일하게 **라이트가 기본, 다크는 토글**이며 두 매핑
모두 처음부터 1급으로 관리한다.

| 토큰 | 라이트 | 다크 | 용도 |
| --- | --- | --- | --- |
| `color.bg.default` | `#ffffff` | `zinc.950` | 기본 화면 배경 |
| `color.bg.subtle` | `zinc.50` | `zinc.900` | 섹션·카드 구분 배경 (TDS greyBackground) |
| `color.bg.elevated` | `#ffffff` + elevation | `zinc.900` | 모달·팝오버·시트 (TDS layered/floated) |
| `color.bg.brand` | `cyan.500` | `cyan.500` | 브랜드 강조 면 (주요 버튼 등) |
| `color.bg.brand-hover` | `cyan.400` | `cyan.400` | 브랜드 면 hover (홈피 관용) |
| `color.bg.brand-subtle` | `cyan.50` | `cyan.900` | 브랜드 옅은 배경 |
| `color.text.primary` | `zinc.950` | `zinc.50` | 본문·제목 |
| `color.text.secondary` | `zinc.600` | `zinc.400` | 보조 설명 |
| `color.text.muted` | `zinc.500` | `zinc.500` | 비활성·플레이스홀더 |
| `color.text.on-brand` | `zinc.950` | `zinc.950` | **브랜드 면 위 텍스트 (아래 노트)** |
| `color.text.on-status` | `white` | `zinc.950` | 상태색 채움 면 위 텍스트 (danger 버튼 등) |
| `color.text.brand` | `cyan.700` | `cyan.400` | 브랜드 텍스트·링크 |
| `color.border.default` | `zinc.200` | `zinc.800` | 기본 보더 |
| `color.border.strong` | `zinc.300` | `zinc.700` | 입력 필드 등 강조 보더 |
| `color.border.focus` | `cyan.500` | `cyan.400` | 포커스 링 |
| `color.status.success` / `.success-bg` | `green.700` / `green.50` | `green.400` / `green.900` | 성공 |
| `color.status.warning` / `.warning-bg` | `amber.700` / `amber.50` | `amber.400` / `amber.900` | 경고 |
| `color.status.danger` / `.danger-bg` | `red.700` / `red.50` | `red.400` / `red.900` | 위험·오류 |
| `color.status.info` / `.info-bg` | `blue.700` / `blue.50` | `blue.400` / `blue.900` | 정보 |

> **on-brand 노트.** cyan 은 밝은 색상이라 흰 텍스트를 올리면 대비가
> 2.3:1 로 WCAG AA 에 한참 못 미친다. 브랜드 면 위 텍스트는 흰색이 아니라
> **`zinc.950` (다크)** 를 쓴다 (대비 약 8:1) — 홈페이지의 터미널 모티프
> (다크 패널 + cyan 프롬프트) 와도 일치하는 선택이다. "primary 버튼 = 색 배경 +
> 흰 글자" 관성을 여기서는 버린다.

**규칙.**

- 컴포넌트·제품 코드는 시맨틱 토큰만 쓴다. 원시 팔레트 직접 참조는 시맨틱
  레이어 정의부에서만 허용된다.
- 다크 모드는 시맨틱 매핑 파일 하나를 추가하는 것으로 끝나야 한다. 컴포넌트에
  `if (dark)` 분기가 필요하다면 토큰 설계가 잘못된 것이다.
- 상태 색 (success/warning/danger/info) 은 항상 `-bg` 페어와 함께 쓴다
  (진한 전경 + 옅은 배경). 임의 조합 금지.
- 오버레이·pressed·hover 틴트는 알파 스케일로만 처리한다. `opacity` 속성으로
  때우는 것은 disabled 상태에만 허용 (§4.2 와 동일).

### 3.2 타이포그래피

**폰트.** 홈페이지 (devslab.kr) 와 동일하게 라틴·숫자는
[Geist](https://vercel.com/font) / 코드·라벨은 Geist Mono 를 쓴다. Geist 는
한글 글리프가 없으므로 한글은 [Pretendard](https://github.com/orioncactus/pretendard)
→ 시스템 고딕 순으로 폴백한다 (스택: `Geist, Pretendard, system-ui, …`).
숫자가 중요한 화면 (대시보드 통계) 은 tabular figures 를 켠다.

**스케일** — 이름·크기·행간·굵기가 한 세트다. 웹은 `rem` (1rem = 16px),
RN 은 같은 숫자를 pt 로 쓴다. 숫자가 같으므로 표는 하나다.

| 토큰 | 크기/행간 | 굵기 | 용도 |
| --- | --- | --- | --- |
| `typo.display` | 32 / 40 | 700 | 랜딩 히어로, 큰 숫자 |
| `typo.title-1` | 24 / 32 | 700 | 페이지 제목 |
| `typo.title-2` | 20 / 28 | 600 | 섹션 제목, 다이얼로그 제목 |
| `typo.title-3` | 17 / 24 | 600 | 카드 제목, 리스트 강조 행 |
| `typo.body-1` | 16 / 24 | 400 | 기본 본문 (채팅 메시지 포함) |
| `typo.body-2` | 14 / 20 | 400 | 밀도 높은 본문, 대시보드 셀 |
| `typo.label` | 13 / 16 | 500 | 버튼·입력 라벨·탭 |
| `typo.caption` | 12 / 16 | 400 | 타임스탬프, 보조 정보 |

**규칙.**

- 스케일 밖의 크기 사용 금지. 새 크기가 필요하면 스케일에 추가하는 PR 부터.
- 크기와 행간은 분리해서 조정하지 않는다 (세트로만 사용).
- 웹 본문 최소 14px, 모바일 본문 최소 14pt. caption 은 본문 용도로 쓰지 않는다.

### 3.3 간격 (Spacing)

4px 그리드. 허용 값 스케일:

```text
0  2  4  8  12  16  20  24  32  40  48  64
```

토큰 이름은 값 그대로 (`space.8`, `space.16`). 컴포넌트 내부 패딩·요소 간
마진·레이아웃 갭 모두 이 스케일에서만 고른다. 홀수·임의 값 (`13px`, `18px`)
이 필요해 보이면 디자인을 스케일에 맞춘다 — 스케일을 디자인에 맞추지 않는다.

### 3.4 라운드 (Radius)

| 토큰 | 값 | 용도 |
| --- | --- | --- |
| `radius.sm` | 4 | 체크박스, 태그 |
| `radius.md` | 8 | 버튼, 입력 필드, 카드 |
| `radius.lg` | 12 | 다이얼로그, 팝오버 |
| `radius.xl` | 16 | 바텀시트, 대형 카드 |
| `radius.full` | 9999 | 필, 아바타, 칩 |

### 3.5 그림자 (Elevation)

3 레벨만 둔다. 웹은 `box-shadow`, RN 은 iOS `shadow*` + Android `elevation`
값을 토큰이 함께 정의한다 (플랫폼별로 따로 만들지 않는다).

| 토큰 | 용도 | 웹 | RN elevation |
| --- | --- | --- | --- |
| `elevation.1` | 카드 | `0 1px 3px rgba(20,22,26,.08)` | 2 |
| `elevation.2` | 드롭다운, 팝오버 | `0 4px 12px rgba(20,22,26,.12)` | 6 |
| `elevation.3` | 모달, 바텀시트 | `0 12px 32px rgba(20,22,26,.18)` | 12 |

### 3.6 모션

| 토큰 | 값 | 용도 |
| --- | --- | --- |
| `motion.duration.fast` | 100ms | hover/press 피드백 |
| `motion.duration.base` | 200ms | 전환, 페이드, 토스트 |
| `motion.duration.slow` | 300ms | 시트·모달 진입/퇴장 |
| `motion.easing.standard` | `cubic-bezier(0.2, 0, 0, 1)` | 대부분의 전환 |
| `motion.easing.enter` | `cubic-bezier(0, 0, 0, 1)` | 진입 (감속) |
| `motion.easing.exit` | `cubic-bezier(0.3, 0, 1, 1)` | 퇴장 (가속) |

**규칙.** OS 의 모션 감소 설정 (`prefers-reduced-motion`, RN
`AccessibilityInfo.isReduceMotionEnabled`) 을 항상 존중한다 — 장식 애니메이션은
끄고, 상태 전달에 필요한 전환은 즉시 완료로 대체한다.

### 3.7 아이콘

- 단일 세트, 24px 그리드, 1.5px 스트로크, `currentColor` 로 색 상속.
- 이름은 `기능-변형` 패턴 (`chevron-down`, `check-circle`). 브랜드 로고류는
  아이콘 세트가 아니라 별도 에셋으로 관리.
- 웹·RN 컴포넌트는 같은 SVG 소스에서 코드 생성한다. 손으로 두 벌 만들지 않는다.

---

## 4. 컴포넌트 규칙

### 4.1 API 계약 — 웹과 네이티브가 공유하는 것

같은 이름의 컴포넌트는 두 플랫폼에서 **동일한 핵심 props** 를 가진다:

- `variant` — 시각 종류 (`primary` / `secondary` / `ghost` / `danger` …)
- `size` — `sm` / `md` / `lg` (컴포넌트별 서브셋 허용, 이름은 통일)
- `disabled`, `loading` — 상태 boolean
- 콘텐츠는 `children` 우선, 보조 슬롯은 `leading` / `trailing`

**허용되는 유일한 분기: 이벤트 prop.** 웹은 `onClick`, RN 은 `onPress` 를
그대로 쓴다 — 플랫폼 관용구를 억지로 통일해서 두 쪽 다 어색해지는 것보다 낫다.
그 외 props 이름이 갈라지면 계약 위반이다.

### 4.2 상태

모든 인터랙티브 컴포넌트는 다음 상태를 전부 정의하고 문서화한다:

```text
default → hover (웹 전용) → pressed → focused (웹: focus-visible) → disabled → loading
```

상태별 색은 시맨틱 토큰의 `-hover` / `-pressed` 변형으로 정의한다. 투명도
조절로 때우는 것 (`opacity: 0.5`) 은 disabled 에만 허용.

### 4.3 컴포넌트 티어와 초기 인벤토리

| 티어 | 정의 | 예 |
| --- | --- | --- |
| **Core** | 모든 제품이 쓰는 원자 부품. 두 플랫폼 모두 구현 | Button, TextField, Checkbox, Switch, Badge, Spinner |
| **Composite** | Core 조합. 필요한 플랫폼부터 구현 | Dialog, BottomSheet, Toast, Tabs, ListRow, EmptyState |
| **Product-local** | 한 제품 전용. 시스템 밖, 제품 레포에 존재 | 채팅 말풍선, QR 카드 |

**승격 규칙.** Product-local 컴포넌트가 두 번째 제품에서 필요해지는 순간
시스템 승격 후보가 된다. 복붙이 두 번째로 일어나기 전에 승격한다.

**v1 목표 인벤토리 (Core + Composite 약 20개).**
Button, IconButton, TextField, Textarea, Select, Checkbox, Radio, Switch,
Badge, Chip, Avatar, Spinner, Skeleton, Divider, Card, ListRow, Tabs,
Dialog, BottomSheet (native) / Modal (web), Toast, Tooltip (web), EmptyState.

### 4.4 완성 조건 (Definition of Done)

컴포넌트는 다음을 갖춰야 시스템에 들어온다:

1. 두 플랫폼 구현 — 또는 한쪽만 있는 이유가 문서에 명시됨
2. 모든 상태·variant·size 의 스토리 (웹: Storybook, RN: 쇼케이스 앱)
3. 접근성 통과 (§6) — 라벨, 대비, 포커스, 터치 타깃
4. 사용 가이드 — do / don't 각 1개 이상

---

## 5. 크로스 플랫폼 규칙

**공유하는 것** — 토큰 값, 컴포넌트 이름, props 계약, 상태 정의, 문서, 행동
명세 ("Dialog 는 바깥 탭으로 닫힌다" 같은 규칙).

**플랫폼에 맡기는 것** — 구현 코드, 내비게이션 관용구 (웹 라우팅 vs 네이티브
스택), hover (웹 전용), 키보드 포커스 순회 (웹), 제스처·햅틱 (네이티브),
날짜/시간 피커 (네이티브는 OS 기본 우선).

**금지.** 웹 관용구를 네이티브에 이식하거나 (모바일에 hover 의존 UI), 네이티브
관용구를 웹에 강제하는 것 (데스크톱에 바텀시트). 같은 역할의 컴포넌트가
플랫폼별로 다른 형태를 가질 수 있다 — Modal (web) ↔ BottomSheet (native) 처럼
**역할 레벨에서 대응**시키고 문서에 매핑을 남긴다.

---

## 6. 접근성 — 최소 통과선

- 텍스트 대비 4.5:1 이상, 대형 텍스트·UI 요소 3:1 이상 (WCAG AA)
- 터치 타깃 44×44 (모바일) / 클릭 타깃 24×24 (웹) 이상
- 웹: 모든 인터랙티브 요소 키보드 도달 가능, `focus-visible` 링 표시
  (`color.border.focus`, 2px, offset 2px)
- 아이콘 단독 버튼은 `aria-label` (웹) / `accessibilityLabel` (RN) 필수
- 색만으로 상태를 전달하지 않는다 (아이콘·텍스트 병행)
- 모션 감소 설정 존중 (§3.6)

---

## 7. 거버넌스

- **버저닝.** `dds-tokens` / `dds-web` / `dds-native` 는 같은 버전 트레인으로
  릴리스한다 (lockstep semver). 토큰 이름 변경·삭제 = breaking = major.
- **변경 절차.** 제안 (이 문서 스타일의 짧은 RFC) → 리뷰 → 구현 + 스토리 +
  문서 → 릴리스. 파운데이션 (§3) 변경은 전 제품 영향이므로 결정 로그
  (decisions.md 형식) 에 기록한다.
- **Deprecation.** 최소 한 개 minor 버전 동안 경고 유지 후 다음 major 에서 제거.
- **문서가 곧 계약이다.** 문서에 없는 동작은 의존하면 안 되고, 문서와 구현이
  다르면 문서 기준으로 구현을 고친다.

---

## 8. 도입 경로

| 단계 | 내용 | 시점 |
| --- | --- | --- |
| **Phase 0** | 이 문서 확정 + `dds-tokens` JSON 작성 | 지금 |
| **Phase 1** | 토큰 빌드 파이프라인 (CSS 변수 + Tailwind 프리셋) + `dds-css` Core 6종 (Button, TextField, Badge, Spinner, Dialog, Toast) → AskLinq 위젯·SSR 페이지에 적용 | 웹 UI 작업 재개 시 |
| **Phase 2** | `dds-icons` + Composite 확충 + Storybook 공개 | Phase 1 안정화 후 |
| **Phase 3** | 모바일 착수와 동시 — **RN 이면** `dds-native` 구현, **Ionic 이면** `dds-tokens` 의 Ionic 매핑 + `dds-css` 재사용 (신규 패키지 불필요) | 모바일 착수 시 |

Phase 3 이전에 모바일 패키지를 만들지 않는다 — 소비자 없는 플랫폼 구현은
썩는다. RN vs Ionic 선택은 모바일 착수 시점의 제품 요구 (네이티브 성능·제스처
필요 여부 vs 웹 코드 재사용) 로 결정하고 decisions.md 에 기록한다. 어느 쪽이든
토큰과 API 계약 (§3, §4) 은 그대로이므로 Phase 3 는 구현 작업이지 재설계가
아니다.

---

## 참고

- [TDS React Native 문서](https://tossmini-docs.toss.im/tds-react-native/) — 구조 참조 모델
- [토스 디자인 시스템 소개 (앱인토스)](https://developers-apps-in-toss.toss.im/design/components.html)
- [디자인 시스템 다시 생각해보기 — Toss Tech](https://toss.tech/article/rethinking-design-system)
- [W3C Design Tokens Format](https://design-tokens.github.io/community-group/format/)
- [Pretendard](https://github.com/orioncactus/pretendard)
