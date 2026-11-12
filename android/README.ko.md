# DDS Android

🌐 [English](README.md)

안드로이드 네이티브 앱용 DDS다. 값은 저장소 루트의 `tokens/*.json`에서 생성된다.
규칙은 [`docs/mobile-native.ko.md`](../docs/mobile-native.ko.md)에 있다.

| 모듈 | 좌표 | 내용 |
| --- | --- | --- |
| `dds-tokens` | `kr.devslab:dds-android-tokens` | 값만. Kotlin 상수와 XML 리소스. Compose 의존 없음 |
| `dds-compose` | `kr.devslab:dds-compose` | Material3 테마, 브랜드, 모션·불러오기 도우미, 부품, 아이콘 |
| `catalog` | 배포하지 않음 | 모든 값과 도우미를 화면에 띄우는 확인용 앱 |

최소 Android 8(API 26), compileSdk 36, Kotlin 2.2.20, Compose BOM 2026.01.00.

## 받아 쓰기

```kotlin
dependencies {
    implementation("kr.devslab:dds-compose:0.6.0") // dds-android-tokens를 함께 가져온다
}
```

```kotlin
setContent {
    DdsTheme {                       // 시스템의 밝은·어두운 설정을 따른다
        DdsCard {
            DdsTextField(name, { name = it }, label = "이름")
            DdsButton("저장", onClick = { }, loading = saving)
        }
    }
}
```

부품(버튼, 입력칸, 선택, 카드·목록 행, 안내, 바, 다이얼로그)과 생성된 아이콘은
[가이드 §12](../docs/mobile-native.ko.md)에 있다.

앱의 메인 색은 색 리소스로 덮어쓴다. XML과 Compose가 함께 바뀐다
([가이드 §3.1](../docs/mobile-native.ko.md)). 페이지 바탕, 옅은 바탕, 카드 바탕도 같은
방법으로 덮어쓴다(`dds_color_bg_default`, `dds_color_bg_subtle`, `dds_color_bg_elevated`).
글자 대비가 4.5:1에 못 미치면 거부된다. 앱이 그 조합의 예외를 적으면
통과한다(`dds_allow_contrast_*`). 적는 법은 가이드에 있다.

```xml
<!-- app/src/main/res/values/dds_brand.xml -->
<resources>
    <color name="dds_color_bg_brand">#0891B2</color>
</resources>
```

XML에서만 필요하면(스플래시 테마 등) `dds-android-tokens`만 넣고
`@color/dds_color_bg_default`, `@dimen/dds_space_16`, `@bool/dds_light_system_bars`를 쓴다.

Maven Central에 올라가기 전에는 로컬 저장소에서 받는다.

```bash
./gradlew publishToMavenLocal
```

```kotlin
// 받는 쪽 settings.gradle.kts, 저장소 목록 맨 앞
mavenLocal { content { includeGroup("kr.devslab") } }
```

## 값을 바꿀 때

값은 여기서 고치지 않는다. `tokens/*.json`(네이티브 전용 값은 `tokens/native.json`)을
고치고 저장소 루트에서 다시 생성한다.

```bash
node scripts/generate-android-tokens.mjs
```

`dds-tokens/src/main` 아래는 전부 생성물이다. 손으로 고치면 `pnpm run check`가
실패한다. `android/`의 다른 곳에 hex나 `Color(0x…)`를 적어도 실패한다.

글꼴 파일은 `python scripts/build-android-fonts.py`가 `packages/site-kit/fonts`의
글꼴에서 만든다(Pretendard 400·500·600·700, Geist Mono 400·500).

## 확인

```bash
./gradlew testDebugUnitTest          # 단위 테스트
./gradlew :catalog:installDebug      # 확인용 앱
```

`catalog`는 실행 인자로 상태를 고정할 수 있다.

```bash
adb -s <기기> shell am start -n kr.devslab.dds.catalog/.MainActivity \
  --es theme dark --es page parts --ez large true
```

`page`는 `colors`, `type`, `parts`, `motion`. 부품이나 값을 바꾸면 밝은·어두운,
글자 배율 200%, 큰 글자 모드, "애니메이션 삭제"에서 직접 띄워 본다.

## 기기 테스트

`dds-compose/src/androidTest`는 화면 낭독기에 전달되는 것을 읽고(`ScreenReaderTest`), 시계를 멈춘 채
움직임의 중간 지점을 잰다(`MotionOnDeviceTest`, Navigation 3 안에서 재는 `NavDisplayOnDeviceTest` —
Navigation 3은 테스트에만 쓰는 의존성이다 — 액티비티를 다시 만드는 `RebuiltWindowTest`,
그리고 걷히는 스플래시 덮개를 재는 `SplashOverlayOnDeviceTest`). 에뮬레이터나 폰이 필요해서
CI는 돌리지 않는다. 기기를 지정한다 — 지정하지 않으면 연결된 모든 기기에서 돈다.

```
ANDROID_SERIAL=<기기> ./gradlew :dds-compose:connectedDebugAndroidTest
```

## 버전과 배포

- 웹 패키지와 **다른 버전 번호**를 쓴다. 두 좌표는 항상 같은 버전이다(`gradle.properties`의 `VERSION_NAME`).
- 토큰 이름을 지우거나 바꾸는 변경, 공개 API를 지우는 변경은 major(0.x 동안은 minor)다.
- 배포는 `android-v<버전>` 태그를 올릴 때만 일어난다(`.github/workflows/android-release.yml`).
  DevsLab의 Java 라이브러리와 같은 시크릿 다섯 개가 이 저장소에 있어야 한다.
- 어느 값에서 만들었는지는 `DdsTokensInfo.sourceSha256`(토큰 파일의 해시)과 POM 설명
  (`@devslab/dds-tokens` 버전)에 남는다.

라이선스: [DevsLab Source-Available License 1.0](../LICENSE). 글꼴은 SIL OFL 1.1
(AAR의 `META-INF/licenses/`에 함께 들어간다).
