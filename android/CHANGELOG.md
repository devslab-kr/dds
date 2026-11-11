# Changelog — DDS for Android

**English** · [한국어](CHANGELOG.ko.md)

`kr.devslab:dds-android-tokens` and `kr.devslab:dds-compose` share one version,
separate from the web packages (D-048). Releases are cut by an `android-v<version>` tag.

## 0.5.0 — 2026-11-12

For people who use a screen reader, a keyboard or large text, and for eyes that are not
young. An audit of the components found these; device tests (`ScreenReaderTest`, 22) hold
what a screen reader is given.

**Seen by everyone**

- **A control's edge is darker.** New `borderControl` (`@color/dds_color_border_control`):
  3.25:1 on a light page, 3.26:1 on a dark card, where `borderStrong` was about 1.5:1. Text
  fields, the search and select fields, unchecked boxes and unselected radios use it, and
  Material's `outline` role maps to it. Card edges, dividers and labelled buttons keep the
  paler lines. The same token change as the web (D-050).
- **Placeholder text in dark is lighter** (`textMuted` in dark: 4.1:1 → 6.1:1).
- **`DdsSearchField`** shows its `label` as the placeholder when none is given (pass
  `placeholder = null` to keep the box empty). Clearing it now focuses the field.
- **`DdsChip`, `DdsTabs`:** the selected one is heavier as well as colored; its width does
  not change. Tabs still share the width, and now scroll when a label does not fit its share
  instead of cutting it. The underline still slides to the chosen tab (200ms). The row is now DDS's own rather than Material's scrollable tab
  row, which never settles under a parent that asks for intrinsic sizes.
- **Screens and tabs fade again — `ddsScreenChange(move, reduced)`.** A change of screen is
  now always two screens, one over the other, so no frame is empty: going forward the new
  screen appears over the one before (100ms) while its content slides, a bottom tab appears
  over the one before (150ms), going back the screen left fades away over the one returned
  to (100ms). 0.3.0 and 0.4.0 had taken these fades out because they faded in over nothing.
  In Navigation 3 put it in `NavDisplay`'s three transition specs, in place of
  `EnterTransition.None togetherWith ExitTransition.None`, and keep each entry in
  `DdsScreenMotion`; an app that changes screens itself uses the new `DdsScreenHost(screen,
  move)`. Each screen has to cover what is under it: do not empty a screen while it is
  leaving (use `DdsMove.None` for a move away from one that must be). Checked on an emulator
  with the clock held: inside Navigation 3 1.1.2 (`NavDisplayOnDeviceTest`) and in
  `DdsScreenHost` (`MotionOnDeviceTest`). Recorded frame by frame on a phone in JeongsanNow
  (SM-F971N, Android 17, folded, dark): five tab changes, two opens and two backs, with no
  frame on the way emptier than the screens on either side; a tab changes over about 150ms.
  **Not measured on a phone:** the back swipe (predictive back), folding and rotating frame
  by frame, the unfolded layout with a rail, light.
- **Going back slides again in Navigation 3.** A screen returned to came back without
  moving: it got its saved state back and counted as already arrived (found in Qooroo).
  Nothing to change in the app. The screen a window is rebuilt around (rotation, restore)
  still does not arrive again (`RebuiltWindowTest`). Seen on the phone as well: the content
  comes in from the leading edge.
- **Colors ease instead of switching (100ms):** a chip being chosen, a button's pressed
  fill, a tab's label — as on the web — and the edge of a text, search or select field.
- **The splash cover no longer dims the logo as it lifts.** With no destination to travel
  to, cover and logo faded as two layers, so half-way the background showed through the
  logo: a logo the first screen draws in the same place dipped a quarter of the way toward
  the background color for 150ms and came back (seen on a phone in JeongsanNow). They now
  lift as one picture. Nothing to change in the app. Checked on an emulator with the clock
  held (`SplashOverlayOnDeviceTest`), and on the phone in JeongsanNow, where the logo kept
  its brightness through the nine frames of the lift.
