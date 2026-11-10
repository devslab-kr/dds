# DDS 네이티브 모바일 가이드 — 안드로이드

🌐 [English](mobile-native.md)

안드로이드 네이티브 앱(Kotlin · Jetpack Compose · Material3)이 웹과 **같은 값,
같은 규칙**을 쓰기 위한 가이드다. 값은 `tokens/*.json`에서 자동으로 만들어지고,
앱은 그것을 의존성으로 받는다. 값을 손으로 옮겨 적지 않는다.

이 가이드에는 두 종류의 내용이 있다.

- **웹 DDS 규칙을 옮긴 것** — 색, 글자, 간격, 둥글기, 상태색, 브랜드 덮어쓰기.
  항목마다 출처를 `[명세 §3.1]`처럼 적었다. 출처는 [`design-system.ko.md`](design-system.ko.md)다.
  모바일에서 새 규칙을 만들지 않았다.
- **모바일에서 새로 얻은 것** — §2 모션과 디테일. 정산나우와 Qooroo를 실제로 만들며
  잡아낸 것이고 이 가이드의 중심이다. 항목마다 규칙, 재사용 코드, 확인 방법을 적었다.

웹 규칙에 없어서 정해야 하는 것은 §10에 모았다. 결정 기록은 [`decisions.md`](decisions.md) D-048.
iOS는 아직 범위 밖이다.

| 좌표 | 내용 |
| --- | --- |
| `kr.devslab:dds-android-tokens` | 값만. Kotlin 상수와 XML 리소스. Compose가 필요 없다 |
| `kr.devslab:dds-compose` | 테마, 브랜드, 모션·불러오기 도우미. 위 좌표를 함께 가져온다 |

최소 Android 8(API 26). 사용법과 버전 규칙은 [`android/README.ko.md`](../android/README.ko.md).

---

## 1. 원칙

1. **값은 토큰에서만 온다.** 앱 코드에 hex, `Color(0x…)`, 높이·시간 숫자를 적지 않는다. `[명세 §1]`
2. **색은 `DdsTheme.colors`에서 읽는다.** 시맨틱 토큰만 쓴다. `[명세 §3.1]`
3. **어두운 화면은 같은 토큰의 다른 대응이다.** 부품이 테마로 갈라지지 않는다. `[명세 §3.1]`
4. **앱이 넘기는 것은 브랜드 색(여섯 토큰)뿐이다.** 나머지는 가족 공통이다. `[명세 §3.1, D-012]`
5. **움직임은 무엇이 바뀌었는지 알릴 때만 쓴다.** `[정산나우 모션 명세]`

## 2. 모션과 디테일

출처: 정산나우 `docs/jn-android-motion-2026-11-10.md`와 그 구현(커밋 `8f56362`),
Qooroo `docs/design/android/DESIGN.md` §5·§7·§9. 시간과 이징 중 100·200·300ms와
`standard`·`exit`는 웹 토큰과 같은 값이다 `[명세 §3.6]`.

### 2.1 값은 한 곳에만

| 이름 | 값 | 쓰임 |
| --- | --- | --- |
| `DdsMotion.Fast` | 100ms | 사라짐, 누름 반응, 화면이 나타나는 불투명도 |
| `DdsMotion.Short` | 150ms | 목록 항목 등장, 진행 표시 |
| `DdsMotion.Base` | 200ms | 뒤로 가기, 접기·펼치기, 다이얼로그 |
| `DdsMotion.Slow` | 300ms | 새 화면, 시트, 로고 이동 |
| `DdsMotion.Standard` | (0.2, 0, 0, 1) | 들어올 때, 화면 안 변화 |
| `DdsMotion.Exit` | (0.3, 0, 1, 1) | 나갈 때 |
| `DdsMotion.Travel` | (0.4, 0, 0.2, 1) | 멈춰 있던 것이 움직이기 시작할 때 |
| `DdsMotion.Shift` | 24dp | 화면 내용이 밀려 들어오는 거리 |
| `DdsMotion.StaggerStep` / `StaggerLimit` | 30ms / 6 | 목록 순차 간격과 상한 |

- 시간은 이 네 가지뿐이다. 화면 코드에 숫자를 적지 않는다.
- **되튐·탄성은 없다. 눌러도 크기와 자리는 바뀌지 않는다.** 누름 반응은 물결이다.
- 진동 피드백은 움직임 줄이기에서도 유지한다(Qooroo).

### 2.2 스플래시

로고가 스플래시에서 첫 화면까지 끊기지 않고 이어지는 것이 목표다. 로고 모양과 색은
앱의 것이고, 시스템은 이어 주는 방법을 준다.

**스플래시 그림을 그리는 규칙** (본보기: `android/catalog/src/main/res/drawable-v31/splash_mark.xml`)

1. **그림의 기본 상태는 완성된 로고다.** 애니메이션은 0에서 시작해 완성으로 간다.
   애니메이션이 꺼진 기기와 창 바탕은 이 기본 상태를 보여 준다.
2. **시작 지연은 `startOffset`이 아니라 "값이 같은 구간"으로 넣는다.** 시작값과
   끝값이 둘 다 빈 상태인 애니메이터를 먼저 재생한다. 그래야 첫 프레임부터 비어
   있어서, 그리기 전에 완성본이 한 번 번쩍이지 않는다.
3. **약 250ms 뒤에 그리기 시작한다.** 기기가 창을 여는 동안 그림이 먼저 지나가지
   않게 한다. 그리는 이징은 앞쪽에 몰리지 않는 것(`fast_out_slow_in`, (0.4, 0, 0.2, 1))을
   쓴다. 화면 안 변화용 이징(0.2, 0, 0, 1)은 첫 절반에 대부분이 지나가 "그리는 느낌"이 사라진다.
4. **로고는 288dp 캔버스의 가운데 1/3(96dp) 안에 온전히 둔다.** 기기가 원으로 잘라도 잘리지 않는다.
5. **스플래시 테마와 전용 그림을 반드시 만든다.** 없으면 런처 아이콘이 원으로 잘려 나온다(Qooroo가 겪음).
6. Android 11 이하는 정지 그림을 쓴다(`drawable/`에 정지, `drawable-v31/`에 애니메이션).
7. 색은 `@color/dds_color_bg_brand`, 배경은 `@color/dds_color_bg_default`. 밤 변형과
   브랜드 덮어쓰기가 함께 따라온다.

**첫 화면으로 넘겨주는 규칙** (코드: `DdsSplashHandoff`, `DdsSplashOverlay`, `Modifier.ddsSplashTarget`)

