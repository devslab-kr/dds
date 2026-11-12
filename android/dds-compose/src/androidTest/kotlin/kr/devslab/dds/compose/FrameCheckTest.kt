package kr.devslab.dds.compose

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.DeviceConfigurationOverride
import androidx.compose.ui.test.ForcedSize
import androidx.compose.ui.test.LayoutDirection
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import kr.devslab.dds.compose.component.DdsNavItem
import kr.devslab.dds.compose.component.DdsPaneItem
import kr.devslab.dds.compose.component.DdsPaneList
import kr.devslab.dds.compose.component.DdsScaffold
import kr.devslab.dds.compose.component.DdsTopBar
import kr.devslab.dds.compose.icons.DdsIcons
import kr.devslab.dds.compose.layout.DdsAppFrame
import kr.devslab.dds.compose.layout.DdsBodyColumn
import kr.devslab.dds.compose.layout.DdsCenteredColumn
import kr.devslab.dds.compose.layout.DdsTestTags
import kr.devslab.dds.compose.layout.DdsWindowWidth
import kr.devslab.dds.compose.layout.ddsBody
import kr.devslab.dds.compose.testing.DdsFrameCheck
import kr.devslab.dds.compose.testing.DdsScreenKind
import kr.devslab.dds.compose.theme.DdsTheme
import kr.devslab.dds.tokens.DdsBar
import kr.devslab.dds.tokens.DdsBorder
import kr.devslab.dds.tokens.DdsScreen
import kr.devslab.dds.tokens.DdsSpace
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * The check an app runs on its own screens (`dds-compose-testing`): a frame that keeps the rules
 * passes, and each rule on its own stops a screen that breaks it, naming the screen.
 */
class FrameCheckTest {
    @get:Rule
    val rule = createComposeRule()

    private val four = listOf("홈", "거래처", "주문", "설정").map { DdsNavItem(it, DdsIcons.Doc) }

    private val phone = DpSize(475.dp, 751.dp)
    private val medium = DpSize(704.dp, 933.dp)
    private val wide = DpSize(933.dp, 704.dp)

    private val check by lazy { DdsFrameCheck(rule) }

    /** [content] under the theme in a window forced to [size]; [rtl] lays it out right to left. */
    private fun shown(size: () -> DpSize, rtl: Boolean = false, content: @Composable () -> Unit) {
        rule.setContent {
            DeviceConfigurationOverride(DeviceConfigurationOverride.ForcedSize(size())) {
                DeviceConfigurationOverride(
                    DeviceConfigurationOverride.LayoutDirection(if (rtl) LayoutDirection.Rtl else LayoutDirection.Ltr),
                ) {
                    DdsTheme { content() }
                }
            }
        }
    }

    /** What a pinned list holds in an app: its own top bar over its rows. */
    @Composable
    private fun PinnedList() {
        DdsScaffold(topBar = { DdsTopBar("목록 제목") }) { padding ->
            DdsPaneList(Modifier.padding(padding)) {
                DdsPaneItem("매출 현황", selected = true, onClick = {})
                DdsPaneItem("미수금", selected = false, onClick = {})
            }
        }
    }

    /** A screen of [kind] built the way the guide says: the frame, the scaffold, the top bar, the body column. */
    @Composable
    private fun GoodScreen(kind: DdsScreenKind, title: String = "화면 제목") {
        DdsAppFrame(
            navItems = four,
            selectedIndex = 0,
            onSelect = {},
            navigation = kind != DdsScreenKind.WholeWindow,
            list = if (kind == DdsScreenKind.Listed) ({ PinnedList() }) else null,
        ) {
            DdsScaffold(
                topBar = { DdsTopBar(title, onBack = if (kind == DdsScreenKind.TopLevel) null else ({})) },
                bottomTabs = kind == DdsScreenKind.TopLevel,
            ) { padding ->
                Box(Modifier.fillMaxSize().padding(padding)) { DdsBodyColumn { Text("본문") } }
            }
        }
    }

