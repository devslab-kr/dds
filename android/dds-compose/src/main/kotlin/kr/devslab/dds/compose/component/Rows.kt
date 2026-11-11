package kr.devslab.dds.compose.component

import kr.devslab.dds.compose.motion.colorChange
import kr.devslab.dds.compose.motion.DdsMotion
import kotlinx.coroutines.launch
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.runtime.setValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.getValue
import androidx.compose.animation.core.tween
import androidx.compose.animation.core.Animatable
import androidx.compose.foundation.background
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.Alignment
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.material3.ripple
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.horizontalScroll
import kr.devslab.dds.tokens.DdsTouch
import androidx.compose.runtime.remember
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.AlignmentLine
import androidx.compose.ui.layout.FirstBaseline
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import kr.devslab.dds.compose.theme.DdsTheme
import kr.devslab.dds.tokens.DdsBorder
import kr.devslab.dds.tokens.DdsSpace

/**
 * A name and its value on one line: the name at the start, the value at the
 * end. Use it for the facts of one thing (amount, date, status), stacked.
 *
 * The value sits at the end edge so a column of values lines up, and its
 * digits are tabular so amounts of different lengths line up digit by digit.
 * A line under each row ties a value to its own name; leave it off the last
 * row with [divider].
 *
 * Both sit on one baseline when they fit. When they do not, the name gives
 * way first, down to two fifths of the row, and wraps; the value keeps the
 * rest — a long name or a large font cannot push the value out, and a short
 * name does not leave the value cramped.
 *
 * @param emphasized draws the value heavier — for the one figure that matters (a total)
 */
@Composable
public fun DdsValueRow(
    name: String,
    value: String,
    modifier: Modifier = Modifier,
    emphasized: Boolean = false,
    divider: Boolean = true,
) {
    val colors = DdsTheme.colors
    Column(modifier.fillMaxWidth().semantics(mergeDescendants = true) {}) {
        Layout(
            content = {
                WordsText(name, style = DdsTheme.typography.body2, color = colors.textSecondary)
                WordsText(
                    value,
                    style = DdsTheme.typography.body1.copy(
                        fontFeatureSettings = "tnum",
                        fontWeight = if (emphasized) FontWeight.SemiBold else FontWeight.Normal,
                    ),
                    color = colors.textPrimary,
                    textAlign = TextAlign.End,
                )
            },
            modifier = Modifier.fillMaxWidth().padding(vertical = DdsSpace.s12.dp),
        ) { measurables, constraints ->
            val (nameBox, valueBox) = measurables
            val total = constraints.maxWidth
            val gap = DdsSpace.s16.dp.roundToPx()
            val (nameWidth, valueWidth) = valueRowWidths(
                total = total,
                gap = gap,
                nameWants = nameBox.maxIntrinsicWidth(constraints.maxHeight),
                valueWants = valueBox.maxIntrinsicWidth(constraints.maxHeight),
            )
            val namePlaced = nameBox.measure(Constraints(maxWidth = nameWidth))
            val valuePlaced = valueBox.measure(Constraints.fixedWidth(valueWidth))
            // One baseline for the first line of each.
            val nameBase = namePlaced[FirstBaseline].takeIf { it != AlignmentLine.Unspecified } ?: 0
            val valueBase = valuePlaced[FirstBaseline].takeIf { it != AlignmentLine.Unspecified } ?: 0
            val base = maxOf(nameBase, valueBase)
            val height = maxOf(base - nameBase + namePlaced.height, base - valueBase + valuePlaced.height)
            layout(total, height) {
                namePlaced.placeRelative(0, base - nameBase)
                valuePlaced.placeRelative(total - valueWidth, base - valueBase)
            }
        }
        if (divider) DdsDivider()
    }
}

/** The least share of a value row the name keeps when the two do not fit: 2 parts in 5. */
private const val NAME_MIN_PARTS = 2
private const val ROW_PARTS = 5

/**
 * How a value row's width is shared out, as (name, value).
 *
 * When both fit, the name has what it wants and the value the rest. When they
 * do not, the name gives way — but never below two fifths, and never by more
 * than the value needs.
 */
internal fun valueRowWidths(total: Int, gap: Int, nameWants: Int, valueWants: Int): Pair<Int, Int> {
    val room = (total - gap).coerceAtLeast(0)
    if (nameWants + valueWants <= room) return nameWants to (room - nameWants)
    val nameFloor = room * NAME_MIN_PARTS / ROW_PARTS
    val name = minOf(nameWants, maxOf(nameFloor, room - valueWants))
    return name to (room - name)
}

/**
 * Tabs inside a page: views of the same thing (All / Waiting / Done). They
 * are not the app's destinations — those are [DdsBottomBar] or [DdsNavRail].
 *
 * The chosen tab has an underline in the brand color and a heavier label, as
 * the web Tabs do; a line under the row separates it from the content.
 *
 * The tabs share the width while their labels fit. A label wider than its
 * share makes its tab wider and the row scroll, so a label is never cut to a
 * letter at large font sizes.
 *
 * A [selectedIndex] outside [titles] (the list shrank while the screen kept
 * its choice) selects the nearest tab instead of failing.
 */
