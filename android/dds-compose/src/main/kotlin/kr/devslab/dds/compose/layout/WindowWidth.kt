package kr.devslab.dds.compose.layout

import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import kr.devslab.dds.tokens.DdsScreen

/** The three widths a window can have. Compact is a phone, Medium a small tablet, Expanded a large one. */
public enum class DdsWindowWidth { Compact, Medium, Expanded }

/** Which of the three widths [width] falls in. 600 dp is the first Medium, 840 dp the first Expanded. */
public fun ddsWindowWidth(width: Dp): DdsWindowWidth = when {
    width >= DdsScreen.breakpointExpanded.dp -> DdsWindowWidth.Expanded
    width >= DdsScreen.breakpoint.dp -> DdsWindowWidth.Medium
    else -> DdsWindowWidth.Compact
}

/** The side margin of screen content at this width: narrower on a phone, wider on anything bigger. */
public val DdsWindowWidth.gutter: Dp
    get() = when (this) {
        DdsWindowWidth.Compact -> DdsScreen.gutter.dp
        DdsWindowWidth.Medium, DdsWindowWidth.Expanded -> DdsScreen.gutterWide.dp
    }
