# 변경 기록 — DDS 안드로이드

[English](CHANGELOG.md) · **한국어**

`kr.devslab:dds-android-tokens`와 `kr.devslab:dds-compose`는 한 버전을 쓰고, 웹 패키지와는
버전이 따로다(D-048). 릴리스는 `android-v<버전>` 태그로 낸다.

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