8. **첫 화면이 같은 자리·같은 크기·같은 색으로 로고를 미리 그려 두고, 한 프레임에
   바꾼 뒤 그 로고를 옮긴다.** 큰 로고는 이미지가 아니라 경로로 그린다(이동하며 크기가 변한다).
9. **시스템 스플래시 자체를 그리기가 끝날 때까지 유지한다**(`setKeepOnScreenCondition`).
   시스템이 넘겨주는 사본은 애니메이션 아이콘이 한두 프레임 비어 보일 수 있으므로,
   종료 리스너에서는 즉시 `remove()`한다.
10. **창 바탕에도 같은 로고를 둔다.** 시스템 스플래시와 첫 그리기 사이에 프레임이
    끼어도 로고가 보인다. 넘겨주기가 끝나면 단색으로 돌린다.
11. **붙잡는 시간은 첫 프레임이 준비된 때부터 재고 1초를 넘지 않는다.** 앱 실행
    시점부터 재면 느린 시작이 더 느려진다.
12. **이동은 300ms, `Travel` 이징.** 멈춰 있던 로고가 앞쪽이 빠른 이징으로 출발하면
    프레임이 빠질 때 튀어 보인다.
13. **도착 자리는 화면이 등록하고 우선순위가 높은 쪽이 이긴다.** 등록할 때 누가
    등록했는지 함께 기록한다. 나중에 사라지는 이전 화면이 새 화면의 등록을 지우지
    못하게 하기 위해서다(정산나우가 실제로 겪은 버그, 테스트로 고정).
14. **도착 자리가 없으면**(잠금 화면 등) 이동 없이 150ms로 걷는다. 이때 도착 자리의
    로고는 덮개 아래에서 바로 보인다.
15. **화면을 다시 만들 때는 재생하지 않는다**(`active = savedInstanceState == null`).
    덮개는 안전 시간이 지나면 스스로 걷힌다.
16. 첫 화면이 아직 정해지지 않았으면(세션을 읽는 중) `keepOnScreen(now, firstScreenKnown = false)`로
    같은 한도 안에서 기다린다. 로고가 갈 곳이 생긴다(Qooroo).
17. **스플래시가 걷힐 때 테마가 다시 적용되면서 상태 바 아이콘 색이 테마 값으로
    돌아간다.** 테마에 `android:windowLightStatusBar`를 `@bool/dds_light_system_bars`로 둔다.

```kotlin
val handoff = DdsSplashHandoff(
    active = savedInstanceState == null,
    reduced = isReducedMotion(this),
    createdAt = SystemClock.uptimeMillis(),
    drawMs = 800,                               // 스플래시 그림이 그려지는 시간
)
installSplashScreen().apply {
    setKeepOnScreenCondition { handoff.keepOnScreen(SystemClock.uptimeMillis()) }
    setOnExitAnimationListener { it.remove(); handoff.release() }
}
setContent {
    LaunchedEffect(handoff.phase) {             // 규칙 10: 끝나면 창 바탕을 단색으로
        if (handoff.phase == DdsSplashHandoff.Phase.Done) window.setBackgroundDrawableResource(R.color.dds_color_bg_default)
    }
    DdsTheme {
        CompositionLocalProvider(LocalDdsSplashHandoff provides handoff) {
            Box(Modifier.fillMaxSize()) {
                App()                           // 로고 자리에 Modifier.ddsSplashTarget(priority)
                DdsSplashOverlay(handoff, background = DdsTheme.colors.bgDefault, markSize = 96.dp) { size -> AppMark(size) }
            }
        }
    }
}
```

**알려진 한계 — 빈 프레임이 0은 아니다.** 정산나우가 0.1.0으로 옮긴 뒤 전용
에뮬레이터(Android 16, 30fps 녹화, 프레임별 로고 화소 수)로 잰 결과다. 실물 기기에서는 재지 않았다.

| 방식 | 로고가 없는 프레임 |
| --- | --- |
| 종료 리스너에서 즉시 `remove()` + `release()` (규칙 9) | 5회 중 2회, 각 1프레임. 시스템 로고 → 빈 프레임 → 앱이 그린 로고 순서 |
| 리스너 없이 시스템이 스스로 걷게 함 | 9회 중 4회에서 2~5프레임, 나머지도 로고가 옅어졌다 돌아옴. 쓰지 않는다 |

리스너가 불리기 전에 시스템이 넘겨준 사본이 아이콘 없이 한 프레임 보이는 것으로 추정한다.
사본이 불투명해서 창 바탕의 로고(규칙 10)로는 가려지지 않았다. 규칙 9가 둘 중 낫지만
"빈 프레임 0"을 보장하지 못한다. 대안은 스플래시에는 바탕만 두고 로고 그리기를 앱의
덮개가 직접 하는 것이다 — 넘겨받을 로고가 없어 빌 수 없고, 대신 로고가 첫 프레임 뒤에
나타난다. 만들지 않았다 — 아래 실물 기기 결과에서는 필요하지 않았다.

두 앱이 다르게 한 것과 정한 것:

| 항목 | 정산나우 | Qooroo | 정한 것 | 이유 |
| --- | --- | --- | --- | --- |
| 붙잡는 한도 | 첫 프레임부터 1초 | 첫 프레임부터 2초 | 1초(기본값, 바꿀 수 있음) | 느린 시작을 더 느리게 하지 않는다 |
| 무엇을 기다리나 | 그리기 끝 | 첫 화면이 정해질 때까지 | 그리기 끝 + `firstScreenKnown` | 둘 다 필요하다. 한도는 하나 |
| 마지막 조각의 튀어나옴 | 없음 | 사각형이 살짝 튀어나왔다 돌아옴 | 시스템에는 없음 | 되튐 금지. 스플래시 그림은 앱의 것이라 Qooroo는 그림 안에서 유지할 수 있다 |
| 우선순위 | 높은 쪽 | — | 높은 쪽 | 정산나우 그대로 |

**실물 기기 측정 (0.2.0).** 갤럭시 Z 폴드(SM-F971N, Android 17, 펼친 상태, 어두운 화면,
글자 배율 1.3)에서 catalog 앱을 여섯 번 콜드 스타트하고 `screenrecord`(초당 약 18프레임)로
녹화해 모든 프레임을 한 장에 모아 읽었다. 로고는 그려진 순간부터 자리에 닿을 때까지 모든
프레임에 있었다 — 로고 없는 프레임 0회. 위 규칙 9를 그대로 쓴 결과다. 표의 에뮬레이터
결과는 에뮬레이터에만 해당한다.

