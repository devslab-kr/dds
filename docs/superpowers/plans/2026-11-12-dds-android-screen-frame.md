# DDS Android Screen Frame Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give DDS Android the parts that make every screen keep one start line: a window-width frame (rail, pinned list, bottom tabs), a body column, a top bar on the body's lines, a centered block for single-task screens, and a check an app can run on its own screens.

**Architecture:** `DdsAppFrame` sits once outside the screen switcher and draws the rail and the pinned list; it tells screens what it drew through `LocalDdsFrame`. Screens draw their own top bar and (top-level screens, compact windows) the bottom tabs through a new `DdsScaffold` overload. Layout parts read the window gutter from the frame, never measure for themselves. A new artifact `dds-compose-testing` measures tagged nodes.

**Tech Stack:** Kotlin 2.2.20, Jetpack Compose (BOM 2026.01.00), Material3, Gradle (AGP 8.13), vanniktech maven-publish 0.34.0, Compose UI test (`DeviceConfigurationOverride.ForcedSize`), Node token generator.

**Spec:** `docs/superpowers/specs/2026-11-12-dds-android-screen-frame-design.ko.md` (decision record: `docs/decisions.md` D-052). Read both before starting.

## Global Constraints

- Branch `feat/android-screen-frame`. Run `git branch --show-current` before every commit and push. Stage files by name; never `git add -A`; never `git stash`.
- No AI attribution in commits, PR text or docs.
- No hand-written color or size literals in Kotlin (`scripts/check-android-sources.mjs`); tests use `Color.Red/Blue/Green`.
- Numbers, verbatim from the spec: breakpoints 600 and 840; gutter 16 (Compact) / 24 (Medium, Expanded); body max 680 (gutters included); list pane 264 plus a 1dp line; centered max 400; rail 80; top bar 64, tall 104; title starts at gutter + 40; icon button 48 with a 24 glyph, hanging 12 into the gutter; leading slot at least 28, then 12.
- `explicitApi()` is on: every public declaration needs `public` and KDoc in plain English.
- Device tests run only on the dedicated emulator: `ANDROID_SERIAL=emulator-5590` (AVD `dds_catalog_api36`, port 5590). Never touch `emulator-5554`, `emulator-5570` or the physical phone. Shut the emulator down when done (`adb -s emulator-5590 emu kill`).
- Every new test is seen failing for the right reason before the code that makes it pass.
- Before each commit: `./gradlew testDebugUnitTest lintDebug assembleDebug` in `android/`, and from the repo root `pnpm run verify` and `pnpm run verify:source:stage1-2`; read the output. Device tests: full `:dds-compose:connectedDebugAndroidTest`, and read the result XML for `tests/failures/skipped`.
- Docs are pairs: `*.md` and `*.ko.md` change together. Korean docs in plain words.
- Do not modify JeongsanNow or Qooroo. Do not publish: Maven release waits for JeongsanNow's check on a physical phone.

## Review Focus

- A long tab label at 200% font: the rail and the bottom tabs must show it on two lines, not cut it. (Task 4)
- A window that changes class while a screen holds state (unfold, rotate): scroll position and typed text must survive. (Task 5)
- A top bar with no leading and no actions, and one with a 48dp button passed as `leading` by existing code: neither may overlap or break. (Task 7)
- A centered block taller than the window at large text: it must start at the top and scroll, not be cut at both ends. (Task 8)
- Two top bars on screen at once (pinned list and screen): the check must read the screen's title, not the list's. (Task 9)

---

### Task 1: Prove the three assumptions the design rests on

**Files:**
- Create (throwaway, not committed): `android/dds-compose/src/androidTest/kotlin/kr/devslab/dds/compose/ProbeTest.kt`
- Modify: `docs/superpowers/specs/2026-11-12-dds-android-screen-frame-design.ko.md` (§13, record the answers)

**Interfaces:**
- Produces: three recorded facts later tasks rely on — (a) whether Material `NavigationBar`/`NavigationRailItem` grow for a two-line label, (b) whether `DeviceConfigurationOverride(DeviceConfigurationOverride.ForcedSize(DpSize(933.dp, 704.dp)))` gives `BoxWithConstraints.maxWidth == 933.dp` on the phone-sized emulator, (c) how `LocalWindowInfo.current.containerSize` reads under that override.

