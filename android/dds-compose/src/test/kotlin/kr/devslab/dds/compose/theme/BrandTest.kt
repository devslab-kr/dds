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
    fun onBrandFollowsTheRuleInsteadOfBeingChosenByHand() {
        // A mid cyan fill is brighter than it looks: dark text wins.
        val bright = Color(red = 0x08, green = 0x91, blue = 0xB2)
        assertEquals(Color(kr.devslab.dds.tokens.DdsLightColors.textOnBrand), onBrandFor(bright))
        assertEquals(Color.White, onBrandFor(Color.Black))
        assertTrue(contrastRatio(onBrandFor(bright), bright) >= DdsMinTextContrast)
        // Leaving textOnBrand out applies the same rule.
        val implied = DdsBrandColors(bgBrand = Color.Black, bgBrandHover = Color.Black, bgBrandSubtle = Color.White, textBrand = Color.Black)
        assertEquals(Color.White, implied.textOnBrand)
    }

    @Test
    fun anUnspecifiedFocusRingFallsBackToTheSystemRing() {
        val product = DdsBrand.Default.light.copy(borderFocus = Color.Unspecified)
        val colors = ddsColors(dark = false, brand = DdsBrand(product, DdsBrand.Default.dark))
        assertEquals(ddsColors(dark = false, brand = DdsBrand.Default).borderFocus, colors.borderFocus)
    }

    @Test
    fun brandTextMustReadOnThePageAndOnThePaleBackground() {
        val faint = DdsBrand.Default.light.copy(textBrand = DdsBrand.Default.light.bgBrandHover)
        val error = assertThrows(IllegalArgumentException::class.java) {
            DdsBrand(light = faint, dark = DdsBrand.Default.dark)
        }
        assertTrue(error.message.orEmpty(), error.message.orEmpty().contains("textBrand on the page background"))
    }

    /** A bright orange fill: white text on it is about 2.9:1. */
    private val orange = Color(red = 1f, green = 0.416f, blue = 0.122f)

    private fun whiteOnOrange(colors: DdsBrandColors, allow: Set<DdsContrastPair> = emptySet()) =
        colors.copy(bgBrand = orange, textOnBrand = Color.White, allow = allow)

    @Test
    fun whiteOnOrangeIsRejectedWithoutAnException() {
        assertTrue(contrastRatio(Color.White, orange) < DdsMinTextContrast)
        assertThrows(IllegalArgumentException::class.java) {
            DdsBrand(light = whiteOnOrange(DdsBrand.Default.light), dark = DdsBrand.Default.dark)
        }
    }

    @Test
    fun aDeclaredExceptionLetsThatPairThrough() {
        val declared = whiteOnOrange(DdsBrand.Default.light, allow = setOf(DdsContrastPair.TextOnBrand))
        val brand = DdsBrand(light = declared, dark = DdsBrand.Default.dark)
        assertEquals(Color.White, brand.light.textOnBrand)
        assertEquals(setOf(DdsContrastPair.TextOnBrand), brand.light.allow)
    }

    @Test
    fun anExceptionCoversOnlyItsPair() {
        val faintBrandText = whiteOnOrange(DdsBrand.Default.light, allow = setOf(DdsContrastPair.TextOnBrand))
            .copy(textBrand = DdsBrand.Default.light.bgBrandHover)
        val error = assertThrows(IllegalArgumentException::class.java) {
            DdsBrand(light = faintBrandText, dark = DdsBrand.Default.dark)
        }
        val message = error.message.orEmpty()
        assertTrue(message, message.contains("textBrand on the page background"))
        assertTrue(message, message.contains("dds_allow_contrast_text_brand"))
        assertTrue(message, message.contains("DdsContrastPair.TextBrand"))
    }

    @Test
    fun anExceptionForBrandTextCoversBothOfItsBackgrounds() {
        val faint = DdsBrand.Default.light.copy(
            textBrand = DdsBrand.Default.light.bgBrandHover,
            allow = setOf(DdsContrastPair.TextBrand),
        )
        DdsBrand(light = faint, dark = DdsBrand.Default.dark)
    }

    @Test
    fun anExceptionInOneThemeDoesNotCoverTheOther() {
        val light = whiteOnOrange(DdsBrand.Default.light, allow = setOf(DdsContrastPair.TextOnBrand))
        val dark = whiteOnOrange(DdsBrand.Default.dark)
        val error = assertThrows(IllegalArgumentException::class.java) { DdsBrand(light = light, dark = dark) }
        val message = error.message.orEmpty()
        assertTrue(message, message.contains("DdsBrand (dark)"))
        assertTrue(message, message.contains("res/values-night"))
        // And the other way round: declared for dark only, the light theme is still checked.
        val lightError = assertThrows(IllegalArgumentException::class.java) {
            DdsBrand(light = dark.copy(textBrand = DdsBrand.Default.light.textBrand), dark = light.copy(textBrand = DdsBrand.Default.dark.textBrand))
        }
        assertTrue(lightError.message.orEmpty(), lightError.message.orEmpty().contains("DdsBrand (light)"))
    }

    @Test
    fun theRejectionSaysHowToDeclareIt() {
        val error = assertThrows(IllegalArgumentException::class.java) {
            DdsBrand(light = whiteOnOrange(DdsBrand.Default.light), dark = DdsBrand.Default.dark)
        }
        val message = error.message.orEmpty()
        assertTrue(message, message.startsWith("DdsBrand (light): textOnBrand on bgBrand is "))
        assertTrue(message, message.contains("below 4.5:1."))
        assertTrue(message, message.contains("dds_allow_contrast_text_on_brand"))
        assertTrue(message, message.contains("res/values "))
        assertTrue(message, message.contains("allow = setOf(DdsContrastPair.TextOnBrand)"))
    }

    @Test
    fun theDefaultBrandNeedsNoException() {
        assertEquals(emptySet<DdsContrastPair>(), DdsBrand.Default.light.allow)
        assertEquals(emptySet<DdsContrastPair>(), DdsBrand.Default.dark.allow)
        // Built again from its own colors, with nothing declared, it still passes.
        DdsBrand(light = DdsBrand.Default.light.copy(allow = emptySet()), dark = DdsBrand.Default.dark.copy(allow = emptySet()))
    }

    @Test
    fun keepWordsOnlyAllowsBreaksAtSpaces() {
        val j = 0x2060.toChar()
        assertEquals("확${j}인 하${j}세${j}요", "확인 하세요".keepWords())
        assertEquals("", "".keepWords())
    }

    @Test
    fun keepWordsNeverSplitsASurrogatePair() {
        val j = 0x2060.toChar()
        val emoji = String(Character.toChars(0x1F600))
        assertEquals("확$j$emoji", "확$emoji".keepWords())
    }
}
