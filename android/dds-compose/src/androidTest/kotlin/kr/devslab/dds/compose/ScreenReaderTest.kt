package kr.devslab.dds.compose

import kr.devslab.dds.tokens.DdsTouch
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.runtime.setValue
import androidx.compose.runtime.getValue
import androidx.compose.foundation.layout.Box
import org.junit.Assert.assertTrue
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Column
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsMatcher.Companion.expectValue
import androidx.compose.ui.test.SemanticsMatcher.Companion.keyIsDefined
import androidx.compose.ui.test.SemanticsMatcher.Companion.keyNotDefined
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertAll
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.onChildren
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsFocused
import androidx.compose.ui.test.assertIsOn
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithContentDescription
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kr.devslab.dds.compose.component.DdsBottomSheet
import kr.devslab.dds.compose.component.DdsButton
import kr.devslab.dds.compose.component.DdsButtonVariant
import kr.devslab.dds.compose.component.DdsCheckbox
import kr.devslab.dds.compose.component.DdsChip
import kr.devslab.dds.compose.component.DdsListRow
import kr.devslab.dds.compose.component.DdsMenu
import kr.devslab.dds.compose.component.DdsMenuAlign
import kr.devslab.dds.compose.component.DdsMenuDivider
import kr.devslab.dds.compose.component.DdsMenuItem
import kr.devslab.dds.compose.component.DdsNotice
import kr.devslab.dds.compose.component.DdsSearchField
import kr.devslab.dds.compose.component.DdsSelectField
import kr.devslab.dds.compose.component.DdsTabs
import kr.devslab.dds.compose.component.DdsTextField
import kr.devslab.dds.compose.component.DdsTone
import kr.devslab.dds.compose.component.DdsValueRow
import kr.devslab.dds.compose.motion.DdsBusyBar
import kr.devslab.dds.compose.motion.ddsScreenContent
import kr.devslab.dds.compose.theme.DdsTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * What a screen reader is given. Each test is a sentence about what a person
 * who cannot see the screen hears; it reads the merged semantics tree, which is
 * what TalkBack walks.
 *
 * Run on an emulator or a phone (CI has neither):
 *   ANDROID_SERIAL=<device> ./gradlew :dds-compose:connectedDebugAndroidTest
 */
@RunWith(AndroidJUnit4::class)
class ScreenReaderTest {
    @get:Rule
    val rule = createComposeRule()

    private fun word(id: Int): String = InstrumentationRegistry.getInstrumentation().targetContext.getString(id)

    private fun show(content: @Composable () -> Unit) = rule.setContent { DdsTheme { content() } }

    // --- text field ---------------------------------------------------------

    @Test
    fun aTextFieldIsOneStopThatCarriesItsLabel() {
        show { DdsTextField("데브스랩", {}, label = "거래처 이름") }
        // The label is said once, by the field itself — not by a separate text before it.
        rule.onAllNodes(hasText("거래처 이름")).assertCountEquals(1)
        rule.onNode(hasText("거래처 이름")).assert(hasSetTextAction()).assert(hasText("데브스랩"))
        // A content description on an edit box can be read instead of what was typed.
        rule.onNode(hasSetTextAction()).assert(keyNotDefined(SemanticsProperties.ContentDescription))
    }

    @Test
    fun anErrorIsOnTheFieldAndIsSpokenWhenItAppears() {
        var error by mutableStateOf<String?>(null)
        show { DdsTextField("010", {}, label = "연락처", helper = "숫자만", error = error) }
        // A hint is not an announcement.
        rule.onNodeWithText("숫자만").assert(keyNotDefined(SemanticsProperties.LiveRegion))
        error = "전화번호 형식이 아닙니다"
        rule.waitForIdle()
        rule.onNode(hasSetTextAction()).assert(expectValue(SemanticsProperties.Error, "전화번호 형식이 아닙니다"))
        // The message line was already there; its text changing is what gets spoken.
        rule.onNode(hasText("전화번호 형식이 아닙니다") and keyIsDefined(SemanticsProperties.LiveRegion)).assertExists()
    }

