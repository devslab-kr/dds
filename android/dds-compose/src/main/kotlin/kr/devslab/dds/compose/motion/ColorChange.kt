package kr.devslab.dds.compose.motion

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.runtime.Composable
import androidx.compose.runtime.State
import androidx.compose.ui.graphics.Color

/**
 * A color that changes over [DdsMotion.Fast] instead of at once — for being
 * chosen, pressed or focused. The web's `motion.duration.fast`, which the web
 * uses for a chip, a button and a tab; a field's edge eases on Android only.
 *
 * Give "no color" as the other color with alpha 0 ([clear]), not as
 * `Color.Transparent`: that one is black underneath, and the way there passes
 * through grey.
 */
@Composable
internal fun colorChange(target: Color): State<Color> =
    animateColorAsState(target, tween(DdsMotion.Fast, easing = DdsMotion.Standard), label = "color change")

/** This color, not there: what a fill fades to and from. */
internal fun Color.clear(): Color = copy(alpha = 0f)
