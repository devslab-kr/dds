package kr.devslab.dds.catalog

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import kr.devslab.dds.compose.component.DdsButton
import kr.devslab.dds.compose.component.DdsButtonVariant
import kr.devslab.dds.compose.component.DdsCard
import kr.devslab.dds.compose.component.DdsIconButton
import kr.devslab.dds.compose.component.DdsPaneItem
import kr.devslab.dds.compose.component.DdsPaneList
import kr.devslab.dds.compose.component.DdsScaffold
import kr.devslab.dds.compose.component.DdsSection
import kr.devslab.dds.compose.component.DdsTextField
import kr.devslab.dds.compose.component.DdsTopBar
import kr.devslab.dds.compose.component.DdsValueRow
import kr.devslab.dds.compose.icons.DdsIcons
import kr.devslab.dds.compose.layout.DdsBodyColumn
import kr.devslab.dds.compose.layout.DdsCenteredColumn
import kr.devslab.dds.compose.layout.DdsCenteredTitle
import kr.devslab.dds.compose.layout.ddsBody
import kr.devslab.dds.compose.layout.ddsFrame
import kr.devslab.dds.compose.layout.gutter
import kr.devslab.dds.compose.motion.ddsScreenContent
import kr.devslab.dds.compose.theme.DdsTheme
import kr.devslab.dds.tokens.DdsBar
import kr.devslab.dds.tokens.DdsScreen

/** The demos of the Layout page: one per part of the screen frame. */
enum class LayoutDemo(val title: String) {
    Body("Body column"),
    Bar("Top bar"),
    Centered("Centered block"),
    WholeWindow("Whole window"),
}

/**
 * The rows of the Layout list. The same list is pinned beside the demos on a wide window and is
 * a screen of its own on a narrower one.
 */
@Composable
fun LayoutRows(selected: LayoutDemo?, onChoose: (LayoutDemo) -> Unit) {
    DdsPaneList {
        for (demo in LayoutDemo.entries) {
            DdsPaneItem(demo.title, selected = demo == selected, onClick = { onChoose(demo) })
        }
    }
}

/** The pinned list, beside the demos on a wide window: its own top bar over the rows. */
@Composable
fun LayoutPinnedList(selected: LayoutDemo?, onChoose: (LayoutDemo) -> Unit) {
    DdsScaffold(topBar = { DdsTopBar(Page.Layout.title) }) { padding ->
        Box(Modifier.padding(padding)) { LayoutRows(selected, onChoose) }
    }
}

/**
 * The list as a screen, on a window too narrow to pin it: the Layout tab itself. It lays its own
 * body out, so the rows stand on the same lines as a body column's text, and it slides in and says
 * its name as a body column does.
 */
@Composable
fun LayoutListBody(onChoose: (LayoutDemo) -> Unit) {
    Box(Modifier.fillMaxSize().ddsScreenContent(paneTitle = Page.Layout.title), contentAlignment = Alignment.TopCenter) {
        Box(Modifier.ddsBody().fillMaxWidth()) { LayoutRows(selected = null, onChoose = onChoose) }
    }
}

/**
 * One demo, as a screen. Beside the pinned list it has nowhere to go back to, so [onBack] is
 * null there; opened over the list it goes back to it.
 */
@Composable
fun LayoutDemoScreen(demo: LayoutDemo, onBack: (() -> Unit)?) {
    when (demo) {
        LayoutDemo.Body -> DdsScaffold(topBar = { DdsTopBar(demo.title, onBack = onBack) }) { padding ->
            Box(Modifier.fillMaxSize().padding(padding)) { BodyDemo(demo.title) }
        }
        LayoutDemo.Bar -> DdsScaffold(
            topBar = {
                DdsTopBar(demo.title, onBack = onBack) {
                    DdsIconButton(DdsIcons.Search, contentDescription = "Search", onClick = {})
                    DdsIconButton(DdsIcons.MoreHorizontal, contentDescription = "More", onClick = {})
                }
            },
        ) { padding ->
            Box(Modifier.fillMaxSize().padding(padding)) { BarDemo(demo.title, withArrow = onBack != null) }
        }
        LayoutDemo.Centered -> CenteredDemo(demo.title, onBack)
        LayoutDemo.WholeWindow -> DdsScaffold(topBar = { DdsTopBar(demo.title, onBack = onBack) }) { padding ->
            Box(Modifier.fillMaxSize().padding(padding)) { WholeWindowDemo(demo.title) }
        }
    }
}

