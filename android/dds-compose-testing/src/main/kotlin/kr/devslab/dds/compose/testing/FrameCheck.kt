package kr.devslab.dds.compose.testing

import androidx.compose.ui.layout.positionInRoot
import androidx.compose.ui.platform.ViewRootForTest
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.test.isDisplayed
import androidx.compose.ui.test.junit4.ComposeTestRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import java.util.Locale
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.roundToInt
import kr.devslab.dds.compose.layout.DdsTestTags
import kr.devslab.dds.compose.layout.DdsWindowWidth
import kr.devslab.dds.compose.layout.ddsWindowWidth
import kr.devslab.dds.tokens.DdsBorder
import kr.devslab.dds.tokens.DdsScreen

/**
 * What kind of screen is being looked at. The kind decides which menus the screen must have
 * at each window width.
 *
 * | Kind | Rail | Fixed list | Bottom tabs |
 * | --- | --- | --- | --- |
 * | [TopLevel] | 600dp and wider | never | under 600dp |
 * | [Inner] | 600dp and wider | never | never |
 * | [Listed] | 600dp and wider | 840dp and wider | never |
 * | [WholeWindow] | never | never | never |
 */
public enum class DdsScreenKind {
    /** A screen a tab opens. */
    TopLevel,

    /** A screen opened from another one, with a back arrow. */
    Inner,

    /** A screen of an area that has a list: the list is fixed beside it on a wide window. */
    Listed,

    /** A screen that turns the menus off and takes the whole window (sign-in, a scanner, a form). */
    WholeWindow,
}

/**
 * What [DdsFrameCheck.look] measured on one screen. Lengths are in dp of the screen itself, from
 * the left edge of the window. An app can write these to a file as evidence.
 *
 * @property name the name the test gave the screen
 * @property kind the kind the test said the screen is
 * @property window the width class of the window at the time
 * @property windowWidthDp the width of the window
 * @property bodyLeftDp where the body column (or the centered block) starts
 * @property bodyWidthDp how wide the body column (or the centered block) is
 * @property titleLeftDp where the title in the screen's top bar starts; null when the screen has
 * no top bar, and for a centered block
 * @property rail whether the navigation rail was on screen
 * @property listPane whether the fixed list was on screen
 * @property bottomTabs whether the bottom tabs were on screen
 * @property centered true when the screen's one block is a `DdsCenteredColumn`, not a body column
 */
public class DdsScreenReading(
    public val name: String,
    public val kind: DdsScreenKind,
    public val window: DdsWindowWidth,
    public val windowWidthDp: Float,
    public val bodyLeftDp: Float,
    public val bodyWidthDp: Float,
    public val titleLeftDp: Float?,
    public val rail: Boolean,
    public val listPane: Boolean,
    public val bottomTabs: Boolean,
    public val centered: Boolean,
) {
    override fun toString(): String =
        "DdsScreenReading(name=$name, kind=$kind, window=$window, windowWidthDp=$windowWidthDp, " +
            "bodyLeftDp=$bodyLeftDp, bodyWidthDp=$bodyWidthDp, titleLeftDp=$titleLeftDp, rail=$rail, " +
            "listPane=$listPane, bottomTabs=$bottomTabs, centered=$centered)"
}

/**
 * Checks an app's own screens against the DDS screen frame, in the app's device tests.
 *
 * Open a screen, then call [look] with a name for it and its kind. [look] fails, naming the
 * screen, when the screen breaks a rule of the frame. After the last screen, [assertSameLines]
 * fails when two screens of one kind do not start on the same line.
 *
 * ```
 * val check = DdsFrameCheck(composeRule)
 * openOrders()
 * check.look("orders", DdsScreenKind.TopLevel)
 * openOrder(7)
 * check.look("order detail", DdsScreenKind.Inner)
 * check.assertSameLines()
 * ```
 *
 * It finds the parts by the tags the DDS parts carry ([DdsTestTags]), so it only sees screens
 * built from them: `DdsAppFrame`, `DdsScaffold`, `DdsTopBar`, `DdsBodyColumn` (or `ddsBody()`),
 * `DdsCenteredColumn`. Look at a screen when it is at rest, not while it is changing.
 *
 * @param rule the Compose test rule of the test
 */