@Composable
public fun DdsTabs(
    titles: List<String>,
    selectedIndex: Int,
    onSelect: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = DdsTheme.colors
    if (titles.isEmpty()) return
    val shown = selectedIndex.coerceIn(0, titles.lastIndex)
    val scroll = rememberScrollState()
    // Where each tab starts and ends, in px from the start edge. Written when the row is
    // placed; read when it is drawn and when the choice changes, never while it is measured.
    var spans by remember { mutableStateOf<List<IntRange>>(emptyList()) }
    val span = spans.getOrNull(shown)
    // The two ends of the underline. It is one line for the whole row, so choosing another
    // tab slides it there, growing or shrinking to the new tab's width on the way.
    val lineStart = remember { Animatable(0f) }
    val lineEnd = remember { Animatable(0f) }
    var lineFor by remember { mutableIntStateOf(-1) } // the tab the line last went to; -1 before the first layout
    val underline = colors.textBrand
    LaunchedEffect(span, shown) {
        span ?: return@LaunchedEffect
        val start = span.first.toFloat()
        val end = (span.last + 1).toFloat()
        if (lineFor == shown || lineFor == -1) {
            // The same tab in a new place (first layout, rotation, font size): no travel.
            lineStart.snapTo(start)
            lineEnd.snapTo(end)
        } else {
            val slide = tween<Float>(DdsMotion.Base, easing = DdsMotion.Standard)
            launch { lineStart.animateTo(start, slide) }
            launch { lineEnd.animateTo(end, slide) }
        }
        lineFor = shown
        val middle = (span.first + span.last + 1) / 2
        scroll.animateScrollTo((middle - scroll.viewportSize / 2).coerceIn(0, scroll.maxValue))
    }
    Column(modifier.background(colors.bgDefault)) {
        // The row is laid out here rather than by Material's scrollable tab row: that one
        // never settles under a parent that asks for intrinsic sizes.
        Layout(
            content = {
                titles.forEachIndexed { index, title ->
                    TabCell(title, selected = index == shown, onClick = { onSelect(index) })
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(scroll)
                .selectableGroup()
                .drawWithContent {
                    drawContent()
                    // Before the line has been sent anywhere, it is drawn where the chosen tab
                    // is — so the first frame already has it.
                    val known = lineFor != -1
                    val from = if (known) lineStart.value else span?.first?.toFloat() ?: return@drawWithContent
                    val to = if (known) lineEnd.value else (span!!.last + 1).toFloat()
                    val thick = DdsBorder.focus.dp.toPx()
                    val left = if (layoutDirection == LayoutDirection.Rtl) size.width - to else from
                    drawRect(underline, Offset(left, size.height - thick), Size(to - from, thick))
                },
        ) { measurables, constraints ->
            // Inside a horizontal scroll the least width is the width on screen. An equal
            // share of it each, as long as the label fits: the row fills the width. A label
            // wider than its share makes its tab wider and the row scroll.
            val share = maxOf(constraints.minWidth / measurables.size, DdsTouch.min.dp.roundToPx())
            val height = measurables.maxOf { it.maxIntrinsicHeight(Constraints.Infinity) }
            val cells = measurables.map { it.measure(Constraints(minWidth = share, minHeight = height)) }
            val total = cells.sumOf { it.width }
            layout(maxOf(total, constraints.minWidth), height) {
                // Recorded here, not while measuring: this block runs only for a real layout,
                // while the measuring above also answers intrinsic-size questions with
                // stand-in sizes that must not be remembered.
                val placed = ArrayList<IntRange>(cells.size)
                var edge = 0
                for (cell in cells) {
                    placed += edge until edge + cell.width
                    cell.placeRelative(edge, 0)
                    edge += cell.width
                }
                spans = placed // an equal list changes nothing, so this settles
            }
        }
        // Outside the row, so the line runs the full width even when the tabs do not.
        DdsDivider()
    }
}

@Composable
private fun TabCell(title: String, selected: Boolean, onClick: () -> Unit) {
    val colors = DdsTheme.colors
    val interaction = remember { MutableInteractionSource() }
    val ink by colorChange(if (selected) colors.textBrand else colors.textSecondary)
    Box(
        Modifier
            .selectable(selected, interaction, ripple(), role = Role.Tab, onClick = onClick)
            .ddsFocusRing(interaction, RectangleShape)
            .heightIn(min = DdsTouch.min.dp)
            .padding(horizontal = DdsSpace.s16.dp),
        contentAlignment = Alignment.Center,
    ) {
        WeightStableLabel(title, heavy = selected, style = DdsTheme.typography.label, lightWeight = FontWeight.Normal, color = ink)
    }
}
