package kr.devslab.dds.compose.motion

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.tween
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.graphics.graphicsLayer

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
 * With reduced motion the item is simply there.
 */
public fun Modifier.ddsAppear(index: Int = 0, key: Any? = Unit): Modifier = composed {
    val reduced = rememberReducedMotion()
    val alpha = remember(key) { Animatable(if (reduced) 1f else 0f) }
    LaunchedEffect(alpha) {
        if (alpha.value < 1f) {
            alpha.animateTo(1f, tween(DdsMotion.Short, delayMillis = staggerDelayMs(index), easing = LinearEasing))
        }
    }
    graphicsLayer { this.alpha = alpha.value }
}
