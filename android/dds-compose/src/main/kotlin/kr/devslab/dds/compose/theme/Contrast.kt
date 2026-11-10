package kr.devslab.dds.compose.theme

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.compositeOver
import androidx.compose.ui.graphics.luminance

/** The smallest contrast body text may have against what it sits on (WCAG AA). */
public const val DdsMinTextContrast: Double = 4.5

/**
 * WCAG contrast ratio between two colors, 1.0 (same) to 21.0 (black on white).
 * A translucent [foreground] is flattened onto [background] first.
 */
public fun contrastRatio(foreground: Color, background: Color): Double {
    val a = foreground.compositeOver(background).luminance().toDouble()
    val b = background.luminance().toDouble()
    return (maxOf(a, b) + 0.05) / (minOf(a, b) + 0.05)
}

/** Of [candidates], the one that reads best on [fill]. */
internal fun bestOn(fill: Color, candidates: List<Color>): Color =
    candidates.maxBy { contrastRatio(it, fill) }
