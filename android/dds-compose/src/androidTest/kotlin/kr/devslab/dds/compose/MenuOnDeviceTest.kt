package kr.devslab.dds.compose

import android.graphics.Bitmap
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.toSize
import androidx.test.platform.app.InstrumentationRegistry
import kotlin.math.abs
import kotlin.math.roundToInt
import kr.devslab.dds.compose.component.DdsMenu
import kr.devslab.dds.compose.component.DdsMenuAlign
import kr.devslab.dds.compose.component.DdsMenuDivider
import kr.devslab.dds.compose.component.DdsMenuItem
import kr.devslab.dds.compose.theme.DdsColors
import kr.devslab.dds.compose.theme.DdsTheme
import kr.devslab.dds.tokens.DdsBorder
import kr.devslab.dds.tokens.DdsSpace
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeTrue
import org.junit.Rule
import org.junit.Test

/**
 * Where a menu opens and what is drawn around it, measured on a device.
 *
 * A menu is a window of its own, so places are compared on the screen, and
 * colors are read from a capture of the whole screen: the page is a green no
 * theme has, and anything a menu draws outside its own edge shows on it.
 */
class MenuOnDeviceTest {
    @get:Rule
    val rule = createComposeRule()

    private val green = Color.Green
    private lateinit var colors: DdsColors

    /**
     * An open menu on a 48dp button, in a row across the top of a green page.
     *
     * @param align null calls [DdsMenu] the way 0.5.0 code does, without the argument
     * @param atStartEdge the button is at the row's start edge instead of its middle
     * @param menuWidth a width for the menu, given the window's
     */
    private fun show(
        align: DdsMenuAlign? = null,
        direction: LayoutDirection = LayoutDirection.Ltr,
        atStartEdge: Boolean = false,
        menuWidth: ((Dp) -> Dp)? = null,
        items: @Composable ColumnScope.() -> Unit = {
            DdsMenuItem("수정", onClick = {}, modifier = Modifier.testTag("first"))
            DdsMenuItem("삭제", onClick = {}, modifier = Modifier.testTag("second"), danger = true)
        },
    ) {
        rule.setContent {
            CompositionLocalProvider(LocalLayoutDirection provides direction) {
                DdsTheme {
                    colors = DdsTheme.colors
                    BoxWithConstraints(Modifier.fillMaxSize().background(green).testTag("page")) {
                        val width = menuWidth?.invoke(maxWidth)
                        Row(
                            Modifier.fillMaxWidth().padding(top = 96.dp),
                            horizontalArrangement = if (atStartEdge) Arrangement.Start else Arrangement.Center,
                        ) {
                            Box {
                                Box(Modifier.size(48.dp).background(Color.Blue).testTag("button"))
                                val modifier = Modifier.testTag("menu").then(if (width != null) Modifier.width(width) else Modifier)
                                if (align == null) {
                                    DdsMenu(true, {}, modifier, content = items)
                                } else {
                                    DdsMenu(true, {}, modifier, align, items)
                                }
                            }
                        }
                    }
                }
            }
        }
        rule.waitForIdle()
    }

    /** Where a tagged thing is on the screen, in px. */
    private fun onScreen(tag: String): Rect {
        val node = rule.onNodeWithTag(tag, useUnmergedTree = true).fetchSemanticsNode()
        return Rect(node.positionOnScreen, node.size.toSize())
    }

    private val oneDp: Float get() = rule.density.density

    private fun Dp.px(): Int = with(rule.density) { roundToPx() }

    private fun assertInsideTheWindow(menu: Rect) {
        val page = onScreen("page")
        assertTrue("the menu starts at ${menu.left}, left of the window (${page.left})", menu.left >= page.left)
        assertTrue("the menu ends at ${menu.right}, right of the window (${page.right})", menu.right <= page.right)
    }

    // --- where it opens -------------------------------------------------------------

    @Test
    fun byDefaultTheMenuStartsWhereItsButtonStarts() {
        show()
        val menu = onScreen("menu")
        val button = onScreen("button")
        assertEquals(button.left, menu.left, oneDp)
        assertTrue("the menu is wider than its button, so it runs past the button's end", menu.right > button.right + oneDp)
    }

