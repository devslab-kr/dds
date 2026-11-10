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
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import kr.devslab.dds.compose.motion.DdsMove
import kr.devslab.dds.compose.motion.DdsScreenMotion
import kr.devslab.dds.compose.motion.DdsSplashHandoff
import kr.devslab.dds.compose.motion.DdsSplashOverlay
import kr.devslab.dds.compose.motion.LocalDdsSplashHandoff
import kr.devslab.dds.compose.motion.ddsSplashTarget
import kr.devslab.dds.compose.motion.isReducedMotion
import kr.devslab.dds.compose.theme.DdsBrand
import kr.devslab.dds.compose.theme.DdsBrandColors
import kr.devslab.dds.compose.theme.DdsTheme
import kr.devslab.dds.compose.theme.rememberDdsBrand
import kr.devslab.dds.tokens.DdsDarkColors
import kr.devslab.dds.tokens.DdsLightColors
import kr.devslab.dds.tokens.DdsRadius
import kr.devslab.dds.tokens.DdsSpace
import androidx.compose.ui.graphics.Color as ComposeColor
import kr.devslab.dds.tokens.R as TokensR

/**
 * Launch extras, so every state can be captured from adb without tapping:
 *   --es page colors|type|controls|motion     first page
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
                provider.remove()
                // Removing the splash re-applies the theme and with it the theme's bar
                // icon colors; put back the ones for the theme actually shown.
                applySystemBars()
                handoff.release()
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

enum class Page(val title: String) {
    Colors("Colors"),
    Type("Type"),
    Controls("Controls"),
    Motion("Motion"),
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun Catalog(firstPage: Page, largeText: Boolean, onLargeText: (Boolean) -> Unit) {
    var page by rememberSaveable { mutableStateOf(firstPage) }
    // The Motion page has a second level, to show push and pop.
    var detail by rememberSaveable { mutableStateOf<Int?>(null) }
    var move by remember { mutableStateOf(DdsMove.None) }

    BackHandler(enabled = detail != null) {
        move = DdsMove.Pop
        detail = null
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        CatalogMark(DdsSpace.s24.dp, Modifier.ddsSplashTarget(priority = 0))
                        Spacer(Modifier.width(DdsSpace.s12.dp))
                        Text(if (detail != null) "Item ${detail!! + 1}" else page.title)
                    }
                },
                actions = {
                    TextButton(onClick = { onLargeText(!largeText) }) {
                        Text(if (largeText) "Aa large" else "Aa")
                    }
                },
            )
        },
        bottomBar = {
            // The bar shares the page background; a hairline, not a shadow or a tint, separates it.
            Column {
                HorizontalDivider(color = DdsTheme.colors.borderDefault)
                NavigationBar(containerColor = DdsTheme.colors.bgDefault, tonalElevation = 0.dp) {
                    for (item in Page.entries) {
                        val selected = item == page
                        NavigationBarItem(
                            selected = selected,
                            onClick = {
                                if (!selected || detail != null) {
                                    move = DdsMove.Tab
                                    detail = null
                                    page = item
                                }
                            },
                            icon = { TabGlyph(selected) },
                            // Selection changes three things at once — the pill, the color and the
                            // weight — never the color alone.
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = DdsTheme.colors.textBrand,
                                selectedTextColor = DdsTheme.colors.textBrand,
                                indicatorColor = DdsTheme.colors.bgBrandSubtle,
                                unselectedIconColor = DdsTheme.colors.textSecondary,
                                unselectedTextColor = DdsTheme.colors.textSecondary,
                            ),
                            label = {
                                // One line, always: at large font scales a tab label is cut with an
                                // ellipsis rather than broken in the middle of a word.
                                Text(
                                    item.title,
                                    fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
                                    maxLines = 1,
                                    softWrap = false,
                                    overflow = TextOverflow.Ellipsis,
                                )
                            },
                        )
                    }
                }
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
                        page == Page.Controls -> ControlsPage()
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

/** A stand-in tab icon; a product uses its own icons. */
@Composable
private fun TabGlyph(selected: Boolean) {
    Box(
        Modifier
            .size(DdsSpace.s20.dp)
            .clip(RoundedCornerShape(DdsRadius.sm.dp))
            .background(if (selected) DdsTheme.colors.textBrand else DdsTheme.colors.textSecondary),
    )
}
