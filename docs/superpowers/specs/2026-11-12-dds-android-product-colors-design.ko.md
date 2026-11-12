# DDS 안드로이드 0.6.0 — 제품이 정하는 색의 범위, 버튼, 메뉴 — 설계

상태: **구현 완료** (2026-11-12, 안드로이드 0.6.0. 머지와 배포는 소유자 확인 대기). 설계는 같은 날
승인됐다. 1·2절은 소유자가 대화에서 확인했다("맞습니다, 진행"). 3·4절은
기본안을 제시했고 이의가 없었다. 결정 기록은 `docs/decisions.md` D-053. 화면 틀(D-052)은 다른
브랜치에서 만들고 있고 0.7.0으로 낸다.

## 0. 왜 만드는가

Qooroo가 앱 전체 모양을 다시 정하면서 DDS 0.5.0으로는 할 수 없는 네 가지가 나왔다.

| # | Qooroo가 원하는 것 | 0.5.0에서 |
| --- | --- | --- |
| 1 | 주황 `#FF6A1F` 바탕에 흰 글자(약 2.9:1) | `DdsTheme`이 4.5:1 미만 브랜드를 거부해 앱이 뜨지 않는다 |
| 2 | 따뜻한 종이색 페이지 위에 흰 카드 | 제품이 바꿀 수 있는 것은 브랜드 색 여섯 개뿐이다 |
| 3 | 흰 면 보조 버튼, 주황이 아닌 글자 버튼 | 보조 버튼은 바탕이 투명하고, 글자 버튼은 브랜드 색뿐이다 |
| 4 | 그림자 없는 메뉴, 버튼 끝에 맞춰 열리는 메뉴 | Material 기본 그림자(3dp)가 남아 있고 끝 맞춤을 고를 수 없다 |

소유자 지시(2026-11-12): "dds규칙을 풀어서 예외 허용하게 해줘. 그리고 바탕도 자유롭게 바꿀수있게
해줘", 예외는 "제품이 명시해야 허용", 순서는 화면 틀보다 먼저, 배포는 "먼저 0.6.0으로".

## 1. 대비 예외

### 1.1 규칙

- 기본은 지금과 같다. 아래 조합의 글자 대비가 4.5:1(`DdsMinTextContrast`) 아래면 `DdsBrand`가 거부한다.
- 제품이 **조합을 명시하면 그 조합만** 통과한다. 하한은 없다. 글자 크기·굵기 조건도 없다.
- 밝은 화면과 어두운 화면에 따로 적는다.
- 거부할 때의 오류 문구에 어떻게 적으면 통과하는지를 넣는다.

### 1.2 조합

| 조합 | 검사하는 것 |
| --- | --- |
| `TextOnBrand` | `textOnBrand` / `bgBrand` |
| `TextBrand` | `textBrand` / 페이지 바탕, 옅은 바탕, 카드 바탕, `bgBrandSubtle` |
| `TextOnBackground` | 본문 글자(`textPrimary`)와 보조 글자(`textSecondary`) / 페이지 바탕, 옅은 바탕, 카드 바탕 |

`TextOnBackground`는 2절에서 바탕을 바꿀 수 있게 되면서 새로 검사한다. DDS 기본값은 모두 통과한다.
0.5.0은 `textBrand`를 페이지 바탕과 `bgBrandSubtle` 위에서만 검사했다. 옅은 바탕과 카드 바탕을 더한다.

### 1.3 적는 곳

색을 정하는 곳과 같다.

**리소스(권장).** 앱의 `res/values`(밝은 화면)와 `res/values-night`(어두운 화면)에 둔다.

```xml
<bool name="dds_allow_contrast_text_on_brand">true</bool>
<bool name="dds_allow_contrast_text_brand">true</bool>
<bool name="dds_allow_contrast_text_on_background">true</bool>
```

DDS의 기본값은 셋 다 `false`다. `DdsBrand.fromResources`가 색과 함께 읽는다.

**코드.** `DdsBrandColors`에 인자를 더한다.

```kotlin
enum class DdsContrastPair { TextOnBrand, TextBrand, TextOnBackground }

data class DdsBrandColors(
    val bgBrand: Color, val bgBrandHover: Color, val bgBrandSubtle: Color, val textBrand: Color,
    val textOnBrand: Color = onBrandFor(bgBrand),
    val borderFocus: Color = Color.Unspecified,
    val bgDefault: Color = Color.Unspecified,      // 2절
    val bgSubtle: Color = Color.Unspecified,       // 2절
    val bgElevated: Color = Color.Unspecified,     // 2절
    val allow: Set<DdsContrastPair> = emptySet(),
)
```

기존 인자의 순서와 기본값은 그대로다. 새 인자는 뒤에 붙는다.

