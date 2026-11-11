package kr.devslab.dds.compose.component

import kr.devslab.dds.tokens.DdsTouch
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.foundation.layout.size
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.ripple
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.error
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import kr.devslab.dds.compose.icons.DdsIcon
import kr.devslab.dds.compose.icons.DdsIcons
import kr.devslab.dds.compose.theme.DdsTheme
import kr.devslab.dds.tokens.DdsBorder
import kr.devslab.dds.tokens.DdsField
import kr.devslab.dds.tokens.DdsSpace

/**
 * The one search field. A magnifier in front, a clear button once something
 * is typed, and the keyboard's search key runs the search.
 *
 * It has no label above and no message line: it is a tool at the top of a
 * list, not a form field. Use the same field on every screen that searches.
 *
 * @param label what is searched, for a screen reader ("Search customers")
 * @param placeholder shown in the empty field; the [label] unless given — a field with
 * nothing in it must still say what goes there
 * @param clearDescription what the clear button does, for a screen reader ("Clear")
 * @param onSearch called with the text when the keyboard's search key is pressed, or the apply button
 * @param applyDescription shows an apply button at the end and names it for a screen reader
 * ("Search"); null for a field that searches as you type
 * @param searchEnabled false while a search cannot be run (nothing changed, one is running):
 * the apply button is dimmed, typing and clearing still work
 */
