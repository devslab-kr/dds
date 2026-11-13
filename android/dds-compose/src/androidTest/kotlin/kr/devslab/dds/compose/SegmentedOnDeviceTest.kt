package kr.devslab.dds.compose

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.LocalRippleConfiguration
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PixelMap
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher.Companion.expectValue
import androidx.compose.ui.test.SemanticsMatcher.Companion.keyIsDefined
import androidx.compose.ui.test.SemanticsMatcher.Companion.keyNotDefined
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.assertIsNotSelected
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.tween
import androidx.compose.ui.unit.dp
import kotlin.math.abs
import kr.devslab.dds.compose.component.DdsSegment
import kr.devslab.dds.compose.component.DdsSegmentedControl
import kr.devslab.dds.compose.component.SEGMENT_THUMB_TAG
import kr.devslab.dds.compose.motion.isReducedMotion
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assume.assumeFalse
import kr.devslab.dds.compose.theme.DdsColors
import kr.devslab.dds.compose.theme.DdsTheme
import kr.devslab.dds.tokens.DdsBorder
import kr.devslab.dds.tokens.DdsSpace
import kr.devslab.dds.tokens.DdsTouch
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * The segmented control: its sizes, that choosing never moves anything, what
 * its edges and faces are made of (read from the pixels a device draws), and
 * what a screen reader hears.
 *
 * Run on an emulator or a phone (CI has neither):
 *   ANDROID_SERIAL=<device> ./gradlew :dds-compose:connectedDebugAndroidTest
 */
class SegmentedOnDeviceTest {
    @get:Rule
    val rule = createComposeRule()

    private val green = Color.Green
    private lateinit var colors: DdsColors

    private val kinds = listOf(DdsSegment("person", "개인"), DdsSegment("shop", "비즈니스"))

    /** The control on a page of a green no theme has, so the page and a face cannot be mistaken. */
    @OptIn(ExperimentalMaterial3Api::class)
    private fun show(dark: Boolean = false, largeText: Boolean = false, width: Int? = null, content: @Composable () -> Unit) {
        rule.setContent {
            DdsTheme(darkTheme = dark, largeText = largeText) {
                colors = DdsTheme.colors
                CompositionLocalProvider(LocalRippleConfiguration provides null) {
                    Box(Modifier.background(green).padding(16.dp)) {
                        Box(if (width != null) Modifier.width(width.dp) else Modifier) { content() }
                    }
                }
            }
        }
        rule.waitForIdle()
    }

    private fun bounds(tag: String): Rect = rule.onNodeWithTag(tag).fetchSemanticsNode().boundsInRoot

    private fun segment(label: String): Rect = rule.onNodeWithText(label).fetchSemanticsNode().boundsInRoot

    private val oneDp: Float get() = with(rule.density) { 1.dp.toPx() }

    private fun px(dp: Int): Float = dp * oneDp

    private fun assertPx(message: String, expectedDp: Int, actualPx: Float) =
        assertEquals(message, px(expectedDp), actualPx, 1f)

    private fun textLayout(label: String): TextLayoutResult {
        val results = mutableListOf<TextLayoutResult>()
        // The unseen bold copy that holds the width has no semantics, so this is the drawn label.
        val node = rule.onNodeWithText(label, useUnmergedTree = true).fetchSemanticsNode()
        node.config[SemanticsActions.GetTextLayoutResult].action!!.invoke(results)
        return results.single()
    }

    // --- size ------------------------------------------------------------------

    @Test
    fun theTrackIsTheTouchHeightPlusItsLineAndASegmentIsTheTouchHeight() {
        show { DdsSegmentedControl(kinds, "person", {}, Modifier.testTag("control"), contentDescription = "종류") }
        // 50 = 48 of touch + the 1dp line above and below; the face is 44 = 48 less 2dp above and below.
        assertPx("track", DdsTouch.min + 2 * DdsBorder.hairline, bounds("control").height)
        assertPx("segment", DdsTouch.min, segment("개인").height)
        assertEquals(50, DdsTouch.min + 2 * DdsBorder.hairline)
        assertEquals(44, DdsTouch.min - 2 * DdsSpace.s2)
    }

