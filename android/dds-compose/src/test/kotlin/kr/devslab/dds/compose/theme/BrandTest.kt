package kr.devslab.dds.compose.theme

import androidx.compose.ui.graphics.Color
import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test

class BrandTest {
    @Test
    fun contrastRatioMatchesTheWcagEndpoints() {
        assertEquals(21.0, contrastRatio(Color.Black, Color.White), 0.01)
        assertEquals(1.0, contrastRatio(Color.White, Color.White), 0.0001)
        assertEquals(contrastRatio(Color.Black, Color.White), contrastRatio(Color.White, Color.Black), 0.0001)
    }

    @Test
    fun theDefaultBrandPassesItsOwnRule() {
        val brand = DdsBrand.Default
        assertTrue(contrastRatio(brand.light.textOnBrand, brand.light.bgBrand) >= DdsMinTextContrast)
        assertTrue(contrastRatio(brand.dark.textOnBrand, brand.dark.bgBrand) >= DdsMinTextContrast)
    }

    @Test
    fun whiteTextOnABrightBrandFaceIsRejectedWithTheMeasuredRatio() {
        val bright = DdsBrand.Default.light.copy(textOnBrand = Color.White)
        val error = assertThrows(IllegalArgumentException::class.java) {
            DdsBrand(light = bright, dark = DdsBrand.Default.dark)
        }
        val message = error.message.orEmpty()
        assertTrue(message, message.contains("light"))
        assertTrue(message, Regex("[0-9]\\.[0-9][0-9]:1").containsMatchIn(message))
    }

    @Test
    fun aDarkBrandFaceMayTakeWhiteText() {
        val ink = DdsBrand.Default.light.copy(bgBrand = Color.Black, textOnBrand = Color.White)
        DdsBrand(light = ink, dark = DdsBrand.Default.dark)
    }

    @Test
    fun aProductBrandReplacesOnlyTheBrandColors() {
        val ink = DdsBrand.Default.light.copy(bgBrand = Color.Black, textOnBrand = Color.White)
        val product = ddsColors(dark = false, brand = DdsBrand(ink, DdsBrand.Default.dark))
        val system = ddsColors(dark = false, brand = DdsBrand.Default)
        assertEquals(Color.Black, product.bgBrand)
        assertEquals(system.bgDefault, product.bgDefault)
        assertEquals(system.textPrimary, product.textPrimary)
        assertEquals(system.statusDanger, product.statusDanger)
    }

    @Test
    fun keepWordsOnlyAllowsBreaksAtSpaces() {
        val joiner = "⁠"
        assertEquals("확${joiner}인 하${joiner}세${joiner}요", "확인 하세요".keepWords())
        assertEquals("", "".keepWords())
    }
}
