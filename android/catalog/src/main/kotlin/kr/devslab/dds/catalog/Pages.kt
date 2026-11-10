package kr.devslab.dds.catalog

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.layout.PaddingValues
import kotlinx.coroutines.delay
import kr.devslab.dds.compose.component.DdsBadge
import kr.devslab.dds.compose.component.DdsButton
import kr.devslab.dds.compose.component.DdsButtonVariant
import kr.devslab.dds.compose.component.DdsCard
import kr.devslab.dds.compose.component.DdsCheckbox
import kr.devslab.dds.compose.component.DdsChip
import kr.devslab.dds.compose.component.DdsDialog
import kr.devslab.dds.compose.component.DdsDivider
import kr.devslab.dds.compose.component.DdsEmptyState
import kr.devslab.dds.compose.component.DdsIconButton
import kr.devslab.dds.compose.component.DdsListRow
import kr.devslab.dds.compose.component.DdsNotice
import kr.devslab.dds.compose.component.DdsRadio
import kr.devslab.dds.compose.component.DdsSection
import kr.devslab.dds.compose.component.DdsSize
import kr.devslab.dds.compose.component.DdsSpinner
import kr.devslab.dds.compose.component.DdsSwitch
import kr.devslab.dds.compose.component.DdsTextField
import kr.devslab.dds.compose.component.DdsTone
import kr.devslab.dds.compose.icons.DdsIcon
import kr.devslab.dds.compose.icons.DdsIcons
import kr.devslab.dds.compose.motion.DdsBusyBar
import kr.devslab.dds.compose.motion.DdsLoadingRows
import kr.devslab.dds.compose.motion.DdsMotion
import kr.devslab.dds.compose.motion.DdsPullRefresh
import kr.devslab.dds.compose.motion.ddsAppear
import kr.devslab.dds.compose.motion.ddsScreenContent
import kr.devslab.dds.compose.motion.rememberReducedMotion
import kr.devslab.dds.compose.theme.DdsMono
import kr.devslab.dds.compose.theme.DdsTheme
import kr.devslab.dds.compose.theme.contrastRatio
import kr.devslab.dds.compose.theme.keepWords
import kr.devslab.dds.tokens.DdsBorder
import kr.devslab.dds.tokens.DdsControl
import kr.devslab.dds.tokens.DdsIcon as DdsIconSize
import kr.devslab.dds.tokens.DdsRow
import kr.devslab.dds.tokens.DdsScreen
import kr.devslab.dds.tokens.DdsSpace
import kr.devslab.dds.tokens.DdsTokensInfo

/** The scrolling body of a page: the part that arrives when the page is opened. */
@Composable
private fun PageBody(content: @Composable ColumnScope.() -> Unit) {
    Column(
        Modifier
            .fillMaxSize()
            .ddsScreenContent()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = DdsScreen.gutter.dp, vertical = DdsSpace.s16.dp),
        verticalArrangement = Arrangement.spacedBy(DdsScreen.blockGap.dp),
        content = content,
    )
}

@Composable
private fun Block(title: String, content: @Composable ColumnScope.() -> Unit) {
    DdsSection(title) {
        DdsCard {
            Column(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(DdsSpace.s12.dp), content = content)
        }
    }
}

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