    private fun bounds(tag: String) = rule.onNodeWithTag(tag, useUnmergedTree = true).getUnclippedBoundsInRoot()

    private fun assertNear(message: String, expected: Dp, actual: Float) = assertEquals(message, expected.value, actual, 1f)

    /** The message of the failure [look] ends in; fails when the check lets the screen through. */
    private fun refusal(look: () -> Unit): String = assertThrows(AssertionError::class.java) { look() }.message.orEmpty()

    // ---- a frame that keeps the rules ----

    @Test
    fun aFrameThatKeepsTheRulesPasses() {
        var size by mutableStateOf(phone)
        var kind by mutableStateOf(DdsScreenKind.TopLevel)
        shown({ size }) { GoodScreen(kind) }
        for (window in listOf(phone, medium, wide)) {
            for (screen in DdsScreenKind.entries) {
                size = window
                kind = screen
                rule.waitForIdle()
                val name = "$screen at ${window.width}"
                val reading = check.look(name, screen)

                val width = when (window) {
                    phone -> DdsWindowWidth.Compact
                    medium -> DdsWindowWidth.Medium
                    else -> DdsWindowWidth.Expanded
                }
                assertEquals(name, name, reading.name)
                assertEquals(name, screen, reading.kind)
                assertEquals("$name: the window's width class", width, reading.window)
                assertNear("$name: the window's width", window.width, reading.windowWidthDp)
                val menus = screen != DdsScreenKind.WholeWindow
                assertEquals("$name: rail", menus && width != DdsWindowWidth.Compact, reading.rail)
                assertEquals("$name: list", screen == DdsScreenKind.Listed && width == DdsWindowWidth.Expanded, reading.listPane)
                assertEquals("$name: bottom tabs", screen == DdsScreenKind.TopLevel && width == DdsWindowWidth.Compact, reading.bottomTabs)
                assertFalse("$name: a body column, not a centered block", reading.centered)

                // What the reading says is what the body measures on screen.
                val body = bounds(DdsTestTags.Body)
                assertNear("$name: the body's left", body.left, reading.bodyLeftDp)
                assertNear("$name: the body's width", body.right - body.left, reading.bodyWidthDp)
                val areaLeft = when {
                    reading.listPane -> (DdsBar.rail + DdsBorder.hairline + DdsScreen.listPane + DdsBorder.hairline).dp
                    reading.rail -> (DdsBar.rail + DdsBorder.hairline).dp
                    else -> 0.dp
                }
                val area = window.width - areaLeft
                val expected = minOf(DdsScreen.bodyMax.dp, area)
                assertNear("$name: the body is as wide as the area allows, up to its limit", expected, reading.bodyWidthDp)
                assertNear("$name: the body is in the middle of the area", areaLeft + (area - expected) / 2, reading.bodyLeftDp)

                // The title starts on the body's text line, or 40dp after it behind a back arrow.
                val gutter = if (width == DdsWindowWidth.Compact) DdsScreen.gutter.dp else DdsScreen.gutterWide.dp
                val afterArrow = if (screen == DdsScreenKind.TopLevel) 0.dp else DdsSpace.s40.dp
                assertNotNull("$name: the title was read", reading.titleLeftDp)
                assertNear("$name: where the title starts", body.left + gutter + afterArrow, reading.titleLeftDp!!)
            }
        }
        assertEquals("every look is kept", 12, check.readings.size)
        // Screens of different kinds, and the same kind in windows of different widths, are on different lines by design.
        check.assertSameLines()
    }

