package kr.devslab.dds.compose.layout

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.wrapContentWidth
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.ScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import kr.devslab.dds.compose.motion.ddsScreenContent
import kr.devslab.dds.tokens.DdsScreen

/**
 * Marks a column as the body of a screen: it grows to [max] and no further, and carries the
 * test tag [DdsTestTags.Body] so a test can find and measure it. It does not fill the width
 * by itself; [DdsBodyColumn] does that.
 *
 * @param max the widest the body gets; [DdsScreen.bodyMax] by default
 */
public fun Modifier.ddsBody(max: Dp = DdsScreen.bodyMax.dp): Modifier =
    this.widthIn(max = max).testTag(DdsTestTags.Body)

/**
 * Gives something that is not in the body column (a bar, a divider, a banner) the same left
 * and right edges as the text in the body: as wide as the body at most, and the window's
 * gutter in from each side. Put it where the body is, centered the same way.
 *
 * @param max the widest the body gets; [DdsScreen.bodyMax] by default
 */
public fun Modifier.ddsBodyLines(max: Dp = DdsScreen.bodyMax.dp): Modifier = composed {
    val gutter = ddsFrame().width.gutter
    this.widthIn(max = max).fillMaxWidth().padding(horizontal = gutter)
}

/** The default values of [DdsBodyColumn]. */
public object DdsBodyDefaults {
    /** The window's gutter on all four sides: the start line of everything in the body. */
    @Composable
    public fun contentPadding(): PaddingValues = PaddingValues(ddsFrame().width.gutter)
}

/**
 * The column every screen's content goes in. It is centered in the area the frame leaves for
 * the screen, no wider than [max], so on a wide window the text keeps one reading line and on a
 * phone it fills the width. It scrolls, from anywhere in that area (also the room beside the
 * column on a wide window), and it slides in when the screen arrives (it applies
 * [ddsScreenContent] itself, with [paneTitle]; do not add it again).
 *
 * The text starts [contentPadding] in from the column's edge, which is the window gutter. Items
 * that sit outside the column but should line up with its text use [ddsBodyLines].
 *
 * @param scroll the scroll state, so a screen can keep or restore its position
 * @param max the widest the column gets; [DdsScreen.bodyMax] by default
 * @param spacing the gap between the blocks; [DdsScreen.blockGap] by default
 * @param contentPadding the space between the column's edge and what is in it
 * @param paneTitle the name of the screen, which a screen reader says when the screen arrives;
 * pass the same words as the top bar's title (see [ddsScreenContent])
 */
@Composable
public fun DdsBodyColumn(
    modifier: Modifier = Modifier,
    scroll: ScrollState = rememberScrollState(),
    max: Dp = DdsScreen.bodyMax.dp,
    spacing: Dp = DdsScreen.blockGap.dp,
    contentPadding: PaddingValues = DdsBodyDefaults.contentPadding(),
    paneTitle: String? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    // The whole area scrolls, not only the column in its middle: on a wide window a drag that
    // starts in the room beside the column moves the body too. The area passes its height down as
    // the column's least, so a short body is as tall as the area and a weighted spacer in it fills
    // what is left, as it did when the column itself scrolled. Only the height: the least width is
    // let go of (wrapContentWidth), or it would override the column's [max].
    Box(
        modifier.fillMaxSize().ddsScreenContent(paneTitle).verticalScroll(scroll),
        propagateMinConstraints = true,
    ) {
        Column(
            Modifier
                .wrapContentWidth(Alignment.CenterHorizontally)
                .ddsBody(max)
                .fillMaxWidth()
                .padding(contentPadding),
            verticalArrangement = Arrangement.spacedBy(spacing),
            content = content,
        )
    }
}
