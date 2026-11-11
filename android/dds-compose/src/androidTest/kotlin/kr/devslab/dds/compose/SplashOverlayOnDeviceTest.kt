package kr.devslab.dds.compose

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.unit.dp
import androidx.test.platform.app.InstrumentationRegistry
import kr.devslab.dds.compose.motion.DdsSplashHandoff
import kr.devslab.dds.compose.motion.DdsSplashOverlay
import kr.devslab.dds.compose.motion.isReducedMotion
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeFalse
import org.junit.Before
import org.junit.Rule
import org.junit.Test

/**
 * The splash cover lifting when the mark has nowhere to travel to, measured with
 * the clock held: what the mark's own place shows in every frame.
 */
class SplashOverlayOnDeviceTest {
    @get:Rule
    val rule = createComposeRule()

    @Before
    fun animationsAreOn() {
        assumeFalse("animations are turned off on this device", isReducedMotion(InstrumentationRegistry.getInstrumentation().targetContext))
    }

    // The screen is blue, the mark red, the splash background green. No two share a
    // channel, so each channel of a pixel says how much of one of them is in it.
    private val screen = Color.Blue
    private val markColor = Color.Red
    private val cover = Color.Green

    private val handoff = DdsSplashHandoff(active = true, reduced = false, createdAt = 0L, drawMs = 0)

    /** A window 200dp square: the first screen, and the splash cover over it. No destination is marked. */
    private fun show(screenDrawsTheMark: Boolean) {
        rule.setContent {
            Box(Modifier.size(200.dp).testTag("window")) {
                Box(Modifier.fillMaxSize().background(screen)) {
                    // Some first screens draw the mark themselves, where the splash showed it.
                    if (screenDrawsTheMark) Box(Modifier.align(Alignment.Center).size(80.dp).background(markColor))
                }
                DdsSplashOverlay(handoff, background = cover, markSize = 80.dp) { size ->
                    Box(Modifier.size(size).background(markColor))
                }
            }
        }
    }

    private class Frame(val mark: Color, val beside: Color)

    /** The middle of the mark, and a point of the cover clear of it. */
    private fun frame(): Frame {
        val pixels = rule.onNodeWithTag("window").captureToImage().toPixelMap()
        return Frame(mark = pixels[pixels.width / 2, pixels.height / 2], beside = pixels[pixels.width / 8, pixels.height / 8])
    }

    @Test
    fun aMarkTheScreenDrawsInTheSamePlaceKeepsItsColorWhileTheCoverLifts() {
        show(screenDrawsTheMark = true)
        assertEquals(markColor, frame().mark)
        assertEquals(cover, frame().beside)

        rule.mainClock.autoAdvance = false
        handoff.release()
        var lifting = 0
        repeat(16) { // 16 frames is longer than the 150ms it takes
            rule.mainClock.advanceTimeByFrame()
            val now = frame()
            assertEquals("frame $it: the splash background shows through the mark", 0f, now.mark.green, 0.02f)
            assertEquals("frame $it: the mark is not its own color", 1f, now.mark.red, 0.02f)
            if (now.beside.green > 0.1f && now.beside.blue > 0.1f) lifting++
        }
        assertTrue("the cover is part-way for several frames, was for $lifting", lifting >= 3)

        rule.mainClock.autoAdvance = true
        rule.waitForIdle()
        assertEquals(DdsSplashHandoff.Phase.Done, handoff.phase)
        assertEquals(screen, frame().beside)
        assertEquals(markColor, frame().mark)
    }

    @Test
    fun aMarkTheScreenDoesNotDrawLeavesWithTheCoverAsOnePicture() {
        show(screenDrawsTheMark = false)

        rule.mainClock.autoAdvance = false
        handoff.release()
        var fading = 0
        repeat(16) {
            rule.mainClock.advanceTimeByFrame()
            val now = frame()
            assertEquals("frame $it: the splash background shows through the mark", 0f, now.mark.green, 0.02f)
            // As much of the mark is left as of the cover beside it: it does not stay behind and then vanish.
            assertEquals("frame $it: mark and cover are not equally far gone", now.beside.green, now.mark.red, 0.04f)
            if (now.mark.red > 0.1f && now.mark.blue > 0.1f) fading++
        }
        assertTrue("the mark is part-way for several frames, was for $fading", fading >= 3)

        rule.mainClock.autoAdvance = true
        rule.waitForIdle()
        assertEquals(DdsSplashHandoff.Phase.Done, handoff.phase)
        assertEquals(screen, frame().mark)
    }
}
