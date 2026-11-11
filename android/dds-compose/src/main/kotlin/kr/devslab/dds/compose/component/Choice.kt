package kr.devslab.dds.compose.component

import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.toggleable
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.RadioButton
import androidx.compose.material3.RadioButtonDefaults
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.ripple
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp
import kr.devslab.dds.compose.theme.DdsTheme
import kr.devslab.dds.tokens.DdsRow
import kr.devslab.dds.tokens.DdsSpace
import kr.devslab.dds.tokens.DdsTouch

/** The row every choice control shares: the whole row is the touch target. */
@Composable
private fun ChoiceRow(
    label: String,
    description: String?,
    enabled: Boolean,
    modifier: Modifier,
    controlFirst: Boolean,
    control: @Composable () -> Unit,
) {
    val colors = DdsTheme.colors
    val minHeight = if (DdsTheme.largeText) maxOf(DdsRow.min, DdsTouch.large) else DdsRow.min
    Row(
        modifier
            .fillMaxWidth()
            .heightIn(min = minHeight.dp)
            .alpha(if (enabled) 1f else DISABLED_ALPHA)
            .padding(vertical = DdsSpace.s8.dp),
        horizontalArrangement = Arrangement.spacedBy(DdsSpace.s12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (controlFirst) control()
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(DdsSpace.s2.dp)) {
            WordsText(label, style = DdsTheme.typography.body1, color = colors.textPrimary)
            if (description != null) WordsText(description, style = DdsTheme.typography.caption, color = colors.textSecondary)
        }
        if (!controlFirst) control()
    }
}

/**
 * A checkbox with its label. Tapping anywhere on the row toggles it.
 *
 * @param description a second line under the label
 */
@Composable
public fun DdsCheckbox(
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    description: String? = null,
    enabled: Boolean = true,
) {
    val colors = DdsTheme.colors
    val interaction = remember { MutableInteractionSource() }
    ChoiceRow(
        label, description, enabled,
        modifier
            .clip(MaterialTheme.shapes.small)
            .ddsFocusRing(interaction, MaterialTheme.shapes.small)
            .toggleable(checked, interaction, ripple(), enabled, Role.Checkbox, onCheckedChange),
        controlFirst = true,
    ) {
        Checkbox(
            checked = checked,
            onCheckedChange = null,
            enabled = enabled,
            colors = CheckboxDefaults.colors(
                checkedColor = colors.bgBrand,
                checkmarkColor = colors.textOnBrand,
                uncheckedColor = colors.borderControl,
                disabledCheckedColor = colors.bgBrand,
                disabledUncheckedColor = colors.borderControl,
            ),
        )
    }
}

/** One option of a single choice, with its label. Tapping anywhere on the row selects it. */
@Composable
public fun DdsRadio(
    selected: Boolean,
    onClick: () -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    description: String? = null,
    enabled: Boolean = true,
) {
    val colors = DdsTheme.colors
    val interaction = remember { MutableInteractionSource() }
    ChoiceRow(
        label, description, enabled,
        modifier
            .clip(MaterialTheme.shapes.small)
            .ddsFocusRing(interaction, MaterialTheme.shapes.small)
            .selectable(selected, interaction, ripple(), enabled, Role.RadioButton, onClick),
        controlFirst = true,
    ) {
        RadioButton(
            selected = selected,
            onClick = null,
            enabled = enabled,
            colors = RadioButtonDefaults.colors(
                selectedColor = colors.textBrand,
                unselectedColor = colors.borderControl,
                disabledSelectedColor = colors.textBrand,
                disabledUnselectedColor = colors.borderControl,
            ),
        )
    }
}

/** A switch with its label. The switch sits at the end of the row; tapping anywhere toggles it. */
@Composable
public fun DdsSwitch(
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    description: String? = null,
    enabled: Boolean = true,
) {
    val colors = DdsTheme.colors
    val interaction = remember { MutableInteractionSource() }
    ChoiceRow(
        label, description, enabled,
        modifier
            .clip(MaterialTheme.shapes.small)
            .ddsFocusRing(interaction, MaterialTheme.shapes.small)
            .toggleable(checked, interaction, ripple(), enabled, Role.Switch, onCheckedChange),
        controlFirst = false,
    ) {
        Switch(
            checked = checked,
            onCheckedChange = null,
            enabled = enabled,
            colors = SwitchDefaults.colors(
                checkedTrackColor = colors.bgBrand,
                checkedThumbColor = colors.textOnBrand,
                checkedBorderColor = Color.Transparent,
                uncheckedTrackColor = colors.textMuted,
                uncheckedThumbColor = colors.bgElevated,
                uncheckedBorderColor = Color.Transparent,
                disabledCheckedTrackColor = colors.bgBrand,
                disabledCheckedThumbColor = colors.textOnBrand,
                disabledUncheckedTrackColor = colors.textMuted,
                disabledUncheckedThumbColor = colors.bgElevated,
            ),
        )
    }
}
