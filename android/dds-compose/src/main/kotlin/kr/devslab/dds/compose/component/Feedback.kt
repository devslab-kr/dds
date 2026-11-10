package kr.devslab.dds.compose.component

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.minimumInteractiveComponentSize
import androidx.compose.material3.ripple
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithCache
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.drawOutline
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import kr.devslab.dds.compose.icons.DdsIcon
import kr.devslab.dds.compose.icons.DdsIcons
import kr.devslab.dds.compose.motion.ddsAppear
import kr.devslab.dds.compose.theme.DdsTheme
import kr.devslab.dds.compose.theme.keepWords
import kr.devslab.dds.tokens.DdsBorder
import kr.devslab.dds.tokens.DdsControl
import kr.devslab.dds.tokens.DdsIcon as DdsIconSize
import kr.devslab.dds.tokens.DdsSpace

/** The meaning of a notice or a badge. Each has its own color pair and its own icon. */
public enum class DdsTone {
    /** Something to know. */
    Info,

    /** Something worked. */
    Success,

    /** Something needs attention. */
    Warning,

    /** Something went wrong. */
    Danger,

    /** No particular meaning (badges only): the neutral look. */
    Neutral,
}

private class ToneLook(val foreground: Color, val background: Color, val icon: ImageVector)

@Composable
private fun toneLook(tone: DdsTone): ToneLook {
    val c = DdsTheme.colors
    return when (tone) {
        DdsTone.Info -> ToneLook(c.statusInfo, c.statusInfoBg, DdsIcons.Info)
        DdsTone.Success -> ToneLook(c.statusSuccess, c.statusSuccessBg, DdsIcons.Check)
        DdsTone.Warning -> ToneLook(c.statusWarning, c.statusWarningBg, DdsIcons.Alert)
        DdsTone.Danger -> ToneLook(c.statusDanger, c.statusDangerBg, DdsIcons.Close)
        DdsTone.Neutral -> ToneLook(c.textSecondary, c.bgSubtle, DdsIcons.Info)
    }
}

/**
 * A message in the page: the pale status background, an icon and the text.
 *
 * The icon differs by [tone] — a notice and an error must not look alike, and
 * color is never the only signal. A screen reader announces the message when
 * it appears; a new message fades in again.
 *
 * @param iconDescription what the icon means, for a screen reader ("Error",
 * "Notice"); the app supplies it in its own language
 */