정산나우도 같은 기기에서 자기 앱을 쟀다(펼친 상태, 어두운 화면, 애니메이션 배율 1, 검수용
패키지를 따로 설치했다가 지움). `screenrecord` 초당 60장으로 여섯 번 녹화해 프레임마다 화면
가운데의 로고색 화소를 셌다. 여섯 번 모두 같은 순서였고 넘겨받는 순간 로고 없는 프레임은
없었다. 에뮬레이터에서 5회 중 2회 나오던 한 프레임 빔은 나오지 않았다. 창이 열리기 시작해
첫 화면이 다 나타날 때까지 약 1.35초였다(두 글자 약 0.15초와 0.17초, 멈춤 약 0.45초, 그다음
이동). 재지 못한 것: 밝은 화면, 애니메이션 없애기, 접은 화면, 로그인 후 도착.

화면 가운데만 세면 로고가 그 영역을 벗어나 이동할 때 화소 수가 0이 된다. 멈춤 구간 안의
0만 빈 프레임으로 센다.

**아이콘 없는 스플래시.** 런처가 아닌 곳(다른 앱, 알림, 일부 버전에서
`--splashscreen-show-icon` 없는 `adb`)에서 앱을 열면 안드로이드는 아이콘 없는 스플래시를
그린다. 화면에 없던 로고가 갑자기 나타나 날아가면 안 되므로, 스플래시 뷰에 물어보고 그
답을 넘긴다.

```kotlin
setOnExitAnimationListener { provider ->
    val shown = splashShowedMark(provider.view)
    provider.remove()
    handoff.release(markShown = shown)   // false면 덮개만 걷힌다
}
```

단위 테스트로만 확인했다. 시험 기기는 시도한 모든 실행 경로에서 아이콘을 보여 주었다.

### 2.3 화면 전환

코드: `DdsScreenMotion(move)`, `Modifier.ddsScreenContent()`, `DdsMove`.

18. **내용 영역만 움직인다.** 상단 바, 제목, 아래 탭은 움직이지도 흐려지지도 않는다.
19. **이전 화면은 즉시 걷는다.** 걷은 빈 자리 위로 화면 전체를 흐리게 나타내면
    "깜빡임"으로 읽힌다(정산나우가 2026-11-08에 고친 문제. Qooroo의 전체 화면 fade
    200/150이 같은 방식이라 이쪽으로 맞춘다).
20. **불투명도는 100ms 안에 끝낸다.** 밀기가 끝날 때까지 흐리면 빈 화면처럼 보인다.
21. **계정·소속이 바뀔 때는 움직임 없이 즉시 바꾼다**(`DdsMove.None`).
22. 화면을 돌리거나 복원할 때는 다시 들어오지 않는다.

| 이동 | 나타남 | 밀기 |
| --- | --- | --- |
| 앞으로(`Push`) | 100ms | 뒤쪽 가장자리에서 24dp, 300ms |
| 뒤로(`Pop`) | 100ms | 앞쪽 가장자리에서 24dp, 200ms |
| 탭(`Tab`) | 즉시 | 없음 — 이전 탭은 즉시 걷히므로, 흐리게 나타내면 빈 화면 위로 나타나 탭을 누를 때마다 깜빡임으로 읽힌다(실물 기기에서 확인, 0.3.0) |
| 없음(`None`) | 즉시 | — |

```kotlin
// 내비게이션 호스트 자체의 전환은 끈다(None).
key(entry) {
    DdsScreenMotion(move) {                       // 이 화면에 어떻게 왔는지
        Scaffold(topBar = { … }, bottomBar = { … }) { padding ->
            Column(Modifier.padding(padding).ddsScreenContent()) { … }   // 움직이는 부분
        }
    }
}
```

### 2.3.1 뒤로 가기와 앱 종료 (0.3.0)

폰에서 뒤로 가기는 이동 수단이다. 다른 탭으로 옮긴 뒤 뒤로를 눌렀는데 앱이 닫히면 고장으로
읽힌다("메뉴 이동한 다음에 백버튼 누르면 그냥 나가버려").

- **뒤로는 뒤로 간다.** 먼저 이전 화면, 그다음 직전에 보던 탭. 탭은 한 번씩만 기억해서
  두 탭 사이를 오가지 않는다.
- **말없이 종료하지 않는다.** 더 돌아갈 곳이 없거나 600ms 안에 뒤로를 두 번 누르면
  "앱을 종료할까요?"를 묻고, 예일 때만 종료한다.
- **입력이 막힌 화면(잠금)에서는 뒤로를 가로채지 않는다.** 다이얼로그나 시트가 열려
  있을 때도 그렇다 — 그것들은 스스로 닫힌다.
- **스크롤 상태는 걷히는 화면 바깥에 둔다.** `DdsScreenMotion`으로 감싼 화면은 걷혔다가
  다시 그려진다. 그 안의 `rememberScrollState()`는 사라지고, 돌아오면 맨 위로 간다. 스크롤
  상태를 내비게이션 항목 단위로, 걷히는 부분 바깥에서 잡아 내려 준다.

```kotlin
val trail = rememberDdsTabTrail(startTab = 0)
var asking by rememberSaveable { mutableStateOf(false) }
DdsBackHandler(
    trail = trail,
    canPop = navController.previousBackStackEntry != null,
    onPop = { navController.popBackStack() },
    onTab = { tab -> showTab(tab) },               // trail은 이미 갱신돼 있다
    onAskToExit = { asking = true },
    enabled = !asking,
)
DdsScaffold(
    selectedIndex = trail.current ?: 0,
    onSelect = { tab -> trail.visit(tab); showTab(tab) },   // 탭을 누를 때마다 trail에 알린다
    …
)
```

처리기는 뒤로 갈 때만 trail을 움직인다. 탭을 누를 때 `trail.visit(tab)`을 부르지 않으면
trail에는 항목이 하나뿐이라 뒤로가 항상 종료를 묻는다.

코드: `rememberDdsTabTrail()`, `DdsBackHandler(trail, canPop, onPop, onTab, onAskToExit)`,
규칙 자체는 함수 하나 `ddsBackAction()`. 질문은 앱의 문구를 넣은 `DdsDialog`다. 600ms는
`tokens/native.json`의 `motion.back.double-press`다.


### 2.4 목록과 작은 움직임

23. **목록 항목은 30ms씩 늦게 나타나고 앞 6개까지만 늦춘다**(최대 180ms). 긴 목록이
    줄줄이 흘러내리지 않는다. 크기와 자리는 그대로이고 나타나기만 한다.
    `Modifier.ddsAppear(index)`. 스크롤로 나갔다 돌아온 항목은 다시 나타나지 않는다.
24. 내용이 바뀐 안내는 `Modifier.ddsAppear(key = message)`로 다시 나타나게 한다.
25. 접기·펼치기는 펼칠 때 200ms `Standard`, 접을 때 200ms `Exit` + 사라짐 100ms.