- [ ] **Step 1:** Write `ProbeTest` with three tests printing measured values with `println` and asserting: under `ForcedSize(DpSize(933.dp, 704.dp))` a `BoxWithConstraints` reports `maxWidth` within 1dp of 933; a `NavigationBar` holding an item whose label is two lines at `fontScale = 2f` (`DeviceConfigurationOverride.FontScale(2f)`) is taller than 80dp and the label node's bounds are inside the bar; the same for `NavigationRailItem`.
- [ ] **Step 2:** Run `ANDROID_SERIAL=emulator-5590 ./gradlew :dds-compose:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=kr.devslab.dds.compose.ProbeTest`. Read the output.
- [ ] **Step 3:** Write the three answers into spec §13. If (a) fails, Task 4 draws the tab row and rail items as DDS's own layout (as `DdsTabs` does in `Rows.kt`) instead of wrapping Material's; say so in §13. If (b) fails, device tests size the frame with `Modifier.requiredSize` inside a horizontally scrollable host and read `positionInRoot`/`size` instead; say so.
- [ ] **Step 4:** Delete `ProbeTest.kt`. Commit the spec change only: `docs(android): what the frame design assumed, checked on a device`.

### Task 2: Tokens

**Files:**
- Modify: `tokens/native.json` (`screen` and `bar` groups), `scripts/generate-android-tokens.mjs` (group descriptions only, if the text no longer fits)
- Regenerate: `android/dds-tokens/src/main/kotlin/kr/devslab/dds/tokens/DdsDimens.kt`, the generated `dimens` XML
- Test: `tests/android-tokens.test.mjs`

**Interfaces:**
- Produces: `DdsScreen.breakpointExpanded = 840`, `DdsScreen.bodyMax = 680`, `DdsScreen.listPane = 264`, `DdsScreen.centeredMax = 400`, `DdsBar.rail = 80`, `DdsBar.topTall = 104` (all `const val Int`), and the matching `@dimen/dds_screen_*`, `@dimen/dds_bar_*`.

- [ ] **Step 1:** Add a test to `tests/android-tokens.test.mjs` asserting the generated Kotlin contains the six constants with these values. Run `node --test tests/android-tokens.test.mjs`; expect it to fail on the missing constants.
- [ ] **Step 2:** Add to `tokens/native.json`: `screen.breakpoint-expanded` 840, `screen.body-max` 680, `screen.list-pane` 264, `screen.centered-max` 400, `bar.rail` 80, `bar.top-tall` 104 (`$type: dimension`); extend the two `$description`s.
- [ ] **Step 3:** Run `node scripts/generate-android-tokens.mjs`, then `node scripts/generate-android-tokens.mjs --check` and the test; expect pass.
- [ ] **Step 4:** Update the number table in `docs/mobile-native.md` and `.ko.md` (the row "화면 여백 / 블록 사이") with the new values so `pnpm run verify`'s doc sync passes. Run the full pre-commit set. Commit: `feat(android): numbers for the screen frame (840, 680, 264, 400, rail 80, tall bar 104)`.

### Task 3: Window width, the frame's report, test tags

**Files:**
- Create: `android/dds-compose/src/main/kotlin/kr/devslab/dds/compose/layout/WindowWidth.kt`, `.../layout/DdsFrame.kt`, `.../layout/DdsTestTags.kt`
- Test: `android/dds-compose/src/test/kotlin/kr/devslab/dds/compose/layout/WindowWidthTest.kt`

**Interfaces:**
- Produces:
  - `public enum class DdsWindowWidth { Compact, Medium, Expanded }`
  - `public fun ddsWindowWidth(width: Dp): DdsWindowWidth`
  - `public val DdsWindowWidth.gutter: Dp`
  - `@Immutable public class DdsFrame(public val width: DdsWindowWidth, public val rail: Boolean = false, public val listPinned: Boolean = false, public val tallBar: Boolean = false)` with `equals`/`hashCode`
  - `public val LocalDdsFrame: ProvidableCompositionLocal<DdsFrame?>` (default `null`)
  - `@Composable public fun ddsFrame(): DdsFrame` — `LocalDdsFrame.current`, else a frame with only `width`, taken from the window (use whichever source Task 1 (c) showed is right)
  - `internal class FrameNav(val items: List<DdsNavItem>, val selectedIndex: Int, val onSelect: (Int) -> Unit)` and `internal val LocalFrameNav: ProvidableCompositionLocal<FrameNav?>`
  - `public object DdsTestTags { const val Body = "dds-body"; TopBarTitle = "dds-top-bar-title"; Rail = "dds-rail"; ListPane = "dds-list-pane"; BottomTabs = "dds-bottom-tabs"; Centered = "dds-centered"; CenteredArea = "dds-centered-area" }`

