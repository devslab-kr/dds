# 변경 기록 — DDS 안드로이드

[English](CHANGELOG.md) · **한국어**

`kr.devslab:dds-android-tokens`와 `kr.devslab:dds-compose`는 한 버전을 쓰고, 웹 패키지와는
버전이 따로다(D-048). 릴리스는 `android-v<버전>` 태그로 낸다.

## 0.5.0 — 2026-11-11

화면 낭독기, 키보드, 큰 글자를 쓰는 사람, 그리고 젊지 않은 눈을 위한 수정. 부품을 점검해 찾은
것들이고, 기기 테스트(`ScreenReaderTest`, 18개)가 낭독기에 전달되는 것을 고정한다.

**모두에게 보이는 것**

- **컨트롤의 테두리가 진해졌다.** 새 `borderControl`(`@color/dds_color_border_control`): 밝은
  화면에서 3.25:1, 어두운 카드 위에서 3.26:1(`borderStrong`은 약 1.5:1이었다). 입력칸, 검색칸,
  선택칸, 체크 안 된 상자, 선택 안 된 라디오가 이것을 쓰고, Material의 `outline` 역할도 여기에
  대응한다. 카드 테두리, 구분선, 라벨이 있는 버튼은 옅은 선 그대로다. 웹과 같은 토큰 변경이다(D-050).
- **어두운 화면의 안내 글귀가 밝아졌다**(어두운 화면의 `textMuted`: 4.1:1 → 6.0:1).
- **`DdsSearchField`**는 안내 글귀를 주지 않으면 `label`을 안내 글귀로 보여 준다(칸을 비워 두려면
  `placeholder = null`). 지우면 그 칸에 초점이 간다.
- **`DdsChip`, `DdsTabs`:** 선택된 것은 색과 함께 글자가 굵다. 폭은 변하지 않는다. 탭은 여전히
  폭을 똑같이 나누고, 라벨이 자기 몫에 안 들어가면 자르는 대신 옆으로 넘긴다.
- **`DdsSelectField`**는 고른 값을 두 줄까지 보여 준다. **`DdsDialog`:** 긴 글은 넘겨 볼 수 있다.
- **선택 행**에 포커스 링이 보인다.

**화면 낭독기로 들리는 것**

- **`DdsTextField`:** 라벨이 입력칸의 일부가 되어 따로 읽히지 않는다. 오류는 나타나는 순간 읽어
  준다(칸에서 한 번, 그 줄에서 한 번 들린다).
- **`DdsSelectField`:** 라벨을 한 번만 읽고, 상자 안의 글은 안내 글귀일 때도 읽는다.
- **`DdsSearchField`:** 이름은 설명 문구가 아니라 칸의 글자다. 지우기 버튼은 지울 것이 있을 때만 있다.
- **`DdsNotice`:** 앱이 아이콘 설명을 주지 않아도 종류("오류", "안내" 등)를 메시지와 함께 한
  요소로 읽고, 나타날 때 읽어 준다. `iconDescription = ""`이면 그 말을 뺀다.
- **`DdsButton`:** 진행 중인 버튼은 "불러오는 중"이라고 말하고, 초점을 유지한 채 누름을 무시하며,
  눌린 것처럼 보이지 않는다.
- **`DdsListRow`:** 누를 수 있는 행은 버튼이라고 말하고, 보여 주기만 하는 행은 하나로 읽는다.
- **`DdsBusyBar(description)`**에 이름이 있다. **`ddsScreenContent(paneTitle)`:** 화면이 나타날 때
  이름을 말할 수 있다. **`DdsBottomSheet`:** 손잡이에 이름이 있다.
- 위 말들을 위한 새 문자열 `dds_a11y_*`(영어, 한국어).

**테스트가 있다면**

- `DdsTextField`와 `DdsSearchField`에는 더 이상 설명 문구가 없다.
  `onNodeWithContentDescription(label)`은 아무것도 찾지 못한다.
  `hasSetTextAction() and hasText(label)`을 쓴다.
- `DdsSelectField`는 설명 문구로 찾는다. 보이는 라벨은 요소가 아니다.

**하지 않은 것:** 당겨서 새로고침에는 낭독기용 대체 수단이 없다 — 보이는 새로고침 버튼을 둔다.
TalkBack으로 직접 들어 본 사람은 아직 없다.

## 0.4.0 — 2026-11-11

정산나우가 0.3.0을 실물 폰에서 프레임 단위로 녹화해 본 결과에서.

- **바뀜 — 앞으로·뒤로 이동에서 내용이 흐리게 나타나지 않는다.** 내용은 첫 프레임부터 불투명하고
  밀기(24dp)만 한다. 100ms 페이드는 이미 떠 있는 상단 바 아래의 내용 자리를 약 8프레임 비웠다.
