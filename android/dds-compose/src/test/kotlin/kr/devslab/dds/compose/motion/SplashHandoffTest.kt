package kr.devslab.dds.compose.motion

import androidx.compose.ui.geometry.Rect
import kr.devslab.dds.compose.motion.DdsSplashHandoff.Phase
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class SplashHandoffTest {
    private fun handoff(active: Boolean = true, reduced: Boolean = false) =
        DdsSplashHandoff(active, reduced, createdAt = 1_000, drawMs = 800, holdMs = 150, keepLimitMs = 1_000)

    @Test
    fun aRecreatedActivityDoesNotReplayTheSplash() {
        val recreated = handoff(active = false)
        assertEquals(Phase.Done, recreated.phase)
        assertFalse(recreated.keepOnScreen(now = 1_000))
        recreated.release()
        assertEquals(Phase.Done, recreated.phase)
    }

    @Test
    fun reducedMotionNeverHoldsTheSplash() {
        assertFalse(handoff(reduced = true).keepOnScreen(now = 1_000))
    }

    @Test
    fun theSplashIsHeldUntilItsDrawingAndThePauseAreOver() {
        val handoff = handoff()
        assertTrue(handoff.keepOnScreen(now = 1_000))
        assertTrue(handoff.keepOnScreen(now = 1_949))
        assertFalse(handoff.keepOnScreen(now = 1_950))
    }

    @Test
    fun aSlowStartIsNotMadeSlower() {
        // The first frame is only ready 5s after creation: the drawing time has long passed, so do not hold.
        assertFalse(handoff().keepOnScreen(now = 6_000))
    }

    @Test
    fun theHoldNeverExceedsTheLimitFromTheFirstReadyFrame() {
        val long = DdsSplashHandoff(true, false, createdAt = 0, drawMs = 10_000, holdMs = 150, keepLimitMs = 1_000)
        assertTrue(long.keepOnScreen(now = 200))
        assertTrue(long.keepOnScreen(now = 1_199))
        assertFalse(long.keepOnScreen(now = 1_200))
    }

    @Test
    fun releaseMovesOnceAndIsSafeToRepeat() {
        val handoff = handoff()
        handoff.release()
        assertEquals(Phase.Move, handoff.phase)
        assertFalse(handoff.keepOnScreen(now = 1_000))
        handoff.finish()
        handoff.release()
        assertEquals(Phase.Done, handoff.phase)
    }

    @Test
    fun aSplashThatShowedNoMarkHasNothingToCarryAcross() {
        val handoff = handoff()
        assertTrue(handoff.markShown)
        handoff.release(markShown = false)
        assertEquals(Phase.Move, handoff.phase)
        assertFalse(handoff.markShown)
        // A later call cannot turn the mark back on.
        handoff.release(markShown = true)
        assertFalse(handoff.markShown)
    }

    @Test
    fun theHighestPriorityIsTheLanding() {
        val handoff = handoff()
        assertNull(handoff.landing)
        val topBar = Rect(10f, 10f, 36f, 36f)
        val signIn = Rect(0f, 0f, 56f, 56f)
        handoff.setTarget(0, "top bar", topBar)
        assertEquals(topBar, handoff.landing)
        handoff.setTarget(1, "sign in", signIn)
        assertEquals(signIn, handoff.landing)
        handoff.removeTarget(1, "sign in")
        assertEquals(topBar, handoff.landing)
    }

    /** The bug this guards: the old screen is disposed after the new one has registered the same place. */
    @Test
    fun aScreenThatLeavesLateCannotEraseTheNextScreensPlace() {
        val handoff = handoff()
        val old = Any()
        val new = Any()
        handoff.setTarget(0, old, Rect(0f, 0f, 10f, 10f))
        val place = Rect(5f, 5f, 31f, 31f)
        handoff.setTarget(0, new, place)
        handoff.removeTarget(0, old)
        assertEquals(place, handoff.landing)
        handoff.removeTarget(0, new)
        assertNull(handoff.landing)
    }

    @Test
    fun theSplashWaitsForTheFirstScreenButOnlyUpToTheLimit() {
        val handoff = handoff()
        // Drawing and pause end at 1_950, but the first screen is not known yet.
        assertTrue(handoff.keepOnScreen(now = 1_000, firstScreenKnown = false))
        assertTrue(handoff.keepOnScreen(now = 1_990, firstScreenKnown = false))
        assertFalse(handoff.keepOnScreen(now = 1_990, firstScreenKnown = true))
        assertFalse(handoff.keepOnScreen(now = 2_000, firstScreenKnown = false))
    }
}