public class DdsFrameCheck(private val rule: ComposeTestRule) {
    private val seen = mutableListOf<DdsScreenReading>()

    /** Every screen that passed [look] so far, in order. */
    public val readings: List<DdsScreenReading> get() = seen.toList()

    /**
     * Measures the screen showing now and checks it against the rules of the frame:
     *
     * 1. Exactly one body is on screen: one body column, or one centered block.
     * 2. The menus are the ones the window width and [kind] call for (the table at [DdsScreenKind]).
     * 3. A fixed list starts where the rail ends, and the body starts after the list ends.
     * 4. The body is in the middle of the area the frame leaves: from the end of the fixed list,
     *    or of the rail, or from the window's edge, to the window's other edge, less any display
     *    cutout at the sides.
     * 5. The title of the screen's top bar is inside the body column's left and right edges. The
     *    top bar of a fixed list is not the screen's and is left out. A screen with no top bar,
     *    or with a centered block, has no title to check.
     *
     * @param name what to call the screen in a failure and in the reading
     * @param kind what kind of screen it is
     * @return what was measured; it is also added to [readings]
     * @throws AssertionError naming the screen, the rule and the measured numbers, when a rule is broken
     */
    public fun look(name: String, kind: DdsScreenKind): DdsScreenReading {
        rule.waitForIdle()
        val bodies = shown(DdsTestTags.Body)
        val blocks = shown(DdsTestTags.Centered)
        if (bodies.size + blocks.size != 1) {
            fail(
                name,
                "expected exactly one body on screen, found ${bodies.size} body column(s) and ${blocks.size} centered block(s). " +
                    "A screen has one body: DdsBodyColumn (or a column with ddsBody()), or one DdsCenteredColumn. " +
                    "Things beside the body that should stand on its lines use ddsBodyLines().",
            )
        }
        val centered = blocks.isNotEmpty()
        val body = (bodies + blocks).single()
        val density = body.layoutInfo.density.density
        val rtl = body.layoutInfo.layoutDirection == LayoutDirection.Rtl
        val window = windowOf(body)
        val (insetLeft, insetRight) = sideInsets(body)
        // Everything below is measured in pixels from the window's start edge (its right edge when right to left).
        val startInset = max(0f, if (rtl) window.right - insetRight else insetLeft - window.left)
        val endInset = max(0f, if (rtl) insetLeft - window.left else window.right - insetRight)
        fun span(node: SemanticsNode): Span {
            val left = node.positionInRoot.x
            val right = left + node.size.width
            return if (rtl) Span(window.right - right, window.right - left) else Span(left - window.left, right - window.left)
        }
        fun dp(px: Float): String = one(px / density)
        fun Span.dp(): String = "${dp(start)}..${dp(end)}dp"

        val windowWidthDp = window.width / density
        val width = ddsWindowWidth(windowWidthDp.dp)
        val where = "$kind screen, $width window ${dp(window.width)}dp wide"
        val rail = shown(DdsTestTags.Rail).firstOrNull()
        val pane = shown(DdsTestTags.ListPane).firstOrNull()
        val tabs = shown(DdsTestTags.BottomTabs).isNotEmpty()

        // The menus this window width and this kind of screen call for.
        val wantRail = kind != DdsScreenKind.WholeWindow && width != DdsWindowWidth.Compact
        val wantList = kind == DdsScreenKind.Listed && width == DdsWindowWidth.Expanded
        val wantTabs = kind == DdsScreenKind.TopLevel && width == DdsWindowWidth.Compact
        val wrong = buildList {
            if (rail != null && !wantRail) add("the rail is on screen, and a $kind screen on a $width window has none")
            if (rail == null && wantRail) add("the rail is missing: a $kind screen on a window 600dp or wider is beside the rail DdsAppFrame draws")
            if (pane != null && !wantList) add("the fixed list is on screen, and a $kind screen on a $width window has none (pass list = null to DdsAppFrame)")
            if (pane == null && wantList) add("the fixed list is missing: a Listed screen on a window 840dp or wider has its list beside it (DdsAppFrame's list)")
            if (tabs && !wantTabs) add("the bottom tabs are on screen, and a $kind screen on a $width window has none (DdsScaffold(bottomTabs = true) is for top-level screens)")
            if (!tabs && wantTabs) add("the bottom tabs are missing: a TopLevel screen on a window under 600dp draws them with DdsScaffold(bottomTabs = true) inside DdsAppFrame")
        }
        if (wrong.isNotEmpty()) fail(name, "the menus are not the ones for a $where: ${wrong.joinToString("; ")}.")

        val onePixel = 1f
        val oneDp = density
        val hairline = max(1f, (DdsBorder.hairline * density).roundToInt().toFloat())
        val bodySpan = span(body)
        if (pane != null) {
            val paneSpan = span(pane)
            val expected = if (rail != null) span(rail).end + hairline else startInset
            if (abs(paneSpan.start - expected) > oneDp) {
                fail(
                    name,
                    "the fixed list does not start where the rail ends: the list is at ${paneSpan.dp()}, " +
                        (if (rail != null) "the rail at ${span(rail).dp()}" else "there is no rail") +
                        ", so the list should start at ${dp(expected)}dp ($where).",
                )
            }
            if (bodySpan.start < paneSpan.end - onePixel) {
                fail(
                    name,
                    "the body starts before the fixed list ends: the body is at ${bodySpan.dp()}, the list at ${paneSpan.dp()} ($where). " +
                        "The screen belongs in DdsAppFrame's content, beside the list.",
                )
            }
        }

        val edge = pane ?: rail
        val area = Span(if (edge != null) span(edge).end + hairline else startInset, window.width - endInset)
        if (abs(bodySpan.middle - area.middle) > oneDp) {
            val what = if (centered) "centered block" else "body"
            fail(
                name,
                "the $what is not in the middle of the area the frame leaves: the $what is at ${bodySpan.dp()} (middle ${dp(bodySpan.middle)}), " +
                    "the area is ${area.dp()} (middle ${dp(area.middle)}) ($where). " +
                    "Use DdsBodyColumn, or center the column that carries ddsBody().",
            )
        }

        var titleLeftDp: Float? = null
        if (!centered) {
            val paneSpan = pane?.let { span(it) }
            val titles = shown(DdsTestTags.TopBarTitle).filter { title -> paneSpan == null || span(title).middle !in paneSpan }
            val mine = titles.filter { span(it).middle in bodySpan }
            if (titles.isNotEmpty() && mine.isEmpty()) {
                fail(
                    name,
                    "the top bar's title is outside the body column: the title is at ${span(titles.first()).dp()}, the body at ${bodySpan.dp()} ($where). " +
                        "Give DdsTopBar's columnMax the same value as the body's max (both are ${DdsScreen.bodyMax}dp by default).",
                )
            }
            for (title in mine) {
                val titleSpan = span(title)
                if (titleSpan.start < bodySpan.start - onePixel || titleSpan.end > bodySpan.end + onePixel) {
                    fail(
                        name,
                        "the top bar's title is outside the body column: the title is at ${titleSpan.dp()}, the body at ${bodySpan.dp()} ($where). " +
                            "Give DdsTopBar's columnMax the same value as the body's max (both are ${DdsScreen.bodyMax}dp by default).",
                    )
                }
            }
            titleLeftDp = mine.firstOrNull()?.let { (it.positionInRoot.x - window.left) / density }
        }

        val reading = DdsScreenReading(
            name = name,
            kind = kind,
            window = width,
            windowWidthDp = windowWidthDp,
            bodyLeftDp = (body.positionInRoot.x - window.left) / density,
            bodyWidthDp = body.size.width / density,
            titleLeftDp = titleLeftDp,
            rail = rail != null,
            listPane = pane != null,
            bottomTabs = tabs,
            centered = centered,
        )
        seen += reading
        return reading
    }

