package kr.devslab.dds.compose.motion

import android.os.Build
import android.view.View
import android.window.SplashScreenView
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.ProvidableCompositionLocal
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import kotlinx.coroutines.delay
import kr.devslab.dds.tokens.DdsMotionTokens

/**
 * Carries the app mark from the system splash to where it lives on the first
 * screen, so the launch reads as one movement instead of a cut.
 *
 * The sequence: the system splash shows the mark (and may draw it) → the app
 * draws the same mark at the same place, size and color on top of its first
 * screen → the mark travels to its destination ([ddsSplashTarget]) while the
 * cover fades.
 *
 * Create one per Activity, in `onCreate`:
 *
 * ```
 * val handoff = DdsSplashHandoff(
 *     active = savedInstanceState == null,          // not after rotation
 *     reduced = isReducedMotion(this),
 *     createdAt = SystemClock.uptimeMillis(),
 *     drawMs = 800,                                 // the length of your splash drawable
 * )
 * installSplashScreen().apply {
 *     // Keep the system splash itself until the drawing is over …
 *     setKeepOnScreenCondition { handoff.keepOnScreen(SystemClock.uptimeMillis()) }
 *     // … and drop its hand-over copy at once: that copy can show a frame without the mark.
 *     setOnExitAnimationListener { provider ->
 *         val shown = splashShowedMark(provider.view)   // no icon when not opened from the launcher
 *         provider.remove()
 *         handoff.release(markShown = shown)
 *     }
 * }
 * ```
 *
 * The mark itself — its shape and color — belongs to the app and is passed
 * to [DdsSplashOverlay].
 *
 * @param active false when the Activity is being recreated: the handoff then starts finished
 * @param reduced the person turned animations off: never hold the splash, never travel
 * @param createdAt a monotonic clock reading (ms) taken when the Activity was created
 * @param drawMs how long the splash drawable takes to draw itself
 * @param holdMs pause on the finished mark before it moves
 * @param keepLimitMs the longest the splash may be held, measured from the first
 * time the system asked — a slow start is never made slower than this
 */
@Stable
public class DdsSplashHandoff(
    active: Boolean,
    internal val reduced: Boolean,
    private val createdAt: Long,
    private val drawMs: Int,
    private val holdMs: Int = DdsMotionTokens.splashHoldMs,
    internal val keepLimitMs: Int = DdsMotionTokens.splashKeepLimitMs,
) {
    /** Where the handoff is. */
    public enum class Phase {
        /** The system splash is still on screen. */
        Hold,

        /** The mark is travelling (or fading) and the cover is lifting. */
        Move,

        /** Finished — nothing is drawn any more. */
        Done,
    }

    public var phase: Phase by mutableStateOf(if (active) Phase.Hold else Phase.Done)
        private set

    /** False once the overlay has decided to fade in place: the destination then shows itself. */
    internal var hidesLanding: Boolean by mutableStateOf(true)

    private var readyAt: Long? = null

    // Each place records who claimed it, so a screen that leaves late cannot
    // erase the claim of the screen that replaced it.
    private val targets = mutableStateMapOf<Int, Pair<Any, Rect>>()

    /**
     * Answer for `SplashScreen.setKeepOnScreenCondition`: keep the system
     * splash until its drawing and the pause are over, but never longer than
     * [keepLimitMs] after the first frame was ready.
     *
     * @param now the same monotonic clock as `createdAt`
     * @param firstScreenKnown false while the app does not yet know which
     * screen comes first (it is still reading the session). The splash is then
     * held — within the same limit — so the mark has a place to travel to
     * instead of fading for lack of one
     */
    public fun keepOnScreen(now: Long, firstScreenKnown: Boolean = true): Boolean {
        if (phase != Phase.Hold || reduced) return false
        val ready = readyAt ?: now.also { readyAt = it }
        val limit = ready + keepLimitMs
        if (!firstScreenKnown) return now < limit
        return now < minOf(createdAt + drawMs + holdMs, limit)
    }

    /** False when the system splash showed no mark: there is then nothing to carry across. */
    internal var markShown: Boolean by mutableStateOf(true)

    /**
     * The system splash is gone: start moving. Safe to call more than once.
     *
     * @param markShown whether the system splash actually showed the mark. Android
     * draws a plain splash with no icon when the app is opened from somewhere
     * other than the launcher (another app, a notification). Pass
     * [splashShowedMark] here; with false the cover simply lifts — a mark that was
     * never on screen must not appear from nowhere and fly.
     */
    public fun release(markShown: Boolean = true) {
        if (phase == Phase.Hold) {
            this.markShown = markShown
            phase = Phase.Move
        }
    }

    internal fun finish() {
        phase = Phase.Done
    }

    internal fun setTarget(priority: Int, claim: Any, bounds: Rect) {
        targets[priority] = claim to bounds
    }

    /** Removes the place only if [claim] still holds it. */
    internal fun removeTarget(priority: Int, claim: Any) {
        if (targets[priority]?.first === claim) targets.remove(priority)
    }

    /** The destination on screen with the highest priority, if any. */
    internal val landingPriority: Int? get() = targets.keys.maxOrNull()
    internal val landing: Rect? get() = landingPriority?.let { targets[it]?.second }
}

/** The handoff for this Activity, or null when there is none. Provide it above the first screen. */
public val LocalDdsSplashHandoff: ProvidableCompositionLocal<DdsSplashHandoff?> = staticCompositionLocalOf { null }

