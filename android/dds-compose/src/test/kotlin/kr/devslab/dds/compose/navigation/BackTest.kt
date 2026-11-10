package kr.devslab.dds.compose.navigation

import kr.devslab.dds.tokens.DdsMotionTokens
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import androidx.compose.runtime.saveable.SaverScope
import org.junit.Test

class BackTest {
    private val quick = (DdsMotionTokens.backDoublePressMs - 1).toLong()
    private val slow = DdsMotionTokens.backDoublePressMs.toLong()

    @Test
    fun backGoesToTheScreenBeforeFirst() {
        assertEquals(DdsBackAction.PopScreen, ddsBackAction(canPop = true, hasPreviousTab = true, msSinceLastBack = null))
    }

    @Test
    fun thenToTheTabBefore() {
        assertEquals(DdsBackAction.PreviousTab, ddsBackAction(canPop = false, hasPreviousTab = true, msSinceLastBack = null))
    }

    @Test
    fun withNowhereLeftItAsksInsteadOfLeaving() {
        assertEquals(DdsBackAction.AskToExit, ddsBackAction(canPop = false, hasPreviousTab = false, msSinceLastBack = null))
    }

    @Test
    fun twoQuickPressesAskEvenWithSomewhereToGo() {
        assertEquals(DdsBackAction.AskToExit, ddsBackAction(canPop = true, hasPreviousTab = true, msSinceLastBack = quick))
    }

    @Test
    fun twoUnhurriedPressesJustGoBackTwice() {
        assertEquals(DdsBackAction.PopScreen, ddsBackAction(canPop = true, hasPreviousTab = true, msSinceLastBack = slow))
    }

    @Test
    fun aClockThatWentBackwardsIsNotADoublePress() {
        assertEquals(DdsBackAction.PopScreen, ddsBackAction(canPop = true, hasPreviousTab = false, msSinceLastBack = -5))
    }

    @Test
    fun theTrailRemembersEachTabOnce() {
        val trail = DdsTabTrail(listOf(0))
        trail.visit(1)
        trail.visit(2)
        trail.visit(1) // back to a tab already seen: it moves to the end, it is not added twice
        assertEquals(listOf(0, 2, 1), trail.snapshot())
        assertEquals(2, trail.back())
        assertEquals(0, trail.back())
        assertNull(trail.back())
        assertEquals(0, trail.current)
    }

    @Test
    fun pressingTheCurrentTabAgainChangesNothing() {
        val trail = DdsTabTrail(listOf(0))
        trail.visit(1)
        trail.visit(1)
        assertEquals(listOf(0, 1), trail.snapshot())
        assertEquals(0, trail.previous)
    }

    @Test
    fun theTrailSurvivesBeingSavedAndRestored() {
        val trail = DdsTabTrail(listOf(0)).apply { visit(3) }
        val saved = with(DdsTabTrail.Saver) { SaverScope { true }.save(trail) }!!
        // What is saved has to be a type a Bundle can hold; a snapshot list's own copy is not.
        assertEquals(ArrayList::class.java, saved.javaClass)
        val restored = DdsTabTrail.Saver.restore(saved)!!
        assertEquals(3, restored.current)
        assertEquals(0, restored.previous)
    }
}
