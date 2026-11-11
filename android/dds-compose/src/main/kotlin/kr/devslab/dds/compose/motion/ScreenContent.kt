package kr.devslab.dds.compose.motion

import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.tween
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.ProvidableCompositionLocal
import androidx.compose.runtime.Stable
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import kotlinx.coroutines.launch

/** How the person got to a screen. */
public enum class DdsMove {
    /** No movement: first screen, or the account or workspace changed underneath. */
    None,

    /** Forward to a new screen. */
    Push,

    /** Back to the previous screen. */
    Pop,

    /**
     * Sideways to another tab: no movement. The previous tab is removed at once,
     * so content fading in would fade in over an empty page — on a device that
     * reads as a flicker on every tab press, not as a transition.
     */
    Tab,
}

/** Fade and slide lengths in ms, and which side the content comes from (+1 trailing, -1 leading, 0 none). */
internal data class EnterSpec(val fadeMs: Int, val slideMs: Int, val shiftSign: Int)

/**
 * Push comes from the trailing edge, pop from the leading edge, a tab is
 * simply there. With reduced motion nothing moves.
 *
 * Nothing fades. Content that starts transparent is an empty page for its
 * first frames: on a phone a 100ms fade showed the top bar over a blank
 * content area for about eight frames before the screen appeared. The content
 * is opaque from its first frame and only slides.
 */
internal fun enterSpec(move: DdsMove, reduced: Boolean): EnterSpec =
    if (reduced) {
        EnterSpec(0, 0, 0)
    } else {
        when (move) {
            DdsMove.None -> EnterSpec(0, 0, 0)
            DdsMove.Push -> EnterSpec(0, DdsMotion.Slow, 1)
            DdsMove.Pop -> EnterSpec(0, DdsMotion.Base, -1)
            DdsMove.Tab -> EnterSpec(0, 0, 0)
        }
    }

@Stable
internal class ScreenEnter(val alpha: Animatable<Float, *>, val slide: Animatable<Float, *>, val shiftSign: Int)

internal val LocalScreenEnter = compositionLocalOf<ScreenEnter?> { null }

/**
 * False for a screen that is on its way out: still drawn until the navigation
 * host swaps it, but no longer the current one. Read it before starting work
 * that belongs to the current screen only — a load, a subscription, a
 * connection to a shared model. Set through [DdsScreenMotion]'s `active`.
 */
public val LocalDdsScreenActive: ProvidableCompositionLocal<Boolean> = compositionLocalOf { true }

/**
 * Plays the arrival of one screen. Wrap each navigation entry in it and pass
 * how the person got there; mark the part that should move with
 * [ddsScreenContent].
 *
 * Only the content moves. The top bar, the title and the bottom tabs stay
 * still, and the navigation host gets no transition of its own.
 *
 * Do not blank a screen that is leaving. A host takes a few frames to swap
 * entries; an entry emptied in that time shows as a blank screen — bars and
 * all — and in dark as a white flash. Keep drawing it and pass
 * `active = false`, which children read from [LocalDdsScreenActive] to stop
 * starting work.
 *
 * [move] is read once, when the entry first appears; after a rotation or a
 * restore the screen does not arrive a second time.
 *
 * @param active false once this entry is no longer the current one
 */
@Composable
public fun DdsScreenMotion(move: DdsMove, active: Boolean = true, content: @Composable () -> Unit) {
    val context = LocalContext.current
    // Saved, so a rotated or restored screen is simply there instead of arriving again.
    var arrived by rememberSaveable { mutableStateOf(false) }
    val spec = remember { enterSpec(if (arrived) DdsMove.None else move, isReducedMotion(context)) }
    val enter = remember {
        ScreenEnter(
            alpha = Animatable(if (spec.fadeMs == 0) 1f else 0f),
            slide = Animatable(if (spec.slideMs == 0) 1f else 0f),
            shiftSign = spec.shiftSign,
        )
    }
    LaunchedEffect(enter) {
        if (spec.fadeMs > 0) launch { enter.alpha.animateTo(1f, tween(spec.fadeMs, easing = LinearEasing)) }
        if (spec.slideMs > 0) launch { enter.slide.animateTo(1f, tween(spec.slideMs, easing = DdsMotion.Standard)) }
        arrived = true
    }
    CompositionLocalProvider(LocalScreenEnter provides enter, LocalDdsScreenActive provides active, content = content)
}

/**
 * Marks the content area of a screen as the part that arrives (see
 * [DdsScreenMotion]). Put it on the scrolling body, not on the scaffold.
 *
 * @param paneTitle the name of the screen. A change of screen is something seen;
 * with a title a screen reader says where the person now is. Pass the same words
 * as the top bar's title
 */
public fun Modifier.ddsScreenContent(paneTitle: String? = null): Modifier = composed {
    val named = if (paneTitle != null) semantics { this.paneTitle = paneTitle } else this
    val enter = LocalScreenEnter.current ?: return@composed named
    val shiftPx = with(LocalDensity.current) { DdsMotion.Shift.toPx() }
    val direction = if (LocalLayoutDirection.current == LayoutDirection.Rtl) -1 else 1
    named.graphicsLayer {
        alpha = enter.alpha.value
        translationX = (1f - enter.slide.value) * shiftPx * enter.shiftSign * direction
    }
}
