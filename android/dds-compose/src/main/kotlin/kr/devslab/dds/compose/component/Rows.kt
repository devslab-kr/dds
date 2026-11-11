package kr.devslab.dds.compose.component

import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.SecondaryScrollableTabRow
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRowDefaults
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
    Column(modifier) {
        BoxWithConstraints(Modifier.fillMaxWidth()) {
            SecondaryScrollableTabRow(
                selectedTabIndex = shown,
                modifier = Modifier.fillMaxWidth(),
                edgePadding = 0.dp,
                // An equal share each, as long as the labels fit in it: the row fills the width
                // as before. A label wider than its share makes its tab wider and the row scroll.
                minTabWidth = maxWidth / titles.size,
                containerColor = colors.bgDefault,
                contentColor = colors.textPrimary,
                indicator = {
                    TabRowDefaults.SecondaryIndicator(
                        Modifier.tabIndicatorOffset(shown),
                        height = DdsBorder.focus.dp,
                        color = colors.textBrand,
                    )
                },
                divider = {},
            ) {
                titles.forEachIndexed { index, title ->
                    val selected = index == shown
                    Tab(
                        selected = selected,
                        onClick = { onSelect(index) },
                        selectedContentColor = colors.textBrand,
                        unselectedContentColor = colors.textSecondary,
                        text = { WeightStableLabel(title, heavy = selected, style = DdsTheme.typography.label, lightWeight = FontWeight.Normal) },
                    )
                }
            }
        }
        // Outside the row, so the line runs the full width even when the tabs do not.
        DdsDivider()
    }
}
