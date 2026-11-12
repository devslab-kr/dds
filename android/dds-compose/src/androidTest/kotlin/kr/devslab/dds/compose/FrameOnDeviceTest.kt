package kr.devslab.dds.compose

import androidx.compose.foundation.clickable
import androidx.core.graphics.Insets
import androidx.core.view.WindowInsetsCompat
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.ui.Alignment
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalWindowInfo
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.test.DeviceConfigurationOverride
import androidx.compose.ui.test.FontScale
import androidx.compose.ui.test.ForcedSize
import androidx.compose.ui.test.LayoutDirection
import androidx.compose.ui.test.WindowInsets
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollToIndex
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import kr.devslab.dds.compose.component.DdsBottomBar
import kr.devslab.dds.compose.component.DdsNavItem
import kr.devslab.dds.compose.component.DdsNavRail
import kr.devslab.dds.compose.component.DdsScaffold
import kr.devslab.dds.compose.icons.DdsIcons
import kr.devslab.dds.compose.layout.DdsAppFrame
import kr.devslab.dds.compose.layout.DdsBodyColumn
import kr.devslab.dds.compose.layout.ddsBodyLines
import kr.devslab.dds.compose.motion.DdsMove
import kr.devslab.dds.compose.motion.DdsScreenHost
import kr.devslab.dds.compose.motion.isReducedMotion
import androidx.test.platform.app.InstrumentationRegistry
import kr.devslab.dds.compose.layout.DdsFrame
import kr.devslab.dds.compose.layout.DdsTestTags
import kr.devslab.dds.compose.layout.DdsWindowWidth
import kr.devslab.dds.compose.layout.ddsFrame
import kr.devslab.dds.compose.layout.ddsWindowWidth
import kr.devslab.dds.compose.theme.DdsTheme
import kr.devslab.dds.tokens.DdsBar
import kr.devslab.dds.tokens.DdsBorder
import kr.devslab.dds.tokens.DdsScreen
import kr.devslab.dds.tokens.DdsIcon
import kr.devslab.dds.tokens.DdsSpace
import kr.devslab.dds.tokens.DdsTouch
import kr.devslab.dds.compose.component.DdsIconButton
import kr.devslab.dds.compose.component.DdsTopBar
import androidx.compose.foundation.layout.size
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.geometry.Offset
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.test.click
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.unit.Density
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeFalse
import org.junit.Rule
import org.junit.Test

/**
 * The parts of the screen frame measured on a device: the navigation at large text, and
 * (in later tests) the frame's size classes and body column.
 */
class FrameOnDeviceTest {
    @get:Rule
    val rule = createComposeRule()

    private val long = "거래처 매출 관리"
    private val short = "거래처 관리"

    private fun items(vararg labels: String): List<DdsNavItem> = labels.map { DdsNavItem(it, DdsIcons.Doc) }

    /** [content] under the theme at font scale [scale]. */
    private fun shown(scale: Float = 1f, content: @Composable () -> Unit) {
        rule.setContent {
            DeviceConfigurationOverride(DeviceConfigurationOverride.FontScale(scale)) {
                DdsTheme { content() }
            }
        }
    }

    /** The text layout the node reports: how many lines it drew and whether it ran out of room. */
    private fun layoutOf(node: SemanticsNodeInteraction): TextLayoutResult {
        val results = mutableListOf<TextLayoutResult>()
        val semantics: SemanticsNode = node.fetchSemanticsNode()
        semantics.config[SemanticsActions.GetTextLayoutResult].action!!.invoke(results)
        return results.single()
    }

    /** The label [text] is on two lines and inside the part tagged [barTag]; returns its layout. */
    private fun assertLabelIsTwoLinesInside(text: String, barTag: String): TextLayoutResult {
        val label = rule.onNodeWithText(text, useUnmergedTree = true)
        val layout = layoutOf(label)
        assertEquals("the label's lines", 2, layout.lineCount)
        val bar = rule.onNodeWithTag(barTag).getUnclippedBoundsInRoot()
        val bounds = label.getUnclippedBoundsInRoot()
        assertTrue("label $bounds is inside the bar $bar", bounds.top >= bar.top && bounds.bottom <= bar.bottom)
        assertTrue("label $bounds is inside the bar $bar", bounds.left >= bar.left && bounds.right <= bar.right)
        return layout
    }

    @Test
    fun aLongLabelIsShownOnTwoLinesNotCutInTheBottomTabs() {
        shown(scale = 2f) { DdsBottomBar(items(long, "홈", "설정", "더보기"), 0, {}, Modifier) }
        val layout = assertLabelIsTwoLinesInside(long, DdsTestTags.BottomTabs)
        assertFalse("the label ran out of room", layout.hasVisualOverflow)
    }

    /** The rail is 80dp wide, so a label that fits two lines there is a shorter one. */
    @Test
    fun aLabelIsShownOnTwoLinesNotCutInTheRail() {
        shown(scale = 2f) { Box(Modifier.height(600.dp)) { DdsNavRail(items(short, "홈"), 0, {}) } }
        val layout = assertLabelIsTwoLinesInside(short, DdsTestTags.Rail)
        assertFalse("the label ran out of room", layout.hasVisualOverflow)
    }

