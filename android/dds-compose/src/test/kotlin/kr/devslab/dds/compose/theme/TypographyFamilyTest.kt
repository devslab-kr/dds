package kr.devslab.dds.compose.theme

import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import org.junit.Assert.assertEquals
import org.junit.Assert.assertSame
import org.junit.Test

/** The family an app passes to DdsTheme (0.9.2): the default is unchanged, a passed one is used everywhere. */
class TypographyFamilyTest {
    private fun DdsTypography.all(): List<TextStyle> = listOf(display, title1, title2, title3, body1, body2, label, caption)

    @Test
    fun byDefaultEveryStyleIsPretendard() {
        for (large in listOf(false, true)) {
            for (style in ddsTypography(large).all()) assertSame(DdsSans, style.fontFamily)
        }
    }

    @Test
    fun aPassedFamilyIsUsedByEveryStyle() {
        val own = FontFamily.Serif
        for (large in listOf(false, true)) {
            for (style in ddsTypography(large, own).all()) assertSame(own, style.fontFamily)
        }
    }

    @Test
    fun onlyTheFamilyChanges() {
        for (large in listOf(false, true)) {
            val dds = ddsTypography(large).all()
            val own = ddsTypography(large, FontFamily.Serif).all()
            for ((a, b) in dds.zip(own)) assertEquals(a.copy(fontFamily = null), b.copy(fontFamily = null))
        }
    }

    @Test
    fun materialTypeFollowsTheFamily() {
        val own = FontFamily.Serif
        val material = materialTypography(ddsTypography(false, own))
        for (style in listOf(material.bodyLarge, material.labelLarge, material.titleLarge, material.displayLarge)) {
            assertSame(own, style.fontFamily)
        }
    }
}
