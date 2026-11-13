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
| `kr.devslab:dds-compose` | 테마, 브랜드, 모션·불러오기 도우미, 부품, 화면 틀(§13). 위 좌표를 함께 가져온다 |
| `kr.devslab:dds-compose-testing` | 앱의 기기 테스트 전용. `DdsFrameCheck`가 앱 화면을 틀에 대고 잰다(§13.6). 0.7.0부터 |

최소 Android 8(API 26). 사용법과 버전 규칙은 [`android/README.ko.md`](../android/README.ko.md).

---

## 1. 원칙

1. **값은 토큰에서만 온다.** 앱 코드에 hex, `Color(0x…)`, 높이·시간 숫자를 적지 않는다. `[명세 §1]`
2. **색은 `DdsTheme.colors`에서 읽는다.** 시맨틱 토큰만 쓴다. `[명세 §3.1]`
3. **어두운 화면은 같은 토큰의 다른 대응이다.** 부품이 테마로 갈라지지 않는다. `[명세 §3.1]`
4. **앱이 넘기는 것은 브랜드 색(여섯 토큰)과 바탕 셋뿐이다.** 나머지는 가족 공통이다. `[명세 §3.1, D-012, D-053]`
5. **움직임은 무엇이 바뀌었는지 알릴 때만 쓴다.** `[정산나우 모션 명세]`

## 2. 모션과 디테일

출처: 정산나우 `docs/jn-android-motion-2026-11-10.md`와 그 구현(커밋 `8f56362`),
Qooroo `docs/design/android/DESIGN.md` §5·§7·§9. 시간과 이징 중 100·200·300ms와
`standard`·`exit`는 웹 토큰과 같은 값이다 `[명세 §3.6]`.

### 2.1 값은 한 곳에만

| 이름 | 값 | 쓰임 |
| --- | --- | --- |
| `DdsMotion.Fast` | 100ms | 사라짐, 누름 반응 |
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
- **고르거나 누르거나 초점이 가서 바뀌는 색은 `Fast`에 걸쳐 바뀐다** — 칩, 버튼의 누름 색,
  입력칸 테두리, 탭 라벨(0.5.0). 웹의 `motion.duration.fast`, 100ms다. 웹은 칩·버튼·탭만 서서히 바꾸고
  입력칸 테두리는 바로 바꾼다. 기다리게 하는 것이 아니다. 누름은 이미
  일어났다.
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
    로고는 덮개 아래에서 바로 보인다. 덮개와 덮개의 로고는 한 장으로 합쳐서 걷는다. 따로
    흐리면 중간에 덮개 바탕이 로고에 비쳐서, 화면이 같은 자리에 그린 로고가 바탕색 쪽으로
    4분의 1쯤 변했다 돌아온다(정산나우가 실물 폰에서 확인. 0.5.0에서 고침, `SplashOverlayOnDeviceTest`).
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

코드: Navigation 3의 `NavDisplay`에는 `ddsScreenChange(move, reduced)`, 그리고 `DdsScreenMotion(move)`,
`Modifier.ddsScreenContent()`, `DdsMove`. 화면을 직접 바꾸는 앱은 `DdsScreenHost(screen, move) { … }`.

18. **화면이 바뀔 때는 언제나 두 화면이 겹쳐 있다 — 아무것도 없는 자리 위의 화면 하나가 아니다**
    (0.5.0). 앞으로 가거나 다른 탭으로 갈 때는 이전 화면이 그 자리에 그대로 그려진 채 새 화면이 그
    위로 나타난다. 뒤로 갈 때는 반대다. 떠나는 화면이, 아래에 이미 있는 돌아갈 화면 위에서 서서히
    사라진다(호스트가 화면을 그렇게 쌓는다). 어느 쪽이든 모든 프레임이 두 화면의 혼합이고 비는
    프레임이 없다. 그래서 화면을 흐리게 바꿀 수 있다.
19. **내용 영역만 민다.** 상단 바, 제목, 아래 탭은 움직이지 않는다. 두 화면에서 같은 바는 바뀌는
    동안 눈에 띄게 변하지 않는다. 같은 픽셀을 그 위에 다시 그리기 때문이다. 제목이 다르면 새
    제목으로 서서히 바뀐다.
