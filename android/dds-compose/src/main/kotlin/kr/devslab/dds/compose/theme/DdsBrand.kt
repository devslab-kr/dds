package kr.devslab.dds.compose.theme

import androidx.compose.runtime.Immutable
import androidx.compose.ui.graphics.Color
import kr.devslab.dds.tokens.DdsDarkColors
import kr.devslab.dds.tokens.DdsLightColors

/**
 * The six tokens a product may repaint — the same six the web `data-brand`
 * convention allows. Neutrals, status colors, type and spacing belong to the
 * system and cannot be replaced.
 *
 * @param bgBrand filled brand face (primary button)
 * @param bgBrandHover that face while pressed (there is no hover on touch)
 * @param bgBrandSubtle pale brand background (selected tab indicator)
 * @param textOnBrand text and icons on [bgBrand]
 * @param textBrand brand-colored text, links and selected icons on the page
 * @param borderFocus focus ring
 */
@Immutable
public data class DdsBrandColors(
    val bgBrand: Color,
    val bgBrandHover: Color,
    val bgBrandSubtle: Color,
    val textOnBrand: Color,
    val textBrand: Color,
    val borderFocus: Color,
)

/**
 * A product brand: one [DdsBrandColors] per theme.
 *
 * "On-brand" is a rule, not a color: text on a filled brand face must reach
 * [DdsMinTextContrast]. A bright face needs dark text, a dark face may take
 * white. A brand that breaks the rule is rejected here, where the product
 * defines it, instead of shipping an unreadable primary button.
 *
 * @throws IllegalArgumentException if [DdsBrandColors.textOnBrand] on
 * [DdsBrandColors.bgBrand] is below [DdsMinTextContrast] in either theme
 */
@Immutable
public class DdsBrand(public val light: DdsBrandColors, public val dark: DdsBrandColors) {
    init {
        requireOnBrandContrast("light", light)
        requireOnBrandContrast("dark", dark)
    }

    public companion object {
        /** The DevsLab corporate brand, straight from the tokens. */
        public val Default: DdsBrand = DdsBrand(
            light = DdsBrandColors(
                bgBrand = Color(DdsLightColors.bgBrand),
                bgBrandHover = Color(DdsLightColors.bgBrandHover),
                bgBrandSubtle = Color(DdsLightColors.bgBrandSubtle),
                textOnBrand = Color(DdsLightColors.textOnBrand),
                textBrand = Color(DdsLightColors.textBrand),
                borderFocus = Color(DdsLightColors.borderFocus),
            ),
            dark = DdsBrandColors(
                bgBrand = Color(DdsDarkColors.bgBrand),
                bgBrandHover = Color(DdsDarkColors.bgBrandHover),
                bgBrandSubtle = Color(DdsDarkColors.bgBrandSubtle),
                textOnBrand = Color(DdsDarkColors.textOnBrand),
                textBrand = Color(DdsDarkColors.textBrand),
                borderFocus = Color(DdsDarkColors.borderFocus),
            ),
        )
    }
}

private fun requireOnBrandContrast(theme: String, colors: DdsBrandColors) {
    val ratio = contrastRatio(colors.textOnBrand, colors.bgBrand)
    require(ratio >= DdsMinTextContrast) {
        "DdsBrand ($theme): textOnBrand on bgBrand is %.2f:1, below %.1f:1. ".format(ratio, DdsMinTextContrast) +
            "Use a darker or lighter textOnBrand for this fill."
    }
}
