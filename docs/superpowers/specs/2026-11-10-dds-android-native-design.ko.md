# DDS 안드로이드 네이티브 디자인 시스템 — 설계

상태: **소유자 검토 대기** (2026-11-10). 승인 전에는 구현하지 않는다.

## 1. 왜 만드는가

안드로이드 네이티브 앱들이 DDS 패키지를 쓰지 않고 값을 손으로 옮겨 적었다.
그 결과 같은 회사 앱인데 화면마다 값이 다르다.

| 앱 | 스택 | DDS 값을 가져오는 방법 | 드러난 문제 |
| --- | --- | --- | --- |
| 정산나우 | Kotlin · Compose · Material3 | `JnTheme.kt`에 hex를 손으로 적음 | 하늘색이 셋(로고 `#0891B2`, 버튼 `#0E7490`, 정의만 된 `#06B6D4`), 어두운 화면 주 버튼이 `#67E8F9` 통면, 버튼 높이 48·52 혼용, 안내와 오류가 같은 아이콘 |
| Qooroo | Kotlin · Compose · Material3 | `DESIGN.md` → `Tokens.kt`로 손으로 옮김 | 이징 상수가 두 파일에 중복, 누름 반응 값이 세 파일에 중복, 다이얼로그·시트 모션은 문서에만 있음 |
| EDS 치과(dental-native) | Kotlin Multiplatform · Compose | `Theme.kt`에 hex를 손으로 적음 | 글자 스타일이 Material3 기본값 그대로 |

정산나우의 화면 코드는 hex를 직접 쓰지 않는다. 전부 `MaterialTheme.colorScheme.*`를
읽는다. 색이 갈린 원인은 **DDS 토큰을 Material3 역할에 대응시키는 표가 없어서**
각자 대응시킨 데 있다. 이 설계의 핵심 산출물은 그 대응표다.

목표는 세 가지다.

1. 값을 손으로 옮기지 않는다. `tokens/*.json`에서 안드로이드용 값을 생성한다.
2. 생성물이 원본과 어긋나면 검사가 실패한다.
3. 다른 안드로이드 앱이 의존성 한 줄로 받아 쓴다.

iOS는 범위 밖이다.

## 2. 근거 — 세 앱에서 읽은 것

조사 대상: 정산나우(`virtus-settlement` 작업 폴더), Qooroo(`apps/android`,
`feat/android-foundation`), EDS 모바일(Ionic)과 같은 저장소의 `dental-native`.

### 2.1 세 앱이 같은 것 → 그대로 올린다

| 항목 | 값 | 근거 |
| --- | --- | --- |
| 모션 시간 | 100 / 150 / 200 / 300ms | 정산나우 `JnMotion.kt`, Qooroo `DESIGN.md` §7.1. DDS에는 100·200·300이 이미 있다 |
| 화면 안 변화 이징 | `(0.2, 0, 0, 1)` | 정산나우 Enter, Qooroo Standard, DDS `motion.easing.standard` |
| 되튐·탄성 금지 | — | 정산나우 모션 문서, Qooroo `DESIGN.md` |
| 움직임 줄이기 판정 | 시스템 애니메이터 배율이 0 | 두 앱이 같은 판정식을 따로 구현 |
| 스플래시 → 첫 화면 | 시스템 스플래시의 로고를 같은 자리·크기로 이어받아 300ms에 제자리로 이동, 처음 켤 때만 재생, 붙잡는 시간에 상한 | 두 앱이 같은 구조를 따로 구현 |
| 간격 | 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 | Qooroo와 EDS가 완전히 같고 DDS 스케일의 부분집합 |
| 최소 터치 크기 | 48dp | 정산나우, Qooroo, dental-native 문서 |
| 그림자 | 거의 쓰지 않고 경계선이나 면 색으로 구분 | 정산나우(그림자 1곳), Qooroo(1곳) |
| 색만으로 상태를 전하지 않음 | 글자·아이콘 병행 | 세 앱 문서 모두 |
| 빌드 도구 | Kotlin 2.2.20, Gradle 8.14.3, compileSdk 36, JVM 17 | 정산나우·Qooroo·dental-native 동일 |