    @Test
    fun inLargeTextTheTouchHeightIsTheLargeOne() {
        show(largeText = true) { DdsSegmentedControl(kinds, "person", {}, Modifier.testTag("control"), contentDescription = "종류") }
        assertPx("track", DdsTouch.large + 2 * DdsBorder.hairline, bounds("control").height)
        assertPx("segment", DdsTouch.large, segment("개인").height)
    }

    @Test
    fun aOneLetterSegmentIsStillAtLeastAFaceWide() {
        show { DdsSegmentedControl(listOf(DdsSegment(1, "A"), DdsSegment(2, "B")), 1, {}, contentDescription = "문자") }
        assertTrue("A is ${segment("A").width}px", segment("A").width >= px(DdsTouch.min - 2 * DdsSpace.s2) - 1f)
    }

    @Test
    fun segmentsSitTwoDpInsideTheLineAndTwoDpApart() {
        show { DdsSegmentedControl(kinds, "person", {}, Modifier.testTag("control"), contentDescription = "종류") }
        val track = bounds("control")
        val first = segment("개인")
        val second = segment("비즈니스")
        assertPx("start inset", DdsBorder.hairline + DdsSpace.s2, first.left - track.left)
        assertPx("top inset", DdsBorder.hairline, first.top - track.top)
        assertPx("gap", DdsSpace.s2, second.left - first.right)
        assertPx("end inset", DdsBorder.hairline + DdsSpace.s2, track.right - second.right)
    }

    // --- nothing moves ---------------------------------------------------------

    @Test
    fun choosingASegmentMovesNoSegment() {
        var chosen by mutableStateOf("day")
        val labels = listOf("일", "주", "월간 보기")
        show {
            DdsSegmentedControl(
                listOf(DdsSegment("day", labels[0]), DdsSegment("week", labels[1]), DdsSegment("month", labels[2])),
                chosen,
                { chosen = it },
                contentDescription = "기간",
            )
        }
        val before = labels.map(::segment)
        rule.onNodeWithText("월간 보기").performClick()
        rule.waitForIdle()
        assertEquals("month", chosen)
        val after = labels.map(::segment)
        for (i in labels.indices) {
            assertEquals("${labels[i]} left", before[i].left, after[i].left, 0.5f)
            assertEquals("${labels[i]} width", before[i].width, after[i].width, 0.5f)
        }
    }

    @Test
    fun fullWidthSegmentsShareTheWidthEquallyAndFillIt() {
        show(width = 360) {
            DdsSegmentedControl(kinds, "person", {}, Modifier.testTag("control"), contentDescription = "종류", fullWidth = true)
        }
        val track = bounds("control")
        assertPx("track", 360, track.width)
        assertEquals(segment("개인").width, segment("비즈니스").width, 1f)
        // The last segment ends on the track's inner edge, the same 3dp in as the first one starts.
        assertPx("start inset", DdsBorder.hairline + DdsSpace.s2, segment("개인").left - track.left)
        assertPx("end inset", DdsBorder.hairline + DdsSpace.s2, track.right - segment("비즈니스").right)
    }

    @Test
    fun aLongFullWidthLabelEndsInAnEllipsisOnOneLineButIsReadWhole() {
        val long = "사업자 등록이 되어 있는 비즈니스 명함"
        show(width = 240) {
            DdsSegmentedControl(listOf(DdsSegment(1, "개인"), DdsSegment(2, long)), 2, {}, contentDescription = "종류", fullWidth = true)
        }
        assertEquals("shares stay equal", segment("개인").width, segment(long).width, 1f)
        val layout = textLayout(long)
        assertEquals(1, layout.lineCount)
        assertTrue("the label is cut with an ellipsis", layout.isLineEllipsized(0))
    }