    /** What the 80dp rail does with a label that needs three lines: two, and an ellipsis, inside the rail. */
    @Test
    fun aLabelTooLongForTheRailEndsInAnEllipsisAfterTwoLines() {
        shown(scale = 2f) { Box(Modifier.height(600.dp)) { DdsNavRail(items(long, "홈"), 0, {}) } }
        val layout = assertLabelIsTwoLinesInside(long, DdsTestTags.Rail)
        assertTrue("the second line ends in an ellipsis", layout.isLineEllipsized(1))
    }

    @Test
    fun theRailScrollsWhenItsItemsDoNotFit() {
        val labels = (1..6).map { "항목 $it" }.toTypedArray()
        shown { Box(Modifier.height(200.dp)) { DdsNavRail(items(*labels), 0, {}) } }
        rule.onNodeWithText("항목 6").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun theRailIsItsTokenWide() {
        shown(scale = 2f) { Box(Modifier.height(600.dp)) { DdsNavRail(items(long, "홈"), 0, {}) } }
        val bounds = rule.onNodeWithTag(DdsTestTags.Rail).getUnclippedBoundsInRoot()
        assertEquals(DdsBar.rail.dp, bounds.right - bounds.left)
    }

    // ---- the frame: what is drawn at each width ----

    private val four = items("홈", "거래처", "주문", "설정")

    /** What a screen inside the frame sees from [ddsFrame]. */
    private var seen: DdsFrame? = null

    /**
     * The frame with four destinations around one screen under a forced window [size]. The screen is a
     * [DdsScaffold] drawing the bottom tabs when [topLevel]; its body is the box tagged `screen-body`.
     * [override] wraps the frame in another device override (layout direction, insets).
     */
    private fun frame(
        size: DpSize,
        navigation: Boolean = true,
        list: Boolean = false,
        topLevel: Boolean = true,
        destinations: List<DdsNavItem> = four,
        override: @Composable (@Composable () -> Unit) -> Unit = { it() },
        body: @Composable (PaddingValues) -> Unit = { padding ->
            seen = ddsFrame()
            Box(Modifier.fillMaxSize().padding(padding).testTag("screen-body")) { Text("화면") }
        },
    ) {
        rule.setContent {
            DeviceConfigurationOverride(DeviceConfigurationOverride.ForcedSize(size)) {
                override {
                    DdsTheme { FrameUnderTest(navigation, list, topLevel, destinations, body) }
                }
            }
        }
    }

    @Composable
    private fun FrameUnderTest(
        navigation: Boolean,
        list: Boolean,
        topLevel: Boolean,
        destinations: List<DdsNavItem>,
        body: @Composable (PaddingValues) -> Unit,
    ) {
        DdsAppFrame(
            navItems = destinations,
            selectedIndex = 0,
            onSelect = {},
            modifier = Modifier.testTag("frame"),
            navigation = navigation,
            list = if (list) ({ Box(Modifier.fillMaxSize().testTag("list-body")) { Text("목록") } }) else null,
        ) {
            DdsScaffold(topBar = {}, bottomTabs = topLevel, content = body)
        }
    }

    private fun bounds(tag: String) = rule.onNodeWithTag(tag).getUnclippedBoundsInRoot()

    private fun assertNear(message: String, expected: Dp, actual: Dp) =
        assertEquals(message, expected.value, actual.value, 0.6f)

    @Test
    fun aNarrowWindowHasBottomTabsOnATopLevelScreenOnly() {
        frame(DpSize(475.dp, 751.dp), list = true, topLevel = true)
        rule.onNodeWithTag(DdsTestTags.BottomTabs).assertExists()
        rule.onNodeWithTag(DdsTestTags.Rail).assertDoesNotExist()
        rule.onNodeWithTag(DdsTestTags.ListPane).assertDoesNotExist()
    }

    @Test
    fun aNarrowWindowHasNoTabsOnADeeperScreen() {
        frame(DpSize(475.dp, 751.dp), topLevel = false)
        rule.onNodeWithTag(DdsTestTags.BottomTabs).assertDoesNotExist()
        rule.onNodeWithTag(DdsTestTags.Rail).assertDoesNotExist()
    }

    @Test
    fun aMediumWindowHasTheRailAndNoList() {
        frame(DpSize(704.dp, 933.dp), list = true)
        rule.onNodeWithTag(DdsTestTags.Rail).assertExists()
        rule.onNodeWithTag(DdsTestTags.ListPane).assertDoesNotExist()
        rule.onNodeWithTag(DdsTestTags.BottomTabs).assertDoesNotExist()
    }

    @Test
    fun aWideWindowHasTheRailAndTheListBesideIt() {
        frame(DpSize(933.dp, 704.dp), list = true)
        val rail = bounds(DdsTestTags.Rail)
        val list = bounds(DdsTestTags.ListPane)
        val body = bounds("screen-body")
        assertNear("rail starts at the window edge", 0.dp, rail.left)
        assertNear("rail width", DdsBar.rail.dp, rail.right - rail.left)
        assertNear("the list starts where the rail's row ends", rail.right + DdsBorder.hairline.dp, list.left)
        assertNear("list width", DdsScreen.listPane.dp, list.right - list.left)
        assertNear("a hairline follows the list, then the content", list.right + DdsBorder.hairline.dp, body.left)
    }

    private fun assertNothingIsDrawnWithNavigationOff(size: DpSize) {
        frame(size, navigation = false, list = true, topLevel = true)
        rule.onNodeWithTag(DdsTestTags.Rail).assertDoesNotExist()
        rule.onNodeWithTag(DdsTestTags.ListPane).assertDoesNotExist()
        rule.onNodeWithTag(DdsTestTags.BottomTabs).assertDoesNotExist()
        rule.onNodeWithTag("screen-body").assertExists()
    }

    @Test
    fun withNoDestinationsNoTabsOrRailAreDrawn() {
        frame(DpSize(475.dp, 751.dp), destinations = emptyList(), topLevel = true)
        rule.onNodeWithTag(DdsTestTags.BottomTabs).assertDoesNotExist()
        rule.onNodeWithTag("screen-body").assertExists()
    }

    @Test
    fun withNoDestinationsNoRailIsDrawnWhenWide() {
        frame(DpSize(933.dp, 704.dp), destinations = emptyList(), topLevel = true)
        rule.onNodeWithTag(DdsTestTags.Rail).assertDoesNotExist()
        rule.onNodeWithTag("screen-body").assertExists()
    }

    @Test
    fun withNavigationOffNothingIsDrawnWhenNarrow() = assertNothingIsDrawnWithNavigationOff(DpSize(475.dp, 751.dp))

    @Test
    fun withNavigationOffNothingIsDrawnWhenMedium() = assertNothingIsDrawnWithNavigationOff(DpSize(704.dp, 933.dp))

    @Test
    fun withNavigationOffNothingIsDrawnWhenWide() = assertNothingIsDrawnWithNavigationOff(DpSize(933.dp, 704.dp))

    @Test
    fun aScreenReadsWhatTheFrameDrew() {
        frame(DpSize(933.dp, 704.dp), list = true)
        assertEquals(DdsFrame(DdsWindowWidth.Expanded, rail = true, listPinned = true), seen)
    }

    @Test
    fun outsideAFrameAScreenReadsOnlyTheWindowWidth() {
        var outside: DdsFrame? = null
        var expectedWidth: DdsWindowWidth? = null
        rule.setContent {
            DdsTheme {
                outside = ddsFrame()
                val density = LocalDensity.current
                expectedWidth = ddsWindowWidth(with(density) { LocalWindowInfo.current.containerSize.width.toDp() })
            }
        }
        assertEquals(DdsFrame(width = expectedWidth!!), outside)
    }

    @Test
    fun whatAScreenHoldsSurvivesTheWindowChangingWidth() {
        var size by mutableStateOf(DpSize(475.dp, 751.dp))
        var scrollIndex = -1
        rule.setContent {
            DeviceConfigurationOverride(DeviceConfigurationOverride.ForcedSize(size)) {
                DdsTheme {
                    DdsAppFrame(four, 0, {}, list = { Text("목록") }) {
                        DdsScaffold(topBar = {}, bottomTabs = true) { padding ->
                            var count by rememberSaveable { mutableIntStateOf(0) }
                            val state = rememberLazyListState()
                            scrollIndex = state.firstVisibleItemIndex
                            Column(Modifier.padding(padding)) {
                                Text("count $count", Modifier.testTag("count").clickable { count++ })
                                LazyColumn(Modifier.testTag("lazy"), state = state) {
                                    items(60) { Text("줄 $it", Modifier.height(40.dp)) }
                                }
                            }
                        }
                    }
                }
            }
        }
        rule.onNodeWithTag("count").performClick()
        rule.onNodeWithTag("count").performClick()
        rule.onNodeWithTag("lazy").performScrollToIndex(20)
        rule.waitForIdle()
        assertEquals(20, scrollIndex)
        rule.onNodeWithTag(DdsTestTags.Rail).assertDoesNotExist()
        size = DpSize(933.dp, 704.dp)
        rule.waitForIdle()
        rule.onNodeWithTag(DdsTestTags.Rail).assertExists()
        rule.onNodeWithTag(DdsTestTags.ListPane).assertExists()
        rule.onNodeWithText("count 2").assertExists()
        assertEquals("the scroll position", 20, scrollIndex)
        size = DpSize(475.dp, 751.dp)
        rule.waitForIdle()
        rule.onNodeWithText("count 2").assertExists()
        assertEquals("the scroll position after coming back", 20, scrollIndex)
    }

    @Test
    fun inRightToLeftTheRailIsOnTheRight() {
        frame(
            DpSize(933.dp, 704.dp),
            list = true,
            override = { content ->
                DeviceConfigurationOverride(DeviceConfigurationOverride.LayoutDirection(LayoutDirection.Rtl)) { content() }
            },
        )
        val root = bounds("frame")
        val rail = bounds(DdsTestTags.Rail)
        val list = bounds(DdsTestTags.ListPane)
        assertNear("rail ends at the right edge", root.right, rail.right)
        assertTrue("the list is left of the rail", list.right <= rail.left)
        assertTrue("the body is left of the list", bounds("screen-body").right <= list.left)
    }

    private fun withCutout(left: Dp = 0.dp, right: Dp = 0.dp): @Composable (@Composable () -> Unit) -> Unit = { content ->
        val density = LocalDensity.current
        val cutout = with(density) { Insets.of(left.roundToPx(), 0, right.roundToPx(), 0) }
        val insets = WindowInsetsCompat.Builder().setInsets(WindowInsetsCompat.Type.displayCutout(), cutout).build()
        DeviceConfigurationOverride(DeviceConfigurationOverride.WindowInsets(insets)) { content() }
    }

    private val cutout = 40.dp

    /** The label is drawn whole: on its one line, with no ellipsis. */
    private fun assertLabelIsWhole(label: SemanticsNodeInteraction) {
        val layout = layoutOf(label)
        assertEquals("the label's lines", 1, layout.lineCount)
        assertFalse("the label ends in an ellipsis", layout.isLineEllipsized(0))
    }

    @Test
    fun aCutoutAtTheStartLeavesTheRailItsFullWidthAfterTheCutout() {
        frame(DpSize(933.dp, 704.dp), list = true, override = withCutout(left = cutout))
        val rail = bounds(DdsTestTags.Rail)
        val list = bounds(DdsTestTags.ListPane)
        assertNear("the rail starts after the cutout", cutout, rail.left)
        assertNear("the rail keeps its width", DdsBar.rail.dp, rail.right - rail.left)
        assertNear("the list follows the rail", rail.right + DdsBorder.hairline.dp, list.left)
        assertNear("the content follows the list, the cutout is not taken twice", list.right + DdsBorder.hairline.dp, bounds("screen-body").left)
        val label = rule.onNodeWithText("거래처", useUnmergedTree = true)
        assertLabelIsWhole(label)
        val box = label.getUnclippedBoundsInRoot()
        assertTrue("the label $box is inside the rail $rail", box.left >= rail.left && box.right <= rail.right)
    }

    @Test
    fun withoutACutoutTheRailLabelIsNotCutEither() {
        frame(DpSize(933.dp, 704.dp), list = true)
        assertLabelIsWhole(rule.onNodeWithText("거래처", useUnmergedTree = true))
    }

    @Test
    fun aCutoutAtTheEndStopsTheContentAtTheCutout() {
        frame(DpSize(933.dp, 704.dp), list = true, override = withCutout(right = cutout))
        assertNear("the content ends at the cutout", bounds("frame").right - cutout, bounds("screen-body").right)
        assertNear("the rail is not moved", 0.dp, bounds(DdsTestTags.Rail).left)
    }

    @Test
    fun withNeitherRailNorListTheContentClearsBothCutouts() {
        frame(DpSize(933.dp, 704.dp), navigation = false, topLevel = true, override = withCutout(left = cutout, right = cutout))
        val body = bounds("screen-body")
        assertNear("starts at the start cutout", cutout, body.left)
        assertNear("ends at the end cutout", bounds("frame").right - cutout, body.right)
    }

    @Test
    fun withTheListAndNoRailTheListClearsTheStartCutout() {
        frame(DpSize(933.dp, 704.dp), list = true, destinations = emptyList(), override = withCutout(left = cutout, right = cutout))
        val list = bounds(DdsTestTags.ListPane)
        assertNear("the list starts at the start cutout", cutout, list.left)
        assertNear("the content ends at the end cutout", bounds("frame").right - cutout, bounds("screen-body").right)
    }

    // ---- the body column: one start line for every screen ----

    /** Where the area the frame leaves for the screen starts, and how wide it is, from what the frame drew. */
    private fun area(list: Boolean): Pair<Dp, Dp> {
        val root = bounds("frame")
        val hairline = DdsBorder.hairline.dp
        val left = when {
            list -> bounds(DdsTestTags.ListPane).right + hairline
            rule.onAllNodesWithTag(DdsTestTags.Rail).fetchSemanticsNodes().isNotEmpty() -> bounds(DdsTestTags.Rail).right + hairline
            else -> 0.dp
        }
        return left to (root.right - left)
    }

    private val bodyScreen: @Composable (PaddingValues) -> Unit = { padding ->
        Box(Modifier.fillMaxSize().padding(padding)) {
            DdsBodyColumn { Text("본문", Modifier.testTag("body-text")) }
        }
    }

    private fun assertBodyIsCentered(size: DpSize, list: Boolean) {
        frame(size, list = list, body = bodyScreen)
        val (areaLeft, areaWidth) = area(list)
        val body = bounds(DdsTestTags.Body)
        val width = minOf(DdsScreen.bodyMax.dp, areaWidth)
        assertNear("body width at $size list=$list", width, body.right - body.left)
        assertNear("body left at $size list=$list", areaLeft + (areaWidth - width) / 2, body.left)
    }

    @Test
    fun theBodyIsOneColumnInTheMiddleOfWhatTheFrameLeaves() {
        assertBodyIsCentered(DpSize(933.dp, 704.dp), list = false)
        val body = bounds(DdsTestTags.Body)
        assertNear("on a wide window without a list the body is a full reading column", DdsScreen.bodyMax.dp, body.right - body.left)
    }

    @Test
    fun theBodyFillsWhatTheListLeavesOnAWideWindow() = assertBodyIsCentered(DpSize(933.dp, 704.dp), list = true)

    @Test
    fun theBodyFillsAMediumWindowBesideTheRail() = assertBodyIsCentered(DpSize(704.dp, 933.dp), list = false)

    @Test
    fun theBodyFillsAPhone() {
        assertBodyIsCentered(DpSize(475.dp, 751.dp), list = false)
        val body = bounds(DdsTestTags.Body)
        assertNear("left", 0.dp, body.left)
        assertNear("width", 475.dp, body.right - body.left)
    }

    private fun assertTextStartsOnTheGutter(size: DpSize, list: Boolean) {
        frame(size, list = list, body = bodyScreen)
        val gutter = if (size.width < DdsScreen.breakpoint.dp) DdsScreen.gutter.dp else DdsScreen.gutterWide.dp
        assertNear("the text starts the gutter in from the body at $size", bounds(DdsTestTags.Body).left + gutter, bounds("body-text").left)
    }

    @Test
    fun theTextInTheBodyStartsOnTheGutter() = assertTextStartsOnTheGutter(DpSize(475.dp, 751.dp), list = false)

    @Test
    fun theTextInTheBodyStartsOnTheWideGutterOnAMediumWindow() = assertTextStartsOnTheGutter(DpSize(704.dp, 933.dp), list = false)

    @Test
    fun theTextInTheBodyStartsOnTheWideGutterOnAWideWindow() = assertTextStartsOnTheGutter(DpSize(933.dp, 704.dp), list = false)

    @Test
    fun theTextInTheBodyStartsOnTheWideGutterBesideAList() = assertTextStartsOnTheGutter(DpSize(933.dp, 704.dp), list = true)

    private fun assertABarOnTheBodysLinesLinesUpWithTheText(size: DpSize, list: Boolean) {
        frame(size, list = list, body = { padding ->
            Box(Modifier.fillMaxSize().padding(padding)) {
                DdsBodyColumn { Text("본문", Modifier.fillMaxWidth().testTag("body-text")) }
                Box(Modifier.align(Alignment.BottomCenter)) {
                    Box(Modifier.ddsBodyLines().height(8.dp).testTag("bar"))
                }
            }
        })
        val text = bounds("body-text")
        val bar = bounds("bar")
        assertNear("bar left at $size list=$list", text.left, bar.left)
        assertNear("bar right at $size list=$list", text.right, bar.right)
    }

    @Test
    fun aBarOnTheBodysLinesStartsWhereTheBodyTextStarts() {
        assertABarOnTheBodysLinesLinesUpWithTheText(DpSize(933.dp, 704.dp), list = false)
    }

    @Test
    fun aBarOnTheBodysLinesLinesUpOnAPhone() = assertABarOnTheBodysLinesLinesUpWithTheText(DpSize(475.dp, 751.dp), list = false)

    @Test
    fun aBarOnTheBodysLinesLinesUpBesideAList() = assertABarOnTheBodysLinesLinesUpWithTheText(DpSize(933.dp, 704.dp), list = true)

    @Test
    fun theBodyColumnScrollsWhenItsContentIsTaller() {
        frame(DpSize(475.dp, 751.dp), body = { padding ->
            Box(Modifier.fillMaxSize().padding(padding)) {
                DdsBodyColumn { repeat(40) { Text("줄 $it", Modifier.height(48.dp).testTag("row-$it")) } }
            }
        })
        rule.onNodeWithTag("row-39").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun theBodySlidesWhenTheScreenArrives() {
        assumeFalse("animations are turned off on this device", isReducedMotion(InstrumentationRegistry.getInstrumentation().targetContext))
        var screen by mutableStateOf("a")
        var move by mutableStateOf(DdsMove.None)
        rule.setContent {
            DdsTheme {
                DdsScreenHost(screen, move) { shown ->
                    DdsBodyColumn { Text("본문 $shown", Modifier.testTag("text-$shown")) }
                }
            }
        }
        fun left(shown: String) = rule.onNodeWithTag("text-$shown", useUnmergedTree = true).fetchSemanticsNode().boundsInRoot.left
        rule.mainClock.autoAdvance = false
        move = DdsMove.Push
        screen = "b"
        rule.mainClock.advanceTimeByFrame()
        rule.mainClock.advanceTimeByFrame()
        val arriving = left("b")
        rule.mainClock.autoAdvance = true
        rule.waitForIdle()
        val settled = left("b")
        assertTrue("the body starts to the trailing side of where it settles: $arriving vs $settled", arriving > settled + 1f)
    }

    // ---- the top bar: on the body's lines, and the tall bar ----

    private val backWord: String get() = InstrumentationRegistry.getInstrumentation().targetContext.getString(R.string.dds_a11y_back)

    private val noInsets = WindowInsetsCompat.Builder().build()

    private val phone = DpSize(475.dp, 751.dp)
    private val wide = DpSize(933.dp, 704.dp)

    /** The window's gutter at [size], from the width class. */
    private fun gutterAt(size: DpSize): Dp = if (size.width < DdsScreen.breakpoint.dp) DdsScreen.gutter.dp else DdsScreen.gutterWide.dp

    /**
     * A frame at [size] with a screen whose top bar is [topBar] (tagged `bar`) over a body column, no system
     * insets, at font [scale]; [barTitles] and [barReserve] go to the frame.
     */
    private fun barScreen(
        size: DpSize,
        scale: Float = 1f,
        barTitles: () -> List<String> = { emptyList() },
        barReserve: (String) -> Dp = { 0.dp },
        density: Float? = null,
        insets: WindowInsetsCompat = noInsets,
        topBar: @Composable () -> Unit,
    ) {
        rule.setContent {
            // The window is forced in pixels of the target density, then the content is given that density
            // (innermost, since the font scale override puts the device's density back).
            val root = LocalDensity.current
            val ratio = (density ?: root.density) / root.density
            DeviceConfigurationOverride(DeviceConfigurationOverride.ForcedSize(DpSize(size.width * ratio, size.height * ratio))) {
                DeviceConfigurationOverride(DeviceConfigurationOverride.WindowInsets(insets)) {
                    DeviceConfigurationOverride(DeviceConfigurationOverride.FontScale(scale)) {
                        CompositionLocalProvider(LocalDensity provides LocalDensity.current.let { Density(density ?: it.density, it.fontScale) }) {
                            DdsTheme {
                                DdsAppFrame(
                                    navItems = four,
                                    selectedIndex = 0,
                                    onSelect = {},
                                    modifier = Modifier.testTag("frame"),
                                    barTitles = barTitles(),
                                    barReserve = barReserve,
                                ) {
                                    DdsScaffold(topBar = topBar, bottomTabs = false) { padding ->
                                        Box(Modifier.fillMaxSize().padding(padding)) { DdsBodyColumn { Text("본문") } }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }


    private fun assertTitleLeft(expected: Dp, message: String) =
        assertEquals(message, expected.value, bounds(DdsTestTags.TopBarTitle).left.value, 1f) // a few pixel roundings add up

    private fun assertArrowAndLastIconOnTheLines(size: DpSize) {
        barScreen(size) {
            DdsTopBar("거래처", Modifier.testTag("bar"), onBack = {}) {
                DdsIconButton(DdsIcons.Search, "검색", {})
                DdsIconButton(DdsIcons.Plus, "추가", {}, Modifier.testTag("last-action"))
            }
        }
        val body = bounds(DdsTestTags.Body)
        val gutter = gutterAt(size)
        val back = rule.onNodeWithContentDescription(backWord).getUnclippedBoundsInRoot()
        val hang = (back.right - back.left - DdsIcon.md.dp) / 2
        // Rounding the gutter, the button and the glyph to pixels each costs up to half a pixel.
        val pixel = 1.5f / rule.density.density
        assertEquals("the arrow's glyph starts on the body's text line at $size", (body.left + gutter).value, (back.left + hang).value, pixel)
        val last = bounds("last-action")
        assertEquals("the last icon's glyph ends on the body's end line at $size", (body.right - gutter).value, (last.right - (last.right - last.left - DdsIcon.md.dp) / 2).value, pixel)
    }

    @Test
    fun theBackArrowAndTheLastIconStandOnTheBodysLines() = assertArrowAndLastIconOnTheLines(wide)

    @Test
    fun theBackArrowAndTheLastIconStandOnTheBodysLinesOnAPhone() = assertArrowAndLastIconOnTheLines(phone)

    private fun assertTheTitleStartsInTheSamePlaceAfterAMarkAndAfterAnArrow(size: DpSize, density: Float? = null) {
        var detail by mutableStateOf(false)
        barScreen(size, density = density) {
            DdsTopBar(
                "거래처",
                Modifier.testTag("bar"),
                leading = { Box(Modifier.size(DdsIcon.md.dp).testTag("mark")) },
                onBack = if (detail) ({}) else null,
            )
        }
        val d = density ?: rule.density.density
        // Pixels, from the unclipped bounds (the forced window is larger than the screen).
        fun left(tag: String) = bounds(tag).left.value * d // the node reports dp of its own density
        val bodyLeft = left(DdsTestTags.Body)
        val afterMark = left(DdsTestTags.TopBarTitle)
        assertEquals("the mark starts on the text line at $size density $d", bodyLeft + gutterAt(size).value * d, left("mark"), d)
        detail = true
        rule.waitForIdle()
        val afterArrow = left(DdsTestTags.TopBarTitle)
        // The same pixel, not the same within a dp: going from a tab screen to a detail must not move the title.
        assertEquals("the title's x after a mark and after an arrow at $size density $d", afterMark, afterArrow, 0.5f)
        assertEquals("the title is gutter + 40dp in from the body at $size density $d", bodyLeft + (gutterAt(size).value + DdsSpace.s40) * d, afterArrow, d)
    }

    @Test
    fun theTitleStartsInTheSamePlaceAfterAMarkAndAfterAnArrow() = assertTheTitleStartsInTheSamePlaceAfterAMarkAndAfterAnArrow(wide)

    @Test
    fun theTitleStartsInTheSamePlaceAfterAMarkAndAfterAnArrowOnAPhone() = assertTheTitleStartsInTheSamePlaceAfterAMarkAndAfterAnArrow(phone)

    // Densities where rounding the pieces one by one disagrees with rounding the sum (1.0625: 59px vs 60px on a phone, 68 vs 69 on a wider window).
    @Test
    fun theTitleDoesNotMoveAtDensity1p0625OnAPhone() = assertTheTitleStartsInTheSamePlaceAfterAMarkAndAfterAnArrow(phone, 1.0625f)

    @Test
    fun theTitleDoesNotMoveAtDensity1p0625OnAMediumWindow() = assertTheTitleStartsInTheSamePlaceAfterAMarkAndAfterAnArrow(DpSize(704.dp, 933.dp), 1.0625f)

    @Test
    fun theTitleDoesNotMoveAtDensity1p3() = assertTheTitleStartsInTheSamePlaceAfterAMarkAndAfterAnArrow(phone, 1.3f)

    @Test
    fun theTitleDoesNotMoveAtDensity1p5OnAMediumWindow() = assertTheTitleStartsInTheSamePlaceAfterAMarkAndAfterAnArrow(DpSize(704.dp, 933.dp), 1.5f)

    @Test
    fun theHangingPartsOfTheArrowAndTheLastIconCanBeTapped() {
        var backs = 0
        var lasts = 0
        barScreen(wide) {
            DdsTopBar("거래처", Modifier.testTag("bar"), onBack = { backs++ }) {
                DdsIconButton(DdsIcons.Search, "검색", {})
                DdsIconButton(DdsIcons.Plus, "추가", { lasts++ }, Modifier.testTag("last-action"))
            }
        }
        // 6dp in from the outer edge is in the 12dp the touch area reaches past the glyph.
        rule.onNodeWithContentDescription(backWord).performTouchInput { click(Offset(6.dp.toPx(), centerY)) }
        rule.onNodeWithTag("last-action").performTouchInput { click(Offset(width - 6.dp.toPx(), centerY)) }
        assertEquals("taps on the arrow's hanging strip", 1, backs)
        assertEquals("taps on the last icon's hanging strip", 1, lasts)
    }

    @Test
    fun aTitleWithNothingBeforeItStartsOnTheBodysLine() {
        barScreen(wide) { DdsTopBar("거래처", Modifier.testTag("bar")) }
        assertTitleLeft(bounds(DdsTestTags.Body).left + gutterAt(wide), "a bare title on a wide window")
    }

    @Test
    fun aTitleWithNothingBeforeItStartsOnTheBodysLineOnAPhone() {
        barScreen(phone) { DdsTopBar("거래처", Modifier.testTag("bar")) }
        assertTitleLeft(bounds(DdsTestTags.Body).left + gutterAt(phone), "a bare title on a phone")
    }

    @Test
    fun aBarWithNoActionsAndOneWithAButtonPassedAsLeadingDoNotBreak() {
        var asLeading by mutableStateOf(false)
        barScreen(phone) {
            DdsTopBar(
                "거래처",
                Modifier.testTag("bar"),
                leading = if (asLeading) ({ DdsIconButton(DdsIcons.ArrowLeft, "뒤로 가기", {}, Modifier.testTag("old-back")) }) else null,
            )
        }
        val bar = bounds("bar")
        fun assertTitleInsideTheBar(message: String) {
            val title = bounds(DdsTestTags.TopBarTitle)
            assertTrue("$message: the title $title is inside the bar $bar", title.left >= bar.left && title.right <= bar.right && title.top >= bar.top && title.bottom <= bar.bottom)
        }
        assertTitleInsideTheBar("with no actions")
        asLeading = true
        rule.waitForIdle()
        assertTitleInsideTheBar("with a button as leading")
        val old = bounds("old-back")
        assertNear("the old back button is 48dp wide", DdsTouch.min.dp, old.right - old.left)
        assertTrue("the title ${bounds(DdsTestTags.TopBarTitle)} does not overlap the button $old", bounds(DdsTestTags.TopBarTitle).left >= old.right)
    }

    private val longName = "거래처별 매출과 미수금 현황을 한눈에 보는 월간 종합 보고서 화면"

    @Test
    fun oneLongNameMakesEveryBarInTheWindowTall() {
        var titles by mutableStateOf(emptyList<String>())
        var title by mutableStateOf(longName)
        barScreen(phone, scale = 1.5f, barTitles = { titles }) { DdsTopBar(title, Modifier.testTag("bar")) }
        fun barHeight() = bounds("bar").let { it.bottom - it.top - DdsBorder.hairline.dp }
        assertNear("without barTitles the bar is the short one", DdsBar.top.dp, barHeight())
        val cut = layoutOf(rule.onNodeWithTag(DdsTestTags.TopBarTitle))
        assertEquals("without barTitles the long title is on one line", 1, cut.lineCount)
        assertTrue("and it is cut", cut.isLineEllipsized(0))

        titles = listOf(longName, "홈")
        rule.waitForIdle()
        assertNear("with a name that needs two lines the bar is tall", DdsBar.topTall.dp, barHeight())
        assertEquals("the long title is on two lines", 2, layoutOf(rule.onNodeWithTag(DdsTestTags.TopBarTitle)).lineCount)

        title = "홈"
        rule.waitForIdle()
        assertNear("a short title on another screen has the same tall bar", DdsBar.topTall.dp, barHeight())
    }

    @Test
    fun barReserveTakesRoomFromTheTitle() {
        var reserve by mutableStateOf(0.dp)
        val title = "거래처 매출 관리 현황 보고서"
        barScreen(phone, barTitles = { listOf(title) }, barReserve = { reserve }) { DdsTopBar(title, Modifier.testTag("bar")) }
        fun barHeight() = bounds("bar").let { it.bottom - it.top - DdsBorder.hairline.dp }
        assertNear("a title that fits alone keeps the short bar", DdsBar.top.dp, barHeight())
        reserve = 120.dp
        rule.waitForIdle()
        assertNear("with 120dp kept for something else the same title needs two lines", DdsBar.topTall.dp, barHeight())
    }

    @Test
    fun aShortBarAndALongBarAreTheSameHeightAtAVeryLargeFont() {
        var title by mutableStateOf("홈")
        barScreen(phone, scale = 3f, barTitles = { listOf(longName) }) { DdsTopBar(title, Modifier.testTag("bar")) }
        fun barHeight() = bounds("bar").let { it.bottom - it.top - DdsBorder.hairline.dp }
        val short = barHeight()
        assertTrue("the tall bar is at least ${DdsBar.topTall}dp, was $short", short >= DdsBar.topTall.dp - 0.6.dp)
        title = longName
        rule.waitForIdle()
        assertEquals("the long title takes two lines", 2, layoutOf(rule.onNodeWithTag(DdsTestTags.TopBarTitle)).lineCount)
        assertNear("a long title does not make its bar taller than a short one's", short, barHeight())
    }

    @Test
    fun aMediumWindowWithTheRailGivesTheTitleWhatIsLeftBesideTheRail() {
        val size = DpSize(640.dp, 900.dp)
        var reserve by mutableStateOf(0.dp)
        val title = "거래처 매출 관리 현황 보고서"
        barScreen(size, barTitles = { listOf(title) }, barReserve = { reserve }) { DdsTopBar(title, Modifier.testTag("bar")) }
        fun barHeight() = bounds("bar").let { it.bottom - it.top - DdsBorder.hairline.dp }
        assertNear("the title fits at first", DdsBar.top.dp, barHeight())
        val wanted = with(rule.density) { layoutOf(rule.onNodeWithTag(DdsTestTags.TopBarTitle)).multiParagraph.maxIntrinsicWidth.toDp() }
        // Beside the rail the title has the window less the rail and its hairline, the gutters, the arrow's room and two icons.
        val room = size.width - (DdsBar.rail + DdsBorder.hairline).dp - gutterAt(size) * 2 - DdsSpace.s40.dp - DdsTouch.min.dp * 2
        reserve = room - wanted + 20.dp
        rule.waitForIdle()
        assertNear("the title is 20dp short of fitting beside the rail, though it would fit without it", DdsBar.topTall.dp, barHeight())
    }

    @Test
    fun aCutoutAtTheSidesTakesRoomFromTheTitle() {
        val title = "거래처 매출 관리 현황 보고서"
        val cutouts = with(rule.density) { Insets.of(150.dp.roundToPx(), 0, 150.dp.roundToPx(), 0) }
        barScreen(
            phone,
            barTitles = { listOf(title) },
            insets = WindowInsetsCompat.Builder().setInsets(WindowInsetsCompat.Type.displayCutout(), cutouts).build(),
        ) { DdsTopBar(title, Modifier.testTag("bar")) }
        val height = bounds("bar").let { it.bottom - it.top - DdsBorder.hairline.dp }
        assertNear("150dp of cutout on each side leaves the title too little room", DdsBar.topTall.dp, height)
    }
}