### 2.5 불러오기와 새로고침

코드: `DdsBusyBar`, `DdsLoadingRows`, `DdsPullRefresh`.

26. **진행 표시줄은 내용 위에 겹쳐 그린다.** 작업이 시작하고 끝날 때 내용이 밀려
    내려가지 않는다. 150ms로 나타나고 100ms로 사라진다.
27. **첫 불러오기에는 움직이지 않는 자리 표시를 쓴다.** 답이 오기 전에 "없습니다"
    같은 문구가 잠깐 보이지 않게 한다.
28. **당겨서 새로고침은 그 화면의 새로고침 버튼과 같은 동작이다.** 버튼은 그대로
    둔다. 실제 작업이 끝날 때까지 표시하고, 고정 시간 뒤에 닫지 않는다. 다른 작업
    중이거나 메뉴가 열려 있으면 무시한다.
29. **당겨서 불러오는 동안에는 진행 표시줄을 겹쳐 보이지 않는다**(`onPulling`).

```kotlin
DdsPullRefresh(busy = state.busy, onRefresh = { refresh() }, onPulling = { pulling = it }) {
    Column(Modifier.verticalScroll(…)) {
        if (state.firstLoad) DdsLoadingRows(description = "불러오는 중") else List(state.items)
    }
    DdsBusyBar(busy = state.busy && !pulling)
}
```

### 2.6 로고, 아이콘, 창

30. 앱 안 로고는 바탕 네모 없이 로고만 그리고, 색은 `bg.brand`를 따른다.
31. 홈 화면 아이콘은 적응형 아이콘에 단색 레이어를 둔다.
32. 창 바탕색은 앱 바탕색(`@color/dds_color_bg_default`)과 같게 한다.

### 2.7 움직임 줄이기

`isReducedMotion(context)` / `rememberReducedMotion()` — 시스템의 "애니메이션 삭제"
(애니메이터 배율 0). `[명세 §3.6]`

- Compose는 이때 자기 애니메이션을 즉시 끝낸다. 도우미가 추가로 하는 일: 화면 밀기와
  목록 순차 등장을 건너뛰고, 스플래시를 붙잡지 않고, 로고를 옮기지 않는다.
- 스플래시는 완성된 로고 정지 → 이동 없이 바로 첫 화면.
- 상태를 움직임만으로 전하지 않는다. 문구와 아이콘이 함께 있다.

### 2.8 확인 방법

움직임은 코드만 읽어서는 확인되지 않는다. 다음을 직접 본다.

1. **콜드 스타트를 밝은 화면, 어두운 화면, "애니메이션 삭제" 세 가지로 본다.**
   로고가 없는 프레임이 있는지, 스플래시의 로고 자리와 첫 화면이 이어 그린 로고
   자리가 같은지 본다.
2. **느리게 본다.** `adb shell settings put global animator_duration_scale 10`으로
   이동을 10배 늘린 뒤 연속으로 화면을 잡으면 이동 중간 장면이 잡힌다(끝나면 1로 되돌린다).
3. **시계를 멈추고 프레임을 넘긴다.** Compose 테스트에서 `mainClock.autoAdvance = false`로
   두고 50ms씩 넘기며 화면을 저장하면 같은 결과가 다시 나온다(정산나우 `JnMotionTest`).
   단, 시계를 멈춘 상태에서 탭을 바꾼 뒤 다음 조작이 멈추는 경우가 있어 그 테스트는 실시간으로 돌린다.
4. 에뮬레이터 녹화는 `adb emu screenrecord`를 쓴다. 기기 부하가 높으면 부드러움은
   판단하지 않는다(프레임 순서와 자리만 본다).
5. **명령마다 기기 일련번호를 지정한다**(`adb -s emulator-55xx`, 테스트는 `ANDROID_SERIAL`).
   지정하지 않으면 연결된 실제 폰에 설치된다(Qooroo가 겪음).
6. 화면 전환: 상단 바와 아래 탭이 프레임 사이에 한 픽셀도 움직이지 않는지 본다.
7. 글자 배율 200%와 큰 글자 모드에서 잘림이 없는지 본다.

`android/catalog` 앱의 Motion 화면에 이 절의 동작이 모두 들어 있다.

## 3. 색

### 3.1 브랜드 색 덮어쓰기 `[명세 §3.1, D-010, D-012]`

웹과 같은 규약이다. **앱이 바꿀 수 있는 것은 브랜드 조각 여섯 토큰뿐**이고 이름과
개수가 웹과 같다. 아무것도 넘기지 않으면 DDS 기본 색이다.

| 토큰 | 안드로이드 리소스 | 제품이 정하는 것 |
| --- | --- | --- |
| `color.bg.brand` | `dds_color_bg_brand` | 메인 색. 채워진 브랜드 면 |
| `color.bg.brand-hover` | `dds_color_bg_brand_hover` | 누르는 동안의 색 |
| `color.bg.brand-subtle` | `dds_color_bg_brand_subtle` | 옅은 브랜드 배경 |
| `color.text.on-brand` | `dds_color_text_on_brand` | 그 면 위의 글자 |
| `color.text.brand` | `dds_color_text_brand` | 브랜드 글자·링크·선택된 아이콘 |
| `color.border.focus` | `dds_color_border_focus` | 포커스 링 |

**덮어쓰는 방법.** 웹이 `[data-brand]` 아래에서 CSS 변수를 다시 정하듯, 앱은 같은
이름의 색 리소스를 자기 `res/values`(어두운 화면용은 `res/values-night`)에 다시 정한다.
안드로이드는 앱의 리소스를 라이브러리 것보다 우선한다.

```xml
<!-- 정산나우 app/src/main/res/values/dds_brand.xml — 메인 색은 JN 로고색 -->
<resources>
    <color name="dds_color_bg_brand">#0891B2</color>
</resources>
```

이 한 곳에서 스플래시(XML), 창 바탕, 로고, 그리고 Compose(`DdsTheme`의 기본값이 이
리소스를 읽는다)가 함께 바뀐다. 버튼, 선택 표시, 강조, 로고가 모두 따라간다.

밝은 화면과 어두운 화면에서 같은 값인 토큰(`bg_brand`, `bg_brand_hover`,
`text_on_brand`)은 `res/values`에 한 번만 적으면 두 화면에 모두 적용된다. 어두운
화면 값이 따로 있는 토큰(`bg_brand_subtle`, `text_brand`, `border_focus`)을 바꾸려면
`res/values-night`에도 적는다. 적지 않으면 그쪽은 DDS 기본값이 남는다.
이 파일은 앱에서 hex를 적어도 되는 유일한 곳이다(웹의 `brand.ts`와 같은 자리).

