package kr.devslab.dds.compose.theme

import androidx.compose.material3.ColorScheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import kr.devslab.dds.tokens.DdsDarkColors
import kr.devslab.dds.tokens.DdsLightColors

/**
 * Every semantic color token, resolved for the current theme and brand.
 * Property names are the token names (`color.bg.brand-subtle` → [bgBrandSubtle]).
 *
 * This is the only color surface app code should read. Material3 roles are
 * filled from it (see [ddsColorScheme]) so stock Material components match,
 * but Material has no role for a filled brand face, the status pairs, or the
 * press tint — read those here.
 */
@Immutable
public class DdsColors internal constructor(
    /** Screen background. */
    public val bgDefault: Color,
    /** Quiet grouping background (a flat card inside a sheet). */
    public val bgSubtle: Color,
    /** Cards, sheets, dialogs, menus. */
    public val bgElevated: Color,
    /** Filled brand face — the primary button. The same in light and dark. */
    public val bgBrand: Color,
    /** [bgBrand] while pressed. (The web calls it hover; touch has no hover.) */
    public val bgBrandHover: Color,
    /** Pale brand background — the selected tab indicator. */
    public val bgBrandSubtle: Color,
    /** A face that inverts the page (snackbar). */
    public val bgInverse: Color,
    public val textPrimary: Color,
    public val textSecondary: Color,
    /** Disabled text and placeholders. */
    public val textMuted: Color,
    /** Text and icons on [bgBrand]. */
    public val textOnBrand: Color,
    /** Text on a filled status face (a danger button). */
    public val textOnStatus: Color,
    /** Text on [bgInverse]. */
    public val textOnInverse: Color,
    /** Brand-colored text, links, selected icons on the page. */
    public val textBrand: Color,
    /** Card edges and dividers. */
    public val borderDefault: Color,
    /** Control edges (text fields, outlined buttons). */
    public val borderStrong: Color,
    /** Focus ring. */
    public val borderFocus: Color,
    public val statusSuccess: Color,
    public val statusSuccessBg: Color,
    public val statusWarning: Color,
    public val statusWarningBg: Color,
    public val statusDanger: Color,
    public val statusDangerBg: Color,
    public val statusInfo: Color,
    public val statusInfoBg: Color,
    /** Scrim behind sheets and dialogs. */
    public val overlayDim: Color,
    public val overlayHoverTint: Color,
    /** Press tint over a neutral surface. */
    public val overlayPressedTint: Color,
)

internal fun ddsColors(dark: Boolean, brand: DdsBrand): DdsColors =
    if (dark) {
        DdsColors(
            bgDefault = Color(DdsDarkColors.bgDefault),
            bgSubtle = Color(DdsDarkColors.bgSubtle),
            bgElevated = Color(DdsDarkColors.bgElevated),
            bgBrand = brand.dark.bgBrand,
            bgBrandHover = brand.dark.bgBrandHover,
            bgBrandSubtle = brand.dark.bgBrandSubtle,
            bgInverse = Color(DdsDarkColors.bgInverse),
            textPrimary = Color(DdsDarkColors.textPrimary),
            textSecondary = Color(DdsDarkColors.textSecondary),
            textMuted = Color(DdsDarkColors.textMuted),
            textOnBrand = brand.dark.textOnBrand,
            textOnStatus = Color(DdsDarkColors.textOnStatus),
            textOnInverse = Color(DdsDarkColors.textOnInverse),
            textBrand = brand.dark.textBrand,
            borderDefault = Color(DdsDarkColors.borderDefault),
            borderStrong = Color(DdsDarkColors.borderStrong),
            borderFocus = brand.dark.borderFocus,
            statusSuccess = Color(DdsDarkColors.statusSuccess),
            statusSuccessBg = Color(DdsDarkColors.statusSuccessBg),
            statusWarning = Color(DdsDarkColors.statusWarning),
            statusWarningBg = Color(DdsDarkColors.statusWarningBg),
            statusDanger = Color(DdsDarkColors.statusDanger),
            statusDangerBg = Color(DdsDarkColors.statusDangerBg),
            statusInfo = Color(DdsDarkColors.statusInfo),
            statusInfoBg = Color(DdsDarkColors.statusInfoBg),
            overlayDim = Color(DdsDarkColors.overlayDim),
            overlayHoverTint = Color(DdsDarkColors.overlayHoverTint),
            overlayPressedTint = Color(DdsDarkColors.overlayPressedTint),
        )
    } else {
        DdsColors(
            bgDefault = Color(DdsLightColors.bgDefault),
            bgSubtle = Color(DdsLightColors.bgSubtle),
            bgElevated = Color(DdsLightColors.bgElevated),
            bgBrand = brand.light.bgBrand,
            bgBrandHover = brand.light.bgBrandHover,
            bgBrandSubtle = brand.light.bgBrandSubtle,
            bgInverse = Color(DdsLightColors.bgInverse),
            textPrimary = Color(DdsLightColors.textPrimary),
            textSecondary = Color(DdsLightColors.textSecondary),
            textMuted = Color(DdsLightColors.textMuted),
            textOnBrand = brand.light.textOnBrand,
            textOnStatus = Color(DdsLightColors.textOnStatus),
            textOnInverse = Color(DdsLightColors.textOnInverse),
            textBrand = brand.light.textBrand,
            borderDefault = Color(DdsLightColors.borderDefault),
            borderStrong = Color(DdsLightColors.borderStrong),
            borderFocus = brand.light.borderFocus,
            statusSuccess = Color(DdsLightColors.statusSuccess),
            statusSuccessBg = Color(DdsLightColors.statusSuccessBg),
            statusWarning = Color(DdsLightColors.statusWarning),
            statusWarningBg = Color(DdsLightColors.statusWarningBg),
            statusDanger = Color(DdsLightColors.statusDanger),
            statusDangerBg = Color(DdsLightColors.statusDangerBg),
            statusInfo = Color(DdsLightColors.statusInfo),
            statusInfoBg = Color(DdsLightColors.statusInfoBg),
            overlayDim = Color(DdsLightColors.overlayDim),
            overlayHoverTint = Color(DdsLightColors.overlayHoverTint),
            overlayPressedTint = Color(DdsLightColors.overlayPressedTint),
        )
    }