/**
 * Marks where the app mark lives on a screen, so the splash mark can travel
 * to it. Put it on the mark you would draw anyway; it stays invisible while
 * the travelling mark is on its way, then shows in the same frame the
 * traveller is removed.
 *
 * @param priority when more than one destination is on screen the highest wins
 */
public fun Modifier.ddsSplashTarget(priority: Int): Modifier = composed {
    val handoff = LocalDdsSplashHandoff.current ?: return@composed this
    if (handoff.phase == DdsSplashHandoff.Phase.Done) return@composed this
    val claim = remember { Any() }
    DisposableEffect(handoff, priority) {
        onDispose { handoff.removeTarget(priority, claim) }
    }
    this
        .onGloballyPositioned { handoff.setTarget(priority, claim, it.boundsInRoot()) }
        .graphicsLayer { alpha = if (handoff.hidesLanding && handoff.landingPriority == priority) 0f else 1f }
}

/**
 * Draws the cover and the travelling mark. Place it last in the root of the
 * Activity's content, filling the whole window (edge to edge), so its
 * coordinates are the window's.
 *
 * With a destination on screen the mark travels to it in [DdsMotion.Slow]
 * while the cover fades. With none — or when [landingAllowed] is false (a
 * lock screen is up), or with reduced motion — mark and cover fade together.
 *
 * @param background the splash background; pass the same color the splash theme uses
 * @param markSize the size the system splash draws the mark at
 * @param mark draws the app mark at the size it is given; it must look exactly
 * like the last frame of the splash drawable. Draw it from a path, not an image:
 * it is scaled while it travels
 */
@Composable
public fun DdsSplashOverlay(
    handoff: DdsSplashHandoff,
    background: Color,
    markSize: Dp,
    modifier: Modifier = Modifier,
    landingAllowed: Boolean = true,
    mark: @Composable (size: Dp) -> Unit,
) {
    if (handoff.phase == DdsSplashHandoff.Phase.Done) return

    val progress = remember { Animatable(0f) }
    var window by remember { mutableStateOf(IntSize.Zero) }
    val markPx = with(LocalDensity.current) { markSize.toPx() }
    // Decided once, when the move starts: a destination that shows up halfway
    // through must not bend a fade into a flight.
    var flight by remember { mutableStateOf<Rect?>(null) }

    // If the system never reports the splash gone, do not sit on the first screen forever.
    LaunchedEffect(handoff) {
        delay(handoff.keepLimitMs + SAFETY_MS)
        handoff.release()
    }
    LaunchedEffect(handoff.phase) {
        if (handoff.phase != DdsSplashHandoff.Phase.Move) return@LaunchedEffect
        val destination = handoff.landing.takeIf { landingAllowed && !handoff.reduced && handoff.markShown }
        flight = destination
        if (destination != null) {
            progress.animateTo(1f, tween(DdsMotion.Slow, easing = DdsMotion.Travel))
        } else {
            // Nothing travels, so the mark at the destination shows through the lifting cover.
            handoff.hidesLanding = false
            progress.animateTo(1f, tween(if (handoff.reduced) DdsMotion.Fast else DdsMotion.Short, easing = LinearEasing))
        }
        handoff.finish()
    }

    // The mark is placed by absolute offsets from the left edge of the window,
    // so the overlay lays out left-to-right whatever the app's direction is.
    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
        Box(
            modifier
                .fillMaxSize()
                .onSizeChanged { window = it }
                .clearAndSetSemantics { },
        ) {
            val destination = flight
            Box(
                Modifier
                    .fillMaxSize()
                    .graphicsLayer {
                        val p = progress.value
                        // In flight the cover starts lifting a little after the mark has set
                        // off and is gone before it lands, so the mark is seen leaving first.
                        alpha = if (destination != null) {
                            1f - ((p * DdsMotion.Slow - COVER_DELAY) / DdsMotion.Base).coerceIn(0f, 1f)
                        } else {
                            1f - p
                        }
                    }
                    .background(background),
            )
            Box(
                Modifier
                    .size(markSize)
                    .graphicsLayer {
                        val p = progress.value
                        val startX = (window.width - markPx) / 2f
                        val startY = (window.height - markPx) / 2f
                        transformOrigin = TransformOrigin(0f, 0f)
                        if (destination != null) {
                            val scale = destination.width / markPx
                            translationX = startX + (destination.left - startX) * p
                            translationY = startY + (destination.top - startY) * p
                            scaleX = 1f + (scale - 1f) * p
                            scaleY = scaleX
                        } else {
                            translationX = startX
                            translationY = startY
                            alpha = 1f - p
                        }
                    },
            ) {
                if (handoff.markShown) mark(markSize)
            }
        }
    }
}

/**
 * Whether the system splash drew its icon. Use it in the exit listener:
 *
 * ```
 * setOnExitAnimationListener { provider ->
 *     val shown = splashShowedMark(provider.view)
 *     provider.remove()
 *     handoff.release(markShown = shown)
 * }
 * ```
 *
 * Before Android 12 the compat splash always shows the icon.
 *
 * @param splashView the splash view the system handed over (`SplashScreenViewProvider.view`)
 */
public fun splashShowedMark(splashView: View): Boolean =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        (splashView as? SplashScreenView)?.iconView != null
    } else {
        true
    }

// Both come from the motion scale: the cover's fade (Base) sits in the middle
// of the flight (Slow) in progress terms, and the safety net waits five flights
// past the hold limit.
private const val COVER_DELAY: Float = (DdsMotion.Slow - DdsMotion.Base) / 2f
private const val SAFETY_MS: Long = 5L * DdsMotion.Slow
