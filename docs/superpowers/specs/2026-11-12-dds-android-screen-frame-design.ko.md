# DDS 안드로이드 화면 틀 — 설계

상태: **설계 승인, 문서 검토 대기** (2026-11-12). 소유자가 대화에서 세 구간을 차례로 확인했다.
구현 전이다. 결정 기록은 `docs/decisions.md` D-052. 대상 버전은 안드로이드 0.7.0.

## 1. 왜 만드는가

정산나우에서 소유자가 펼친 폰으로 직접 찾아낸 문제다(요청서: 공유 노트
`dds-android-frame-request-2026-11-11.md`).

- 화면마다 본문 시작선이 달랐다. 펼친 가로(933×704dp)에서 잰 값이 187, 147, 127, 그리고 왼쪽 끝부터
  오른쪽 끝까지인 화면도 있었다.
- 왼쪽 레일이 탭 화면에만 있고, 다른 화면을 열면 사라졌다.
- 상단 줄(뒤로·제목·새로고침)은 화면 왼쪽 끝에서, 본문은 가운데에서 시작해 서로 다른 선에 있었다.

원인은 하나다. **DDS에 숫자는 있는데 그 숫자를 지키게 하는 부품이 없다.** 그래서 화면마다 폭을 손으로
적었고 680, 720, 760으로 갈라졌다. 소유자의 말: "이런 기준들도 DDS에서 정의 못하는 거야? 시작선이라던가."

목표는 세 가지다.

1. 창 폭이 메뉴를 정한다. 화면은 폭을 재지 않는다.
2. 본문은 한 기둥에 서고, 상단 줄은 그 기둥의 선에 맞는다. 부품을 쓰면 저절로 그렇게 된다.
3. 앱이 자기 화면들이 이 규칙을 지키는지 검사할 수 있다.

## 2. 지금 있는 것

| | DDS 0.5.0 | 정산나우 | Qooroo |
| --- | --- | --- | --- |
| 창 폭 기준 | 600 하나 | 600, 840 | 600, 840 |
| 옆 여백 | 16(좁음) / 24(넓음) 값만 있음. `DdsTopBar`는 늘 16 | 20 | 16 / 24 |
| 메뉴 | `DdsScaffold`: 600 이상이면 레일을 상단 줄 **아래**에 그림 | 레일과 고정 목록을 화면 전환기 **바깥**에, 하단 탭은 탭 화면 안에 | 탭 없음. 840 이상에서 목록과 상세를 반반 |
| 본문 폭 | 없음 | 최대 680, 가운데 | 최대 600, 가운데 |
| 상단 줄 | 창 전체 폭 | 본문 기둥 폭, 그림을 본문 선에 맞춤, 두 줄 제목 | 자체 |
| 한 가지 일 화면 | 없음 | 가운데 묶음, 최대 400 | 로그인 열 자체 폭 |

정산나우의 구조는 실물 폰(SM-F971N)의 창 세 가지(접힌 475×751, 펼친 세로 704×933, 펼친 가로 933×704)에서
전체 연결 테스트로 확인됐다. 이 설계는 그 구조를 DDS 부품으로 옮긴다.

## 3. 소유자가 정한 것 (2026-11-12)

| 항목 | 결정 |
| --- | --- |
| 옆 여백 | 16(창 폭 600 미만) / 24(600 이상). 정산나우의 20은 이 값으로 옮긴다 |
| 만드는 방식 | DDS 틀 부품이 메뉴를 그린다. Material의 적응형 틀을 감싸는 안과 숫자만 주는 안은 버렸다(§12) |
| 중간 폭(600~839) | 레일만. 목록은 한 화면으로 열고 뒤로 돌아온다 |
| 숫자 | 본문 최대 680, 고정 목록 시작 840, 고정 목록 폭 264, 가운데 묶음 400. 정산나우 값 |
| 기존 `DdsScaffold` | 그대로 두고 새 틀을 더한다 |
| 검사 도우미 | 0.7.0에 새 꾸러미로 넣는다 |
| 배포 조건 | 정산나우가 로컬 빌드로 옮겨 실물 폰의 창 세 가지에서 확인한 뒤 Maven에 올린다 |

## 4. 숫자

`tokens/native.json`에 더하고 `DdsScreen`·`DdsBar`로 생성한다. 생성물과 가이드의 표는 기존 어긋남 검사가 지킨다.