/**
 * DDS semantic tokens → Material3 roles.
 *
 * Material's `primary` is both a fill and a text color; DDS splits those into
 * `bg.brand` and `text.brand`. `primary` takes the *text* one: that keeps
 * every stock Material component (text buttons, selected tabs, progress
 * indicators, links) above 4.5:1 on the page. The filled brand face is
 * [DdsColors.bgBrand], used directly by DDS components.
 *
 * `surfaceTint` is transparent: surfaces are told apart by a hairline, not by
 * a tonal wash of the brand color.
 */
internal fun ddsColorScheme(c: DdsColors, dark: Boolean): ColorScheme {
    val onPrimary = bestOn(c.textBrand, listOf(c.textOnStatus, c.textPrimary, c.textOnInverse))
    val base = if (dark) darkColorScheme() else lightColorScheme()
    return base.copy(
        primary = c.textBrand,
        onPrimary = onPrimary,
        primaryContainer = c.bgBrandSubtle,
        onPrimaryContainer = c.textBrand,
        inversePrimary = c.bgBrand,
        secondary = c.textSecondary,
        onSecondary = c.bgDefault,
        secondaryContainer = c.bgBrandSubtle,
        onSecondaryContainer = c.textBrand,
        tertiary = c.textBrand,
        onTertiary = onPrimary,
        tertiaryContainer = c.bgBrandSubtle,
        onTertiaryContainer = c.textBrand,
        background = c.bgDefault,
        onBackground = c.textPrimary,
        surface = c.bgDefault,
        onSurface = c.textPrimary,
        // Not bg.subtle: in dark that equals bg.elevated, and Material's
        // contentColorFor() checks surfaceVariant before the container roles — a
        // card on bg.elevated would then get secondary text. The hairline color is
        // a distinct neutral in both themes and suits what Material draws with
        // this role (inactive tracks).
        surfaceVariant = c.borderDefault,
        onSurfaceVariant = c.textSecondary,
        surfaceTint = Color.Transparent,
        inverseSurface = c.bgInverse,
        inverseOnSurface = c.textOnInverse,
        error = c.statusDanger,
        onError = c.textOnStatus,
        errorContainer = c.statusDangerBg,
        onErrorContainer = c.statusDanger,
        outline = c.borderStrong,
        outlineVariant = c.borderDefault,
        scrim = c.overlayDim,
        surfaceBright = c.bgDefault,
        surfaceDim = c.bgSubtle,
        surfaceContainerLowest = c.bgDefault,
        surfaceContainerLow = c.bgElevated,
        surfaceContainer = c.bgElevated,
        surfaceContainerHigh = c.bgElevated,
        surfaceContainerHighest = c.bgSubtle,
    )
}

internal val LocalDdsColors = staticCompositionLocalOf<DdsColors> {
    error("DdsTheme is missing: wrap the content in DdsTheme { }")
}
