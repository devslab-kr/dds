package kr.devslab.dds.compose.theme

import androidx.compose.ui.graphics.Color
import kr.devslab.dds.tokens.DdsDarkColors
import kr.devslab.dds.tokens.DdsLightColors
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
        assertTrue(message, message.contains("in res/values (a bool set there also covers the dark theme"))
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
    fun theLightRejectionSaysThatValuesAlsoCoversTheDarkTheme() {
        val light = assertThrows(IllegalArgumentException::class.java) {
            DdsBrand(light = whiteOnOrange(DdsBrand.Default.light), dark = DdsBrand.Default.dark)
        }.message.orEmpty()
        assertTrue(light, light.contains("also covers the dark theme unless res/values-night sets it to false"))
        // The dark message points at res/values-night, which covers nothing else.
        val dark = assertThrows(IllegalArgumentException::class.java) {
            DdsBrand(light = DdsBrand.Default.light, dark = whiteOnOrange(DdsBrand.Default.dark))
        }.message.orEmpty()
        assertTrue(dark, dark.startsWith("DdsBrand (dark)"))
        assertTrue(dark, !dark.contains("also covers"))
    }

    /** A warm paper page: light enough for every system text color. */
    private val paper = Color(red = 0.98f, green = 0.96f, blue = 0.92f)

    /** Close to black: none of the light theme's text reads on it. */
    private val nearBlack = Color(red = 0.05f, green = 0.05f, blue = 0.05f)

    /** Mid gray: the light theme's body text reads on it, its secondary text does not. */
    private val midGray = Color(red = 0.5f, green = 0.5f, blue = 0.5f)

    private fun DdsBrandColors.withoutBackgrounds() =
        copy(bgDefault = Color.Unspecified, bgSubtle = Color.Unspecified, bgElevated = Color.Unspecified)

    /** The three backgrounds, each as (how the message names it, how to set it). */
    private val backgrounds: List<Pair<String, (DdsBrandColors, Color) -> DdsBrandColors>> = listOf(
        "the page background (bgDefault)" to { colors, color -> colors.copy(bgDefault = color) },
        "the subtle background (bgSubtle)" to { colors, color -> colors.copy(bgSubtle = color) },
        "the card background (bgElevated)" to { colors, color -> colors.copy(bgElevated = color) },
    )

    @Test
    fun anUnspecifiedBackgroundIsTheSystems() {
        val inCode = DdsBrand(DdsBrand.Default.light.withoutBackgrounds(), DdsBrand.Default.dark.withoutBackgrounds())
        assertEquals(Color.Unspecified, inCode.light.bgDefault)
        val light = ddsColors(dark = false, brand = inCode)
        assertEquals(Color(DdsLightColors.bgDefault), light.bgDefault)
        assertEquals(Color(DdsLightColors.bgSubtle), light.bgSubtle)
        assertEquals(Color(DdsLightColors.bgElevated), light.bgElevated)
        val dark = ddsColors(dark = true, brand = inCode)
        assertEquals(Color(DdsDarkColors.bgDefault), dark.bgDefault)
        assertEquals(Color(DdsDarkColors.bgSubtle), dark.bgSubtle)
        assertEquals(Color(DdsDarkColors.bgElevated), dark.bgElevated)
        // The default brand names the same values, so it resolves to the same colors.
        for (night in listOf(false, true)) {
            val system = ddsColors(dark = night, brand = DdsBrand.Default)
            val product = ddsColors(dark = night, brand = inCode)
            assertEquals(system.bgDefault, product.bgDefault)
            assertEquals(system.bgSubtle, product.bgSubtle)
            assertEquals(system.bgElevated, product.bgElevated)
            assertEquals(system.bgBrand, product.bgBrand)
            assertEquals(system.textBrand, product.textBrand)
            assertEquals(system.textPrimary, product.textPrimary)
            assertEquals(system.borderFocus, product.borderFocus)
        }
        // A constructor call that leaves the backgrounds out means the same thing.
        val bare = DdsBrandColors(bgBrand = Color.Black, bgBrandHover = Color.Black, bgBrandSubtle = Color.White, textBrand = Color.Black)
        assertEquals(Color.Unspecified, bare.bgDefault)
        assertEquals(Color.Unspecified, bare.bgSubtle)
        assertEquals(Color.Unspecified, bare.bgElevated)
    }

    @Test
    fun aProductBackgroundReplacesOnlyThatOne() {
        val system = ddsColors(dark = false, brand = DdsBrand.Default)
        for ((index, background) in backgrounds.withIndex()) {
            val brand = DdsBrand(light = background.second(DdsBrand.Default.light.withoutBackgrounds(), paper), dark = DdsBrand.Default.dark)
            val product = ddsColors(dark = false, brand = brand)
            assertEquals(background.first, if (index == 0) paper else system.bgDefault, product.bgDefault)
            assertEquals(background.first, if (index == 1) paper else system.bgSubtle, product.bgSubtle)
            assertEquals(background.first, if (index == 2) paper else system.bgElevated, product.bgElevated)
            assertEquals(system.textPrimary, product.textPrimary)
            assertEquals(system.borderDefault, product.borderDefault)
            // The other theme keeps the system's values.
            val dark = ddsColors(dark = true, brand = brand)
            assertEquals(Color(DdsDarkColors.bgDefault), dark.bgDefault)
            assertEquals(Color(DdsDarkColors.bgSubtle), dark.bgSubtle)
            assertEquals(Color(DdsDarkColors.bgElevated), dark.bgElevated)
        }
    }

    @Test
    fun darkTextOnADarkProductPageIsRejected() {
        val error = assertThrows(IllegalArgumentException::class.java) {
            DdsBrand(light = DdsBrand.Default.light.copy(bgDefault = nearBlack), dark = DdsBrand.Default.dark)
        }
        val message = error.message.orEmpty()
        assertTrue(message, message.startsWith("DdsBrand (light): textPrimary on the page background (bgDefault) is "))
        assertTrue(message, message.contains("dds_allow_contrast_text_on_background"))
        assertTrue(message, message.contains("allow = setOf(DdsContrastPair.TextOnBackground)"))
    }

    @Test
    fun bodyAndSecondaryTextAreCheckedOnAllThreeBackgrounds() {
        for ((name, set) in backgrounds) {
            val body = assertThrows(IllegalArgumentException::class.java) {
                DdsBrand(light = set(DdsBrand.Default.light, nearBlack), dark = DdsBrand.Default.dark)
            }
            assertTrue(body.message.orEmpty(), body.message.orEmpty().contains("textPrimary on $name is "))
            val secondary = assertThrows(IllegalArgumentException::class.java) {
                DdsBrand(light = set(DdsBrand.Default.light, midGray), dark = DdsBrand.Default.dark)
            }
            assertTrue(secondary.message.orEmpty(), secondary.message.orEmpty().contains("textSecondary on $name is "))
            // The dark theme checks its own text on its own backgrounds.
            val dark = assertThrows(IllegalArgumentException::class.java) {
                DdsBrand(light = DdsBrand.Default.light, dark = set(DdsBrand.Default.dark, Color.White))
            }
            assertTrue(dark.message.orEmpty(), dark.message.orEmpty().startsWith("DdsBrand (dark): textPrimary on $name is "))
        }
    }

    @Test
    fun declaringTextOnBackgroundLetsItThrough() {
        val both = setOf(DdsContrastPair.TextOnBackground, DdsContrastPair.TextBrand)
        val brand = DdsBrand(light = DdsBrand.Default.light.copy(bgDefault = nearBlack, allow = both), dark = DdsBrand.Default.dark)
        assertEquals(nearBlack, ddsColors(dark = false, brand = brand).bgDefault)
        // Declaring it covers only that pair: brand text on the same page is still checked.
        val error = assertThrows(IllegalArgumentException::class.java) {
            DdsBrand(
                light = DdsBrand.Default.light.copy(bgDefault = nearBlack, allow = setOf(DdsContrastPair.TextOnBackground)),
                dark = DdsBrand.Default.dark,
            )
        }
        assertTrue(error.message.orEmpty(), error.message.orEmpty().contains("textBrand on the page background (bgDefault) is "))
        // And it covers only that theme.
        val dark = assertThrows(IllegalArgumentException::class.java) {
            DdsBrand(
                light = DdsBrand.Default.light.copy(bgDefault = nearBlack, allow = both),
                dark = DdsBrand.Default.dark.copy(bgDefault = Color.White),
            )
        }
        assertTrue(dark.message.orEmpty(), dark.message.orEmpty().startsWith("DdsBrand (dark): textPrimary on the page background"))
    }

    @Test
    fun brandTextIsCheckedOnAllThreeBackgrounds() {
        for ((name, set) in backgrounds) {
            // Body text is declared, so what is left to fail on the dark background is brand text.
            val colors = set(DdsBrand.Default.light, nearBlack).copy(allow = setOf(DdsContrastPair.TextOnBackground))
            val error = assertThrows(IllegalArgumentException::class.java) { DdsBrand(light = colors, dark = DdsBrand.Default.dark) }
            val message = error.message.orEmpty()
            assertTrue(message, message.contains("textBrand on $name is "))
            assertTrue(message, message.contains("dds_allow_contrast_text_brand"))
            // Declaring brand text as well lets it through, on whichever background it was.
            DdsBrand(light = colors.copy(allow = DdsContrastPair.entries.toSet()), dark = DdsBrand.Default.dark)
        }
    }

    @Test
    fun aPaperPageNeedsNoException() {
        val brand = DdsBrand(
            light = DdsBrand.Default.light.copy(bgDefault = paper, bgSubtle = paper),
            dark = DdsBrand.Default.dark,
        )
        assertEquals(emptySet<DdsContrastPair>(), brand.light.allow)
    }

    @Test
    fun aDarkBackgroundRejectionFirstSaysWhereToDefineTheDarkBackground() {
        val resources = listOf("dds_color_bg_default", "dds_color_bg_subtle", "dds_color_bg_elevated")
        for ((index, background) in backgrounds.withIndex()) {
            val (name, set) = background
            val hint = "A background set only in res/values is the dark page too; " +
                "the usual fix is to define ${resources[index]} in res/values-night. "
            // Body text on a light background that fell through into the dark theme.
            val body = assertThrows(IllegalArgumentException::class.java) {
                DdsBrand(light = DdsBrand.Default.light, dark = set(DdsBrand.Default.dark, paper))
            }.message.orEmpty()
            assertTrue(body, body.startsWith("DdsBrand (dark): textPrimary on $name is "))
            assertTrue(body, body.contains("below 4.5:1. $hint" + "To allow it in the dark theme, set <bool name=\"dds_allow_contrast_text_on_background\">"))
            assertTrue(body, body.endsWith("in res/values-night or pass allow = setOf(DdsContrastPair.TextOnBackground) to the dark DdsBrandColors."))
            // Brand text on the same background, once body text is declared.
            val brandText = assertThrows(IllegalArgumentException::class.java) {
                DdsBrand(
                    light = DdsBrand.Default.light,
                    dark = set(DdsBrand.Default.dark, paper).copy(allow = setOf(DdsContrastPair.TextOnBackground)),
                )
            }.message.orEmpty()
            assertTrue(brandText, brandText.startsWith("DdsBrand (dark): textBrand on $name is "))
            assertTrue(brandText, brandText.contains("below 4.5:1. $hint" + "To allow it in the dark theme, set <bool name=\"dds_allow_contrast_text_brand\">"))
            // The light theme reads res/values itself: nothing fell through, so no such advice.
            val light = assertThrows(IllegalArgumentException::class.java) {
                DdsBrand(light = set(DdsBrand.Default.light, nearBlack), dark = DdsBrand.Default.dark)
            }.message.orEmpty()
            assertTrue(light, !light.contains("is the dark page too"))
        }
        // Pairs that have no page, subtle or card background under them say nothing about one.
        val onBrand = assertThrows(IllegalArgumentException::class.java) {
            DdsBrand(light = DdsBrand.Default.light, dark = whiteOnOrange(DdsBrand.Default.dark))
        }.message.orEmpty()
        assertTrue(onBrand, !onBrand.contains("is the dark page too"))
        val onPale = assertThrows(IllegalArgumentException::class.java) {
            DdsBrand(light = DdsBrand.Default.light, dark = DdsBrand.Default.dark.copy(bgBrandSubtle = DdsBrand.Default.dark.textBrand))
        }.message.orEmpty()
        assertTrue(onPale, onPale.startsWith("DdsBrand (dark): textBrand on bgBrandSubtle is "))
        assertTrue(onPale, !onPale.contains("is the dark page too"))
    }

    @Test
    fun aProductBackgroundMustBeOpaque() {
        val fields = listOf("bgDefault", "bgSubtle", "bgElevated")
        for ((index, background) in backgrounds.withIndex()) {
            val set = background.second
            val light = assertThrows(IllegalArgumentException::class.java) {
                DdsBrand(light = set(DdsBrand.Default.light, paper.copy(alpha = 0.5f)), dark = DdsBrand.Default.dark)
            }.message.orEmpty()
            assertTrue(light, light.startsWith("DdsBrand (light): ${fields[index]} must be opaque"))
            assertTrue(light, light.contains("0.50"))
            val dark = assertThrows(IllegalArgumentException::class.java) {
                DdsBrand(light = DdsBrand.Default.light, dark = set(DdsBrand.Default.dark, Color.Black.copy(alpha = 0.99f)))
            }.message.orEmpty()
            assertTrue(dark, dark.startsWith("DdsBrand (dark): ${fields[index]} must be opaque"))
        }
    }

    @Test
    fun noExceptionLetsATranslucentBackgroundThrough() {
        val error = assertThrows(IllegalArgumentException::class.java) {
            DdsBrand(
                light = DdsBrand.Default.light.copy(bgDefault = paper.copy(alpha = 0.5f), allow = DdsContrastPair.entries.toSet()),
                dark = DdsBrand.Default.dark,
            )
        }
        assertTrue(error.message.orEmpty(), error.message.orEmpty().contains("bgDefault must be opaque"))
    }

    @Test
    fun anOpaqueOrUnspecifiedBackgroundIsNotHeldToTheOpaqueRule() {
        // Unspecified has no alpha of its own; it means the system's background, which is opaque.
        DdsBrand(DdsBrand.Default.light.withoutBackgrounds(), DdsBrand.Default.dark.withoutBackgrounds())
        DdsBrand(light = DdsBrand.Default.light.copy(bgDefault = paper.copy(alpha = 1f)), dark = DdsBrand.Default.dark)
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