@Composable
private fun Swatch(name: String, fill: Color, on: Color) {
    Row(
        Modifier
            .fillMaxWidth()
            .heightIn(min = DdsControl.md.dp)
            .clip(MaterialTheme.shapes.small)
            .background(fill)
            .border(DdsBorder.hairline.dp, DdsTheme.colors.borderDefault, MaterialTheme.shapes.small)
            .padding(horizontal = DdsSpace.s12.dp, vertical = DdsSpace.s8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(name, Modifier.weight(1f), color = on, style = DdsTheme.typography.body2, maxLines = 1, overflow = TextOverflow.Ellipsis)
        Spacer(Modifier.width(DdsSpace.s8.dp))
        Text("%.1f:1".format(contrastRatio(on, fill)), color = on, style = DdsTheme.typography.caption.copy(fontFamily = DdsMono))
    }
}

@Composable
fun ColorsPage() {
    val c = DdsTheme.colors
    val m = MaterialTheme.colorScheme
    PageBody {
        Block("Brand") {
            Swatch("bgBrand / textOnBrand", c.bgBrand, c.textOnBrand)
            Swatch("bgBrandHover (pressed)", c.bgBrandHover, c.textOnBrand)
            Swatch("bgBrandSubtle / textBrand", c.bgBrandSubtle, c.textBrand)
            Swatch("bgDefault / textBrand", c.bgDefault, c.textBrand)
        }
        Block("Surfaces and text") {
            Swatch("bgDefault / textPrimary", c.bgDefault, c.textPrimary)
            Swatch("bgDefault / textSecondary", c.bgDefault, c.textSecondary)
            Swatch("bgDefault / textMuted", c.bgDefault, c.textMuted)
            Swatch("bgSubtle / textPrimary", c.bgSubtle, c.textPrimary)
            Swatch("bgElevated / textPrimary", c.bgElevated, c.textPrimary)
            Swatch("bgInverse / textOnInverse", c.bgInverse, c.textOnInverse)
        }
        Block("Status pairs") {
            Swatch("statusSuccessBg / statusSuccess", c.statusSuccessBg, c.statusSuccess)
            Swatch("statusWarningBg / statusWarning", c.statusWarningBg, c.statusWarning)
            Swatch("statusDangerBg / statusDanger", c.statusDangerBg, c.statusDanger)
            Swatch("statusInfoBg / statusInfo", c.statusInfoBg, c.statusInfo)
            Swatch("statusDanger / textOnStatus", c.statusDanger, c.textOnStatus)
        }
        Block("Material3 roles") {
            Swatch("primary / onPrimary", m.primary, m.onPrimary)
            Swatch("primaryContainer / onPrimaryContainer", m.primaryContainer, m.onPrimaryContainer)
            Swatch("surface / onSurface", m.surface, m.onSurface)
            Swatch("surfaceContainer / onSurfaceVariant", m.surfaceContainer, m.onSurfaceVariant)
            Swatch("error / onError", m.error, m.onError)
            Swatch("errorContainer / onErrorContainer", m.errorContainer, m.onErrorContainer)
            Swatch("inverseSurface / inverseOnSurface", m.inverseSurface, m.inverseOnSurface)
        }
        Text(
            "tokens ${DdsTokensInfo.sourceSha256.take(12)}",
            style = DdsTheme.typography.caption.copy(fontFamily = DdsMono),
            color = c.textMuted,
        )
    }
}

// ---------------------------------------------------------------------------
// Type
// ---------------------------------------------------------------------------

@Composable
private fun Specimen(name: String, style: TextStyle) {
    Column(verticalArrangement = Arrangement.spacedBy(DdsSpace.s4.dp)) {
        Text(
            "$name  ${style.fontSize.value.toInt()}/${style.lineHeight.value.toInt()}  ${style.fontWeight?.weight}",
            style = DdsTheme.typography.caption.copy(fontFamily = DdsMono),
            color = DdsTheme.colors.textMuted,
        )
        Text("정산 내역을 확인하세요 Settlement 1,234,567", style = style)
    }
}

@Composable
fun TypePage() {
    val t = DdsTheme.typography
    PageBody {
        Block("Scale") {
            Specimen("display", t.display)
            Specimen("title1", t.title1)
            Specimen("title2", t.title2)
            Specimen("title3", t.title3)
            Specimen("body1", t.body1)
            Specimen("body2", t.body2)
            Specimen("label", t.label)
            Specimen("caption", t.caption)
        }
        Block("Numbers") {
            Text("1,111,111원\n9,999,999원", style = t.title2)
            Text("1,111,111원\n9,999,999원", style = t.title2.copy(fontFeatureSettings = "tnum"))
            Text("The second pair uses tabular figures (tnum): digits line up.", style = t.caption, color = DdsTheme.colors.textSecondary)
        }
        Block("Korean line breaks") {
            Text("계약서를 보내기 전에 거래처의 정산 계좌 정보를 다시 한 번 확인해 주세요.", style = t.body1)
            Text("계약서를 보내기 전에 거래처의 정산 계좌 정보를 다시 한 번 확인해 주세요.".keepWords(), style = t.body1)
            Text("The second paragraph uses keepWords(): it breaks only at spaces.", style = t.caption, color = DdsTheme.colors.textSecondary)
        }
        Block("Mono") {
            Text("kr.devslab:dds-compose 0.1.0", style = t.body2.copy(fontFamily = DdsMono))
        }
    }
}

// ---------------------------------------------------------------------------
// Parts — every DDS component, in every state worth looking at
// ---------------------------------------------------------------------------

@Composable
fun PartsPage() {
    var name by rememberSaveable { mutableStateOf("") }
    var agreed by rememberSaveable { mutableStateOf(true) }
    var notify by rememberSaveable { mutableStateOf(true) }
    var channel by rememberSaveable { mutableStateOf(0) }
    var filter by rememberSaveable { mutableStateOf(0) }
    var asking by rememberSaveable { mutableStateOf(false) }
    PageBody {
        DdsSection("Buttons", description = "One height (48). Loading keeps the size.") {
            DdsCard {
                Column(verticalArrangement = Arrangement.spacedBy(DdsSpace.s12.dp)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(DdsSpace.s12.dp), verticalAlignment = Alignment.CenterVertically) {
                        DdsButton("저장", onClick = {}, modifier = Modifier.weight(1f))
                        DdsButton("취소", onClick = {}, modifier = Modifier.weight(1f), variant = DdsButtonVariant.Secondary)
                        DdsButton("더 보기".keepWords(), onClick = {}, modifier = Modifier.weight(1f), variant = DdsButtonVariant.Ghost)
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(DdsSpace.s12.dp), verticalAlignment = Alignment.CenterVertically) {
                        DdsButton("삭제", onClick = {}, modifier = Modifier.weight(1f), variant = DdsButtonVariant.Danger)
                        DdsButton("비활성", onClick = {}, modifier = Modifier.weight(1f), enabled = false)
                        DdsButton("저장", onClick = {}, modifier = Modifier.weight(1f), loading = true, loadingDescription = "Saving")
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(DdsSpace.s12.dp), verticalAlignment = Alignment.CenterVertically) {
                        DdsButton("내보내기", onClick = {}, variant = DdsButtonVariant.Secondary, leading = { DdsIcon(DdsIcons.Download, null, size = DdsIconSize.sm.dp) })
                        DdsIconButton(DdsIcons.Search, contentDescription = "Search", onClick = {})
                        DdsIconButton(DdsIcons.MoreHorizontal, contentDescription = "More", onClick = {})
                    }
                    // Small buttons keep to a row of their own: one row, one height.
                    Row(horizontalArrangement = Arrangement.spacedBy(DdsSpace.s12.dp), verticalAlignment = Alignment.CenterVertically) {
                        DdsButton("작게", onClick = {}, size = DdsSize.Sm, variant = DdsButtonVariant.Secondary)
                        DdsButton("작게", onClick = {}, size = DdsSize.Sm, variant = DdsButtonVariant.Ghost)
                    }
                    DdsButton("계약서 보내기", onClick = {}, modifier = Modifier.fillMaxWidth(), size = DdsSize.Lg)
                }
            }
        }
        DdsSection("Fields") {
            DdsCard {
                // 16 between fields: a message sits 4 from its own box, so it reads as that field's.
                Column(verticalArrangement = Arrangement.spacedBy(DdsSpace.s16.dp)) {
                    DdsTextField(name, { name = it }, label = "거래처 이름", placeholder = "예: 데브스랩", helper = "계약서에 그대로 들어갑니다")
                    DdsTextField("010-0000", {}, label = "연락처", error = "전화번호 형식이 아닙니다")
                    DdsTextField("수정할 수 없음", {}, label = "사업자 번호", enabled = false)
                }
            }
        }
        DdsSection("Choices") {
            DdsCard {
                DdsSwitch(notify, { notify = it }, label = "알림 받기", description = "서명이 끝나면 알려 드립니다")
                DdsDivider()
                DdsCheckbox(agreed, { agreed = it }, label = "약관에 동의합니다")
                DdsDivider()
                DdsRadio(channel == 0, { channel = 0 }, label = "문자로 보내기")
                DdsRadio(channel == 1, { channel = 1 }, label = "카카오톡으로 보내기")
            }
            Row(horizontalArrangement = Arrangement.spacedBy(DdsSpace.s8.dp)) {
                for ((index, text) in listOf("전체", "서명 대기", "확정").withIndex()) {
                    DdsChip(text, selected = filter == index, onSelectedChange = { filter = index })
                }
            }
        }
        DdsSection("List") {
            DdsCard(contentPadding = PaddingValues()) {
                DdsListRow("데브스랩 주식회사", subtitle = "2026.11.10 · 1,234,000원", onClick = {}, trailing = { DdsBadge("서명 대기", tone = DdsTone.Warning) })
                DdsDivider(Modifier.padding(horizontal = DdsSpace.s16.dp))
                DdsListRow("아주 긴 이름을 가진 거래처는 한 줄에서 말줄임으로 끝납니다 주식회사", subtitle = "2026.11.09 · 980,000원", onClick = {}, trailing = { DdsBadge("확정", tone = DdsTone.Success) })
                DdsDivider(Modifier.padding(horizontal = DdsSpace.s16.dp))
                DdsListRow("설정", onClick = {}, leading = { DdsIcon(DdsIcons.Settings, null) }, trailing = { DdsIcon(DdsIcons.ChevronRight, null, size = DdsIconSize.sm.dp) })
            }
        }
        DdsSection("Notices and badges", description = "Each meaning has its own icon.") {
            DdsNotice("새 버전이 준비됐습니다.", tone = DdsTone.Info, iconDescription = "Notice")
            DdsNotice("계약서를 보냈습니다.", tone = DdsTone.Success, iconDescription = "Done")
            DdsNotice("서명 기한이 하루 남았습니다.", tone = DdsTone.Warning, iconDescription = "Warning")
            DdsNotice("보내지 못했습니다. 연결을 확인하고 다시 시도해 주세요.", tone = DdsTone.Danger, iconDescription = "Error")
            Row(horizontalArrangement = Arrangement.spacedBy(DdsSpace.s8.dp), verticalAlignment = Alignment.CenterVertically) {
                DdsBadge("초안")
                DdsBadge("안내", tone = DdsTone.Info)
                DdsBadge("확정", tone = DdsTone.Success)
                DdsBadge("취소", tone = DdsTone.Danger)
            }
        }
        DdsSection("Empty and dialog") {
            DdsEmptyState(
                title = "아직 계약이 없습니다",
                description = "첫 계약서를 보내면 여기에 나타납니다.",
                action = { DdsButton("계약서 보내기", onClick = { asking = true }) },
            )
            Row(horizontalArrangement = Arrangement.spacedBy(DdsSpace.s12.dp), verticalAlignment = Alignment.CenterVertically) {
                DdsSpinner(description = "Loading", color = DdsTheme.colors.textBrand)
                Text("DdsSpinner", style = DdsTheme.typography.body2, color = DdsTheme.colors.textSecondary)
            }
        }
    }
    if (asking) {
        DdsDialog(
            title = "계약서를 보낼까요?",
            text = "보낸 뒤에는 내용을 바꿀 수 없습니다.",
            onDismissRequest = { asking = false },
            confirm = { DdsButton("보내기", onClick = { asking = false }) },
            dismiss = { DdsButton("취소", onClick = { asking = false }, variant = DdsButtonVariant.Ghost) },
        )
    }
}

