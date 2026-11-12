package kr.devslab.dds.compose.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.LocalMinimumInteractiveComponentSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.remember
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.unit.dp
import kr.devslab.dds.tokens.DdsTouch

/**
 * The DDS theme for Compose.
 *
 * Sets up Material3 (colors, type, shapes) from the DDS tokens, so stock
 * Material components already look right, and exposes what Material has no
 * slot for through [DdsTheme].
 *
 * Dark mode is a different mapping of the same tokens — components never
 * branch on [darkTheme].
 *
 * @param darkTheme defaults to the system setting
 * @param brand the product brand slice. By default it is read from the
 * `dds_color_*` brand resources, so an app that redefines those six colors —
 * and, if it has its own, the page, subtle and card backgrounds — in its own
 * `res/values` rebrands XML and Compose together; with no override that is
 * DevsLab cyan on the system's backgrounds
 * @param largeText the app-offered large text mode: a stepped-up type scale
 * and a larger minimum touch target. It stacks with the system font scale.
 */
@Composable
public fun DdsTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    brand: DdsBrand = rememberDdsBrand(),
    largeText: Boolean = false,
    content: @Composable () -> Unit,
) {
    val colors = remember(darkTheme, brand) { ddsColors(darkTheme, brand) }
    val typography = remember(largeText) { ddsTypography(largeText) }
    val colorScheme = remember(colors, darkTheme, brand) {
        ddsColorScheme(colors, darkTheme, inverseTextBrand = (if (darkTheme) brand.light else brand.dark).textBrand)
    }
    val materialTypography = remember(typography) { materialTypography(typography) }
    val touch = (if (largeText) DdsTouch.large else DdsTouch.min).dp

    CompositionLocalProvider(
        LocalDdsColors provides colors,
        LocalDdsTypography provides typography,
        LocalDdsLargeText provides largeText,
        LocalMinimumInteractiveComponentSize provides touch,
    ) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = materialTypography,
            shapes = DdsShapes,
            content = content,
        )
    }
}

/** Reads the current DDS theme, the way `MaterialTheme` reads Material's. */
public object DdsTheme {
    /** Semantic colors for the current theme and brand. */
    public val colors: DdsColors
        @Composable @ReadOnlyComposable get() = LocalDdsColors.current

    /** The DDS type scale (stepped up in large text mode). */
    public val typography: DdsTypography
        @Composable @ReadOnlyComposable get() = LocalDdsTypography.current

    /** Whether the app-offered large text mode is on. */
    public val largeText: Boolean
        @Composable @ReadOnlyComposable get() = LocalDdsLargeText.current
}

internal val LocalDdsLargeText = staticCompositionLocalOf { false }
