package kr.devslab.dds.compose.navigation

import androidx.activity.compose.BackHandler
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.Saver
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import android.os.SystemClock
import kr.devslab.dds.tokens.DdsMotionTokens

/** What one press of the system back does. */
public enum class DdsBackAction {
    /** Go to the previous screen of the current tab. */
    PopScreen,

    /** Go to the tab the person was on before this one. */
    PreviousTab,

    /** Nowhere left to go, or back was pressed twice quickly: ask before leaving the app. */
    AskToExit,
}

/**
 * The back rule, as one function so it can be read and tested.
 *
 * Back goes back: a screen first, then the tab before. Leaving the app is
 * never silent — when there is nowhere left, or when back is pressed twice in
 * a row faster than [doublePressMs], the app asks.
 *
 * @param canPop the current tab has a screen under the one shown
 * @param hasPreviousTab [DdsTabTrail.previous] is not null
 * @param msSinceLastBack time since the last back press, null for the first one
 */
public fun ddsBackAction(
    canPop: Boolean,
    hasPreviousTab: Boolean,
    msSinceLastBack: Long?,
    doublePressMs: Int = DdsMotionTokens.backDoublePressMs,
): DdsBackAction = when {
    msSinceLastBack != null && msSinceLastBack in 0 until doublePressMs -> DdsBackAction.AskToExit
    canPop -> DdsBackAction.PopScreen
    hasPreviousTab -> DdsBackAction.PreviousTab
    else -> DdsBackAction.AskToExit
}

/**
 * The tabs the person came through, each remembered once.
 *
 * Going Home → List → Settings → List leaves the trail Home, Settings, List:
 * back then leads to Settings, then Home, and never bounces between two tabs.
 *
 * Call [visit] every time the person selects a tab — the back handler only
 * updates the trail on back. [current] and [previous] are observable, so the
 * trail can be the app's selected-tab state.
 */
@Stable
public class DdsTabTrail internal constructor(initial: List<Int>) {
    private val visited = mutableStateListOf<Int>().apply { addAll(initial) }

    /** The tab shown now, or null before the first [visit]. */
    public val current: Int? get() = visited.lastOrNull()

    /** The tab back leads to, or null on the first tab. */
    public val previous: Int? get() = if (visited.size >= 2) visited[visited.size - 2] else null

    /** Record that [tab] is now shown. */
    public fun visit(tab: Int) {
        if (visited.lastOrNull() == tab) return
        visited.remove(tab)
        visited.add(tab)
    }

    /** Leave the current tab; returns the tab now shown, or null if there was none before it. */
    public fun back(): Int? {
        if (visited.size < 2) return null
        visited.removeAt(visited.lastIndex)
        return visited.last()
    }

    // An ArrayList, not toList(): a snapshot list's own copy is not a type a Bundle can hold,
    // and rememberSaveable refuses it when the screen is first composed.
    internal fun snapshot(): List<Int> = ArrayList(visited)

    internal companion object {
        val Saver: Saver<DdsTabTrail, List<Int>> = Saver(save = { it.snapshot() }, restore = { DdsTabTrail(it) })
    }
}

/** A [DdsTabTrail] that survives rotation, starting on [startTab]. */
@Composable
public fun rememberDdsTabTrail(startTab: Int = 0): DdsTabTrail =
    rememberSaveable(saver = DdsTabTrail.Saver) { DdsTabTrail(listOf(startTab)) }

/**
 * Handles the system back by the DDS rule ([ddsBackAction]).
 *
 * The exit question itself is the app's to show (a [kr.devslab.dds.compose.component.DdsDialog]
 * with its own words) — [onAskToExit] only says it is time to ask.
 *
 * The handler only moves the trail on back: the app calls `trail.visit(tab)`
 * when the person selects a tab.
 *
 * @param enabled false where back must not be taken over: a lock screen, or
 * while a dialog or sheet is open (those close themselves on back)
 * @param canPop the current tab has a screen under the one shown
 * @param onPop go to that screen
 * @param onTab show this tab; the trail is already updated
 */
@Composable
public fun DdsBackHandler(
    trail: DdsTabTrail,
    canPop: Boolean,
    onPop: () -> Unit,
    onTab: (Int) -> Unit,
    onAskToExit: () -> Unit,
    enabled: Boolean = true,
) {
    var lastBackAt by remember { mutableLongStateOf(NEVER) }
    BackHandler(enabled) {
        val now = SystemClock.uptimeMillis()
        val since = if (lastBackAt == NEVER) null else now - lastBackAt
        lastBackAt = now
        when (ddsBackAction(canPop, trail.previous != null, since)) {
            DdsBackAction.PopScreen -> onPop()
            DdsBackAction.PreviousTab -> trail.back()?.let(onTab)
            DdsBackAction.AskToExit -> {
                lastBackAt = NEVER // the question is an answer to the double press; start counting afresh
                onAskToExit()
            }
        }
    }
}

private const val NEVER = Long.MIN_VALUE
