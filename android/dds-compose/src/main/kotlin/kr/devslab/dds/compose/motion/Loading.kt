package kr.devslab.dds.compose.motion

import androidx.compose.ui.semantics.semantics
import kr.devslab.dds.compose.R
import androidx.compose.ui.res.stringResource
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.pulltorefresh.PullToRefreshDefaults
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.withTimeoutOrNull
import kr.devslab.dds.compose.theme.DdsTheme
import kr.devslab.dds.tokens.DdsBorder
import kr.devslab.dds.tokens.DdsSpace

/**
 * The "working" bar for a screen. Put it in a `Box` over the content: it is
 * drawn on top, so work starting or finishing never pushes the content down.
 * It appears in [DdsMotion.Short] and leaves in [DdsMotion.Fast].
 *
 * Do not show it while a pull-to-refresh indicator is already showing the
 * same work (see [DdsPullRefresh]'s `onPulling`).
 *
 * @param description what a screen reader says when the bar appears; "Loading" in the
 * device language when null
 */
@Composable
public fun DdsBusyBar(busy: Boolean, modifier: Modifier = Modifier, description: String? = null) {
    val word = description ?: stringResource(R.string.dds_a11y_loading)
    AnimatedVisibility(
        visible = busy,
        modifier = modifier.fillMaxWidth(),
        enter = fadeIn(tween(DdsMotion.Short, easing = DdsMotion.Standard)),
        exit = fadeOut(tween(DdsMotion.Fast, easing = DdsMotion.Exit)),
    ) {
        LinearProgressIndicator(
            modifier = Modifier.fillMaxWidth().semantics {
                contentDescription = word
                liveRegion = LiveRegionMode.Polite
            },
            color = DdsTheme.colors.textBrand,
            trackColor = DdsTheme.colors.borderDefault,
        )
    }
}

/**
 * Still placeholders for a first load, so "nothing here" or "not found" never
 * shows before the answer arrives. They do not shimmer or pulse: a placeholder
 * that moves reads as content loading in pieces.
 *
 * @param description what a screen reader announces instead of the blocks
 * (for example "Loading"); the app supplies it in its own language
 * @param rows how many rows to hold the place of
 */
@Composable
public fun DdsLoadingRows(description: String, modifier: Modifier = Modifier, rows: Int = 3) {
    val block = DdsTheme.colors.overlayPressedTint
    val shape = MaterialTheme.shapes.extraSmall
    Column(
        modifier
            .fillMaxWidth()
            .clearAndSetSemantics {
                contentDescription = description
                liveRegion = LiveRegionMode.Polite
            },
    ) {
        repeat(rows) { index ->
            Column(
                Modifier.fillMaxWidth().padding(DdsSpace.s16.dp),
                verticalArrangement = Arrangement.spacedBy(DdsSpace.s12.dp),
            ) {
                Box(Modifier.fillMaxWidth(TITLE_FRACTION).height(DdsSpace.s20.dp).background(block, shape))
                Box(Modifier.fillMaxWidth(DETAIL_FRACTION).height(DdsSpace.s12.dp).background(block, shape))
                Box(Modifier.width(DdsSpace.s64.dp).height(DdsSpace.s20.dp).background(block, shape))
            }
            if (index < rows - 1) {
                HorizontalDivider(
                    Modifier.padding(horizontal = DdsSpace.s16.dp),
                    thickness = DdsBorder.hairline.dp,
                    color = DdsTheme.colors.borderDefault,
                )
            }
        }
    }
}

private const val TITLE_FRACTION = 0.55f
private const val DETAIL_FRACTION = 0.3f

/**
 * Pull to refresh that follows the work it started.
 *
 * Pulling does what the screen's own refresh button does — keep the button for
 * anyone who does not pull. The indicator stays until that work has really
 * ended ([busy] went true and came back to false), never for a fixed time.
 * While the screen is already busy, or [allowed] is false, a pull is ignored.
 *
 * @param busy whether the screen is doing the work a refresh starts
 * @param onRefresh starts that work; null turns pulling off (the content is laid out the same)
 * @param allowed false while a pull should be ignored (a menu is open, the screen is blocked)
 * @param onPulling told while the pull indicator is showing, so the screen can
 * hide its [DdsBusyBar] and not show the same work twice
 *
 * A pull is a drag, and a screen reader cannot be given the same thing here: an
 * action on this container would sit on something it never stops on. The
 * screen's own refresh button is how someone who cannot pull refreshes.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
public fun DdsPullRefresh(
    busy: Boolean,
    onRefresh: (() -> Unit)?,
    modifier: Modifier = Modifier,
    allowed: Boolean = true,
    onPulling: (Boolean) -> Unit = {},
    content: @Composable BoxScope.() -> Unit,
) {
    if (onRefresh == null) {
        Box(modifier.fillMaxSize(), contentAlignment = Alignment.TopCenter, content = content)
        return
    }
    var pulled by remember { mutableStateOf(false) }
    val currentBusy by rememberUpdatedState(busy)
    val currentOnPulling by rememberUpdatedState(onPulling)
    LaunchedEffect(pulled) {
        currentOnPulling(pulled)
        if (pulled) {
            // Wait for the work to begin (it may not start in the same frame), then for it to end.
            withTimeoutOrNull(START_WAIT_MS) { snapshotFlow { currentBusy }.first { it } }
            snapshotFlow { currentBusy }.first { !it }
            pulled = false
        }
    }
    val state = rememberPullToRefreshState()
    PullToRefreshBox(
        isRefreshing = pulled,
        onRefresh = {
            if (!busy && allowed) {
                pulled = true
                onRefresh()
            }
        },
        modifier = modifier.fillMaxSize(),
        state = state,
        contentAlignment = Alignment.TopCenter,
        indicator = {
            PullToRefreshDefaults.Indicator(
                state = state,
                isRefreshing = pulled,
                modifier = Modifier.align(Alignment.TopCenter),
                containerColor = DdsTheme.colors.bgElevated,
                color = DdsTheme.colors.textBrand,
            )
        },
        content = content,
    )
}

// How long a pull waits for the work to report that it started before it
// treats the work as already over.
private const val START_WAIT_MS: Long = 5L * DdsMotion.Base