코드로 넘길 수도 있다(`DdsTheme(brand = DdsBrand(light = …, dark = …))`). 이 경우 XML
리소스는 바뀌지 않으므로 스플래시는 기본 색으로 남는다. 리소스 방식을 권한다.

**글자색은 규칙이 정한다.** `[명세 §3.1 on-brand 노트]` 채워진 브랜드 면 위의 글자는
4.5:1을 넘어야 한다. 밝은 면은 어두운 글자, 어두운 면은 흰 글자다.

- `#0891B2` 위: 흰 글자 3.7:1(미달), `zinc.950` 5.7:1(통과). 기본값이 `zinc.950`이므로
  정산나우는 `on-brand`를 따로 적지 않아도 된다.
- 어두운 메인 색을 쓰는 앱은 `dds_color_text_on_brand`를 흰색으로 다시 정한다. 코드에서는
  `onBrandFor(bgBrand)`가 규칙대로 골라 준다.
- **규칙을 어긴 브랜드는 `DdsTheme`이 거부한다.** 다음 세 쌍 중 하나라도 4.5:1에 못
  미치면 예외가 나고 메시지에 잰 값이 나온다: 면 위 글자, 화면 바탕 위 브랜드 글자,
  옅은 브랜드 배경 위 브랜드 글자.

나머지 다섯 값을 메인 색에서 어떻게 정하는지는 웹에도 규칙이 없다(제품이 직접
고른다). §10의 1번.

**덮어쓸 수 있는 것과 고정인 것.**

| 덮어쓸 수 있다 | 가족 공통으로 고정 |
| --- | --- |
| 브랜드 조각 여섯 토큰 | 중립 바탕·글자·선, 상태색 네 쌍, 글자 단계, 간격, 둥글기, 컨트롤 높이, 모션 값, 터치 크기 |

### 3.2 색을 쓰는 법 `[명세 §3.1]`

- 화면 바탕 `bg.default`, 묶음 배경 `bg.subtle`, 카드·시트·다이얼로그 `bg.elevated`.
- 글자 `text.primary` / `text.secondary` / `text.muted`(비활성·플레이스홀더).
- 선 `border.default`(카드 가장자리·구분선), `border.strong`(입력칸).
- **주 버튼은 `bg.brand` 면 + `text.on-brand` 글자. 밝은 화면과 어두운 화면에서 같은 색이다.**
- 브랜드 글자·링크·선택 표시는 `text.brand`, 옅은 강조 바탕은 `bg.brand-subtle`.
- 누름·hover 틴트는 알파로만. `opacity`는 비활성에만.
- 상태색 네 쌍은 진한 전경 + 옅은 배경으로만 쓴다. 색만으로 상태를 전하지 않는다. `[명세 §6]`

### 3.3 Material3 역할에 대응시키는 법 (모바일에만 있는 것)

Material3의 `primary`는 채움 면과 글자색을 겸하는데 DDS는 둘을 `bg.brand`와
`text.brand`로 나눈다. 그래서 `primary`에는 글자용 색을 넣고, 채움 면은
`DdsTheme.colors.bgBrand`를 직접 쓴다.

| Material3 역할 | DDS 토큰 | 밝은 | 어두운 |
| --- | --- | --- | --- |
| `primary` / `onPrimary` | `text.brand` / 대비로 고름 | cyan.700 / white | cyan.400 / zinc.950 |
| `primaryContainer`, `secondaryContainer` | `bg.brand-subtle` | cyan.50 | cyan.900 |
| `inversePrimary` | 반대 테마의 `text.brand` | cyan.400 | cyan.700 |
| `background`, `surface` | `bg.default` | white | zinc.950 |
| `surfaceContainer`, `-Low`, `-High` | `bg.elevated` | white | zinc.900 |
| `surfaceDim`, `surfaceContainerHighest` | `bg.subtle` | zinc.50 | zinc.900 |
| `surfaceVariant` | `border.default` | zinc.200 | zinc.800 |
| `onSurface`, `onBackground` | `text.primary` | zinc.950 | zinc.50 |
| `onSurfaceVariant`, `secondary` | `text.secondary` | zinc.600 | zinc.400 |
| `outline` / `outlineVariant` | `border.strong` / `border.default` | zinc.300 / zinc.200 | zinc.700 / zinc.800 |
| `error` / `onError` | `status.danger` / `text.on-status` | red.700 / white | red.300 / zinc.950 |
| `errorContainer` / `onErrorContainer` | `status.danger-bg` / `status.danger` | red.50 / red.700 | red.900 / red.300 |
| `inverseSurface` / `inverseOnSurface` | `bg.inverse` / `text.on-inverse` | zinc.900 / zinc.50 | zinc.50 / zinc.950 |
| `scrim` | `overlay.dim` | 검정 25% | 검정 25% |
| `surfaceTint` | 투명 | — | — |

- `surfaceVariant`가 `bg.subtle`이 아닌 이유: 어두운 화면에서 `bg.subtle`과
  `bg.elevated`가 같은 색이고, Material은 `Surface`의 글자색을 배경색으로 찾는다.
  둘이 같으면 카드 글자가 보조색으로 떨어진다(테스트로 고정).
- `secondaryContainer`는 Material이 **선택 표시**(아래 탭의 알약, 선택된 칩)에 쓰므로
  옅은 브랜드 배경이다. Material은 같은 역할을 진행 표시·슬라이더의 트랙에도 쓰는데,
  밝은 화면에서는 너무 옅다. 트랙에는 `trackColor = DdsTheme.colors.borderDefault`를
  넘긴다(`DdsBusyBar`가 그렇게 한다).

> D-049(안드로이드 0.2.1)부터 상태색 네 쌍이 두 테마 모두에서 4.5:1을 넘는다. 어두운 화면의
> 위험·정보 글자를 한 단계 밝혔고, 테스트가 이 선을 지킨다.

## 4. 글자 `[명세 §3.2]`

| 스타일 | 크기/줄높이(sp) | 굵기 | 쓰임 | Material3 칸 |
| --- | --- | --- | --- | --- |
| `display` | 32 / 40 | 700 | 큰 숫자 | display*, headlineLarge |
| `title1` | 24 / 32 | 700 | 화면 제목 | headlineMedium |
| `title2` | 20 / 28 | 600 | 섹션·다이얼로그 제목, 상단 바 | headlineSmall, titleLarge |
| `title3` | 17 / 24 | 600 | 카드 제목 | titleMedium |
| `body1` | 16 / 24 | 400 | 본문 | bodyLarge |
| `body2` | 14 / 20 | 400 | 밀도 높은 본문 | bodyMedium |
| `label` | 13 / 16 | 500 | 버튼, 입력 라벨, 탭 | titleSmall, labelLarge |
| `caption` | 12 / 16 | 400 | 시각, 보조 정보 | bodySmall, labelMedium, labelSmall |

