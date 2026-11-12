package kr.devslab.dds.compose.layout

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import kr.devslab.dds.compose.component.WordsText
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.LineBreak
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import kr.devslab.dds.compose.theme.DdsTheme
import kr.devslab.dds.tokens.DdsScreen
import kr.devslab.dds.tokens.DdsSpace

/**
 * The whole of a screen that has one thing to do: signing in, unlocking, a first question.
 * What is in it stands as one block in the very middle of the area it is given, no wider than
 * [max], with its pieces centered. A block left in a corner of a wide window reads as a screen
 * that has not finished loading.
 *
 * The block keeps the window's gutter at its sides and [DdsScreen.blockGap] above and below.
 * When it is taller than the area (large text, a small window) it starts at the top and scrolls,
 * so nothing is cut off above the window.
 *
 * It works inside [DdsAppFrame] (with `navigation = false`) and with no frame at all. It draws no
 * background and no bars of its own.
 *
 * @param modifier applied to the area the block is centered in, which fills what it is given
 * @param max the widest the block gets; [DdsScreen.centeredMax] by default
 * @param content the pieces of the block, top to bottom
 */
@Composable
public fun DdsCenteredColumn(
    modifier: Modifier = Modifier,
    max: Dp = DdsScreen.centeredMax.dp,
    content: @Composable ColumnScope.() -> Unit,
) {
    val gutter = ddsFrame().width.gutter
    Box(modifier.fillMaxSize().testTag(DdsTestTags.CenteredArea)) {
        // The scrolling column is at least as tall as the area, so a short block is arranged in its
        // middle; a block taller than the area makes the column taller and it starts at the top.
        Column(
            Modifier
                .fillMaxWidth()
                .fillMaxHeight()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = gutter, vertical = DdsScreen.blockGap.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Column(
                Modifier.widthIn(max = max).fillMaxWidth().testTag(DdsTestTags.Centered),
                horizontalAlignment = Alignment.CenterHorizontally,
                content = content,
            )
        }
    }
}

/**
 * The title of a centered block ([DdsCenteredColumn]), and one sentence under it.
 *
 * The title is centered and its lines are made about the same length, so the last line is never
 * a single word. A line break written into [title] is kept. A screen reader reads the title and
 * the sentence as one heading.
 *
 * @param title the title; may hold line breaks
 * @param description one sentence under the title, in the secondary text color
 */
@Composable
public fun DdsCenteredTitle(title: String, modifier: Modifier = Modifier, description: String? = null) {
    val colors = DdsTheme.colors
    Column(
        modifier.fillMaxWidth().semantics(mergeDescendants = true) { heading() },
        verticalArrangement = Arrangement.spacedBy(DdsSpace.s8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        WordsText(
            title,
            style = DdsTheme.typography.title1.copy(lineBreak = LineBreak.Heading),
            color = colors.textPrimary,
            textAlign = TextAlign.Center,
        )
        if (description != null) {
            WordsText(
                description,
                style = DdsTheme.typography.body2,
                color = colors.textSecondary,
                textAlign = TextAlign.Center,
            )
        }
    }
}
