package kr.devslab.dds.compose.motion

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.tween
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext

/** How long item [index] waits before appearing: one step each, capped so a long list does not trickle. */
internal fun staggerDelayMs(index: Int): Int =
    index.coerceIn(0, DdsMotion.StaggerLimit) * DdsMotion.StaggerStep

/**
 * Lets an item appear (opacity only — it does not move or grow).
 *
 * In a list pass the item's position as [index] so items arrive one after
 * another. Pass a [key] to play it again when what the item shows is replaced
 * (a notice whose message changed).
 *
 * It plays once per [key]: an item that scrolls out of a lazy list and back,
 * or a screen that is rotated, does not fade in a second time. With reduced
 * motion the item is simply there.
 */
public fun Modifier.ddsAppear(index: Int = 0, key: Any? = Unit): Modifier = composed {
    val context = LocalContext.current
    var appeared by rememberSaveable(key) { mutableStateOf(false) }
    val alpha = remember(key) { Animatable(if (appeared || isReducedMotion(context)) 1f else 0f) }
    LaunchedEffect(alpha) {
        if (alpha.value < 1f) {
            alpha.animateTo(1f, tween(DdsMotion.Short, delayMillis = staggerDelayMs(index), easing = LinearEasing))
        }
        appeared = true
    }
    graphicsLayer { this.alpha = alpha.value }
}
