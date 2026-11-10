package kr.devslab.dds.compose.theme

import android.content.Context
import android.content.res.Configuration
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.remember
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import java.util.Locale
import kr.devslab.dds.tokens.DdsDarkColors
import kr.devslab.dds.tokens.DdsLightColors
import kr.devslab.dds.tokens.R as TokensR

/**
 * The brand slice: the six tokens a product may repaint — the same six, by
 * the same names, as the web `data-brand` convention (design-system §3.1,
 * D-012). Neutrals, status colors, type, spacing, radii and motion belong to
 * the system and cannot be replaced.
 *
 * A product names its own values; DDS does not derive them from one color.
 * Two have a default because a DDS rule already decides them:
 *
 * @param bgBrand the product's main color — the filled brand face (primary button)
 * @param bgBrandHover that face while pressed (the web's hover; touch has none)
 * @param bgBrandSubtle pale brand background (the selected tab's pill)
 * @param textBrand brand-colored text, links and selected icons on the page
 * @param textOnBrand text and icons on [bgBrand]. Defaults to the on-brand
 * rule: whichever of the system's dark text and white reads better on the fill
 * @param borderFocus focus ring. Defaults to the system's neutral ring
 */
@Immutable
public data class DdsBrandColors(
    val bgBrand: Color,
    val bgBrandHover: Color,
    val bgBrandSubtle: Color,
    val textBrand: Color,
    val textOnBrand: Color = onBrandFor(bgBrand),
    val borderFocus: Color = Color.Unspecified,
)

/**
 * The on-brand rule as a function: of the two colors the system puts on a
 * filled face — its dark text and white — the one with more contrast on [fill].
 * A bright fill gets dark text, a dark fill gets white.
 */
public fun onBrandFor(fill: Color): Color =
    bestOn(fill, listOf(Color(DdsLightColors.textOnBrand), Color(DdsLightColors.textOnStatus)))

/**
 * A product brand: one [DdsBrandColors] per theme.
 *
 * There are two ways to supply one, and they give the same result:
 *
 * 1. **Resources (recommended).** Redefine the six `dds_color_*` brand colors
 *    in the app's own `res/values` and `res/values-night`. The splash theme,
 *    every XML drawable and — through [DdsTheme]'s default — Compose all pick
 *    them up from that one place.
 * 2. **Code.** Pass a [DdsBrand] to [DdsTheme]. XML resources are then not
 *    affected, so the splash would still show the default brand.
 *
 * "On-brand" is a rule, not a color: text on a filled brand face must reach
 * [DdsMinTextContrast]. A brand that breaks it is rejected here, where the
 * product defines it, instead of shipping an unreadable primary button.
 *
 * The same goes for brand text: [DdsBrandColors.textBrand] is what Material
 * components draw text buttons, links and selected tabs with, so it must read
 * on the page and on the pale brand background.
 *
 * @throws IllegalArgumentException if, in either theme, [DdsBrandColors.textOnBrand]
 * on [DdsBrandColors.bgBrand], or [DdsBrandColors.textBrand] on the page background
 * or on [DdsBrandColors.bgBrandSubtle], is below [DdsMinTextContrast]
 */
@Immutable
public class DdsBrand(public val light: DdsBrandColors, public val dark: DdsBrandColors) {
    init {
        requireBrandContrast("light", light, pageBackground = Color(DdsLightColors.bgDefault))
        requireBrandContrast("dark", dark, pageBackground = Color(DdsDarkColors.bgDefault))
    }

    override fun equals(other: Any?): Boolean = other is DdsBrand && light == other.light && dark == other.dark

    override fun hashCode(): Int = 31 * light.hashCode() + dark.hashCode()

    public companion object {
        /** The DevsLab corporate brand, straight from the tokens. */
        public val Default: DdsBrand = DdsBrand(
            light = DdsBrandColors(
                bgBrand = Color(DdsLightColors.bgBrand),
                bgBrandHover = Color(DdsLightColors.bgBrandHover),
                bgBrandSubtle = Color(DdsLightColors.bgBrandSubtle),
                textBrand = Color(DdsLightColors.textBrand),
                textOnBrand = Color(DdsLightColors.textOnBrand),
                borderFocus = Color(DdsLightColors.borderFocus),
            ),
            dark = DdsBrandColors(
                bgBrand = Color(DdsDarkColors.bgBrand),
                bgBrandHover = Color(DdsDarkColors.bgBrandHover),
                bgBrandSubtle = Color(DdsDarkColors.bgBrandSubtle),
                textBrand = Color(DdsDarkColors.textBrand),
                textOnBrand = Color(DdsDarkColors.textOnBrand),
                borderFocus = Color(DdsDarkColors.borderFocus),
            ),
        )

        /**
         * Reads the brand from the six `dds_color_*` brand resources, for both
         * themes at once — whatever the system setting is — so an app that
         * pins its own theme still gets the right half.
         *
         * Without overrides this equals [Default].
         */
        public fun fromResources(context: Context): DdsBrand =
            DdsBrand(light = readBrand(context, night = false), dark = readBrand(context, night = true))
    }
}

/** [DdsBrand.fromResources], remembered across recompositions. */
@Composable
public fun rememberDdsBrand(): DdsBrand {
    val context = LocalContext.current
    val configuration = LocalConfiguration.current
    return remember(context, configuration) { DdsBrand.fromResources(context) }
}

private fun readBrand(context: Context, night: Boolean): DdsBrandColors {
    val configuration = Configuration(context.resources.configuration).apply {
        val mode = if (night) Configuration.UI_MODE_NIGHT_YES else Configuration.UI_MODE_NIGHT_NO
        uiMode = (uiMode and Configuration.UI_MODE_NIGHT_MASK.inv()) or mode
    }
    val themed = context.createConfigurationContext(configuration)
    fun color(id: Int) = Color(themed.getColor(id))
    return DdsBrandColors(
        bgBrand = color(TokensR.color.dds_color_bg_brand),
        bgBrandHover = color(TokensR.color.dds_color_bg_brand_hover),
        bgBrandSubtle = color(TokensR.color.dds_color_bg_brand_subtle),
        textBrand = color(TokensR.color.dds_color_text_brand),
        textOnBrand = color(TokensR.color.dds_color_text_on_brand),
        borderFocus = color(TokensR.color.dds_color_border_focus),
    )
}

private fun requireBrandContrast(theme: String, colors: DdsBrandColors, pageBackground: Color) {
    val pairs = listOf(
        Triple("textOnBrand on bgBrand", colors.textOnBrand, colors.bgBrand),
        Triple("textBrand on the page background", colors.textBrand, pageBackground),
        Triple("textBrand on bgBrandSubtle", colors.textBrand, colors.bgBrandSubtle),
    )
    for ((name, foreground, fill) in pairs) {
        val ratio = contrastRatio(foreground, fill)
        require(ratio >= DdsMinTextContrast) {
            // Locale.ROOT: this is a message for developers, the same on every machine.
            String.format(Locale.ROOT, "DdsBrand (%s): %s is %.2f:1, below %.1f:1.", theme, name, ratio, DdsMinTextContrast)
        }
    }
}