### 1.4 `onBrandFor`

정하지 않은 `textOnBrand`는 지금처럼 규칙이 고른다(어두운 글자와 흰색 중 대비가 큰 쪽). 예외는 제품이
`textOnBrand`를 직접 정했을 때만 의미가 있다.

## 2. 제품이 바꾸는 바탕

- 제품이 바꿀 수 있는 색에 **페이지 바탕(`bg_default`), 옅은 바탕(`bg_subtle`), 카드 바탕(`bg_elevated`)**
  을 더한다. 브랜드 여섯 색과 같은 방식이다. 앱이 같은 이름의 색 리소스(`dds_color_bg_default` 등)를
  자기 `res/values`와 `res/values-night`에 다시 정한다. 스플래시(XML)와 Compose가 함께 바뀐다.
- 정하지 않은 값은 DDS 기본값이다. 코드로 넘길 때는 `Color.Unspecified`가 "기본값"이다.
- `DdsTheme.colors.bgDefault / bgSubtle / bgElevated`와 Material의 `background`·`surface` 대응이 바뀐 값을
  따른다. 상단 줄, 하단 탭, 레일, 카드, 시트, 다이얼로그, `DdsScreenHost`의 기본 배경은 이 값들을 읽으므로
  따로 고칠 것이 없다.
- 바탕을 바꾸면 그 위의 글자를 검사한다(1.2의 `TextBrand`, `TextOnBackground`). 모자라면 거부하고,
  예외를 적으면 통과한다.
- **제품이 정한 바탕은 불투명해야 한다**(구현하며 더했다). 반투명한 바탕 위의 대비는 잴 수 없다. 알파가
  1이 아니면 거부하고, 예외로도 통과하지 못한다.
- DDS에는 바탕 셋의 어두운 화면 값이 따로 있다(`values-night`). 그래서 `res/values`에만 적은 바탕은 밝은
  화면만 바꾸고, 어두운 화면의 바탕은 `res/values-night`에 따로 적는다. 어두운 화면에서 본문·보조 글자가
  걸리면 오류 문구가 `res/values-night`에 정할 바탕의 이름을 알려 준다(구현하며 더했다).
- 그 밖의 중립색(글자색, 테두리색, 상태색, 덮개색)은 계속 DDS 것이다. 컨트롤 테두리의 3:1(D-050)은
  검사하지 않는다. DDS 기본 바탕에서 맞춘 값이므로, 바탕을 많이 바꾼 제품은 스스로 확인한다(가이드에 적는다).

## 3. 버튼

- **보조 버튼(`Secondary`)을 카드 바탕(`bgElevated`)으로 채운다.** 흰 페이지에서는 지금과 똑같이 보이고,
  색 있는 페이지에서는 흰 면이 된다. 누르면 그 위에 옅은 덮개가 올라간다. 테두리와 글자는 그대로다.
- **잉크색 글자 버튼 `DdsButtonVariant.Plain`을 더한다.** 바탕 없음, 글자는 `textPrimary`, 누르면 옅은
  덮개. `Ghost`(브랜드 색 글자)는 그대로 둔다.
- 글자 굵기와 크기는 그대로다(채운 버튼 SemiBold, `Lg`는 16sp).

## 4. 메뉴

- **그림자를 없앤다**(`shadowElevation = 0`). 카드·시트·다이얼로그처럼 1dp 선과 카드 바탕으로만 구분한다.
- **끝 맞춤을 고를 수 있다.**

```kotlin
enum class DdsMenuAlign { Start, End }

@Composable
fun DdsMenu(
    expanded: Boolean, onDismissRequest: () -> Unit,
    modifier: Modifier = Modifier,
    align: DdsMenuAlign = DdsMenuAlign.Start,
    content: @Composable ColumnScope.() -> Unit,
)
```

`End`이면 메뉴의 끝이 버튼의 끝에 맞는다(창 안에 들어가는 한). 넓은 두 칸 화면에서 왼쪽 칸 끝의 ⋮ 메뉴가
오른쪽 칸으로 넘어가지 않는다. 기본값은 지금 동작인 `Start`다.

- **`DdsMenuDivider()`를 더한다.** 지우는 항목 앞에 두는 1dp 선이고 위아래 4dp를 띈다.

## 5. 규칙 문서

- **DDS `CLAUDE.md`의 절대 불변 규칙.** "on-brand 규칙"과 "접근성 최소선"에 "제품이 조합을 명시한 예외는
  허용한다(D-053)"를 더한다. 브랜드에 관한 줄에 "제품은 브랜드 여섯 색과 바탕 셋을 정한다"를 더한다.
