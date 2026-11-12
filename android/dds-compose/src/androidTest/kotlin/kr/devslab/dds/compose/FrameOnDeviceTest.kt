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
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.hasScrollAction
import androidx.compose.ui.test.performSemanticsAction
import kr.devslab.dds.compose.component.DdsPaneItem
import kr.devslab.dds.compose.component.DdsPaneList
import kr.devslab.dds.compose.layout.DdsCenteredColumn
import kr.devslab.dds.compose.layout.DdsCenteredTitle
import kr.devslab.dds.tokens.DdsControl
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.SemanticsMatcher
import kr.devslab.dds.compose.layout.ddsBody
import kr.devslab.dds.compose.testing.DdsFrameCheck
import kr.devslab.dds.compose.testing.DdsScreenKind
import kr.devslab.dds.compose.theme.DdsBrand
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

    // ---- the centered block: a screen with one thing to do ----

    /**
     * A centered block holding [content] in a window of [size] at font [scale]: inside a frame with
     * its navigation off, or with no frame at all.
     */
    private fun centered(
        size: () -> DpSize,
        scale: Float = 1f,
        inFrame: Boolean = true,
        content: @Composable ColumnScope.() -> Unit,
    ) {
        rule.setContent {
            // The font scale goes outside: its override puts the device's density back, the forced size keeps the scale.
            DeviceConfigurationOverride(DeviceConfigurationOverride.FontScale(scale)) {
                DeviceConfigurationOverride(DeviceConfigurationOverride.ForcedSize(size())) {
                    DdsTheme {
                        if (inFrame) {
                            DdsAppFrame(four, 0, {}, navigation = false) { DdsCenteredColumn(content = content) }
                        } else {
                            DdsCenteredColumn(content = content)
                        }
                    }
                }
            }
        }
    }

    /** The block is [width] wide with the same space on its two sides, and the same above and below. */
    private fun assertTheBlockIsInTheMiddle(message: String, width: Dp) {
        val area = bounds(DdsTestTags.CenteredArea)
        val block = bounds(DdsTestTags.Centered)
        assertNear("$message: the block's width", width, block.right - block.left)
        // Centering lands on a whole pixel, which in a forced window can be most of a dp.
        assertEquals("$message: the space at its two sides", (block.left - area.left).value, (area.right - block.right).value, 1f)
        assertEquals("$message: the space above and below", (block.top - area.top).value, (area.bottom - block.bottom).value, 1f)
        assertTrue("$message: it does not start at the top", block.top - area.top > DdsScreen.blockGap.dp)
    }

    @Test
    fun theOneBlockIsInTheMiddleAndNoWiderThanItsLimit() {
        var size by mutableStateOf(wide)
        centered({ size }) { Text("한 가지 일", Modifier.fillMaxWidth().testTag("only")) }
        val window = bounds(DdsTestTags.CenteredArea)
        assertEquals("the area is the window", wide.width.value, (window.right - window.left).value, 1f)
        assertTheBlockIsInTheMiddle("on a wide window", DdsScreen.centeredMax.dp)

        // A folded phone's 475dp still has room for the whole 400dp block.
        size = phone
        rule.waitForIdle()
        val folded = bounds(DdsTestTags.CenteredArea)
        assertEquals("the area is the window", phone.width.value, (folded.right - folded.left).value, 1f)
        assertTheBlockIsInTheMiddle("on a folded phone", DdsScreen.centeredMax.dp)

        // A window narrower than the block and its gutters: the block is what the gutters leave.
        size = small
        rule.waitForIdle()
        val area = bounds(DdsTestTags.CenteredArea)
        assertEquals("the area is the window", small.width.value, (area.right - area.left).value, 1f)
        assertTheBlockIsInTheMiddle("on a small phone", area.right - area.left - DdsScreen.gutter.dp * 2)
        assertNear("on a small phone the block keeps the gutter", area.left + DdsScreen.gutter.dp, bounds(DdsTestTags.Centered).left)
    }

    /** A phone narrower than the centered block's limit and its two gutters. */
    private val small = DpSize(360.dp, 751.dp)

    @Test
    fun theOneBlockWorksWithoutAFrame() {
        centered({ small }, inFrame = false) { Text("한 가지 일", Modifier.fillMaxWidth()) }
        val area = bounds(DdsTestTags.CenteredArea)
        assertEquals("the area is the window", small.width.value, (area.right - area.left).value, 1f)
        assertTheBlockIsInTheMiddle("with no frame", area.right - area.left - DdsScreen.gutter.dp * 2)
    }

    @Test
    fun aBlockTallerThanTheWindowStartsAtTheTopAndScrolls() {
        centered({ phone }, scale = 2f) {
            repeat(10) { Text("줄 ${it + 1}\n둘째 줄", Modifier.testTag("line-$it"), style = DdsTheme.typography.title1) }
        }
        val area = bounds(DdsTestTags.CenteredArea)
        val gap = DdsScreen.blockGap.dp
        assertEquals("the area is the window, however tall the block", phone.height.value, (area.bottom - area.top).value, 1f)
        assertNear("the first line starts under the top padding, not cut above the window", area.top + gap, bounds("line-0").top)
        assertTrue("the last line starts below the window, so the block is taller than it", bounds("line-9").top > area.bottom)
        rule.onNodeWithTag("line-9").performScrollTo().assertIsDisplayed()
        // To the very end: more than there is left to scroll.
        rule.onNode(hasScrollAction()).performSemanticsAction(SemanticsActions.ScrollBy) { it(0f, 100_000f) }
        rule.waitForIdle()
        assertNear("scrolled to the end, the last line stands on the bottom padding", area.bottom - gap, bounds("line-9").bottom)
    }

    @Test
    fun aCenteredTitleKeepsItsLineBreaks() {
        centered({ wide }) {
            DdsCenteredTitle("정산을\n시작합니다", Modifier.testTag("two"))
            DdsCenteredTitle("정산을 시작합니다", Modifier.testTag("one"))
        }
        val two = bounds("two")
        val one = bounds("one")
        assertTrue("a title with a line break is a line taller: $two against $one", (two.bottom - two.top) > (one.bottom - one.top) + 20.dp)
        val block = bounds(DdsTestTags.Centered)
        val words = rule.onNodeWithText("정산을 시작합니다", useUnmergedTree = true).getUnclippedBoundsInRoot()
        assertNear("the title's words are in the middle of the block", (block.left + block.right) / 2, (words.left + words.right) / 2)
    }

    // ---- the rows of the pinned list ----

    /** A frame at [size] whose pinned list (or, on a narrow window, its one screen) is a pane list of [rows]. */
    private fun pane(
        size: DpSize = wide,
        scale: Float = 1f,
        largeText: () -> Boolean = { false },
        rows: @Composable ColumnScope.() -> Unit,
    ) {
        rule.setContent {
            DeviceConfigurationOverride(DeviceConfigurationOverride.FontScale(scale)) {
                DeviceConfigurationOverride(DeviceConfigurationOverride.ForcedSize(size)) {
                    DdsTheme(largeText = largeText()) {
                        val pinned = size.width >= DdsScreen.breakpointExpanded.dp
                        DdsAppFrame(four, 0, {}, Modifier.testTag("frame"), list = { DdsPaneList(content = rows) }) {
                            DdsScaffold(topBar = {}) { padding ->
                                Box(Modifier.fillMaxSize().padding(padding).testTag("screen-body")) {
                                    if (!pinned) DdsPaneList(content = rows)
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    private fun height(tag: String): Dp = bounds(tag).let { it.bottom - it.top }

    private fun label(text: String) = rule.onNodeWithText(text, useUnmergedTree = true).getUnclippedBoundsInRoot()

    @Test
    fun theItemChosenInTheListLooksLikeTheRailsChoice() {
        pane {
            DdsPaneItem("매출 현황", selected = true, onClick = {}, modifier = Modifier.testTag("chosen"))
            DdsPaneItem("매출 현황", selected = false, onClick = {}, modifier = Modifier.testTag("other"))
        }
        val pixels = rule.onRoot().captureToImage().toPixelMap()
        fun px(tag: String) = rule.onNodeWithTag(tag).fetchSemanticsNode().boundsInRoot
        val rail = px(DdsTestTags.Rail)
        val dp = rail.width / DdsBar.rail // pixels to a dp in this forced window
        val screen = px("screen-body")
        val page = pixels[(screen.right - 8 * dp).toInt(), screen.center.y.toInt()]

        // The rail's selected pill is 56dp wide around a 24dp icon: 20dp left of the middle is pill, clear of the icon.
        val home = rule.onNodeWithText("홈").fetchSemanticsNode().boundsInRoot
        val x = (home.center.x - 20 * dp).toInt()
        val pillTop = (home.top.toInt() until home.bottom.toInt()).first { pixels[x, it] != page }
        val pill = pixels[x, (pillTop + 8 * dp).toInt()]
        assertTrue("the rail's pill $pill is not the page $page", pill != page)

        val chosen = px("chosen")
        val other = px("other")
        val fill = pixels[(chosen.right - 16 * dp).toInt(), chosen.center.y.toInt()]
        assertEquals("the chosen row is filled with the color of the rail's pill", pill, fill)
        assertEquals("a row that is not chosen has no fill", page, pixels[(other.right - 16 * dp).toInt(), other.center.y.toInt()])

        // Not by color alone: the same words are drawn heavier. Count what is not background in the middle band of each row.
        fun ink(row: androidx.compose.ui.geometry.Rect, paper: androidx.compose.ui.graphics.Color): Int {
            var count = 0
            for (py in (row.top + row.height / 4).toInt() until (row.bottom - row.height / 4).toInt()) {
                for (qx in (row.left + 4 * dp).toInt() until (row.right - 4 * dp).toInt()) if (pixels[qx, py] != paper) count++
            }
            return count
        }
        val heavy = ink(chosen, fill)
        val light = ink(other, page)
        assertTrue("the unchosen label is drawn: $light pixels", light > 0)
        assertTrue("the chosen label is heavier: $heavy pixels of ink against $light", heavy > light * 1.05f)
        assertNear("being chosen does not change the row's height", height("other"), height("chosen"))
    }

    @Test
    fun aListItemsLabelStandsOnTheGutterLine() {
        pane {
            DdsPaneItem("매출 현황", selected = true, onClick = {})
            DdsPaneItem("미수금", selected = false, onClick = {})
        }
        val line = bounds(DdsTestTags.ListPane).left + DdsScreen.gutterWide.dp
        assertNear("the chosen row's label starts on the pane's gutter line", line, label("매출 현황").left)
        assertNear("another row's label starts on the same line", line, label("미수금").left)
    }

    @Test
    fun aListShownAsAScreenOnAPhoneStandsOnThePhonesGutter() {
        pane(size = phone) { DdsPaneItem("매출 현황", selected = true, onClick = {}) }
        assertNear("the label starts on the phone's gutter", bounds("screen-body").left + DdsScreen.gutter.dp, label("매출 현황").left)
    }

    @Test
    fun aListItemIsAControlTallAndTallerInLargeTextMode() {
        var large by mutableStateOf(false)
        pane(largeText = { large }) { DdsPaneItem("매출 현황", selected = false, onClick = {}, modifier = Modifier.testTag("row")) }
        assertNear("a row's height", DdsControl.md.dp, height("row"))
        large = true
        rule.waitForIdle()
        assertNear("a row's height in large text mode", DdsTouch.large.dp, height("row"))
    }

    @Test
    fun aLongListLabelWrapsAtALargeFontInsteadOfBeingCut() {
        val long = "거래처별 매출과 미수금 현황 보고서"
        pane(scale = 2f) {
            DdsPaneItem("미수금", selected = false, onClick = {}, modifier = Modifier.testTag("short"))
            DdsPaneItem(long, selected = false, onClick = {}, modifier = Modifier.testTag("long"))
            DdsPaneItem("$long 둘", selected = true, onClick = {}, modifier = Modifier.testTag("long-chosen"))
        }
        val oneLine = label("미수금").let { it.bottom - it.top }
        assertTrue("the font is twice its size: a line is $oneLine", oneLine > 40.dp)
        val words = label(long)
        assertTrue("the long label takes more lines than one ($oneLine): ${words.bottom - words.top}", words.bottom - words.top > oneLine * 1.5f)
        val pane = bounds(DdsTestTags.ListPane)
        for (tag in listOf("long", "long-chosen")) {
            val row = bounds(tag)
            val text = label(if (tag == "long") long else "$long 둘")
            assertTrue("the label $text is inside its row $row", text.top >= row.top && text.bottom <= row.bottom && text.left >= row.left && text.right <= row.right)
            assertTrue("the row $row is inside the pane $pane", row.left >= pane.left && row.right <= pane.right)
        }
        assertTrue("the row grew with its label", height("long") > height("short"))
    }

    @Test
    fun theListScrollsWhenItsRowsDoNotFit() {
        pane { repeat(30) { DdsPaneItem("항목 ${it + 1}", selected = it == 0, onClick = {}) } }
        rule.onNodeWithText("항목 30").performScrollTo().assertIsDisplayed()
    }

    // ---- a whole sample app, walked with the check apps use ----

    /** The screens of the sample app, and what kind each one is. */
    private enum class Stop(val kind: DdsScreenKind, val title: String) {
        Home(DdsScreenKind.TopLevel, "홈"),
        Customers(DdsScreenKind.TopLevel, "거래처"),
        Order(DdsScreenKind.Inner, "주문 상세"),

        /** The sales area's list as a screen of its own: what a window too narrow to pin it shows. */
        SalesList(DdsScreenKind.Inner, "매출"),
        Sales(DdsScreenKind.Listed, "매출 현황"),
        Receivables(DdsScreenKind.Listed, "미수금"),
        Scanner(DdsScreenKind.WholeWindow, "스캔"),
        Gate(DdsScreenKind.WholeWindow, "시작"),
    }

    private val salesArea = setOf(Stop.SalesList, Stop.Sales, Stop.Receivables)

    /** A product's page: warm paper instead of the system's white, written the way an app writes it in code. */
    private val paper = Color(red = 0.98f, green = 0.96f, blue = 0.91f)

    /** That product's brand: the default brand on its own page. Every contrast pair still passes, so it declares no exception. */
    private val paperBrand = DdsBrand(light = DdsBrand.Default.light.copy(bgDefault = paper), dark = DdsBrand.Default.dark)

    @Composable
    private fun SalesRows(stop: Stop, go: (Stop) -> Unit) {
        DdsPaneList {
            DdsPaneItem(Stop.Sales.title, selected = stop == Stop.Sales, onClick = { go(Stop.Sales) })
            DdsPaneItem(Stop.Receivables.title, selected = stop == Stop.Receivables, onClick = { go(Stop.Receivables) })
        }
    }

    /**
     * A small app built the way the guide says: two tabs, a screen opened from one, an area with a list
     * (pinned beside its screens on a wide window, a screen of its own otherwise), a screen that takes the
     * whole window, and a gate with one thing to do.
     */
    @Composable
    private fun SampleApp(stop: Stop, move: DdsMove, go: (Stop) -> Unit) {
        DdsAppFrame(
            navItems = items(Stop.Home.title, Stop.Customers.title),
            selectedIndex = if (stop == Stop.Customers) 1 else 0,
            onSelect = { go(if (it == 1) Stop.Customers else Stop.Home) },
            modifier = Modifier.testTag("frame"),
            navigation = stop != Stop.Scanner && stop != Stop.Gate,
            list = if (stop in salesArea) ({
                DdsScaffold(topBar = { DdsTopBar(Stop.SalesList.title) }) { padding ->
                    Box(Modifier.padding(padding)) { SalesRows(stop, go) }
                }
            }) else null,
        ) {
            DdsScreenHost(stop, move) { shown ->
                when (shown) {
                    Stop.Home, Stop.Customers -> DdsScaffold(
                        topBar = { DdsTopBar(shown.title, Modifier.testTag("bar"), leading = { Box(Modifier.size(DdsIcon.md.dp)) }) },
                        bottomTabs = true,
                    ) { padding -> Box(Modifier.fillMaxSize().padding(padding).testTag("page")) { DdsBodyColumn { Text("${shown.title} 본문") } } }

                    // A screen that lays its own body out: the list fills the body column.
                    Stop.SalesList -> DdsScaffold(topBar = { DdsTopBar(shown.title, onBack = { go(Stop.Home) }) }) { padding ->
                        Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.TopCenter) {
                            Box(Modifier.ddsBody().fillMaxWidth()) { SalesRows(stop, go) }
                        }
                    }

                    Stop.Gate -> DdsCenteredColumn {
                        DdsCenteredTitle("정산을\n시작합니다", description = "거래처와 주문을 한곳에서 봅니다")
                    }

                    else -> DdsScaffold(
                        topBar = {
                            // Beside its pinned list a screen of the area has nowhere to go back to.
                            val back: (() -> Unit)? = if (shown.kind == DdsScreenKind.Listed && ddsFrame().listPinned) null else ({ go(Stop.Home) })
                            DdsTopBar(shown.title, Modifier.testTag("bar"), onBack = back) { DdsIconButton(DdsIcons.Search, "검색", {}) }
                        },
                    ) { padding -> Box(Modifier.fillMaxSize().padding(padding).testTag("page")) { DdsBodyColumn { Text("${shown.title} 본문") } } }
                }
            }
        }
    }

    @Test
    fun everyScreenOfTheSampleAppKeepsTheFrame() {
        var size by mutableStateOf(phone)
        var stop by mutableStateOf(Stop.Home)
        var move by mutableStateOf(DdsMove.None)
        var brand by mutableStateOf(DdsBrand.Default)
        rule.setContent {
            DeviceConfigurationOverride(DeviceConfigurationOverride.ForcedSize(size)) {
                DdsTheme(darkTheme = false, brand = brand) { SampleApp(stop, move) { stop = it } }
            }
        }
        val check = DdsFrameCheck(rule)
        fun open(next: Stop) {
            move = when {
                next.kind == DdsScreenKind.TopLevel && stop.kind == DdsScreenKind.TopLevel -> DdsMove.Tab
                next.kind == DdsScreenKind.TopLevel -> DdsMove.Pop
                else -> DdsMove.Push
            }
            stop = next
            rule.waitForIdle()
        }
        val medium = DpSize(704.dp, 933.dp)
        for (window in listOf(phone, medium, wide)) {
            size = window
            rule.waitForIdle()
            for (next in Stop.entries) {
                // On a wide window the list is pinned beside its screens; it is never a screen of its own there.
                if (next == Stop.SalesList && window == wide) continue
                open(next)
                check.look("${next.name} at ${window.width.value.toInt()}dp", next.kind)
            }
            open(Stop.Home)
        }
        assertEquals("every screen at every width was looked at", 3 * Stop.entries.size - 1, check.readings.size)

        // The same app under a product's own page color: the lines are the same, and the frame shows the page.
        brand = paperBrand
        fun pixel(pixels: androidx.compose.ui.graphics.PixelMap, x: Float, y: Float) = pixels[x.toInt(), y.toInt()].toArgb()
        val paperInk = paper.toArgb() // what a screen holds of it: eight bits a channel
        fun px(tag: String) = rule.onNodeWithTag(tag, useUnmergedTree = true).fetchSemanticsNode().boundsInRoot
        open(Stop.Sales) // still on the wide window: the rail, the pinned list and two top bars
        check.look("Sales on a product's page", Stop.Sales.kind)
        val dp = px(DdsTestTags.Rail).width / DdsBar.rail // pixels to a dp in this forced window
        var pixels = rule.onRoot().captureToImage().toPixelMap()
        val rail = px(DdsTestTags.Rail)
        val list = px(DdsTestTags.ListPane)
        val bar = px("bar")
        val page = px("page")
        assertEquals("the rail's background, under its items", paperInk, pixel(pixels, rail.center.x, rail.bottom - 24 * dp))
        assertEquals("the pinned list's background, under its rows", paperInk, pixel(pixels, list.center.x, list.bottom - 24 * dp))
        assertEquals("the pinned list's own top bar, at its end", paperInk, pixel(pixels, list.right - 4 * dp, bar.center.y))
        assertEquals("the screen's top bar, at its start", paperInk, pixel(pixels, bar.left + 4 * dp, bar.center.y))
        assertEquals("the screen under its body", paperInk, pixel(pixels, page.right - 8 * dp, page.bottom - 24 * dp))

        size = phone
        open(Stop.Home)
        check.look("Home on a product's page", Stop.Home.kind)
        pixels = rule.onRoot().captureToImage().toPixelMap()
        val tabs = px(DdsTestTags.BottomTabs)
        assertEquals("the bottom tabs' background, at their start", paperInk, pixel(pixels, tabs.left + 2 * dp, tabs.center.y))
        assertEquals("the top bar on a phone, at its end", paperInk, pixel(pixels, px("bar").right - 4 * dp, px("bar").center.y))

        // Two screens of a kind, at one window width, start on the same line and are the same width.
        check.assertSameLines()
    }

    // ---- twice the font ----

    private fun assertNoTextInTheFrameIsCut(size: DpSize) {
        val title = "거래처별 매출과 미수금 관리 현황"
        rule.setContent {
            // The font scale goes outside: its override puts the device's density back, the forced size keeps the scale.
            DeviceConfigurationOverride(DeviceConfigurationOverride.FontScale(2f)) {
                DeviceConfigurationOverride(DeviceConfigurationOverride.ForcedSize(size)) {
                    DdsTheme {
                        DdsAppFrame(
                            navItems = items("홈", short),
                            selectedIndex = 0,
                            onSelect = {},
                            barTitles = listOf(title, "목록"),
                            list = { DdsScaffold(topBar = { DdsTopBar("목록") }) { padding -> Text("목록의 줄", Modifier.padding(padding)) } },
                        ) {
                            DdsScaffold(
                                topBar = { DdsTopBar(title, onBack = {}) { DdsIconButton(DdsIcons.Search, "검색", {}) } },
                                bottomTabs = true,
                            ) { padding ->
                                Box(Modifier.fillMaxSize().padding(padding)) {
                                    DdsBodyColumn {
                                        Text("한 줄", Modifier.testTag("one-line"))
                                        Text("거래처별 매출과 미수금 현황을 한눈에 보는 월간 종합 보고서입니다. 줄이 넘어가면 다음 줄로 이어집니다.")
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        val line = bounds("one-line").let { it.bottom - it.top }
        assertTrue("the font is twice its size at $size: a line of body text is $line", line > 36.dp)
        val texts = rule.onAllNodes(SemanticsMatcher.keyIsDefined(SemanticsActions.GetTextLayoutResult), useUnmergedTree = true)
        val nodes = texts.fetchSemanticsNodes()
        val words = nodes.map { node -> node.config.getOrNull(SemanticsProperties.Text)?.joinToString { it.text }.orEmpty() }
        // The tabs' or the rail's two labels, the screen's title, the two lines of the body (and on a wide window the list's two).
        assertTrue("the frame's texts were found at $size: $words", words.containsAll(listOf("홈", short, title, "한 줄")))
        for (index in nodes.indices) {
            val layout = layoutOf(texts[index])
            // Cut is a line ending in an ellipsis, lines left out, or lines taller than the room they were given.
            // (hasVisualOverflow is no use here: in a forced window it is true by a fraction of a pixel for text that is whole.)
            val ellipsis = (0 until layout.lineCount).any { layout.isLineEllipsized(it) }
            val short = layout.multiParagraph.height > layout.size.height + 1f
            assertFalse(
                "\"${words[index]}\" is cut at $size: ${layout.lineCount} line(s), ellipsis=$ellipsis, lines left out=${layout.multiParagraph.didExceedMaxLines}, " +
                    "text ${layout.multiParagraph.height}px tall in ${layout.size.height}px",
                ellipsis || layout.multiParagraph.didExceedMaxLines || short,
            )
        }
        // On a phone the title does not fit one line at this size: it is whole because the bar gave it a second one.
        if (size == phone) assertEquals("the title's lines on a phone", 2, layoutOf(rule.onNodeWithText(title, useUnmergedTree = true)).lineCount)
    }

    @Test
    fun atTwiceTheFontNothingInTheFrameIsCut() = assertNoTextInTheFrameIsCut(phone)

    @Test
    fun atTwiceTheFontNothingInTheFrameIsCutOnAWideWindow() = assertNoTextInTheFrameIsCut(wide)
}
