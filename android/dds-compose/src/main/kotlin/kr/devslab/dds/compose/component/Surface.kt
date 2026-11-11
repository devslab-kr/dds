package kr.devslab.dds.compose.component

import androidx.compose.ui.semantics.Role
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.ripple
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import kr.devslab.dds.compose.theme.DdsTheme
import kr.devslab.dds.tokens.DdsBorder
import kr.devslab.dds.tokens.DdsRow
import kr.devslab.dds.tokens.DdsSpace
import kr.devslab.dds.tokens.DdsTouch

/**
 * A grouped surface: the elevated face with a hairline edge. There is no
 * shadow — on a phone a small shadow smears in light and vanishes in dark.
 *
 * Use this, not `MaterialTheme.colorScheme.surface`, for a card: Material's
 * `surface` is the page background here, so a card painted with it disappears.
 *
 * @param subtle the flat variant for a card inside an already elevated surface
 * (a card in a sheet): the quiet background, no edge
 * @param contentPadding 16dp by default; pass zero for a card made of [DdsListRow]s
 */
@Composable
public fun DdsCard(
    modifier: Modifier = Modifier,
    subtle: Boolean = false,
    contentPadding: PaddingValues = PaddingValues(DdsSpace.s16.dp),
    content: @Composable ColumnScope.() -> Unit,
) {
    val colors = DdsTheme.colors
    val shape = MaterialTheme.shapes.medium
    Column(
        modifier
            .clip(shape)
            .background(if (subtle) colors.bgSubtle else colors.bgElevated)
            .then(if (subtle) Modifier else Modifier.border(BorderStroke(DdsBorder.hairline.dp, colors.borderDefault), shape))
            .padding(contentPadding),
    ) {
        CompositionLocalProvider(LocalContentColor provides colors.textPrimary, content = { content() })
    }
}

/**
 * A titled block of a screen: a heading, an optional line of explanation, then
 * the content (usually a [DdsCard]).
 */
@Composable
public fun DdsSection(
    title: String,
    modifier: Modifier = Modifier,
    description: String? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    Column(modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(DdsSpace.s12.dp)) {
        Column(verticalArrangement = Arrangement.spacedBy(DdsSpace.s4.dp)) {
            WordsText(title, Modifier.semantics { heading() }, style = DdsTheme.typography.title3, color = DdsTheme.colors.textPrimary)
            if (description != null) {
                WordsText(description, style = DdsTheme.typography.body2, color = DdsTheme.colors.textSecondary)
            }
        }
        content()
    }
}

/** A hairline between rows or blocks, in `border.default`. */
@Composable
public fun DdsDivider(modifier: Modifier = Modifier) {
    HorizontalDivider(modifier, thickness = DdsBorder.hairline.dp, color = DdsTheme.colors.borderDefault)
}

/**
 * One row of a list: a title, an optional second line, and a slot at each end.
 *
 * The height is a minimum (56dp, 72dp with a second line) and grows with the
 * font. A long title is cut with an ellipsis on one line; the second line may
 * wrap to two.
 *
 * @param onClick makes the whole row a button; null for a row that only shows something
 * @param leading drawn before the text (an icon, an avatar)
 * @param trailing drawn after the text (a value, a chevron, a badge)
 */
@Composable
public fun DdsListRow(
    title: String,
    modifier: Modifier = Modifier,
    subtitle: String? = null,
    onClick: (() -> Unit)? = null,
    enabled: Boolean = true,
    leading: (@Composable () -> Unit)? = null,
    trailing: (@Composable () -> Unit)? = null,
) {
    val colors = DdsTheme.colors
    val interaction = remember { MutableInteractionSource() }
    val base = if (subtitle != null) DdsRow.twoLine else DdsRow.min
    val minHeight = if (DdsTheme.largeText) maxOf(base, DdsTouch.large) else base
    Row(
        modifier
            .fillMaxWidth()
            .heightIn(min = minHeight.dp)
            .alpha(if (enabled) 1f else DISABLED_ALPHA)
            .then(
                if (onClick != null) {
                    Modifier
                        .ddsFocusRing(interaction, MaterialTheme.shapes.small)
                        .clickable(interaction, ripple(), enabled, role = Role.Button, onClick = onClick)
                } else {
                    // A row that only shows something is still one thing: its title, its
                    // second line and what is at its end are read together.
                    Modifier.semantics(mergeDescendants = true) {}
                },
            )
            .padding(horizontal = DdsSpace.s16.dp, vertical = DdsSpace.s12.dp),
        horizontalArrangement = Arrangement.spacedBy(DdsSpace.s12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        CompositionLocalProvider(LocalContentColor provides colors.textSecondary) {
            leading?.invoke()
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(DdsSpace.s2.dp)) {
                WordsText(title, style = DdsTheme.typography.body1, color = colors.textPrimary, maxLines = 2, overflow = TextOverflow.Ellipsis)
                if (subtitle != null) {
                    WordsText(subtitle, style = DdsTheme.typography.caption, color = colors.textSecondary, maxLines = 2, overflow = TextOverflow.Ellipsis)
                }
            }
            trailing?.invoke()
        }
    }
}
