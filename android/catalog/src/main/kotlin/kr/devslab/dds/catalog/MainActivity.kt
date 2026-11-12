package kr.devslab.dds.catalog

import android.content.res.Configuration
import android.graphics.Color
import android.os.Bundle
import android.os.SystemClock
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.compose.ui.graphics.vector.ImageVector
import kr.devslab.dds.compose.component.DdsButton
import kr.devslab.dds.compose.component.DdsButtonVariant
import kr.devslab.dds.compose.component.DdsIconButton
import kr.devslab.dds.compose.component.DdsNavItem
import kr.devslab.dds.compose.component.DdsDialog
import kr.devslab.dds.compose.component.DdsScaffold
import kr.devslab.dds.compose.navigation.DdsBackHandler
import kr.devslab.dds.compose.navigation.rememberDdsTabTrail
import androidx.activity.compose.LocalActivity
import kr.devslab.dds.compose.component.DdsTopBar
import kr.devslab.dds.compose.icons.DdsIcons
import kr.devslab.dds.compose.layout.DdsAppFrame
import kr.devslab.dds.compose.layout.DdsWindowWidth
import kr.devslab.dds.compose.layout.ddsFrame
import kr.devslab.dds.compose.motion.DdsMove
import kr.devslab.dds.compose.motion.DdsScreenHost
import kr.devslab.dds.compose.motion.DdsSplashHandoff
import kr.devslab.dds.compose.motion.DdsSplashOverlay
import kr.devslab.dds.compose.motion.LocalDdsSplashHandoff
import kr.devslab.dds.compose.motion.ddsSplashTarget
import kr.devslab.dds.compose.motion.isReducedMotion
import kr.devslab.dds.compose.motion.splashShowedMark
import kr.devslab.dds.compose.theme.DdsBrand
import kr.devslab.dds.compose.theme.DdsBrandColors
import kr.devslab.dds.compose.theme.DdsTheme
import kr.devslab.dds.compose.theme.rememberDdsBrand
import kr.devslab.dds.tokens.DdsDarkColors
import kr.devslab.dds.tokens.DdsLightColors
import kr.devslab.dds.tokens.DdsSpace
import androidx.compose.ui.graphics.Color as ComposeColor
import kr.devslab.dds.tokens.R as TokensR

/**
 * Launch extras, so every state can be captured from adb without tapping:
 *   --es page colors|type|parts|motion|layout first page
 *   --ei item 0..7                            open a Motion item (an inner screen)
 *   --es demo body|bar|centered|wholewindow   open a Layout demo
 *   --es theme light|dark                     pin the theme (default: system)
 *   --ez large true                           large text mode
 *   --es brand ink                            a product brand, to see every brand place change
 */
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        val handoff = DdsSplashHandoff(
            active = savedInstanceState == null,
            reduced = isReducedMotion(this),
            createdAt = SystemClock.uptimeMillis(),
            drawMs = resources.getInteger(R.integer.splash_draw_ms),
        )
        installSplashScreen().apply {
            // Keep the system splash itself until the mark is drawn …
            setKeepOnScreenCondition { handoff.keepOnScreen(SystemClock.uptimeMillis()) }
            // … and drop the hand-over copy at once: it can show a frame without the mark.
            setOnExitAnimationListener { provider ->
                // Opened from another app or a notification, the system splash has no icon.
                val shown = splashShowedMark(provider.view)
                provider.remove()
                // Removing the splash re-applies the theme and with it the theme's bar
                // icon colors; put back the ones for the theme actually shown.
                applySystemBars()
                handoff.release(markShown = shown)
            }
        }
        super.onCreate(savedInstanceState)
        applySystemBars()

        val firstPage = Page.entries.firstOrNull { it.name.equals(intent.getStringExtra("page"), ignoreCase = true) } ?: Page.Colors
        val pinnedTheme = intent.getStringExtra("theme")
        val large = intent.getBooleanExtra("large", false)
        val inkBrand = intent.getStringExtra("brand") == "ink"
        val firstDemo = LayoutDemo.entries.firstOrNull { it.name.equals(intent.getStringExtra("demo"), ignoreCase = true) }
        val firstItem = if (intent.hasExtra("item")) intent.getIntExtra("item", 0).coerceIn(0, 7) else null

        setContent {
            val dark = when (pinnedTheme) {
                "dark" -> true
                "light" -> false
                else -> isSystemInDarkTheme()
            }
            var largeText by rememberSaveable { mutableStateOf(large) }
            // The launch window carries the mark, so a frame between the system splash and
            // the first composition is never empty; once the handoff is over it is plain again.
            LaunchedEffect(handoff.phase) {
                if (handoff.phase == DdsSplashHandoff.Phase.Done) {
                    window.setBackgroundDrawableResource(TokensR.color.dds_color_bg_default)
                }
            }
            DdsTheme(darkTheme = dark, brand = if (inkBrand) InkBrand else rememberDdsBrand(), largeText = largeText) {
                CompositionLocalProvider(LocalDdsSplashHandoff provides handoff) {
                    Box(Modifier.fillMaxSize()) {
                        Catalog(firstPage, firstDemo, firstItem, largeText, onLargeText = { largeText = it })
                        DdsSplashOverlay(
                            handoff = handoff,
                            background = DdsTheme.colors.bgDefault,
                            markSize = SplashMarkSize,
                        ) { size -> CatalogMark(size) }
                    }
                }
            }
        }
    }
}