@Composable
public fun DdsSearchField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    clearDescription: String,
    modifier: Modifier = Modifier,
    placeholder: String? = label,
    enabled: Boolean = true,
    onSearch: (String) -> Unit = {},
    applyDescription: String? = null,
    searchEnabled: Boolean = true,
) {
    val colors = DdsTheme.colors
    val interaction = remember { MutableInteractionSource() }
    val focused by interaction.collectIsFocusedAsState()
    val shape = MaterialTheme.shapes.small
    val textStyle = DdsTheme.typography.body1.copy(color = colors.textPrimary)
    val field = remember { FocusRequester() }
    BasicTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = modifier
            .fillMaxWidth()
            .focusRequester(field)
            .alpha(if (enabled) 1f else DISABLED_ALPHA),
        enabled = enabled,
        textStyle = textStyle,
        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
        keyboardActions = KeyboardActions(onSearch = { if (searchEnabled) onSearch(value) }),
        singleLine = true,
        interactionSource = interaction,
        cursorBrush = SolidColor(colors.textBrand),
        decorationBox = { innerTextField ->
            Row(
                Modifier
                    .defaultMinSize(minHeight = DdsField.height.dp)
                    .clip(shape)
                    .background(colors.bgDefault)
                    .border(
                        if (focused) DdsBorder.focus.dp else DdsBorder.hairline.dp,
                        if (focused) colors.borderFocus else colors.borderControl,
                        shape,
                    )
                    // The clear button is 48 to touch; 4 around it keeps the field at 56.
                    .padding(start = DdsSpace.s12.dp, end = DdsSpace.s4.dp),
                horizontalArrangement = Arrangement.spacedBy(DdsSpace.s8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                DdsIcon(DdsIcons.Search, contentDescription = null, tint = colors.textSecondary)
                Box(Modifier.weight(1f), contentAlignment = Alignment.CenterStart) {
                    // The field's name is text inside it — a description on an edit box can be read
                    // in place of what was typed. It is seen as the placeholder while the field is
                    // empty, and kept unseen otherwise.
                    val labelIsShown = value.isEmpty() && placeholder == label
                    if (!labelIsShown) {
                        Text(label, Modifier.alpha(0f), style = textStyle, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    }
                    if (value.isEmpty() && placeholder != null) {
                        Text(placeholder, style = textStyle, color = colors.textMuted, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    }
                    innerTextField()
                }
                // The slot stays, so the text does not jump when the button appears. The button
                // itself is only there when there is something to clear: an invisible button is
                // still a stop for a screen reader and for the keyboard.
                Box(Modifier.size(DdsTouch.min.dp)) {
                    if (value.isNotEmpty()) {
                        DdsIconButton(
                            DdsIcons.Close,
                            contentDescription = clearDescription,
                            onClick = {
                                onValueChange("")
                                field.requestFocus() // the button is about to go; keep the person in the field
                            },
                            enabled = enabled,
                            tint = colors.textSecondary,
                        )
                    }
                }
                if (applyDescription != null) {
                    DdsIconButton(
                        DdsIcons.ArrowRight,
                        contentDescription = applyDescription,
                        onClick = { onSearch(value) },
                        enabled = enabled && searchEnabled,
                        tint = colors.textBrand,
                    )
                }
            }
        },
    )
}

/**
 * The one field for choosing from a short list. It looks like
 * [DdsTextField] — label above, the same box, the same message line — and
 * opens a sheet with the options; the chosen one carries a check.
 *
 * @param options the choices, as shown; the app's words
 * @param selectedIndex the chosen option, or null when nothing is chosen yet
 * @param placeholder shown in the box while nothing is chosen
 */
@Composable
public fun DdsSelectField(
    label: String,
    options: List<String>,
    selectedIndex: Int?,
    onSelect: (Int) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String? = null,
    helper: String? = null,
    error: String? = null,
    enabled: Boolean = true,
) {
    val colors = DdsTheme.colors
    val typography = DdsTheme.typography
    val shape = MaterialTheme.shapes.small
    val interaction = remember { MutableInteractionSource() }
    var open by rememberSaveable { mutableStateOf(false) }
    val chosen = selectedIndex?.let(options::getOrNull)

    Column(modifier.alpha(if (enabled) 1f else DISABLED_ALPHA), verticalArrangement = Arrangement.spacedBy(DdsSpace.s4.dp)) {
        // Seen, not read: the box below carries the label, so it is said once.
        WordsText(label, Modifier.clearAndSetSemantics { }, style = typography.label, color = colors.textPrimary)
        Row(
            Modifier
                .fillMaxWidth()
                .defaultMinSize(minHeight = DdsField.height.dp)
                .clip(shape)
                .background(if (enabled) colors.bgDefault else colors.bgSubtle)
                .border(DdsBorder.hairline.dp, if (error != null) colors.statusDanger else colors.borderControl, shape)
                .ddsFocusRing(interaction, shape)
                .clickable(interaction, ripple(), enabled, role = Role.DropdownList) { open = true }
                .semantics {
                    contentDescription = label
                    // What is in the box, also when it is only the placeholder ("Select").
                    (chosen ?: placeholder)?.let { stateDescription = it }
                    if (error != null) error(error)
                }
                .padding(DdsSpace.s12.dp),
            horizontalArrangement = Arrangement.spacedBy(DdsSpace.s8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                chosen ?: placeholder.orEmpty(),
                Modifier.weight(1f),
                style = typography.body1,
                color = if (chosen != null) colors.textPrimary else colors.textMuted,
                maxLines = 2, // a chosen value cut to a few letters at large sizes tells nothing
                overflow = TextOverflow.Ellipsis,
            )
            DdsIcon(DdsIcons.ChevronDown, contentDescription = null, tint = colors.textSecondary)
        }
        FieldMessage(helper = helper, error = error)
    }

    if (open) {
        DdsBottomSheet(onDismissRequest = { open = false }, title = label) {
            options.forEachIndexed { index, option ->
                val selected = index == selectedIndex
                DdsListRow(
                    title = option,
                    onClick = {
                        open = false
                        onSelect(index)
                    },
                    modifier = Modifier.semantics { this.selected = selected },
                    trailing = {
                        // The slot stays so every row's text has the same width.
                        Box(Modifier.alpha(if (selected) 1f else 0f)) {
                            DdsIcon(DdsIcons.Check, contentDescription = null, tint = colors.textBrand)
                        }
                    },
                )
            }
        }
    }
}