- [ ] **Step 1:** Write `WindowWidthTest`:

```kotlin
@Test fun theTwoLinesBetweenTheThreeWidths() {
    assertEquals(DdsWindowWidth.Compact, ddsWindowWidth(599.dp))
    assertEquals(DdsWindowWidth.Medium, ddsWindowWidth(600.dp))
    assertEquals(DdsWindowWidth.Medium, ddsWindowWidth(839.dp))
    assertEquals(DdsWindowWidth.Expanded, ddsWindowWidth(840.dp))
}
@Test fun theGutterFollowsTheWindow() {
    assertEquals(16.dp, DdsWindowWidth.Compact.gutter)
    assertEquals(24.dp, DdsWindowWidth.Medium.gutter)
    assertEquals(24.dp, DdsWindowWidth.Expanded.gutter)
}
```

- [ ] **Step 2:** Run `./gradlew :dds-compose:testDebugUnitTest --tests "*WindowWidthTest"`; expect a compile failure (nothing exists yet).
- [ ] **Step 3:** Implement the three files from the Interfaces block. Values come from `DdsScreen`, not literals.
- [ ] **Step 4:** Run the test; expect pass. Pre-commit set. Commit: `feat(android): window width classes and what the frame tells a screen`.

### Task 4: Rail and bottom tabs at large text

**Files:**
- Modify: `android/dds-compose/src/main/kotlin/kr/devslab/dds/compose/component/Shell.kt` (`DdsBottomBar`, `DdsNavRail`, `NavLabel`)
- Test: create `android/dds-compose/src/androidTest/kotlin/kr/devslab/dds/compose/FrameOnDeviceTest.kt`

**Interfaces:**
- Consumes: `DdsBar.rail`, `DdsTestTags.Rail`, `DdsTestTags.BottomTabs`.
- Produces: `DdsBottomBar` and `DdsNavRail` keep their signatures. Labels wrap to two lines, centered; an item and the bar grow to hold them; the rail is `DdsBar.rail` wide and scrolls vertically when its items do not fit; both carry their test tag.

