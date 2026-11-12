package kr.devslab.dds.compose

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.LocalRippleConfiguration
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PixelMap
import androidx.compose.ui.graphics.compositeOver
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.dp
import androidx.test.platform.app.InstrumentationRegistry
import kotlin.math.abs
import kr.devslab.dds.compose.component.DdsButton
import kr.devslab.dds.compose.component.DdsButtonVariant
import kr.devslab.dds.compose.component.DdsSize
import kr.devslab.dds.compose.motion.isReducedMotion
import kr.devslab.dds.compose.theme.DdsColors
import kr.devslab.dds.compose.theme.DdsTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeFalse
import org.junit.Rule
import org.junit.Test

/**
 * What a button's face is made of, read from the pixels a device draws.
 *
 * The page is a green no theme has, so "the page shows through" and "the button
 * has a face of its own" cannot be mistaken for one another.
 */
class ButtonOnDeviceTest {
    @get:Rule
    val rule = createComposeRule()

    private val green = Color.Green
    private val label = "HHHH"
    private lateinit var colors: DdsColors
    private lateinit var baseStyle: TextStyle

    /**
     * One wide button on a page of [page]'s color. The ripple is turned off, so a pixel of the
     * button is its fill and nothing else: the ripple runs on the device's own clock, not the test's.
     */
    @OptIn(ExperimentalMaterial3Api::class)
    private fun show(
        variant: DdsButtonVariant,
        dark: Boolean = false,
        enabled: Boolean = true,
        page: (DdsColors) -> Color = { green },
    ) {
        rule.setContent {
            DdsTheme(darkTheme = dark) {
                colors = DdsTheme.colors
                baseStyle = DdsTheme.typography.body1
                CompositionLocalProvider(LocalRippleConfiguration provides null) {
                    Box(Modifier.background(page(colors)).padding(16.dp).testTag("page")) {
                        DdsButton(
                            label,
                            onClick = {},
                            modifier = Modifier.width(200.dp).testTag("button"),
                            variant = variant,
                            size = DdsSize.Lg,
                            enabled = enabled,
                        )
                    }
                }
            }
        }
        rule.waitForIdle()
    }

    private fun button(): PixelMap = rule.onNodeWithTag("button").captureToImage().toPixelMap()

    /** Inside the button, an eighth of the way along: well past the edge, well short of the label. */
    private fun fill(): Color = button().let { it[it.width / 8, it.height / 2] }

    /** The style the label was laid out with. */
    private fun labelStyle(): TextStyle {
        val results = mutableListOf<TextLayoutResult>()
        val node = rule.onNodeWithText(label, useUnmergedTree = true).fetchSemanticsNode()
        node.config[SemanticsActions.GetTextLayoutResult].action!!.invoke(results)
        return results.single().layoutInput.style
    }

    /** How many pixels of the button are exactly [ink]: the solid middle of the letters' strokes. */
    private fun pixelsOf(ink: Color): Int {
        val pixels = button()
        var count = 0
        for (y in 0 until pixels.height) for (x in 0 until pixels.width) if (pixels[x, y] == ink) count++
        return count
    }

    private fun assertClose(message: String, expected: Color, actual: Color) {
        val off = maxOf(abs(expected.red - actual.red), abs(expected.green - actual.green), abs(expected.blue - actual.blue))
        assertTrue("$message: expected $expected but was $actual", off <= 2f / 255f)
    }

    private fun close(a: Color, b: Color): Boolean =
        maxOf(abs(a.red - b.red), abs(a.green - b.green), abs(a.blue - b.blue)) <= 2f / 255f

    // --- at rest ---------------------------------------------------------------

    @Test
    fun aSecondaryButtonIsFilledWithTheCardBackground() {
        show(DdsButtonVariant.Secondary)
        assertNotEquals("the page must not show through", green, fill())
        assertEquals(colors.bgElevated, fill())
    }

    @Test
    fun aSecondaryButtonIsFilledInTheDarkThemeToo() {
        show(DdsButtonVariant.Secondary, dark = true)
        assertEquals(colors.bgElevated, fill())
    }