    // --- notice --------------------------------------------------------------

    @Test
    fun aNoticeSaysWhatKindItIsEvenWhenTheAppSaidNothing() {
        show {
            Column {
                DdsNotice("보내지 못했습니다", tone = DdsTone.Danger)
                DdsNotice("새 버전이 있습니다", tone = DdsTone.Info)
            }
        }
        val error = word(R.string.dds_a11y_tone_danger)
        val notice = word(R.string.dds_a11y_tone_info)
        assertNotEquals("an error and a notice must not sound alike", error, notice)
        // One stop each: the kind and the message together.
        rule.onNode(hasText("보내지 못했습니다"))
            .assert(hasContentDescription(error))
            .assert(expectValue(SemanticsProperties.LiveRegion, LiveRegionMode.Assertive))
        rule.onNode(hasText("새 버전이 있습니다"))
            .assert(hasContentDescription(notice))
            .assert(expectValue(SemanticsProperties.LiveRegion, LiveRegionMode.Polite))
    }

    @Test
    fun anAppCanGiveANoticeItsOwnWordOrNone() {
        show {
            Column {
                DdsNotice("저장하지 못했습니다", tone = DdsTone.Danger, iconDescription = "문제")
                DdsNotice("오류: 연결이 끊겼습니다", tone = DdsTone.Danger, iconDescription = "")
            }
        }
        rule.onNode(hasText("저장하지 못했습니다")).assert(hasContentDescription("문제"))
        rule.onNode(hasText("오류: 연결이 끊겼습니다")).assert(keyNotDefined(SemanticsProperties.ContentDescription))
    }

    // --- rows ----------------------------------------------------------------

    @Test
    fun aRowThatOnlyShowsSomethingIsReadAsOneThing() {
        show { DdsListRow("버전", trailing = { Text("1.2.0") }) }
        rule.onNode(hasText("버전") and hasText("1.2.0")).assertExists()
    }

    @Test
    fun aRowThatCanBePressedSaysItIsAButton() {
        show { DdsListRow("설정", onClick = {}) }
        rule.onNodeWithText("설정").assert(expectValue(SemanticsProperties.Role, Role.Button))
    }

    @Test
    fun aValueIsReadWithItsName() {
        show { DdsValueRow("공급가액", "1,121,818원") }
        rule.onNode(hasText("공급가액") and hasText("1,121,818원")).assertExists()
    }

    // --- search and select -----------------------------------------------------

    @Test
    fun anEmptySearchFieldHasNoInvisibleButtonAndSaysWhatGoesInIt() {
        show { DdsSearchField("", {}, label = "거래처 검색", clearDescription = "지우기") }
        rule.onNodeWithContentDescription("지우기").assertDoesNotExist()
        // With no placeholder given, the label is shown as one.
        rule.onNode(hasSetTextAction()).assert(hasText("거래처 검색"))
    }

    @Test
    fun aSearchFieldKeepsItsNameOnceSomethingIsTyped() {
        show { DdsSearchField("데브", {}, label = "거래처 검색", clearDescription = "지우기") }
        // The name is text of the field, not a description that could replace what was typed.
        rule.onNode(hasSetTextAction())
            .assert(hasText("거래처 검색"))
            .assert(hasText("데브"))
            .assert(keyNotDefined(SemanticsProperties.ContentDescription))
    }


    @Test
    fun clearingASearchLeavesThePersonInTheField() {
        show {
            var query by remember { mutableStateOf("데브") }
            DdsSearchField(query, { query = it }, label = "거래처 검색", clearDescription = "지우기")
        }
        rule.onNodeWithContentDescription("지우기").performClick()
        rule.onNodeWithContentDescription("지우기").assertDoesNotExist()
        rule.onNode(hasSetTextAction()).assertIsFocused()
    }

