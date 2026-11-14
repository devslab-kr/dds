# DDS Android

🌐 [한국어](README.ko.md)

DDS for native Android apps. The values are generated from `tokens/*.json` at the
repository root. The rules are in [`docs/mobile-native.md`](../docs/mobile-native.md).

| Module | Coordinate | Contents |
| --- | --- | --- |
| `dds-tokens` | `kr.devslab:dds-android-tokens` | Values only: Kotlin constants and XML resources. No Compose dependency |
| `dds-compose` | `kr.devslab:dds-compose` | Material3 theme, brand, motion and loading helpers, components, icons, the screen frame |
| `dds-compose-testing` | `kr.devslab:dds-compose-testing` | For an app's device tests: `DdsFrameCheck` checks its screens against the frame. Brings Espresso 3.7.0. From 0.7.0 |
| `catalog` | not published | An app that puts every value and helper on screen, for checking |

Minimum Android 8 (API 26), compileSdk 36, Kotlin 2.2.20, Compose BOM 2026.01.00.

## Using it

```kotlin
dependencies {
    implementation("kr.devslab:dds-compose:0.6.0") // brings dds-android-tokens
}
```

0.7.0 adds the screen frame (guide §13) and the `dds-compose-testing` artifact, and 0.8.0 `DdsSegmentedControl` (guide §12):

```kotlin
dependencies {
    implementation("kr.devslab:dds-compose:0.10.0")
    androidTestImplementation("kr.devslab:dds-compose-testing:0.10.0")
}
```

```kotlin
setContent {
    DdsTheme {                       // follows the system light/dark setting
        DdsCard {
            DdsTextField(name, { name = it }, label = "Name")
            DdsButton("Save", onClick = { }, loading = saving)
        }
    }
}
```

The components (buttons, fields, choices, cards and list rows, notices, bars, dialog)
and the generated icons are listed in [guide §12](../docs/mobile-native.md).

An app overrides its main color with a color resource; XML and Compose change
together ([guide §3.1](../docs/mobile-native.md)). The page, subtle and card
backgrounds are overridden the same way (`dds_color_bg_default`, `dds_color_bg_subtle`,
`dds_color_bg_elevated`). Text contrast under 4.5:1 is rejected unless the app declares
that pair (`dds_allow_contrast_*`); the guide says how.

```xml
<!-- app/src/main/res/values/dds_brand.xml -->
<resources>
    <color name="dds_color_bg_brand">#0891B2</color>
</resources>
```

For XML only (a splash theme), depend on `dds-android-tokens` alone and use
`@color/dds_color_bg_default`, `@dimen/dds_space_16`, `@bool/dds_light_system_bars`.

Until the packages are on Maven Central, install them from the local repository:

```bash
./gradlew publishToMavenLocal
```

```kotlin
// consumer settings.gradle.kts, first in the repository list
mavenLocal { content { includeGroup("kr.devslab") } }
```

## Social sign-in options

Pass the app's supported methods to `DdsSocialSignIn` in display order. It shows the first three and offers the remaining methods in a sheet. Each method takes a localized label. DDS draws the bundled brand mark by default, and `DdsSignInMethod.icon` accepts app-provided artwork. `onSelect` provides the public provider ID through the selected `DdsSocialProvider`.

```kotlin
DdsSocialSignIn(
    methods = listOf(
        DdsSignInMethod(DdsSocialProvider.Google, "Continue with Google"),
        DdsSignInMethod(DdsSocialProvider.Kakao, "Continue with Kakao"),
        DdsSignInMethod(DdsSocialProvider.Naver, "Continue with Naver"),
        DdsSignInMethod(DdsSocialProvider.Discord, "Continue with Discord"),
    ),
    onSelect = { provider -> startSignIn(provider.id) },
)
```

The host controls availability and progress. Its auth layer configures OAuth, links identities, and stores sessions. The public provider IDs match the web [`dds-auth`](../packages/dds-auth/README.md) catalog.

The bundled assets cover Google, Kakao, Naver, LINE, Microsoft, LinkedIn, GitHub, Discord, Figma, Notion, X, Slack, and Zoom. GitLab uses text by default. Apps can supply approved artwork or a dedicated provider button for Apple, Facebook, and WeChat.

Android uses the original full Naver green icon from `NAVER_login_KR/NAVER_login_Light_KR_green_icon_H56.png`. SVG marks from Kakao, Microsoft, GitHub, and Slack are rasterized with their original colors. The dark variants keep the original GitHub and Kakao marks on a white backing and use X’s white artwork. For the official sources and original checksums, see the [shared provider asset provenance](../packages/dds-auth/assets/provenance.json).

## Changing a value

Values are not edited here. Change `tokens/*.json` (native-only values live in
`tokens/native.json`) and regenerate from the repository root:

```bash
node scripts/generate-android-tokens.mjs
```

Everything under `dds-tokens/src/main` is generated. Editing it by hand fails
`pnpm run check`; so does a hex literal or a `Color(0x…)` anywhere else in `android/`.

The font files are built by `python scripts/build-android-fonts.py` from the fonts
in `packages/site-kit/fonts` (Pretendard 400, 500, 600, 700; Geist Mono 400, 500).

## Checking

```bash
./gradlew testDebugUnitTest          # unit tests
./gradlew :catalog:installDebug      # the catalog app
```

The catalog takes launch extras that pin a state:

```bash
adb -s <device> shell am start -n kr.devslab.dds.catalog/.MainActivity \
  --es theme dark --es page parts --ez large true
```

`page` is one of `colors`, `type`, `parts`, `motion`, `layout`. `--es demo body|bar|centered|wholewindow` opens a Layout demo; `--ei item 2` opens a Motion item (an inner screen). After changing a value or
a helper, look at it in light and dark, at a 200% font scale, in large text mode,
and with "Remove animations" on.

## Device tests

`dds-compose/src/androidTest` reads what a screen reader is given (`ScreenReaderTest`) and
measures what moves part-way through, with the clock held (`MotionOnDeviceTest`,
`NavDisplayOnDeviceTest` inside Navigation 3 — a test-only dependency — and
`RebuiltWindowTest`, which rebuilds the activity; `SplashOverlayOnDeviceTest` for the
splash cover as it lifts). `FrameOnDeviceTest` measures the screen frame in three forced windows (475×751,
704×933, 933×704), and `FrameCheckTest` the check of `dds-compose-testing`. It needs an
emulator or a phone, so CI does not run it. Name the device — the task otherwise runs on every device
that is connected:

```
ANDROID_SERIAL=<device> ./gradlew :dds-compose:connectedDebugAndroidTest
```

## Versions and releases

- Android has **its own version number**, apart from the web packages. The
  coordinates (three from 0.7.0) always share one version (`VERSION_NAME` in `gradle.properties`).
- Removing or renaming a token, or removing public API, is a major change (a minor one during 0.x).
- A release happens only when an `android-v<version>` tag is pushed
  (`.github/workflows/android-release.yml`). The repository needs the same five
  secrets the DevsLab Java libraries use.
- The source of the values is recorded in `DdsTokensInfo.sourceSha256` (a hash of
  the token files) and in the POM description (the `@devslab/dds-tokens` version).

License: [DevsLab Source-Available License 1.0](../LICENSE). Fonts are SIL OFL 1.1
(shipped in the AAR under `META-INF/licenses/`).
