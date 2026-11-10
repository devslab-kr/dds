package kr.devslab.dds.compose.component

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ValueRowTest {
    @Test
    fun whenBothFitTheNameHasWhatItWantsAndTheValueTheRest() {
        assertEquals(100 to 184, valueRowWidths(total = 300, gap = 16, nameWants = 100, valueWants = 120))
    }

    @Test
    fun aLongNameCannotPushTheValueOut() {
        val (name, value) = valueRowWidths(total = 300, gap = 16, nameWants = 900, valueWants = 120)
        assertEquals(164, name) // gives way only as far as the value needs
        assertEquals(120, value)
    }

    @Test
    fun whenBothAreLongTheNameKeepsTwoFifths() {
        val (name, value) = valueRowWidths(total = 300, gap = 16, nameWants = 900, valueWants = 900)
        assertEquals(284 * 2 / 5, name)
        assertEquals(284 - name, value)
    }

    @Test
    fun aShortNameLeavesTheValueAllTheRoomItNeeds() {
        // the case a fixed 2:3 split got wrong: a short name beside a long amount
        val (name, value) = valueRowWidths(total = 300, gap = 16, nameWants = 60, valueWants = 220)
        assertEquals(60, name)
        assertTrue(value >= 220)
    }

    @Test
    fun aRowNarrowerThanItsGapDoesNotGoNegative() {
        assertEquals(0 to 0, valueRowWidths(total = 10, gap = 16, nameWants = 50, valueWants = 50))
    }
}
