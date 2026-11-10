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
import kr.devslab.dds.compose.motion.DdsMotion
import kr.devslab.dds.compose.motion.ddsAppear
import kr.devslab.dds.compose.motion.ddsScreenContent
import kr.devslab.dds.compose.motion.rememberReducedMotion
import kr.devslab.dds.compose.theme.DdsMono
import kr.devslab.dds.compose.theme.DdsTheme
import kr.devslab.dds.compose.theme.contrastRatio
import kr.devslab.dds.compose.theme.keepWords
import kr.devslab.dds.tokens.DdsBorder
import kr.devslab.dds.tokens.DdsControl
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
    Column(verticalArrangement = Arrangement.spacedBy(DdsSpace.s12.dp)) {
        Text(title, style = DdsTheme.typography.title3)
        // A card: elevated face, hairline edge, no shadow.
        Surface(
            color = DdsTheme.colors.bgElevated,
            shape = MaterialTheme.shapes.medium,
            border = BorderStroke(DdsBorder.hairline.dp, DdsTheme.colors.borderDefault),
        ) {
            Column(Modifier.fillMaxWidth().padding(DdsSpace.s16.dp), verticalArrangement = Arrangement.spacedBy(DdsSpace.s12.dp), content = content)
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
// Controls — stock Material3 under DdsTheme, plus the filled brand face
// ---------------------------------------------------------------------------

@Composable
fun ControlsPage() {
    val c = DdsTheme.colors
    var text by rememberSaveable { mutableStateOf("") }
    var checked by rememberSaveable { mutableStateOf(true) }
    var on by rememberSaveable { mutableStateOf(true) }
    val height = Modifier.heightIn(min = DdsControl.md.dp)
    PageBody {
        Block("Buttons at control.md") {
            Row(horizontalArrangement = Arrangement.spacedBy(DdsSpace.s12.dp), verticalAlignment = Alignment.CenterVertically) {
                // The filled brand face: bg.brand with text.on-brand, in both themes.
                Button(
                    onClick = {},
                    modifier = height.weight(1f),
                    shape = MaterialTheme.shapes.small,
                    colors = ButtonDefaults.buttonColors(containerColor = c.bgBrand, contentColor = c.textOnBrand),
                ) { Text("저장") }
                OutlinedButton(onClick = {}, modifier = height.weight(1f), shape = MaterialTheme.shapes.small) { Text("취소") }
                TextButton(onClick = {}, modifier = height.weight(1f), shape = MaterialTheme.shapes.small) { Text("더 보기".keepWords()) }
            }
            Button(
                onClick = {},
                modifier = Modifier.fillMaxWidth().heightIn(min = DdsControl.lg.dp),
                shape = MaterialTheme.shapes.small,
                colors = ButtonDefaults.buttonColors(containerColor = c.bgBrand, contentColor = c.textOnBrand),
            ) { Text("계약서 보내기") }
            Row(horizontalArrangement = Arrangement.spacedBy(DdsSpace.s12.dp)) {
                Button(
                    onClick = {},
                    modifier = height.weight(1f),
                    shape = MaterialTheme.shapes.small,
                    colors = ButtonDefaults.buttonColors(containerColor = c.statusDanger, contentColor = c.textOnStatus),
                ) { Text("삭제") }
                Button(onClick = {}, enabled = false, modifier = height.weight(1f), shape = MaterialTheme.shapes.small) { Text("비활성") }
            }
        }
        Block("Field") {
            OutlinedTextField(
                value = text,
                onValueChange = { text = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("거래처 이름") },
                singleLine = true,
                shape = MaterialTheme.shapes.small,
            )
            OutlinedTextField(
                value = "010-0000",
                onValueChange = {},
                modifier = Modifier.fillMaxWidth(),
                label = { Text("연락처") },
                isError = true,
                supportingText = { Text("전화번호 형식이 아닙니다") },
                singleLine = true,
                shape = MaterialTheme.shapes.small,
            )
        }
        Block("Choice") {
            Row(Modifier.fillMaxWidth().heightIn(min = DdsRow.min.dp), verticalAlignment = Alignment.CenterVertically) {
                Text("알림 받기", Modifier.weight(1f), style = DdsTheme.typography.body1)
                Switch(checked = on, onCheckedChange = { on = it })
            }
            HorizontalDivider(color = c.borderDefault)
            Row(Modifier.fillMaxWidth().heightIn(min = DdsRow.min.dp), verticalAlignment = Alignment.CenterVertically) {
                Text("약관에 동의합니다", Modifier.weight(1f), style = DdsTheme.typography.body1)
                Checkbox(checked = checked, onCheckedChange = { checked = it })
            }
        }
        Block("Progress") {
            LinearProgressIndicator(progress = { 0.6f }, modifier = Modifier.fillMaxWidth(), trackColor = c.borderDefault)
        }
    }
}

// ---------------------------------------------------------------------------
// Motion
// ---------------------------------------------------------------------------

@Composable
fun MotionPage(onOpen: (Int) -> Unit) {
    val reduced = rememberReducedMotion()
    PageBody {
        Text(
            if (reduced) "Animations are off: nothing slides or staggers." else "Tabs appear (${DdsMotion.Short}ms). Open a row: the content slides in (${DdsMotion.Slow}ms); the bars stay still.",
            style = DdsTheme.typography.body2,
            color = DdsTheme.colors.textSecondary,
        )
        Block("Staggered list") {
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
