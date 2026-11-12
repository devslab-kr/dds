package kr.devslab.dds.compose.layout

import androidx.compose.ui.unit.dp
import org.junit.Assert.assertEquals
import org.junit.Test

class WindowWidthTest {
    @Test
    fun theTwoLinesBetweenTheThreeWidths() {
        assertEquals(DdsWindowWidth.Compact, ddsWindowWidth(599.dp))
        assertEquals(DdsWindowWidth.Medium, ddsWindowWidth(600.dp))
        assertEquals(DdsWindowWidth.Medium, ddsWindowWidth(839.dp))
        assertEquals(DdsWindowWidth.Expanded, ddsWindowWidth(840.dp))
    }

    @Test
    fun theGutterFollowsTheWindow() {
        assertEquals(16.dp, DdsWindowWidth.Compact.gutter)
        assertEquals(24.dp, DdsWindowWidth.Medium.gutter)
        assertEquals(24.dp, DdsWindowWidth.Expanded.gutter)
    }

    @Test
    fun framesWithTheSameReportAreEqual() {
        assertEquals(
            DdsFrame(DdsWindowWidth.Expanded, rail = true, listPinned = true),
            DdsFrame(DdsWindowWidth.Expanded, rail = true, listPinned = true),
        )
    }
}
