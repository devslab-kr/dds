package kr.devslab.dds.compose

import org.junit.Before
import org.junit.Assume.assumeFalse
import kr.devslab.dds.compose.motion.isReducedMotion
import androidx.test.platform.app.InstrumentationRegistry
import androidx.compose.foundation.layout.Row
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.click
import androidx.compose.foundation.clickable
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.unit.dp
import kr.devslab.dds.compose.component.DdsChip
import kr.devslab.dds.compose.motion.DdsMove
import kr.devslab.dds.compose.motion.DdsScreenHost
import kr.devslab.dds.compose.motion.LocalDdsScreenActive
import kr.devslab.dds.compose.motion.ddsScreenContent
import kr.devslab.dds.compose.theme.DdsTheme
import androidx.compose.ui.test.DeviceConfigurationOverride
import androidx.compose.ui.test.ForcedSize
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.unit.DpSize
import kotlin.math.abs
import kr.devslab.dds.compose.component.DdsNavItem
import kr.devslab.dds.compose.component.DdsScaffold
import kr.devslab.dds.compose.component.DdsTopBar
import kr.devslab.dds.compose.icons.DdsIcons
import kr.devslab.dds.compose.layout.DdsAppFrame
import kr.devslab.dds.compose.layout.DdsBodyColumn
import kr.devslab.dds.compose.layout.DdsTestTags
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * What moves, measured on a device with the clock held: where a thing is part-way
 * through, not only where it ends.
 */
class MotionOnDeviceTest {
    @get:Rule
    val rule = createComposeRule()

    // Two colors no screen has, with no green in either: any green seen is the background showing.
    @Before
    fun animationsAreOn() {
        assumeFalse("animations are turned off on this device", isReducedMotion(InstrumentationRegistry.getInstrumentation().targetContext))
    }

    private val red = Color.Red
    private val blue = Color.Blue

    /** A host 100dp square whose screens are a plain color each, with a body that slides and a word. */
    private fun host(screen: () -> String, move: () -> DdsMove, seen: (String, Boolean) -> Unit = { _, _ -> }, left: (String) -> Unit = {}) {
        rule.setContent {
            DdsTheme {
                DdsScreenHost(screen(), move(), Modifier.size(100.dp).testTag("host")) { shown ->
                    val current = LocalDdsScreenActive.current
                    SideEffect { seen(shown, current) }
                    DisposableEffect(Unit) { onDispose { left(shown) } }
                    Box(Modifier.fillMaxSize().background(if (shown == "a") red else blue)) {
                        Box(Modifier.fillMaxSize().ddsScreenContent().testTag("body $shown")) { Text("word $shown") }
                    }
                }
            }
        }
    }

    /** A point of the host clear of the word in its corner. */
    private fun hostColor(): Color {
        val pixels = rule.onNodeWithTag("host").captureToImage().toPixelMap()
        return pixels[pixels.width * 3 / 4, pixels.height * 3 / 4]
    }

    /** Steps through a change frame by frame; every frame must be the two screens only. Returns how many were a mix. */
    private fun mixedFramesWithNoneEmpty(frames: Int): Int {
        var mixed = 0
        repeat(frames) {
            rule.mainClock.advanceTimeByFrame()
            val now = hostColor()
            // Red and blue only: the background (which has green in it) never shows through.
            assertEquals("frame $it shows something that is neither screen", 0f, now.green, 0.02f)
            assertEquals("frame $it is not fully covered", 1f, now.red + now.blue, 0.06f)
            if (now.red > 0.1f && now.blue > 0.1f) mixed++
        }
        return mixed
    }

    private fun bodyLeft(screen: String): Float = rule.onNodeWithTag("body $screen", useUnmergedTree = true).fetchSemanticsNode().boundsInRoot.left

