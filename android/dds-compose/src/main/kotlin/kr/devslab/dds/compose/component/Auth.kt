package kr.devslab.dds.compose.component

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.WindowInsetsSides
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.only
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalWindowInfo
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import kr.devslab.dds.compose.R
import kr.devslab.dds.compose.icons.DdsIcons
import kr.devslab.dds.compose.layout.ddsFrame
import kr.devslab.dds.compose.layout.gutter
import kr.devslab.dds.compose.theme.DdsTheme
import kr.devslab.dds.tokens.DdsIcon
import kr.devslab.dds.tokens.DdsScreen
import kr.devslab.dds.tokens.DdsSpace
import kr.devslab.dds.tokens.DdsTouch

/** Public IDs shared with DDS Auth on the web. Provider-specific OAuth IDs belong to the app. */
public enum class DdsSocialProvider(public val id: String) {
    Google("google"),
    Kakao("kakao"),
    Naver("naver"),
    Line("line"),
    Microsoft("microsoft"),
    LinkedIn("linkedin"),
    Apple("apple"),
    Facebook("facebook"),
    GitHub("github"),
    GitLab("gitlab"),
    Discord("discord"),
    Figma("figma"),
    Notion("notion"),
    X("x"),
    Slack("slack"),
    Zoom("zoom"),
    WeChat("wechat"),
}

/**
 * A sign-in option configured by the app, with a localized [label].
 * [icon] replaces the bundled decorative mark where an app uses its own approved artwork.
 */
public class DdsSignInMethod(
    public val provider: DdsSocialProvider,
    public val label: String,
    public val enabled: Boolean = true,
    public val icon: (@Composable () -> Unit)? = null,
)

/**
 * Shows the app's [methods] in order. The first three appear inline and the rest open in a sheet.
 * An empty list shows nothing. The first entry for each provider wins if the list contains duplicates.
 *
 * Apply this to the available screen width. It provides DDS screen gutters and uses the same
 * measured column width in both placements. A containing column that already applies gutters can
 * pass `gutter = 0.dp` to use its available width.
 *
 * [onSelect] reports the requested method. The caller configures providers, starts authentication,
 * handles errors and sessions, and supplies [pending] while authenticating. A pending method retains
 * its geometry and ignores repeat clicks. Other methods are unavailable until it finishes.
 */