    @Test
    fun tooManySegmentsScrollInsideTheTrackAndNoLabelWraps() {
        val labels = listOf("전체 보기", "서명 대기 중", "확정된 계약", "취소된 계약", "보관함")
        show(width = 200) {
            DdsSegmentedControl(labels.map { DdsSegment(it, it) }, labels[0], {}, Modifier.testTag("control"), contentDescription = "보기")
        }
        assertTrue("the track stays inside its 200dp", bounds("control").width <= px(200) + 1f)
        for (label in labels) assertEquals("$label is one line", 1, textLayout(label).lineCount)
        rule.onNode(keyIsDefined(SemanticsProperties.HorizontalScrollAxisRange)).assertExists()
    }

    // --- the chosen face slides (D-055) ---------------------------------------------

    private fun thumb(): Rect = rule.onNodeWithTag(SEGMENT_THUMB_TAG, useUnmergedTree = true).fetchSemanticsNode().boundsInRoot

    @Test
    fun onTheFirstFrameTheFaceIsAlreadyOnTheChosenSegment() {
        // The clock is held from the start, so this is the first frame, not a settled one.
        rule.mainClock.autoAdvance = false
        rule.setContent {
            DdsTheme { Box(Modifier.width(360.dp)) { DdsSegmentedControl(kinds, "shop", {}, contentDescription = "종류", fullWidth = true) } }
        }
        rule.mainClock.advanceTimeByFrame()
        val face = thumb()
        val chosen = segment("비즈니스")
        assertEquals("face start", chosen.left, face.left, 1f)
        assertEquals("face end", chosen.right, face.right, 1f)
        // 2dp in from the touch area above and below: the 44dp face.
        assertPx("face height", DdsTouch.min - 2 * DdsSpace.s2, face.height)
        rule.mainClock.autoAdvance = true
    }

    @Test
    fun choosingSlidesTheFaceAcrossAndItEndsOnTheNewSegment() {
        assumeFalse("animations are turned off on this device", isReducedMotion(InstrumentationRegistry.getInstrumentation().targetContext))
        var chosen by mutableStateOf("day")
        val labels = listOf("일", "주", "월간 보기")
        show {
            DdsSegmentedControl(
                listOf(DdsSegment("day", labels[0]), DdsSegment("week", labels[1]), DdsSegment("month", labels[2])),
                chosen,
                { chosen = it },
                contentDescription = "기간",
            )
        }
        val from = segment(labels[0])
        val to = segment(labels[2])
        rule.mainClock.autoAdvance = false
        rule.onNodeWithText(labels[2]).performClick()
        rule.mainClock.advanceTimeBy(100) // half of the 200ms move
        val midway = thumb()
        assertTrue("midway the face is past where it was: $midway", midway.left > from.left + 1f)
        assertTrue("and short of where it goes: $midway", midway.left < to.left - 1f)
        assertTrue("its width is between the two: $midway", midway.width > from.width + 1f && midway.width < to.width - 1f)
        rule.mainClock.autoAdvance = true
        rule.waitForIdle()
        val end = thumb()
        assertEquals("end start", to.left, end.left, 1f)
        assertEquals("end width", to.width, end.width, 1f)
    }

    @Test
    fun anAppCanSlowTheSlideDown() {
        assumeFalse("animations are turned off on this device", isReducedMotion(InstrumentationRegistry.getInstrumentation().targetContext))
        var chosen by mutableStateOf("person")
        show {
            DdsSegmentedControl(
                kinds,
                chosen,
                { chosen = it },
                contentDescription = "종류",
                fullWidth = true,
                slideAnimationSpec = tween(1_000, easing = LinearEasing),
            )
        }
        val from = segment("개인")
        val to = segment("비즈니스")
        rule.mainClock.autoAdvance = false
        rule.onNodeWithText("비즈니스").performClick()
        // Past the default 200ms, the app's 1s slide is still about a third of the way.
        rule.mainClock.advanceTimeBy(350)
        val midway = thumb()
        assertTrue("still travelling at 350ms: $midway", midway.left > from.left + 1f && midway.left < to.left - 1f)
        rule.mainClock.autoAdvance = true
        rule.waitForIdle()
        assertEquals("it ends on the new segment", to.left, thumb().left, 1f)
    }

