package kr.devslab.dds.compose.component

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.error
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import kr.devslab.dds.compose.theme.DdsTheme
import kr.devslab.dds.tokens.DdsBorder
import kr.devslab.dds.tokens.DdsField
import kr.devslab.dds.tokens.DdsSpace

/**
 * The DDS text field.
 *
 * The label sits above the field, not inside it, so it never moves and is
 * never replaced by what was typed. The line under the field is always kept:
 * a helper or an error can appear there without pushing the screen down.
 *
 * An error is never shown by the border color alone — pass the message in
 * [error]. A screen reader hears the field as one thing (what was typed, that
 * it is an edit box, its label, and the error when there is one), and hears
 * the error spoken the moment it appears.
 *
 * @param label the name of the field, shown above it and read by a screen reader
 * @param helper a hint under the field, shown when there is no [error]
 * @param error the problem with the current value; null when there is none
 * @param leading drawn inside the field before the text (an icon)
 * @param trailing drawn inside the field after the text (a clear button, a unit)
 */
@Composable
public fun DdsTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    placeholder: String? = null,
    helper: String? = null,
    error: String? = null,
    enabled: Boolean = true,
    readOnly: Boolean = false,
    singleLine: Boolean = true,
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default,
    keyboardActions: KeyboardActions = KeyboardActions.Default,
    visualTransformation: VisualTransformation = VisualTransformation.None,
    leading: (@Composable () -> Unit)? = null,
    trailing: (@Composable () -> Unit)? = null,
) {
    val colors = DdsTheme.colors
    val typography = DdsTheme.typography
    val interaction = remember { MutableInteractionSource() }
    val focused by interaction.collectIsFocusedAsState()
    val shape = MaterialTheme.shapes.small
    val isError = error != null

    // One edge at a time: the focus ring replaces the border instead of doubling it.
    val edgeWidth = if (focused) DdsBorder.focus.dp else DdsBorder.hairline.dp
    val edgeColor = when {
        isError -> colors.statusDanger
        focused -> colors.borderFocus
        else -> colors.borderStrong
    }
    val textStyle = typography.body1.copy(color = colors.textPrimary)

    Column(modifier.alpha(if (enabled) 1f else DISABLED_ALPHA), verticalArrangement = Arrangement.spacedBy(DdsSpace.s4.dp)) {
        BasicTextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier
                .fillMaxWidth()
                .semantics { if (error != null) error(error) },
            enabled = enabled,
            readOnly = readOnly,
            textStyle = textStyle,
            keyboardOptions = keyboardOptions,
            keyboardActions = keyboardActions,
            singleLine = singleLine,
            visualTransformation = visualTransformation,
            interactionSource = interaction,
            cursorBrush = SolidColor(colors.textBrand),
            // The label is drawn inside the field's own decoration, above the box. On screen
            // nothing changes; to a screen reader the label is part of the field, not a
            // separate stop that says the same words again.
            decorationBox = { innerTextField ->
                Column(verticalArrangement = Arrangement.spacedBy(DdsSpace.s4.dp)) {
                    WordsText(label, style = typography.label, color = colors.textPrimary)
                    Row(
                        Modifier
                            .fillMaxWidth()
                            .defaultMinSize(minHeight = DdsField.height.dp)
                            .clip(shape)
                            .background(if (enabled) colors.bgDefault else colors.bgSubtle)
                            .border(edgeWidth, edgeColor, shape)
                            .padding(horizontal = DdsSpace.s12.dp, vertical = DdsSpace.s12.dp),
                        horizontalArrangement = Arrangement.spacedBy(DdsSpace.s8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        CompositionLocalProvider(LocalContentColor provides colors.textSecondary) {
                            leading?.invoke()
                            Box(Modifier.weight(1f), contentAlignment = Alignment.CenterStart) {
                                if (value.isEmpty() && placeholder != null) {
                                    Text(placeholder, style = textStyle, color = colors.textMuted, maxLines = 1)
                                }
                                innerTextField()
                            }
                            trailing?.invoke()
                        }
                    }
                }
            },
        )
        FieldMessage(helper = helper, error = error)
    }
}

/**
 * The line under a field. It is always there — empty when there is nothing to
 * say — so a message appearing does not move what is below, and so an error is
 * a change to something a screen reader already knows about, which it speaks.
 */
@Composable
internal fun FieldMessage(helper: String?, error: String?) {
    val colors = DdsTheme.colors
    val typography = DdsTheme.typography
    val line = with(LocalDensity.current) { typography.caption.lineHeight.toDp() }
    Box(Modifier.heightIn(min = line)) {
        WordsText(
            error ?: helper.orEmpty(),
            if (error != null) Modifier.semantics { liveRegion = LiveRegionMode.Polite } else Modifier,
            style = typography.caption,
            color = if (error != null) colors.statusDanger else colors.textSecondary,
        )
    }
}