    @Test
    fun inRightToLeftAFrameThatKeepsTheRulesPasses() {
        var kind by mutableStateOf(DdsScreenKind.TopLevel)
        shown({ wide }, rtl = true) { GoodScreen(kind) }
        for (screen in DdsScreenKind.entries) {
            kind = screen
            rule.waitForIdle()
            val reading = check.look("$screen right to left", screen)
            val body = bounds(DdsTestTags.Body)
            assertNear("$screen: the body's left", body.left, reading.bodyLeftDp)
            assertEquals("$screen: list", screen == DdsScreenKind.Listed, reading.listPane)
        }
        // The rail is on the right, so a screen beside it starts at the window's left edge and stops short of the rail.
        val inner = check.readings.single { it.kind == DdsScreenKind.Inner }
        assertTrue("the body ends before the rail on the right: $inner", inner.bodyLeftDp + inner.bodyWidthDp < wide.width.value - DdsBar.rail)
    }

    @Test
    fun aScreenWhoseOneBlockIsCenteredPasses() {
        var size by mutableStateOf(wide)
        shown({ size }) {
            DdsAppFrame(four, 0, {}, navigation = false) {
                DdsCenteredColumn { Text("한 가지 일", Modifier.fillMaxWidth()) }
            }
        }
        val gate = check.look("gate", DdsScreenKind.WholeWindow)
        assertTrue("the gate is read as a centered block", gate.centered)
        assertNear("the block's width", DdsScreen.centeredMax.dp, gate.bodyWidthDp)
        assertNear("the block is in the middle of the window", (wide.width - DdsScreen.centeredMax.dp) / 2, gate.bodyLeftDp)
        assertNull("a gate has no top bar", gate.titleLeftDp)
        size = phone
        rule.waitForIdle()
        check.look("gate on a phone", DdsScreenKind.WholeWindow)
        check.assertSameLines()
    }

    // ---- one screen per rule that breaks it ----

    @Test
    fun twoBodiesOnOneScreenFail() {
        shown({ wide }) {
            DdsAppFrame(four, 0, {}) {
                DdsScaffold(topBar = {}) { padding ->
                    Row(Modifier.fillMaxSize().padding(padding)) {
                        Box(Modifier.weight(1f)) { DdsBodyColumn { Text("왼쪽") } }
                        Box(Modifier.weight(1f)) { DdsBodyColumn { Text("오른쪽") } }
                    }
                }
            }
        }
        val message = refusal { check.look("split screen", DdsScreenKind.Inner) }
        assertTrue(message, "split screen" in message)
        assertTrue(message, "exactly one body" in message && "found 2" in message)
        assertTrue("a refused screen leaves no reading", check.readings.isEmpty())
    }

    @Test
    fun aScreenWithNoBodyFails() {
        shown({ wide }) {
            DdsAppFrame(four, 0, {}) {
                DdsScaffold(topBar = { DdsTopBar("본문 없음") }) { padding -> Text("그냥 글자", Modifier.padding(padding)) }
            }
        }
        val message = refusal { check.look("bare screen", DdsScreenKind.Inner) }
        assertTrue(message, "bare screen" in message)
        assertTrue(message, "exactly one body" in message && "found 0" in message)
    }

    @Test
    fun aBodyAndACenteredBlockTogetherFail() {
        shown({ wide }) {
            DdsAppFrame(four, 0, {}, navigation = false) {
                Row(Modifier.fillMaxSize()) {
                    Box(Modifier.weight(1f)) { DdsBodyColumn { Text("본문") } }
                    Box(Modifier.weight(1f)) { DdsCenteredColumn { Text("한 가지 일") } }
                }
            }
        }
        val message = refusal { check.look("two things", DdsScreenKind.WholeWindow) }
        assertTrue(message, "two things" in message)
        assertTrue(message, "exactly one body" in message)
    }