### 2.2 한 앱에만 있는 좋은 것 → 근거를 적고 올린다

| 항목 | 출처 | 올리는 이유 |
| --- | --- | --- |
| 화면 전환은 내용 영역만 24dp 밀고, 상단 바·탭은 고정 | 정산나우 | 화면 전체를 흐리게 나타내면 깜빡임으로 읽힌다는 실측 교훈(`android-navigation.md`). Qooroo의 전체 화면 fade 200/150이 바로 그 방식이다 |
| 목록 순차 등장 30ms × 앞 6개 | 정산나우 | 긴 목록이 줄줄이 흘러내리지 않게 하는 상한이 있다. EDS 웹도 30ms 간격 |
| 로고 이동용 곡선 `(0.4, 0, 0.2, 1)` | 정산나우 Travel, Qooroo 스플래시 | 멈춰 있던 것이 튀어 보이지 않게 천천히 출발. 두 앱이 같은 숫자에 따로 도달 |
| 당겨서 새로고침은 실제 작업이 끝날 때까지 표시 | 정산나우 `JnPullRefresh` | EDS는 500ms 고정 대기라 작업과 표시가 어긋난다 |
| 진행 표시줄은 내용 위에 겹쳐 그림 | 정산나우 | 작업 시작·끝에 내용이 밀려 내려가지 않는다 |
| 첫 불러오기는 움직이지 않는 자리 표시 | 정산나우, Qooroo | "자료가 없습니다"가 답보다 먼저 보이지 않게 |
| 포커스는 채움이 아니라 2dp 링 | Qooroo | Material3 포커스 채움은 비활성처럼 보인다. DDS D-047과 같은 방향 |
| 입력칸 라벨은 칸 위, 도움말·오류 자리는 항상 확보 | Qooroo | 오류가 뜰 때 화면이 밀리지 않는다 |
| 한글 줄바꿈은 띄어쓰기에서만 | Qooroo | DDS 웹의 `keep-all` 규칙(D-030)과 같은 결과 |
| 큰 글자 모드(글자 단계와 터치 크기를 함께 키움) | 정산나우 시니어 모드 | 시스템 글자 배율과 별개로 앱이 제공하는 선택지. 값을 표로 정해 둘 가치가 있다 |

### 2.3 서로 어긋나는 것 → 하나로 정한다

원칙: **웹 DDS에 값이 있으면 DDS가 이긴다.** DDS에 없는 값만 앱들 사이에서 고른다.

| 항목 | 정산나우 | Qooroo | EDS | 결정 | 이유 |
| --- | --- | --- | --- | --- | --- |
| 둥글기 | 8 / 12 / 16 | 12 / 16 / 28 | 8 / 12 / 16 / 20 | **4 / 8 / 12 / 16** (버튼·입력 8, 카드 12, 시트·다이얼로그 16) | DDS `radius.*`. 정산나우 값과 같다 |
| 버튼 높이 | 48·52 혼용 | 48 하나 | 48·52·56 | **48 하나.** 화면 맨 아래 주 버튼만 `lg` 56 | 혼용이 소유자가 지적한 문제다. 규칙을 "크기 이름"으로 고정한다 |
| 입력칸 높이 | 56 | 56 | 52 | **56** | 두 네이티브 앱과 Material3 기본이 같다 |
| 어두운 바탕 | `#121214` / 카드 `#1C1C20` | `#0a0a0a` / `#141414` | 슬레이트 | **`zinc.950` / `zinc.900`** | DDS `bg.default` / `bg.elevated` |
| 어두운 화면 주 버튼 | `#67E8F9` 통면 | 밝은 회색 | — | **밝은 화면과 같은 `bg.brand`** | DDS는 어두운 테마에서도 브랜드 면을 바꾸지 않는다. 소유자가 지적한 과다 밝기가 사라진다 |
| 글자 굵기 상한 | 600 | 600 | 700 | **700** (`display`, `title-1`만) | DDS 글자 표 |
| 글자 크기 단계 | Material3 기본 15종 | 7종 | 9종 | **DDS 8종** | DDS `typo.*` |
| 카드 경계 | 면 색 차이만 | 1dp 선 | 선 + 그림자 | **1dp `border.default` 선, 그림자 없음** | 웹 카드의 선은 그대로, 그림자만 뺀다(§5.6) |
| 화면 전환 | 내용만 밀기 | 전체 fade | Ionic 기본 | **내용만 밀기** | §2.2 |
| 사라질 때 이징 | `(0.3, 0, 1, 1)` | `(0.3, 0, 0.8, 0.15)` | — | **`(0.3, 0, 1, 1)`** | DDS `motion.easing.exit` |
| 상단 바 높이 | 64 | 64 | 56 | **64** | Material3 기본, 두 네이티브 앱 |