    @Test
    fun anEndAlignedMenuEndsWhereItsButtonEnds() {
        show(DdsMenuAlign.End)
        val menu = onScreen("menu")
        val button = onScreen("button")
        assertEquals(button.right, menu.right, oneDp)
        assertTrue("it runs back past the button's start", menu.left < button.left - oneDp)
    }

    @Test
    fun rightToLeftTheMenuStartsWhereItsButtonStarts() {
        show(direction = LayoutDirection.Rtl)
        val menu = onScreen("menu")
        val button = onScreen("button")
        assertEquals(button.right, menu.right, oneDp)
        assertTrue(menu.left < button.left - oneDp)
    }

    @Test
    fun rightToLeftAnEndAlignedMenuEndsWhereItsButtonEnds() {
        show(DdsMenuAlign.End, LayoutDirection.Rtl)
        val menu = onScreen("menu")
        val button = onScreen("button")
        assertEquals(button.left, menu.left, oneDp)
        assertTrue(menu.right > button.right + oneDp)
    }

    @Test
    fun anEndAlignedMenuNearTheStartEdgeStaysInsideTheWindow() {
        show(DdsMenuAlign.End, atStartEdge = true)
        val menu = onScreen("menu")
        val button = onScreen("button")
        assertEquals("the button is at the window's edge", onScreen("page").left, button.left, 0.5f)
        assertInsideTheWindow(menu)
        // No room to end on the button's end: it opens from the button's start instead.
        assertEquals(button.left, menu.left, oneDp)
    }

    @Test
    fun rightToLeftAnEndAlignedMenuNearTheStartEdgeStaysInsideTheWindow() {
        show(DdsMenuAlign.End, LayoutDirection.Rtl, atStartEdge = true)
        val menu = onScreen("menu")
        val button = onScreen("button")
        assertEquals("the button is at the window's edge", onScreen("page").right, button.right, 0.5f)
        assertInsideTheWindow(menu)
        assertEquals(button.right, menu.right, oneDp)
    }

    @Test
    fun aMenuTooWideForEitherSideStaysInsideTheWindow() {
        show(menuWidth = { it - 32.dp })
        val menu = onScreen("menu")
        assertInsideTheWindow(menu)
        assertEquals("it keeps the width it was given", onScreen("page").width - 32.dp.px(), menu.width, oneDp)
    }

    @Test
    fun anEndAlignedMenuTooWideForEitherSideStaysInsideTheWindow() {
        show(DdsMenuAlign.End, menuWidth = { it - 32.dp })
        val menu = onScreen("menu")
        assertInsideTheWindow(menu)
        assertEquals("it keeps the width it was given", onScreen("page").width - 32.dp.px(), menu.width, oneDp)
    }

    @Test
    fun whatIsInAnEndAlignedMenuStillReadsFromTheStart() {
        // A thing narrower than the menu sits at the menu's start edge, as in a start-aligned one.
        show(DdsMenuAlign.End, menuWidth = { 240.dp }) {
            Box(Modifier.size(20.dp).testTag("narrow"))
            DdsMenuItem("수정", onClick = {}, modifier = Modifier.testTag("first"))
        }
        val menu = onScreen("menu")
        assertEquals(menu.left, onScreen("narrow").left, oneDp)
        assertEquals("an item is as wide as the menu", menu.width, onScreen("first").width, oneDp)
    }

    @Test
    fun rightToLeftWhatIsInAnEndAlignedMenuStillReadsFromTheStart() {
        show(DdsMenuAlign.End, LayoutDirection.Rtl, menuWidth = { 240.dp }) {
            Box(Modifier.size(20.dp).testTag("narrow"))
            DdsMenuItem("수정", onClick = {}, modifier = Modifier.testTag("first"))
        }
        assertEquals(onScreen("menu").right, onScreen("narrow").right, oneDp)
    }

