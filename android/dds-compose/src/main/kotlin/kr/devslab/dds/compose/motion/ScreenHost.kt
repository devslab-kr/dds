package kr.devslab.dds.compose.motion

import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.getValue
import androidx.compose.ui.input.pointer.PointerInputScope
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedContentTransitionScope
import androidx.compose.animation.ContentTransform
import androidx.compose.animation.EnterTransition
import androidx.compose.animation.ExitTransition
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.clearAndSetSemantics
import kr.devslab.dds.compose.theme.DdsTheme

/** How high the screen showing now is drawn; it moves once for every change of screen. */
private class ScreenStack<T>(private var screen: T) {
    var level = 0f
        private set

    fun moveTo(next: T, move: DdsMove) {
        if (next == screen) return
        level += if (move == DdsMove.Pop) -1f else 1f
        screen = next
    }
}

/** Takes every touch before anything inside can: what is under this is not for touching now. */
private suspend fun PointerInputScope.takeEveryTouch() {
    awaitPointerEventScope {
        while (true) awaitPointerEvent(PointerEventPass.Initial).changes.forEach { it.consume() }
    }
}

/**
 * How long a screen takes to appear over the one before it in [DdsScreenHost], in ms.
 * A tab is a change of place with nothing travelling, so the fade is all there is and
 * is a little longer; forward and back also slide, and the fade only softens the start.
 */
internal fun hostFadeMs(move: DdsMove, reduced: Boolean): Int =
    if (reduced) {
        0
    } else {
        when (move) {
            DdsMove.None -> 0
            DdsMove.Push, DdsMove.Pop -> DdsMotion.Fast
            DdsMove.Tab -> DdsMotion.Short
        }
    }

/**
 * How one screen gives way to the next, for Navigation 3's `NavDisplay`
 * (`transitionSpec`, `popTransitionSpec`, `predictivePopTransitionSpec`).
 * [DdsScreenHost] uses the same.
 *
 *   Forward, Tab  the new screen appears over the one before (100ms, a tab 150ms),
 *                 which stays fully drawn underneath until it is covered
 *   Back          the screen being left fades away (100ms) over the one returned to,
 *                 which is already fully there underneath
 *   None          at once
 *
 * Either way every frame is a mix of the two screens and none is empty — as long
 * as each screen covers what is under it. Give every screen a background (a
 * scaffold does), and do not empty a screen while it is still leaving.
 *
 * Back is the other way round because that is how `NavDisplay` stacks screens: a
 * screen returned to is placed under the one leaving. In a plain `AnimatedContent`
 * the screen returned to has to be placed there too (`targetContentZIndex`), as
 * [DdsScreenHost] does.
 *
 * ```
 * val reduced = rememberReducedMotion()
 * NavDisplay(
 *     backStack = backStack,
 *     transitionSpec = { ddsScreenChange(move, reduced) },   // Push, or Tab
 *     popTransitionSpec = { ddsScreenChange(DdsMove.Pop, reduced) },
 *     predictivePopTransitionSpec = { ddsScreenChange(DdsMove.Pop, reduced) },
 *     entryProvider = …,                                     // each entry in DdsScreenMotion(move)
 * )
 * ```
 *
 * The slide of the content is not part of this; it stays with [DdsScreenMotion]
 * and [ddsScreenContent].
 *
 * It is called inside the host's transition spec (the receiver), as above: keeping a
 * screen until the change is over is something only the host's own scope offers.
 *
 * @param reduced the person turned animations off: [rememberReducedMotion]
 */
public fun AnimatedContentTransitionScope<*>.ddsScreenChange(move: DdsMove, reduced: Boolean): ContentTransform {
    val fade = hostFadeMs(move, reduced)
    return when {
        fade == 0 -> ContentTransform(EnterTransition.None, ExitTransition.None, sizeTransform = null)
        move == DdsMove.Pop ->
            ContentTransform(EnterTransition.None, fadeOut(tween(fade, easing = LinearEasing)), sizeTransform = null)
        else ->
            ContentTransform(fadeIn(tween(fade, easing = LinearEasing)), ExitTransition.KeepUntilTransitionsFinished, sizeTransform = null)
    }
}

