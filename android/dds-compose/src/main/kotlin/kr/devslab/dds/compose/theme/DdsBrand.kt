package kr.devslab.dds.compose.theme

import android.content.Context
import android.content.res.Configuration
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.remember
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.isUnspecified
import androidx.compose.ui.graphics.takeOrElse
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import java.util.Locale
import kr.devslab.dds.compose.R as ComposeR
import kr.devslab.dds.tokens.DdsDarkColors
import kr.devslab.dds.tokens.DdsLightColors
import kr.devslab.dds.tokens.R as TokensR

/**
 * What a product may repaint: the six brand tokens — the same six, by the same
 * names, as the web `data-brand` convention (design-system §3.1, D-012) — and
 * three backgrounds: the page, the subtle background and the card background
 * (D-053). The other neutrals (text, borders, overlays), status colors, type,
 * spacing, radii and motion belong to the system and cannot be replaced.
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
 * @param bgDefault the page background, opaque. [Color.Unspecified], the
 * default, means the system's value for this theme
 * @param bgSubtle the quiet grouping background, opaque. [Color.Unspecified]
 * means the system's
 * @param bgElevated the background of cards, sheets, dialogs and menus, opaque.
 * [Color.Unspecified] means the system's
 * @param allow the contrast pairs this product lets through in this theme even
 * though they are below [DdsMinTextContrast]. Empty by default: every pair is
 * checked. A pair named here is not checked at all — there is no lower limit —
 * and it counts for this theme only; the other theme's colors carry their own set
 */
@Immutable
public data class DdsBrandColors(
    val bgBrand: Color,
    val bgBrandHover: Color,
    val bgBrandSubtle: Color,
    val textBrand: Color,
    val textOnBrand: Color = onBrandFor(bgBrand),
    val borderFocus: Color = Color.Unspecified,
    val bgDefault: Color = Color.Unspecified,
    val bgSubtle: Color = Color.Unspecified,
    val bgElevated: Color = Color.Unspecified,
    val allow: Set<DdsContrastPair> = emptySet(),
)

/**
 * The text-on-background pairs [DdsBrand] checks against [DdsMinTextContrast].
 *
 * A product that wants one of them below that line says so by name, in
 * [DdsBrandColors.allow] or with the matching `dds_allow_contrast_*` bool
 * resource. Only the named pair is let through; the others are still checked.
 */
public enum class DdsContrastPair {
    /** [DdsBrandColors.textOnBrand] on [DdsBrandColors.bgBrand] — the primary button's label. */
    TextOnBrand,

    /**
     * [DdsBrandColors.textBrand] on the page background, the subtle background,
     * the card background and [DdsBrandColors.bgBrandSubtle] — text buttons,
     * links, selected tabs.
     */
    TextBrand,

    /**
     * The system's body text and secondary text on the page background, the
     * subtle background and the card background. The text colors are the
     * system's, so this pair can only fail when a product repaints a background.
     */
    TextOnBackground,
}

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
 *    — and, if the product has its own, `dds_color_bg_default`,
 *    `dds_color_bg_subtle` and `dds_color_bg_elevated` — in the app's own
 *    `res/values` and `res/values-night`. The splash theme, every XML drawable
 *    and — through [DdsTheme]'s default — Compose all pick them up from that
 *    one place.
 * 2. **Code.** Pass a [DdsBrand] to [DdsTheme]. XML resources are then not
 *    affected, so the splash would still show the default brand and the
 *    default page background.
 *
 * "On-brand" is a rule, not a color: text on a filled brand face must reach
 * [DdsMinTextContrast]. A brand that breaks it is rejected here, where the
 * product defines it, instead of shipping an unreadable primary button.
 *
 * The same goes for brand text: [DdsBrandColors.textBrand] is what Material
 * components draw text buttons, links and selected tabs with, so it must read
 * on the page, the subtle background, the card background and the pale brand
 * background.
 *
 * And for the backgrounds a product repaints: the system's body text and
 * secondary text must read on the page, the subtle background and the card
 * background. A background left [Color.Unspecified] is the system's, which
 * passes. The edge of a control (3:1, D-050) is not checked here; a product
 * that moves a background far from the system's checks that itself.
 *
 * A background a product names must be opaque. Contrast is measured against
 * the color as given, and what shows through a translucent one is not known
 * here. No exception covers this.
 *
 * A product may declare an exception, pair by pair ([DdsContrastPair]) and
 * theme by theme: a pair named in a theme's [DdsBrandColors.allow] is not
 * checked in that theme, however low its contrast. Nothing is let through
 * unless it is named, and an exception declared for the light theme does not
 * cover the dark one. The rejection message says what to declare.
 *
 * @throws IllegalArgumentException if, in either theme, one of the pairs of
 * [DdsContrastPair] is below [DdsMinTextContrast] and that theme's
 * [DdsBrandColors.allow] does not name the pair, or if a background a product
 * names is not opaque
 */
