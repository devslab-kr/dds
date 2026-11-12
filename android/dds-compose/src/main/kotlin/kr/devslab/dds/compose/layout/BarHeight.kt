package kr.devslab.dds.compose.layout

import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import kr.devslab.dds.compose.theme.DdsTheme
import kr.devslab.dds.tokens.DdsBar
import kr.devslab.dds.tokens.DdsScreen
import kr.devslab.dds.tokens.DdsSpace
import kr.devslab.dds.tokens.DdsTouch

/** The room before a bar's title: the arrow or the mark and the gap after it. */
internal val BarTitleStart: Dp = DdsSpace.s40.dp

/**
 * Whether any of [titles] needs two lines in a top bar at the current text size, so the whole
 * window should use the tall bar.
 *
 * A title can use `min(areaWidth, columnMax)`, less a gutter on each side, less the room for the
 * arrow or mark before it (40dp), less 48dp for each of [actions], less what [reserve] says for
 * that title. It is measured in the bar's title style at the current font scale.
 *
 * The gutter is the window's: inside a frame it is the frame's, outside one it comes from the window.
 *
 * @param areaWidth the width the screen gets: the window minus the rail and a pinned list
 * @param titles the names the app's top bars can show
 * @param actions the most icon buttons a bar has at its end
 * @param reserve the width a bar keeps free next to a given title for something of its own
 * @param columnMax the widest the body column gets, the same value the bars are given
 */
@Composable
public fun ddsBarNeedsTwoLines(
    areaWidth: Dp,
    titles: List<String>,
    actions: Int = 2,
    reserve: (title: String) -> Dp = { 0.dp },
    columnMax: Dp = DdsScreen.bodyMax.dp,
): Boolean = barNeedsTwoLines(ddsFrame().width.gutter, areaWidth, titles, actions, reserve, columnMax)

/**
 * The least height of every top bar in the window. The short bar is [DdsBar.top]. The tall bar is
 * [DdsBar.topTall], or two lines of the title style plus a margin when the font is so large that
 * two lines do not fit in that, so every bar in the window gets the same height whatever its title.
 */
@Composable
internal fun barMinHeight(tall: Boolean): Dp {
    if (!tall) return DdsBar.top.dp
    val lineHeight = DdsTheme.typography.title2.lineHeight
    val twoLines = if (lineHeight.isSp) with(LocalDensity.current) { lineHeight.toDp() } * 2 else 0.dp
    return maxOf(DdsBar.topTall.dp, twoLines + DdsSpace.s12.dp * 2)
}

/** The same decision with the window's [gutter] given, for the frame, which has not provided itself yet. */
@Composable
internal fun barNeedsTwoLines(
    gutter: Dp,
    areaWidth: Dp,
    titles: List<String>,
    actions: Int,
    reserve: (title: String) -> Dp,
    columnMax: Dp,
): Boolean {
    val measurer = rememberTextMeasurer()
    val style = DdsTheme.typography.title2
    val density = LocalDensity.current
    val column = minOf(areaWidth, columnMax)
    return titles.any { title ->
        val room = column - gutter * 2 - BarTitleStart - DdsTouch.min.dp * actions - reserve(title)
        // Laid out on one unbroken line, so its width is how much room the title wants.
        val wanted = measurer.measure(title, style, softWrap = false, maxLines = 1).size.width
        wanted > with(density) { room.toPx() }
    }
}