/** What the frame decided for this window, read as every screen reads it: from [ddsFrame]. */
@Composable
private fun FrameReading() {
    val frame = ddsFrame()
    DdsCard {
        Column {
            DdsValueRow("Window width", frame.width.name)
            DdsValueRow("Gutter", "${frame.width.gutter.value.toInt()}dp")
            DdsValueRow("Rail", if (frame.rail) "${DdsBar.rail}dp" else "none")
            DdsValueRow("Pinned list", if (frame.listPinned) "${DdsScreen.listPane}dp" else "none")
            DdsValueRow("Top bar", if (frame.tallBar) "${DdsBar.topTall}dp, two lines" else "${DdsBar.top}dp, one line", divider = false)
        }
    }
}

@Composable
private fun Note(text: String) {
    Text(text, style = DdsTheme.typography.body2, color = DdsTheme.colors.textSecondary)
}

@Composable
private fun BodyDemo(title: String) {
    DdsBodyColumn(paneTitle = title) {
        Note(
            "One column per screen, no wider than ${DdsScreen.bodyMax}dp with its gutters, in the middle of what the " +
                "rail and the pinned list leave. Every screen of a window starts on the same line.",
        )
        DdsSection("This window") { FrameReading() }
        DdsSection("The numbers") {
            DdsCard {
                Column {
                    DdsValueRow("Medium from", "${DdsScreen.breakpoint}dp")
                    DdsValueRow("Expanded from", "${DdsScreen.breakpointExpanded}dp")
                    DdsValueRow("Gutter, narrow / wide", "${DdsScreen.gutter} / ${DdsScreen.gutterWide}dp")
                    DdsValueRow("Body, widest", "${DdsScreen.bodyMax}dp")
                    DdsValueRow("Pinned list", "${DdsScreen.listPane}dp + 1dp line")
                    DdsValueRow("Centered block, widest", "${DdsScreen.centeredMax}dp", divider = false)
                }
            }
        }
    }
}

@Composable
private fun BarDemo(title: String, withArrow: Boolean) {
    val gutter = ddsFrame().width.gutter.value.toInt()
    DdsBodyColumn(paneTitle = title) {
        Note("The top bar stands on the body's lines. Its content is as wide as the body and sits in the same place.")
        DdsCard {
            Column {
                if (withArrow) {
                    DdsValueRow("Back arrow's 24dp icon", "starts on the start line")
                    DdsValueRow("Title", "start line + 40dp")
                } else {
                    // Beside the pinned list there is nowhere to go back to: no arrow, and the title moves to the line.
                    DdsValueRow("Title", "on the start line")
                }
                DdsValueRow("Last icon (24dp)", "ends on the end line")
                DdsValueRow("Gutter of this window", "${gutter}dp", divider = false)
            }
        }
        Note(
            "A tab screen's mark and a detail screen's arrow put the title in the same place, so opening a screen " +
                "does not move the title sideways. The touch area of each icon (48dp) reaches 12dp into the gutter.",
        )
    }
}

@Composable
private fun CenteredDemo(title: String, onBack: (() -> Unit)?) {
    var number by rememberSaveable { mutableStateOf("") }
    DdsCenteredColumn(paneTitle = title) {
        DdsCenteredTitle("정산을\n시작합니다", description = "사업자 번호를 넣으면 거래처와 주문을 한곳에서 봅니다.")
        DdsTextField(number, { number = it }, label = "사업자 번호", modifier = Modifier.fillMaxWidth(), placeholder = "000-00-00000")
        DdsButton("시작하기", onClick = {}, modifier = Modifier.fillMaxWidth())
        if (onBack != null) {
            DdsButton("Back to the list", onClick = onBack, modifier = Modifier.fillMaxWidth(), variant = DdsButtonVariant.Ghost)
        }
    }
}

@Composable
private fun WholeWindowDemo(title: String) {
    DdsBodyColumn(paneTitle = title) {
        Note(
            "The menus are off here (navigation = false): no rail, no pinned list, no bottom tabs. An app turns them " +
                "off before sign-in and on a screen with one task, such as writing or scanning.",
        )
        DdsSection("This window") { FrameReading() }
    }
}
