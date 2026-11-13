# Changelog — DDS for Android

**English** · [한국어](CHANGELOG.ko.md)

`kr.devslab:dds-android-tokens`, `kr.devslab:dds-compose` and (from 0.7.0) `kr.devslab:dds-compose-testing` share one version,
separate from the web packages (D-048). Releases are cut by an `android-v<version>` tag.

## Next version (unreleased)

**New**

- **`DdsSegmentedControl`, `DdsSegment`** — one choice among a few visible options. The web SegmentedControl at its
  touch size: a `bg.subtle` track with a 1dp `border.strong` edge and radius 8, 2dp inside and between segments, the
  chosen one a `bg.default` face with a 1dp edge, a level-1 shadow and weight 600. The track is 50dp (48 of touch + the
  edge), a face 44dp, and the touch height is 56 in large text mode. Content width (the default) always holds the bold
  width, so choosing never moves a neighbour, and too many segments scroll inside the track; `fullWidth` shares the
  width equally and ends a long label in an ellipsis. Read as a radio group. `label`/`contentDescription`, `error`
  (edge color + a sentence + spoken), `readOnly`, `enabled`, and `enabled` per segment. Guide §12. The first consumer is
  Qooroo's card-type toggle, whose in-app copy `DdsStyleSegmented` this replaces.

## 0.7.0 — 2026-11-13

The screen frame (D-052), from JeongsanNow on an unfolded phone: screens started on
different lines (187, 147, 127dp, or edge to edge), the rail was there on tab screens
only, and the top bar started at the window's edge while the body started in the middle.
DDS had the numbers and no part that kept them. Now it has the parts. Guide §13.

JeongsanNow moved onto it from the local build and checked it before the release: every screen of its app on the DDS parts, at 475×751, 704×933 and 933×704 in light and dark (and 475×751 at 200% text), measured with `DdsFrameCheck` and `assertSameLines` — no start line off by more than 1dp; its whole device suite on the unfolded phone had no DDS failure. Not checked there: the phone actually turned on its side, TalkBack, the folded phone's whole suite.

**What is new**

- **`DdsAppFrame`** — once per app, outside the screen switcher. The window's width
  decides the menus: bottom tabs under 600dp (drawn by the top-level screens), a rail from
  600dp, a rail and the area's pinned list from 840dp. `navigation = false` turns them all
  off. The content stays where it is when a menu appears or goes, so a fold or a rotation
  keeps scroll positions and typed text.
- **`DdsFrame`, `LocalDdsFrame`, `ddsFrame()`** — what the frame decided, for a screen to
  read instead of measuring.
- **`DdsWindowWidth`, `ddsWindowWidth()`, `DdsWindowWidth.gutter`** — Compact / Medium /
  Expanded at 600 and 840; the gutter 16 / 24 / 24.
- **`DdsScaffold(topBar, modifier, bottomTabs)`** — one screen inside the frame. The system
  insets its padding already covers are marked used for the content, so a `DdsCenteredColumn`
  or an `imePadding()` inside does not pad them twice. The old `DdsScaffold(topBar, navItems, …)`
  is unchanged.
- **`DdsBodyColumn`, `Modifier.ddsBody()`, `Modifier.ddsBodyLines()`, `DdsBodyDefaults`**
  — one body column per screen, no wider than 680dp with its gutters, in the middle of what
  the rail and the list leave. `paneTitle` names the screen for a screen reader when it arrives.
- **`DdsTopBar(onBack, backEnabled, backDescription, columnMax)`** — the bar stands on the
  body's lines; `onBack` draws the arrow and lines it up. **`ddsBarNeedsTwoLines()`** — the
  two-line decision; inside a frame `barTitles` makes it for the whole window (104dp).
- **`DdsCenteredColumn`, `DdsCenteredTitle`** — a screen with one thing to do: one block,
  at most 400dp, in the middle of what the bars and the keyboard leave. Takes `paneTitle` too.
- **`DdsPaneList`, `DdsPaneItem`** — the rows of a pinned list.
- **`DdsTestTags`** — the tags the parts put on themselves.
- **New artifact `kr.devslab:dds-compose-testing`** — `DdsFrameCheck(rule).look(name, kind)`
  and `.assertSameLines()`: an app's device tests check that every screen keeps one start
  line and has only the menus its window and kind call for. It brings Espresso 3.7.0 (the
  one the Compose BOM brings, 3.5.0, does not run on Android 17).
- **New tokens:** `DdsScreen.breakpointExpanded` 840, `bodyMax` 680, `listPane` 264,
  `centeredMax` 400; `DdsBar.rail` 80, `topTall` 104.

```kotlin
implementation("kr.devslab:dds-compose:0.7.0")
androidTestImplementation("kr.devslab:dds-compose-testing:0.7.0")
```

**If you move up**

Code that compiled with 0.6.0 compiles with 0.7.0, with one exception: a `DdsTopBar` call
that passes its actions by position, `DdsTopBar(title, Modifier, { mark }, { actions })`,
does not, because the fourth parameter is now `onBack`. Pass `actions` by name or as the
trailing lambda. The change to `DdsTopBar`'s parameters is also binary-incompatible: a
library compiled against 0.6.0 that calls `DdsTopBar` must be rebuilt against 0.7.0. What
looks different without changing anything:

