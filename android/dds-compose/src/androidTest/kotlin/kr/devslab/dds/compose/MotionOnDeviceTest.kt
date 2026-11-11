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
}