    @Test
    fun aTabAppearsOverTheOneBeforeAndNoFrameIsEmpty() {
        var screen by mutableStateOf("a")
        var move by mutableStateOf(DdsMove.None)
        host({ screen }, { move })
        assertEquals(red, hostColor())

        rule.mainClock.autoAdvance = false
        move = DdsMove.Tab
        screen = "b"
        val mixed = mixedFramesWithNoneEmpty(14) // 14 frames is longer than the 150ms it takes
        assertTrue("the new tab should be part-way there for several frames, was for $mixed", mixed >= 3)
        assertEquals(blue, hostColor())
    }

    @Test
    fun goingForwardAndBackNoFrameIsEmpty() {
        var screen by mutableStateOf("a")
        var move by mutableStateOf(DdsMove.None)
        host({ screen }, { move })

        rule.mainClock.autoAdvance = false
        move = DdsMove.Push
        screen = "b"
        val forward = mixedFramesWithNoneEmpty(12)
        assertTrue("forward: part-way for several frames, was for $forward", forward >= 2)
        rule.mainClock.autoAdvance = true
        rule.waitForIdle()
        assertEquals(blue, hostColor())

        rule.mainClock.autoAdvance = false
        move = DdsMove.Pop
        screen = "a"
        val back = mixedFramesWithNoneEmpty(12)
        assertTrue("back: part-way for several frames, was for $back", back >= 2)
        rule.mainClock.autoAdvance = true
        rule.waitForIdle()
        assertEquals(red, hostColor())
    }

    @Test
    fun aScreenThatIsLeavingCannotBeTouchedEvenWhileItIsStillOnTop() {
        var screen by mutableStateOf("a")
        var move by mutableStateOf(DdsMove.None)
        val taps = mutableMapOf("a" to 0, "b" to 0)
        rule.setContent {
            DdsTheme {
                DdsScreenHost(screen, move, Modifier.size(100.dp).testTag("host")) { shown ->
                    Box(Modifier.fillMaxSize().clickable { taps[shown] = taps.getValue(shown) + 1 })
                }
            }
        }
        move = DdsMove.Push
        screen = "b"
        rule.waitForIdle()

        // Going back, the screen being left is the one on top while it fades away.
        rule.mainClock.autoAdvance = false
        move = DdsMove.Pop
        screen = "a"
        rule.mainClock.advanceTimeByFrame()
        rule.mainClock.advanceTimeByFrame()
        rule.onNodeWithTag("host").performTouchInput { click() }
        rule.mainClock.advanceTimeByFrame()
        assertEquals("the screen being left took the tap", 0, taps["b"])

        rule.mainClock.autoAdvance = true
        rule.waitForIdle()
        rule.onNodeWithTag("host").performTouchInput { click() }
        rule.waitForIdle()
        assertEquals("the screen returned to takes taps once it is the only one", 1, taps["a"])
    }

    @Test
    fun aChangeTurnedBackHalfWayLeavesNoFrameEmptyAndTheNextOneStillFades() {
        var screen by mutableStateOf("a")
        var move by mutableStateOf(DdsMove.None)
        host({ screen }, { move })

        rule.mainClock.autoAdvance = false
        move = DdsMove.Push
        screen = "b"
        mixedFramesWithNoneEmpty(2) // part-way forward…
        move = DdsMove.Pop
        screen = "a" // …and straight back
        mixedFramesWithNoneEmpty(12)
        rule.mainClock.autoAdvance = true
        rule.waitForIdle()
        assertEquals(red, hostColor())

        // The order the screens are stacked in must not have drifted: the next round trip fades both ways.
        rule.mainClock.autoAdvance = false
        move = DdsMove.Push
        screen = "b"
        val forward = mixedFramesWithNoneEmpty(12)
        rule.mainClock.autoAdvance = true
        rule.waitForIdle()
        rule.mainClock.autoAdvance = false
        move = DdsMove.Pop
        screen = "a"
        val back = mixedFramesWithNoneEmpty(12)
        assertTrue("forward still fades after a change was turned back, mixed for $forward", forward >= 2)
        assertTrue("back still fades after a change was turned back, mixed for $back", back >= 2)
    }

