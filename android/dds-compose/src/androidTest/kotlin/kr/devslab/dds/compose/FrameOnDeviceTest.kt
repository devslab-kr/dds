package kr.devslab.dds.compose

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.test.DeviceConfigurationOverride
import androidx.compose.ui.test.FontScale
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.unit.dp
import kr.devslab.dds.compose.component.DdsBottomBar
import kr.devslab.dds.compose.component.DdsNavItem
import kr.devslab.dds.compose.component.DdsNavRail
import kr.devslab.dds.compose.icons.DdsIcons
import kr.devslab.dds.compose.layout.DdsTestTags
import kr.devslab.dds.compose.theme.DdsTheme
import kr.devslab.dds.tokens.DdsBar
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * The parts of the screen frame measured on a device: the navigation at large text, and
 * (in later tests) the frame's size classes and body column.
 */
class FrameOnDeviceTest {
    @get:Rule
    val rule = createComposeRule()

    private val long = "거래처 매출 관리"
    private val short = "거래처 관리"

    private fun items(vararg labels: String): List<DdsNavItem> = labels.map { DdsNavItem(it, DdsIcons.Doc) }

    /** [content] under the theme at font scale [scale]. */
    private fun shown(scale: Float = 1f, content: @Composable () -> Unit) {
        rule.setContent {
            DeviceConfigurationOverride(DeviceConfigurationOverride.FontScale(scale)) {
                DdsTheme { content() }
            }
        }
    }

    /** The text layout the node reports: how many lines it drew and whether it ran out of room. */
    private fun layoutOf(node: SemanticsNodeInteraction): TextLayoutResult {
        val results = mutableListOf<TextLayoutResult>()
        val semantics: SemanticsNode = node.fetchSemanticsNode()
        semantics.config[SemanticsActions.GetTextLayoutResult].action!!.invoke(results)
        return results.single()
    }

    /** The label [text] is on two lines and inside the part tagged [barTag]; returns its layout. */
    private fun assertLabelIsTwoLinesInside(text: String, barTag: String): TextLayoutResult {
        val label = rule.onNodeWithText(text, useUnmergedTree = true)
        val layout = layoutOf(label)
        assertEquals("the label's lines", 2, layout.lineCount)
        val bar = rule.onNodeWithTag(barTag).getUnclippedBoundsInRoot()
        val bounds = label.getUnclippedBoundsInRoot()
        assertTrue("label $bounds is inside the bar $bar", bounds.top >= bar.top && bounds.bottom <= bar.bottom)
        assertTrue("label $bounds is inside the bar $bar", bounds.left >= bar.left && bounds.right <= bar.right)
        return layout
    }

    @Test
    fun aLongLabelIsShownOnTwoLinesNotCutInTheBottomTabs() {
        shown(scale = 2f) { DdsBottomBar(items(long, "홈", "설정", "더보기"), 0, {}, Modifier) }
        val layout = assertLabelIsTwoLinesInside(long, DdsTestTags.BottomTabs)
        assertFalse("the label ran out of room", layout.hasVisualOverflow)
    }

    /** The rail is 80dp wide, so a label that fits two lines there is a shorter one. */
    @Test
    fun aLabelIsShownOnTwoLinesNotCutInTheRail() {
        shown(scale = 2f) { Box(Modifier.height(600.dp)) { DdsNavRail(items(short, "홈"), 0, {}) } }
        val layout = assertLabelIsTwoLinesInside(short, DdsTestTags.Rail)
        assertFalse("the label ran out of room", layout.hasVisualOverflow)
    }

    /** What the 80dp rail does with a label that needs three lines: two, and an ellipsis, inside the rail. */
    @Test
    fun aLabelTooLongForTheRailEndsInAnEllipsisAfterTwoLines() {
        shown(scale = 2f) { Box(Modifier.height(600.dp)) { DdsNavRail(items(long, "홈"), 0, {}) } }
        val layout = assertLabelIsTwoLinesInside(long, DdsTestTags.Rail)
        assertTrue("the second line ends in an ellipsis", layout.isLineEllipsized(1))
    }

    @Test
    fun theRailScrollsWhenItsItemsDoNotFit() {
        val labels = (1..6).map { "항목 $it" }.toTypedArray()
        shown { Box(Modifier.height(200.dp)) { DdsNavRail(items(*labels), 0, {}) } }
        rule.onNodeWithText("항목 6").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun theRailIsItsTokenWide() {
        shown(scale = 2f) { Box(Modifier.height(600.dp)) { DdsNavRail(items(long, "홈"), 0, {}) } }
        val bounds = rule.onNodeWithTag(DdsTestTags.Rail).getUnclippedBoundsInRoot()
        assertEquals(DdsBar.rail.dp, bounds.right - bounds.left)
    }
}