| 토큰 | 코틀린 | 값 | 뜻 |
| --- | --- | --- | --- |
| `screen.breakpoint-expanded` | `DdsScreen.breakpointExpanded` | 840 | 고정 목록을 옆에 두기 시작하는 창 폭 |
| `screen.body-max` | `DdsScreen.bodyMax` | 680 | 본문 기둥의 최대 폭. 옆 여백을 포함한다 |
| `screen.list-pane` | `DdsScreen.listPane` | 264 | 고정 목록의 폭 |
| `screen.centered-max` | `DdsScreen.centeredMax` | 400 | 가운데 묶음의 최대 폭 |
| `bar.rail` | `DdsBar.rail` | 80 | 레일의 폭 |
| `bar.top-tall` | `DdsBar.topTall` | 104 | 두 줄 제목일 때 상단 줄 높이 |

기존 값은 그대로다: `gutter` 16, `gutterWide` 24, `breakpoint` 600, `blockGap` 24, `DdsBar.top` 64, `DdsBar.bottom` 80.

**창 폭 분류**

```kotlin
enum class DdsWindowWidth { Compact, Medium, Expanded }
fun ddsWindowWidth(width: Dp): DdsWindowWidth   // 600 미만 / 840 미만 / 그 이상
val DdsWindowWidth.gutter: Dp                    // Compact 16, 나머지 24
```

**옆 여백은 창 폭으로 정한다.** 화면에 남은 영역의 폭이 아니다. 고정 목록 옆의 화면은 588dp밖에 안 되지만
창이 넓으므로 24를 쓴다. 한 창 안에서 상단 줄, 본문, 고정 목록이 모두 같은 여백을 쓰게 하기 위해서다.

## 5. 화면 틀

### 5.1 누가 무엇을 그리는가

| | 누가 | 어디에 | 이유 |
| --- | --- | --- | --- |
| 레일 | 틀 | 화면 전환기 바깥 | 모든 화면에 있다. 화면이 바뀌어도 그대로 있어야 한다 |
| 고정 목록 | 틀(자리) + 앱(내용) | 화면 전환기 바깥 | 위와 같다. 스크롤 위치와 접근성 초점도 유지된다 |
| 하단 탭 | 최상위 화면 | 화면 전환기 안 | 상세 화면을 열 때 새 화면이 탭 줄까지 덮어야 한다. 틀이 그리면 탭 줄이 뚝 사라지고 내용이 튄다 |
| 상단 줄 | 각 화면 | 화면 전환기 안 | 화면마다 이름과 버튼이 다르다 |