- 이 표 밖의 크기는 쓰지 않는다. 크기와 줄높이는 한 세트다. 본문은 14 이상, `caption`은 본문에 쓰지 않는다.
- 숫자가 중요한 곳은 고정폭 숫자를 켠다(`fontFeatureSettings = "tnum"`).
- 한글은 띄어쓰기에서만 줄을 바꾼다(`"…".keepWords()`) — 웹의 `keep-all`과 같은 결과.
- 단위는 sp다(웹의 px·RN의 pt와 같은 숫자). 시스템 글자 배율을 그대로 따른다.
- 모바일에만 있는 것: 글꼴은 Pretendard 하나(§9), Material3 칸 대응, 큰 글자 모드(§10의 7번).

## 5. 간격·둥글기·높이

| 값 | 토큰 | dp | 출처 |
| --- | --- | --- | --- |
| 간격 | `DdsSpace.s4 … s64` | 0 2 4 8 12 16 20 24 32 40 48 64 | `[명세 §3.3]` |
| 둥글기 | `DdsRadius.sm / md / lg / xl` | 4 / 8 / 12 / 16 — 태그 / 버튼·입력 / 카드·다이얼로그 / 시트 | `[명세 §3.4]` |
| 선 | `DdsBorder.hairline / focus` | 1 / 2 | `[명세 §6]` |
| 버튼 | `DdsControl.sm / md / lg` | 40 / **48** / 56 | §10의 2번 |
| 입력칸 | `DdsField.height` | 56 | §10의 2번 |
| 목록 행 | `DdsRow.min / twoLine` | 56 / 72 | §10의 2번 |
| 상단 바 / 아래 탭 | `DdsBar.top / bottom` | 64 / 80 | §10의 2번 |
| 화면 여백 / 블록 사이 | `DdsScreen.gutter / gutterWide / blockGap` | 16 / 24(폭 600 이상) / 24 | §10의 2번 |
| 최소 터치 | `DdsTouch.min / large` | 48 / 56 | §9 |

- **버튼 높이는 48 하나다.** `lg`(56)는 화면 맨 아래의 주 버튼 하나에만 쓴다.
- 높이는 전부 **최소 높이**다. 글자가 커지면 컨트롤이 커진다.
- 한 줄에 놓인 버튼은 같은 높이다. 한 줄에 들어가지 않으면 줄이지 말고 세로로 쌓는다.
- 카드는 `bg.elevated` 면 + 1dp `border.default` 선 + 둥글기 12 `[components 카드]`. 그림자는 §9.

## 6. 아이콘 `[명세 §3.7]`

24 그리드, 선 1.6, 둥근 끝, 색은 주변 글자색을 따른다. 아이콘만 있는 버튼은 설명
문구가 필수다 `[명세 §6]`.

Compose 벡터는 `dds-icons`의 SVG에서 **생성**한다(`node scripts/generate-android-icons.mjs`,
`pnpm run check`가 어긋남을 검사). 그래서 두 플랫폼이 같은 모양을 그린다:
`DdsIcons.Search`, `DdsIcons.ArrowLeft`(오른쪽→왼쪽 배치에서 좌우 반전) 등.
`DdsIcon(icon, contentDescription)`으로 그리고, 크기는 `DdsIcon.md`(24)나 `sm`(20), 색은
주변 내용 색이다.

## 7. 시스템 바 (모바일에만 있는 것)

화면 끝까지 그린다(`enableEdgeToEdge`). 상태 바와 내비게이션 바는 투명이고, 아이콘
밝기는 **보이는 테마**를 따른다. 테마에는 `@bool/dds_light_system_bars`를 쓴다.

## 8. 접근성 `[명세 §6]`

- 글자 대비 4.5:1, 큰 글자·UI 요소 3:1.
- 터치 48dp 이상(§9).
- 아이콘만 있는 버튼은 설명 문구가 필수다.
- 색만으로 상태를 전하지 않는다. 선택된 탭은 알약 면, 색, 굵기가 함께 바뀐다.
- 움직임 줄이기 존중(§2.7).
- 포커스 표시는 2dp `border.focus` 링이다.
- 시스템 글자 배율 200%에서 잘리지 않는다. 한 줄 고정인 곳(아래 탭 라벨)은 말줄임으로 둔다.

## 9. 모바일이라서 달라질 수밖에 없는 것

| 항목 | 웹 | 안드로이드 | 이유 |
| --- | --- | --- | --- |
| 터치 크기 | 44(모바일) | 48 | 안드로이드 접근성 기준과 Material3 기본값. 44를 넘는다 |
| hover | 있음 | 없음. `brand-hover`는 누름 색 | 터치 화면 |
| 누름 반응 | 색 변화 | 물결 | 플랫폼 관례 |
| 글꼴 | 라틴 Geist + 한글 Pretendard | Pretendard | Compose는 글꼴을 굵기로 고른다. 두 글꼴을 한 묶음에 넣으면 첫 글꼴만 쓰인다 |
| 드문 한글 음절 | 전부 Pretendard | KS X 1001 밖의 음절은 시스템 글꼴 | 글꼴 파일을 굵기당 약 0.5MB로 줄였다 |
| 색 역할 | CSS 변수 | Material3 역할 대응표(§3.3) | Material 부품이 역할로 색을 읽는다 |
| 브랜드 덮어쓰기 | `[data-brand]` CSS | 같은 이름의 색 리소스 | 플랫폼의 덮어쓰기 수단이 다르다. 토큰 여섯 개와 이름은 같다 |
| 시스템 바 | — | 투명, 화면 끝까지 | 플랫폼 관례 |
| 뒤로 가기 | 브라우저 | 시스템 뒤로 | 플랫폼 관례 |
| 모달 | Dialog | 선택·작업 메뉴는 아래 시트, 확인은 Dialog | `[명세 §5]` 역할 대응 |
| 포커스 링 | 키보드 `focus-visible` | 키보드·D패드 포커스 | 터치에는 포커스가 없다 |
| 버전 | 웹 패키지 전체가 한 버전 | 안드로이드만 따로 | D-048 |

## 10. 웹 DDS 규칙에 없어서 정해야 하는 것

아래는 웹 명세에 규칙이 없다. 안드로이드 패키지에는 "지금 넣어 둔 값"으로 들어가 있고, DDS
규칙으로 확정하는 것은 소유자 몫이다. 확정되면 `tokens/native.json`이나 명세를 고친다.

