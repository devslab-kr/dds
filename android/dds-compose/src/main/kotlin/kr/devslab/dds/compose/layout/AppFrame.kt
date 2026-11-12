package kr.devslab.dds.compose.layout

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.WindowInsetsSides
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.only
import androidx.compose.foundation.layout.union
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import kr.devslab.dds.compose.component.DdsNavItem
import kr.devslab.dds.compose.component.DdsNavRail
import kr.devslab.dds.compose.theme.DdsTheme
import kr.devslab.dds.tokens.DdsBorder
import kr.devslab.dds.tokens.DdsScreen

/**
 * The frame of an app: it sits once, outside the screen switcher, and draws what must not move
 * when a screen changes.
 *
 * What it draws depends on the width of the window it is given:
 * - narrow (under 600dp): nothing. Each top-level screen draws the bottom tabs itself, with
 *   [kr.devslab.dds.compose.component.DdsScaffold] and `bottomTabs = true`, so a detail screen
 *   can cover the tab row while it slides in.
 * - medium (600dp up): the navigation rail at the start edge.
 * - wide (840dp up): the rail, and when [list] is given, that list beside it, [DdsScreen.listPane]
 *   wide and followed by a hairline.
 *
 * [content] is the screen switcher. It is called from one fixed place, so what the screens hold
 * (saved state, scroll positions) survives the rail and the list appearing and disappearing when
 * the window changes width. Screens read what the frame drew with [ddsFrame].
 *
 * The frame keeps the screens clear of a display cutout at the sides: the rail takes the start
 * side, the content area the end side (both, when there is no rail and no list). The top and the
 * bottom are the screens' own: the top bar and the bottom tabs handle them.
 *
 * @param navItems the destinations, shown as the rail or as the screens' bottom tabs
 * @param selectedIndex the selected destination
 * @param onSelect called with the index of the destination the user picks
 * @param navigation false for a screen that has no menu at all (sign-in, a single-task screen):
 * nothing is drawn at any width and the content gets the whole window
 * @param barTitles the titles the top bars of the app's top-level screens can show, so the frame
 * can tell whether any of them needs the tall two-line bar at this width. Not used yet.
 * @param barActions how many action buttons the top bars have at most. Not used yet.
 * @param barReserve the width a screen's top bar keeps free for something of its own next to the
 * title, for a given title. Not used yet.
 * @param list the list that belongs to the area the current screen is in, or null when there is
 * none; it is pinned beside the content only on a wide window
 * @param content the screen switcher
 */
@Composable
public fun DdsAppFrame(
    navItems: List<DdsNavItem>,
    selectedIndex: Int,
    onSelect: (Int) -> Unit,
    modifier: Modifier = Modifier,
    navigation: Boolean = true,
    barTitles: List<String> = emptyList(),
    barActions: Int = 2,
    barReserve: (title: String) -> Dp = { 0.dp },
    list: (@Composable () -> Unit)? = null,
    content: @Composable () -> Unit,
) {
    val colors = DdsTheme.colors
    // The window width comes from the constraints, not from the window info, so it follows what
    // the frame is actually given (a split screen, a test that forces a size).
    BoxWithConstraints(modifier.fillMaxSize().background(colors.bgDefault)) {
        val width = ddsWindowWidth(maxWidth)
        val rail = navigation && width != DdsWindowWidth.Compact && navItems.isNotEmpty()
        val listPinned = navigation && width == DdsWindowWidth.Expanded && list != null
        val frame = DdsFrame(width = width, rail = rail, listPinned = listPinned, tallBar = false)
        val nav = remember(navItems, selectedIndex, onSelect) { FrameNav(navItems, selectedIndex, onSelect) }
        val start = WindowInsets.safeDrawing.only(WindowInsetsSides.Start)
        val end = WindowInsets.safeDrawing.only(WindowInsetsSides.End)
        CompositionLocalProvider(LocalDdsFrame provides frame, LocalFrameNav provides nav) {
            Row(Modifier.fillMaxSize()) {
                // The rail keeps itself clear of the start side. With no rail the list does, and
                // with neither the content does (below).
                if (rail) DdsNavRail(navItems, selectedIndex, onSelect)
                if (listPinned) {
                    Row(Modifier.fillMaxHeight().then(if (rail) Modifier else Modifier.windowInsetsPadding(start))) {
                        Box(Modifier.width(DdsScreen.listPane.dp).fillMaxHeight().testTag(DdsTestTags.ListPane)) {
                            list?.invoke()
                        }
                        Box(Modifier.fillMaxHeight().width(DdsBorder.hairline.dp).background(colors.borderDefault))
                    }
                }
                val contentInsets = if (rail || listPinned) end else start.union(end)
                Box(Modifier.weight(1f).fillMaxHeight().windowInsetsPadding(contentInsets)) { content() }
            }
        }
    }
}
