# Changelog — DDS for Android

**English** · [한국어](CHANGELOG.ko.md)

`kr.devslab:dds-android-tokens` and `kr.devslab:dds-compose` share one version,
separate from the web packages (D-048). Releases are cut by an `android-v<version>` tag.

## 0.2.1 — 2026-11-11

- Dark theme: the danger and info colors are one step lighter (`red.300`, `blue.300`),
  so error and notice text clears 4.5:1 on its own background (was 3.62:1 and 4.07:1).
  The same token change as the web (D-049). Nothing else changes.

## 0.2.0 — 2026-11-10

The first release on Maven Central.

**Values** (`dds-android-tokens`)

- Kotlin constants and XML resources generated from the web `tokens/*.json` and
  `tokens/native.json`: colors (light and dark), spacing, radius, heights, type, motion.
- `@color/dds_*` resources with `values-night` variants, and `@bool/dds_light_system_bars`.

**Theme and motion** (`dds-compose`)

- `DdsTheme`: the Material3 role mapping, Pretendard, eight type styles, large text mode.
- Brand override: redefine the six brand colors as color resources (the web's token
  names); XML and Compose change together and the contrast of the three pairs is checked.
- Motion: `ddsScreenContent`, `ddsAppear`, reduced motion, `DdsSplashHandoff` /
  `DdsSplashOverlay` / `ddsSplashTarget`, `DdsBusyBar`, `DdsLoadingRows`, `DdsPullRefresh`.

**Components and icons** (`dds-compose`)

- `DdsButton`, `DdsIconButton`, `DdsTextField`, `DdsCheckbox`, `DdsRadio`, `DdsSwitch`,
  `DdsCard`, `DdsSection`, `DdsDivider`, `DdsListRow`, `DdsNotice`, `DdsBadge`, `DdsChip`,
  `DdsEmptyState`, `DdsSpinner`, `DdsTopBar`, `DdsBottomBar`, `DdsNavRail`, `DdsScaffold`,
  `DdsDialog`.
- `DdsIcons`, generated from the `dds-icons` SVGs, and `DdsIcon`.

**Known**

- Dark status colors are below 4.5:1 (danger 3.62:1, info 4.07:1) — fixed in 0.2.1.
- Not yet built: bottom sheet, toast, in-page tabs, pickers, menu. Use the Material3
  ones under `DdsTheme`.

Minimum Android 8 (API 26). See the [guide](../docs/mobile-native.md).

## 0.1.0

Not released. It was published to the local Maven repository only, for the first
migration (values, theme and motion, without components).