@Composable
public fun DdsSocialSignIn(
    methods: List<DdsSignInMethod>,
    onSelect: (DdsSocialProvider) -> Unit,
    modifier: Modifier = Modifier,
    pending: DdsSocialProvider? = null,
    moreLabel: String = stringResource(R.string.dds_auth_more_methods),
    closeLabel: String = stringResource(R.string.dds_auth_close_methods),
    gutter: Dp = ddsFrame().width.gutter,
) {
    if (methods.isEmpty()) return

    val ordered = methods.distinctBy { it.provider }
    val primary = ordered.take(3)
    val additional = ordered.drop(3)
    BoxWithConstraints(
        modifier.fillMaxWidth().padding(horizontal = gutter),
        contentAlignment = Alignment.TopCenter,
    ) {
        val buttonWidth = minOf(maxWidth, DdsScreen.centeredMax.dp)
        Column(
            Modifier.widthIn(max = buttonWidth).fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(DdsSpace.s12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            primary.forEach { SignInButton(it, pending, onSelect) }
            if (additional.isNotEmpty()) {
                var showMore by rememberSaveable { mutableStateOf(false) }
                DdsButton(moreLabel, onClick = { showMore = true }, enabled = pending == null, variant = DdsButtonVariant.Plain)
                if (showMore) {
                    SignInSheet(moreLabel, closeLabel, buttonWidth, gutter, onDismiss = { showMore = false }) {
                        additional.forEach { SignInButton(it, pending, onSelect) }
                    }
                }
            }
        }
    }
}

@Composable
private fun SignInButton(method: DdsSignInMethod, pending: DdsSocialProvider?, onSelect: (DdsSocialProvider) -> Unit) {
    DdsButton(
        onClick = { onSelect(method.provider) },
        modifier = Modifier.fillMaxWidth(),
        variant = DdsButtonVariant.Secondary,
        enabled = method.enabled && (pending == null || pending == method.provider),
        loading = pending == method.provider,
    ) {
        Row(
            Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(DdsSpace.s16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(Modifier.size(DdsIcon.sm.dp).clearAndSetSemantics { }, contentAlignment = Alignment.Center) {
                if (method.icon != null) {
                    method.icon.invoke()
                } else {
                    val mark = signedInMark(method.provider)
                    if (mark != null) Image(painterResource(mark), contentDescription = null, modifier = Modifier.size(DdsIcon.sm.dp))
                }
            }
            WordsText(method.label, Modifier.weight(1f), textAlign = TextAlign.Start)
        }
    }
}

@Composable
private fun signedInMark(provider: DdsSocialProvider): Int? {
    // DDS allows an app to force its theme independently of the device configuration.
    val darkSurface = DdsTheme.colors.bgElevated.luminance() < DdsTheme.colors.textPrimary.luminance()
    return when (provider) {
        DdsSocialProvider.Google -> R.drawable.dds_auth_google
        DdsSocialProvider.Kakao -> if (darkSurface) R.drawable.dds_auth_kakao_on_dark else R.drawable.dds_auth_kakao
        DdsSocialProvider.Naver -> R.drawable.dds_auth_naver
        DdsSocialProvider.Line -> R.drawable.dds_auth_line
        DdsSocialProvider.Microsoft -> R.drawable.dds_auth_microsoft
        DdsSocialProvider.LinkedIn -> R.drawable.dds_auth_linkedin
        DdsSocialProvider.GitHub -> if (darkSurface) R.drawable.dds_auth_github_on_dark else R.drawable.dds_auth_github
        DdsSocialProvider.Discord -> R.drawable.dds_auth_discord
        DdsSocialProvider.Figma -> R.drawable.dds_auth_figma
        DdsSocialProvider.Notion -> R.drawable.dds_auth_notion
        DdsSocialProvider.X -> if (darkSurface) R.drawable.dds_auth_x_on_dark else R.drawable.dds_auth_x
        DdsSocialProvider.Slack -> R.drawable.dds_auth_slack
        DdsSocialProvider.Zoom -> R.drawable.dds_auth_zoom
        DdsSocialProvider.Apple, DdsSocialProvider.Facebook, DdsSocialProvider.GitLab, DdsSocialProvider.WeChat -> null
    }
}

@Composable
private fun SignInSheet(
    title: String,
    closeLabel: String,
    buttonWidth: Dp,
    gutter: Dp,
    onDismiss: () -> Unit,
    content: @Composable () -> Unit,
) {
    val density = LocalDensity.current
    val windowHeight = with(density) { LocalWindowInfo.current.containerSize.height.toDp() }
    val topInset = with(density) { WindowInsets.safeDrawing.getTop(this).toDp() }
    val heightLimit = if (windowHeight > topInset + DdsSpace.s32.dp) {
        Modifier.heightIn(max = windowHeight - topInset - DdsSpace.s32.dp)
    } else {
        Modifier
    }
    DdsBottomSheetSurface(
        onDismissRequest = onDismiss,
        // An offset-dependent top inset can change the height of a tall, scrollable sheet as it settles.
        contentWindowInsets = { WindowInsets.safeDrawing.only(WindowInsetsSides.Bottom) },
    ) {
        Column(Modifier.fillMaxWidth().then(heightLimit), horizontalAlignment = Alignment.CenterHorizontally) {
            Row(
                Modifier.fillMaxWidth().padding(horizontal = gutter),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Spacer(Modifier.size(DdsTouch.min.dp))
                Box(Modifier.weight(1f), contentAlignment = Alignment.Center) {
                    WordsText(title, Modifier.semantics { heading() }, style = DdsTheme.typography.title3, textAlign = TextAlign.Center)
                }
                DdsIconButton(DdsIcons.Close, closeLabel, onClick = onDismiss)
            }
            Column(
                Modifier.weight(1f, fill = false).verticalScroll(rememberScrollState())
                    .padding(start = gutter, end = gutter, top = DdsSpace.s8.dp, bottom = DdsSpace.s16.dp)
                    .widthIn(max = buttonWidth).fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(DdsSpace.s12.dp),
            ) {
                content()
            }
        }
    }
}