// ---------------------------------------------------------------------------
// Motion
// ---------------------------------------------------------------------------

@Composable
fun MotionPage(onOpen: (Int) -> Unit) {
    val reduced = rememberReducedMotion()
    // Stand-in for a screen's own state: `busy` while work runs, `loaded` once the first answer is in.
    var busy by remember { mutableStateOf(true) }
    var loaded by remember { mutableStateOf(false) }
    var pulling by remember { mutableStateOf(false) }
    var runs by remember { mutableStateOf(0) }
    LaunchedEffect(runs) {
        busy = true
        delay(FAKE_WORK_MS)
        loaded = true
        busy = false
    }

    // Pulling does what the Refresh button does. The pull indicator follows the real work.
    DdsPullRefresh(busy = busy, onRefresh = { runs++ }, onPulling = { pulling = it }) {
        PageBody {
            Text(
                if (reduced) "Animations are off: nothing slides or staggers." else "Tabs appear (${DdsMotion.Short}ms). Open a row: the content slides in (${DdsMotion.Slow}ms); the bars stay still.",
                style = DdsTheme.typography.body2,
                color = DdsTheme.colors.textSecondary,
            )
            DdsButton(
                "Refresh",
                onClick = { runs++ },
                enabled = !busy,
                variant = DdsButtonVariant.Secondary,
                leading = { DdsIcon(DdsIcons.Refresh, null, size = DdsIconSize.sm.dp) },
            )
            Block("Staggered list") {
                if (!loaded) {
                    // A first load holds the place with still rows; no "empty" message shows before the answer.
                    DdsLoadingRows(description = "Loading", rows = 3)
                } else {
                    for (index in 0 until 8) {
                        Row(
                            Modifier
                                .fillMaxWidth()
                                .heightIn(min = DdsRow.min.dp)
                                .ddsAppear(index)
                                .clip(MaterialTheme.shapes.small)
                                .clickable { onOpen(index) }
                                .padding(horizontal = DdsSpace.s8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Box(Modifier.size(DdsSpace.s8.dp).clip(CircleShape).background(DdsTheme.colors.textBrand))
                            Spacer(Modifier.width(DdsSpace.s12.dp))
                            Text("Item ${index + 1}", Modifier.weight(1f), style = DdsTheme.typography.body1)
                            Text("${minOf(index, DdsMotion.StaggerLimit) * DdsMotion.StaggerStep}ms", style = DdsTheme.typography.caption.copy(fontFamily = DdsMono), color = DdsTheme.colors.textMuted)
                        }
                    }
                }
            }
        }
        // Drawn over the content, so work starting or ending never pushes the page down;
        // hidden while the pull indicator is already showing the same work.
        DdsBusyBar(busy = busy && !pulling, modifier = Modifier.padding(horizontal = DdsScreen.gutter.dp))
    }
}

private const val FAKE_WORK_MS = 1_500L

@Composable
fun MotionDetail(index: Int) {
    PageBody {
        Text("Item ${index + 1}", style = DdsTheme.typography.title1)
        Text(
            "This content arrived from the trailing edge. Go back: the list arrives from the leading edge, faster (${DdsMotion.Base}ms).",
            style = DdsTheme.typography.body1,
            color = DdsTheme.colors.textSecondary,
        )
    }
}