    @Test
    fun rightToLeftWhatIsInAMenuReadsFromTheStart() {
        show(direction = LayoutDirection.Rtl, menuWidth = { 240.dp }) {
            Box(Modifier.size(20.dp).testTag("narrow"))
            DdsMenuItem("수정", onClick = {}, modifier = Modifier.testTag("first"))
        }
        assertEquals(onScreen("menu").right, onScreen("narrow").right, oneDp)
    }

    // --- what is drawn ----------------------------------------------------------------

    /**
     * The whole screen, every window on it, with the menu's own window drawn.
     *
     * What a capture shows is not the colors as written. A system dialog can lie over the test
     * app (Android shows one about an app built for an old version, as this test app is) and
     * darkens the whole screen; a phone's eye-comfort filter tints it. Both do it evenly, so
     * colors are compared with each other as captured: [page] is the green as this capture
     * shows it, and the menu's face and edge line are read from the menu itself.
     */
    private inner class Screen(private val bitmap: Bitmap, val page: Color) {
        fun at(x: Float, y: Float): Color = Color(bitmap.getPixel(x.roundToInt(), y.roundToInt()))

        /** True when the capture is only darkened, not tinted: then a color as written can be worked out. */
        val onlyDarkened: Boolean = page.red == 0f && page.blue == 0f

        /** [color] as an only-darkened capture shows it. */
        private fun seen(color: Color): Color = Color(color.red * page.green, color.green * page.green, color.blue * page.green)

        fun assertSame(message: String, expected: Color, x: Float, y: Float) {
            val actual = at(x, y)
            assertTrue("$message: expected $expected but was $actual", close(expected, actual))
        }

        /**
         * [captured] is [written], as this capture shows it. Only a capture that is merely darkened
         * can say so; on a tinted one the test is reported as skipped, not passed.
         */
        fun assertIsTheColor(message: String, written: Color, captured: Color) {
            assumeTrue("the capture is tinted; exact colors cannot be compared", onlyDarkened)
            assertTrue("$message: expected ${seen(written)} (that is $written on this screen) but was $captured", close(seen(written), captured))
        }
    }

    private fun close(a: Color, b: Color): Boolean =
        maxOf(abs(a.red - b.red), abs(a.green - b.green), abs(a.blue - b.blue)) <= 2f / 255f

    private fun capture(menu: Rect): Screen {
        val shot = checkNotNull(InstrumentationRegistry.getInstrumentation().uiAutomation.takeScreenshot()) { "no screen capture" }
        val bitmap = shot.copy(Bitmap.Config.ARGB_8888, false)
        // The page, level with the menu and well clear of it and of anything it could cast.
        val page = Color(bitmap.getPixel((menu.left - 32 * oneDp).roundToInt(), menu.center.y.roundToInt()))
        return Screen(bitmap, page)
    }

    /** The menu's face: the space between its top edge and its first item. */
    private fun Screen.face(menu: Rect): Color = at(menu.center.x, menu.top + 4 * oneDp)

    /** The menu's edge line, at its start side, level with [y]. */
    private fun Screen.edge(menu: Rect, y: Float): Color = at(menu.left + 1f, y)

    /** Captures until the menu's face is there and the screen has settled. */
    private fun screenWithTheMenuDrawn(menu: Rect): Screen {
        var screen = capture(menu)
        for (attempt in 1..30) {
            Thread.sleep(100)
            val now = capture(menu)
            val settled = now.page == screen.page && now.face(menu) == screen.face(menu) && !close(now.face(menu), now.page)
            screen = now
            if (settled) break
        }
        val page = screen.page
        assertTrue("the page beside the menu is the green, however dark or tinted: $page", page.green > 0.2f && page.green > 2 * page.red && page.green > 2 * page.blue)
        assertTrue("the menu's face is drawn and is not the page: ${screen.face(menu)}", !close(screen.face(menu), page))
        return screen
    }