| # | 빠진 규칙 | 지금 넣어 둔 값 | 근거 |
| --- | --- | --- | --- |
| 1 | 메인 색 하나에서 나머지 다섯(누름, 옅은 배경, 브랜드 글자, 포커스, 어두운 화면용)을 정하는 법 | 없음 — 웹처럼 제품이 직접 정한다. 적지 않은 값은 DDS 기본값 | 웹에는 asklinq·booklinq 예시만 있다. 정산나우는 메인 색이 DDS와 같은 색 계열이라 한 줄로 충분하다 |
| 2 | 터치 화면의 컨트롤 높이, 입력칸, 목록 행, 바 높이, 화면 여백 | 40·48·56 / 56 / 56·72 / 64·80 / 16·24 | 웹 버튼은 32·40·48. 세 앱과 Material3 기본값 |
| 3 | 150ms, 순차 30ms × 6, 밀기 24dp, `Travel` 이징, 스플래시 150ms·1초 | 정산나우 확정값 | 웹 토큰에는 100·200·300과 이징 셋만 있다 |
| 4 | 자리 표시가 움직이는가 | 정지 | 웹은 1600ms로 맥동한다. 정산나우·Qooroo는 정지 |
| 5 | 카드 그림자 | 없음, 선만 | 웹은 `elevation.1`. 세 앱 모두 그림자를 쓰지 않는다 |
| 6 | 모바일 글꼴 | Pretendard 하나 | §9 |
| 7 | 큰 글자 모드의 글자 표와 터치 56 | 정산나우 시니어 모드 값 | 웹에는 없는 기능 |
| 8 | 아래 탭의 선택 표시, 바와 내용의 구분 | 알약(`bg.brand-subtle`) + `text.brand` + 굵기 600, 1dp 선 | 웹 Tabs는 밑줄. 선택 표시가 약하다는 지적 |
| 9 | Material3 역할 대응표 | §3.3 | 웹에는 대응할 것이 없다 |
| 10 | 어두운 화면 상태색 대비 | **토큰에서 고쳤다(D-049):** 위험 `red.300`(5.28:1), 정보 `blue.300`(5.74:1) | 3.62:1과 4.07:1로 명세 §6의 4.5:1에 못 미쳤다. 웹도 같았다 |
| 11 | 다이얼로그·시트가 나타나는 모션 | Material3 기본 | Qooroo 문서는 다이얼로그에 크기 0.98→1을 쓴다. "크기는 바꾸지 않는다"와 맞는지 정해야 한다 |
| 12 | 비활성 표현 | DDS 부품은 불투명도 0.45(웹 `button.css`의 값). 직접 쓰는 Material3 부품은 자기 값 38% | 명세는 `opacity`를 비활성에만 쓴다고만 한다. 숫자는 토큰이 아니라 CSS에 있다 |
| 13 | 진동 피드백을 언제 쓰는가 | 규칙 없음 | Qooroo만 쓴다 |
| 14 | 입력칸 안 글자 크기 | `body1`(16) | 옆에 놓이는 목록 행과 같은 크기 |
| 15 | 폼에서 입력칸 사이 간격 | 16(catalog에서 쓴 값, 토큰 아님) | 웹의 폼 간격은 제품이 정한다 |
| 16 | 웹에는 있고 안드로이드에는 아직 없는 부품 | 날짜·시간 선택은 Material3 기본 | §12 |
| 17 | 뒤로 가기와 앱 종료 | 이전 화면 → 직전 탭 순으로 돌아가고, 종료는 묻는다. 600ms 안에 두 번 누르면 묻는다 | §2.3.1. 정산나우의 동작 |
| 18 | 탭 전환의 움직임 | 없음 | §2.3. 150ms 페이드가 실물 기기에서 깜빡임으로 읽혔다 |

**항목별 상태 (2026-11-10).**

- **소유자가 직접 고른 것:** 4번(자리 표시는 멈춰 있다), 5번(카드는 테두리만으로 구분하고
  그림자를 쓰지 않는다), 10번(어두운 화면의 위험·정보 색이 4.5:1을 넘도록 토큰 값 자체를
  고친다 — D-049에서 웹과 안드로이드를 함께 고쳤다).
- **"지금 값 그대로"로 추천해 소유자에게 보여 주었고 아직 이의가 없는 것:** 1, 2, 3, 6, 7, 8,
  9, 12, 13번, 그리고 11번은 "Material3 기본 유지, 다이얼로그에 크기 변화를 넣지 않는다".
  소유자가 확정하기 전까지는 확정된 규칙이 아니다.
- **아직 소유자에게 묻지 않은 것:** 14, 15, 16번(0.2.0 부품과 함께 추가), 17·18번(0.3.0,
  소유자가 정산나우를 폰에서 쓰며 한 말에서 나왔다 — 숫자는 제안값이다).

## 11. 기존 앱을 옮기는 순서

1. 의존성 추가. `dds-compose`가 글꼴 여섯 파일(Pretendard 넷, Geist Mono 둘, 합쳐 약
   2.0MB)을 싣는다. **앱이 가지고 있던 같은 글꼴 파일은 지운다** — 두 벌이 들어가면 그만큼
   배포 파일이 커진다.
2. 브랜드: 메인 색을 `res/values/dds_brand.xml`에 적는다(기본 색을 쓰면 생략).
3. 앱 테마를 `DdsTheme`으로 교체.
4. `res/values*`의 hex를 `@color/dds_*`로 교체(스플래시, 창 배경, 로고).
5. 모션 상수와 도우미를 `DdsMotion`, `DdsScreenMotion`, `ddsAppear`, `DdsSplashHandoff`,
   `DdsBusyBar`, `DdsLoadingRows`, `DdsPullRefresh`로 교체. §2.8대로 확인한다.
6. 화면마다 높이·둥글기·간격 숫자를 `DdsControl`, `DdsRadius`, `DdsSpace`로 교체.
   주 버튼은 `bgBrand` + `textOnBrand`.