@Composable
public fun DdsNotice(
    message: String,
    modifier: Modifier = Modifier,
    tone: DdsTone = DdsTone.Info,
    iconDescription: String? = null,
    action: (@Composable () -> Unit)? = null,
) {
    val look = toneLook(tone)
    val shape = MaterialTheme.shapes.small
    Row(
        modifier
            .fillMaxWidth()
            .ddsAppear(key = message)
            .clip(shape)
            .background(look.background)
            // The neutral background is the card color in dark: an edge keeps it a separate thing.
            .then(if (tone == DdsTone.Neutral) Modifier.border(BorderStroke(DdsBorder.hairline.dp, DdsTheme.colors.borderDefault), shape) else Modifier)
            .semantics { liveRegion = if (tone == DdsTone.Danger) LiveRegionMode.Assertive else LiveRegionMode.Polite }
            .padding(DdsSpace.s12.dp),
        horizontalArrangement = Arrangement.spacedBy(DdsSpace.s12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        DdsIcon(look.icon, contentDescription = iconDescription, size = DdsIconSize.sm.dp, tint = look.foreground)
        Text(message.keepWords(), Modifier.weight(1f), style = DdsTheme.typography.body2, color = look.foreground)
        action?.invoke()
    }
}

/**
 * A short status label: a pill with a leading dot. The dot repeats the state so
 * color is not the only signal. The text is the app's (a status name).
 */
@Composable
public fun DdsBadge(text: String, modifier: Modifier = Modifier, tone: DdsTone = DdsTone.Neutral) {
    val look = toneLook(tone)
    Row(
        modifier
            .clip(CircleShape)
            .background(look.background)
            .then(if (tone == DdsTone.Neutral) Modifier.border(BorderStroke(DdsBorder.hairline.dp, DdsTheme.colors.borderDefault), CircleShape) else Modifier)
            .padding(horizontal = DdsSpace.s8.dp, vertical = DdsSpace.s2.dp),
        horizontalArrangement = Arrangement.spacedBy(DdsSpace.s4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(Modifier.size(DOT.dp).clip(CircleShape).background(look.foreground))
        Text(text, style = DdsTheme.typography.label, color = look.foreground, maxLines = 1)
    }
}

/** The badge and toast dot: glyph geometry, the same 6 as the web. */
private const val DOT = 6

/**
 * A choice that can be on or off: a pill with an outline, filled with the pale
 * brand color when selected. The state is announced, not only colored.
 */
@Composable
public fun DdsChip(
    text: String,
    selected: Boolean,
    onSelectedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    val colors = DdsTheme.colors
    val interaction = remember { MutableInteractionSource() }
    Box(
        modifier
            .minimumInteractiveComponentSize()
            .alpha(if (enabled) 1f else DISABLED_ALPHA)
            .defaultMinSize(minHeight = (DdsControl.sm - DdsSpace.s4).dp)
            .clip(CircleShape)
            .background(if (selected) colors.bgBrandSubtle else Color.Transparent)
            .border(BorderStroke(DdsBorder.hairline.dp, if (selected) colors.bgBrand else colors.borderStrong), CircleShape)
            .ddsFocusRing(interaction, CircleShape)
            .toggleable(selected, interaction, ripple(), enabled, Role.Checkbox, onSelectedChange)
            .padding(horizontal = DdsSpace.s12.dp, vertical = DdsSpace.s4.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(text, style = DdsTheme.typography.label, color = if (selected) colors.textBrand else colors.textPrimary, maxLines = 1)
    }
}

/**
 * What a screen shows when there is nothing to show: a title, one sentence,
 * and at most one action. Show it only once the answer is known — a first load
 * shows [kr.devslab.dds.compose.motion.DdsLoadingRows] instead.
 */
@Composable
public fun DdsEmptyState(
    title: String,
    modifier: Modifier = Modifier,
    description: String? = null,
    action: (@Composable () -> Unit)? = null,
) {
    val colors = DdsTheme.colors
    val shape = MaterialTheme.shapes.medium
    Column(
        modifier
            .fillMaxWidth()
            .dashedBorder(colors.borderStrong, shape)
            .padding(horizontal = DdsSpace.s24.dp, vertical = DdsSpace.s40.dp),
        verticalArrangement = Arrangement.spacedBy(DdsSpace.s8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(title.keepWords(), style = DdsTheme.typography.title3, color = colors.textPrimary, textAlign = TextAlign.Center)
        if (description != null) {
            Text(description.keepWords(), style = DdsTheme.typography.body2, color = colors.textSecondary, textAlign = TextAlign.Center)
        }
        if (action != null) {
            Box(Modifier.padding(top = DdsSpace.s8.dp)) { action() }
        }
    }
}

/** The dash and the gap of the empty-state outline: glyph geometry, as on the web. */
private const val DASH = 4

/** A hairline dashed outline: the web's empty state is outlined the same way. */
private fun Modifier.dashedBorder(color: Color, shape: Shape): Modifier = drawWithCache {
    val width = DdsBorder.hairline.dp.toPx()
    val inset = width / 2
    val outline = shape.createOutline(Size(size.width - width, size.height - width), layoutDirection, this)
    val stroke = Stroke(width, pathEffect = PathEffect.dashPathEffect(floatArrayOf(DASH.dp.toPx(), DASH.dp.toPx())))
    onDrawBehind { translate(inset, inset) { drawOutline(outline, color, style = stroke) } }
}

/**
 * A progress ring for work with no known length, in the color of the
 * surrounding content.
 *
 * @param description what is happening, for a screen reader ("Loading")
 */
@Composable
public fun DdsSpinner(description: String, modifier: Modifier = Modifier, color: Color = LocalContentColor.current) {
    CircularProgressIndicator(
        modifier = modifier.size(DdsIconSize.md.dp).semantics { contentDescription = description },
        color = color,
        strokeWidth = DdsBorder.focus.dp,
        trackColor = Color.Transparent,
    )
}