- [ ] **Step 1:** In `FrameOnDeviceTest` write `aLongLabelIsShownOnTwoLinesNotCut` (under `DeviceConfigurationOverride.FontScale(2f)`, a bar and a rail with the label "거래처 매출 관리": the label node's text layout has `lineCount == 2`, `hasVisualOverflow == false`, and its bounds lie inside the bar/rail) and `theRailScrollsWhenItsItemsDoNotFit` (a rail 200dp tall with six items: the last item can be brought on screen with `performScrollTo()` and is then displayed) and `theRailIsItsTokenWide` (80dp).
- [ ] **Step 2:** Run the class on the emulator; expect the first and third to fail (one line with ellipsis; width not pinned), the second to fail (no scroll).
- [ ] **Step 3:** Change `NavLabel` to `maxLines = 2`, `softWrap = true`, `textAlign = Center`; give the items and bars a minimum height that holds two label lines at the current font (the route Task 1 (a) chose); pin the rail width; add `verticalScroll` to the rail; add the tags. Update the KDoc that says a label is cut with an ellipsis.
- [ ] **Step 4:** Run the class; expect pass. Run the whole device suite (40 existing + these) and read the XML. Pre-commit set. Commit: `feat(android): a tab label takes two lines at large sizes; the rail scrolls`.

### Task 5: `DdsAppFrame` and the per-screen `DdsScaffold`

**Files:**
- Create: `android/dds-compose/src/main/kotlin/kr/devslab/dds/compose/layout/AppFrame.kt`
- Modify: `.../component/Shell.kt` (add the `DdsScaffold` overload; the existing one stays)
- Test: `FrameOnDeviceTest.kt`

**Interfaces:**
- Consumes: Task 3 types, `DdsNavRail`, `DdsBottomBar`, `DdsScreen.listPane`, `DdsBorder.hairline`.
- Produces:

```kotlin
@Composable
public fun DdsAppFrame(
    navItems: List<DdsNavItem>,
    selectedIndex: Int,
    onSelect: (Int) -> Unit,
    modifier: Modifier = Modifier,
    navigation: Boolean = true,
    barTitles: List<String> = emptyList(),
    barActions: Int = 2,
    barReserve: (title: String) -> Dp = { 0.dp },
    list: (@Composable () -> Unit)? = null,
    content: @Composable () -> Unit,
)

@Composable
public fun DdsScaffold(
    topBar: @Composable () -> Unit,
    modifier: Modifier = Modifier,
    bottomTabs: Boolean = false,
    content: @Composable (PaddingValues) -> Unit,
)
```

  Rules: `rail = navigation && width != Compact && navItems.isNotEmpty()`; `listPinned = navigation && width == Expanded && list != null`; the list slot is `DdsScreen.listPane` wide, tagged `DdsTestTags.ListPane`, followed by a 1dp `borderDefault` line; `content()` is called from one fixed place so its state survives the rail and list coming and going; horizontal safe insets: the rail takes the start side, the content area the end side (both when there is no rail and no list); `tallBar` is `false` in this task (Task 7 computes it). The new `DdsScaffold` draws `DdsBottomBar` from `LocalFrameNav` only when `bottomTabs && ddsFrame().width == Compact && LocalFrameNav.current != null`.

- [ ] **Step 1:** Add to `FrameOnDeviceTest` a helper `frame(size: DpSize, navigation: Boolean = true, list: Boolean = false, topLevel: Boolean = true)` that mounts `DdsAppFrame` (four items) around a `DdsScaffold(bottomTabs = topLevel)` under the forced size, and these tests, each asserting on the tags:
  - `aNarrowWindowHasBottomTabsOnATopLevelScreenOnly` (475×751: tabs when `topLevel`, none otherwise, never a rail)
  - `aMediumWindowHasTheRailAndNoList` (704×933 with `list = true`: rail, no list pane, no tabs)
  - `aWideWindowHasTheRailAndTheListBesideIt` (933×704 with `list = true`: rail at x 0..80, list pane at 80..344, a 1dp line, content from 345)
  - `withNavigationOffNothingIsDrawnAtAnyWidth` (three sizes)
  - `aScreenReadsWhatTheFrameDrew` (`ddsFrame()` inside content equals `DdsFrame(Expanded, rail = true, listPinned = true)`)
  - `whatAScreenHoldsSurvivesTheWindowChangingWidth` (a `rememberSaveable` counter and a scrolled `LazyColumn` inside content; switch the forced size from 475×751 to 933×704 through a `mutableStateOf`; both keep their values)
  - `inRightToLeftTheRailIsOnTheRight` (`DeviceConfigurationOverride.LayoutDirection(Rtl)`)
  - `aCutoutAtEitherSideIsKeptClear` (`DeviceConfigurationOverride.WindowInsets` with a 40dp display cutout at the start, then at the end, at 933×704: the rail's items start after the start cutout; the content area ends before the end cutout; with `navigation = false` the content clears both)
- [ ] **Step 2:** Run the class; expect compile failure, then (after empty stubs) each test failing on its assertion.
- [ ] **Step 3:** Implement `AppFrame.kt` (`BoxWithConstraints` → `Row`) and the `DdsScaffold` overload.
- [ ] **Step 4:** Run the class; expect pass. Whole device suite, XML, pre-commit set. Commit: `feat(android): DdsAppFrame — the rail and a fixed list outside the screens, bottom tabs inside them`.

### Task 6: Body column

**Files:**
- Create: `android/dds-compose/src/main/kotlin/kr/devslab/dds/compose/layout/Body.kt`
- Test: `FrameOnDeviceTest.kt`

**Interfaces:**
- Produces:

```kotlin
public fun Modifier.ddsBody(max: Dp = DdsScreen.bodyMax.dp): Modifier        // widthIn(max = max) + testTag(DdsTestTags.Body)
public fun Modifier.ddsBodyLines(max: Dp = DdsScreen.bodyMax.dp): Modifier   // widthIn(max).fillMaxWidth().padding(horizontal = gutter); no tag
public object DdsBodyDefaults { @Composable public fun contentPadding(): PaddingValues }  // the window gutter on all four sides
@Composable
public fun DdsBodyColumn(
    modifier: Modifier = Modifier,
    scroll: ScrollState = rememberScrollState(),
    max: Dp = DdsScreen.bodyMax.dp,
    spacing: Dp = DdsScreen.blockGap.dp,
    contentPadding: PaddingValues = DdsBodyDefaults.contentPadding(),
    content: @Composable ColumnScope.() -> Unit,
)
```

  `DdsBodyColumn` centers the column in its area (`Box(fillMaxSize, TopCenter)`), scrolls, and applies `ddsScreenContent()` itself.

- [ ] **Step 1:** Tests:
  - `theBodyIsOneColumnInTheMiddleOfWhatTheFrameLeaves` — at 933×704 without a list: body left ≈ 80 + (853 − 680)/2 = 166.5dp, width 680dp (JeongsanNow's measured line); with the list: left ≈ 345dp, width ≈ 588dp; at 475×751: left 0, width 475dp. Tolerance 1dp.
  - `theTextInTheBodyStartsOnTheGutter` — a tagged child's left is body left + 16dp at 475, + 24dp at 704 and 933.
  - `aBarOnTheBodysLinesStartsWhereTheBodyTextStarts` — a box with `ddsBodyLines()` placed in the same area has the same left and right as that child.
  - `theBodySlidesWhenTheScreenArrives` — inside `DdsScreenHost` with a `Push`, two frames in with the clock held, the body's left is to the trailing side of where it settles.
- [ ] **Step 2:** Run; expect failures.
- [ ] **Step 3:** Implement `Body.kt`.
- [ ] **Step 4:** Run; pass. Device suite, pre-commit set. Commit: `feat(android): the body column — one start line for every screen`.

### Task 7: Top bar on the body's lines, and the tall bar

**Files:**
- Modify: `.../component/Shell.kt` (`DdsTopBar`), `.../layout/AppFrame.kt` (compute `tallBar`), `android/dds-compose/src/main/res/values/dds_a11y.xml` and `values-ko/dds_a11y.xml` (`dds_a11y_back`: "Back" / "뒤로")
- Create: `.../layout/BarHeight.kt`
- Test: `FrameOnDeviceTest.kt`, `android/dds-compose/src/androidTest/.../ScreenReaderTest.kt` (back button's name)

**Interfaces:**
- Produces:

```kotlin
@Composable
public fun DdsTopBar(
    title: String,
    modifier: Modifier = Modifier,
    leading: (@Composable () -> Unit)? = null,
    onBack: (() -> Unit)? = null,
    backEnabled: Boolean = true,
    backDescription: String = stringResource(R.string.dds_a11y_back),
    columnMax: Dp = DdsScreen.bodyMax.dp,
    actions: @Composable RowScope.() -> Unit = {},
)

@Composable
public fun ddsBarNeedsTwoLines(
    areaWidth: Dp,
    titles: List<String>,
    actions: Int = 2,
    reserve: (title: String) -> Dp = { 0.dp },
    columnMax: Dp = DdsScreen.bodyMax.dp,
): Boolean
```

  Title room: `min(areaWidth, columnMax) − 2·gutter − 40 − 48·actions − reserve(title)`, measured with `rememberTextMeasurer()` in the `title2` style. In `DdsAppFrame`, `tallBar = barTitles.isNotEmpty() && ddsBarNeedsTwoLines(areaWidth = maxWidth − rail − list, barTitles, barActions, barReserve)`. `DdsTopBar`: content `widthIn(max = columnMax)` centered; title tagged `DdsTestTags.TopBarTitle`, `maxLines = if (tall) 2 else 1`; min height `DdsBar.topTall` or `DdsBar.top`; the divider and background span the whole area.

- [ ] **Step 1:** Tests (933×704 unless said):
  - `theBackArrowAndTheLastIconStandOnTheBodysLines` — the back button's bounds center ± 12dp gives a glyph left equal to body left + 24dp; the last action button's glyph right equals body right − 24dp.
  - `theTitleStartsInTheSamePlaceAfterAMarkAndAfterAnArrow` — title left is body left + gutter + 40dp in both, at 475×751 and 933×704.
  - `aTitleWithNothingBeforeItStartsOnTheBodysLine`.
  - `aBarWithNoActionsAndOneWithAButtonPassedAsLeadingDoNotBreak` — title bounds inside the bar, no overlap with the 48dp leading.
  - `oneLongNameMakesEveryBarInTheWindowTall` — with `barTitles` holding a name that needs two lines at `FontScale(1.5f)`, a screen whose own title is short has a bar 104dp tall; without `barTitles` it is 64dp and the long title is on one line.
  - `barReserveTakesRoomFromTheTitle` — a title that fits alone needs two lines once `barReserve` returns 120.dp.
  - In `ScreenReaderTest`: `theBackButtonHasAName`.
- [ ] **Step 2:** Run; expect failures (and note which existing `DdsTopBar` tests still pass).
- [ ] **Step 3:** Implement. Start padding `gutter − 12` when `onBack != null` (button 48, then 4), `gutter` otherwise (leading slot `widthIn(min = 28.dp)`, then 12). Actions sit in a row that reports its width 12dp short on the end side so the last 48dp button hangs into the gutter. Update the KDoc: back goes through `onBack`.
- [ ] **Step 4:** Run; pass. Device suite (the 22 `ScreenReaderTest` cases must still pass), XML, pre-commit set. Commit: `feat(android): the top bar keeps to the body's lines; one tall bar for the whole window`.

### Task 8: Centered block and the pinned list rows

**Files:**
- Create: `.../layout/Centered.kt`, `.../component/Pane.kt`
- Test: `FrameOnDeviceTest.kt`, `ScreenReaderTest.kt`

**Interfaces:**
- Produces:

```kotlin
@Composable public fun DdsCenteredColumn(modifier: Modifier = Modifier, max: Dp = DdsScreen.centeredMax.dp, content: @Composable ColumnScope.() -> Unit)
@Composable public fun DdsCenteredTitle(title: String, modifier: Modifier = Modifier, description: String? = null)
@Composable public fun DdsPaneList(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit)
@Composable public fun DdsPaneItem(label: String, selected: Boolean, onClick: () -> Unit, modifier: Modifier = Modifier, enabled: Boolean = true)
```

  `DdsCenteredColumn`: area tagged `CenteredArea`, block tagged `Centered`, block centered both ways, side padding the gutter, vertical padding `DdsScreen.blockGap`; when taller than the area it starts at the top and scrolls (`fillMaxHeight().verticalScroll()` with `Arrangement.Center`). `DdsCenteredTitle`: `title1`, centered, `LineBreak.Heading`, explicit line breaks kept, one heading to a screen reader; description `body2` in `textSecondary`. `DdsPaneItem`: min height `DdsControl.md` (`DdsTouch.large` in large text), `selectable(role = Role.Tab)`, selected = `bgBrandSubtle` fill + `textBrand` + SemiBold through `colorChange`, focus ring; `DdsPaneList`: scrolls, `selectableGroup()`, outer side padding `gutter − 12` so the label (inner padding 12) stands on the pane's gutter line.

- [ ] **Step 1:** Tests:
  - `theOneBlockIsInTheMiddleAndNoWiderThanItsLimit` — at 933×704: block width 400dp, equal space left/right and (within 1dp) above/below; at 475×751: width 475 − 32.
  - `aBlockTallerThanTheWindowStartsAtTheTopAndScrolls` — at `FontScale(2f)` with ten lines: the first child's top is at the area's top padding and the last can be scrolled to.
  - `theItemChosenInTheListLooksLikeTheRailsChoice` — the selected item's fill pixel equals the rail's selected pill color; the label is heavier.
  - `aListItemsLabelStandsOnTheGutterLine` — label left = pane left + 24dp at 933×704.
  - `ScreenReaderTest`: `theCenteredTitleIsOneHeading`, `aListItemSaysItIsChosenAndWhereItIs`.
- [ ] **Step 2:** Run; fail.
- [ ] **Step 3:** Implement the two files.
- [ ] **Step 4:** Run; pass. Device suite, pre-commit set. Commit: `feat(android): the centered block for a screen with one thing to do; rows for the fixed list`.

### Task 9: `dds-compose-testing`

**Files:**
- Create: `android/dds-compose-testing/build.gradle.kts`, `android/dds-compose-testing/src/main/kotlin/kr/devslab/dds/compose/testing/FrameCheck.kt`, `android/dds-compose-testing/src/main/AndroidManifest.xml` (if the plugin needs one)
- Modify: `android/settings.gradle.kts` (`include(":dds-compose-testing")`), `android/dds-compose/build.gradle.kts` (`androidTestImplementation(project(":dds-compose-testing"))`), `.github/workflows/android.yml` and `android-release.yml` (add `:dds-compose-testing:lintRelease` / `:assembleRelease` beside the other two)
- Test: `android/dds-compose/src/androidTest/kotlin/kr/devslab/dds/compose/FrameCheckTest.kt`

**Interfaces:**
- Consumes: `DdsTestTags`, `ddsWindowWidth`.
- Produces (artifact `kr.devslab:dds-compose-testing`, namespace `kr.devslab.dds.compose.testing`, `api(libs.compose.ui.test.junit4)`, `api(project(":dds-compose"))`, `mavenPublishing { coordinates(artifactId = "dds-compose-testing"); pom { name.set("DDS Compose Testing") } }`):

```kotlin
public enum class DdsScreenKind { TopLevel, Inner, Listed, WholeWindow }

public class DdsScreenReading(
    public val name: String, public val kind: DdsScreenKind, public val window: DdsWindowWidth,
    public val bodyLeftDp: Float, public val bodyWidthDp: Float, public val titleLeftDp: Float,
    public val rail: Boolean, public val listPane: Boolean, public val bottomTabs: Boolean,
)

public class DdsFrameCheck(private val rule: ComposeTestRule) {
    public fun look(name: String, kind: DdsScreenKind): DdsScreenReading
    public fun assertSameLines()
    public val readings: List<DdsScreenReading>
}
```

  `look` throws `AssertionError` naming the screen when: visible `Body` nodes ≠ 1; the screen's title (the visible `TopBarTitle` whose horizontal center lies inside the body's x-range) is not within the body's x-range ± 1px; the body's center is more than 1dp from the center of the area between (list pane right ?: rail right ?: window left) and window right; the menus differ from the table in spec §9.2; a list pane does not start at the rail's right or the body starts before the pane ends. `assertSameLines` throws when two readings of the same kind and the same `listPane` differ in `bodyLeftDp` or `bodyWidthDp` by more than 1dp.

- [ ] **Step 1:** `FrameCheckTest`: `aFrameThatKeepsTheRulesPasses` (the Task 5 helper frame with `DdsBodyColumn` and `DdsTopBar`, three sizes, four kinds); then one test per rule that builds a broken screen and expects `look` to throw with the screen's name in the message: two bodies; a top bar with `columnMax` 400 over a 680 body is allowed but a full-width title outside the body is not (title not capped); a body aligned to the start instead of centered; a rail on a `WholeWindow` screen; bottom tabs on an `Inner` screen; and `twoScreensOfAKindOnDifferentLinesFail` for `assertSameLines`. Also `withAFixedListTheScreensTitleIsRead` (two top bars on screen).
- [ ] **Step 2:** Run; compile failure, then failures.
- [ ] **Step 3:** Create the module and implement `FrameCheck.kt`.
- [ ] **Step 4:** Run; pass. `./gradlew :dds-compose-testing:lintRelease :dds-compose-testing:assembleRelease publishToMavenLocal` and confirm `~/.m2/repository/kr/devslab/dds-compose-testing/<version>/` holds a pom and an aar. Device suite, pre-commit set. Commit: `feat(android): dds-compose-testing — an app checks its own screens against the frame`.

### Task 10: The remaining device checks

**Files:**
- Test: `FrameOnDeviceTest.kt`, `MotionOnDeviceTest.kt`

**Interfaces:**
- Consumes: everything above, `DdsScreenHost`, `ddsScreenChange`.

- [ ] **Step 1:** Write, see fail by breaking the frame locally (move the rail inside the host; draw the bottom tabs in the frame), then restore:
  - `theRailDoesNotChangeWhileTheScreenBesideItChanges` — clock held, `DdsScreenHost` inside `DdsAppFrame` at 933×704: across 12 frames of a Push the rail's captured pixels are identical and its bounds do not move.
  - `openingAScreenOverATabCoversTheBottomTabsWithNoFrameEmpty` — 475×751: red top-level screen with bottom tabs, blue inner screen; every frame is red/blue/tab-bar colors only, and at the end no `BottomTabs` node is displayed.
  - `everyScreenOfTheSampleAppKeepsTheFrame` — a small sample app in the test (two tabs, an inner screen, a listed area, a whole-window screen, a centered gate) walked with `DdsFrameCheck` at the three sizes, then `assertSameLines()`.
  - `atTwiceTheFontNothingInTheFrameIsCut` — 475×751 and 933×704 at `FontScale(2f)`: no text node under the frame reports `hasVisualOverflow`.
- [ ] **Step 2:** Run; pass after restoring. Whole device suite; read the XML (`skipped` must be 0 with animations on). Pre-commit set. Commit: `test(android): the frame through a change of screen, and a whole sample app at three widths`.

### Task 11: Catalog and the look of it

**Files:**
- Modify: `android/catalog/src/main/kotlin/kr/devslab/dds/catalog/MainActivity.kt`, `Pages.kt`
- Create: `android/catalog/src/main/kotlin/kr/devslab/dds/catalog/LayoutPages.kt`

**Interfaces:**
- Consumes: the whole public API of this plan.

- [ ] **Step 1:** Move the catalog onto `DdsAppFrame` + `DdsScaffold(bottomTabs = true)` + `DdsBodyColumn` + `DdsTopBar(onBack = …)`. Add a fifth destination "Layout": a list of four demos (body column, top bar, centered block, whole window). At Expanded the list is pinned (`list = { DdsPaneList { … DdsPaneItem … } }`) and choosing swaps the screen; narrower, the list is a screen and a demo opens over it. The "whole window" demo sets `navigation = false`; the centered demo shows `DdsCenteredColumn` + `DdsCenteredTitle` with a field and a button.
- [ ] **Step 2:** Install on `emulator-5590`. For each of 475×751, 704×933, 933×704 (`adb -s emulator-5590 shell wm size` / `wm density`, reset afterwards with `wm size reset`, `wm density reset`) × light and dark × normal and large text: capture the tab screen, an inner screen, the Layout list and a demo beside it, the centered demo. Draw the body's start and end lines on each capture (a script over the PNGs using the measured dp) and look: the arrow glyph, the title, the last icon and the body text stand on those lines; rows are of even height; nothing is cut; the rail and list are where the table says.
- [ ] **Step 3:** Fix what the captures show, with a test first for each defect. Re-capture.
- [ ] **Step 4:** Reset the emulator's size, density and animation scale; shut it down. Pre-commit set. Commit: `feat(android): the catalog on the new frame, with a layout page`.

### Task 12: Documents, version, hand-over

**Files:**
- Modify: `docs/mobile-native.md` + `.ko.md` (a new "Screen frame / 화면 틀" section with the rules, numbers, the two samples — a Navigation 3 app and a `DdsScreenHost` app — and what was checked; the component table; §10 item 2: the gutter is decided), `android/CHANGELOG.md` + `.ko.md` (0.7.0), `android/README.md` + `.ko.md` (third artifact, install lines, device tests), `README.md` + `README.ko.md` (version line), `docs/decisions.md` (D-052: built, what was verified, what was not), `docs/backlog.md`, `android/gradle.properties` (`VERSION_NAME=0.7.0`), the spec's status line and a "달라진 것" list if the build departed from it
- Create: shared note `C:\Users\jlc48\AppData\Roaming\Claude\side-session-notes\local_87d93ef3-1438-478e-805e-3de580369000\dds-android-0.7.0-consumer.md`

- [ ] **Step 1:** Write the guide section and the changelog from what was built and measured, saying plainly what was not checked (a physical phone; the back swipe; light on a phone). List the visible changes of spec §10 under "If you move up".
- [ ] **Step 2:** Write the consumer note: the local Maven build (`publishToMavenLocal`, commit hash, time), the JeongsanNow mapping table of spec §10, the three windows to check on the phone and what to look for (start lines, title position, rail through a change, bottom tabs covered, large text), and that nothing is on Maven Central yet.
- [ ] **Step 3:** Full verification: unit tests, lint, assemble, whole device suite with the XML read, `pnpm run verify`, `pnpm run verify:source:stage1-2`, `publishToMavenLocal`. Commit: `docs(android): the screen frame in the guide; 0.7.0`.
- [ ] **Step 4:** Push; open the PR (title and body in English and Korean: what changed, what was checked, what was not); read CI to the end. Do not merge before the owner says so, and do not tag: the release waits for JeongsanNow's phone check (spec §3).