### 2.4 앱 고유라서 넣지 않는 것

로고 모양과 색, 앱 이름, 모든 문구(접근성 문구 포함), 탭 구성, 계약 상태 같은
업무 상태 이름, Qooroo 카드 스택과 그 스프링 값, EDS 가운데 버튼 dock.
시스템은 이것들을 **받는 자리**만 만든다.

## 3. 구조

```text
tokens/*.json  ──(생성 스크립트)──▶  android/dds-tokens   값만. Compose 의존 없음
     ▲                                     ▲
     │ 원본은 하나                          │ 의존
tokens/native.json (신규, 네이티브 전용 값)  android/dds-compose  테마 · 모션 · 부품
                                           ▲
                                     android/catalog      부품을 전부 띄우는 확인용 앱 (배포 안 함)
```

- **위치는 저장소 최상위 `android/`.** `packages/` 아래에 두면 pnpm 워크스페이스와
  changesets가 npm 패키지로 다루려 한다.
- **모듈을 둘로 나눈다.** 스플래시 테마는 Compose가 뜨기 전에 XML에서 그려진다.
  값만 든 모듈이 따로 있어야 스플래시가 같은 색을 쓴다.
- **`catalog` 앱.** 스펙 §4.4가 요구하는 "쇼케이스 앱"이다. 밝은·어두운·큰 글자·
  애니메이션 없애기에서 부품을 캡처하는 대상이다.

빌드 도구는 소비자 앱과 맞춘다: Kotlin 2.2.20, AGP 8.13.0, Gradle 8.14.3,
compileSdk 36, JVM 17, Compose BOM 2026.01.00.

## 4. 값 — 토큰 생성

### 4.1 생성 스크립트

`scripts/generate-android-tokens.mjs`. 기존 토큰 빌드(`packages/dds-tokens/build.mjs`)의
참조 해석기를 공용 모듈로 빼서 함께 쓴다. 해석 규칙이 두 벌이 되면 웹과 안드로이드가
다른 값을 낼 수 있기 때문이다.

생성물은 저장소에 **커밋한다**(Gradle 빌드가 Node 없이 돌도록).

| 생성물 | 내용 |
| --- | --- |
| `DdsPalette.kt` | 원시 팔레트. `internal` — 앱은 못 읽는다 |
| `DdsColorTokens.kt` | 시맨틱 색의 밝은·어두운 값(`Long` ARGB) |
| `DdsDimens.kt` | 간격, 둥글기, 경계 두께, 컨트롤 높이(dp 숫자) |
| `DdsTypeTokens.kt` | 글자 8종의 크기·줄높이·굵기(sp 숫자) |
| `DdsMotionTokens.kt` | 시간(ms), 이징 네 점, 순차 간격, 밀기 거리 |
| `DdsTokensInfo.kt` | 뽑아낸 `@devslab/dds-tokens` 버전과 원본 해시 |
| `res/values/dds_tokens.xml`, `res/values-night/dds_tokens.xml` | 같은 색·치수의 XML 리소스. 스플래시·창 배경·시스템 바용 |

알 수 없는 `$type`은 건너뛰지 않고 빌드를 실패시킨다(기존 토큰 빌드와 같은 규칙).

### 4.2 어긋남 검사

`tests/android-tokens.test.mjs`가 원본에서 다시 생성한 결과와 커밋된 파일을 글자
단위로 비교한다. `pnpm run check`에 넣는다. 토큰을 바꾼 변경이 안드로이드 생성물을
함께 갱신하지 않으면 CI가 실패한다.