    @Test
    fun theMenuCastsNoShadow() {
        show()
        val menu = onScreen("menu")
        val screen = screenWithTheMenuDrawn(menu)
        val out = 2 * oneDp
        // Two dp outside the middle of each edge is the page, untouched. Below is where a shadow is darkest.
        assertEquals("below the menu", screen.page, screen.at(menu.center.x, menu.bottom + out))
        assertEquals("above the menu", screen.page, screen.at(menu.center.x, menu.top - out))
        assertEquals("before the menu", screen.page, screen.at(menu.left - out, menu.center.y))
        assertEquals("after the menu", screen.page, screen.at(menu.right + out, menu.center.y))
        // And further out, where a soft shadow would still reach.
        assertEquals("well below the menu", screen.page, screen.at(menu.center.x, menu.bottom + 3 * out))
    }

    @Test
    fun theMenuIsStillACardWithAnEdgeLine() {
        show()
        val menu = onScreen("menu")
        val screen = screenWithTheMenuDrawn(menu)
        val edge = screen.edge(menu, menu.center.y)
        assertTrue("the edge line is not the face: $edge", !close(edge, screen.face(menu)))
        assertTrue("the edge line is not the page: $edge", !close(edge, screen.page))
        screen.assertSame("the edge line at the bottom", edge, menu.center.x, menu.bottom - 2f)
    }

    /**
     * The colors themselves, not only how they stand to each other. Skipped — and counted as
     * skipped — on a screen whose capture is tinted (a phone with its eye-comfort filter on).
     */
    @Test
    fun theMenusFaceAndEdgeLineAreTheThemesColors() {
        show()
        val menu = onScreen("menu")
        val screen = screenWithTheMenuDrawn(menu)
        screen.assertIsTheColor("the menu's face", colors.bgElevated, screen.face(menu))
        screen.assertIsTheColor("the edge line", colors.borderDefault, screen.edge(menu, menu.center.y))
    }

    /** As above, for the divider: skipped and counted where the capture is tinted. */
    @Test
    fun theDividerIsTheThemesBorderColor() {
        show {
            DdsMenuItem("수정", onClick = {}, modifier = Modifier.testTag("first"))
            DdsMenuDivider()
            DdsMenuItem("삭제", onClick = {}, modifier = Modifier.testTag("second"), danger = true)
        }
        val menu = onScreen("menu")
        val first = onScreen("first")
        val middle = first.bottom + DdsSpace.s4.dp.px() + (DdsBorder.hairline.dp.px() - 1) / 2f
        val screen = screenWithTheMenuDrawn(menu)
        screen.assertIsTheColor("the divider", colors.borderDefault, screen.at(menu.center.x, middle))
    }

    @Test
    fun theDividerIsAHairlineAcrossTheMenuWithSpaceAboveAndBelow() {
        show {
            DdsMenuItem("수정", onClick = {}, modifier = Modifier.testTag("first"))
            DdsMenuDivider()
            DdsMenuItem("삭제", onClick = {}, modifier = Modifier.testTag("second"), danger = true)
        }
        val menu = onScreen("menu")
        val first = onScreen("first")
        val second = onScreen("second")
        val space = DdsSpace.s4.dp.px()
        val line = DdsBorder.hairline.dp.px()
        assertEquals("space, line, space", (space + line + space).toFloat(), second.top - first.bottom, 1f)

        val screen = screenWithTheMenuDrawn(menu)
        val face = screen.face(menu)
        // The menu's own edge line, level with the first item: the divider is the same line.
        val edge = screen.edge(menu, first.center.y)
        assertTrue("the edge line is not the face: $edge", !close(edge, face))
        val middle = first.bottom + space + (line - 1) / 2f
        // From just inside one edge to just inside the other.
        screen.assertSame("the line, in the middle", edge, menu.center.x, middle)
        screen.assertSame("the line, at the start", edge, menu.left + 3 * oneDp, middle)
        screen.assertSame("the line, at the end", edge, menu.right - 3 * oneDp, middle)
        // The space above and below it is the menu's face.
        screen.assertSame("above the line", face, menu.center.x, first.bottom + space / 2f)
        screen.assertSame("below the line", face, menu.center.x, second.top - space / 2f)
    }
}
