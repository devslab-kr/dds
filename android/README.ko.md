# DDS Android

🌐 [English](README.md)

안드로이드 네이티브 앱용 DDS다. 값은 저장소 루트의 `tokens/*.json`에서 생성된다.
규칙은 [`docs/mobile-native.ko.md`](../docs/mobile-native.ko.md)에 있다.

| 모듈 | 좌표 | 내용 |
| --- | --- | --- |
| `dds-tokens` | `kr.devslab:dds-android-tokens` | 값만. Kotlin 상수와 XML 리소스. Compose 의존 없음 |
| `dds-compose` | `kr.devslab:dds-compose` | Material3 테마, 브랜드, 모션·불러오기 도우미, 부품, 아이콘, 화면 틀 |
| `dds-compose-testing` | `kr.devslab:dds-compose-testing` | 앱의 기기 테스트용. `DdsFrameCheck`가 앱 화면을 틀에 대고 잰다. Espresso 3.7.0을 함께 가져온다. 0.7.0부터 |
| `catalog` | 배포하지 않음 | 모든 값과 도우미를 화면에 띄우는 확인용 앱 |

최소 Android 8(API 26), compileSdk 36, Kotlin 2.2.20, Compose BOM 2026.01.00.

## 받아 쓰기

```kotlin
dependencies {
    implementation("kr.devslab:dds-compose:0.6.0") // dds-android-tokens를 함께 가져온다
}
```

0.7.0에서 화면 틀(가이드 §13)과 `dds-compose-testing` 꾸러미가, 0.8.0에서 `DdsSegmentedControl`(가이드 §12)이 생겼다.

```kotlin
dependencies {
    implementation("kr.devslab:dds-compose:0.10.1")
    androidTestImplementation("kr.devslab:dds-compose-testing:0.10.1")
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

## 소셜 로그인 선택 UI

`DdsSocialSignIn`은 앱이 연결한 제공자를 전달받아 순서대로 표시한다. 처음 세 수단은 화면에 표시하고 나머지는 ‘다른 로그인 방법’ 시트에서 고를 수 있다. 앱은 각 버튼의 현지화된 문구를 지정한다. DDS가 제공자 로고를 표시하며 `DdsSignInMethod.icon`으로 앱의 에셋을 지정할 수 있다. 인증을 시작할 때 `onSelect`에서 선택한 제공자 ID를 받는다.

```kotlin
DdsSocialSignIn(
    methods = listOf(
        DdsSignInMethod(DdsSocialProvider.Google, "Google로 계속하기"),
        DdsSignInMethod(DdsSocialProvider.Kakao, "카카오 로그인"),
        DdsSignInMethod(DdsSocialProvider.Naver, "네이버 로그인"),
        DdsSignInMethod(DdsSocialProvider.Discord, "Discord로 로그인"),
    ),
    onSelect = { provider -> startSignIn(provider.id) },
)
```

어떤 로그인 수단을 제공할지와 진행 상태는 호출 앱이 정한다. OAuth 설정, 계정 연결, 세션 저장은 해당 앱의 인증 계층이 처리한다. Android 컴포넌트의 공개 제공자 ID는 웹의 [`dds-auth`](../packages/dds-auth/README.ko.md) 카탈로그와 같다.

0.10.1부터 `DdsSocialSignInCustomization`을 넘기면 앱이 시트를 열고 닫거나 버튼, ‘다른 로그인 방법’ 동작, 오류 재시도 영역을 직접 구성할 수 있다. 처음 세 방법과 나머지 목록의 배치는 DDS가 맡는다. `method` 슬롯은 진행 상태, 활성 여부, 시트 배치 여부와 선택 동작을 받는다. `sheet` 슬롯은 받은 폭으로 본문을 배치해 기본 화면과 버튼을 맞출 수 있다. 사용자 지정 버튼에서 `DdsSocialProviderIcon`으로 DDS 로고를 그릴 수 있다.

Google, 카카오, 네이버, LINE, Microsoft, LinkedIn, GitHub, Discord, Figma, Notion, X, Slack, Zoom 로고를 함께 제공한다. GitLab은 기본으로 글자로 표시한다. Apple, Facebook, WeChat은 앱에서 해당 제공자의 승인된 에셋이나 전용 버튼을 사용할 수 있다.

Android의 네이버 아이콘은 공식 배포본 `NAVER_login_KR/NAVER_login_Light_KR_green_icon_H56.png` 원본이다. 카카오, Microsoft, GitHub, Slack의 SVG는 원래 색을 유지한 채 PNG로 변환했다. 어두운 테마에서는 GitHub와 카카오 원본에 흰 배경을 받치고 X는 공식 흰색 로고를 사용한다. 공식 출처와 원본 체크섬은 [공통 제공자 에셋 출처 기록](../packages/dds-auth/assets/provenance.json)에서 확인할 수 있다.

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

`page`는 `colors`, `type`, `parts`, `motion`, `layout`. `--es demo body|bar|centered|wholewindow`는 Layout 시연을, `--ei item 2`는 Motion의 항목(들어간 화면)을 바로 연다. 부품이나 값을 바꾸면 밝은·어두운,
글자 배율 200%, 큰 글자 모드, "애니메이션 삭제"에서 직접 띄워 본다.

## 기기 테스트

`dds-compose/src/androidTest`는 화면 낭독기에 전달되는 것을 읽고(`ScreenReaderTest`), 시계를 멈춘 채
움직임의 중간 지점을 잰다(`MotionOnDeviceTest`, Navigation 3 안에서 재는 `NavDisplayOnDeviceTest` —
Navigation 3은 테스트에만 쓰는 의존성이다 — 액티비티를 다시 만드는 `RebuiltWindowTest`,
그리고 걷히는 스플래시 덮개를 재는 `SplashOverlayOnDeviceTest`). `FrameOnDeviceTest`는 창을 세 가지(475×751,
704×933, 933×704)로 고정하고 화면 틀을 재고, `FrameCheckTest`는 `dds-compose-testing`의 검사를 잰다. 에뮬레이터나 폰이 필요해서
CI는 돌리지 않는다. 기기를 지정한다 — 지정하지 않으면 연결된 모든 기기에서 돈다.

```
ANDROID_SERIAL=<기기> ./gradlew :dds-compose:connectedDebugAndroidTest
```

## 버전과 배포

- 웹 패키지와 **다른 버전 번호**를 쓴다. 좌표들(0.7.0부터 셋)은 항상 같은 버전이다(`gradle.properties`의 `VERSION_NAME`).
- 토큰 이름을 지우거나 바꾸는 변경, 공개 API를 지우는 변경은 major(0.x 동안은 minor)다.
- 배포는 `android-v<버전>` 태그를 올릴 때만 일어난다(`.github/workflows/android-release.yml`).
  DevsLab의 Java 라이브러리와 같은 시크릿 다섯 개가 이 저장소에 있어야 한다.
- 어느 값에서 만들었는지는 `DdsTokensInfo.sourceSha256`(토큰 파일의 해시)과 POM 설명
  (`@devslab/dds-tokens` 버전)에 남는다.

라이선스: [DevsLab Source-Available License 1.0](../LICENSE). 글꼴은 SIL OFL 1.1
(AAR의 `META-INF/licenses/`에 함께 들어간다).
