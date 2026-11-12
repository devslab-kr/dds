package kr.devslab.dds.compose.component

import androidx.compose.ui.semantics.contentDescription
import kr.devslab.dds.compose.R
import androidx.compose.ui.res.stringResource
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.MenuDefaults
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Snackbar
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import kr.devslab.dds.compose.icons.DdsIcon
import kr.devslab.dds.compose.theme.DdsTheme
import kr.devslab.dds.tokens.DdsBorder
import kr.devslab.dds.tokens.DdsRadius
import kr.devslab.dds.tokens.DdsSpace

/**
 * A sheet that comes up from the bottom: for choices and actions. Use a
 * [DdsDialog] to confirm a decision instead.
 *
 * It closes on back, on a tap outside and on a drag down. Its content scrolls
 * when it is taller than the screen.
 *
 * @param title what the sheet is for; read as a heading
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
public fun DdsBottomSheet(
    onDismissRequest: () -> Unit,
    modifier: Modifier = Modifier,
    title: String? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    val colors = DdsTheme.colors
    val handleWord = stringResource(R.string.dds_a11y_sheet_handle)
    ModalBottomSheet(
        onDismissRequest = onDismissRequest,
        modifier = modifier,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        shape = RoundedCornerShape(topStart = DdsRadius.xl.dp, topEnd = DdsRadius.xl.dp),
        containerColor = colors.bgElevated,
        contentColor = colors.textPrimary,
        tonalElevation = 0.dp,
        scrimColor = colors.overlayDim,
        dragHandle = {
            Box(
                Modifier
                    .padding(vertical = DdsSpace.s12.dp)
                    .size(width = DdsSpace.s32.dp, height = DdsSpace.s4.dp)
                    .clip(CircleShape)
                    .background(colors.borderStrong)
                    // The sheet puts its close action on the handle; without a name it is an
                    // unlabelled stop. Not "Close sheet": the area outside the sheet already
                    // has that name, and two stops must not sound the same.
                    .semantics { contentDescription = handleWord },
            )
        },
    ) {
        Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).navigationBarsPadding().padding(bottom = DdsSpace.s16.dp)) {
            if (title != null) {
                WordsText(
                    title,
                    Modifier.padding(horizontal = DdsSpace.s16.dp).padding(bottom = DdsSpace.s8.dp).semantics { heading() },
                    style = DdsTheme.typography.title3,
                    color = colors.textPrimary,
                )
            }
            content()
        }
    }
}

/** Which edge of its button a [DdsMenu] lines up with. */
public enum class DdsMenuAlign {
    /** The menu starts where its button starts and opens toward the end of the row. */
    Start,

    /**
     * The menu ends where its button ends and opens back toward the start: for
     * a "more" button at the end of a row or a pane, so the menu stays over
     * what it belongs to.
     */
    End,
}

/**
 * A short menu anchored to the control that opened it (the "more" button of a
 * row or a top bar). Put it in the same `Box` as that control.
 *
 * It has no shadow: like a card, a sheet and a dialog it is set apart by the
 * elevated face and a hairline edge.
 *
 * What is in the menu reads in the layout direction of the screen that opened it.
 *
 * @param modifier applied to the menu's own surface, which Material lays out
 * and which an end-aligned menu opens mirrored: give it nothing that names a
 * side (a width or a test tag is fine)
 * @param align which edge of the control the menu lines up with. When there is
 * no room in the window on that side, the menu lines up with the other edge,
 * and failing that with the edge of the window; it never leaves the window
 */
@Composable
public fun DdsMenu(
    expanded: Boolean,
    onDismissRequest: () -> Unit,
    modifier: Modifier = Modifier,
    align: DdsMenuAlign = DdsMenuAlign.Start,
    content: @Composable ColumnScope.() -> Unit,
) {
    val colors = DdsTheme.colors
    val direction = LocalLayoutDirection.current
    // Material places a menu on its anchor's start edge first, then on its end edge, then on
    // the window's. Opened in the opposite direction, "start" is the edge we were asked for,
    // and the fallbacks stay Material's.
    val opening = when (align) {
        DdsMenuAlign.Start -> direction
        DdsMenuAlign.End -> direction.opposite()
    }
    CompositionLocalProvider(LocalLayoutDirection provides opening) {
        DropdownMenu(
            expanded = expanded,
            onDismissRequest = onDismissRequest,
            modifier = modifier,
            shape = MaterialTheme.shapes.small,
            containerColor = colors.bgElevated,
            tonalElevation = 0.dp,
            shadowElevation = 0.dp,
            border = BorderStroke(DdsBorder.hairline.dp, colors.borderDefault),
        ) {
            // What is in the menu reads in the direction of the screen that opened it, whichever
            // way the menu opened. A column of its own, because Material's column is outside this
            // and lays its children out from its own start.
            CompositionLocalProvider(LocalLayoutDirection provides direction) {
                Column(Modifier.fillMaxWidth(), content = content)
            }
        }
    }
}

private fun LayoutDirection.opposite(): LayoutDirection = when (this) {
    LayoutDirection.Ltr -> LayoutDirection.Rtl
    LayoutDirection.Rtl -> LayoutDirection.Ltr
}

/**
 * One action of a [DdsMenu].
 *
 * @param danger true for an action that destroys something; it is drawn in the danger color
 */
@Composable
public fun DdsMenuItem(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    icon: ImageVector? = null,
    danger: Boolean = false,
    enabled: Boolean = true,
) {
    val colors = DdsTheme.colors
    val color = if (danger) colors.statusDanger else colors.textPrimary
    DropdownMenuItem(
        text = { Text(text, style = DdsTheme.typography.body1) },
        onClick = onClick,
        modifier = modifier,
        leadingIcon = icon?.let { { DdsIcon(it, contentDescription = null) } },
        enabled = enabled,
        colors = MenuDefaults.itemColors(textColor = color, leadingIconColor = color),
    )
}

/**
 * A hairline between two groups of a [DdsMenu], in `border.default`, with a
 * little space above and below. Put one before an action that destroys
 * something. A screen reader does not stop on it.
 */
@Composable
public fun DdsMenuDivider(modifier: Modifier = Modifier) {
    HorizontalDivider(
        modifier.padding(vertical = DdsSpace.s4.dp),
        thickness = DdsBorder.hairline.dp,
        color = DdsTheme.colors.borderDefault,
    )
}

/**
 * Where short messages about something that just happened appear ("Saved",
 * "Sent"). Place it once, at the bottom of the screen, and show a message with
 * `state.showSnackbar(...)`.
 *
 * A toast leaves by itself, so never use it for something the person must
 * read or act on — that is a [DdsNotice] in the page or a [DdsDialog].
 */
@Composable
public fun DdsToastHost(state: SnackbarHostState, modifier: Modifier = Modifier) {
    val colors = DdsTheme.colors
    SnackbarHost(state, modifier) { data ->
        Snackbar(
            snackbarData = data,
            shape = MaterialTheme.shapes.small,
            containerColor = colors.bgInverse,
            contentColor = colors.textOnInverse,
            actionColor = MaterialTheme.colorScheme.inversePrimary,
            dismissActionContentColor = colors.textOnInverse,
        )
    }
}