    @Test
    fun onTheLightPageASecondaryButtonLooksAsItDid() {
        // The card background and the light page are the same white: the fill cannot be told from the page.
        show(DdsButtonVariant.Secondary, page = { it.bgDefault })
        val pixels = button()
        assertEquals(colors.bgDefault, pixels[pixels.width / 8, pixels.height / 2])
        // Outside the rounded corner, and inside it past the edge line.
        assertEquals(colors.bgDefault, pixels[0, 0])
        assertEquals(colors.bgDefault, pixels[pixels.width / 8, pixels.height / 4])
        // The edge line and the ink are still there.
        assertEquals(colors.borderStrong, pixels[pixels.width / 2, 0])
        assertEquals(colors.textPrimary, labelStyle().color)
    }

    @Test
    fun aPlainButtonShowsThePageAndInkText() {
        show(DdsButtonVariant.Plain)
        assertEquals("no face: the page shows", green, fill())
        val pixels = button()
        assertEquals("no edge line", green, pixels[pixels.width / 2, 0])
        assertEquals(colors.textPrimary, labelStyle().color)
        assertTrue("the letters are drawn in the ink color", pixelsOf(colors.textPrimary) > 0)
        assertEquals("no brand color anywhere", 0, pixelsOf(colors.textBrand))
        // A text button is not heavier than the type scale makes it.
        assertEquals(baseStyle.fontWeight, labelStyle().fontWeight)
    }

    @Test
    fun aGhostButtonIsUnchanged() {
        show(DdsButtonVariant.Ghost)
        assertEquals(green, fill())
        assertEquals(colors.textBrand, labelStyle().color)
        assertTrue("the letters are drawn in the brand color", pixelsOf(colors.textBrand) > 0)
        assertEquals(baseStyle.fontWeight, labelStyle().fontWeight)
    }

    @Test
    fun aDisabledSecondaryButtonIsDimmedFaceAndAll() {
        show(DdsButtonVariant.Secondary, enabled = false)
        // The whole control is at the disabled opacity: its face lets 55% of the page through.
        assertClose("disabled face", colors.bgElevated.copy(alpha = 0.45f).compositeOver(green), fill())
    }

    // --- pressed -----------------------------------------------------------------

    /** Presses the button with the clock held and returns its fill frame by frame, for longer than the 100ms it takes. */
    private fun press(): List<Color> {
        assumeFalse("animations are turned off on this device", isReducedMotion(InstrumentationRegistry.getInstrumentation().targetContext))
        rule.mainClock.autoAdvance = false
        rule.onNodeWithTag("button").performTouchInput { down(center) }
        return List(14) {
            rule.mainClock.advanceTimeByFrame()
            fill()
        }
    }

    private fun release() {
        rule.onNodeWithTag("button").performTouchInput { up() }
        rule.mainClock.autoAdvance = true
        rule.waitForIdle()
    }

    private fun assertEasesTo(rest: Color, pressed: Color, frames: List<Color>) {
        assertClose("pressed", pressed, frames.last())
        val onTheWay = frames.count { !close(it, rest) && !close(it, pressed) }
        assertTrue("the fill should be part-way for a frame or more, was for $onTheWay: $frames", onTheWay >= 1)
    }

    @Test
    fun aPressedSecondaryButtonIsTinted() {
        show(DdsButtonVariant.Secondary)
        val rest = fill()
        assertEquals(colors.bgElevated, rest)
        val frames = press()
        // The tint lies over the face, not over the page.
        assertEasesTo(rest, colors.overlayPressedTint.compositeOver(colors.bgElevated), frames)
        assertNotEquals("pressed does not look like rest", rest, frames.last())
        release()
        assertEquals(rest, fill())
    }

    @Test
    fun aPressedPlainButtonIsTintedAsAGhostButtonIs() {
        show(DdsButtonVariant.Plain)
        val frames = press()
        assertEasesTo(green, colors.overlayPressedTint.compositeOver(green), frames)
        release()
        assertEquals(green, fill())
    }

    @Test
    fun aPressedGhostButtonIsTintedAsBefore() {
        show(DdsButtonVariant.Ghost)
        val frames = press()
        assertEasesTo(green, colors.overlayPressedTint.compositeOver(green), frames)
        release()
        assertEquals(green, fill())
    }
}
