package kr.devslab.dds.compose.component

import androidx.compose.foundation.background
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ripple
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import kr.devslab.dds.compose.layout.ddsFrame
import kr.devslab.dds.compose.layout.gutter
import kr.devslab.dds.compose.motion.clear
import kr.devslab.dds.compose.motion.colorChange
import kr.devslab.dds.compose.theme.DdsTheme
import kr.devslab.dds.tokens.DdsControl
import kr.devslab.dds.tokens.DdsSpace
import kr.devslab.dds.tokens.DdsTouch

/**
 * The list an area of the app is moved around by: the pinned list beside the content on a wide
 * window ([kr.devslab.dds.compose.layout.DdsAppFrame]'s `list`), and the same list as a screen of
 * its own on a narrower one. Its rows are [DdsPaneItem]s.
 *
 * It scrolls when the rows do not fit. The rows are set in from the sides so that their labels
 * start on the window's gutter line, the line a top bar's title and a body's text start on. A
 * screen reader is told the rows are one group to choose from, so it says which one is chosen and
 * where it is ("2 of 7").
 *
 * @param content the rows, top to bottom
 */
@Composable
public fun DdsPaneList(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) {
    // A row's label is PaneItemInset in from the row's edge; the rest of the gutter is outside the row.
    val side = ddsFrame().width.gutter - PaneItemInset.dp
    Column(
        modifier
            .fillMaxWidth()
            .verticalScroll(rememberScrollState())
            .selectableGroup()
            .padding(horizontal = side, vertical = DdsSpace.s8.dp),
        verticalArrangement = Arrangement.spacedBy(DdsSpace.s4.dp),
        content = content,
    )
}

/**
 * One row of a [DdsPaneList]: a place in this area of the app.
 *
 * The chosen row looks like the chosen destination of the rail: the pale brand fill, the brand
 * color, and a heavier label, never the color alone. The colors ease in. The row is as wide as the
 * list lets it be and at least [DdsControl.md] high ([DdsTouch.large] in large text mode); a label
 * too long for one line wraps and the row grows. Being chosen changes neither the width nor the
 * height.
 *
 * @param label the name of the place, in the app's words
 * @param selected true for the row whose screen is showing
 * @param onClick called when the row is picked
 * @param enabled false dims the row and it cannot be picked
 */
@Composable
public fun DdsPaneItem(label: String, selected: Boolean, onClick: () -> Unit, modifier: Modifier = Modifier, enabled: Boolean = true) {
    val colors = DdsTheme.colors
    val interaction = remember { MutableInteractionSource() }
    val shape = MaterialTheme.shapes.small
    val fill by colorChange(if (selected) colors.bgBrandSubtle else colors.bgBrandSubtle.clear())
    val ink by colorChange(if (selected) colors.textBrand else colors.textPrimary)
    val minHeight = if (DdsTheme.largeText) DdsTouch.large else DdsControl.md
    val style = DdsTheme.typography.body1
    Box(
        modifier
            .fillMaxWidth()
            .heightIn(min = minHeight.dp)
            .alpha(if (enabled) 1f else DISABLED_ALPHA)
            .clip(shape)
            .background(fill)
            .ddsFocusRing(interaction, shape)
            .selectable(selected, interaction, ripple(), enabled, Role.Tab, onClick)
            .padding(horizontal = PaneItemInset.dp, vertical = DdsSpace.s8.dp),
        contentAlignment = Alignment.CenterStart,
    ) {
        // An unseen copy at the heavier weight holds the room, so choosing the row cannot add a line to it.
        WordsText(label, Modifier.alpha(0f).clearAndSetSemantics { }, style = style.copy(fontWeight = FontWeight.SemiBold))
        WordsText(label, style = style.copy(fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal), color = ink)
    }
}

/** How far a row's label is in from the row's own edge. */
private const val PaneItemInset: Int = DdsSpace.s12
