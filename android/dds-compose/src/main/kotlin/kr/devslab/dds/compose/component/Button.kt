package kr.devslab.dds.compose.component

import kr.devslab.dds.compose.R
import androidx.compose.ui.res.stringResource
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ProvideTextStyle
import androidx.compose.material3.Text
import androidx.compose.material3.minimumInteractiveComponentSize
import androidx.compose.material3.ripple
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.compositeOver
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import kr.devslab.dds.compose.icons.DdsIcon
import kr.devslab.dds.compose.theme.DdsTheme
import kr.devslab.dds.tokens.DdsBorder
import kr.devslab.dds.tokens.DdsControl
import kr.devslab.dds.tokens.DdsSpace
import kr.devslab.dds.tokens.DdsTouch

/** What a button is for. The names are the web's (design-system §4.1). */
public enum class DdsButtonVariant {
    /** The one main action of a screen: a filled brand face. */
    Primary,

    /** An action beside the main one: an outline. */
    Secondary,

    /** A quiet action: brand-colored text only. */
    Ghost,

    /** A destructive action: a filled danger face. */
    Danger,
}

/** Control sizes. The names are the web's; the heights are touch heights. */
public enum class DdsSize {
    /** 40dp visible; the touch area is still 48dp. */
    Sm,

    /** 48dp — the one button height. */
    Md,

    /** 56dp — only for the single main action at the bottom of a screen. */
    Lg,
}

/** Opacity of a disabled control (design-system §4.2: opacity is for disabled only). */
internal const val DISABLED_ALPHA: Float = 0.45f

/**
 * A 2dp focus ring in `border.focus`, flush on the control's own edge, shown
 * only for keyboard and D-pad focus (touch does not focus).
 */
internal fun Modifier.ddsFocusRing(interactionSource: MutableInteractionSource, shape: Shape): Modifier = composed {
    val focused by interactionSource.collectIsFocusedAsState()
    if (focused) border(DdsBorder.focus.dp, DdsTheme.colors.borderFocus, shape) else this
}

/**
 * The DDS button.
 *
 * Its height is a minimum: a larger font makes a taller button, and buttons on
 * one row should be given the same [size]. Pressing changes the color, never
 * the size or the position.
 *
 * @param loading work is in progress. The button keeps its exact size: the
 * content stays in the layout but is not drawn, a progress ring is drawn over
 * it, and taps are ignored. A loading button is not dimmed
 * @param leading drawn before the content (an icon)
 * @param trailing drawn after the content
 * @param loadingDescription what a screen reader says while [loading]; "Loading" in the
 * device language when null
 */