/**
 * A product brand built only from system tokens, to show the brand slice at
 * work: an ink fill. `textOnBrand` is left out, so the on-brand rule picks it
 * (white on the dark fill in light, dark text on the pale fill in dark).
 */
private val InkBrand = DdsBrand(
    light = DdsBrandColors(
        bgBrand = ComposeColor(DdsLightColors.bgInverse),
        bgBrandHover = ComposeColor(DdsLightColors.textSecondary),
        bgBrandSubtle = ComposeColor(DdsLightColors.borderDefault),
        textBrand = ComposeColor(DdsLightColors.textPrimary),
    ),
    dark = DdsBrandColors(
        bgBrand = ComposeColor(DdsDarkColors.bgInverse),
        bgBrandHover = ComposeColor(DdsDarkColors.textSecondary),
        bgBrandSubtle = ComposeColor(DdsDarkColors.borderDefault),
        textBrand = ComposeColor(DdsDarkColors.textPrimary),
    ),
)

/**
 * Draw behind the system bars and keep them transparent; their icons follow the
 * theme actually shown (which the launch extra may pin), not the system setting.
 */
private fun ComponentActivity.applySystemBars() {
    val systemDark = (resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES
    val dark = when (intent.getStringExtra("theme")) {
        "dark" -> true
        "light" -> false
        else -> systemDark
    }
    val bars = SystemBarStyle.auto(Color.TRANSPARENT, Color.TRANSPARENT) { dark }
    enableEdgeToEdge(statusBarStyle = bars, navigationBarStyle = bars)
}

/** The size the splash drawable draws the mark at (96 of its 288dp canvas). */
private val SplashMarkSize = (DdsSpace.s48 * 2).dp

/** The stand-in app mark. A product draws its own logo here, from a path, in its brand color. */
@Composable
fun CatalogMark(size: Dp, modifier: Modifier = Modifier) {
    // The splash drawable rounds its 96dp square by 20; keep the same proportion at any size.
    val corner = size * (20f / 96f)
    Box(modifier.size(size).clip(RoundedCornerShape(corner)).background(DdsTheme.colors.bgBrand))
}


enum class Page(val title: String, val icon: ImageVector) {
    Colors("Colors", DdsIcons.LayoutGrid),
    Type("Type", DdsIcons.Doc),
    Parts("Parts", DdsIcons.Tool),
    Motion("Motion", DdsIcons.Refresh),
    Layout("Layout", DdsIcons.Menu),
}

/** One screen of the catalog: a tab, and what was opened in it (a Motion item or a Layout demo). */
private data class Shown(val page: Page, val detail: Int?, val demo: LayoutDemo?)

/** Every name a top bar of the catalog shows, so the frame can tell whether one needs two lines. */
private val BarTitles: List<String> =
    Page.entries.map { it.title } + (1..8).map { "Item $it" } + LayoutDemo.entries.map { it.title }

@Composable
private fun Catalog(firstPage: Page, firstDemo: LayoutDemo?, firstItem: Int?, largeText: Boolean, onLargeText: (Boolean) -> Unit) {
    var page by rememberSaveable { mutableStateOf(firstPage) }
    // The Motion page has a second level, to show push and pop.
    var detail by rememberSaveable { mutableStateOf(firstItem) }
    // The Layout page's demo: opened over the list on a narrow window, beside it on a wide one.
    var demo by rememberSaveable { mutableStateOf(firstDemo) }
    var move by remember { mutableStateOf(DdsMove.None) }
    // Read outside the frame, from the window: the frame pins the list on the same width.
    val listPinnable = ddsFrame().width == DdsWindowWidth.Expanded && page == Page.Layout && demo != LayoutDemo.WholeWindow
    val goBack = {
        move = DdsMove.Pop
        if (page == Page.Layout) demo = null else detail = null
    }
    val openTab = { index: Int ->
        move = DdsMove.Tab
        detail = null
        demo = null
        page = Page.entries[index]
    }
    // Back goes back: the screen first, then the tab before; leaving the app is asked. Beside the
    // pinned list a demo is not a step to go back from: back leaves the area.
    val trail = rememberDdsTabTrail(startTab = firstPage.ordinal)
    var askingToExit by rememberSaveable { mutableStateOf(false) }
    val activity = LocalActivity.current
    DdsBackHandler(
        trail = trail,
        canPop = detail != null || (demo != null && !listPinnable),
        onPop = goBack,
        onTab = openTab,
        onAskToExit = { askingToExit = true },
        enabled = !askingToExit,
    )
    if (askingToExit) {
        DdsDialog(
            title = "앱을 종료할까요?",
            onDismissRequest = { askingToExit = false },
            confirm = { DdsButton("종료", onClick = { activity?.finish() }) },
            dismiss = { DdsButton("취소", onClick = { askingToExit = false }, variant = DdsButtonVariant.Ghost) },
        )
    }
    val choose = { chosen: LayoutDemo ->
        // Beside the pinned list choosing swaps the screen; over a list that is a screen it opens one.
        move = if (listPinnable) DdsMove.Tab else DdsMove.Push
        demo = chosen
    }

    DdsAppFrame(
        navItems = Page.entries.map { DdsNavItem(it.title, it.icon) },
        selectedIndex = page.ordinal,
        onSelect = { index ->
            if (index != page.ordinal || detail != null || demo != null) {
                openTab(index)
                trail.visit(index)
            }
        },
        // The whole-window demo turns the menus off, as an app does before sign-in or for a scanner.
        navigation = !(page == Page.Layout && demo == LayoutDemo.WholeWindow),
        barTitles = BarTitles,
        list = if (page == Page.Layout) ({ LayoutPinnedList(demo ?: LayoutDemo.Body, choose) }) else null,
    ) {
        val pinned = ddsFrame().listPinned
        // Beside the pinned list there is always a demo to show: the first, until one is chosen.
        val shown = Shown(page, detail, if (page == Page.Layout) demo ?: (if (pinned) LayoutDemo.Body else null) else null)
        // The screen before stays drawn underneath until the new one covers it.
        DdsScreenHost(screen = shown, move = move) { (shownPage, shownDetail, shownDemo) ->
            when {
                shownPage == Page.Motion && shownDetail != null -> InnerScreen("Item ${shownDetail + 1}", goBack) { MotionDetail(shownDetail) }
                shownPage == Page.Layout && shownDemo != null -> LayoutDemoScreen(shownDemo, onBack = if (pinned) null else goBack)
                else -> TabScreen(shownPage, largeText, onLargeText) {
                    when (shownPage) {
                        Page.Colors -> ColorsPage()
                        Page.Type -> TypePage()
                        Page.Parts -> PartsPage()
                        Page.Motion -> MotionPage(onOpen = {
                            move = DdsMove.Push
                            detail = it
                        })
                        Page.Layout -> LayoutListBody(choose)
                    }
                }
            }
        }
    }
}

/** A tab's own screen: the mark, the tab's name, the text size switch, and the bottom tabs on a phone. */
@Composable
private fun TabScreen(page: Page, largeText: Boolean, onLargeText: (Boolean) -> Unit, content: @Composable () -> Unit) {
    DdsScaffold(
        topBar = {
            DdsTopBar(
                title = page.title,
                leading = { CatalogMark(DdsSpace.s24.dp, Modifier.ddsSplashTarget(priority = 0)) },
                actions = {
                    DdsIconButton(
                        if (largeText) DdsIcons.Minus else DdsIcons.Plus,
                        contentDescription = if (largeText) "Smaller text" else "Larger text",
                        onClick = { onLargeText(!largeText) },
                    )
                },
            )
        },
        bottomTabs = true,
    ) { padding ->
        Box(Modifier.fillMaxSize().padding(padding)) { content() }
    }
}

/** A screen opened from a tab: the arrow back and its name; no bottom tabs. */
@Composable
private fun InnerScreen(title: String, onBack: () -> Unit, content: @Composable () -> Unit) {
    DdsScaffold(topBar = { DdsTopBar(title, onBack = onBack) }) { padding ->
        Box(Modifier.fillMaxSize().padding(padding)) { content() }
    }
}