    /**
     * Checks that the screens looked at so far stand on the same lines: two screens of the same
     * kind, in a window of the same width, both beside a fixed list or both not, must start at the
     * same place and be the same width, within 1dp. Body columns are compared with body columns,
     * centered blocks with centered blocks.
     *
     * A screen that passes a `max` of its own to its body (a document page, a wide table) is on
     * other lines on purpose: keep it out of the check that calls this, or use a second
     * [DdsFrameCheck] for it.
     *
     * @throws AssertionError naming the two screens and their lines, when two differ
     */
    public fun assertSameLines() {
        val groups = seen.groupBy { Line(it.kind, it.listPane, it.centered, it.windowWidthDp.roundToInt()) }
        for ((line, screens) in groups) {
            val first = screens.first()
            for (other in screens.drop(1)) {
                if (abs(other.bodyLeftDp - first.bodyLeftDp) > 1f || abs(other.bodyWidthDp - first.bodyWidthDp) > 1f) {
                    throw AssertionError(
                        "Screens \"${first.name}\" and \"${other.name}\" are both ${line.kind} screens in a window ${line.windowWidthDp}dp wide, " +
                            "but their bodies are not on the same lines: \"${first.name}\" starts at ${one(first.bodyLeftDp)}dp and is " +
                            "${one(first.bodyWidthDp)}dp wide, \"${other.name}\" starts at ${one(other.bodyLeftDp)}dp and is " +
                            "${one(other.bodyWidthDp)}dp wide. Screens of one kind use the same body width.",
                    )
                }
            }
        }
    }