추가로 `android/` 소스에 hex 색 리터럴과 `Color(0x…)`가 생성 폴더 밖에 있으면
실패하는 검사를 둔다(`dds-css`의 `check-css.mjs`와 같은 역할).

### 4.3 네이티브 전용 값 — `tokens/native.json` (신규)

웹에 없는 값은 새 원본 파일에 둔다. 웹 산출물은 이 파일을 읽지 않으므로 웹에는
아무 변화가 없다.

| 토큰 | 값 | 근거 |
| --- | --- | --- |
| `native.motion.duration.short` | 150ms | §2.1 |
| `native.motion.easing.travel` | `(0.4, 0, 0.2, 1)` | §2.2 |
| `native.motion.stagger.step` / `.limit` | 30ms / 6 | §2.2 |
| `native.motion.shift` | 24 | §2.2 |
| `native.touch.min` | 48 | §2.1 |
| `native.control.sm` / `.md` / `.lg` | 40 / 48 / 56 | §2.3. `sm`은 보이는 높이 40, 터치 영역은 48 |
| `native.field.height` | 56 | §2.3 |
| `native.row.min` / `.two-line` | 56 / 72 | Qooroo 56 이상, 정산나우 메뉴 행 60·72 |
| `native.bar.top` / `.bottom` | 64 / 80 | Material3 기본 |
| `native.icon.sm` / `.md` | 20 / 24 | DDS 아이콘 24 그리드 |
| `native.border.hairline` / `.focus` | 1 / 2 | DDS `space.2` 링 두께 |
| `native.large-text.*` | 큰 글자 모드의 글자 표와 터치 56 | 정산나우 시니어 모드 값 |

### 4.4 아이콘

`packages/dds-icons/svg/*.svg`(코어 40종, 전부 24 그리드 선 아이콘)에서 Compose
`ImageVector`를 생성한다. 선 두께 1.6, 둥근 끝은 원본 그대로다. 정산나우는
Material 아이콘 묶음을, Qooroo는 손으로 그린 벡터를 쓰고 있어 같은 뜻의 아이콘이
앱마다 다르게 생겼다.

안내·성공·경고·오류 네 가지에 서로 다른 아이콘을 고정한다(§6.3).

## 5. 규칙 — 가이드에 적을 내용

가이드는 `docs/mobile-native.md` + `docs/mobile-native.ko.md`로 쓴다. 아래는 그 요지다.

### 5.1 색 — DDS 시맨틱 토큰 → Material3 역할

Material3의 `primary`는 **채움 면**과 **글자·아이콘 색**을 겸한다. DDS는 이 둘을
`bg.brand`와 `text.brand`로 나눈다. cyan.500을 `primary`에 넣으면 흰 바탕 위 글자
버튼·선택된 탭이 대비 미달이 되고, cyan.700을 넣으면 주 버튼이 DDS와 다른 색이 된다.
정산나우가 후자를 택해서 하늘색이 갈렸다.

결정: **`primary`에는 `text.brand`를 넣고, 채움 면은 DDS 부품이 `bg.brand`를 직접 쓴다.**
Material3 부품을 그대로 써도 대비가 통과하고, DDS 부품은 웹과 같은 브랜드 면이 된다.

| Material3 역할 | DDS 토큰 | 밝은 | 어두운 |
| --- | --- | --- | --- |
| `primary` | `text.brand` | cyan.700 | cyan.400 |
| `onPrimary` | (대비 규칙으로 고름) | white | zinc.950 |
| `primaryContainer` / `onPrimaryContainer` | `bg.brand-subtle` / `text.brand` | cyan.50 / cyan.700 | cyan.900 / cyan.400 |
| `background`, `surface` | `bg.default` | white | zinc.950 |
| `surfaceContainer*` | `bg.elevated`, `bg.subtle` | white, zinc.50 | zinc.900 |
| `onSurface`, `onBackground` | `text.primary` | zinc.950 | zinc.50 |
| `onSurfaceVariant` | `text.secondary` | zinc.600 | zinc.400 |
| `outline` | `border.strong` | zinc.300 | zinc.700 |
| `outlineVariant` | `border.default` | zinc.200 | zinc.800 |
| `error` / `onError` | `status.danger` / `text.on-status` | red.700 / white | red.400 / zinc.950 |
| `errorContainer` / `onErrorContainer` | `status.danger-bg` / `status.danger` | red.50 / red.700 | red.900 / red.400 |
| `inverseSurface` / `inverseOnSurface` | `bg.inverse` / `text.on-inverse` | zinc.900 / zinc.50 | zinc.50 / zinc.950 |
| `scrim` | `overlay.dim` | 검정 25% | 검정 25% |
| `surfaceTint` | 투명 | — | — |

