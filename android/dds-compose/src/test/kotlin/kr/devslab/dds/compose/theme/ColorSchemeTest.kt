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
     * Each is text on its own pale background, so each has to clear the text
     * line in both themes. Two dark pairs did not before D-049 (danger 3.62,
     * info 4.07).
     */
    @Test
    fun statusPairsClearTheTextLine() {
        for ((c, name) in listOf(light to "light", dark to "dark")) {
            val pairs = listOf(
                "success" to (c.statusSuccess to c.statusSuccessBg),
                "warning" to (c.statusWarning to c.statusWarningBg),
                "danger" to (c.statusDanger to c.statusDangerBg),
                "info" to (c.statusInfo to c.statusInfoBg),
            )
            for ((label, pair) in pairs) {
                val ratio = contrastRatio(pair.first, pair.second)
                assertTrue("$name $label is %.2f:1".format(ratio), ratio >= DdsMinTextContrast)
            }
        }
    }
}
