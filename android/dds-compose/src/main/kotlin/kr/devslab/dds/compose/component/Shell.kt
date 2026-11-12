package kr.devslab.dds.compose.component

import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.NavigationRail
import androidx.compose.material3.NavigationRailDefaults
import androidx.compose.material3.NavigationRailItem
import androidx.compose.material3.NavigationRailItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.foundation.layout.widthIn
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.layoutId
import androidx.compose.ui.unit.Constraints
import kr.devslab.dds.compose.layout.BarTitleStart
import kr.devslab.dds.compose.layout.barMinHeight
import androidx.compose.ui.res.stringResource
import kr.devslab.dds.compose.icons.DdsIcons
import kr.devslab.dds.tokens.DdsIcon as DdsIconSize
import kr.devslab.dds.tokens.DdsTouch
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.text.font.FontWeight
import kr.devslab.dds.compose.R
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import kr.devslab.dds.compose.icons.DdsIcon
import kr.devslab.dds.compose.layout.DdsTestTags
import kr.devslab.dds.compose.layout.DdsWindowWidth
import kr.devslab.dds.compose.layout.LocalFrameNav
import kr.devslab.dds.compose.layout.ddsFrame
import kr.devslab.dds.compose.layout.gutter
import kr.devslab.dds.compose.theme.DdsTheme
import kr.devslab.dds.tokens.DdsBar
import kr.devslab.dds.tokens.DdsBorder
import kr.devslab.dds.tokens.DdsScreen
import kr.devslab.dds.tokens.DdsSpace

/**
 * The bar at the top of a screen. It shares the page background and is set
 * apart by a hairline — no shadow, no tint. It does not move when a screen
 * changes; only the content below it slides. Where the host fades between two
 * screens, a bar that is the same on both shows no change, and a title that
 * differs fades to the new one.
 *
 * The content sits on the same lines as the body column ([kr.devslab.dds.compose.layout.DdsBodyColumn]):
 * it is centered in the area, no wider than [columnMax], and keeps the window's gutter from each
 * edge. The back arrow's glyph starts on the text line and the last icon's glyph ends on the end
 * line, so their 48dp touch areas reach 12dp into the gutter. The title starts 40dp after the
 * text line whether an arrow or a mark comes before it, so it does not move when a screen opens a
 * detail; with neither it starts on the line itself. The hairline and the background span the
 * whole area.
 *
 * When the frame says the bar is tall ([kr.devslab.dds.compose.layout.DdsFrame.tallBar]) the bar is
 * [DdsBar.topTall] high and the title takes two lines; otherwise it is [DdsBar.top] high on one.
 *
 * @param leading drawn before the title, at least 28dp wide: the app mark on a top-level screen.
 * A wider one (a button) still works; the title moves over. Not drawn when [onBack] is set.
 * @param onBack goes back; when set, the bar draws the back arrow itself, aligned to the lines
 * @param backEnabled false greys the arrow out while going back is not allowed
 * @param backDescription what a screen reader says for the arrow
 * @param columnMax the widest the content gets; pass the same value the screen's body column has
 * @param actions drawn at the end: icon buttons. A text button at the end needs the app to leave
 * 12dp after it, since only an icon button's glyph is inset from its touch area.
 */