Material3에 없는 DDS 색(브랜드 면, 상태색 네 쌍, 누름 틴트, 포커스 링)은
`DdsTheme.colors`로 읽는다.

**브랜드는 주입받는다.** 웹의 `data-brand` 규약(D-012)과 같은 여섯 토큰만 앱이
바꿀 수 있다: `bg.brand`, `bg.brand-hover`(안드로이드에서는 누름 색), `bg.brand-subtle`,
`text.on-brand`, `text.brand`, `border.focus`. 기본값은 DDS cyan이다. 채움 면 위
글자 대비가 4.5:1 미만이면 디버그 빌드에서 예외를 던진다. Qooroo(먹색 + 주황)와
dental-native(빨강)는 자기 여섯 값을 넘기고 나머지는 시스템 것을 쓴다.

로고 색은 앱 자산이다. 다만 가이드에 "로고에 브랜드 색을 쓸 때는 `bg.brand`를 쓴다"고
적는다. 정산나우 로고 `#0891B2`(cyan.600)는 어느 시맨틱 토큰과도 맞지 않는다.

### 5.2 글자

- DDS 8종을 Material3 15칸에 대응시킨다. 여러 칸이 같은 스타일을 가리킨다.
- 단위는 sp. 시스템 글자 배율을 그대로 따른다.
- **글꼴은 Pretendard 하나**(400·500·600·700 정적 파일). 웹과 다른 점이다.
  웹은 라틴에 Geist, 한글에 Pretendard를 글자 단위로 고르지만, Compose의 글꼴
  고르기는 굵기 기준이라 두 글꼴을 한 묶음에 넣으면 첫 글꼴만 쓰인다(정산나우에서
  Geist가 쓰이지 않는 이유). 코드·숫자 라벨용으로 Geist Mono만 따로 둔다.
- 금액·건수는 고정폭 숫자(`tnum`)를 켠다.
- 한글은 띄어쓰기에서만 줄을 바꾼다(도우미 제공).

### 5.3 둥글기·간격·높이

§2.3 표대로. 화면 좌우 여백은 폭 600dp 미만 16, 이상 24. 블록 사이 24.
컨트롤 높이는 **최소 높이**다. 글자가 커지면 컨트롤이 커진다(잘리지 않는다).

### 5.4 상태색

DDS 네 쌍(성공·경고·위험·정보)을 진한 전경 + 옅은 배경으로만 쓴다. 상태는 색과
함께 아이콘이나 글자로 전한다. 업무 상태 이름(계약 "서명 대기" 등)은 앱이 넘긴다.

### 5.5 모션

| 이름 | 값 | 쓰임 |
| --- | --- | --- |
| fast | 100ms | 사라짐, 누름 반응 |
| short | 150ms | 탭 바꾸기, 목록 항목 등장, 진행 표시 |
| base | 200ms | 뒤로 가기, 접기·펼치기, 다이얼로그 |
| slow | 300ms | 새 화면, 시트, 로고 이동 |

- 나타날 때 `standard`, 사라질 때 `exit`, 로고처럼 멈춰 있던 것이 움직일 때 `travel`.
- 되튐·탄성 없음. 눌러도 크기와 자리는 바뀌지 않는다.
- **화면 전환:** 내용 영역만 움직인다. 앞으로 가면 오른쪽 24dp에서 300ms, 뒤로
  가면 왼쪽 24dp에서 200ms, 탭을 바꾸면 150ms로 나타나기만 한다. 상단 바와 아래
  탭은 고정이다. 이전 화면은 즉시 걷는다.
