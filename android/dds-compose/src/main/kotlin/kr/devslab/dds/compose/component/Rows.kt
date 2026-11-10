package kr.devslab.dds.compose.component

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.SecondaryTabRow
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRowDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
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
        Row(
            Modifier.fillMaxWidth().padding(vertical = DdsSpace.s12.dp),
            horizontalArrangement = Arrangement.spacedBy(DdsSpace.s16.dp),
        ) {
            WordsText(name, Modifier.alignByBaseline(), style = DdsTheme.typography.body2, color = colors.textSecondary)
            WordsText(
                value,
                Modifier.weight(1f).alignByBaseline(),
                style = DdsTheme.typography.body1.copy(
                    fontFeatureSettings = "tnum",
                    fontWeight = if (emphasized) FontWeight.SemiBold else FontWeight.Normal,
                ),
                color = colors.textPrimary,
                textAlign = TextAlign.End,
            )
        }
        if (divider) DdsDivider()
    }
}

/**
 * Tabs inside a page: views of the same thing (All / Waiting / Done). They
 * are not the app's destinations — those are [DdsBottomBar] or [DdsNavRail].
 *
 * The chosen tab has an underline in the brand color and a heavier label, as
 * the web Tabs do; a line under the row separates it from the content.
 */
@Composable
public fun DdsTabs(
    titles: List<String>,
    selectedIndex: Int,
    onSelect: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = DdsTheme.colors
    SecondaryTabRow(
        selectedTabIndex = selectedIndex,
        modifier = modifier,
        containerColor = colors.bgDefault,
        contentColor = colors.textPrimary,
        indicator = {
            TabRowDefaults.SecondaryIndicator(
                Modifier.tabIndicatorOffset(selectedIndex),
                height = DdsBorder.focus.dp,
                color = colors.textBrand,
            )
        },
        divider = { DdsDivider() },
    ) {
        titles.forEachIndexed { index, title ->
            val selected = index == selectedIndex
            Tab(
                selected = selected,
                onClick = { onSelect(index) },
                selectedContentColor = colors.textBrand,
                unselectedContentColor = colors.textSecondary,
                text = {
                    Text(
                        title,
                        style = DdsTheme.typography.label,
                        fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                },
            )
        }
    }
}