    /** A length with one decimal, the same in every locale. */
    private fun one(value: Float): String = String.format(Locale.US, "%.1f", value)

    private fun fail(name: String, what: String): Nothing = throw AssertionError("Screen \"$name\": $what")

    /** The nodes carrying [tag] that are on screen now. */
    private fun shown(tag: String): List<SemanticsNode> {
        val all = rule.onAllNodesWithTag(tag, useUnmergedTree = true)
        return all.fetchSemanticsNodes().indices.filter { all[it].isDisplayed() }.map { all[it].fetchSemanticsNode() }
    }

    /**
     * The window the screen is laid out in, in pixels of the root: the outermost layout that has the
     * screen's own density. In an app that is the whole Compose view. In a test that forces a window
     * size (which is done by changing the density) it is the forced window.
     */
    private fun windowOf(node: SemanticsNode): Edges {
        var info = node.layoutInfo
        val density = info.density.density
        while (true) {
            val parent = info.parentInfo ?: break
            if (parent.density.density != density) break
            info = parent
        }
        val left = info.coordinates.positionInRoot().x
        return Edges(left, left + info.width)
    }

    /**
     * Where the system bars and display cutouts leave room at the sides, as the left and right edges
     * of the clear part in pixels of the root. What the Compose view does not reach is not counted.
     */
    private fun sideInsets(node: SemanticsNode): Pair<Float, Float> {
        val view = (node.root as? ViewRootForTest)?.view
        val insets = view?.let { ViewCompat.getRootWindowInsets(it) }
            ?.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())
        if (view == null || insets == null) return 0f to Float.MAX_VALUE
        val at = IntArray(2)
        view.getLocationInWindow(at)
        val windowWidth = view.rootView.width
        val left = max(0, insets.left - at[0])
        val right = max(0, insets.right - (windowWidth - at[0] - view.width))
        return left.toFloat() to (view.width - right).toFloat()
    }

    /** Left and right in pixels of the root. */
    private class Edges(val left: Float, val right: Float) {
        val width: Float get() = right - left
    }

    /** A stretch across the window, in pixels from the window's start edge. */
    private class Span(val start: Float, val end: Float) {
        val middle: Float get() = (start + end) / 2

        operator fun contains(x: Float): Boolean = x in start..end
    }

    private data class Line(val kind: DdsScreenKind, val listPane: Boolean, val centered: Boolean, val windowWidthDp: Int)
}
