package kr.devslab.dds.compose.theme

import androidx.compose.material3.contentColorFor
import androidx.compose.ui.graphics.Color
import kr.devslab.dds.tokens.DdsDarkColors
import kr.devslab.dds.tokens.DdsLightColors
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ColorSchemeTest {
    private val light = ddsColors(dark = false, brand = DdsBrand.Default)
    private val dark = ddsColors(dark = true, brand = DdsBrand.Default)
    private val lightScheme = ddsColorScheme(light, false, inverseTextBrand = dark.textBrand)
    private val darkScheme = ddsColorScheme(dark, true, inverseTextBrand = light.textBrand)

    @Test
    fun primaryIsTheBrandTextColorNotTheBrandFill() {
        assertEquals(Color(DdsLightColors.textBrand), lightScheme.primary)
        assertEquals(Color(DdsDarkColors.textBrand), darkScheme.primary)
    }

    @Test
    fun theFilledBrandFaceDoesNotChangeWithTheTheme() {
        assertEquals(light.bgBrand, dark.bgBrand)
        assertEquals(light.textOnBrand, dark.textOnBrand)
    }

    @Test
    fun surfacesComeFromTheNeutralTokens() {
        val scheme = darkScheme
        assertEquals(Color(DdsDarkColors.bgDefault), scheme.background)
        assertEquals(Color(DdsDarkColors.bgDefault), scheme.surface)
        assertEquals(Color(DdsDarkColors.bgElevated), scheme.surfaceContainer)
        assertEquals(Color.Transparent, scheme.surfaceTint)
    }

    @Test
    fun errorIsTheDangerPair() {
        val scheme = lightScheme
        assertEquals(Color(DdsLightColors.statusDanger), scheme.error)
        assertEquals(Color(DdsLightColors.statusDangerBg), scheme.errorContainer)
        assertEquals(Color(DdsLightColors.statusDanger), scheme.onErrorContainer)
    }

    /** What a stock Material component would draw must stay readable in both themes. */
    @Test
    fun materialPairsReachTextContrast() {
        for ((scheme, name) in listOf(lightScheme to "light", darkScheme to "dark")) {
            val pairs = listOf(
                "onPrimary/primary" to (scheme.onPrimary to scheme.primary),
                "primary/surface" to (scheme.primary to scheme.surface),
                "onSurface/surface" to (scheme.onSurface to scheme.surface),
                "onSurfaceVariant/surface" to (scheme.onSurfaceVariant to scheme.surface),
                "onPrimaryContainer/primaryContainer" to (scheme.onPrimaryContainer to scheme.primaryContainer),
                "onError/error" to (scheme.onError to scheme.error),
                "inverseOnSurface/inverseSurface" to (scheme.inverseOnSurface to scheme.inverseSurface),
                "inversePrimary/inverseSurface" to (scheme.inversePrimary to scheme.inverseSurface),
            )
            for ((label, pair) in pairs) {
                val ratio = contrastRatio(pair.first, pair.second)
                assertTrue("$name $label is %.2f:1".format(ratio), ratio >= DdsMinTextContrast)
            }
        }
    }

    /**
     * The status pairs are mapped as the tokens define them, not adjusted here.
     * Two dark pairs in tokens/semantic.dark.json are below 4.5:1 today
     * (danger 3.62, info 4.07) — a token defect shared with the web, recorded
     * in docs/decisions.md D-048. This pins the floor they do reach (3:1, the
     * large-text and UI-element line) so they cannot get worse unnoticed;
     * raise it to [DdsMinTextContrast] when the tokens are fixed.
     */
    @Test
    fun statusPairsReachAtLeastTheUiElementLine() {
        for ((c, name) in listOf(light to "light", dark to "dark")) {
            val pairs = listOf(
                "success" to (c.statusSuccess to c.statusSuccessBg),
                "warning" to (c.statusWarning to c.statusWarningBg),
                "danger" to (c.statusDanger to c.statusDangerBg),
                "info" to (c.statusInfo to c.statusInfoBg),
            )
            for ((label, pair) in pairs) {
                val ratio = contrastRatio(pair.first, pair.second)
                assertTrue("$name $label is %.2f:1".format(ratio), ratio >= 3.0)
            }
        }
        for (c in listOf(light.statusSuccess to light.statusSuccessBg, light.statusDanger to light.statusDangerBg)) {
            assertTrue(contrastRatio(c.first, c.second) >= DdsMinTextContrast)
        }
    }

    /**
     * Material picks the text color for a Surface by matching its background to
     * a role. Every DDS surface must resolve to primary text — a card must not
     * silently get secondary text because two roles share a color.
     */
    @Test
    fun textOnEveryNeutralSurfaceIsPrimaryText() {
        for ((c, isDark) in listOf(light to false, dark to true)) {
            val scheme = if (isDark) darkScheme else lightScheme
            for (surface in listOf(c.bgDefault, c.bgElevated, c.bgSubtle)) {
                assertEquals(c.textPrimary, scheme.contentColorFor(surface))
            }
            assertEquals(c.textOnInverse, scheme.contentColorFor(c.bgInverse))
        }
    }

    /**
     * Every system color is the token of the same name, in the right theme. The
     * mapping is written by hand, so a swapped line (dark reading a light token,
     * muted reading secondary) would compile; this is what catches it.
     */
    @Test
    fun everySystemColorIsTheTokenOfTheSameName() {
        val brandSlice = setOf("bgBrand", "bgBrandHover", "bgBrandSubtle", "textOnBrand", "textBrand", "borderFocus")
        for ((colors, tokens) in listOf(light to DdsLightColors::class.java, dark to DdsDarkColors::class.java)) {
            var compared = 0
            for (field in tokens.declaredFields) {
                if (field.name == "INSTANCE" || field.name in brandSlice) continue
                val getter = DdsColors::class.java.getDeclaredMethod("get" + field.name.replaceFirstChar { it.uppercase() } + "-0d7_KjU")
                val actual = Color((getter.invoke(colors) as Long).toULong())
                assertEquals(field.name, Color(field.getLong(null)), actual)
                compared++
            }
            assertTrue(compared > 15)
        }
    }

    /** A token added to the generator must not be silently missing from the Compose surface. */
    @Test
    fun everySemanticColorTokenIsExposed() {
        val exposed = DdsColors::class.java.declaredFields.map { it.name }.toSet()
        val tokens = DdsLightColors::class.java.declaredFields.map { it.name }.filter { it != "INSTANCE" }
        assertTrue(tokens.isNotEmpty())
        for (token in tokens) assertTrue("DdsColors has no $token", token in exposed)
    }
}