- **`DdsTopBar`.** On a wide window its content gathers into the body column's width
  (680dp) in the middle; the line under it and its background still span the area. The side
  gutter is 24 from a 600dp window (was 16 everywhere). A title after a `leading` mark
  starts 40dp after the start line. Code that passed a back button as `leading` still works
  but is not on the lines; move it to `onBack`. Action icons sit side by side, their 48dp
  touch areas touching; in 0.6.0 they were 12dp apart.
- **`DdsBottomBar`, `DdsNavRail`.** A label is no longer cut at one line; it takes up to
  two, and the bar or the rail item grows with it. The rail is always 80 wide. At 200% font
  a label that needs a third line is cut after the second.
- **A centered screen moves and paints.** `DdsCenteredColumn` slides in with the screen as a
  body column does, and paints the page (`bgDefault`) behind its whole area, so it covers the
  screen under it on every frame of a change, also in a `NavDisplay`.
- **The rows of a pinned list** that are not chosen are in the rail's grey (`textSecondary`),
  not the body color.

JeongsanNow, moving its own frame over: the gutter goes from 20 to 16 folded and 24
unfolded, the line under the top bar is always shown, and the space above the body is 16 or
24 (was 12 or 20). The mapping from its parts to DDS's is in the hand-over note and the
design (spec §10).

**Checked**

- Unit tests, lint and build: green.
- Device tests, the whole suite, read from the result files, on the phone (SM-F971N,
  Android 17): folded (window 1248x1972) 170 run, 0 failed, 0 errors, 2 skipped; unfolded
  (2448x1848, the wide window with the rail and the pinned list) 174 run, 0 failed, 0 errors,
  2 skipped, at the final code. The skipped are the menu's two exact-color checks, which cannot run there (0.6.0). The frame
  tests force the three windows inside the test.
- The catalog, on the new frame with a Layout page, on an emulator forced to 475×751,
  704×933 and 933×704: light at all three, dark at 933×704, the largest font at 475×751,
  the keyboard open at 475×751. The body's start and end lines were drawn over every
  capture; the arrow, the title, the last icon and the body text stand on them.
- `publishToMavenLocal`: three artifacts at 0.7.0. Only `dds-compose-testing`'s POM names
  Espresso.

**Not verified**

- JeongsanNow on its phone (the condition for the release).
- The catalog on the phone; the back swipe with the frame; a real side cutout (set in tests
  only); a right-to-left device language; split screen outside a frame; the testing artifact
  from a separate app's build; the release workflow publishing the third artifact; TalkBack.
- `DdsFrameCheck` with side insets, with a body of another width, with a dialog open.

## 0.6.0 — 2026-11-12

From Qooroo redrawing its app: white text on an orange face, a paper-colored page, a
white-faced secondary button, a menu without a shadow. A product can now decide more of
its colors, and says so where it does (D-053).

**What a product can now do**

- **Declare a contrast exception, pair by pair.** 4.5:1 stays the default and `DdsTheme`
  still refuses a brand below it. A product that wants a pair below it names the pair, and
  only that pair is left unchecked. There is no lower limit, so the product answers for
  how it reads. In resources: `dds_allow_contrast_text_on_brand`,
  `dds_allow_contrast_text_brand`, `dds_allow_contrast_text_on_background` (`bool`, `false`
  in DDS). In code: `DdsBrandColors(allow = setOf(DdsContrastPair.TextOnBrand))`. Light and
  dark are declared separately. A bool written only in `res/values` covers dark too; write
  `false` in `res/values-night` to have dark checked again.
- **Set the page, subtle and card backgrounds.** Redefine `dds_color_bg_default`,
  `dds_color_bg_subtle`, `dds_color_bg_elevated` in the app's own `res/values` and
  `res/values-night`, as with the six brand colors; or pass `bgDefault`, `bgSubtle`,
  `bgElevated` to `DdsBrandColors`. What is not set is DDS's. `DdsTheme.colors` and
  Material's `background` and `surface` roles follow. A background must be opaque. DDS
  has a dark value of its own for each background, so one written only in `res/values`
  changes the light theme only; write the dark one in `res/values-night`.
- **A plain text button:** `DdsButtonVariant.Plain` — no background, text in the body
  color. `Ghost` (brand-colored text) is unchanged.
- **A menu that ends on its button's end:** `DdsMenu(align = DdsMenuAlign.End)`, for a
  "more" button at the end of a row or a pane. With no room on that side it lines up with
  the button's start, then with the edge of the window; it never leaves the window. The
  default is `Start`, as before.
- **`DdsMenuDivider()`** — a 1dp line with 4dp above and below, for the line before a
  destructive item. A screen reader does not stop on it.

**What changes by itself when you move up**

- **The secondary button is a filled face.** `Secondary` is filled with the card
  background (`bgElevated`) instead of being transparent. On the default light page it
  looks exactly as it did (page and card are the same white). **In dark the face is now
  visibly lighter than the page** (`zinc.900` on `zinc.950`). On a colored page it is a
  white face. Edge and text are unchanged; pressed, a pale tint lies over the face.