    @Test
    fun noChoiceDrawsNoFace() {
        show { DdsSegmentedControl(kinds, "nothing", {}, contentDescription = "종류") }
        rule.onNodeWithTag(SEGMENT_THUMB_TAG, useUnmergedTree = true).assertDoesNotExist()
    }

    // --- pixels ------------------------------------------------------------------

    private fun control(): PixelMap = rule.onNodeWithTag("control").captureToImage().toPixelMap()

    private fun close(a: Color, b: Color): Boolean =
        maxOf(abs(a.red - b.red), abs(a.green - b.green), abs(a.blue - b.blue)) <= 2f / 255f

    private fun assertColor(message: String, expected: Color, actual: Color) =
        assertTrue("$message: expected $expected but was $actual", close(expected, actual))

    /** A segment's box in the control's own pixels. */
    private fun inControl(label: String): Rect = segment(label).translate(-bounds("control").topLeft)

    private fun assertDrawnWith(line: Color) {
        val pixels = control()
        val chosen = inControl("개인")
        val other = inControl("비즈니스")
        val half = (oneDp / 2).toInt()
        val midY = chosen.center.y.toInt()
        assertColor("the track's line", line, pixels[pixels.width / 2, half])
        // Read over the unchosen segment, clear of the chosen face's shadow.
        assertColor("the track between its line and the faces", colors.bgSubtle, pixels[other.center.x.toInt(), (2 * oneDp).toInt()])
        assertColor("an unchosen segment shows the track", colors.bgSubtle, pixels[(other.right - 6 * oneDp).toInt(), midY])
        assertColor("the chosen face", colors.bgRaised, pixels[(chosen.left + 6 * oneDp).toInt(), midY])
        assertColor("the chosen face's line", colors.borderStrong, pixels[(chosen.left + half).toInt(), midY])
    }

    @Test
    fun theTrackAndTheChosenFaceAreMadeOfTheirTokens() {
        show { DdsSegmentedControl(kinds, "person", {}, Modifier.testTag("control"), contentDescription = "종류", fullWidth = true) }
        assertDrawnWith(line = colors.borderStrong)
    }

    @Test
    fun theDarkThemeIsTheSameTokensDark() {
        show(dark = true) { DdsSegmentedControl(kinds, "person", {}, Modifier.testTag("control"), contentDescription = "종류", fullWidth = true) }
        assertDrawnWith(line = colors.borderStrong)
    }

    @Test
    fun inTheDarkThemeTheChosenFaceIsLighterThanTheTrackNotAHole() {
        show(dark = true) { DdsSegmentedControl(kinds, "person", {}, Modifier.testTag("control"), contentDescription = "종류", fullWidth = true) }
        val pixels = control()
        val chosen = inControl("개인")
        val other = inControl("비즈니스")
        val face = pixels[(chosen.left + 6 * oneDp).toInt(), chosen.center.y.toInt()]
        val track = pixels[(other.right - 6 * oneDp).toInt(), other.center.y.toInt()]
        assertTrue("face $face is lighter than track $track", face.luminance() > track.luminance())
        assertTrue("and not the page's darker bgDefault", !close(face, colors.bgDefault))
    }

    @Test
    fun anErrorTurnsTheTrackLineTheDangerColorAndSaysWhy() {
        show {
            DdsSegmentedControl(kinds, "person", {}, Modifier.testTag("control"), contentDescription = "종류", fullWidth = true, error = "종류를 고르세요")
        }
        assertDrawnWith(line = colors.statusDanger)
        rule.onNodeWithText("종류를 고르세요").assertExists()
        rule.onNode(keyIsDefined(SemanticsProperties.Error)).assert(expectValue(SemanticsProperties.Error, "종류를 고르세요"))
    }

    @Test
    fun aDisabledControlIsDimmedAsAWhole() {
        show { DdsSegmentedControl(kinds, "person", {}, Modifier.testTag("control"), contentDescription = "종류", fullWidth = true, enabled = false) }
        val pixels = control()
        val other = inControl("비즈니스")
        assertColor(
            "an unchosen segment: the track at 45%, the page through the rest",
            Color(
                colors.bgSubtle.red * 0.45f + green.red * 0.55f,
                colors.bgSubtle.green * 0.45f + green.green * 0.55f,
                colors.bgSubtle.blue * 0.45f + green.blue * 0.55f,
            ),
            pixels[(other.right - 6 * oneDp).toInt(), other.center.y.toInt()],
        )
    }

