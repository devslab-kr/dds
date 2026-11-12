package kr.devslab.dds.compose.layout

import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.ProvidableCompositionLocal
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalWindowInfo
import kr.devslab.dds.compose.component.DdsNavItem

/**
 * What the screen frame tells the screens inside it: how wide the window is and which pieces
 * of the frame are showing.
 *
 * @property width the width class of the window.
 * @property rail true when navigation is a rail on the leading edge instead of tabs at the bottom.
 * @property listPinned true when the list pane stays beside the body instead of being a separate screen.
 * @property tallBar true when the top bar is the tall variant.
 */
@Immutable
public class DdsFrame(
    public val width: DdsWindowWidth,
    public val rail: Boolean = false,
    public val listPinned: Boolean = false,
    public val tallBar: Boolean = false,
) {
    override fun equals(other: Any?): Boolean =
        other is DdsFrame && width == other.width && rail == other.rail &&
            listPinned == other.listPinned && tallBar == other.tallBar

    override fun hashCode(): Int {
        var h = width.hashCode()
        h = 31 * h + rail.hashCode()
        h = 31 * h + listPinned.hashCode()
        h = 31 * h + tallBar.hashCode()
        return h
    }

    override fun toString(): String =
        "DdsFrame(width=$width, rail=$rail, listPinned=$listPinned, tallBar=$tallBar)"
}

/** The frame the current screen is inside, or null when there is none. */
public val LocalDdsFrame: ProvidableCompositionLocal<DdsFrame?> = compositionLocalOf { null }

/**
 * The frame report for the current screen. Inside a frame this is exactly what the frame
 * provided. Outside one it is a report with only the width, taken from the window.
 */
@Composable
public fun ddsFrame(): DdsFrame {
    LocalDdsFrame.current?.let { return it }
    val density = LocalDensity.current
    val widthDp = with(density) { LocalWindowInfo.current.containerSize.width.toDp() }
    return DdsFrame(width = ddsWindowWidth(widthDp))
}

/** The navigation the frame hands to its rail or bottom tabs. Not for apps to read. */
internal class FrameNav(
    val items: List<DdsNavItem>,
    val selectedIndex: Int,
    val onSelect: (Int) -> Unit,
)

internal val LocalFrameNav: ProvidableCompositionLocal<FrameNav?> = compositionLocalOf { null }