    @Test
    fun contentSlidingInDoesNotDrawOverWhatIsBesideTheScreen() {
        // A menu kept outside the host (a rail) sits right at the edge the content slides in from.
        var screen by mutableStateOf("a")
        var move by mutableStateOf(DdsMove.None)
        rule.setContent {
            DdsTheme {
                Row(Modifier.testTag("row")) {
                    Box(Modifier.size(40.dp, 100.dp).background(Color.Green))
                    DdsScreenHost(screen, move, Modifier.size(100.dp)) { shown ->
                        Box(Modifier.fillMaxSize().ddsScreenContent().background(if (shown == "a") red else blue))
                    }
                }
            }
        }
        move = DdsMove.Push
        screen = "b"
        rule.waitForIdle()

        rule.mainClock.autoAdvance = false
        move = DdsMove.Pop
        screen = "a" // slides in from the leading edge: from where the rail is
        rule.mainClock.advanceTimeByFrame()
        rule.mainClock.advanceTimeByFrame()
        val pixels = rule.onNodeWithTag("row").captureToImage().toPixelMap()
        val railWidth = with(rule.density) { 40.dp.roundToPx() }
        assertEquals("the rail's last column is still the rail", Color.Green, pixels[railWidth - 2, pixels.height / 2])
    }

    @Test
    fun theScreenBeforeIsToldItIsLeavingAndGoesOnceCovered() {
        var screen by mutableStateOf("a")
        var move by mutableStateOf(DdsMove.None)
        val current = mutableMapOf<String, Boolean>()
        val left = mutableListOf<String>()
        host({ screen }, { move }, seen = { name, isCurrent -> current[name] = isCurrent }, left = { left += it })

        rule.mainClock.autoAdvance = false
        move = DdsMove.Push
        screen = "b"
        rule.mainClock.advanceTimeByFrame()
        rule.mainClock.advanceTimeByFrame()
        assertEquals(false, current["a"])
        assertEquals(true, current["b"])
        assertTrue("still drawn underneath", left.isEmpty())
        // Not there for a screen reader, though still drawn.
        rule.onAllNodesWithText("word a").assertCountEquals(0)
        rule.onAllNodesWithText("word b").assertCountEquals(1)

        rule.mainClock.autoAdvance = true
        rule.waitForIdle()
        assertEquals(listOf("a"), left)
    }

    @Test
    fun goingForwardSlidesTheContentInFromTheTrailingEdgeAndBackFromTheLeading() {
        var screen by mutableStateOf("a")
        var move by mutableStateOf(DdsMove.None)
        host({ screen }, { move })

        rule.mainClock.autoAdvance = false
        move = DdsMove.Push
        screen = "b"
        rule.mainClock.advanceTimeByFrame()
        rule.mainClock.advanceTimeByFrame()
        assertTrue("forward starts to the right of where it ends", bodyLeft("b") > 0f)
        rule.mainClock.autoAdvance = true
        rule.waitForIdle()
        assertEquals(0f, bodyLeft("b"), 0.5f)

        rule.mainClock.autoAdvance = false
        move = DdsMove.Pop
        screen = "a"
        rule.mainClock.advanceTimeByFrame()
        rule.mainClock.advanceTimeByFrame()
        // Shifted to the left, so its right edge is short of the host's.
        val right = rule.onNodeWithTag("body a", useUnmergedTree = true).fetchSemanticsNode().boundsInRoot.right
        val hostRight = rule.onNodeWithTag("host").fetchSemanticsNode().boundsInRoot.right
        assertTrue("back starts to the left of where it ends", right < hostRight)
        rule.mainClock.autoAdvance = true
        rule.waitForIdle()
        assertEquals(0f, bodyLeft("a"), 0.5f)
    }

    @Test
    fun theFirstScreenIsSimplyThere() {
        rule.mainClock.autoAdvance = false
        host({ "a" }, { DdsMove.Push })
        rule.mainClock.advanceTimeByFrame()
        assertEquals(0f, bodyLeft("a"), 0.5f)
        assertEquals(red, hostColor())
    }