    // --- screen reader -----------------------------------------------------------

    @Test
    fun eachSegmentIsARadioButtonThatSaysWhetherItIsChosen() {
        show { DdsSegmentedControl(kinds, "shop", {}, contentDescription = "명함 종류") }
        rule.onNodeWithText("개인")
            .assert(expectValue(SemanticsProperties.Role, Role.RadioButton))
            .assert(hasClickAction())
            .assertIsNotSelected()
            .assertIsEnabled()
        rule.onNodeWithText("비즈니스")
            .assert(expectValue(SemanticsProperties.Role, Role.RadioButton))
            .assertIsSelected()
        // The unseen bold copy that holds the width is not read: each segment says its words once.
        rule.onNodeWithText("개인").assert(expectValue(SemanticsProperties.Text, listOf(androidx.compose.ui.text.AnnotatedString("개인"))))
    }

    @Test
    fun theSegmentsAreOneGroupWithAName() {
        show { DdsSegmentedControl(kinds, "shop", {}, contentDescription = "명함 종류") }
        rule.onNode(hasContentDescription("명함 종류"))
            .assert(keyIsDefined(SemanticsProperties.SelectableGroup))
    }

    @Test
    fun aVisibleLabelNamesTheGroupAndIsNotSaidTwice() {
        show { DdsSegmentedControl(kinds, "shop", {}, label = "명함 종류", contentDescription = "다른 이름") }
        rule.onNodeWithText("명함 종류").assertExists()
        rule.onNode(hasContentDescription("다른 이름")).assertDoesNotExist()
    }

    @Test
    fun choosingCallsBackWithTheValueButTheChosenSegmentDoesNot() {
        val calls = mutableListOf<String>()
        show { DdsSegmentedControl(kinds, "person", { calls += it }, contentDescription = "종류") }
        rule.onNodeWithText("개인").performClick()
        rule.onNodeWithText("비즈니스").performClick()
        assertEquals(listOf("shop"), calls)
    }

    @Test
    fun aReadOnlyControlIsReadButCannotBeChanged() {
        val calls = mutableListOf<String>()
        show { DdsSegmentedControl(kinds, "shop", { calls += it }, contentDescription = "종류", readOnly = true) }
        rule.onNodeWithText("개인")
            .assert(expectValue(SemanticsProperties.Role, Role.RadioButton))
            .assert(keyNotDefined(SemanticsActions.OnClick))
            .assertIsNotSelected()
        rule.onNodeWithText("비즈니스").assertIsSelected().assert(keyIsDefined(SemanticsProperties.Focused))
        assertTrue(calls.isEmpty())
    }

    @Test
    fun aDisabledControlAndADisabledSegmentSaySo() {
        show { DdsSegmentedControl(kinds, "person", {}, contentDescription = "종류", enabled = false) }
        rule.onNodeWithText("개인").assertIsNotEnabled()
        rule.onNodeWithText("비즈니스").assertIsNotEnabled()
    }

    @Test
    fun aSegmentCanBeDisabledOnItsOwn() {
        val calls = mutableListOf<Int>()
        show { DdsSegmentedControl(listOf(DdsSegment(1, "일"), DdsSegment(2, "연", enabled = false)), 1, { calls += it }, contentDescription = "기간") }
        rule.onNodeWithText("일").assertIsEnabled()
        rule.onNodeWithText("연").assertIsNotEnabled().performClick()
        assertTrue(calls.isEmpty())
    }

    @Test
    fun aValueThatIsNoSegmentChoosesNone() {
        show { DdsSegmentedControl(kinds, "nothing", {}, contentDescription = "종류") }
        rule.onNodeWithText("개인").assertIsNotSelected()
        rule.onNodeWithText("비즈니스").assertIsNotSelected()
    }
}