    @Test
    fun aSelectFieldSaysItsLabelOnceAndWhatIsInTheBox() {
        var chosen by mutableStateOf<Int?>(null)
        show { DdsSelectField("입금 은행", listOf("국민은행", "신한은행"), chosen, { chosen = it }, placeholder = "선택") }
        rule.onAllNodes(hasText("입금 은행")).assertCountEquals(0) // the visible label is not a stop of its own
        rule.onAllNodesWithContentDescription("입금 은행").assertCountEquals(1)
        rule.onNodeWithContentDescription("입금 은행")
            .assert(expectValue(SemanticsProperties.Role, Role.DropdownList))
            .assert(expectValue(SemanticsProperties.StateDescription, "선택")) // nothing chosen is said too
        chosen = 1
        rule.waitForIdle()
        rule.onNodeWithContentDescription("입금 은행").assert(expectValue(SemanticsProperties.StateDescription, "신한은행"))
    }

    // --- controls ---------------------------------------------------------------

    @Test
    fun aLoadingButtonSaysSoKeepsFocusAndIgnoresPresses() {
        var presses by mutableIntStateOf(0)
        show { DdsButton("저장", onClick = { presses++ }, loading = true) }
        rule.onNodeWithText("저장")
            .assert(expectValue(SemanticsProperties.StateDescription, word(R.string.dds_a11y_loading)))
            .assertIsEnabled() // a disabled button would drop focus and say only "disabled"
            .performClick()
        rule.waitForIdle()
        assertEquals(0, presses)
    }

    @Test
    fun aPlainButtonIsAButtonWithItsLabel() {
        var presses by mutableIntStateOf(0)
        show { DdsButton("닫기", onClick = { presses++ }, variant = DdsButtonVariant.Plain) }
        // Quieter to look at, the same to hear: one stop, its words, "button".
        rule.onAllNodes(hasText("닫기")).assertCountEquals(1)
        rule.onNodeWithText("닫기")
            .assert(expectValue(SemanticsProperties.Role, Role.Button))
            .assertIsEnabled()
            .performClick()
        rule.waitForIdle()
        assertEquals(1, presses)
    }

    @Test
    fun aCheckboxRowIsOneStopWithItsState() {
        show { DdsCheckbox(true, {}, label = "약관에 동의합니다", description = "필수") }
        rule.onNodeWithText("약관에 동의합니다") // found by the words as written, not the joined text
            .assert(expectValue(SemanticsProperties.Role, Role.Checkbox))
            .assert(hasText("필수"))
            .assertIsOn()
    }

    @Test
    fun aChipSaysWhetherItIsSelected() {
        show { DdsChip("전체", selected = true, onSelectedChange = {}) }
        rule.onNodeWithText("전체").assertIsOn()
    }

    @Test
    fun tabsKeepTheirWordsAndSurviveAnIndexThatIsOutOfRange() {
        show { DdsTabs(listOf("전체", "서명 대기", "확정"), selectedIndex = 7, onSelect = {}) }
        rule.onNodeWithText("서명 대기").assertExists()
        rule.onNodeWithText("확정").assert(expectValue(SemanticsProperties.Selected, true)) // the nearest tab
    }

    @Test
    fun threeShortTabsShareTheWidthEqually() {
        show { Box(Modifier.width(360.dp)) { DdsTabs(listOf("전체", "대기", "확정"), selectedIndex = 0, onSelect = {}) } }
        val widths = listOf("전체", "대기", "확정").map { rule.onNodeWithText(it).fetchSemanticsNode().boundsInRoot.width }
        val third = with(rule.density) { 360.dp.toPx() } / 3
        for (w in widths) assertEquals(third, w, 2f)
    }

    @Test
    fun tabsCanSitUnderAParentThatAsksForIntrinsicSizes() {
        // A layout that composes against its constraints throws here; 0.4.0's tabs did not.
        show {
            Row(Modifier.width(360.dp).height(IntrinsicSize.Min)) {
                Box(Modifier.weight(1f)) { DdsTabs(listOf("전체", "확정"), selectedIndex = 1, onSelect = {}) }
            }
        }
        rule.onNodeWithText("확정").assertExists()
    }

