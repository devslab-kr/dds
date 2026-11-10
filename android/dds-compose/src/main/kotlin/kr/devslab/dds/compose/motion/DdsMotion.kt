package kr.devslab.dds.compose.motion

import android.content.Context
import android.provider.Settings
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.Easing
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.LifecycleResumeEffect
import kr.devslab.dds.tokens.DdsEasingToken
import kr.devslab.dds.tokens.DdsMotionTokens

/**
 * The only durations and curves a screen may use. Movement says what changed;
 * it is never decoration.
 *
 *   Fast   100ms  leaving, press feedback
 *   Short  150ms  switching tabs, list items appearing, progress
 *   Base   200ms  going back, expand and collapse, dialogs
 *   Slow   300ms  a new screen, sheets, the logo travelling
 *
 * Nothing overshoots or springs, and pressing never changes size or position.
 */
public object DdsMotion {
    public const val Fast: Int = DdsMotionTokens.fastMs
    public const val Short: Int = DdsMotionTokens.shortMs
    public const val Base: Int = DdsMotionTokens.baseMs
    public const val Slow: Int = DdsMotionTokens.slowMs

    /** Arriving, and changes inside a screen. */
    public val Standard: Easing = DdsMotionTokens.standard.toEasing()

    /** Leaving. */
    public val Exit: Easing = DdsMotionTokens.exit.toEasing()

    /** Something that was standing still starting to move (the splash mark): a slow start so it does not jump. */
    public val Travel: Easing = DdsMotionTokens.travel.toEasing()

    /** How far a screen's content slides when it arrives. */
    public val Shift: Dp = DdsMotionTokens.shift.dp

    /** Delay between list items as they appear. */
    public const val StaggerStep: Int = DdsMotionTokens.staggerStepMs

    /** Only the first this-many items are delayed, so a long list does not trickle. */
    public const val StaggerLimit: Int = DdsMotionTokens.staggerLimit
}

private fun DdsEasingToken.toEasing(): Easing = CubicBezierEasing(x1, y1, x2, y2)

/**
 * Whether the person turned animations off (Settings → Accessibility → Remove
 * animations, or animator duration scale 0 in developer options).
 *
 * Compose already finishes its own animations instantly at scale 0. This is
 * for the decisions Compose cannot make for you: do not hold the splash, do
 * not stagger, do not slide.
 */
public fun isReducedMotion(context: Context): Boolean =
    Settings.Global.getFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f

/** [isReducedMotion], read again every time the screen comes back to the front. */
@Composable
public fun rememberReducedMotion(): Boolean {
    val context = LocalContext.current
    var reduced by remember { mutableStateOf(isReducedMotion(context)) }
    LifecycleResumeEffect(context) {
        reduced = isReducedMotion(context)
        onPauseOrDispose { }
    }
    return reduced
}
