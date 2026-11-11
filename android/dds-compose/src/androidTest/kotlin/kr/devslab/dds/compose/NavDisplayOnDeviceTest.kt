package kr.devslab.dds.compose

import org.junit.Before
import org.junit.Assume.assumeFalse
import kr.devslab.dds.compose.motion.isReducedMotion
import androidx.test.platform.app.InstrumentationRegistry
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.unit.dp
import androidx.navigation3.runtime.NavEntry
import androidx.navigation3.ui.NavDisplay
import kr.devslab.dds.compose.motion.DdsMove
import kr.devslab.dds.compose.motion.DdsScreenMotion
import kr.devslab.dds.compose.motion.ddsScreenChange
import kr.devslab.dds.compose.motion.ddsScreenContent
import kr.devslab.dds.compose.theme.DdsTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * The screen change inside Navigation 3's `NavDisplay`, wired the way the guide
 * says and the apps do: [ddsScreenChange] for the three transition specs, each
 * entry in [DdsScreenMotion]. Measured with the clock held.
 */
class NavDisplayOnDeviceTest {
    @get:Rule
    val rule = createComposeRule()

    // Two colors no screen has, with no green in either: any green seen is the background showing.
    private val red = Color.Red
    private val blue = Color.Blue

    @Before
    fun animationsAreOn() {
        assumeFalse("animations are turned off on this device", isReducedMotion(InstrumentationRegistry.getInstrumentation().targetContext))
    }

    private val backStack = mutableStateListOf("a")
    private var move by mutableStateOf(DdsMove.None)

    private fun show() {
        rule.setContent {
            DdsTheme {
                Box(Modifier.size(100.dp).testTag("host")) {
                    NavDisplay(
                        backStack = backStack,
                        onBack = { },
                        transitionSpec = { ddsScreenChange(move, reduced = false) },
                        popTransitionSpec = { ddsScreenChange(DdsMove.Pop, reduced = false) },
                        predictivePopTransitionSpec = { ddsScreenChange(DdsMove.Pop, reduced = false) },
                        entryProvider = { key ->
                            NavEntry(key) {
                                DdsScreenMotion(move) {
                                    Box(Modifier.fillMaxSize().background(if (key == "a") red else blue)) {
                                        Box(Modifier.fillMaxSize().ddsScreenContent().testTag("body $key"))
                                    }
                                }
                            }
                        },
                    )
                }
            }
        }
    }

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
            assertEquals("frame $it shows something that is neither screen", 0f, now.green, 0.02f)
            assertEquals("frame $it is not fully covered", 1f, now.red + now.blue, 0.06f)
            if (now.red > 0.1f && now.blue > 0.1f) mixed++
        }
        return mixed
    }

    private fun forward(to: String, how: DdsMove = DdsMove.Push) {
        move = how
        backStack.add(to)
    }

    private fun back() {
        move = DdsMove.Pop
        backStack.removeAt(backStack.lastIndex)
    }

    @Test
    fun goingForwardTheNewScreenAppearsOverTheOneBeforeAndNoFrameIsEmpty() {
        show()
        assertEquals(red, hostColor())
        rule.mainClock.autoAdvance = false
        forward("b")
        val mixed = mixedFramesWithNoneEmpty(12)
        assertTrue("part-way for several frames, was for $mixed", mixed >= 2)
        rule.mainClock.autoAdvance = true
        rule.waitForIdle()
        assertEquals(blue, hostColor())
    }

    @Test
    fun goingBackTheScreenLeftFadesAwayOverTheOneReturnedToAndNoFrameIsEmpty() {
        show()
        forward("b")
        rule.waitForIdle()
        assertEquals(blue, hostColor())

        rule.mainClock.autoAdvance = false
        back()
        val mixed = mixedFramesWithNoneEmpty(12)
        assertTrue("part-way for several frames, was for $mixed", mixed >= 2)
        rule.mainClock.autoAdvance = true
        rule.waitForIdle()
        assertEquals(red, hostColor())
    }

    @Test
    fun aTabAppearsOverTheOneBeforeAndNoFrameIsEmpty() {
        show()
        rule.mainClock.autoAdvance = false
        move = DdsMove.Tab
        backStack[0] = "b" // another tab: the root is replaced
        val mixed = mixedFramesWithNoneEmpty(14)
        assertTrue("part-way for several frames, was for $mixed", mixed >= 3)
        rule.mainClock.autoAdvance = true
        rule.waitForIdle()
        assertEquals(blue, hostColor())
    }

    @Test
    fun goingBackSlidesTheContentOfTheScreenReturnedTo() {
        // Navigation 3 keeps the saved state of a screen still on the back stack and gives it
        // back when the screen returns. A screen that remembers "I have arrived" in that state
        // would come back without moving (seen in Qooroo with 0.4.0).
        show()
        forward("b")
        rule.waitForIdle()

        rule.mainClock.autoAdvance = false
        back()
        rule.mainClock.advanceTimeByFrame()
        rule.mainClock.advanceTimeByFrame()
        val body = rule.onNodeWithTag("body a", useUnmergedTree = true).fetchSemanticsNode().boundsInRoot
        val host = rule.onNodeWithTag("host").fetchSemanticsNode().boundsInRoot
        assertTrue("back starts to the leading side of where it ends", body.right < host.right)
        rule.mainClock.autoAdvance = true
        rule.waitForIdle()
        val settled = rule.onNodeWithTag("body a", useUnmergedTree = true).fetchSemanticsNode().boundsInRoot
        assertEquals(host.right, settled.right, 0.5f)
    }

    @Test
    fun goingForwardSlidesTheContentInFromTheTrailingEdge() {
        show()
        rule.mainClock.autoAdvance = false
        forward("b")
        rule.mainClock.advanceTimeByFrame()
        rule.mainClock.advanceTimeByFrame()
        val body = rule.onNodeWithTag("body b", useUnmergedTree = true).fetchSemanticsNode().boundsInRoot
        val host = rule.onNodeWithTag("host").fetchSemanticsNode().boundsInRoot
        assertTrue("forward starts to the trailing side of where it ends", body.left > host.left)
    }
}