- **규칙 명세**(`docs/design-system.md`, `.ko.md`). 멀티브랜드 절의 "브랜드 조각은 정확히 여섯 토큰"을
  "여섯 토큰과 바탕 셋"으로, 대비 노트에 예외 규칙을 더한다.
- **웹 코드는 바꾸지 않는다.** 웹은 CSS 변수를 덮어쓰는 방식이라 막는 장치가 없고, 규칙 문서만 고친다.
  웹 쪽 예시와 검사는 웹 제품이 필요로 할 때 한다.
- 결정 기록 D-053, 안드로이드 가이드(브랜드 절, 메뉴 그림자), 변경 기록, README, 백로그.

## 6. 확인

**단위 테스트** (실패를 먼저 본다)

- 예외가 없으면 `#FF6A1F` + 흰 글자를 거부한다. `TextOnBrand`를 적으면 통과한다. 다른 조합은 여전히 거부한다.
- 밝은 화면에만 적은 예외는 어두운 화면에 적용되지 않는다.
- 바탕을 바꾸면 그 위의 본문·보조·브랜드 글자를 검사한다. 예외를 적으면 통과한다.
- 정하지 않은 바탕은 DDS 기본값이고, DDS 기본 브랜드는 예외 없이 통과한다.
- 오류 문구에 적어야 할 리소스 이름이 들어 있다.
- Material 색 대응(`background`, `surface`)이 바뀐 바탕을 따른다.

**기기 테스트** (에뮬레이터)

- 리소스로 정한 예외와 바탕이 실제로 읽힌다(테스트 앱 리소스).
- 보조 버튼의 가운데 픽셀이 카드 바탕색이고, `Plain` 버튼의 글자가 본문 글자색이다.
- 메뉴: `End`이면 메뉴의 끝이 버튼의 끝과 같고, `Start`이면 시작이 같다. 오른쪽에서 왼쪽에서도 같다.
  메뉴에 그림자가 없다(메뉴 바로 바깥 픽셀이 뒤의 색 그대로다). 구분선이 낭독기에 요소로 잡히지 않는다.
- 이 브랜치의 기존 기기 테스트 40개가 그대로 통과한다.
- 끝난 뒤의 수: 단위 테스트 79개, 기기 테스트 74개(기존 40 + 새 34). 에뮬레이터: 74개 실행, 실패 없음, 건너뜀 없음. 실물 폰
  (SM-F971N, Android 17): 74개 실행, 실패 없음, 2개 건너뜀. 폰에서 건너뛴 둘은 메뉴의 색 값 자체를 보는 검사다.
- 기기 테스트는 Espresso 3.7.0을 쓴다. Compose 테스트 규칙이 가져오는 버전은 Android 17에서 돌지
  않았다. 테스트 의존성이고 배포되는 POM에는 없다.

**눈으로 확인.** 카탈로그에 "제품 색" 시연을 넣는다: 주황 + 흰 글자 주 버튼, 종이색 페이지 위 흰 카드와
보조 버튼, `Plain` 버튼, 끝 맞춤 메뉴. 밝은·어두운 화면에서 캡처해 본다.

**배포 전.** 로컬 Maven 빌드를 Qooroo에 알려 먼저 써 보게 한다. 실물 폰은 DDS 쪽에서 건드리지 않는다.

## 7. 호환성

- 기존 코드는 그대로 컴파일된다. 버전 0.6.0.
- 눈에 보이게 바뀌는 것: 보조 버튼이 카드 바탕으로 채워진다. 기본 밝은 화면에서는 전과 같다. **어두운
  화면에서는 버튼 면이 페이지보다 눈에 띄게 밝다**(`zinc.950` 위의 `zinc.900` — 설계 때는 "색 있는 바탕
  위에서만 차이가 보인다"고 적었는데 틀렸다). 색 있는 바탕 위에서는 흰 면이 된다. 메뉴의 그림자가 없어진다.
- 새로 거부될 수 있는 것: `textBrand`를 옅은 바탕과 카드 바탕 위에서도 검사한다. DDS 기본 바탕에서는
  페이지 바탕과 값이 같거나 거의 같아 기존 브랜드가 걸릴 일은 드물지만, 걸리면 오류 문구가 방법을 알려 준다.
  잰 범위: 밝은 화면에서 흰 바탕 기준 4.50~약 4.69:1인 `textBrand`는 옅은 바탕에서, 어두운 화면에서 페이지
  기준 4.50~약 5.05:1인 `textBrand`는 옅은 바탕과 카드 바탕에서 걸린다.

## 8. 범위 밖

화면 틀(0.7.0), 입력칸 세 건, 단계 화면의 틀, 모션 요청 두 건, 글자 굵기를 제품이 고르는 것, 웹 코드.