/**
 * Shows one screen at a time and changes between them without an empty frame:
 * the screen before stays where it is, fully drawn, while the new one appears
 * over it, and is taken away only once the new one covers it.
 *
 * That is what lets a screen fade in. A screen that fades in over nothing is an
 * empty page for its first frames (see [DdsScreenMotion]); over the screen
 * before, every frame is a mix of the two.
 *
 *   Forward  appears over 100ms, content slides 24dp from the trailing edge, 300ms
 *   Back     the screen left fades away over 100ms, content slides 24dp from the leading edge, 200ms
 *   Tab      appears over 150ms, nothing slides
 *   None     is simply there
 *
 * Mark the part of each screen that slides with [ddsScreenContent]; bars that are
 * the same on both screens do not visibly change, because the same pixels are
 * drawn over themselves. With reduced motion every change is at once.
 *
 * Use it where the app changes screens itself, in place of
 * `key(screen) { DdsScreenMotion(move) { … } }`; do not wrap the content in
 * [DdsScreenMotion] as well. An app whose screens are changed by Navigation 3
 * keeps its `NavDisplay` and gives it [ddsScreenChange] instead.
 *
 * The screen that is leaving is still composed until the change is over. It
 * cannot be touched and is hidden from a screen reader, and
 * [LocalDdsScreenActive] is false in it — read that before starting a load or a
 * subscription. Then it leaves the composition, and what it `remember`ed goes
 * with it: keep scroll positions above the host, per screen, as before.
 *
 * The first screen, and a screen restored after a rotation, do not arrive.
 *
 * @param screen what is shown; a different value is a different screen. It is
 * compared with `==`
 * @param move how the person got to [screen]; read when [screen] changes
 * @param background painted behind each screen, so that a screen with no
 * background of its own still covers the one before
 */
@Composable
public fun <T : Any> DdsScreenHost(
    screen: T,
    move: DdsMove,
    modifier: Modifier = Modifier,
    background: Color = DdsTheme.colors.bgDefault,
    content: @Composable (screen: T) -> Unit,
) {
    val context = LocalContext.current
    // Forward and tab go one above the screen before; back goes one under the screen left,
    // which then fades away over it. The same order Navigation 3 keeps.
    val stack = remember { ScreenStack(screen) }
    stack.moveTo(screen, move)
    // The host works a change out when it gets to it, which can be after the call that
    // started it (a change turned back half-way): it must read the move as it is then.
    val latestMove by rememberUpdatedState(move)
    // How many screens this host has shown; the first one does not arrive.
    val shownSoFar = remember { intArrayOf(0) }
    AnimatedContent(
        targetState = screen,
        modifier = modifier,
        transitionSpec = {
            val change = ddsScreenChange(latestMove, isReducedMotion(context))
            ContentTransform(change.targetContentEnter, change.initialContentExit, targetContentZIndex = stack.level, sizeTransform = null)
        },
        label = "DdsScreenHost",
    ) { shown ->
        val spec = remember {
            val first = shownSoFar[0]++ == 0
            enterSpec(if (first) DdsMove.None else move, isReducedMotion(context))
        }
        // The host fades the whole screen in; only the slide is left to the content.
        val enter = remember {
            ScreenEnter(alpha = Animatable(1f), slide = Animatable(if (spec.slideMs == 0) 1f else 0f), shiftSign = spec.shiftSign)
        }
        LaunchedEffect(enter) {
            if (spec.slideMs > 0) enter.slide.animateTo(1f, tween(spec.slideMs, easing = DdsMotion.Standard))
        }
        val current = shown == screen
        CompositionLocalProvider(LocalScreenEnter provides enter, LocalDdsScreenActive provides current) {
            Box(
                Modifier
                    .fillMaxSize()
                    .background(background)
                    .then(
                        if (current) {
                            // A touch on an empty part of this screen stops here instead of reaching the one underneath.
                            Modifier.pointerInput(Unit) { }
                        } else {
                            // Leaving: nothing in it can be touched or read. Going back it is the one on
                            // top while it fades, so being underneath is not what keeps a finger off it.
                            Modifier.pointerInput(Unit) { takeEveryTouch() }.clearAndSetSemantics { }
                        },
                    ),
            ) {
                content(shown)
            }
        }
    }
}