- **`DdsSelectField`** shows two lines of what was chosen. **`DdsDialog`:** a long message scrolls.
- **Choice rows** show the focus ring.

**Heard with a screen reader**

- **`DdsTextField`:** the label is part of the field and no longer a stop of its own. An
  error is spoken the moment it appears (it is heard on the field and on its line).
- **`DdsSelectField`:** the label is said once; what is in the box is said even when it is
  the placeholder.
- **`DdsSearchField`:** its name is text of the field, not a content description; the clear
  button is only there when there is something to clear.
- **`DdsNotice`:** says what kind it is ("Error", "Notice", …) even when the app passed no
  icon description, as one stop with its message, and is announced when it appears.
  `iconDescription = ""` turns the word off.
- **`DdsButton`:** a loading button says "Loading", keeps focus, ignores presses and does not
  look pressed.
- **`DdsListRow`:** a row that can be pressed says it is a button; a row that only shows
  something is read as one thing.
- **`DdsBusyBar(description)`** has a name. **`ddsScreenContent(paneTitle)`:** a screen can
  say its name when it appears. **`DdsBottomSheet`:** the handle has a name.
- New strings `dds_a11y_*` (English, Korean) for the words above.

**If you have tests**

- `DdsTextField` and `DdsSearchField` no longer have a content description:
  `onNodeWithContentDescription(label)` finds nothing. Use `hasSetTextAction() and hasText(label)`.
- `DdsSelectField` is found by content description; its visible label is not a node.
- Once `ddsScreenChange` is in, a tab fades in over 150ms. A test that compares pixels just
  after a tab change ("the first two frames show the new tab fully drawn") fails. Assert
  that no frame on the way is emptier than the two screens and that the end is fully drawn.
  (JeongsanNow had one such test, and two that found the search field by description.)

**Not done:** pull to refresh has no screen-reader equivalent — keep a visible refresh
button. Nobody has listened with TalkBack yet.

## 0.4.0 — 2026-11-11

From JeongsanNow running 0.3.0 on a phone, recorded frame by frame.

- **Changed — push and pop no longer fade in.** Content is opaque from its first frame and
  only slides (24dp). The 100ms fade left the content area empty for about eight frames
  under a top bar that was already there.
- **New — `DdsScreenMotion(move, active)` and `LocalDdsScreenActive`.** Keep drawing a
  screen that is leaving and tell it it is no longer current, instead of blanking it: a
  navigation host takes a few frames to swap entries, and an emptied entry showed as a blank
  screen (a white flash in dark) on every move. The guide said to remove the previous screen
  at once; rule 19 is corrected.
- **New — `DdsSearchField(applyDescription, searchEnabled)`:** an apply button at the end
  that can be dimmed on its own.

## 0.3.0 — 2026-11-11

From using JeongsanNow on a phone, and the components 0.2.0 left out.

- **New components:** `DdsSearchField`, `DdsSelectField`, `DdsValueRow`, `DdsTabs`,
  `DdsBottomSheet`, `DdsMenu` / `DdsMenuItem`, `DdsToastHost`.
- **Back rule:** `DdsBackHandler`, `rememberDdsTabTrail`, `ddsBackAction` — back goes to the
  screen before, then the tab before; leaving the app is asked, also on two presses within 600ms.
- **Changed — a tab switch no longer fades.** `DdsMove.Tab` is now "no movement": the 150ms
  fade over the emptied page read as a flicker on every tab press.
- **Fixed — text is read as written.** Component text drawn with `keepWords()` reached screen
  readers and tests with invisible joiners between the letters, so `onNodeWithText("저장")`
  did not match. Components now expose the original text; `Modifier.readAs()` does the same
  for text an app draws itself. A test that matched a DDS label with `"…".keepWords()` now
  matches the plain string.
- `dds-compose` now brings `androidx.activity:activity-compose` (for the back handler).

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