- **목록:** 항목당 30ms 늦추고 앞 6개까지만.
- **스플래시 → 첫 화면:** 시스템 스플래시와 같은 자리·크기·색으로 로고를 그려 두고
  도착 자리로 300ms `travel` 이동. 처음 켤 때만. 붙잡는 시간은 첫 프레임부터 재고
  상한을 둔다. 도착 자리가 없으면 150ms로 사라진다. 로고는 앱이 넘긴다.
- **당겨서 새로고침:** 실제 작업이 끝날 때까지 표시한다. 작업 중에는 다시 당겨지지 않는다.
- **움직임 줄이기:** 시스템 애니메이터 배율이 0이면 이동·순차 등장을 건너뛰고
  상태 전달에 필요한 변화는 즉시 끝낸다. 스플래시도 붙잡지 않는다.

### 5.6 웹 DDS와 다른 점

| 항목 | 웹 | 안드로이드 | 이유 |
| --- | --- | --- | --- |
| 터치 크기 | 44(모바일) | 48 | 안드로이드 접근성 기준과 Material3 기본이 48. 44를 넘으므로 DDS 최소선도 지킨다 |
| hover | 있음 | 없음. `brand-hover`는 누름 색으로 | 터치 화면 |
| 누름 반응 | 색 변화 | 물결(ripple), 틴트는 `overlay.pressed-tint` | 플랫폼 관례 |
| 카드 그림자 | `elevation.1` | 없음, 선만 | 안드로이드 2dp 그림자는 밝은 화면에서 번져 보이고 어두운 화면에서는 안 보인다. 세 앱 모두 쓰지 않는다. 시트·다이얼로그·메뉴는 Material3 그림자를 둔다 |
| 글꼴 | Geist + Pretendard | Pretendard | §5.2 |
| 모달 | Dialog | 선택·작업 메뉴는 아래 시트, 확인은 Dialog | 스펙 §5의 역할 대응 |
| 시스템 바 | — | 화면 끝까지 그리고 상태 바·내비게이션 바는 투명, 아이콘 밝기는 테마를 따름 | 플랫폼 관례. 정산나우 어두운 테마의 바 색(`#09090B`)과 바탕(`#121214`) 불일치가 사라진다 |
| 뒤로 가기 | 브라우저 | 시스템 뒤로(예측형 포함) | 플랫폼 관례 |
| 포커스 링 | 키보드 `focus-visible` | 키보드·D패드 포커스에만 2dp 링 | 터치에는 포커스가 없다 |

### 5.7 접근성

터치 48dp, 글자 대비 4.5:1, 큰 글자(시스템 배율 200%)에서 잘림 없음, 아이콘만
있는 버튼은 설명 문구가 필수 매개변수, 색만으로 상태를 전하지 않음, 움직임 줄이기 존중.

## 6. 부품 — Compose

Material3 위에 얹는다. 색·치수·시간은 §4의 생성물만 읽는다. 문구는 전부 매개변수다.

### 6.1 이름과 계약

스펙 §4.1대로 웹과 같은 이름, 같은 `variant` / `size` / `enabled` / `loading`,
`leading` / `trailing` 자리. 이벤트는 `onClick`.

| 부품 | 요지 |
| --- | --- |
| `DdsTheme` | 밝은·어두운, 브랜드 여섯 값, 큰 글자 여부를 받는다 |
| `DdsButton` | primary · secondary · ghost · danger × sm · md · lg. `loading`은 크기를 바꾸지 않고 진행 표시만 겹친다(D-043) |
| `DdsIconButton` | 48dp, 설명 문구 필수 |
| `DdsTextField` | 라벨은 칸 위, 도움말·오류 자리 확보, 56dp |
| `DdsCheckbox` · `DdsRadio` · `DdsSwitch` · `DdsChoiceRow` | 행 전체가 터치 영역 |
| `DdsCard` · `DdsSection` | 12dp, 1dp 선. 섹션은 제목 + 카드 |
| `DdsListRow` · `DdsDivider` | 최소 56dp, 앞·뒤 자리 |
| `DdsNotice` · `DdsFieldMessage` | 안내·성공·경고·오류. 종류마다 아이콘이 다르다 |
| `DdsBadge` | 상태 네 가지 + 중립. 문구는 앱이 넘긴다 |
| `DdsTopBar` · `DdsBottomBar` · `DdsNavRail` · `DdsScaffold` | 폭 600dp 미만은 아래 탭, 이상은 레일 |
| `DdsProgressBar` · `DdsSpinner` · `DdsSkeleton` | 진행 표시줄은 겹쳐 그림. 자리 표시는 움직이지 않음 |
| `DdsPullRefresh` | §5.5 |
| `DdsEmptyState` · `DdsDialog` | 빈 상태는 제목 + 한 문장 + 버튼 하나 |
| 모션 도우미 | `Modifier.ddsScreenContent()`, `Modifier.ddsAppear(index)`, `DdsSplashHandoff`, `rememberReducedMotion()` |

