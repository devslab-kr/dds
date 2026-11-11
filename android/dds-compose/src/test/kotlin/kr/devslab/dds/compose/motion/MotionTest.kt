package kr.devslab.dds.compose.motion

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class MotionTest {
    @Test
    fun staggerIsOneStepPerItemAndStopsAtTheLimit() {
        assertEquals(0, staggerDelayMs(0))
        assertEquals(3 * DdsMotion.StaggerStep, staggerDelayMs(3))
        assertEquals(DdsMotion.StaggerLimit * DdsMotion.StaggerStep, staggerDelayMs(50))
        assertEquals(0, staggerDelayMs(-1))
        assertTrue(staggerDelayMs(Int.MAX_VALUE) <= DdsMotion.Base)
    }

    @Test
    fun pushComesFromTheTrailingEdgeAndPopFromTheLeading() {
        assertEquals(EnterSpec(0, DdsMotion.Slow, 1), enterSpec(DdsMove.Push, reduced = false))
        assertEquals(EnterSpec(0, DdsMotion.Base, -1), enterSpec(DdsMove.Pop, reduced = false))
    }

    @Test
    fun noMoveStartsTransparent() {
        // Content that fades in is an empty page for its first frames (seen on a phone).
        for (move in DdsMove.entries) assertEquals(0, enterSpec(move, reduced = false).fadeMs)
    }

    @Test
    fun aTabDoesNotMove() {
        assertEquals(EnterSpec(0, 0, 0), enterSpec(DdsMove.Tab, reduced = false))
    }

    @Test
    fun nothingMovesWithReducedMotionOrWithoutAMove() {
        for (move in DdsMove.entries) assertEquals(EnterSpec(0, 0, 0), enterSpec(move, reduced = true))
        assertEquals(EnterSpec(0, 0, 0), enterSpec(DdsMove.None, reduced = false))
    }

    @Test
    fun inTheHostAScreenAppearsOverTheOneBeforeAndATabTakesALittleLonger() {
        assertEquals(DdsMotion.Fast, hostFadeMs(DdsMove.Push, reduced = false))
        assertEquals(DdsMotion.Fast, hostFadeMs(DdsMove.Pop, reduced = false))
        assertEquals(DdsMotion.Short, hostFadeMs(DdsMove.Tab, reduced = false))
        assertEquals(0, hostFadeMs(DdsMove.None, reduced = false))
    }

    @Test
    fun inTheHostNothingFadesWithReducedMotion() {
        for (move in DdsMove.entries) assertEquals(0, hostFadeMs(move, reduced = true))
    }

    @Test
    fun aScreenArrivesTheFirstTimeAndWhenComeBackToButNotWhenItsWindowIsRebuilt() {
        assertTrue("never shown before", arrives(arrivedBefore = false, windowHasShownAScreen = false))
        assertTrue("never shown before, in a window in use", arrives(arrivedBefore = false, windowHasShownAScreen = true))
        assertTrue("come back to", arrives(arrivedBefore = true, windowHasShownAScreen = true))
        assertTrue("the window was just rebuilt around it", !arrives(arrivedBefore = true, windowHasShownAScreen = false))
    }

    @Test
    fun aScreenComeBackToNeverPlaysForward() {
        // A back swipe shows the screen underneath before the app has recorded that it is going back.
        assertEquals(DdsMove.Pop, arrivalMove(DdsMove.Push, arrivedBefore = true, windowHasShownAScreen = true))
        assertEquals(DdsMove.Pop, arrivalMove(DdsMove.Pop, arrivedBefore = true, windowHasShownAScreen = true))
        assertEquals(DdsMove.Tab, arrivalMove(DdsMove.Tab, arrivedBefore = true, windowHasShownAScreen = true))
        assertEquals(DdsMove.Push, arrivalMove(DdsMove.Push, arrivedBefore = false, windowHasShownAScreen = true))
        assertEquals(DdsMove.None, arrivalMove(DdsMove.Push, arrivedBefore = true, windowHasShownAScreen = false))
    }
}