7. **Material3 색 역할을 직접 쓰던 곳을 고친다.** 값이 DDS 대응으로 바뀌면서 아래 넷은
   옮긴 직후 화면이 깨진다(정산나우가 캡처로 찾았다).

   | 쓰던 방식 | 옮긴 뒤 보이는 것 | 고치는 법 |
   | --- | --- | --- |
   | `colorScheme.surface`를 카드 면으로 | 카드가 사라진다(`surface` = 화면 바탕) | `bgElevated` 면 + 1dp `borderDefault` 선 |
   | `surfaceContainer`를 옅은 칩·안내 바탕으로 | 밝은 화면에서 바탕이 사라진다. 어두운 화면에서는 `bgSubtle`도 카드 면과 같은 색 | 중립 칩에는 1dp 선을 둔다 |
   | `surfaceVariant`를 면으로 | 선 색이 면에 깔린다 | `bgSubtle` |
   | `primary`를 채움 면, `onPrimary`를 그 위 글자로 (버튼, FAB, 큰 선택 타일, 버튼 안 진행 표시) | 글자용 색이 면에 깔린다 | `bgBrand` / `textOnBrand` |

   `DdsCard`, `DdsChip`, `DdsNotice`, `DdsButton`(§12)이 이 넷을 흡수한다.
8. 앱에 "브랜드 파일 밖에서는 hex와 `Color(0x…)`를 쓰지 않는다" 검사를 추가
   (`scripts/check-android-sources.mjs` 참고).

## 12. 부품

부품은 생성된 값만 읽고 위 규칙을 품고 있다. 부품으로 짠 화면에는 높이·둥글기·색을 따로
적을 일이 없다. `android/catalog`의 Parts 탭이 전부를 보여 준다. 웹에 대응하는 부품이
있으면 이름을 적었다.

| 부품 | 고정해 주는 것 | 웹 |
| --- | --- | --- |
| `DdsButton` (`Primary` / `Secondary` / `Ghost` / `Danger`, `Sm` 40 / `Md` 48 / `Lg` 56), `DdsIconButton` | 높이 하나, `bg.brand` + `text.on-brand`, 진행 중에도 크기 그대로이고 흐려지지 않는다, 비활성 0.45, 2dp 포커스 링, 아이콘 버튼은 설명 문구 필수에 터치 48 | Button `[명세 §4.2]` |
| `DdsTextField` | 라벨은 위(떠다니는 라벨 없음), 높이 56, 메시지 줄을 항상 비워 두어 오류가 떠도 폼이 밀리지 않는다, 오류는 읽어 준다 | Field, Input |
| `DdsCheckbox`, `DdsRadio`, `DdsSwitch` | 행 전체가 터치 영역(48 이상), 상태를 읽어 준다 | Checkbox, Radio, Switch |
| `DdsCard`, `DdsSection`, `DdsDivider`, `DdsListRow` | `bg.elevated` + 1dp 선 + 둥글기 12, 그림자 없음. 섹션 제목은 제목으로 읽힌다. 행은 56 또는 72 | Card |
| `DdsNotice`, `DdsBadge`, `DdsChip` | 뜻마다 아이콘과 색 쌍이 다르다. 배지는 점으로 상태를 한 번 더 알린다. 중립은 선을 둔다 | Alert, Badge, Tag |
| `DdsEmptyState`, `DdsSpinner` | 점선 테두리, 제목, 한 문장, 동작은 많아야 하나 | EmptyState, Spinner |
| `DdsTopBar`, `DdsBottomBar`, `DdsNavRail`, `DdsScaffold` | 바는 고정이고 1dp 선으로 구분한다. 600dp 미만은 아래 탭, 600dp부터 레일. 선택은 알약·색·굵기가 함께 바뀐다 | — (모바일에만) |
| `DdsDialog` | 결정을 확인한다. 둥글기 12, `bg.elevated` | Dialog |

캡처(밝은 화면, 어두운 화면, 글자 200%, 큰 글자, 넓은 화면)를 읽고 나온 규칙:

- **한 줄에는 한 높이.** `Sm` 버튼을 `Md` 버튼 옆에 두지 않는다.
- **줄이 바뀔 수 있는 글은 어절 사이에서 끊는다.** 한글 단어 중간에서 끊지 않는다. 부품은
  글을 `keepWords()`에 통과시킨다. 직접 그리는 글에도 똑같이 한다.
- **목록 행 제목은 큰 글자에서 두 줄까지** 간다. 보조 줄도 그렇다.
- **입력칸 사이는 16.** 메시지는 자기 상자 4 아래에 있어서 그 입력칸의 것으로 읽힌다.
- 라디오 고리는 `text.brand`, 체크된 상자는 `bg.brand`를 쓴다. 가는 고리는 바탕과 3:1이
  필요한데 `bg.brand`는 흰 바탕에서 거기에 못 미친다.

**0.3.0에서 추가**

| 부품 | 고정해 주는 것 | 웹 |
| --- | --- | --- |
| `DdsSearchField` | 검색칸은 하나: 앞에 돋보기, 입력하면 지우기 버튼, 키보드의 검색 키로 실행. 라벨 줄도 메시지 줄도 없다 | — |
| `DdsSelectField` | 짧은 목록에서 고르는 칸은 하나: `DdsTextField`와 같은 상자와 줄, 시트가 열리고 고른 항목에 체크 | Select |
| `DdsValueRow` | 이름과 값 한 줄: 이름은 앞, 값은 끝 가장자리, 숫자는 고정폭, 줄마다 구분선 | — |
| `DdsTabs` | 화면 안에서 같은 것의 여러 보기: 브랜드 밑줄과 굵은 라벨 | Tabs |
| `DdsBottomSheet` | 선택과 작업 메뉴. 뒤로, 바깥 탭, 끌어내리기로 닫힌다. 위쪽 모서리 둥글기 16 | Sheet |
| `DdsMenu`, `DdsMenuItem` | 버튼에 붙어 열리는 짧은 메뉴. 지우는 항목은 위험색 | Menu |
| `DdsToastHost` | 스스로 사라지는 짧은 알림, 반전 면. 꼭 읽어야 하는 것에는 쓰지 않는다 | Toast |

- **글은 쓴 그대로 읽힌다.** `keepWords()`는 단어의 글자 사이에 보이지 않는 연결 문자를
  넣는다. 0.2.1까지는 그 글이 화면 낭독기와 테스트에도 그대로 전달됐다
  (`onNodeWithText("저장")`이 DDS 라벨을 찾지 못했다). 이제 부품은 묶은 글을 그리고 원문을
  알려 준다. 직접 그리는 글에는 `Text(label.keepWords(), Modifier.readAs(label))` — `readAs`는
  수정자 사슬의 맨 뒤에 둔다. 뒤에 적은 것의 접근성 정보를 대체하기 때문이다. DDS 라벨을
  `"…".keepWords()`로 찾던 테스트는 이제 원문으로 찾는다.
- **검색칸 하나, 선택칸 하나를 앱 전체에서 쓴다.** 같은 일을 하는 칸이 화면마다 다르게
  생기면 가장 먼저 눈에 띄는 불일치가 된다.

아직 없는 것: 날짜·시간 선택. `DdsTheme` 아래에서 Material3 부품을 쓴다.
