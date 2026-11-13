package kr.devslab.dds.compose

import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.font.FontFamily
import kr.devslab.dds.compose.component.DdsButton
import kr.devslab.dds.compose.component.DdsSegment
import kr.devslab.dds.compose.component.DdsSegmentedControl
import kr.devslab.dds.compose.theme.DdsSans
import kr.devslab.dds.compose.theme.DdsTheme
import org.junit.Assert.assertSame
import org.junit.Rule
import org.junit.Test

/**
 * The font family an app passes to [DdsTheme] reaches the text DDS components lay out;
 * without one, the text is Pretendard as before.
 *
 * Run on an emulator or a phone (CI has neither):
 *   ANDROID_SERIAL=<device> ./gradlew :dds-compose:connectedDebugAndroidTest
 */
class ThemeFontOnDeviceTest {
    @get:Rule
    val rule = createComposeRule()

    private fun show(family: FontFamily?) {
        val content: @Composable () -> Unit = {
            Column {
                DdsButton("저장", onClick = {})
                DdsSegmentedControl(listOf(DdsSegment(1, "개인"), DdsSegment(2, "비즈니스")), 1, {}, contentDescription = "종류")
            }
        }
        rule.setContent { if (family == null) DdsTheme(content = content) else DdsTheme(fontFamily = family, content = content) }
        rule.waitForIdle()
    }

    /** The family the label was laid out in. */
    private fun familyOf(text: String): FontFamily? {
        val results = mutableListOf<TextLayoutResult>()
        rule.onNodeWithText(text, useUnmergedTree = true).fetchSemanticsNode()
            .config[SemanticsActions.GetTextLayoutResult].action!!.invoke(results)
        return results.single().layoutInput.style.fontFamily
    }

    @Test
    fun withoutAFamilyTheTextIsPretendard() {
        show(null)
        assertSame(DdsSans, familyOf("저장"))
        assertSame(DdsSans, familyOf("개인"))
    }

    @Test
    fun aFamilyTheAppPassesIsTheOneTheTextIsLaidOutIn() {
        val own = FontFamily.Serif
        show(own)
        assertSame(own, familyOf("저장"))
        assertSame(own, familyOf("개인"))
        assertSame(own, familyOf("비즈니스"))
    }
}