@Immutable
public class DdsBrand(public val light: DdsBrandColors, public val dark: DdsBrandColors) {
    init {
        requireBrandContrast(light, night = false)
        requireBrandContrast(dark, night = true)
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
                bgDefault = Color(DdsLightColors.bgDefault),
                bgSubtle = Color(DdsLightColors.bgSubtle),
                bgElevated = Color(DdsLightColors.bgElevated),
            ),
            dark = DdsBrandColors(
                bgBrand = Color(DdsDarkColors.bgBrand),
                bgBrandHover = Color(DdsDarkColors.bgBrandHover),
                bgBrandSubtle = Color(DdsDarkColors.bgBrandSubtle),
                textBrand = Color(DdsDarkColors.textBrand),
                textOnBrand = Color(DdsDarkColors.textOnBrand),
                borderFocus = Color(DdsDarkColors.borderFocus),
                bgDefault = Color(DdsDarkColors.bgDefault),
                bgSubtle = Color(DdsDarkColors.bgSubtle),
                bgElevated = Color(DdsDarkColors.bgElevated),
            ),
        )

        /**
         * Reads the brand from the six `dds_color_*` brand resources and the
         * three backgrounds (`dds_color_bg_default`, `dds_color_bg_subtle`,
         * `dds_color_bg_elevated`), for both themes at once — whatever the
         * system setting is — so an app that pins its own theme still gets the
         * right half.
         *
         * The contrast exceptions are read from the same place. The bools
         * `dds_allow_contrast_text_on_brand`, `dds_allow_contrast_text_brand`
         * and `dds_allow_contrast_text_on_background` (all `false` in DDS)
         * become each theme's [DdsBrandColors.allow]: the light theme reads
         * `res/values`, the dark theme `res/values-night`.
         *
         * Android falls back from `values-night` to `values`, for these bools
         * just as for the colors. A bool set to `true` only in `res/values`
         * therefore applies to the dark theme too; to keep the dark theme
         * checked, set it back to `false` in `res/values-night`.
         *
         * Without overrides this equals [Default].
         *
         * The colors fall back the same way: a background set only in
         * `res/values` is the dark theme's background too. A light page there
         * fails the dark theme's text check; give the dark theme its own
         * `dds_color_bg_*` in `res/values-night`.
         *
         * @throws IllegalArgumentException as [DdsBrand] does, if the colors
         * break a contrast rule and the bools do not declare that pair, or if
         * a background is not opaque
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
        bgDefault = color(TokensR.color.dds_color_bg_default),
        bgSubtle = color(TokensR.color.dds_color_bg_subtle),
        bgElevated = color(TokensR.color.dds_color_bg_elevated),
        allow = DdsContrastPair.entries.filter { themed.resources.getBoolean(it.allowResource) }.toSet(),
    )
}

/** The bool resource an app sets to `true` to declare this pair's exception. */
internal val DdsContrastPair.allowResource: Int
    get() = when (this) {
        DdsContrastPair.TextOnBrand -> ComposeR.bool.dds_allow_contrast_text_on_brand
        DdsContrastPair.TextBrand -> ComposeR.bool.dds_allow_contrast_text_brand
        DdsContrastPair.TextOnBackground -> ComposeR.bool.dds_allow_contrast_text_on_background
    }

/**
 * That resource's name, as an app writes it and as the rejection message prints
 * it. The message is built without a [Context], so the name is written out here;
 * a device test holds it to [allowResource].
 */
internal val DdsContrastPair.allowResourceName: String
    get() = when (this) {
        DdsContrastPair.TextOnBrand -> "dds_allow_contrast_text_on_brand"
        DdsContrastPair.TextBrand -> "dds_allow_contrast_text_brand"
        DdsContrastPair.TextOnBackground -> "dds_allow_contrast_text_on_background"
    }

/**
 * One measurement: [foreground] on [fill], part of [pair], called [name] in the
 * message. [fillResource] is the color resource behind [fill] when it is one of
 * the three backgrounds a product may set, else null.
 */
private class ContrastCheck(
    val pair: DdsContrastPair,
    val name: String,
    val foreground: Color,
    val fill: Color,
    val fillResource: String? = null,
)

/** One of the three backgrounds a product may set, as the checks and their messages see it. */
private class ProductBackground(val field: String, val name: String, val resource: String, val given: Color, val resolved: Color)