- **새로 — `DdsScreenMotion(move, active)`와 `LocalDdsScreenActive`.** 떠나는 화면을 비우지 말고
  계속 그리되 더는 현재 화면이 아님을 알린다. 내비게이션 호스트가 항목을 바꾸는 데 몇 프레임이
  걸리고, 그사이 비운 항목은 이동할 때마다 빈 화면(어두운 화면에서는 흰 번쩍임)으로 보였다.
  가이드가 "이전 화면은 즉시 걷는다"고 적었던 19번 규칙을 바로잡았다.
- **새로 — `DdsSearchField(applyDescription, searchEnabled)`:** 끝의 적용 버튼. 그 버튼만 따로
  흐리게 할 수 있다.

## 0.3.0 — 2026-11-11

정산나우를 폰에서 써 보며 나온 것과 0.2.0에서 빠졌던 부품.

- **새 부품:** `DdsSearchField`, `DdsSelectField`, `DdsValueRow`, `DdsTabs`, `DdsBottomSheet`,
  `DdsMenu` / `DdsMenuItem`, `DdsToastHost`.
- **뒤로 가기 규칙:** `DdsBackHandler`, `rememberDdsTabTrail`, `ddsBackAction` — 뒤로는 이전
  화면, 그다음 직전 탭으로 간다. 앱 종료는 묻고, 600ms 안에 두 번 눌러도 묻는다.
- **바뀜 — 탭 전환은 더 이상 흐려지며 나타나지 않는다.** `DdsMove.Tab`은 이제 "움직임 없음"이다.
  비워진 화면 위의 150ms 페이드가 탭을 누를 때마다 깜빡임으로 읽혔다.
- **고침 — 글은 쓴 그대로 읽힌다.** `keepWords()`로 그린 부품의 글이 글자 사이의 보이지 않는
  연결 문자와 함께 화면 낭독기와 테스트에 전달되어 `onNodeWithText("저장")`이 맞지 않았다. 이제
  부품은 원문을 알려 준다. 앱이 직접 그리는 글에는 `Modifier.readAs()`를 쓴다. DDS 라벨을
  `"…".keepWords()`로 찾던 테스트는 이제 원문으로 찾는다.
- `dds-compose`가 `androidx.activity:activity-compose`를 함께 가져온다(뒤로 가기 처리용).

## 0.2.1 — 2026-11-11

- 어두운 화면: 위험·정보 색을 한 단계 밝혔다(`red.300`, `blue.300`). 오류·안내 글자가 자기
  배경 위에서 4.5:1을 넘는다(전에는 3.62:1과 4.07:1). 웹과 같은 토큰 변경이다(D-049). 다른
  것은 바뀌지 않는다.

## 0.2.0 — 2026-11-10

Maven Central 첫 배포.

**값** (`dds-android-tokens`)

- 웹 `tokens/*.json`과 `tokens/native.json`에서 생성한 Kotlin 상수와 XML 리소스: 색(밝은·어두운),
  간격, 둥글기, 높이, 글자, 모션.
- `values-night` 짝이 있는 `@color/dds_*` 리소스와 `@bool/dds_light_system_bars`.

**테마와 모션** (`dds-compose`)

- `DdsTheme`: Material3 역할 대응, Pretendard, 글자 8종, 큰 글자 모드.
- 브랜드 덮어쓰기: 브랜드 여섯 색을 색 리소스로 다시 정의한다(웹과 같은 토큰 이름). XML과
  Compose가 함께 바뀌고 세 쌍의 대비를 검사한다.
- 모션: `ddsScreenContent`, `ddsAppear`, 움직임 줄이기, `DdsSplashHandoff` /
  `DdsSplashOverlay` / `ddsSplashTarget`, `DdsBusyBar`, `DdsLoadingRows`, `DdsPullRefresh`.

**부품과 아이콘** (`dds-compose`)

- `DdsButton`, `DdsIconButton`, `DdsTextField`, `DdsCheckbox`, `DdsRadio`, `DdsSwitch`,
  `DdsCard`, `DdsSection`, `DdsDivider`, `DdsListRow`, `DdsNotice`, `DdsBadge`, `DdsChip`,
  `DdsEmptyState`, `DdsSpinner`, `DdsTopBar`, `DdsBottomBar`, `DdsNavRail`, `DdsScaffold`,
  `DdsDialog`.
- `dds-icons` SVG에서 생성한 `DdsIcons`와 `DdsIcon`.

**알려진 것**

- 어두운 화면의 상태색 대비가 4.5:1에 못 미친다(위험 3.62:1, 정보 4.07:1) — 0.2.1에서 고쳤다.
- 아직 없는 부품: 아래 시트, 토스트, 화면 안 탭, 선택기, 메뉴. `DdsTheme` 아래에서 Material3
  부품을 쓴다.

최소 Android 8(API 26). [가이드](../docs/mobile-native.ko.md) 참고.

## 0.1.0

배포하지 않았다. 첫 이전 작업을 위해 로컬 Maven 저장소에만 올렸다(값·테마·모션, 부품 없음).