20. **아무것도 없는 자리 위로 화면을 흐리게 나타내지 않는다.** 실물 폰에서 본 세 가지 문제는
    같은 문제였다 — 이전 화면이 이미 없었다. 걷은 빈 자리 위로 화면 전체를 흐리게 나타내면
    "깜빡임"으로 읽힌다(정산나우가 2026-11-08에 고친 문제. Qooroo의 전체 화면 fade 200/150이 같은
    방식이었다). 호스트가 항목을 바꾸는 동안 떠나는 항목을 비우면 상단 바까지 포함해 화면 전체가
    3~5프레임 비고, 어두운 화면에서는 이동할 때마다 흰 화면이 번쩍인다(0.3.0. "메뉴 이동할 때마다
    깜빡인다"가 이것이었다). 투명에서 시작하는 내용은 100ms여도, 이미 떠 있는 상단 바 아래의 내용
    자리를 약 8프레임 비웠다(60fps, 0.3.0). 0.3.0과 0.4.0은 페이드를 빼서 답했다. 0.5.0은 두 화면을
    함께 두는 쪽으로 답하고, 페이드가 돌아왔다.
20a. **모든 화면은 화면에 있는 동안 자기 아래를 가린다.** 화면마다 배경을 둔다(스캐폴드가 한다).
    떠나는 화면을 비우지 않는다 — 비운 화면은 비쳐 보이고, 전환은 다시 빈 자리 위의 페이드가 된다.
    계속 그리고, 더는 현재 화면이 아님을 알린다: `DdsScreenMotion(move, active = false)`. 불러오기나
    구독을 시작하기 전에 `LocalDdsScreenActive.current`를 읽는다. 떠나는 즉시 비워야 하는 화면에서
    나갈 때는 그 이동을 `DdsMove.None`으로 한다.
20b. **호스트에 전환을 줄 수 없는 곳에서는 흐리게 바꾸지 않는다.** `DdsScreenMotion(move)`만으로도
    내용은 첫 프레임부터 불투명한 채 밀린다.

**0.5.0에서 확인한 것.** 에뮬레이터에서 시계를 멈추고 프레임 단위로 쟀다. Navigation 3의
`NavDisplay`(1.1.2, 두 앱이 쓰는 버전) 안에서 아래 예시대로 연결하고(`NavDisplayOnDeviceTest`, 테스트
5개), 빨간 화면과 파란 화면 사이를 앞으로·뒤로·탭으로 바꿨다. 모든 프레임이 빨강과 파랑뿐이었고 그
뒤의 바탕은 한 번도 보이지 않았으며 여러 프레임이 둘의 혼합이었다. 내용은 앞으로 갈 때 뒤쪽에서,
뒤로 갈 때 앞쪽에서 밀려 들어왔다. `DdsScreenHost`에서도 같았고(`MotionOnDeviceTest`), 거기서는
앞으로 갈 때 이전 화면이 떠난다는 것을 전달받았고, 화면 낭독기에 보이지 않았으며, 덮인 뒤에
컴포지션에서 빠졌다. 뒤로 갈 때 떠나는 화면은 사라지는 동안 위에 있지만 눌리지 않았다. 액티비티가
다시 만들어진 화면은 다시 들어오지 않았고, 그 뒤에 돌아간 화면은 들어왔다(`RebuiltWindowTest`, 실제
재생성). 카탈로그에서는
애니메이션을 열 배 느리게 해 중간 프레임을 캡처해 보았다.

**0.5.0 실물 폰 측정.** 정산나우가 `NavDisplay`의 전환 설정 세 줄에 `ddsScreenChange`를 넣었다(SM-F971N,
Android 17, 접힌 화면 475×751dp, 어두운 화면, 글자 130%. 테스트가 시계를 한 프레임씩 진행하는 동안
60fps로 녹화하고 프레임마다 직전 프레임과 비교). 탭 5번, 열기 2번, 뒤로 2번에서, 바뀌는 도중 본문이
앞뒤 화면보다 덜 그려진 프레임이 없었고 번쩍임도 없었다. 탭은 약 150ms(9~10프레임)에 걸쳐 바뀌었다.
0.4.0은 한 프레임에 바뀌었다. 열 때는 새 화면이 이전 화면 위로 약 100ms 겹쳐 나타나고 내용이 뒤쪽
가장자리에서 밀려 들어왔다. 뒤로 갈 때는 돌아간 화면의 내용이 앞쪽 가장자리에서 밀려 들어왔다. 로고를
그리는 화면에서 도착 자리를 떼고 보면, 덮개가 걷히는 9프레임 내내 로고의 밝기가 그대로였다(14번 규칙).
0.4.0에서는 4분의 1쯤 내려갔다. 스스로 진행하는 시계로 도는 테스트는 실제 시간으로는 한 프레임 안에
전환이 끝나서 녹화해도 아무것도 보이지 않는다. 시계를 한 프레임씩 진행한다. 재지 못한 것: 뒤로 쓸어
넘기기(이 폰은 버튼 3개 방식), 접고 펴기·돌리기의 프레임, 레일이 있는 펼친 화면, 밝은 화면.

**Navigation 3에서 뒤로 가기가 다시 밀린다**(0.5.0). 0.2.0~0.4.0에서는 밀리지 않았다. Navigation
3은 뒤로 돌아간 화면에 저장해 둔 상태를 돌려주는데, 화면이 그것을 "이미 도착함"으로 읽었다(Qooroo에서
발견). 이제는 창을 보고 가른다. 이미 화면을 보여 준 적이 있는 창은 사람이 돌아다니는 중인 창이므로
거기에 나타나는 화면은 도착이다. 다시 만들어진 창이 처음 보여 주는 화면은 그냥 거기 있다.

**0.4.0 실물 폰 측정.** 정산나우가 자체 모션을 지우고 `DdsScreenMotion(move, active)` +
`ddsScreenContent`를 썼다(SM-F971N, Android 17, 펼친 상태, 어두운 화면. 60fps, 프레임마다 직전
프레임과 비교). 탭 이동 다섯 번은 각각 한 프레임에 바뀌었고 비는 프레임이 없었다. 화면 둘을
열고 닫을 때는 여는 그 프레임에 내용이 보였고 이후 약 15프레임 동안 작은 변화(밀기)만 있었으며
비는 프레임이 없었다. 같은 빌드에서 뒤로 가기 규칙도 통과했다. 재지 않은 것: 밝은 화면, 접은
화면, 다른 화면들, TalkBack.
21. **계정·소속이 바뀔 때는 움직임 없이 즉시 바꾼다**(`DdsMove.None`).
22. 화면을 돌리거나 복원할 때는 다시 들어오지 않는다.

| 이동 | 두 화면 | 내용 밀기 |
| --- | --- | --- |
| 앞으로(`Push`) | 새 화면이 이전 화면 위로 나타남, 100ms | 뒤쪽 가장자리에서 24dp, 300ms |
| 뒤로(`Pop`) | 떠나는 화면이 돌아갈 화면 위에서 사라짐, 100ms | 앞쪽 가장자리에서 24dp, 200ms |
| 탭(`Tab`) | 새 탭이 이전 탭 위로 나타남, 150ms | 없음 |
| 없음(`None`) | 즉시 | — |

움직임 줄이기에서는 모든 변화가 즉시다.

Navigation 3에서는 호스트에 전환을 주고, 각 항목은 `DdsScreenMotion`으로 감싼다.

```kotlin
val reduced = rememberReducedMotion()
NavDisplay(
    backStack = backStack,
    transitionSpec = { ddsScreenChange(move, reduced) },                  // 앞으로, 또는 탭
    popTransitionSpec = { ddsScreenChange(DdsMove.Pop, reduced) },
    predictivePopTransitionSpec = { ddsScreenChange(DdsMove.Pop, reduced) },
    entryProvider = entryProvider {
        entry<Home> {
            DdsScreenMotion(move) {                                       // 내용을 민다
                Scaffold(topBar = { … }, bottomBar = { … }) { padding ->
                    Column(Modifier.padding(padding).ddsScreenContent()) { … }
                }
            }
        }
    },
)
```

화면을 직접 바꾸는 앱에서는 `DdsScreenHost`가 둘을 다 한다.

```kotlin
DdsScreenHost(screen = entry, move = move) { shown ->
    Scaffold(topBar = { … }, bottomBar = { … }) { padding ->
        Column(Modifier.padding(padding).ddsScreenContent()) { … }
    }
}
```

- `ddsScreenChange`는 위처럼 전환 설정 안에서 부른다. `move`는 새 화면에 어떻게 왔는지이고, 탭을
  바꾼 것은 `DdsMove.Tab`이다.
- `DdsScreenHost`에서 `screen`은 `==`로 비교한다. 모든 화면은 `background`(기본은 페이지 색) 위에
  그린다. 떠나는 화면은 누를 수 없고, 화면 낭독기에 보이지 않으며, 그 안에서
  `LocalDdsScreenActive.current`는 false다. 내용을 `DdsScreenMotion`으로 또 감싸지 않는다.
  `NavDisplay`에서는 떠나는 화면을 호스트가 다룬다. 뒤로 갈 때 사라지는 100ms 동안 아직 눌리므로,
  거기서도 `LocalDdsScreenActive`를 읽는다.
- 화면이 바뀌어도 그대로 있어야 하는 메뉴(왼쪽 레일, 고정 목록)는 호스트 바깥에 둔다. 전환은 그
  안쪽에만 걸린다. 밀려 들어오는 내용은 자기 영역 안에만 그려지고 옆의 메뉴 위로 넘어가지 않는다.
- 뒤로 쓸어 넘기면 앱이 이동을 기록하기 전에 아래 화면이 먼저 보인다. 그래서 돌아간 화면은 "앞으로"로
  움직이는 일이 없다. 앞쪽 가장자리에서 돌아온다.

### 2.3.1 뒤로 가기와 앱 종료 (0.3.0)

폰에서 뒤로 가기는 이동 수단이다. 다른 탭으로 옮긴 뒤 뒤로를 눌렀는데 앱이 닫히면 고장으로
읽힌다("메뉴 이동한 다음에 백버튼 누르면 그냥 나가버려").

- **뒤로는 뒤로 간다.** 먼저 이전 화면, 그다음 직전에 보던 탭. 탭은 한 번씩만 기억해서
  두 탭 사이를 오가지 않는다.
- **말없이 종료하지 않는다.** 더 돌아갈 곳이 없거나 600ms 안에 뒤로를 두 번 누르면
  "앱을 종료할까요?"를 묻고, 예일 때만 종료한다.
- **입력이 막힌 화면(잠금)에서는 뒤로를 가로채지 않는다.** 다이얼로그나 시트가 열려
  있을 때도 그렇다 — 그것들은 스스로 닫힌다.
- **스크롤 상태는 걷히는 화면 바깥에 둔다.** Navigation 3의 백 스택에 남아 있는 화면은 저장한
  상태(스크롤 포함)를 돌려받는다. `DdsScreenHost` 안의 화면, 그리고 백 스택에서 빠진 Navigation 3
  항목(바뀐 탭)은 걷혔다가
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

### 3.1 브랜드 색과 바탕 덮어쓰기 `[명세 §3.1, D-010, D-012, D-053]`

웹과 같은 규약이다. **앱이 바꿀 수 있는 것은 브랜드 여섯 토큰과 바탕 셋**이고 이름이
웹과 같다. 아무것도 넘기지 않으면 DDS 기본 색이다.

| 토큰 | 안드로이드 리소스 | 제품이 정하는 것 |
| --- | --- | --- |
| `color.bg.brand` | `dds_color_bg_brand` | 메인 색. 채워진 브랜드 면 |
| `color.bg.brand-hover` | `dds_color_bg_brand_hover` | 누르는 동안의 색 |
| `color.bg.brand-subtle` | `dds_color_bg_brand_subtle` | 옅은 브랜드 배경 |
| `color.text.on-brand` | `dds_color_text_on_brand` | 그 면 위의 글자 |
| `color.text.brand` | `dds_color_text_brand` | 브랜드 글자·링크·선택된 아이콘 |
| `color.border.focus` | `dds_color_border_focus` | 포커스 링 |
| `color.bg.default` | `dds_color_bg_default` | 페이지 바탕 (0.6.0) |
| `color.bg.subtle` | `dds_color_bg_subtle` | 옅은 바탕 (0.6.0) |
| `color.bg.elevated` | `dds_color_bg_elevated` | 카드·시트·다이얼로그·메뉴의 바탕 (0.6.0) |

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
화면 값이 따로 있는 토큰(`bg_brand_subtle`, `text_brand`, `border_focus`, 그리고 바탕 셋
`bg_default`, `bg_subtle`, `bg_elevated`)을 바꾸려면
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
- **규칙을 어긴 브랜드는 `DdsTheme`이 거부한다.** 아래 "무엇을 검사하는가"의 조합 중
  하나라도 4.5:1에 못 미치면 예외가 나서 앱이 뜨지 않는다. 메시지에 잰 값과, 예외를
  어디에 어떻게 적으면 되는지가 나온다. 제품이 그 조합의 예외를 적었으면 거부하지 않는다.

나머지 다섯 값을 메인 색에서 어떻게 정하는지는 웹에도 규칙이 없다(제품이 직접
고른다). §10의 1번.

**바탕 셋 (0.6.0, D-053).** 페이지 바탕, 옅은 바탕, 카드 바탕도 같은 방법으로 바꾼다.
같은 이름의 색 리소스를 다시 정한다.

```xml
<!-- res/values/dds_brand.xml — 따뜻한 종이색 페이지. 카드는 DDS의 흰색 그대로 -->
<resources>
    <color name="dds_color_bg_default">#FAF5EB</color>
</resources>
```

```xml
<!-- res/values-night/dds_brand.xml — 어두운 화면의 페이지는 따로 적는다 -->
<resources>
    <color name="dds_color_bg_default">#12100D</color>
</resources>
```

- 정하지 않은 바탕은 DDS 값이다. 하나만 바꾸면 나머지 둘은 그대로다.
- `DdsTheme.colors.bgDefault / bgSubtle / bgElevated`와 Material의 `background`·`surface`
  계열이 바뀐 값을 따른다. 상단 줄, 아래 탭, 레일, 카드, 시트, 다이얼로그, 메뉴,
  `DdsScreenHost`의 기본 배경은 이 값을 읽는다. 기기에서 픽셀로 확인한 것은 상단 줄과
  아래 탭뿐이다. 나머지는 같은 값을 읽는다는 것을 코드로만 확인했다.
- **`res/values`에만 적은 바탕은 밝은 화면만 바꾼다.** DDS에는 바탕 셋의 어두운 화면 값이
  따로 있다. 그래서 앱이 `res/values-night`에도 `dds_color_bg_*`를 적기 전까지 어두운 화면은
  DDS의 어두운 바탕 그대로다. 위의 `bg_brand_subtle`, `text_brand`, `border_focus`와 같다.
- **어두운 화면에는 어두운 바탕이 필요하다.** 어두운 화면의 글자는 DDS의 밝은 글자다. 어두운
  화면에 밝은 바탕을 주면(`res/values-night`에 적거나 어두운 화면용 `DdsBrandColors`에 넘기면)
  `DdsTheme`이 거부하고, 오류 문구가 어느 바탕을 정하면 되는지 알려 준다.
- **바탕은 불투명해야 한다.** 반투명한 바탕은 그 위 글자의 대비를 잴 수 없다. 알파가
  1이 아니면 `DdsTheme`이 거부하고, 예외로도 통과하지 못한다.
- 코드로 넘길 때는 `DdsBrandColors(bgDefault = …, bgSubtle = …, bgElevated = …)`. 넘기지
  않은 값(`Color.Unspecified`)은 DDS 값이다. 코드로 넘긴 바탕은 스플래시와 창 바탕(XML)에는
  닿지 않는다.

**무엇을 검사하는가 (0.6.0).** 밝은 화면과 어두운 화면에서 따로, 4.5:1을 기준으로.

| 조합 | 검사하는 것 |
| --- | --- |
| `TextOnBrand` | 브랜드 면(`bg.brand`) 위의 글자(`text.on-brand`) |
| `TextBrand` | 브랜드 글자(`text.brand`) — 페이지 바탕, 옅은 바탕, 카드 바탕, 옅은 브랜드 배경 위 |
| `TextOnBackground` | 본문 글자(`text.primary`)와 보조 글자(`text.secondary`) — 페이지 바탕, 옅은 바탕, 카드 바탕 위 |

0.5.0은 브랜드 글자를 페이지 바탕과 옅은 브랜드 배경 위에서만 검사했다. 본문·보조 글자는
DDS의 색이라, 제품이 바탕을 바꿨을 때만 걸릴 수 있다.

**검사하지 않는 것.** 컨트롤 테두리의 3:1(D-050). DDS 기본 바탕에서 맞춘 값이다. 바탕을
많이 바꾼 제품은 입력칸·체크 상자·라디오의 테두리가 자기 바탕에서 보이는지 스스로
확인한다. 안내 글귀 색(`text.muted`), 상태색, 선 색도 검사하지 않는다.

**예외를 적는 법 (0.6.0, D-053).** 4.5:1에 못 미치는 조합을 일부러 쓰려면 그 조합의 이름을
적는다. 적은 조합만 검사하지 않는다. 하한은 없고 글자 크기 조건도 없다. 그 조합이
읽히는지는 적은 제품이 책임진다.

리소스로 적는다(권장). 색을 적는 곳과 같은 곳이다.

```xml
<!-- res/values/dds_brand.xml — 주황 면 위의 흰 글자(약 2.9:1)를 쓰겠다고 적는다 -->
<resources>
    <color name="dds_color_bg_brand">#FF6A1F</color>
    <color name="dds_color_bg_brand_hover">#EB5C14</color>
    <color name="dds_color_text_on_brand">#FFFFFF</color>
    <bool name="dds_allow_contrast_text_on_brand">true</bool>
</resources>
```

이 세 색은 DDS에 값이 하나뿐이라 `res/values`에 한 번 적으면 밝은 화면과 어두운 화면에 함께
적용된다. `bg_brand_subtle`과 `text_brand`는 제품이 따로 정하지 않으면 DDS 값(청록)으로 남는다.
정하려면 `res/values`와 `res/values-night` 둘 다에 적는다.

| 리소스 (`bool`, DDS 기본값 `false`) | 조합 |
| --- | --- |
| `dds_allow_contrast_text_on_brand` | `TextOnBrand` |
| `dds_allow_contrast_text_brand` | `TextBrand` |
| `dds_allow_contrast_text_on_background` | `TextOnBackground` |

- **`res/values`에 적은 예외는 어두운 화면에도 적용된다.** DDS는 이 `bool`을 `values`에만
  두었고, 안드로이드는 `values-night`에 없는 값을 `values`에서 가져온다. 어두운 화면은 다시
  검사하게 하려면 `res/values-night`에 `false`로 적는다.
- 코드로는 `DdsBrandColors(…, allow = setOf(DdsContrastPair.TextOnBrand))`. 밝은 화면용과
  어두운 화면용 `DdsBrandColors`에 따로 넘긴다. 한쪽에만 넘기면 다른 쪽은 검사한다.
- 예외는 `text.on-brand`를 제품이 직접 정했을 때만 뜻이 있다. 정하지 않으면 규칙이 통과하는
  색을 고른다.

**덮어쓸 수 있는 것과 고정인 것.**

| 덮어쓸 수 있다 | 가족 공통으로 고정 |
| --- | --- |
| 브랜드 여섯 토큰. 바탕 셋(페이지, 옅은 바탕, 카드 바탕). 글자 대비 조합 셋의 예외 | 글자색, 선 색, 덮개색, 상태색 네 쌍, 글자 단계, 간격, 둥글기, 컨트롤 높이, 모션 값, 터치 크기 |

### 3.2 색을 쓰는 법 `[명세 §3.1]`

- 화면 바탕 `bg.default`, 묶음 배경 `bg.subtle`, 카드·시트·다이얼로그 `bg.elevated`.
- 글자 `text.primary` / `text.secondary` / `text.muted`(비활성·플레이스홀더).
- 선 `border.default`(카드 테두리, 구분선), `border.strong`(강조 선, 라벨이 있는 버튼), `border.control`(입력칸·체크박스·라디오의 테두리: 3:1, D-050).
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
| `outline` / `outlineVariant` | `border.control` / `border.default` | zinc.450 / zinc.200 | zinc.550 / zinc.800 |
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
| 상단 바 / 아래 탭 / 옆 레일 / 높은 상단 바 | `DdsBar.top / bottom / rail / topTall` | 64 / 80 / 80 / 104 | §10의 2번 |
| 화면 여백 / 블록 사이 / 넓은 화면 | `DdsScreen.gutter / gutterWide / blockGap / breakpointExpanded / bodyMax / listPane / centeredMax` | 16 / 24(폭 600 이상) / 24 / 840(목록과 상세를 나란히) / 680(본문 최대 폭) / 264(목록 폭) / 400(가운데 폼 최대 폭) | §10의 2번 |
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

### 8.1 화면 낭독기가 읽는 것 (0.5.0)

화면을 볼 수 없는 사람은 한 번에 한 요소씩 옮겨 가며 이름, 역할, 상태를 듣는다. 부품은
듣는 것이 화면에 있는 것과 맞도록 만들었다. 아래 각 줄은 `ScreenReaderTest`가 기기에서
낭독기가 걷는 트리를 읽어 고정한다.

| 부품 | 듣는 것 |
| --- | --- |
| `DdsTextField` | 한 요소: 입력한 글, "편집 상자", 라벨, 그리고 오류가 있다는 것. 칸 아래 메시지는 나타나는 순간 읽어 줄 수 있도록 별도 요소다 — 그래서 오류는 칸에서 한 번, 그 줄에서 한 번 더 들린다. 플랫폼의 기본 입력칸도 그렇다 |
| `DdsSelectField` | 한 요소: 라벨, "드롭다운 목록", 상자 안의 글 — 안내 글귀뿐일 때도 읽는다 |
| `DdsSearchField` | 한 요소: 입력한 글과 라벨(설명 문구가 아니라 칸의 글자로 넣었다. 설명 문구는 입력한 글 대신 읽힐 수 있다). 지우기 버튼은 지울 것이 있을 때만 있고, 지운 뒤에도 그 칸에 머문다 |
| `DdsNotice` | 한 요소: 종류("오류", "안내", "완료", "주의" — 기기 언어, 또는 앱이 준 말)와 메시지. 나타나거나 바뀔 때 읽고, 오류는 하던 말을 끊고 읽는다 |
| `DdsButton` | 진행 중이면 "불러오는 중". 초점을 유지한 채 누름을 무시하고, 눌린 것처럼 보이지도 않는다 |
| `DdsListRow` | 누를 수 있는 행은 "버튼"이라고 말한다. 보여 주기만 하는 행은 끝에 있는 것과 함께 하나로 읽는다 |
| `DdsValueRow` | 이름과 값을 함께 |
| `DdsBusyBar` | 나타날 때 "불러오는 중" |
| `ddsScreenContent(paneTitle)` | 화면이 바뀔 때 그 화면의 이름 |
| `DdsBottomSheet` | 손잡이에 이름이 있다("시트 손잡이"). 시트 바깥 영역은 플랫폼이 붙이는 "시트 닫기"다 |

- **앱이 말을 주지 않으면 기기 언어의 말을 쓴다**(`res/values*/dds_a11y.xml`: 영어와 한국어).
  바꾸려면 앱의 말을 넘긴다. 다른 언어의 제품은 반드시 넘겨야 한다.
- **앱만 아는 것은 여전히 앱이 이름을 붙인다:** 아이콘만 있는 버튼, 검색칸, 각 화면의 제목.
- **당겨서 새로고침에는 낭독기용 대체 수단이 없다.** 끌어당기는 영역에 동작을 붙여도 낭독기가
  그 요소에 멈추지 않는다. 끌어당길 수 있는 화면에는 보이는 새로고침 버튼을 둔다.
- **부품이 해 주지 않는 것:** 시트가 열릴 때의 첫 초점, 키보드 사용자에게 상단 바·내용·아래
  바가 어떤 순서로 잡히는지, 스플래시 덮개가 떠 있는 1초 동안 그 아래를 가리는 것.
- **확인한 방법:** 기기 테스트 22개. 바꾼 파일을 0.4.0으로 되돌리면 처음 17개 중 12개가
  실패한다. 이 테스트는 낭독기에 전달되는 것을 읽을 뿐, 낭독기가 거기에 닿는지는 보지 못한다 —
  검토에서 나온 지적 하나(아무도 닿을 수 없는 새로고침 동작)가 바로 그 이유로 테스트를 통과하고
  있었다. 에뮬레이터에서 TalkBack을 켜 화면 제목에 초점이 잡히는 것은 봤지만 말하는 문구는
  받아 내지 못했다. **폰에서 TalkBack으로 직접 듣는 확인은 아직 남아 있다.**

저시력, 글자 200%와 큰 글자에서:

- **컨트롤의 테두리는 놓인 면과 3:1이다**(`border.control`, D-050). 빈 입력칸, 체크 안 된 상자,
  선택 안 된 라디오는 테두리만으로 알아본다. 안내 글귀는 밝은 화면과 어두운 화면 모두에서
  4.5:1이다. 카드 테두리, 구분선, 라벨이 있는 버튼은 옅은 선 그대로다.
- 화면 안 탭은 라벨이 들어가는 동안 폭을 똑같이 나눈다. 자기 몫보다 긴 라벨은 한 글자로
  잘리는 대신 줄이 옆으로 넘어간다.
- 선택칸은 고른 값을 두 줄까지 보여 주고, 다이얼로그의 글은 넘겨 볼 수 있다.
- 선택된 칩과 탭은 색과 함께 글자가 굵다. 폭은 변하지 않는다.
- 남은 것: 채운 버튼의 포커스 링은 채움색 위에 그려진다. 아래 탭 라벨은 한 줄 말줄임이다.
  목록 행 끝의 긴 값이 제목을 밀어낼 수 있다.

## 9. 모바일이라서 달라질 수밖에 없는 것

| 항목 | 웹 | 안드로이드 | 이유 |
| --- | --- | --- | --- |
| 터치 크기 | 44(모바일) | 48 | 안드로이드 접근성 기준과 Material3 기본값. 44를 넘는다 |
| hover | 있음 | 없음. `brand-hover`는 누름 색 | 터치 화면 |
| 누름 반응 | 색 변화 | 물결, 그리고 색이 서서히 바뀜(100ms) | 플랫폼 관례 |
| 글꼴 | 라틴 Geist + 한글 Pretendard | Pretendard | Compose는 글꼴을 굵기로 고른다. 두 글꼴을 한 묶음에 넣으면 첫 글꼴만 쓰인다 |
| 드문 한글 음절 | 전부 Pretendard | KS X 1001 밖의 음절은 시스템 글꼴 | 글꼴 파일을 굵기당 약 0.5MB로 줄였다 |
| 색 역할 | CSS 변수 | Material3 역할 대응표(§3.3) | Material 부품이 역할로 색을 읽는다 |
| 브랜드 덮어쓰기 | `[data-brand]` CSS | 같은 이름의 색 리소스 | 플랫폼의 덮어쓰기 수단이 다르다. 토큰 여섯 개, 바탕 셋과 이름은 같다 |
| 대비 검사 | 없음(규칙 문서만) | `DdsBrand`가 4.5:1 미만을 거부, 제품이 적은 조합은 통과 | 웹은 CSS 변수를 덮어쓰는 방식이라 막는 장치가 없다(D-053) |
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
| 2 | 터치 화면의 컨트롤 높이, 입력칸, 목록 행, 바 높이, 화면 여백 | 40·48·56 / 56 / 56·72 / 64·80 / 16·24 | 웹 버튼은 32·40·48. 세 앱과 Material3 기본값. **옆 여백은 정해졌다(2026-11-12, D-052): 창 폭 600dp 미만 16, 600부터 24. 창 폭으로 정한다(§13)** |
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
| 18 | 탭 전환의 움직임 | 새 탭이 이전 탭 위로 나타남, 150ms. 밀기 없음(0.5.0, D-051). `DdsScreenMotion`만 쓰면 없음 | §2.3. 비운 자리 위에서는 같은 페이드가 실물 기기에서 깜빡임으로 읽혔다(0.3.0) |
| 19 | 앞으로·뒤로 이동에서 화면을 흐리게 바꾸는가 | 내용: 아니다, 첫 프레임부터 불투명하고 밀기만. 화면: 그렇다, 이전 화면(또는 돌아갈 화면) 위에서 100ms(0.5.0, D-051) | §2.3의 18·20번. 빈 자리 위로 나타내면 실물 기기에서 빈 내용 자리가 보였다(0.3.0) |
| 20 | 고른 세그먼트 면의 그림자 | 웹대로 1단계(`DdsElevation.level1`) | 5번(카드 그림자 없음)은 카드·메뉴의 규칙이다. 세그먼트는 웹 그대로 두었고, 어두운 화면에서는 1dp 선이 구분한다. 0.8.0의 `DdsSegmentedControl` |

**항목별 상태 (2026-11-10).**

- **소유자가 직접 고른 것:** 4번(자리 표시는 멈춰 있다), 5번(카드는 테두리만으로 구분하고
  그림자를 쓰지 않는다), 10번(어두운 화면의 위험·정보 색이 4.5:1을 넘도록 토큰 값 자체를
  고친다 — D-049에서 웹과 안드로이드를 함께 고쳤다).
- **"지금 값 그대로"로 추천해 소유자에게 보여 주었고 아직 이의가 없는 것:** 1, 2, 3, 6, 7, 8,
  9, 12, 13번, 그리고 11번은 "Material3 기본 유지, 다이얼로그에 크기 변화를 넣지 않는다".
  소유자가 확정하기 전까지는 확정된 규칙이 아니다.
- **아직 소유자에게 묻지 않은 것:** 14, 15, 16번(0.2.0 부품과 함께 추가), 17번(0.3.0, 소유자가
  정산나우를 폰에서 쓰며 한 말에서 나왔다 — 숫자는 제안값이다).
  20번(0.8.0의 세그먼트 컨트롤 — 웹 그대로 둔 값이다).
- **소유자 말에 따라 바꾼 것(2026-11-11, D-051):** 18·19번. 0.3.0과 0.4.0은 이 페이드를 뺐었다.
  소유자는 움직임이 계속 사라지는 것을 원하지 않았고, 비는 프레임이 없는 방식으로 되살렸다. 시간은
  0.2.0의 값이다.

## 11. 기존 앱을 옮기는 순서

1. 의존성 추가. `dds-compose`가 글꼴 여섯 파일(Pretendard 넷, Geist Mono 둘, 합쳐 약
   2.0MB)을 싣는다. **앱이 가지고 있던 같은 글꼴 파일은 지운다** — 두 벌이 들어가면 그만큼
   배포 파일이 커진다.
2. 브랜드: 메인 색을 `res/values/dds_brand.xml`에 적는다(기본 색을 쓰면 생략).
3. 앱 테마를 `DdsTheme`으로 교체.
4. `res/values*`의 hex를 `@color/dds_*`로 교체(스플래시, 창 배경, 로고).
5. 모션 상수와 도우미를 `DdsMotion`, `ddsScreenChange`와 `DdsScreenMotion`(또는 `DdsScreenHost`), `ddsAppear`, `DdsSplashHandoff`,
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
| `DdsButton` (`Primary` / `Secondary` / `Ghost` / `Plain` / `Danger`, `Sm` 40 / `Md` 48 / `Lg` 56), `DdsIconButton` | 높이 하나, `bg.brand` + `text.on-brand`, `Secondary`는 카드 바탕으로 채운 면 + 선, `Ghost`는 브랜드 색 글자, `Plain`은 본문 글자색 글자(0.6.0), 진행 중에도 크기 그대로이고 흐려지지 않는다, 비활성 0.45, 2dp 포커스 링, 아이콘 버튼은 설명 문구 필수에 터치 48 | Button `[명세 §4.2]` |
| `DdsTextField` | 라벨은 위(떠다니는 라벨 없음), 높이 56, 메시지 줄을 항상 비워 두어 오류가 떠도 폼이 밀리지 않는다, 오류는 읽어 준다 | Field, Input |
| `DdsCheckbox`, `DdsRadio`, `DdsSwitch` | 행 전체가 터치 영역(48 이상), 상태를 읽어 준다 | Checkbox, Radio, Switch |
| `DdsCard`, `DdsSection`, `DdsDivider`, `DdsListRow` | `bg.elevated` + 1dp 선 + 둥글기 12, 그림자 없음. 섹션 제목은 제목으로 읽힌다. 행은 56 또는 72 | Card |
| `DdsNotice`, `DdsBadge`, `DdsChip` | 뜻마다 아이콘과 색 쌍이 다르다. 배지는 점으로 상태를 한 번 더 알린다. 중립은 선을 둔다 | Alert, Badge, Tag |
| `DdsEmptyState`, `DdsSpinner` | 점선 테두리, 제목, 한 문장, 동작은 많아야 하나 | EmptyState, Spinner |
| `DdsTopBar`, `DdsBottomBar`, `DdsNavRail`, `DdsScaffold` | 바는 고정이고 1dp 선으로 구분한다. 600dp 미만은 아래 탭, 600dp부터 레일. 선택은 알약·색·굵기가 함께 바뀐다. 0.7.0부터 상단 줄은 본문의 선에 서고 라벨은 두 줄까지 쓴다(§13) | — (모바일에만) |
| `DdsAppFrame`, `DdsBodyColumn`, `DdsCenteredColumn`, `DdsCenteredTitle`, `DdsPaneList`, `DdsPaneItem` (0.7.0) | 화면 틀. 창 폭이 메뉴를 정하고, 화면마다 본문 기둥 하나, 한 가지 일만 하는 화면의 가운데 묶음, 고정 목록의 줄(§13) | — (모바일에만) |
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
| `DdsSearchField` | 검색칸은 하나: 앞에 돋보기, 입력하면 지우기 버튼, 키보드의 검색 키로 실행. `applyDescription`을 주면 끝에 적용 버튼이 생기고 `searchEnabled`로 그 버튼만 따로 흐리게 한다. 라벨 줄도 메시지 줄도 없다 | — |
| `DdsSelectField` | 짧은 목록에서 고르는 칸은 하나: `DdsTextField`와 같은 상자와 줄, 시트가 열리고 고른 항목에 체크 | Select |
| `DdsValueRow` | 이름과 값 한 줄: 이름은 앞, 값은 끝 가장자리, 숫자는 고정폭, 줄마다 구분선 | — |
| `DdsTabs` | 화면 안에서 같은 것의 여러 보기: 고른 탭으로 미끄러지는 브랜드 밑줄과 굵은 라벨. 탭은 폭을 똑같이 나누고, 라벨이 자기 몫에 안 들어가면 옆으로 넘긴다 | Tabs |
| `DdsBottomSheet` | 선택과 작업 메뉴. 뒤로, 바깥 탭, 끌어내리기로 닫힌다. 위쪽 모서리 둥글기 16 | Sheet |
| `DdsMenu`, `DdsMenuItem`, `DdsMenuDivider` | 버튼에 붙어 열리는 짧은 메뉴. 그림자 없이 카드 바탕과 1dp 선으로 구분한다(0.6.0). `align = DdsMenuAlign.End`면 메뉴의 끝이 버튼의 끝에 맞는다(0.6.0). 지우는 항목은 위험색이고 그 앞에 `DdsMenuDivider()`를 둔다 | Menu |
| `DdsToastHost` | 스스로 사라지는 짧은 알림, 반전 면. 꼭 읽어야 하는 것에는 쓰지 않는다 | Toast |

- **글은 쓴 그대로 읽힌다.** `keepWords()`는 단어의 글자 사이에 보이지 않는 연결 문자를
  넣는다. 0.2.1까지는 그 글이 화면 낭독기와 테스트에도 그대로 전달됐다
  (`onNodeWithText("저장")`이 DDS 라벨을 찾지 못했다). 이제 부품은 묶은 글을 그리고 원문을
  알려 준다. 직접 그리는 글에는 `Text(label.keepWords(), Modifier.readAs(label))` — `readAs`는
  수정자 사슬의 맨 뒤에 둔다. 뒤에 적은 것의 접근성 정보를 대체하기 때문이다. DDS 라벨을
  `"…".keepWords()`로 찾던 테스트는 이제 원문으로 찾는다.
- **검색칸은 따로 주지 않으면 `label`을 안내 글귀로 보여 준다**(0.5.0. 그 전에는 라벨을 읽어
  주기만 해서 빈 칸이 화면에서는 아무 말도 하지 않았다). 테스트에서는
  `hasSetTextAction() and hasText(label)`로 찾는다 — 설명 문구는 더 이상 없다.
- **검색칸 하나, 선택칸 하나를 앱 전체에서 쓴다.** 같은 일을 하는 칸이 화면마다 다르게
  생기면 가장 먼저 눈에 띄는 불일치가 된다.

**0.6.0에서 바뀐 것 (D-053)**

- **보조 버튼(`Secondary`)은 채운 면이다.** 바탕이 투명하지 않고 카드 바탕(`bg.elevated`)이다.
  DDS 기본 밝은 화면에서는 페이지와 카드 바탕이 같은 흰색이라 전과 똑같이 보인다. **어두운
  화면에서는 버튼 면이 페이지보다 눈에 띄게 밝다**(`zinc.950` 페이지 위의 `zinc.900` 면).
  색 있는 페이지에서는 흰 면이 된다. 누르면 그 면 위에 옅은 덮개가 올라간다. 선과 글자는
  그대로다.
- **`DdsButtonVariant.Plain`** — 바탕 없는 본문 글자색 버튼. 브랜드 색이 아닌 글자 버튼이
  필요할 때 쓴다. `Ghost`(브랜드 색 글자)는 그대로다.
- **메뉴에 그림자가 없다.** 카드·시트·다이얼로그처럼 카드 바탕과 1dp 선으로만 구분한다.
  어두운 화면에서 카드 위에 열린 메뉴는 면 색이 카드와 같아 선으로만 구분된다.
- **`DdsMenu(align = DdsMenuAlign.End)`** — 줄이나 칸의 끝에 있는 "더 보기" 버튼에 쓴다.
  메뉴가 버튼의 끝에 맞춰 안쪽으로 열린다. 그쪽에 자리가 없으면 버튼의 시작에 맞추고,
  그것도 안 되면 창 가장자리에 맞춘다. 창 밖으로 나가지 않는다. 기본값은 전과 같은 `Start`다.
  메뉴의 `modifier`에는 한쪽을 가리키는 것(시작·끝 여백)을 주지 않는다. 끝 맞춤 메뉴에서
  그것이 어떻게 되는지는 시험하지 않았다.
- **`DdsMenuDivider()`** — 1dp 선, 위아래 4dp. 낭독기에는 요소로 잡히지 않는다.
- 메뉴 안의 내용은 메뉴를 연 화면의 글 방향을 따른다.

`android/catalog`의 Colors 탭 "Product colors"가 이것들을 한 화면에 보여 준다(주황 면 + 흰 글자,
종이색 페이지 위의 흰 카드, 버튼 넷, 끝 맞춤 메뉴).

**0.8.0에서 추가**

| 부품 | 고정해 주는 것 | 웹 |
| --- | --- | --- |
| `DdsSegmentedControl`, `DdsSegment` | 몇 개 안 되는 보기 중 하나 고르기(보기 전환, 필터, 개인 / 비즈니스 같은 종류). 트랙은 `bg.subtle` + 1dp `border.strong` 선 + 둥글기 8, 안쪽 2dp, 칸 사이 2dp. 칸은 둥글기 4, `label` 글자, `text.secondary`. 고른 칸은 `bg.default` 면 + 1dp `border.strong` 선 + 1단계 그림자 + `text.primary` + 굵기 600. 높이는 하나(터치 높이): 트랙 50 = 터치 48 + 위아래 선 1, 칸의 면 44, 큰 글자 모드는 터치 56. 라벨은 줄바꿈하지 않는다 | SegmentedControl |

- **고르는 것이 아무것도 밀지 않는다.** 기본(내용 폭)에서는 칸마다 라벨이 굵은 글자의 폭을
  늘 차지하고 있어서, 다른 칸을 골라도 이웃 칸이 움직이지 않는다. 칸이 너무 많으면 트랙
  안에서 옆으로 넘긴다. 페이지가 옆으로 밀리지 않는다.
- **`fullWidth = true`면 트랙이 폭을 채우고 칸이 똑같이 나눈다.** 몫보다 긴 라벨은 말줄임표로
  끝나고, 화면 낭독기는 전부 읽는다. 굵은 폭을 따로 잡아 두지 않는 것은 웹과 같다.
- **웹의 md 40 / sm 32는 포인터 높이다.** 웹도 터치 화면(`pointer: coarse`)에서는 둘 다 트랙
  50, 칸 44 이상이 된다. 안드로이드는 터치 화면이라 크기 인자가 없다. 칸의 터치 영역은 트랙
  선 안쪽 높이 전부(48)이고, 면은 그 위아래 2dp 안쪽(44)이다. 내용 폭의 칸은 폭도 44 이상이다.
- **화면 낭독기는 라디오 그룹으로 듣는다.** 칸마다 라디오 버튼이고 골랐는지 말한다. 굵은 폭을
  잡는 보이지 않는 글은 읽지 않는다. 보이는 `label`이 없으면 `contentDescription`으로 그룹에
  이름을 준다.
- **`error`는 색만으로 알리지 않는다.** 트랙 선이 위험색이 되고, 트랙 아래에 문장이 나오고,
  낭독기가 읽는다(`DdsTextField`와 같은 줄). `readOnly`는 흐리지 않고, 포커스와 읽기는 되지만
  바꿀 수 없다. `enabled = false`는 트랙 전체를 0.45로, 칸 하나만 끈 것(`DdsSegment(enabled =
  false)`)은 그 칸만 0.45로 그린다. 누름은 물결이 아니라 면의 옅은 덮개, 마우스를 올리면
  웹처럼 hover 덮개다. 포커스(키보드·D패드)는 칸 안쪽 2dp `border.focus` 선이 고른 칸의 선을
  대신한다.
- **고른 칸의 그림자는 웹대로 둔다.** 카드·메뉴의 그림자는 뺐지만(§10의 5번) 이 면은 웹 그대로
  1단계 그림자를 쓴다. 어두운 화면에서는 그림자가 거의 보이지 않아도 1dp 선이 면을 구분한다.
  소유자가 확정할 항목이다(§10의 20번).
- `segments`는 하나 이상이어야 하고 값이 겹치면 안 된다(어기면 예외). `selected`가 어느 칸의
  값도 아니면 아무 칸도 고르지 않은 상태다. `onSelect`는 이미 고른 칸을 누르거나 `readOnly`일
  때 부르지 않는다.
- 첫 소비자는 Qooroo의 명함 종류 토글(개인 / 비즈니스)이다. 앱 안의 사본
  `DdsStyleSegmented`를 이것으로 바꾼다. `android/catalog`의 Parts 탭
  "Segmented control"이 전체 폭, 내용 폭(꺼진 칸 포함), 읽기 전용, 비활성, 오류를 보여 준다.

아직 없는 것: 날짜·시간 선택. `DdsTheme` 아래에서 Material3 부품을 쓴다.

## 13. 화면 틀 (0.7.0, D-052)

앱의 모든 화면은 한 시작선에 서고, 상단 줄은 본문과 같은 선에 선다. 정산나우가 펼친 폰에서 찾은 문제가
이것이었다. 화면마다 본문이 187, 147, 127dp에서 시작했고, 레일은 탭 화면에만 있었고, 상단 줄은 창 끝에서
본문은 가운데에서 시작했다. DDS에 숫자는 있는데 그 숫자를 지키게 하는 부품이 없어서, 화면마다 폭을 손으로
적었기 때문이다. 0.7.0이 그 부품을 더한다. 부품을 쓰면 선이 맞는다. 화면은 아무것도 재지 않는다.

### 13.1 규칙

1. **창 폭이 메뉴를 정한다.** 600dp 미만: 최상위 화면에 하단 탭. 600dp부터: 레일. 840dp부터: 레일과,
   화면이 목록이 있는 영역에 속하면 그 옆에 목록. 화면은 창을 재지 않고 틀이 정한 것(`ddsFrame()`)을 읽는다.
2. **옆 여백은 남은 자리가 아니라 창 폭으로 정한다.** 600 미만 16dp, 600부터 24dp. 고정 목록 옆의 화면은
   587dp밖에 안 되지만 창이 넓으니 24다. 상단 줄, 본문, 목록이 모두 자기 창의 여백을 쓴다. (§10의 2번에서
   여백은 이것으로 정해졌다.)
3. **본문 기둥은 화면마다 하나다.** 여백을 포함해 680dp를 넘지 않고, 레일과 목록이 남긴 자리의 가운데에 선다.
4. **상단 줄은 본문의 선에 선다.** 상단 줄의 내용은 본문과 같은 폭으로 같은 자리에 놓인다. 뒤로 화살표의
   24dp 그림은 시작선에서 시작하고, 마지막 아이콘의 24dp 그림은 끝선에서 끝난다. 아이콘마다 눌리는 영역
   48dp는 여백 쪽으로 12dp 나간다. 제목은 로고 뒤든 화살표 뒤든 시작선에서 40dp 뒤에서 시작한다. 그래서
   화면을 열어도 제목이 옆으로 움직이지 않는다. 둘 다 없으면 시작선에서 시작한다.
5. **레일은 틀이, 하단 탭은 화면이 그린다.** 레일은 모든 화면에 같고, 옆의 화면이 바뀌는 동안 움직이면
   안 된다. 하단 탭은 최상위 화면의 것이다. 상세 화면은 열리면서 탭을 덮어야 하는데, 탭이 그 아래 화면의
   일부일 때만 그렇게 된다(D-051).
6. **한 가지 일만 하는 화면**(로그인, 잠금 풀기)은 400dp를 넘지 않는 한 묶음으로, 주어진 자리의 한가운데에 선다.
7. **상단 줄의 높이는 창이 정한다.** 앱이 알려 준 제목 중 하나라도 지금 글자 크기에서 한 줄에 들어가지
   않으면, 그 창의 모든 상단 줄이 두 줄, 104dp가 된다. 그래야 화면마다 본문이 위아래로 튀지 않는다.

### 13.2 숫자

| 무엇 | 값 | 토큰 |
| --- | --- | --- |
| 중간 창 시작 / 넓은 창 시작 | 600 / 840 | `DdsScreen.breakpoint` / `breakpointExpanded` |
| 옆 여백, 600 미만 / 600부터 | 16 / 24 | `DdsScreen.gutter` / `gutterWide`, 또는 `DdsWindowWidth.gutter` |
| 본문 기둥 최대(여백 포함) | 680 | `DdsScreen.bodyMax` |
| 고정 목록 | 264, 그 뒤에 1dp 선 | `DdsScreen.listPane` |
| 가운데 묶음 최대 | 400 | `DdsScreen.centeredMax` |
| 레일 | 80 | `DdsBar.rail` |
| 상단 줄 / 두 줄 제목일 때 | 64 / 104 | `DdsBar.top` / `topTall` |
| 제목 시작 | 시작선 + 40 | — |
| 아이콘 버튼 / 그 그림 | 48 / 24, 여백 쪽으로 12 나감 | `DdsTouch.min`, `DdsIcon.md` |
| 제목 앞의 로고 | 폭 최소 28, 그 뒤 12 띄우고 제목 | — |

SM-F971N의 창 세 가지에서는 이렇게 된다(이 크기로 고정한 에뮬레이터의 카탈로그와 기기 테스트에서 쟀다).

| 창 | 메뉴 | 본문 글자의 선(창 시작부터 dp) |
| --- | --- | --- |
| 475×751 (접힌) | 최상위 화면에 하단 탭 | 16과 459 |
| 704×933 (펼친 세로) | 레일(80 + 1dp 선) | 105와 680 |
| 933×704 (펼친 가로) | 레일 | 191과 823 |
| 933×704, 목록이 있는 영역 | 레일, 목록 81~345, 1dp 선 | 목록 글자 105, 본문 370과 909 |

### 13.3 부품

| 부품 | 하는 일 |
| --- | --- |
| `DdsWindowWidth`, `ddsWindowWidth(width)`, `DdsWindowWidth.gutter` | 600과 840을 기준으로 Compact / Medium / Expanded. 각각의 옆 여백 |
| `DdsAppFrame(navItems, selectedIndex, onSelect, navigation, barTitles, barActions, barReserve, list) { … }` | 앱에 하나. 화면 전환기(`NavDisplay`나 `DdsScreenHost`) 바깥에 둔다. 레일과 고정 목록을 그린다. 그것들이 나타나거나 사라져도 내용은 제자리에 있다(접거나 돌려도 스크롤 위치와 입력한 글자가 남는다). 옆쪽의 카메라 구멍을 피한다. 오른쪽에서 왼쪽으로 쓰는 언어에서는 뒤집힌다. `navigation = false`면 메뉴를 모두 끈다(로그인 전, 스캔, 작성 화면). 바탕은 `bgDefault` |
| `DdsFrame`, `LocalDdsFrame`, `ddsFrame()` | 틀이 정한 것: `width`, `rail`, `listPinned`, `tallBar`. 틀 밖에서 `ddsFrame()`은 창으로 정한 `width`만 갖는다 |
| `DdsScaffold(topBar, modifier, bottomTabs) { padding -> … }` | 틀 안의 화면 하나. 최상위 화면은 `bottomTabs = true`. 탭은 Compact 창에서만, 틀이 받은 항목과 선택으로 그려진다. `padding`이 이미 비켜 준 시스템 영역(상단 줄 밑의 상태 표시줄, 내용 밑의 내비게이션 바)은 내용에서 쓴 것으로 표시한다. 그래서 안에 둔 `DdsCenteredColumn`이나 `imePadding()`이 그만큼을 다시 비우지 않는다. 예전 `DdsScaffold(topBar, navItems, …)`도 그대로 동작하지만 틀 안에 넣지 않는다(레일이 둘이 된다) |
| `DdsTopBar(title, leading, onBack, backEnabled, backDescription, columnMax, actions)` | 본문의 선에 선다. `onBack`을 주면 화살표를 그리고 선에 맞춘다. `leading`은 로고 자리(폭 최소 28). 둘 다 주면 화살표만. 화면이 본문 최대 폭을 바꾸면 `columnMax`에 같은 값 |
| `ddsBarNeedsTwoLines(areaWidth, titles, actions, reserve, columnMax)` | 틀이 하는 두 줄 판단. 틀을 쓰지 않는 앱용 |
| `DdsBodyColumn(modifier, scroll, max, spacing, contentPadding, paneTitle) { … }` | 상단 줄 아래 본문 전체. 스크롤되는 한 단으로 가운데에 놓이고, 네 방향 여백이 옆 여백 값이고, 블록 사이가 24. 화면이 들어올 때 밀려 들어온다(`ddsScreenContent(paneTitle)`가 붙어 있으니 다시 붙이지 않는다). `paneTitle`에 상단 줄 제목을 준다. 화면이 바뀔 때 화면 낭독기가 그 이름을 말한다(§8.1) |
| `Modifier.ddsBody(max)` | 본문을 직접 짜는 화면용. 폭을 제한하고 검사용 표시를 단다. 가운데 놓기와 여백은 화면이 한다 |
| `Modifier.ddsBodyLines(max)` | 본문은 아니지만 본문의 선에 서야 하는 것용: 진행 표시줄, 단계 표시, 아래쪽 버튼 줄. 폭과 옆 여백만 주고 표시는 달지 않는다 |
| `DdsCenteredColumn(modifier, max, paneTitle) { … }`, `DdsCenteredTitle(title, modifier, description)` | 한 가지 일만 하는 화면(본문 기둥처럼 `paneTitle`에 화면 이름을 준다). 묶음은 시스템 줄과 키보드가 남긴 자리의 가운데에 놓인다(입력칸이 키보드 위에 남는다). 옆은 창의 여백, 위·아래와 조각 사이는 24. 자리보다 길면 위에서 시작해 스크롤된다. 자리 전체에 페이지 바탕을 칠하고 묶음은 그 위로 밀려 들어온다. 제목은 가운데 정렬에 줄 길이가 고르고, 적어 넣은 줄바꿈을 지키고, 제목 하나로 읽힌다 |
| `DdsPaneList { … }`, `DdsPaneItem(label, selected, onClick, modifier, enabled)` | 영역 목록의 줄. 고른 줄은 레일에서 고른 항목처럼 보인다(옅은 브랜드 바탕, 브랜드 색, 굵게). 나머지는 레일과 같은 회색(`textSecondary`). 높이 48, 큰 글자 모드에서 56. 줄의 글자가 목록의 여백 선에 선다. "선택됨, 7개 중 2번째"로 읽힌다. 목록은 스크롤된다 |
| `DdsTestTags` | 부품이 스스로 달고 검사가 읽는 표시: `Body`, `TopBarTitle`, `Rail`, `ListPane`, `BottomTabs`, `Centered`, `CenteredArea` |
| `kr.devslab:dds-compose-testing` | `DdsFrameCheck`(§13.6) |

레일과 하단 탭(틀 안이든 밖이든): 라벨은 두 줄까지 쓰고 항목도 그만큼 높아진다. 그래서 글자 200%에서도
"거래처 매출"이 잘리지 않는다. 200%에서 세 줄이 필요한 라벨은 두 번째 줄 끝에서 말줄임표로 잘리고, 레일은
80 그대로다. 항목이 다 들어가지 않으면 레일이 스크롤된다.

**틀 없이 두 줄 상단 줄 쓰기.** `DdsTopBar`는 `ddsFrame().tallBar`를 읽는데, 이 값은 틀만 정한다.
`DdsAppFrame`을 쓰지 않는 앱은 `ddsBarNeedsTwoLines`로 판단하고, 틀이 하는 것처럼 화면들에 건넨다.

```kotlin
val width = ddsFrame().width
val tall = ddsBarNeedsTwoLines(areaWidth = maxWidth, titles = everyBarTitle)  // BoxWithConstraints 안에서
CompositionLocalProvider(LocalDdsFrame provides DdsFrame(width, tallBar = tall)) { Screens() }
```

**고정 목록 쓰는 법.** 좁은 창에서 한 화면으로 여는 그 목록과 같은 것이다. 앱은 한 번만 짠다. 고정 목록
옆에서 줄을 고르면 화면을 바꿔 끼운다(밀리지 않는다. `DdsMove.Tab`이 그렇게 한다). 그 화면에는 뒤로
화살표가 없다(`ddsFrame().listPinned`로 안다). 뒤로 가기는 고른 줄을 되짚지 않고 영역을 나간다. 목록이 한
화면일 때는 목록, 화면, 뒤로다. 목록 자기 상단 줄에는 로고도 화살표도 없어서 제목이 목록의 선에 선다.

### 13.4 Navigation 3을 쓰는 앱

```kotlin
DdsAppFrame(
    navItems = tabs,                                   // List<DdsNavItem>
    selectedIndex = tabOf(top),
    onSelect = { goToTab(it) },
    navigation = top !is SignIn && top !is Scanner,    // 한 가지 일만 하는 화면
    barTitles = everyBarTitle,                         // 두 줄 판단용
    list = if (top in salesArea) ({ SalesList(chosen = top, onChoose = ::swapTo) }) else null,
) {
    NavDisplay(
        backStack = backStack,
        onBack = { backStack.removeLastOrNull() },
        transitionSpec = { ddsScreenChange(move, reduced) },
        popTransitionSpec = { ddsScreenChange(DdsMove.Pop, reduced) },
        predictivePopTransitionSpec = { ddsScreenChange(DdsMove.Pop, reduced) },
        entryProvider = { key -> NavEntry(key) { DdsScreenMotion(move) { Screen(key) } } },
    )
}

@Composable
fun HomeScreen() = DdsScaffold(
    topBar = { DdsTopBar("홈", leading = { AppMark() }) { DdsIconButton(DdsIcons.Search, "검색", onClick = {}) } },
    bottomTabs = true,
) { padding ->
    Box(Modifier.padding(padding)) { DdsBodyColumn(paneTitle = "홈") { /* 블록 */ } }
}

@Composable
fun OrderScreen(onBack: () -> Unit) = DdsScaffold(topBar = { DdsTopBar("주문", onBack = onBack) }) { padding ->
    Box(Modifier.padding(padding)) { DdsBodyColumn(paneTitle = "주문") { /* 블록 */ } }
}

@Composable
fun SalesList(chosen: Any, onChoose: (Any) -> Unit) = DdsScaffold(topBar = { DdsTopBar("매출") }) { padding ->
    Box(Modifier.padding(padding)) {
        DdsPaneList { for (row in rows) DdsPaneItem(row.name, selected = row == chosen, onClick = { onChoose(row) }) }
    }
}
```

`NavDisplay`는 화면 뒤에 아무것도 칠하지 않는다. `DdsScaffold`와 `DdsCenteredColumn`은 페이지 바탕을
칠하므로, 이것들로 짠 화면은 바뀌는 동안 모든 프레임에서 아래 화면을 덮는다. 다른 것으로 짠 화면은 바탕을
따로 줘야 한다.

### 13.5 `DdsScreenHost`를 쓰는 앱

카탈로그(`android/catalog`의 `MainActivity.kt`와 `LayoutPages.kt`)가 통째로 그 예다.

```kotlin
DdsAppFrame(
    navItems = Page.entries.map { DdsNavItem(it.title, it.icon) },
    selectedIndex = page.ordinal,
    onSelect = { index -> openTab(index) },
    navigation = !(page == Page.Layout && demo == LayoutDemo.WholeWindow),
    barTitles = BarTitles,
    list = if (page == Page.Layout) ({ LayoutPinnedList(demo ?: LayoutDemo.Body, choose) }) else null,
) {
    val pinned = ddsFrame().listPinned
    // 고정 목록 옆에는 늘 보여 줄 화면이 있다. 고르기 전까지는 첫 번째.
    val shown = Shown(page, detail, if (page == Page.Layout) demo ?: (if (pinned) LayoutDemo.Body else null) else null)
    DdsScreenHost(screen = shown, move = move) { (shownPage, shownDetail, shownDemo) ->
        when {
            shownDetail != null -> InnerScreen("Item ${shownDetail + 1}", goBack) { /* … */ }
            shownDemo != null -> LayoutDemoScreen(shownDemo, onBack = if (pinned) null else goBack)
            else -> TabScreen(shownPage) { /* … */ }   // DdsScaffold(…, bottomTabs = true)
        }
    }
}
```

카탈로그의 Layout 탭이 부품을 보여 준다. 창에 대해 틀이 정한 것을 찍어 보이는 본문 기둥, 화살표와 아이콘
둘이 있는 상단 줄, 입력칸과 버튼이 있는 로그인 모양의 가운데 묶음, 메뉴를 끈 화면. 실행 인자로 바로 연다.
`--es page layout --es demo body|bar|centered|wholewindow`, 들어간 화면은 `--es page motion --ei item 2`.

### 13.6 앱이 자기 화면을 검사하기: `dds-compose-testing`

```kotlin
androidTestImplementation("kr.devslab:dds-compose-testing:0.7.0")
```

`dds-compose`, Compose 테스트 규칙(`ui-test-junit4`, 버전은 이 꾸러미가 적은 Compose BOM이 정한다),
그리고 **Espresso 3.7.0**을 함께 가져온다. Compose BOM이 가져오는 Espresso(3.5.0)는 Android 17에서 돌지 않는다.
`createComposeRule()`을 쓰는 테스트는 그 규칙이 띄우는 빈 액티비티도 필요하다. 이것은 앱이 직접 더한다
(`dds-compose`의 테스트도 그렇게 한다).

```kotlin
debugImplementation("androidx.compose.ui:ui-test-manifest")   // 버전은 앱의 Compose BOM이 정한다
```

기기 테스트에서 앱의 실제 화면을 하나씩 열고 하나씩 본다.

```kotlin
val check = DdsFrameCheck(composeRule)
for (window in listOf(DpSize(475.dp, 751.dp), DpSize(704.dp, 933.dp), DpSize(933.dp, 704.dp))) {
    size = window                                   // DeviceConfigurationOverride.ForcedSize
    open(Home);  check.look("Home at ${window.width}", DdsScreenKind.TopLevel)
    open(Order); check.look("Order at ${window.width}", DdsScreenKind.Inner)
    open(Sales); check.look("Sales at ${window.width}", DdsScreenKind.Listed)
    open(Scan);  check.look("Scan at ${window.width}", DdsScreenKind.WholeWindow)
}
check.assertSameLines()
```

크기는 `DdsAppFrame` 바깥에서 고정한다. 틀 없이 그린 부품은 `ddsFrame()`이 창을 읽어 여백을 정하는데, 이때
`ForcedSize`가 바꾸지 못하는 기기의 실제 창을 읽는다. 그런 테스트에서는 `LocalDdsFrame`을 직접 넣는다. 정산나우가
자기 테스트에서 이것을 만났다.

`look`은 아래가 아니면 실패한다. 실패 문구는 화면 이름, 잰 값(dp), 맞게 해 주는 DDS 부품을 말한다.

1. 본문이 화면에 정확히 하나 있다(`DdsBodyColumn`이나 `ddsBody()`, 또는 `DdsCenteredColumn` 하나).
2. 그 창에서 그 종류의 화면에 맞는 메뉴만 있다.

   | 종류 | 레일 | 고정 목록 | 하단 탭 |
   | --- | --- | --- | --- |
   | `TopLevel` | 600부터 | 없음 | 600 미만 |
   | `Inner` | 600부터 | 없음 | 없음 |
   | `Listed` | 600부터 | 840부터 | 없음 |
   | `WholeWindow` | 없음 | 없음 | 없음 |

3. 고정 목록은 레일이 끝나는 곳(1dp 선 뒤)에서 시작하고, 본문은 목록 뒤에서 시작한다.
4. 본문의 가운데가 레일과 목록이 남긴 자리의 가운데에서 1dp 안에 있다.
5. 화면의 제목이 본문의 양 끝 안에 있다. 고정 목록이 있으면 상단 줄이 둘인데, 목록 위의 제목은 목록의
   것으로 보고 뺀다.

`assertSameLines()`는 본 화면들을 종류, 고정 목록 유무, 본문인지 가운데 묶음인지, 창 폭으로 묶는다. 한
묶음 안의 두 화면이 시작선이나 폭에서 1dp 넘게 다르면 둘 다 이름을 대며 실패한다. 화면은 바뀌는 중이 아니라
멈춘 뒤에 본다.

`look`이 돌려주는 `DdsScreenReading`은 앱이 증거로 남길 수 있다: `name`, `kind`, `window`, `windowWidthDp`,
`bodyLeftDp`, `bodyWidthDp`, `titleLeftDp`(상단 줄 제목이 없는 화면과 가운데 묶음은 null), `rail`,
`listPane`, `bottomTabs`, `centered`. `check.readings`에 다 모인다.

### 13.7 확인한 것과 확인하지 못한 것

확인한 것:

- 틀, 본문, 상단 줄, 가운데 묶음, 목록 줄, 검사 자체, 그리고 견본 앱 하나(탭 둘, 들어간 화면, 목록이 있는
  영역, 메뉴를 끈 화면, 로그인 묶음)를 475×751, 704×933, 933×704에서 기기 테스트로 잰다. 제품이 정한 페이지
  색에서도 쟀다. 새 테스트는 모두 실패하는 것을 먼저 보았다. 예외는 견본 앱 테스트의 두 부분이다 — 페이지 색
  검사와 `assertSameLines` 호출은 실패하는 것을 본 적이 없다. 전체 기기 테스트는 실물 폰(SM-F971N, Android
  17)에서 돌렸다. 개수와 창 크기는 변경 기록에 있다.
- 화면이 바뀌는 동안, 시계를 멈추고 프레임마다: 레일은 자리도 픽셀도 그대로다. 탭 화면 위로 연 화면은 빈
  프레임 없이 하단 탭을 덮는다. 가운데 묶음 화면은 모든 프레임에서 아래 화면을 페이지 바탕으로 덮는다.
  `NavDisplay` 안에서도 그렇다.
- 글자 200%: 레일과 탭의 라벨, 제목이 잘리지 않는다.
- 오른쪽에서 왼쪽(테스트에서 설정): 레일과 목록이 오른쪽에 온다.
- 카탈로그를 창 세 가지로 고정한 에뮬레이터에서 보았다. 세 창 모두 밝은 화면, 933×704에서 어두운 화면,
  475×751에서 가장 큰 글자, 475×751에서 키보드를 연 채. 캡처마다 본문의 선을 그어 보았다.

확인하지 못한 것:

- **요청한 앱을 그 폰에서.** 정산나우가 로컬 빌드로 0.7.0에 옮기고 폰의 창 세 가지에서 확인한 뒤에 배포한다.
- 폰에서 카탈로그(에뮬레이터에서만 보았다).
- 틀과 함께 하는 뒤로 밀기(예측 뒤로 가기).
- 진짜 옆쪽 카메라 구멍. 구멍은 테스트 안에서만 설정했다. `DdsFrameCheck`가 옆 여백(시스템 줄·구멍)을 다루는 부분은 테스트가 없다.
- 오른쪽에서 왼쪽으로 쓰는 기기 언어, 그리고 그때의 카메라 구멍.
- 화면 분할: 앱 창이 화면보다 작을 때 틀 밖의 `ddsFrame()`이 읽는 폭.
- 따로 만든 앱의 빌드에서 이 꾸러미를 받아 쓰기, 그리고 릴리스 워크플로가 세 번째 꾸러미를 올리는지(올리는
  단계가 꾸러미를 내는 모든 모듈을 덮지만 돌려 보지 않았다).
- TalkBack으로 듣기.

알고도 그대로 둔 것: 상단 줄 끝의 글자 버튼은 끝선보다 12dp 나간다(끝에 12dp를 준다). 두 줄 판단은 시스템이
알려 주는 옆쪽 구멍을 자리에서 뺀다. 그래서 틀 위의 무언가가 이미 그만큼 비켜 놓았다면 두 번 빠지고, 두 줄이
몇 dp 일찍 된다. 좁은 상단 줄에 아이콘이 일곱 개 넘게 있으면 제목과 겹치는지 재지 않는다. Expanded 창에서 두 줄 판단은 고정
목록이 보일 때는 그 옆에 남은 자리를, 아닐 때는 목록 없는 자리를 잰다. 그래서 긴 제목 하나가 목록 있는
영역에서는 상단 줄을 높이고 다른 곳에서는 낮게 둘 수 있다.