    @Test
    fun aChipEasesIntoBeingChosen() {
        var chosen by mutableStateOf(false)
        rule.setContent {
            DdsTheme {
                Box(Modifier.background(DdsTheme.colors.bgDefault).padding(16.dp)) {
                    DdsChip("전체", chosen, { chosen = it }, Modifier.testTag("chip"))
                }
            }
        }
        // Just inside the start of the chip: fill, clear of the label.
        fun fill(): Color {
            val pixels = rule.onNodeWithTag("chip").captureToImage().toPixelMap()
            return pixels[pixels.width / 8, pixels.height / 2]
        }
        val before = fill()
        rule.mainClock.autoAdvance = false
        chosen = true
        rule.mainClock.advanceTimeBy(50) // half of the 100ms it takes
        val midway = fill()
        rule.mainClock.autoAdvance = true
        rule.waitForIdle()
        val after = fill()
        assertNotEquals("chosen looks different", before, after)
        assertNotEquals("part-way at 50ms, not still unchosen", before, midway)
        assertFalse("part-way at 50ms, not already chosen", midway == after)
    }

    // ---- the app frame through a change of screen ----

    private val twoTabs = listOf("홈", "거래처").map { DdsNavItem(it, DdsIcons.Doc) }

    /**
     * An app frame (tagged `frame`) in a window forced to [size], around a host whose screens are a top bar
     * over a plain color (tagged `fill a`, `fill b`). Screen "a" is a top-level one: it asks for the bottom tabs.
     */
    private fun framedHost(size: DpSize, screen: () -> String, move: () -> DdsMove) {
        rule.setContent {
            DeviceConfigurationOverride(DeviceConfigurationOverride.ForcedSize(size)) {
                DdsTheme {
                    DdsAppFrame(twoTabs, 0, {}, Modifier.testTag("frame")) {
                        DdsScreenHost(screen(), move()) { shown ->
                            DdsScaffold(topBar = { DdsTopBar("화면 $shown") }, bottomTabs = shown == "a") { padding ->
                                Box(Modifier.fillMaxSize().padding(padding).background(if (shown == "a") red else blue).testTag("fill $shown")) {
                                    DdsBodyColumn { Text("word $shown") }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    /** Where the node tagged [tag] is, in pixels of the root. */
    private fun place(tag: String) = rule.onNodeWithTag(tag, useUnmergedTree = true).fetchSemanticsNode().boundsInRoot

    /**
     * [now] is [base] with [over] part-way over it, or one of the two: nothing else shows through.
     * Returns how far over it is, from 0 to 1.
     */
    private fun assertIsOneOverTheOther(message: String, base: Color, over: Color, now: Color): Float {
        val step = floatArrayOf(over.red - base.red, over.green - base.green, over.blue - base.blue)
        val moved = floatArrayOf(now.red - base.red, now.green - base.green, now.blue - base.blue)
        // How far along, read from the channel that changes most.
        val widest = step.indices.maxByOrNull { abs(step[it]) }!!
        val along = if (abs(step[widest]) < 0.02f) 0f else moved[widest] / step[widest]
        assertTrue("$message: $now is not between $base and $over", along in -0.04f..1.04f)
        for (channel in step.indices) {
            assertEquals("$message: $now is not $base with $over over it", along * step[channel], moved[channel], 0.05f)
        }
        return along
    }

    @Test
    fun theRailDoesNotChangeWhileTheScreenBesideItChanges() {
        var screen by mutableStateOf("a")
        var move by mutableStateOf(DdsMove.None)
        framedHost(DpSize(933.dp, 704.dp), { screen }, { move })
        fun rail() = rule.onNodeWithTag(DdsTestTags.Rail)
        fun fill(): Color {
            val pixels = rule.onNodeWithTag("frame").captureToImage().toPixelMap()
            // Three quarters across and down: the screen's color, clear of the rail, the top bar and the words.
            return pixels[pixels.width * 3 / 4, pixels.height * 3 / 4]
        }
        val before = rail().fetchSemanticsNode()
        val pixelsBefore = rail().captureToImage().toPixelMap()
        assertEquals(red, fill())

        rule.mainClock.autoAdvance = false
        move = DdsMove.Push
        screen = "b"
        var mixed = 0
        repeat(12) { frame ->
            rule.mainClock.advanceTimeByFrame()
            val now = rail().fetchSemanticsNode()
            // The same rail, not another one drawn by the screen that is arriving.
            assertEquals("frame $frame: the rail is the one that was there before the change", before.id, now.id)
            assertEquals("frame $frame: the rail has moved", before.boundsInRoot, now.boundsInRoot)
            val pixels = rail().captureToImage().toPixelMap()
            assertEquals("frame $frame: the rail's size in pixels", pixelsBefore.width to pixelsBefore.height, pixels.width to pixels.height)
            val changed = pixelsBefore.buffer.indices.count { pixelsBefore.buffer[it] != pixels.buffer[it] }
            assertEquals("frame $frame: pixels of the rail that changed", 0, changed)
            val along = assertIsOneOverTheOther("frame $frame beside the rail", red, blue, fill())
            if (along > 0.1f && along < 0.9f) mixed++
        }
        assertTrue("the screen beside the rail was part-way through its change for several frames, was for $mixed", mixed >= 2)
        rule.mainClock.autoAdvance = true
        rule.waitForIdle()
        assertEquals(blue, fill())
        assertEquals("after the change it is still the same rail", before.id, rail().fetchSemanticsNode().id)
    }

    @Test
    fun openingAScreenOverATabCoversTheBottomTabsWithNoFrameEmpty() {
        var screen by mutableStateOf("a")
        var move by mutableStateOf(DdsMove.None)
        framedHost(DpSize(475.dp, 751.dp), { screen }, { move })
        rule.onNodeWithTag(DdsTestTags.BottomTabs).assertIsDisplayed()
        val frame = place("frame")
        val tabs = place(DdsTestTags.BottomTabs)
        val content = place("fill a")
        assertEquals("the tab screen's color ends where the tabs begin", tabs.top, content.bottom, 1f)
        // One line of pixels down the screen's start edge, clear of the words and of the tabs' icons: from under
        // the top bar, down the tab screen's color, across the tabs' top line and 40dp into the tab row.
        val x = 4
        val top = (content.top - frame.top).toInt() + 2
        val tabsTop = (tabs.top - frame.top).toInt()
        val bottom = tabsTop + (40 * frame.width / 475f).toInt() // 40dp of this forced window
        fun line(): List<Color> {
            val pixels = rule.onNodeWithTag("frame").captureToImage().toPixelMap()
            return (top until bottom).map { pixels[x, it] }
        }
        val before = line()
        assertEquals("the line starts in the tab screen's color", red, before.first())
        assertTrue("the line ends in the tab row, which is not the tab screen's color", before.last() != red)

        rule.mainClock.autoAdvance = false
        move = DdsMove.Push
        screen = "b"
        var mixed = 0
        repeat(12) { step ->
            rule.mainClock.advanceTimeByFrame()
            val now = line()
            var partWay = false
            for (y in now.indices) {
                val what = if (top + y < tabsTop) "the tab screen" else "the bottom tabs"
                val along = assertIsOneOverTheOther("frame $step, ${top + y}px down, over $what", before[y], blue, now[y])
                if (along > 0.1f && along < 0.9f) partWay = true
            }
            if (partWay) mixed++
        }
        assertTrue("the new screen was part-way over the tabs for several frames, was for $mixed", mixed >= 2)
        rule.mainClock.autoAdvance = true
        rule.waitForIdle()
        val after = line()
        for (y in after.indices) assertEquals("at the end, ${top + y}px down is the new screen", blue, after[y])
        rule.onAllNodesWithTag(DdsTestTags.BottomTabs).assertCountEquals(0)
    }
}