/** The page background of [colors] in that theme: the product's if it named one, else the system's. */
internal fun pageBackground(colors: DdsBrandColors, night: Boolean): Color =
    colors.bgDefault.takeOrElse { Color(if (night) DdsDarkColors.bgDefault else DdsLightColors.bgDefault) }

/** The subtle background of [colors] in that theme: the product's if it named one, else the system's. */
internal fun subtleBackground(colors: DdsBrandColors, night: Boolean): Color =
    colors.bgSubtle.takeOrElse { Color(if (night) DdsDarkColors.bgSubtle else DdsLightColors.bgSubtle) }

/** The card background of [colors] in that theme: the product's if it named one, else the system's. */
internal fun cardBackground(colors: DdsBrandColors, night: Boolean): Color =
    colors.bgElevated.takeOrElse { Color(if (night) DdsDarkColors.bgElevated else DdsLightColors.bgElevated) }

private fun requireBrandContrast(colors: DdsBrandColors, night: Boolean) {
    val theme = if (night) "dark" else "light"
    val backgrounds = listOf(
        ProductBackground("bgDefault", "the page background (bgDefault)", "dds_color_bg_default", colors.bgDefault, pageBackground(colors, night)),
        ProductBackground("bgSubtle", "the subtle background (bgSubtle)", "dds_color_bg_subtle", colors.bgSubtle, subtleBackground(colors, night)),
        ProductBackground("bgElevated", "the card background (bgElevated)", "dds_color_bg_elevated", colors.bgElevated, cardBackground(colors, night)),
    )
    for (background in backgrounds) {
        // Unspecified is the system's background, which is opaque; its own alpha means nothing.
        require(background.given.isUnspecified || background.given.alpha == 1f) {
            val alpha = String.format(Locale.ROOT, "%.2f", background.given.alpha)
            "DdsBrand ($theme): ${background.field} must be opaque (alpha is $alpha, from ${background.resource} or the $theme DdsBrandColors). " +
                "Text contrast cannot be measured on a translucent background, and no exception covers it."
        }
    }
    // Body and secondary text are the system's; only the background under them can be a product's.
    val textPrimary = Color(if (night) DdsDarkColors.textPrimary else DdsLightColors.textPrimary)
    val textSecondary = Color(if (night) DdsDarkColors.textSecondary else DdsLightColors.textSecondary)
    val checks = buildList {
        add(ContrastCheck(DdsContrastPair.TextOnBrand, "textOnBrand on bgBrand", colors.textOnBrand, colors.bgBrand))
        for (background in backgrounds) {
            val (name, fill, resource) = Triple(background.name, background.resolved, background.resource)
            add(ContrastCheck(DdsContrastPair.TextOnBackground, "textPrimary on $name", textPrimary, fill, resource))
            add(ContrastCheck(DdsContrastPair.TextOnBackground, "textSecondary on $name", textSecondary, fill, resource))
        }
        for (background in backgrounds) {
            add(ContrastCheck(DdsContrastPair.TextBrand, "textBrand on ${background.name}", colors.textBrand, background.resolved, background.resource))
        }
        add(ContrastCheck(DdsContrastPair.TextBrand, "textBrand on bgBrandSubtle", colors.textBrand, colors.bgBrandSubtle))
    }
    for (check in checks) {
        // A declared pair is not measured: the product has taken that decision, for this theme.
        if (check.pair in colors.allow) continue
        val ratio = contrastRatio(check.foreground, check.fill)
        require(ratio >= DdsMinTextContrast) {
            // Locale.ROOT: this is a message for developers, the same on every machine.
            val measured = String.format(Locale.ROOT, "%.2f:1, below %.1f:1", ratio, DdsMinTextContrast)
            // Android falls back from values-night to values, so a bool in the light folder speaks for both.
            val folder = if (night) {
                "res/values-night"
            } else {
                "res/values (a bool set there also covers the dark theme unless res/values-night sets it to false)"
            }
            // The colors fall back the same way, and that is the usual cause in the dark theme:
            // a light page set once in res/values, under the dark theme's light text.
            val fallback = if (night && check.fillResource != null) {
                "A background set only in res/values is the dark page too; " +
                    "the usual fix is to define ${check.fillResource} in res/values-night. "
            } else {
                ""
            }
            "DdsBrand ($theme): ${check.name} is $measured. " + fallback +
                "To allow it in the $theme theme, set <bool name=\"${check.pair.allowResourceName}\">true</bool> " +
                "in $folder or pass allow = setOf(DdsContrastPair.${check.pair.name}) to the $theme DdsBrandColors."
        }
    }
}