레일은 틀이, 하단 탭은 화면이 그리는 비대칭이 핵심이다. 0.5.0의 규칙("화면이 바뀌는 동안 두 화면이 겹쳐
있다", D-051)과 맞물린다. 전환기 바깥에 있는 것은 전환의 영향을 받지 않는다.

### 5.2 `DdsAppFrame`

```kotlin
@Composable
fun DdsAppFrame(
    navItems: List<DdsNavItem>,
    selectedIndex: Int,
    onSelect: (Int) -> Unit,
    modifier: Modifier = Modifier,
    navigation: Boolean = true,
    barTitles: List<String> = emptyList(),
    barActions: Int = 2,
    barReserve: (title: String) -> Dp = { 0.dp },
    list: (@Composable () -> Unit)? = null,
    content: @Composable () -> Unit,
)
```

- `content`는 화면 전환기다(`NavDisplay` 또는 `DdsScreenHost`). 틀은 앱에 하나만 둔다.
- `navigation = false`이면 메뉴 없이 창 전체를 쓴다. 로그인 전, 그리고 작성·스캔처럼 한 가지 일만 하는
  화면에서 앱이 끈다.
- `list`는 지금 화면이 속한 영역에 목록이 있을 때만 넘긴다. 없으면 `null`.
- `barTitles`, `barActions`, `barReserve`는 두 줄 제목 판단에 쓴다(§7.3).

**창 폭별 동작**

| 창 폭 | 틀이 그리는 것 | 화면이 그리는 것 |
| --- | --- | --- |
| Compact | 없음 | 최상위 화면이 하단 탭 |
| Medium | 레일 | — |
| Expanded | 레일. `list`가 있으면 레일 옆에 목록(264 + 1dp 선) | — |
| `navigation = false` | 없음 | — |

`navItems`가 비어 있으면 레일과 하단 탭은 없다. 고정 목록은 탭이 없어도 둘 수 있다
(`navigation && Expanded && list != null`).

**틀이 화면에 알려 주는 값**

```kotlin
class DdsFrame(
    val width: DdsWindowWidth,
    val rail: Boolean = false,
    val listPinned: Boolean = false,
    val tallBar: Boolean = false,
)
val LocalDdsFrame: ProvidableCompositionLocal<DdsFrame?>   // 틀 밖에서는 null
@Composable fun ddsFrame(): DdsFrame                        // 틀 밖에서는 창 크기로 만든 값
```

화면은 스스로 폭을 재지 않고 `ddsFrame()`만 읽는다. 그래서 틀과 화면이 같은 메뉴를 둘 다 그리거나 둘 다
빼먹을 수 없다. 틀 밖(틀을 쓰지 않는 앱, 미리보기)에서는 창의 폭으로 `width`만 채우고 나머지는 `false`다.
탭 목록과 선택은 틀이 내부 값으로 내려보내고, 화면은 그것을 다시 받지 않는다.

**그 밖에 틀이 책임지는 것**

- 창 폭 분류가 바뀌어도(접기, 펴기, 돌리기) `content`의 상태는 유지된다. 레일과 목록이 나타나거나
  사라져도 전환기는 같은 자리에 있다.
- 가로로 눕혔을 때 카메라 구멍과 시스템 줄을 피한다. 레일이 시작 쪽을 맡고, 내용 영역이 끝 쪽을 맡는다.
  레일도 목록도 없으면 내용 영역이 양쪽을 맡는다. 위아래는 화면의 부품(`DdsTopBar`, `DdsScaffold`)이 맡는다.
- 오른쪽에서 왼쪽으로 쓰는 언어에서는 레일과 목록이 오른쪽에 온다.
- 바탕은 `bgDefault`다.

### 5.3 `DdsScaffold` — 화면 하나의 뼈대

새 형태를 더한다. 기존 형태(탭 목록을 직접 받는 것)는 그대로 동작한다.

```kotlin
@Composable
fun DdsScaffold(
    topBar: @Composable () -> Unit,
    modifier: Modifier = Modifier,
    bottomTabs: Boolean = false,
    content: @Composable (PaddingValues) -> Unit,
)
```

- `bottomTabs = true`는 최상위 화면이 쓴다. 틀이 Compact이고 메뉴가 켜져 있을 때만 하단 탭이 그려진다.
  탭 목록과 선택은 틀에서 온다.
- 틀 안에서는 이 형태를 쓴다. 기존 형태를 틀 안에 넣으면 레일이 둘이 된다.
- 고정 목록의 내용도 이 뼈대와 `DdsTopBar`로 짠다.

### 5.4 레일과 하단 탭

- 레일의 폭은 80으로 고정한다(`DdsBar.rail`).
- 라벨은 두 줄까지 쓴다. 지금은 한 줄에서 자른다. 큰 글자에서 "거래처 매출" 같은 라벨이 잘리지 않게
  하기 위해서이고, 항목과 하단 탭의 높이는 두 줄이 들어가도록 글자 크기에 따라 늘어난다(최소값은 그대로).
- 레일은 항목이 다 들어가지 않으면 위아래로 넘긴다.
- 선택 표시는 그대로다(옅은 브랜드 알약, 브랜드 색, 굵은 글자).

### 5.5 고정 목록

틀은 자리(폭 264, 끝 쪽 1dp 선)만 준다. 내용은 앱의 것이다.

- **같은 목록 하나에서 나온다.** 좁거나 중간 폭에서는 앱이 같은 목록을 한 화면으로 연다. 틀이 알려 주는
  `listPinned`를 보고 화면은 자기 쪽의 이동 버튼을 숨긴다.
- **이동 규칙(앱이 지킨다).** 고정 목록 옆에서 고르는 것은 지금 화면을 바꿔 끼운다. 뒤로 가기는 고른
  순서를 되밟지 않고 영역을 나간다. 목록이 한 화면일 때는 "목록 → 화면 → 뒤로"다.
- **목록 줄 부품을 더한다.** 지금은 정산나우가 손으로 그린다.

```kotlin
@Composable fun DdsPaneList(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit)
@Composable fun DdsPaneItem(label: String, selected: Boolean, onClick: () -> Unit,
                            modifier: Modifier = Modifier, enabled: Boolean = true)
```

`DdsPaneItem`의 선택 표시는 레일과 같다(옅은 브랜드 바탕, 브랜드 색, 굵은 글자. 색은 100ms에 걸쳐
바뀐다). 높이는 최소 48이고 큰 글자 모드에서는 56이다. `DdsPaneList`는 넘치면 스크롤되고, 줄의 글자가
목록의 옆 여백 선에 서도록 바깥 여백을 맞춘다. 화면 낭독기에는 "선택됨, 7개 중 2번째"로 읽힌다.

## 6. 본문 기둥

```kotlin
fun Modifier.ddsBody(max: Dp = DdsScreen.bodyMax.dp): Modifier
fun Modifier.ddsBodyLines(max: Dp = DdsScreen.bodyMax.dp): Modifier
@Composable
fun DdsBodyColumn(
    modifier: Modifier = Modifier,
    scroll: ScrollState = rememberScrollState(),
    max: Dp = DdsScreen.bodyMax.dp,
    spacing: Dp = DdsScreen.blockGap.dp,
    contentPadding: PaddingValues = DdsBodyDefaults.contentPadding(),
    content: @Composable ColumnScope.() -> Unit,
)
```

- **`DdsBodyColumn`** 은 상단 줄 아래 본문 전체다. 스크롤되는 한 단이고, 최대 폭으로 틀이 남긴 영역의
  가운데에 놓인다. 기본 여백은 네 방향 모두 창의 옆 여백 값(16 또는 24)이고 블록 사이는 24다. 화면이
  바뀔 때 밀리는 부분이 본문이므로 `ddsScreenContent()`를 스스로 붙인다(따로 붙이지 않는다).
- **`ddsBody()`** 는 본문을 직접 짜는 화면이 쓴다. 폭을 제한하고 검사용 표시를 단다. 가운데에 놓는 것과
  여백은 화면이 한다.
- **`ddsBodyLines()`** 는 본문은 아니지만 본문과 같은 선에 서야 하는 것에 쓴다(진행 표시줄, 단계 표시,
  아래쪽 버튼 줄). 폭을 제한하고 옆 여백을 준다. 검사용 표시는 달지 않는다.
- **규칙.** 화면마다 본문 기둥은 하나다. 문서 쪽이나 넓은 표처럼 680이 맞지 않는 화면은 `max`를 넘기고,
  상단 줄의 `columnMax`에도 같은 값을 넘긴다.

## 7. 상단 줄 (`DdsTopBar`)

```kotlin
@Composable
fun DdsTopBar(
    title: String,
    modifier: Modifier = Modifier,
    leading: (@Composable () -> Unit)? = null,
    onBack: (() -> Unit)? = null,
    backEnabled: Boolean = true,
    backDescription: String = /* "뒤로" · "Back" */,
    columnMax: Dp = DdsScreen.bodyMax.dp,
    actions: @Composable RowScope.() -> Unit = {},
)
```

### 7.1 본문 기둥 안에 둔다

상단 줄의 내용은 `columnMax` 폭으로 영역의 가운데에 놓인다. 본문과 같은 폭, 같은 자리다. 아래 1dp 선과
바탕은 영역 전체 폭이다. 옆 여백은 창의 값(16 또는 24)을 쓴다. 지금은 창 폭과 상관없이 16이다.

### 7.2 선에 맞추는 규칙

`g`는 옆 여백이다.

| 무엇 | 자리 |
| --- | --- |
| 뒤로 화살표의 그림(24) | 왼쪽 끝이 본문 시작선(`g`)에 선다. 눌리는 영역(48)은 여백 쪽으로 12 나간다 |
| 로고(`leading`) | 본문 시작선에서 시작한다. 자리는 최소 28 폭이다 |
| 제목 | 화살표 뒤든 로고 뒤든 `g + 40`에서 시작한다. 둘 다 없으면 `g`에서 시작한다 |
| 마지막 아이콘의 그림 | 오른쪽 끝이 본문 끝선에 선다. 눌리는 영역은 여백 쪽으로 12 나간다 |

- 탭 화면(로고 28 + 간격 12)에서 상세(화살표)로 들어가도 제목이 옆으로 움직이지 않는다.
- 뒤로 가기는 `onBack`으로 넘긴다. 부품이 화살표를 그리고 정렬을 맡는다. `onBack`과 `leading`을 함께
  주면 화살표만 그린다.
- 끝의 동작은 아이콘 버튼으로 한다. 글자 버튼을 끝에 두면 글자가 여백으로 12 나가므로 앱이 끝 여백 12를 준다.
- 28보다 넓은 것을 `leading`에 넣어도 깨지지 않는다(자리가 넓어지고 제목이 그만큼 밀린다). 기존에
  `leading`으로 뒤로 버튼을 넣던 코드는 그대로 동작하지만 선에 맞지 않으므로 `onBack`으로 옮긴다.

### 7.3 두 줄 제목

상단 줄의 높이는 본문의 세로 시작선이다. 화면마다 다르면 본문이 위아래로 튄다. 그래서 창 단위로 정한다.

- 앱이 상단 줄에 쓰는 이름들을 `barTitles`로 틀에 넘긴다. 지금 글자 크기에서 그중 하나라도 한 줄에 들어가지
  않으면 `ddsFrame().tallBar`가 참이 되고, 그 창의 모든 `DdsTopBar`가 높이 104에 제목 두 줄이 된다.
- 제목이 쓸 수 있는 폭은 `min(영역 폭, columnMax) − 2g − 40 − 48 × barActions − barReserve(제목)`이다.
  영역 폭은 창에서 레일과 고정 목록을 뺀 값이고, 40은 화살표나 로고의 자리, 48은 끝 아이콘 하나의 폭이다.
  `barActions`는 어느 상단 줄에든 끝에 놓이는 아이콘의 최대 개수다(기본 2). `barReserve`는 제목 옆에 늘
  놓이는 것(단계 화면의 "2 / 4")의 폭을 앱이 알려 주는 자리다.
- `barTitles`를 넘기지 않으면 지금처럼 높이 64에 한 줄이고 넘치면 자른다. 틀 밖에서도 같다.
- 같은 계산을 앱이 직접 쓸 수 있게 `ddsBarNeedsTwoLines(areaWidth, titles, actions, reserve, columnMax)`를
  내놓는다.

### 7.4 그대로인 것

아래 1dp 선은 항상 있다(정산나우는 본문이 스크롤됐을 때만 보여 준다). 바탕은 페이지 바탕이고 그림자와
색조는 없다. 화면이 바뀔 때 움직이지 않는다.

## 8. 한 가지 일만 하는 화면

```kotlin
@Composable
fun DdsCenteredColumn(
    modifier: Modifier = Modifier,
    max: Dp = DdsScreen.centeredMax.dp,
    content: @Composable ColumnScope.() -> Unit,
)
@Composable
fun DdsCenteredTitle(title: String, modifier: Modifier = Modifier, description: String? = null)
```

- **`DdsCenteredColumn`.** 로그인 전, 잠금처럼 할 일이 하나인 화면용이다. 내용이 주어진 영역의 한가운데에
  최대 400 폭의 한 묶음으로 놓이고 안의 것들은 가운데 정렬이다. 옆 여백은 창의 값, 위아래 여백은 24다.
  글자가 커서 묶음이 창보다 길어지면 위에서부터 시작하고 스크롤된다. 넓은 창의 구석에 붙은 묶음은 덜
  불러와진 화면처럼 읽힌다는 것이 정산나우에서 나온 지적이다.
- **`DdsCenteredTitle`.** 가운데 정렬 제목과 그 아래 한 문장이다. 마지막 줄에 한 단어만 남지 않도록 줄
  길이를 고르게 나눈다. 제목 안의 줄바꿈은 지킨다. 화면 낭독기에는 제목 하나로 읽힌다.
- 제목이 한 줄씩 차례로 올라오게 하는 연결 고리는 넣지 않는다. 모션 요청과 함께 다룬다(§11).

## 9. 검사

### 9.1 표시

검사가 찾는 표시를 `dds-compose`가 공개 상수로 내놓는다(`DdsTestTags`): 본문 기둥, 상단 줄 제목, 레일,
고정 목록 자리, 하단 탭, 가운데 묶음과 그 영역. 부품이 스스로 단다.

### 9.2 앱이 쓰는 도우미 — `kr.devslab:dds-compose-testing`

새 꾸러미다. 앱의 기기 테스트(`androidTestImplementation`)가 쓰고, 다른 둘과 같은 버전으로 함께 낸다.

```kotlin
enum class DdsScreenKind { TopLevel, Inner, Listed, WholeWindow }

class DdsFrameCheck(rule: ComposeTestRule) {
    fun look(name: String, kind: DdsScreenKind): DdsScreenReading
    fun assertSameLines()
}
```

앱의 테스트가 실제 화면을 하나씩 열면서 `look`을 부른다. 그 화면에서 확인하는 것:

1. 보이는 본문 기둥이 정확히 하나다.
2. 화면의 제목이 본문 기둥의 좌우 안에 있다.
3. 본문이 틀이 남긴 영역(고정 목록의 끝 또는 레일의 끝부터 창 끝까지)의 가운데에 있다.
4. 창 폭과 화면 종류에 맞는 메뉴만 있다.

| 종류 | 레일 | 고정 목록 | 하단 탭 |
| --- | --- | --- | --- |
| `TopLevel`(탭 화면) | Medium 이상 | 없음 | Compact |
| `Inner`(들어간 화면) | Medium 이상 | 없음 | 없음 |
| `Listed`(목록이 있는 영역의 화면) | Medium 이상 | Expanded | 없음 |
| `WholeWindow`(메뉴를 끈 화면) | 없음 | 없음 | 없음 |

5. 고정 목록이 있으면 레일의 끝에서 시작하고 본문은 목록의 끝 뒤에 있다.

`assertSameLines`는 지금까지 본 화면들을 종류별로 묶어 본문의 시작선과 폭이 같은지 본다. `look`이 돌려주는
값(dp로 잰 시작선, 폭, 제목 시작, 메뉴 유무)은 앱이 증거 파일로 남길 수 있다. 정산나우의
`everyScreenStartsOnOneLineAndTheFrameKeepsTheMenusThisWindowSizeCallsFor`를 일반화한 것이다.

### 9.3 DDS 자체 테스트

모두 실패하는 것을 먼저 확인한 뒤에 통과시킨다.

**단위 테스트**

- 창 폭 경계: 599는 Compact, 600은 Medium, 839는 Medium, 840은 Expanded.
- 옆 여백: Compact 16, Medium 24, Expanded 24.
- 생성된 숫자가 `tokens/native.json`과 같다(기존 검사).

**기기 테스트** (에뮬레이터. 창 크기를 테스트 안에서 강제로 바꾼다: 475×751, 704×933, 933×704)

- 창 폭마다 맞는 메뉴가 있고, `navigation = false`이면 어느 폭에서도 없다.
- 탭 화면, 들어간 화면, 목록 옆 화면의 본문 시작선과 폭이 종류별로 같다. 정산나우가 펼친 가로에서 잰
  배치(레일 80, 목록 264 + 선, 본문 가운데)가 나온다.
- 상단 줄: 화살표 그림과 마지막 아이콘 그림이 본문 선에 서고, 제목 시작이 로고 뒤와 화살표 뒤에서 같다.
- 두 줄 제목: 긴 이름이 `barTitles`에 있으면 모든 상단 줄이 104가 되고, 없으면 64다.
- 가운데 묶음: 가운데에 있고 폭이 400을 넘지 않는다. 글자를 키워 넘치게 하면 맨 위에서 시작한다.
- 화면이 바뀌는 동안(시계를 멈추고 프레임마다) 레일의 자리와 픽셀이 그대로다.
- 창 폭 분류를 바꿔도 화면 안의 상태(스크롤 위치, 입력한 글자)가 유지된다.
- 하단 탭: Compact의 최상위 화면에만 있고, 상세 화면이 그 위로 나타나는 동안 비는 프레임이 없다.
- 글자 200%와 큰 글자 모드: 레일·하단 탭 라벨이 두 줄로 다 보이고, 상단 줄 제목이 잘리지 않는다.
- 화면 낭독기: 목록 줄이 선택 상태와 순서를 말하고, 가운데 제목이 제목 하나로 읽힌다.
- 오른쪽에서 왼쪽: 레일과 목록이 오른쪽에 온다.

### 9.4 눈으로 확인

카탈로그 앱을 새 틀로 옮기고(탭이 이미 넷이다) 시연을 넣는다: 본문 기둥, 고정 목록이 있는 영역, 창 전체를
쓰는 화면, 로그인 전 모양의 가운데 묶음. 에뮬레이터에서 창 세 가지 × 밝은·어두운 화면 × 보통·큰 글자로
캡처해 직접 본다. 캡처 위에 본문 시작선과 끝선을 그어 상단 줄의 그림과 맞는지 본다.

실물 폰은 DDS 쪽에서 건드리지 않는다. 정산나우가 옮긴 뒤 창 세 가지에서 확인한다.

## 10. 호환성과 옮기는 방법

기존 코드는 고치지 않아도 컴파일된다. 버전은 0.7.0이다. 눈에 보이게 바뀌는 것:

| 부품 | 바뀌는 것 |
| --- | --- |
| `DdsTopBar` | 넓은 창에서 내용이 본문 기둥 폭에 모인다. 옆 여백이 600 이상에서 16 → 24가 된다. 로고 뒤 제목이 `g + 40`에서 시작한다 |
| `DdsBottomBar`, `DdsNavRail` | 라벨이 한 줄에서 잘리지 않고 두 줄까지 쓴다. 그만큼 높아질 수 있다. 레일 폭이 80으로 고정된다 |

**정산나우** (그쪽 레포에서 그쪽 세션이 한다. DDS 쪽은 안내 메모만 쓴다)

| 정산나우 | DDS 0.7.0 |
| --- | --- |
| `JnWidth`, `jnWidth()` | `DdsWindowWidth`, `ddsWindowWidth()` |
| 틀 블록(`BoxWithConstraints` + `Row`), `JnRail` | `DdsAppFrame` |
| `JnFrame`, `LocalJnFrame` | `DdsFrame`, `ddsFrame()` |
| 탭 화면의 `NavigationBar` | `DdsScaffold(bottomTabs = true)` |
| `jnBody()`, `JnBodyColumn`, `widthIn(max = 680).padding(20)` | `ddsBody()`, `DdsBodyColumn`, `ddsBodyLines()` |
| `JnTopBar`, `jnBarNeedsTwoLines` | `DdsTopBar`, `barTitles` 또는 `ddsBarNeedsTwoLines` |
| `JnGateColumn`, `JnGateTitle` | `DdsCenteredColumn`, `DdsCenteredTitle`(한 줄씩 올라오는 화면은 당분간 자기 제목) |
| `BusinessSectionPane`의 줄 | `DdsPaneList`, `DdsPaneItem` |
| 옆 여백 20 | 16 또는 24 |
| 직접 짠 측정 테스트 | `DdsFrameCheck` |

정산나우에서 눈에 보이게 달라지는 것: 옆 여백(접으면 4 줄고 펼치면 4 늘어난다), 상단 줄 아래 선이 항상
보인다, 본문 위쪽 여백이 12 또는 20에서 16 또는 24가 된다.

**Qooroo.** 탭이 없으므로 틀은 쓰지 않는다. 원하면 `ddsWindowWidth`, 옆 여백, `ddsBody(max)`만 쓴다.

## 11. 범위 밖

- 목록과 상세를 반반으로 나누는 두 칸(Qooroo의 방식).
- 반쯤 접은 자세와 접히는 선을 피하는 배치.
- 서랍형 메뉴.
- 단계로 하는 화면의 틀(정산나우 `JnWizardFrame`). 이 설계의 부품 위에 얹히므로 다음 설계로 한다.
  `barReserve`는 그때를 위한 자리다.
- 모션 요청 두 건: 스플래시 로고가 가는 길을 화면이 고르기, 화면 덩어리가 차례로 도착하는 값.
- 입력칸 요청 세 건: 글자 사본을 갖지 않는 입력칸, 칸 묶음을 통째로 보이게 끌어오기, 여러 줄.
- `DdsMenu`의 그림자와 끝 맞춤(Qooroo 요청). 0.6.0에 실었다(그림자 없음, `DdsMenuAlign.End`, `DdsMenuDivider`, D-053).

## 12. 버린 대안

**Material의 적응형 틀을 감싼다.** Google이 유지하고 접힘 자세를 안다. 그러나 모든 앱에 새 의존성이 붙고,
목록 폭과 칸이 바뀌는 움직임을 그쪽 규칙으로 정하므로 264 같은 숫자와 D-051의 전환 규칙에 맞추려면
덮어써야 한다. 이번 문제(시작선, 상단 줄과 본문의 어긋남)는 풀어 주지 않는다. 정산나우는 이동 구조를 다시
짜야 한다. 0.5.0에서 Material의 스크롤 탭 줄이 통제할 수 없는 방식으로 동작해 직접 그린 일도 있었다.

**숫자와 작은 도우미만 준다.** 가장 작다. 그러나 원인이 그대로 남는다. 숫자를 지키게 하는 부품이 없어서
화면마다 갈라졌던 것이고, 앱이 둘이면 틀도 둘로 갈라진다. 다만 이 안의 조각들(창 폭 분류, 여백, 본문
기둥)은 따로도 쓸 수 있게 만들어 탭이 없는 앱이 가져다 쓴다.

**하단 탭도 틀이 그린다.** 대칭이라 단순하지만 상세 화면을 열 때 탭 줄이 전환과 따로 사라져 내용이 튄다.

## 13. 확인하지 못한 채 설계한 것

구현 계획에서 먼저 확인한다.

- 확인: Material `NavigationBar`와 레일 항목은 라벨 줄 수만큼 높아진다. 에뮬레이터(API 36)에서 라벨 폭을 60dp로 묶고
  재었다. 글자 배율 1에서 라벨이 3줄이고 탭 줄 높이는 88dp, 레일 항목 높이도 88dp다. 배율 2에서는 라벨이 5줄이고
  탭 줄과 레일 항목 모두 200dp까지 자란다. 두 경우 모두 라벨 노드가 줄 안에 들어 있고 글자는 넘치지 않는다
  (`hasVisualOverflow`가 거짓). `heightIn(min = 160.dp)`도 얹어 봤지만 배율 2의 자연 높이(200dp)가 이미 그보다
  커서 아무것도 보여 주지 못한다. 그래서 Material 항목을 감싸서 쓴다. 직접 그릴 필요가 없다.
  재지 못한 것: 라벨이 정확히 두 줄인 경우와 한 줄짜리 기준선은 없다(60dp로 묶은 탓에 3줄과 5줄이 나왔다).
  라벨은 DDS의 실제 라벨이 아니라 폭을 60dp로 고정한 `Text` 하나였고, 탭 줄도 항목이 여러 개인 실제 줄이
  아니라 항목 하나짜리였다. 첫 구현 뒤에 실제 부품으로 다시 잰다.
- 확인: `DeviceConfigurationOverride(ForcedSize(DpSize(933.dp, 704.dp)))`는 폰 크기 에뮬레이터에서도 안쪽
  `BoxWithConstraints`에 `maxWidth` 933.19dp, `maxHeight` 704dp를 준다. 오차는 1dp 안이다. 다만 이 덮어쓰기는 창이
  아니라 밀도를 바꿔 그 크기를 화면에 맞춘다(덮어쓴 밀도는 1.15625. 실제 기기 밀도 2.625는 1080÷411로 계산한
  값이며 따로 찍어 보지는 않았다). 그래서 창 크기는
  `BoxWithConstraints`로만 읽어야 한다. `LocalWindowInfo.current.containerSize`는 덮어쓰기와 무관하게 실제 창인
  1080×2400px을 그대로 주고, 덮어쓴 밀도로 나누면 934×2076dp다. 너비는 덮어쓰기가 강제한 너비가 창에 맞도록
  밀도를 정하므로 맞게 나오는 것이고(그래서 933이 아니라 934로 반올림 차이만 난다), 높이는 강제한 704가
  아니라 실제 창 높이라 틀린다.
  `LocalConfiguration.current.screenWidthDp`도 덮어쓰이지 않아 411을 준다(높이 838). 테스트에서 창 크기를
  강제하는 방법은 `ForcedSize`를 쓴다. `requiredSize` 우회는 필요 없다.
  재지 못한 것: 933×704 한 가지만 돌렸다. 세로 방향 704×933과 475×751은 돌리지 않았다.
- 릴리스 워크플로가 세 번째 꾸러미를 함께 올리는지.
- 고정 목록이 있을 때 화면의 제목과 목록의 제목을 검사가 구분하는 방법(본문 기둥의 좌우 안에 있는 제목을
  화면의 것으로 본다).
- 분할 화면처럼 앱 창이 화면보다 작을 때 틀 밖의 `ddsFrame()`이 읽는 폭.
