package kr.devslab.dds.compose

import org.junit.Before
import org.junit.Assume.assumeFalse
import kr.devslab.dds.compose.motion.isReducedMotion
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertTrue
import org.junit.After
import androidx.compose.ui.test.onRoot
import androidx.compose.runtime.saveable.rememberSaveableStateHolder
import androidx.compose.runtime.setValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.getValue
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import kr.devslab.dds.compose.motion.DdsMove
import kr.devslab.dds.compose.motion.DdsScreenMotion
import kr.devslab.dds.compose.motion.ddsScreenContent
import kr.devslab.dds.compose.theme.DdsTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/** What the activity below shows. Kept outside it, so a test can change it and it outlives a rebuild. */
internal object Shown {
    var screen by mutableStateOf("a")
    var move by mutableStateOf(DdsMove.Push)
}

/**
 * Shows one screen at a time and keeps the saved state of the ones that are away,
 * giving it back when they return — what Navigation 3 does for a back stack.
 */
class ArrivingScreenActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            DdsTheme {
                val kept = rememberSaveableStateHolder()
                val screen = Shown.screen
                kept.SaveableStateProvider(screen) {
                    DdsScreenMotion(Shown.move) {
                        Box(Modifier.fillMaxSize().ddsScreenContent().testTag("body $screen"))
                    }
                }
            }
        }
    }
}

/**
 * A screen arrives when the person gets to it, not when the system rebuilds the
 * window around it (a rotation, a change of font size or theme, a restore).
 */
class RebuiltWindowTest {
    @get:Rule
    val rule = createAndroidComposeRule<ArrivingScreenActivity>()

    @Before
    fun animationsAreOn() {
        assumeFalse("animations are turned off on this device", isReducedMotion(InstrumentationRegistry.getInstrumentation().targetContext))
    }

    @After
    fun startOver() {
        Shown.screen = "a"
        Shown.move = DdsMove.Push
    }

    private fun body(screen: String) = rule.onNodeWithTag("body $screen").fetchSemanticsNode().boundsInRoot

    @Test
    fun aScreenDoesNotArriveAgainWhenItsWindowIsRebuilt() {
        rule.waitForIdle()
        assertEquals("settled after arriving the first time", 0f, body("a").left, 0.5f)

        rule.mainClock.autoAdvance = false
        rule.activityRule.scenario.recreate()
        rule.mainClock.advanceTimeByFrame()
        rule.mainClock.advanceTimeByFrame()
        // Arriving again would have it part-way in from the trailing edge here.
        assertEquals("simply there after the rebuild", 0f, body("a").left, 0.5f)
    }

    @Test
    fun afterARebuildAScreenThatIsComeBackToStillArrives() {
        rule.waitForIdle()
        rule.runOnUiThread { Shown.screen = "b" } // forward; "a" is kept with its saved state
        rule.waitForIdle()
        rule.activityRule.scenario.recreate() // "b" is rebuilt in a new window; "a" is still away
        rule.waitForIdle()
        val full = rule.onRoot().fetchSemanticsNode().boundsInRoot.right

        rule.mainClock.autoAdvance = false
        rule.runOnUiThread {
            Shown.move = DdsMove.Pop
            Shown.screen = "a"
        }
        rule.mainClock.advanceTimeByFrame()
        rule.mainClock.advanceTimeByFrame()
        // Sliding in from the leading edge: its trailing edge is short of the window's.
        assertTrue("come back to after a rebuild, it still slides in", body("a").right < full)
    }
}