- **The menu has no shadow.** It is set apart by the card background and a 1dp edge, like
  a card, a sheet and a dialog. In dark, a menu open over a card has the card's color and
  only the edge separates them.
- **Backgrounds an app already overrode now reach Compose.** An app that redefined
  `dds_color_bg_default`, `dds_color_bg_subtle` or `dds_color_bg_elevated` in 0.5.0 (for
  the splash or the window, say) now gets its Compose page, cards and Material
  `background` / `surface` in those colors, and the text on them is now checked.
- **What is in a menu sits in DDS's own column**, inside Material's. Width and order are
  the same. A child that used `Modifier.weight` or an alignment from the menu's
  `ColumnScope` now refers to that column. Content reads in the layout direction of the
  screen that opened the menu.

**What can newly be rejected when you move up**

Brand text (`textBrand`) is now checked on the subtle background and the card background
too; 0.5.0 checked it on the page and the pale brand background only. A brand that passed
0.5.0 narrowly can fail, and the app then does not start:

- **Light:** a `textBrand` between 4.50:1 and about 4.69:1 on white now fails on the
  subtle background.
- **Dark:** a `textBrand` between 4.50:1 and about 5.05:1 on the dark page now fails on
  the subtle background and the card background.

The message says which text on which background, the measured ratio, and what to do:
darken or lighten the color, or declare `TextBrand`. DDS's own brand passes everything
with nothing declared (the narrowest pair is 5.04:1).

Also new: a background that is not opaque is rejected, and no exception covers that. A
light background given to the dark theme fails under the dark theme's light text; the
message names the background to define in `res/values-night`. When brand text fails, the
message names the color to change (`dds_color_text_brand`).

**New names**

`DdsContrastPair` (`TextOnBrand`, `TextBrand`, `TextOnBackground`);
`DdsBrandColors.bgDefault`, `.bgSubtle`, `.bgElevated`, `.allow`; the three
`dds_allow_contrast_*` bools; `DdsButtonVariant.Plain`; `DdsMenuAlign` (`Start`, `End`);
`DdsMenu(align)`; `DdsMenuDivider`.

**If your code stops compiling**

- An exhaustive `when` over `DdsButtonVariant` needs a `Plain` branch.
- A call that passes `DdsMenu`'s content lambda inside the parentheses by position, as
  the fourth argument, no longer compiles: `align` now sits there. Use a trailing lambda
  or `content = { … }`.
- `DdsBrandColors` is source-compatible. A library compiled against 0.5.0 that calls
  `DdsBrandColors` or `DdsMenu` must be compiled again.

**Do not**

- Give an end-aligned menu's `modifier` anything that names a side (a start or end
  padding). What that does on an end-aligned menu is not tested.

**Checked**

- Unit tests: 79, none failed.
- Device tests, the whole suite, read from the result files. Emulator (Android 16,
  1080x2400): 74 run, none failed, none skipped. Phone (SM-F971N, Android 17, window
  2448x1848), before the last change to the rejection messages: 74 run, none failed, 2
  skipped — the two
  skipped are the menu's exact-color checks, which cannot run there (see below).
- The catalog's "Product colors" section, looked at on the emulator in light and dark, at
  normal and at the largest font size, menu closed and open: button rows of one height,
  no cut text, the menu's end on its button's end, nothing drawn outside the menu's edge,
  the white card and the white secondary button on the paper page.
- Test tooling only: the device tests now use Espresso 3.7.0, because the version the
  Compose test rule brings does not run on Android 17. It is a test dependency and is not
  in the published POM.

**Not verified**

- A device set to a right-to-left language. Right-to-left was set in the tests, not on
  the device.
- The whole suite on the phone at 1248x1972. It last passed there before the last tests
  were added (72). With all 74, a run at 1248x1972 had the five menu tests that read a
  screen capture fail, twice: the capture showed gray where the page should be. The cause
  is not known; another project's tests use the same phone. The whole 74 passed at 2448x1848.
- Resource overriding in a separate app. It was tested inside the library's own test APK
  with a stand-in (resources under a made-up locale). That stand-in does not behave like
  an app for the colors DDS defines in its own `values-night`.
- The focus ring and the loading state of `Plain` and of the filled `Secondary` on a
  device. They share code with what was there.
- A product's own card background under the `Secondary` button. The tests use DDS's, in
  light and dark; the catalog shows it on a product page with DDS's card color.
- The menu's exact colors (face, edge, divider) on the phone: its screen capture is
  tinted by the eye-comfort filter, so those two tests are skipped there and ran on the
  emulator only. The shadow check ran on both, under a system dialog that darkens the
  capture, which makes it less sensitive than a clean capture would be.
- On a product page, only the top bar and the bottom tabs were checked pixel by pixel.
  The rail, sheet, card, dialog and menu read the same values; that was read in code.
- The edge of a control (3:1) on a product background. DDS does not check it; the
  product does.
- Nobody has listened with TalkBack.
- No check that the public API stayed compatible exists in the build.

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
