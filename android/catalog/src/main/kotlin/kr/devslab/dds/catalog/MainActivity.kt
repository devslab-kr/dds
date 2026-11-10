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
import androidx.compose.runtime.key
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
import kr.devslab.dds.compose.component.DdsSize
import kr.devslab.dds.compose.component.DdsTopBar
import kr.devslab.dds.compose.icons.DdsIcons
import kr.devslab.dds.compose.motion.DdsMove
import kr.devslab.dds.compose.motion.DdsScreenMotion
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
 *   --es page colors|type|parts|motion        first page
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
                        Catalog(firstPage, largeText, onLargeText = { largeText = it })
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
}

@Composable
private fun Catalog(firstPage: Page, largeText: Boolean, onLargeText: (Boolean) -> Unit) {
    var page by rememberSaveable { mutableStateOf(firstPage) }
    // The Motion page has a second level, to show push and pop.
    var detail by rememberSaveable { mutableStateOf<Int?>(null) }
    var move by remember { mutableStateOf(DdsMove.None) }
    val goBack = {
        move = DdsMove.Pop
        detail = null
    }
    // Back goes back: the screen first, then the tab before; leaving the app is asked.
    val trail = rememberDdsTabTrail(startTab = firstPage.ordinal)
    var askingToExit by rememberSaveable { mutableStateOf(false) }
    val activity = LocalActivity.current
    DdsBackHandler(
        trail = trail,
        canPop = detail != null,
        onPop = goBack,
        onTab = { index ->
            move = DdsMove.Tab
            page = Page.entries[index]
        },
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

    DdsScaffold(
        topBar = {
            DdsTopBar(
                title = if (detail != null) "Item ${detail!! + 1}" else page.title,
                leading = {
                    if (detail != null) {
                        DdsIconButton(DdsIcons.ArrowLeft, contentDescription = "Back", onClick = goBack)
                    } else {
                        CatalogMark(DdsSpace.s24.dp, Modifier.ddsSplashTarget(priority = 0))
                    }
                },
                actions = {
                    DdsButton(
                        text = if (largeText) "Aa large" else "Aa",
                        onClick = { onLargeText(!largeText) },
                        variant = DdsButtonVariant.Ghost,
                        size = DdsSize.Sm,
                    )
                },
            )
        },
        navItems = Page.entries.map { DdsNavItem(it.title, it.icon) },
        selectedIndex = page.ordinal,
        onSelect = { index ->
            if (index != page.ordinal || detail != null) {
                move = DdsMove.Tab
                detail = null
                page = Page.entries[index]
                trail.visit(index)
            }
        },
    ) { padding ->
        // The previous screen is removed at once; only the new content arrives.
        key(page, detail) {
            DdsScreenMotion(move) {
                Box(Modifier.padding(padding).fillMaxSize()) {
                    when {
                        page == Page.Motion && detail != null -> MotionDetail(detail!!)
                        page == Page.Colors -> ColorsPage()
                        page == Page.Type -> TypePage()
                        page == Page.Parts -> PartsPage()
                        else -> MotionPage(onOpen = {
                            move = DdsMove.Push
                            detail = it
                        })
                    }
                }
            }
        }
    }
}