### 6.2 아래 탭의 선택 표시

소유자가 지적한 "선택 표시가 약함"에 대한 결정: 선택된 탭은 **아이콘 뒤 알약 모양
`bg.brand-subtle` 면 + `text.brand` 색 + 라벨 굵기 600** 세 가지가 함께 바뀐다.
색 하나만 바뀌는 선택 표시는 쓰지 않는다.

### 6.3 안내와 오류의 아이콘

| 종류 | 아이콘 | 색 |
| --- | --- | --- |
| 안내 | `info` | `status.info` 쌍 |
| 성공 | `check` | `status.success` 쌍 |
| 경고 | `alert` | `status.warning` 쌍 |
| 오류 | `close` (원 안) | `status.danger` 쌍 |

오류 아이콘은 `dds-icons`에 원 안 X가 없어 새로 그려야 한다. 아이콘 추가는
웹 패키지에도 나가므로 changeset이 필요하다.

### 6.4 확인 방법

- `catalog` 앱에 부품 전부를 상태별로 늘어놓는다.
- 밝은·어두운 × 기본 글자·시스템 200% × 애니메이션 켬·끔으로 에뮬레이터에서 띄워
  캡처를 직접 본다. 확인 항목: 같은 줄 컨트롤의 위아래 모서리 일치, 같은 열의
  좌우 모서리 일치, 글자 잘림 없음, 버튼 높이 일치, 터치 영역 48dp.
- 전용 에뮬레이터를 새로 만들어 `-gpu host`로 띄운다. 기존 `emulator-5554`,
  `emulator-5570`과 연결된 실제 기기는 건드리지 않는다. 모든 명령에 기기 일련번호를 지정한다.
- 단위 테스트: 색 대응표가 생성 값과 같은지, 브랜드 대비 검사, 모션 도우미의
  움직임 줄이기 분기, 당겨서 새로고침의 표시 종료 조건.

## 7. 배포

정산나우 세션과 맞춘 안이다(소유자 결정 대기).

| 항목 | 안 |
| --- | --- |
| 배포처 | Maven Central, 그룹 `kr.devslab` |
| 좌표 | `kr.devslab:dds-android-tokens`, `kr.devslab:dds-compose` |
| Kotlin 패키지 | `kr.devslab.dds.tokens`, `kr.devslab.dds.compose` |
| 버전 | 웹 트레인과 따로. 0.1.0에서 시작, 두 좌표는 항상 같은 버전 |
| 내보내기 | `android-v*` 태그 → 전용 워크플로. 기존 changesets 흐름과 겹치지 않는다 |
| 원본 기록 | `DdsTokensInfo`와 POM 설명에 뽑아낸 `@devslab/dds-tokens` 버전과 원본 해시 |
| 도구 | 기존 Java 라이브러리와 같은 `com.vanniktech.maven.publish`, 같은 시크릿 이름 다섯 개 |
| 라이선스 | DevsLab Source-Available License 1.0을 POM에 그대로 적는다 |
| CI | `android/`나 `tokens/`가 바뀐 PR에서 Gradle 빌드·단위 테스트·lint |