    /** A top bar narrower than the body stays inside it; one not kept to the body's width does not. */
    @Test
    fun aNarrowerBarIsAllowedButATitleOutsideTheBodyIsNot() {
        var barMax by mutableStateOf(400.dp)
        shown({ wide }) {
            DdsAppFrame(four, 0, {}) {
                DdsScaffold(topBar = { DdsTopBar("화면 제목", columnMax = barMax) }) { padding ->
                    Box(Modifier.fillMaxSize().padding(padding)) { DdsBodyColumn { Text("본문") } }
                }
            }
        }
        val narrow = check.look("narrow bar", DdsScreenKind.Inner)
        val body = bounds(DdsTestTags.Body)
        assertNear("a 400dp bar over a 680dp body starts 140dp further in", body.left + 140.dp + DdsScreen.gutterWide.dp, narrow.titleLeftDp!!)

        barMax = 2000.dp // not kept to the body: the title starts at the area's edge
        rule.waitForIdle()
        val message = refusal { check.look("full-width bar", DdsScreenKind.Inner) }
        assertTrue(message, "full-width bar" in message)
        assertTrue(message, "title" in message && "outside the body" in message)
    }

    @Test
    fun aBodyAtTheStartInsteadOfTheMiddleFails() {
        shown({ wide }) {
            DdsAppFrame(four, 0, {}) {
                DdsScaffold(topBar = {}) { padding ->
                    Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.TopStart) {
                        Column(Modifier.ddsBody().fillMaxWidth().fillMaxHeight()) { Text("본문") }
                    }
                }
            }
        }
        val message = refusal { check.look("start-aligned", DdsScreenKind.Inner) }
        assertTrue(message, "start-aligned" in message)
        assertTrue(message, "not in the middle" in message)
    }

    @Test
    fun aRailOnAWholeWindowScreenFails() {
        shown({ wide }) { GoodScreen(DdsScreenKind.Inner) }
        val message = refusal { check.look("scanner", DdsScreenKind.WholeWindow) }
        assertTrue(message, "scanner" in message)
        assertTrue(message, "the rail is on screen" in message)
    }

    @Test
    fun bottomTabsOnAnInnerScreenFail() {
        shown({ phone }) { GoodScreen(DdsScreenKind.TopLevel) }
        val message = refusal { check.look("detail", DdsScreenKind.Inner) }
        assertTrue(message, "detail" in message)
        assertTrue(message, "the bottom tabs are on screen" in message)
    }

    @Test
    fun aTopLevelScreenWithoutBottomTabsOnAPhoneFails() {
        shown({ phone }) { GoodScreen(DdsScreenKind.Inner) }
        val message = refusal { check.look("home", DdsScreenKind.TopLevel) }
        assertTrue(message, "home" in message)
        assertTrue(message, "the bottom tabs are missing" in message)
    }

    @Test
    fun aScreenWithoutTheRailOnAMediumWindowFails() {
        shown({ medium }) { GoodScreen(DdsScreenKind.WholeWindow) }
        val message = refusal { check.look("detail", DdsScreenKind.Inner) }
        assertTrue(message, "detail" in message)
        assertTrue(message, "the rail is missing" in message)
    }

    @Test
    fun aListedScreenWithoutItsListOnAWideWindowFails() {
        shown({ wide }) { GoodScreen(DdsScreenKind.Inner) }
        val message = refusal { check.look("sales", DdsScreenKind.Listed) }
        assertTrue(message, "sales" in message)
        assertTrue(message, "the fixed list is missing" in message)
    }

    @Test
    fun aFixedListBesideAnInnerScreenFails() {
        shown({ wide }) { GoodScreen(DdsScreenKind.Listed) }
        val message = refusal { check.look("detail", DdsScreenKind.Inner) }
        assertTrue(message, "detail" in message)
        assertTrue(message, "the fixed list is on screen" in message)
    }

    /** A frame put together by hand, so the list can be put where the real frame never puts it. */
    @Composable
    private fun HandMadeFrame(gapAfterRail: Dp, bodyOverTheList: Boolean) {
        Row(Modifier.fillMaxSize()) {
            Box(Modifier.width(DdsBar.rail.dp).fillMaxHeight().testTag(DdsTestTags.Rail)) { Text("레일") }
            Spacer(Modifier.width(gapAfterRail))
            if (bodyOverTheList) {
                Box(Modifier.weight(1f).fillMaxHeight()) {
                    DdsBodyColumn { Text("본문") }
                    Box(Modifier.width(DdsScreen.listPane.dp).fillMaxHeight().testTag(DdsTestTags.ListPane)) { Text("목록") }
                }
            } else {
                Box(Modifier.width(DdsScreen.listPane.dp).fillMaxHeight().testTag(DdsTestTags.ListPane)) { Text("목록") }
                Box(Modifier.weight(1f).fillMaxHeight()) { DdsBodyColumn { Text("본문") } }
            }
        }
    }

    @Test
    fun aFixedListThatDoesNotStartAtTheRailFails() {
        shown({ wide }) { HandMadeFrame(gapAfterRail = 40.dp, bodyOverTheList = false) }
        val message = refusal { check.look("gap", DdsScreenKind.Listed) }
        assertTrue(message, "gap" in message)
        assertTrue(message, "does not start where the rail ends" in message)
    }

    @Test
    fun aBodyThatStartsUnderTheFixedListFails() {
        shown({ wide }) { HandMadeFrame(gapAfterRail = DdsBorder.hairline.dp, bodyOverTheList = true) }
        val message = refusal { check.look("under the list", DdsScreenKind.Listed) }
        assertTrue(message, "under the list" in message)
        assertTrue(message, "starts before the fixed list ends" in message)
    }

    // ---- several screens: the same lines ----

    @Test
    fun twoScreensOfAKindOnDifferentLinesFail() {
        var bodyMax by mutableStateOf(DdsScreen.bodyMax.dp)
        shown({ wide }) {
            DdsAppFrame(four, 0, {}) {
                DdsScaffold(topBar = { DdsTopBar("화면 제목", onBack = {}, columnMax = bodyMax) }) { padding ->
                    Box(Modifier.fillMaxSize().padding(padding)) { DdsBodyColumn(max = bodyMax) { Text("본문") } }
                }
            }
        }
        check.look("orders", DdsScreenKind.Inner)
        check.assertSameLines() // one screen is on its own lines
        bodyMax = 600.dp // centered and under its bar, so the screen passes alone
        rule.waitForIdle()
        check.look("order detail", DdsScreenKind.Inner)
        val message = refusal { check.assertSameLines() }
        assertTrue(message, "orders" in message && "order detail" in message)
        assertTrue(message, "not on the same lines" in message)
        // The measured numbers are in the message: the two widths, each within a pixel of what was asked for.
        val widths = Regex("is (\\d+\\.\\d)dp wide").findAll(message).map { it.groupValues[1].toFloat() }.toList()
        assertEquals(message, 2, widths.size)
        assertEquals(message, DdsScreen.bodyMax.toFloat(), widths[0], 1f)
        assertEquals(message, 600f, widths[1], 1f)
    }

    // ---- the fixed list has a top bar of its own ----

    @Test
    fun withAFixedListTheScreensTitleIsRead() {
        shown({ wide }) { GoodScreen(DdsScreenKind.Listed, title = "매출 현황 화면") }
        val reading = check.look("sales", DdsScreenKind.Listed)
        val listTitle = rule.onNodeWithText("목록 제목", useUnmergedTree = true).getUnclippedBoundsInRoot()
        val screenTitle = rule.onNodeWithText("매출 현황 화면", useUnmergedTree = true).getUnclippedBoundsInRoot()
        assertTrue("two top bars are on screen, the list's first: $listTitle, $screenTitle", listTitle.left < screenTitle.left)
        assertNear("the title read is the screen's", screenTitle.left, reading.titleLeftDp!!)
        assertTrue("and not the list's", reading.titleLeftDp!! > listTitle.right.value)
    }
}