@Composable
public fun DdsTopBar(
    title: String,
    modifier: Modifier = Modifier,
    leading: (@Composable () -> Unit)? = null,
    onBack: (() -> Unit)? = null,
    backEnabled: Boolean = true,
    backDescription: String = stringResource(R.string.dds_a11y_back),
    columnMax: Dp = DdsScreen.bodyMax.dp,
    actions: @Composable RowScope.() -> Unit = {},
) {
    val colors = DdsTheme.colors
    val frame = ddsFrame()
    val gutter = frame.width.gutter
    val tall = frame.tallBar
    val minHeight = barMinHeight(tall)
    Column(modifier.fillMaxWidth().background(colors.bgDefault)) {
        Box(Modifier.fillMaxWidth().windowInsetsPadding(WindowInsets.statusBars), contentAlignment = Alignment.TopCenter) {
            CompositionLocalProvider(LocalContentColor provides colors.textPrimary) {
                // One layout places the arrow or mark, the title and the actions from the same pixel
                // lines, so where the title starts does not depend on what stands before it.
                Layout(
                    content = {
                        if (onBack != null) {
                            DdsIconButton(DdsIcons.ArrowLeft, backDescription, onBack, Modifier.layoutId(BarSlot.Arrow), enabled = backEnabled)
                        } else if (leading != null) {
                            Box(Modifier.layoutId(BarSlot.Mark)) { leading() }
                        }
                        Text(
                            title,
                            Modifier.layoutId(BarSlot.Title).testTag(DdsTestTags.TopBarTitle).semantics { heading() },
                            style = DdsTheme.typography.title2,
                            color = colors.textPrimary,
                            maxLines = if (tall) 2 else 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                        Row(Modifier.layoutId(BarSlot.Actions), verticalAlignment = Alignment.CenterVertically, content = actions)
                    },
                    modifier = Modifier.widthIn(max = columnMax).fillMaxWidth(),
                ) { measurables, constraints ->
                    val width = constraints.maxWidth
                    val textLine = gutter.roundToPx()
                    val endLine = width - textLine
                    // A 48dp button holds a 24dp glyph in its middle. The arrow is placed so the glyph's start
                    // edge is on the text line, the last icon so the glyph's end edge is on the end line;
                    // the touch areas reach `hang` past the glyph into the gutter.
                    val buttonPx = DdsTouch.min.dp.roundToPx()
                    val glyphPx = DdsIconSize.md.dp.roundToPx()
                    val hangStart = (buttonPx - glyphPx + 1) / 2
                    val hangEnd = buttonPx - glyphPx - hangStart
                    val loose = Constraints(maxWidth = width, maxHeight = constraints.maxHeight)
                    fun measure(slot: BarSlot, limit: Constraints = loose) = measurables.firstOrNull { it.layoutId == slot }?.measure(limit)
                    val arrow = measure(BarSlot.Arrow)
                    val mark = measure(BarSlot.Mark)
                    val actionsPlaced = measure(BarSlot.Actions, loose.copy(maxWidth = (endLine + hangEnd).coerceAtLeast(0)))
                    val actionsLeft = if (actionsPlaced != null && actionsPlaced.width > 0) endLine + hangEnd - actionsPlaced.width else endLine
                    // The title starts at one place after an arrow or a mark; a mark wider than its room pushes it.
                    val titleStart = when {
                        arrow != null -> textLine + BarTitleStart.roundToPx()
                        mark != null -> textLine + maxOf(BarTitleStart.roundToPx(), mark.width + DdsSpace.s12.dp.roundToPx())
                        else -> textLine
                    }
                    val titlePlaced = measurables.first { it.layoutId == BarSlot.Title }
                        .measure(Constraints(maxWidth = (actionsLeft - titleStart).coerceAtLeast(0), maxHeight = constraints.maxHeight))
                    val height = maxOf(minHeight.roundToPx(), titlePlaced.height, arrow?.height ?: 0, mark?.height ?: 0, actionsPlaced?.height ?: 0)
                    layout(width, height) {
                        arrow?.placeRelative(textLine - hangStart, (height - arrow.height) / 2)
                        mark?.placeRelative(textLine, (height - mark.height) / 2)
                        titlePlaced.placeRelative(titleStart, (height - titlePlaced.height) / 2)
                        actionsPlaced?.placeRelative(actionsLeft, (height - actionsPlaced.height) / 2)
                    }
                }
            }
        }
        DdsDivider()
    }
}

private enum class BarSlot { Arrow, Mark, Title, Actions }

/** One destination of the bottom tabs or the rail. The label is the app's. */
@Immutable
public class DdsNavItem(public val label: String, public val icon: ImageVector)

/**
 * Bottom tabs, for a window narrower than 600dp.
 *
 * The selected tab changes three things at once — the pale brand pill behind
 * the icon, the brand color, and a heavier label — never the color alone. A
 * label takes up to two lines, centered, and the bar grows to hold them at
 * large font sizes; a longer label is cut with an ellipsis after the second line.
 */
@Composable
public fun DdsBottomBar(
    items: List<DdsNavItem>,
    selectedIndex: Int,
    onSelect: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = DdsTheme.colors
    Column(modifier.testTag(DdsTestTags.BottomTabs)) {
        DdsDivider()
        NavigationBar(containerColor = colors.bgDefault, tonalElevation = 0.dp) {
            items.forEachIndexed { index, item ->
                val selected = index == selectedIndex
                NavigationBarItem(
                    selected = selected,
                    onClick = { onSelect(index) },
                    icon = { DdsIcon(item.icon, contentDescription = null) },
                    label = { NavLabel(item.label, selected) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = colors.textBrand,
                        selectedTextColor = colors.textBrand,
                        indicatorColor = colors.bgBrandSubtle,
                        unselectedIconColor = colors.textSecondary,
                        unselectedTextColor = colors.textSecondary,
                    ),
                )
            }
        }
    }
}

/**
 * The same destinations as a rail at the start edge, for a window 600dp wide or more.
 * The rail is [DdsBar.rail] wide whatever the font size; a label takes up to two
 * lines, and the items scroll when they are taller than the rail.
 */
@Composable
public fun DdsNavRail(
    items: List<DdsNavItem>,
    selectedIndex: Int,
    onSelect: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = DdsTheme.colors
    Row(modifier.fillMaxHeight()) {
        // The system insets (a display cutout at the start, the bars above and below) go outside the
        // rail, so the rail itself is always its full width and its items keep all of it.
        Row(Modifier.fillMaxHeight().windowInsetsPadding(NavigationRailDefaults.windowInsets)) {
            NavigationRail(
                Modifier.testTag(DdsTestTags.Rail).width(DdsBar.rail.dp),
                containerColor = colors.bgDefault,
                windowInsets = WindowInsets(0, 0, 0, 0),
            ) {
                // The items scroll when there are more than the rail is tall: at large text each one is taller.
                Column(
                    Modifier.weight(1f).verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(DdsSpace.s4.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    items.forEachIndexed { index, item ->
                        val selected = index == selectedIndex
                        NavigationRailItem(
                            selected = selected,
                            onClick = { onSelect(index) },
                            icon = { DdsIcon(item.icon, contentDescription = null) },
                            label = { NavLabel(item.label, selected) },
                            colors = NavigationRailItemDefaults.colors(
                                selectedIconColor = colors.textBrand,
                                selectedTextColor = colors.textBrand,
                                indicatorColor = colors.bgBrandSubtle,
                                unselectedIconColor = colors.textSecondary,
                                unselectedTextColor = colors.textSecondary,
                            ),
                        )
                    }
                }
            }
        }
        Box(Modifier.fillMaxHeight().width(DdsBorder.hairline.dp).background(colors.borderDefault))
    }
}

@Composable
private fun NavLabel(text: String, selected: Boolean) {
    Text(
        text,
        fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
        textAlign = TextAlign.Center,
        maxLines = 2,
        softWrap = true,
        overflow = TextOverflow.Ellipsis,
    )
}

/**
 * The frame of an app with top-level destinations: the top bar, and the
 * destinations as bottom tabs (narrow window) or a rail (600dp and wider).
 *
 * The bars are fixed. Put [kr.devslab.dds.compose.motion.ddsScreenContent] on
 * the content, so only the content moves when the screen changes.
 *
 * @param content the screen; apply the given padding to it
 */
@Composable
public fun DdsScaffold(
    topBar: @Composable () -> Unit,
    navItems: List<DdsNavItem>,
    selectedIndex: Int,
    onSelect: (Int) -> Unit,
    modifier: Modifier = Modifier,
    content: @Composable (PaddingValues) -> Unit,
) {
    BoxWithConstraints(modifier.fillMaxSize().background(DdsTheme.colors.bgDefault)) {
        val wide = maxWidth >= DdsScreen.breakpoint.dp
        Scaffold(
            topBar = topBar,
            bottomBar = { if (!wide && navItems.isNotEmpty()) DdsBottomBar(navItems, selectedIndex, onSelect) },
            containerColor = DdsTheme.colors.bgDefault,
            contentColor = DdsTheme.colors.textPrimary,
        ) { padding ->
            if (wide && navItems.isNotEmpty()) {
                Row(Modifier.fillMaxSize().padding(padding)) {
                    DdsNavRail(navItems, selectedIndex, onSelect)
                    Box(Modifier.weight(1f).fillMaxHeight()) { content(PaddingValues()) }
                }
            } else {
                content(padding)
            }
        }
    }
}

/**
 * One screen of an app that sits inside [kr.devslab.dds.compose.layout.DdsAppFrame]: its top
 * bar, and when [bottomTabs] is set, the bottom tabs.
 *
 * The tabs are drawn here, inside the screen, so that a screen sliding in over this one covers
 * the tab row with it. They are drawn only on a narrow window (under 600dp), where the frame has
 * no rail, and only when a frame supplied the destinations. Set [bottomTabs] on top-level
 * screens and leave it off on detail screens.
 *
 * The frame keeps the screen clear of a display cutout at the sides and marks those insets as
 * used, so this does not add them again.
 *
 * @param content the body of the screen; apply the given padding to it
 */
@Composable
public fun DdsScaffold(
    topBar: @Composable () -> Unit,
    modifier: Modifier = Modifier,
    bottomTabs: Boolean = false,
    content: @Composable (PaddingValues) -> Unit,
) {
    val nav = LocalFrameNav.current
    val showTabs = bottomTabs && nav != null && ddsFrame().width == DdsWindowWidth.Compact
    Scaffold(
        modifier = modifier.fillMaxSize(),
        topBar = topBar,
        bottomBar = { if (showTabs && nav != null) DdsBottomBar(nav.items, nav.selectedIndex, nav.onSelect) },
        containerColor = DdsTheme.colors.bgDefault,
        contentColor = DdsTheme.colors.textPrimary,
        content = content,
    )
}

/**
 * A dialog that asks for a decision. Use it to confirm; offer choices and
 * actions in a bottom sheet instead.
 *
 * @param confirm the action that goes ahead (a [DdsButton]; `Danger` when it destroys something)
 * @param dismiss the action that backs out (a `Ghost` or `Secondary` [DdsButton]); it comes first for focus
 * @param text one or two sentences, in plain words
 */
@Composable
public fun DdsDialog(
    title: String,
    onDismissRequest: () -> Unit,
    confirm: @Composable () -> Unit,
    modifier: Modifier = Modifier,
    dismiss: (@Composable () -> Unit)? = null,
    text: String? = null,
) {
    val colors = DdsTheme.colors
    AlertDialog(
        onDismissRequest = onDismissRequest,
        confirmButton = confirm,
        modifier = modifier,
        dismissButton = dismiss,
        title = { WordsText(title, style = DdsTheme.typography.title2) },
        text = if (text != null) ({
            // A long message at a large font size can be taller than the dialog: it scrolls.
            WordsText(text, Modifier.verticalScroll(rememberScrollState()), style = DdsTheme.typography.body1)
        }) else null,
        shape = MaterialTheme.shapes.medium,
        containerColor = colors.bgElevated,
        titleContentColor = colors.textPrimary,
        textContentColor = colors.textSecondary,
        tonalElevation = 0.dp,
    )
}