    @Test
    fun aLongTabLabelIsKeptWholeInsteadOfBeingCut() {
        val long = "서명을 기다리는 계약서 전체 목록"
        show { Box(Modifier.width(240.dp)) { DdsTabs(listOf("전체", long, "확정"), selectedIndex = 0, onSelect = {}) } }
        val share = with(rule.density) { 240.dp.toPx() } / 3
        assertTrue(rule.onNodeWithText(long).fetchSemanticsNode().boundsInRoot.width > share)
    }

    /** Where the tab underline starts, in px: the first painted pixel on the row's last line. */
    private fun underlineStart(rowHeightPx: Int): Int {
        val pixels = rule.onRoot().captureToImage().toPixelMap()
        val y = rowHeightPx - 1
        val paper = pixels[pixels.width - 1, y / 2] // the row's own background, clear of any label
        return (0 until pixels.width).firstOrNull { pixels[it, y] != paper } ?: -1
    }

    @Test
    fun theUnderlineTravelsToTheChosenTabInsteadOfJumping() {
        var chosen by mutableIntStateOf(0)
        show { Box(Modifier.width(360.dp)) { DdsTabs(listOf("전체", "대기", "확정"), chosen, { chosen = it }) } }
        val row = with(rule.density) { DdsTouch.min.dp.roundToPx() }
        val third = with(rule.density) { 360.dp.roundToPx() } / 3
        assertEquals(0, underlineStart(row))

        rule.mainClock.autoAdvance = false
        chosen = 2
        rule.mainClock.advanceTimeBy(100) // half of the 200ms it takes
        val midway = underlineStart(row)
        assertTrue("on its way at 100ms, but was at $midway", midway > 0 && midway < 2 * third)

        rule.mainClock.autoAdvance = true
        rule.waitForIdle()
        assertEquals(2 * third, underlineStart(row))
    }

    // --- menu -----------------------------------------------------------------------

    @Test
    fun theDividerIsNotReadAsAnItem() {
        show {
            Box {
                DdsMenu(expanded = true, onDismissRequest = {}, modifier = Modifier.testTag("menu")) {
                    DdsMenuItem("수정", onClick = {})
                    DdsMenuDivider()
                    DdsMenuItem("삭제", onClick = {}, danger = true)
                }
            }
        }
        // Two stops, both actions: the line between them is only something to see.
        rule.onNodeWithTag("menu").onChildren().assertCountEquals(2).assertAll(hasClickAction())
        rule.onNodeWithTag("menu").onChildren()[0].assert(hasText("수정"))
        rule.onNodeWithTag("menu").onChildren()[1].assert(hasText("삭제"))
    }

    @Test
    fun anEndAlignedMenuIsReadTheSameWay() {
        show {
            Box {
                DdsMenu(expanded = true, onDismissRequest = {}, modifier = Modifier.testTag("menu"), align = DdsMenuAlign.End) {
                    DdsMenuItem("수정", onClick = {})
                    DdsMenuDivider()
                    DdsMenuItem("삭제", onClick = {}, danger = true)
                }
            }
        }
        // Nothing that lines the menu up is a stop of its own.
        rule.onNodeWithTag("menu").onChildren().assertCountEquals(2).assertAll(hasClickAction())
    }

    // --- loading and moving -------------------------------------------------------

    @Test
    fun theBusyBarHasANameAndIsAnnounced() {
        show { Box { DdsBusyBar(busy = true) } }
        rule.onNodeWithContentDescription(word(R.string.dds_a11y_loading))
            .assert(expectValue(SemanticsProperties.LiveRegion, LiveRegionMode.Polite))
    }

    @Test
    fun aSheetHandleHasAName() {
        show { DdsBottomSheet(onDismissRequest = {}, title = "보내기") { Text("문자로 보내기") } }
        rule.onNodeWithContentDescription(word(R.string.dds_a11y_sheet_handle)).assertExists()
    }

    @Test
    fun aScreenCanSayItsName() {
        show { Box(Modifier.ddsScreenContent(paneTitle = "설정")) { Text("내용") } }
        rule.onNode(expectValue(SemanticsProperties.PaneTitle, "설정")).assertExists()
    }

}