확인하지 못한 것: 조직 시크릿 목록을 읽을 권한이 없어, Maven 서명 키와 계정
시크릿이 이 저장소에 열려 있는지 모른다. 이 저장소의 저장소 단위 시크릿은 비어 있다.
첫 배포 전에 소유자가 조직 시크릿의 저장소 범위를 확인해야 한다.

웹 트레인과 버전을 따로 가는 것은 스펙 §7의 "같은 버전 트레인"과 다르다. 웹은
0.32.x이고 거의 매일 오르는데 대부분 안드로이드와 무관하다. 묶으면 내용 없는
안드로이드 배포가 계속 생긴다. 결정 기록에 예외로 남긴다.

## 8. 저장소 문서에 생기는 변화

- `docs/decisions.md` **D-048**: 안드로이드는 Kotlin·Compose 네이티브로 간다(스펙 §8과
  백로그 10번의 "RN 또는 Ionic"에 없던 세 번째 길), Material3 대응표, `tokens/native.json`,
  독립 버전.
- `docs/design-system(.ko).md`: §2 패키지 표, §3.2 글꼴 노트, §5·§7·§8.
- `docs/backlog.md`: 10번 갱신, 새 항목 추가.
- `docs/mobile-native(.ko).md`: 가이드 신설.
- `README(.ko).md`: 안드로이드 좌표와 사용법.

## 9. 정산나우가 옮기는 순서

1. 의존성 두 줄 추가.
2. `JnTheme`의 색·글자·둥글기를 `DdsTheme`으로 교체. 정산나우 브랜드 여섯 값이
   DDS 기본(cyan)과 같으면 아무것도 넘기지 않는다.
3. `res/values*/colors.xml`, `styles.xml`의 hex를 `@color/dds_*`로 교체(스플래시·창 배경).
4. `JnMotion` 상수와 `jnScreenContent`·`jnAppear`·`JnSplashHandoff`를 DDS 도우미로 교체.
   로고 그리기(`JnMark`)는 앱에 남는다.
5. 부품을 화면 단위로 교체: `JnButton` → `DdsButton`(높이 숫자 삭제),
   `JnNotice` → `DdsNotice`, `JnSection` → `DdsSection`, `JnMenuRow` → `DdsListRow`,
   `JnLoadingRows` → `DdsSkeleton`, `JnPullRefresh` → `DdsPullRefresh`.
   `EditorSection`·`EditorError`·`PaperNotice` 같은 화면 안 중복 부품도 같이 없앤다.
6. 앱에 "hex와 높이 숫자를 직접 쓰지 않는다" 검사를 추가.

눈에 보이게 달라지는 것(미리 알림): 밝은 화면 주 버튼이 cyan.700 + 흰 글자에서
cyan.500 + 검은 글자로, 어두운 화면 바탕이 조금 더 어두워지고, 버튼 높이가 48로 통일된다.

## 10. 소유자 결정이 필요한 것

| # | 결정 | 추천 |
| --- | --- | --- |
| 1 | 이름과 좌표 | `kr.devslab:dds-android-tokens` + `kr.devslab:dds-compose` |
| 2 | 배포처 | Maven Central (§7) |
| 3 | 1차 범위 | 값 + 테마 + 모션 도우미 + 가이드를 0.1.0으로 먼저, 부품은 0.2.0. 정산나우가 색·모션부터 붙여 보는 동안 부품을 만든다 |
| 4 | 최소 안드로이드 버전 | API 26. 정산나우·Qooroo는 28, dental-native가 26이라 낮은 쪽에 맞춘다. 26~30에서는 스플래시가 움직이지 않는 로고로 보인다(두 앱이 이미 그렇게 처리) |
| 5 | 주 버튼 색 | DDS 규칙대로 cyan.500 + 검은 글자. 정산나우의 지금 모습(cyan.700 + 흰 글자)과 다르다 |

## 11. 하지 않는 것

iOS, React Native·Ionic 패키지, Kotlin Multiplatform 대응(dental-native가 쓰려면
`dds-compose`를 멀티플랫폼으로 바꿔야 한다 — 값 모듈은 순수 Kotlin 상수라 지금도
옮기기 쉽게 만든다), 날짜·시간 고르기(OS 기본 사용), 표, 앱 화면 구성.