@Composable
public fun DdsButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: DdsButtonVariant = DdsButtonVariant.Primary,
    size: DdsSize = DdsSize.Md,
    enabled: Boolean = true,
    loading: Boolean = false,
    loadingDescription: String? = null,
    leading: (@Composable () -> Unit)? = null,
    trailing: (@Composable () -> Unit)? = null,
    content: @Composable RowScope.() -> Unit,
) {
    val colors = DdsTheme.colors
    val interaction = remember { MutableInteractionSource() }
    val isPressed by interaction.collectIsPressedAsState()
    // A loading button still takes focus, but a press does nothing — so it must not look pressed.
    val pressed = isPressed && !loading
    val shape = MaterialTheme.shapes.small
    val filled = variant == DdsButtonVariant.Primary || variant == DdsButtonVariant.Danger
    val loadingWord = loadingDescription ?: stringResource(R.string.dds_a11y_loading)

    val container: Color = when (variant) {
        DdsButtonVariant.Primary -> if (pressed) colors.bgBrandHover else colors.bgBrand
        DdsButtonVariant.Danger -> if (pressed) colors.overlayPressedTint.compositeOver(colors.statusDanger) else colors.statusDanger
        else -> if (pressed) colors.overlayPressedTint else Color.Transparent
    }
    val contentColor: Color = when (variant) {
        DdsButtonVariant.Primary -> colors.textOnBrand
        DdsButtonVariant.Danger -> colors.textOnStatus
        DdsButtonVariant.Secondary -> colors.textPrimary
        DdsButtonVariant.Ghost -> colors.textBrand
    }
    val minHeight = when (size) {
        DdsSize.Sm -> DdsControl.sm
        DdsSize.Md -> DdsControl.md
        DdsSize.Lg -> DdsControl.lg
    }.dp
    val horizontal = when (size) {
        DdsSize.Sm -> DdsSpace.s12
        DdsSize.Md -> DdsSpace.s16
        DdsSize.Lg -> DdsSpace.s20
    }.dp
    val base = if (size == DdsSize.Lg) DdsTheme.typography.body1 else DdsTheme.typography.label
    val textStyle = base.copy(fontWeight = if (filled) FontWeight.SemiBold else base.fontWeight, textAlign = TextAlign.Center)

    Box(
        modifier
            .minimumInteractiveComponentSize()
            .alpha(if (enabled || loading) 1f else DISABLED_ALPHA)
            .defaultMinSize(minWidth = DdsTouch.min.dp, minHeight = minHeight)
            .clip(shape)
            .background(container)
            .then(
                if (variant == DdsButtonVariant.Secondary) {
                    Modifier.border(BorderStroke(DdsBorder.hairline.dp, colors.borderStrong), shape)
                } else {
                    Modifier
                },
            )
            .ddsFocusRing(interaction, shape)
            .clickable(
                interactionSource = interaction,
                indication = if (loading) null else ripple(color = contentColor),
                // Still enabled while loading: a disabled button drops keyboard focus the moment
                // it is pressed, and a screen reader would say only "disabled". Taps do nothing.
                enabled = enabled,
                role = Role.Button,
                onClick = { if (!loading) onClick() },
            )
            .semantics {
                if (loading) stateDescription = loadingWord
            }
            .padding(horizontal = horizontal, vertical = DdsSpace.s8.dp),
        contentAlignment = Alignment.Center,
    ) {
        CompositionLocalProvider(LocalContentColor provides contentColor) {
            ProvideTextStyle(textStyle) {
                Row(
                    // Kept in the layout while loading so the button does not change size.
                    modifier = Modifier.alpha(if (loading) 0f else 1f),
                    horizontalArrangement = Arrangement.spacedBy(DdsSpace.s8.dp, Alignment.CenterHorizontally),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    leading?.invoke()
                    content()
                    trailing?.invoke()
                }
            }
            if (loading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(DdsSpace.s16.dp),
                    color = contentColor,
                    strokeWidth = DdsBorder.focus.dp,
                    trackColor = Color.Transparent,
                )
            }
        }
    }
}

/** [DdsButton] with a text label. */
@Composable
public fun DdsButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: DdsButtonVariant = DdsButtonVariant.Primary,
    size: DdsSize = DdsSize.Md,
    enabled: Boolean = true,
    loading: Boolean = false,
    loadingDescription: String? = null,
    leading: (@Composable () -> Unit)? = null,
    trailing: (@Composable () -> Unit)? = null,
) {
    DdsButton(onClick, modifier, variant, size, enabled, loading, loadingDescription, leading, trailing) { Text(text) }
}

/**
 * A button that is only an icon. Its touch area is 48dp.
 *
 * @param contentDescription what the button does, for a screen reader. Required:
 * an icon alone says nothing to someone who cannot see it
 */
@Composable
public fun DdsIconButton(
    icon: ImageVector,
    contentDescription: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    tint: Color = DdsTheme.colors.textPrimary,
) {
    val interaction = remember { MutableInteractionSource() }
    val shape = MaterialTheme.shapes.small
    Box(
        modifier
            .size(DdsTouch.min.dp)
            .alpha(if (enabled) 1f else DISABLED_ALPHA)
            .clip(shape)
            .ddsFocusRing(interaction, shape)
            .clickable(
                interactionSource = interaction,
                indication = ripple(color = tint),
                enabled = enabled,
                role = Role.Button,
                onClick = onClick,
            )
            .semantics { this.contentDescription = contentDescription },
        contentAlignment = Alignment.Center,
    ) {
        DdsIcon(icon, contentDescription = null, tint = tint)
    }
}
