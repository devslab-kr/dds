package kr.devslab.dds.tokens

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * The generated constants are checked against the token JSON files by the Node drift
 * test. What only the JVM can show is that they compile to what a consumer
 * reads, and that the rules the guide states about them hold.
 */
class GeneratedTokensTest {
    @Test
    fun brandFaceIsTheSameInBothThemes() {
        assertEquals(DdsLightColors.bgBrand, DdsDarkColors.bgBrand)
        assertEquals(DdsLightColors.textOnBrand, DdsDarkColors.textOnBrand)
    }

    @Test
    fun colorsAreOpaqueArgbUnlessTheyAreOverlays() {
        assertEquals(0xFFL, DdsLightColors.bgDefault ushr 24)
        assertEquals(0xFFL, DdsDarkColors.textPrimary ushr 24)
        assertTrue((DdsLightColors.overlayDim ushr 24) < 0xFFL)
    }

    @Test
    fun staggerStaysUnderTheBaseDuration() {
        assertTrue(DdsMotionTokens.staggerStepMs * DdsMotionTokens.staggerLimit <= DdsMotionTokens.baseMs)
    }

    @Test
    fun everyControlClearsTheTouchMinimumExceptTheVisiblySmallOne() {
        assertTrue(DdsControl.md >= DdsTouch.min)
        assertTrue(DdsControl.lg >= DdsTouch.min)
        assertTrue(DdsField.height >= DdsTouch.min)
        assertTrue(DdsRow.min >= DdsTouch.min)
        assertTrue(DdsControl.sm < DdsTouch.min)
    }
}
