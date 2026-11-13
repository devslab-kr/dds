package kr.devslab.dds.compose.component

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.focusable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.platform.testTag
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import kotlin.math.roundToInt
import kotlinx.coroutines.launch
import kr.devslab.dds.compose.motion.DdsMotion
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.error
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.dp
import kr.devslab.dds.compose.motion.clear
import kr.devslab.dds.compose.motion.colorChange
import kr.devslab.dds.compose.theme.DdsTheme
import kr.devslab.dds.tokens.DdsBorder
import kr.devslab.dds.tokens.DdsElevation
import kr.devslab.dds.tokens.DdsRadius
import kr.devslab.dds.tokens.DdsSpace
import kr.devslab.dds.tokens.DdsTouch

/**
 * One choice of a [DdsSegmentedControl].
 *
 * @param value what [DdsSegmentedControl]'s `onSelect` receives. Unique within the control
 * @param label the words on the segment. One line; it is never wrapped
 * @param enabled false greys out this segment alone
 */
public class DdsSegment<out T>(
    public val value: T,
    public val label: String,
    public val enabled: Boolean = true,
)

/**
 * One choice among a few visible options: a view switch, a filter, a type
 * (Person / Business). The web's SegmentedControl
 * (`packages/dds-css/src/segmented-control.css`), at its touch size.
 *
 * - **Track:** `bg.subtle`, a 1dp `border.strong` line, `radius.md`, 2dp inside
 *   it and 2dp between segments.
 * - **Segment:** `radius.sm`, the `label` type, `text.secondary`. The chosen
 *   one is a `bg.raised` face with a 1dp `border.strong` line, a level-1
 *   shadow, `text.primary` and weight 600.
 * - **Motion:** the chosen face slides to the new choice (200ms, standard
 *   easing), growing or shrinking to its width; the label colors fade. With
 *   animations off on the device it moves at once. The first frame already
 *   shows it on the chosen segment.
 * - **Height:** one size, the web's touch height. The track is 50dp (48dp
 *   inside its line); each segment is 48dp of touch with a 44dp face and is
 *   at least 44dp wide. In large text mode the touch height is 56. The web's
 *   md 40 / sm 32 are pointer heights; on a touch screen both are this one.
 * - **Width:** by default each segment is as wide as its label and the track
 *   as wide as its segments. A label is drawn at the chosen weight's width in
 *   every state, so choosing a segment never moves its neighbours. Too many
 *   segments for the width scroll inside the track. [fullWidth] makes the
 *   track fill the width and share it equally; a label too long for its share
 *   ends in an ellipsis (a screen reader still reads it whole).
 *
 * A screen reader hears a radio group: each segment is a radio button that
 * says whether it is chosen. Without a visible [label], pass
 * [contentDescription] so the group has a name.
 *
 * A [selected] that is none of the segments' values chooses none of them.
 *
 * @param segments at least one; their values must be unique
 * @param selected the value of the chosen segment
 * @param onSelect called with a segment's value when the person chooses it.
 * Not called for the segment already chosen, nor while [readOnly]
 * @param label the name of the choice, shown above the track
 * @param contentDescription the group's name for a screen reader when there is no [label]
 * @param error what is wrong with the choice. The track's line turns the
 * danger color and the message is shown under it and spoken; never the
 * color alone
 * @param enabled false greys out the whole control and ignores touches
 * @param readOnly shows the choice, can be focused and read, but cannot be
 * changed. Not greyed out
 */
@Composable
public fun <T> DdsSegmentedControl(
    segments: List<DdsSegment<T>>,
    selected: T,
    onSelect: (T) -> Unit,
    modifier: Modifier = Modifier,
    label: String? = null,
    contentDescription: String? = null,
    fullWidth: Boolean = false,
    error: String? = null,
    enabled: Boolean = true,
    readOnly: Boolean = false,
) {
    checkSegments(segments) // a handful of segments: cheap enough on every composition
    val colors = DdsTheme.colors
    val typography = DdsTheme.typography
    val touch = if (DdsTheme.largeText) DdsTouch.large else DdsTouch.min
    val trackShape = RoundedCornerShape(DdsRadius.md.dp)
    val trackLine by colorChange(if (error != null) colors.statusDanger else colors.borderStrong)
    val scroll = rememberScrollState()

    Column(
        modifier.then(if (fullWidth) Modifier.fillMaxWidth() else Modifier),
        verticalArrangement = Arrangement.spacedBy(DdsSpace.s4.dp),
    ) {
        if (label != null) WordsText(label, style = typography.label, color = colors.textPrimary)
        SegmentRow(
            fullWidth = fullWidth,
            touch = touch,
            chosen = segments.indexOfFirst { it.value == selected },
            modifier = Modifier
                .then(if (fullWidth) Modifier.fillMaxWidth() else Modifier)
                // Disabled dims the track as a whole (the web's `[data-disabled]` track).
                .alpha(if (enabled) 1f else DISABLED_ALPHA)
                .clip(trackShape)
                .background(colors.bgSubtle)
                .border(DdsBorder.hairline.dp, trackLine, trackShape)
                .padding(DdsBorder.hairline.dp)
                .then(if (fullWidth) Modifier else Modifier.horizontalScroll(scroll))
                .padding(horizontal = DdsSpace.s2.dp)
                .selectableGroup()
                .semantics {
                    if (label == null && contentDescription != null) this.contentDescription = contentDescription
                    if (error != null) error(error)
                },
        ) {
            for (segment in segments) {
                val chosen = segment.value == selected
                Segment(
                    label = segment.label,
                    selected = chosen,
                    // A segment of a disabled control is disabled, but only a segment disabled
                    // on its own is dimmed: the track is dimmed already.
                    enabled = enabled && segment.enabled,
                    dimmed = enabled && !segment.enabled,
                    readOnly = readOnly,
                    fullWidth = fullWidth,
                    touch = touch,
                    onClick = { if (!chosen) onSelect(segment.value) },
                )
            }
        }
        if (error != null) FieldMessage(helper = null, error = error)
    }
}

/**
 * The segments side by side with 2dp between them, all as tall as the tallest
 * and at least [touch] tall. With [fullWidth] the width is shared equally;
 * otherwise each is as wide as it wants (it sits inside a horizontal scroll).
 *
 * The chosen face is one thumb behind the segments, not a face on each (D-055):
 * choosing another segment slides it there, growing or shrinking to that
 * segment's width on the way, over [DdsMotion.Base] with the standard easing —
 * the web's indicator and [DdsTabs]'s underline move the same way. The first
 * layout, and a new place for the same choice (rotation, font size), put it
 * there without travel. [chosen] is -1 when no segment is chosen: no thumb.
 */
@Composable
private fun SegmentRow(fullWidth: Boolean, touch: Int, chosen: Int, modifier: Modifier, content: @Composable () -> Unit) {
    // Where each segment starts and ends, in px from the start edge. Written when the row is
    // placed; read when the choice changes, never while the row is measured.
    var spans by remember { mutableStateOf<List<IntRange>>(emptyList()) }
    val span = spans.getOrNull(chosen)
    val thumbStart = remember { Animatable(0f) }
    val thumbEnd = remember { Animatable(0f) }
    var thumbFor by remember { mutableIntStateOf(-1) } // the segment the thumb last went to; -1 before the first layout
    LaunchedEffect(span, chosen) {
        span ?: return@LaunchedEffect
        val start = span.first.toFloat()
        val end = (span.last + 1).toFloat()
        if (thumbFor == chosen || thumbFor == -1) {
            thumbStart.snapTo(start)
            thumbEnd.snapTo(end)
        } else {
            val slide = tween<Float>(DdsMotion.Base, easing = DdsMotion.Standard)
            launch { thumbStart.animateTo(start, slide) }
            launch { thumbEnd.animateTo(end, slide) }
        }
        thumbFor = chosen
    }
    val hasThumb = chosen >= 0
    Layout(
        content = {
            if (hasThumb) SegmentThumb()
            content()
        },
        modifier = modifier,
    ) { all, constraints ->
        val thumb = if (hasThumb) all.first() else null
        val measurables = if (hasThumb) all.drop(1) else all
        val gap = DdsSpace.s2.dp.roundToPx()
        val gaps = gap * (measurables.size - 1).coerceAtLeast(0)
        val count = measurables.size.coerceAtLeast(1)
        val room = (constraints.maxWidth - gaps).coerceAtLeast(0)
        val share = if (fullWidth && constraints.hasBoundedWidth) room / count else null
        // The pixels an equal split leaves over go one each to the first segments, so the
        // last one ends on the track's inner edge instead of a pixel or two short of it.
        val leftOver = if (share != null) room - share * count else 0
        val height = maxOf(
            touch.dp.roundToPx(),
            constraints.minHeight,
            measurables.maxOfOrNull { it.maxIntrinsicHeight(share ?: Constraints.Infinity) } ?: 0,
        )
        val cells = measurables.mapIndexed { index, measurable ->
            measurable.measure(
                if (share != null) {
                    Constraints.fixed(share + if (index < leftOver) 1 else 0, height)
                } else {
                    Constraints(minHeight = height, maxHeight = height)
                },
            )
        }
        val width = cells.sumOf { it.width } + gaps
        val placed = ArrayList<IntRange>(cells.size)
        var edge = 0
        for (cell in cells) {
            placed += edge until edge + cell.width
            edge += cell.width + gap
        }
        // The face sits 2dp in from the top and bottom of the touch area, as each segment's own did.
        val inset = DdsSpace.s2.dp.roundToPx()
        // Before the thumb has been sent anywhere it stands on the chosen segment: the first
        // frame already has it, with no slide in from the start edge.
        val target = placed.getOrNull(chosen)
        val travelled = thumbFor != -1
        val thumbX = if (travelled) thumbStart.value.roundToInt() else target?.first ?: 0
        val thumbWidth = if (travelled) (thumbEnd.value - thumbStart.value).roundToInt() else target?.let { it.last + 1 - it.first } ?: 0
        val thumbPlaceable = thumb?.measure(Constraints.fixed(thumbWidth.coerceAtLeast(0), (height - 2 * inset).coerceAtLeast(0)))
        layout(maxOf(width, constraints.minWidth), height) {
            thumbPlaceable?.placeRelative(thumbX, inset)
            for ((index, cell) in cells.withIndex()) cell.placeRelative(placed[index].first, 0)
            // Recorded here, not while measuring: this block runs only for a real layout, while
            // the measuring above also answers intrinsic-size questions with stand-in sizes.
            spans = placed // an equal list changes nothing, so this settles
        }
    }
}

/** The chosen face: `bg.raised` with a 1dp `border.strong` line and a level-1 shadow (D-054). */
@Composable
private fun SegmentThumb() {
    val colors = DdsTheme.colors
    val shape = RoundedCornerShape(DdsRadius.sm.dp)
    Box(
        Modifier
            .testTag(SEGMENT_THUMB_TAG)
            .shadow(DdsElevation.level1.dp, shape)
            .clip(shape)
            .background(colors.bgRaised)
            .border(DdsBorder.hairline.dp, colors.borderStrong, shape),
    )
}

/** The thumb's test tag, for this module's device tests. */
internal const val SEGMENT_THUMB_TAG: String = "dds-segmented-thumb"

@Composable
private fun Segment(
    label: String,
    selected: Boolean,
    enabled: Boolean,
    dimmed: Boolean,
    readOnly: Boolean,
    fullWidth: Boolean,
    touch: Int,
    onClick: () -> Unit,
) {
    val colors = DdsTheme.colors
    val shape = RoundedCornerShape(DdsRadius.sm.dp)
    // The face is the touch height less the 2dp above and below it: 44dp (52 in large text).
    // A content-width face is at least that wide too, so even "A" is a square to aim at.
    val faceMin = (touch - 2 * DdsSpace.s2).dp
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val hovered by interaction.collectIsHoveredAsState()
    val focused by interaction.collectIsFocusedAsState()
    val active = enabled && !readOnly && !selected
    val face by colorChange(
        when {
            active && pressed -> colors.overlayPressedTint
            active && hovered -> colors.overlayHoverTint
            else -> colors.overlayPressedTint.clear()
        },
    )
    val ink by colorChange(if (selected || (active && (pressed || hovered))) colors.textPrimary else colors.textSecondary)
    // The chosen face is the thumb behind the row; a segment draws only press, hover and focus.
    // The focus ring lies over the thumb's line on the chosen segment.
    val edge = if (focused) Modifier.border(DdsBorder.focus.dp, colors.borderFocus, shape) else Modifier
    // The touch area is the whole height inside the track's line; the face sits 2dp in from it.
    val touchArea = if (readOnly) {
        Modifier
            .semantics(mergeDescendants = true) {
                role = Role.RadioButton
                this.selected = selected
            }
            .focusable(enabled, interaction)
    } else {
        Modifier.selectable(
            selected = selected,
            interactionSource = interaction,
            indication = null, // the face's own tint is the press feedback, as on the web
            enabled = enabled,
            role = Role.RadioButton,
            onClick = onClick,
        )
    }
    Box(
        touchArea
            .alpha(if (dimmed) DISABLED_ALPHA else 1f)
            .padding(vertical = DdsSpace.s2.dp),
        contentAlignment = Alignment.Center,
    ) {
        Box(
            Modifier
                .fillMaxSize()
                .widthIn(min = faceMin)
                .clip(shape)
                .background(face)
                .then(edge)
                .padding(horizontal = DdsSpace.s12.dp),
            contentAlignment = Alignment.Center,
        ) {
            val style = DdsTheme.typography.label
            if (fullWidth) {
                Text(
                    label,
                    Modifier.fillMaxWidth(),
                    style = style,
                    color = ink,
                    fontWeight = if (selected) FontWeight.SemiBold else null,
                    textAlign = TextAlign.Center,
                    maxLines = 1,
                    softWrap = false,
                    overflow = TextOverflow.Ellipsis,
                )
            } else {
                WeightStableLabel(label, heavy = selected, style = style, color = ink)
            }
        }
    }
}

internal fun checkSegments(segments: List<DdsSegment<*>>) {
    require(segments.isNotEmpty()) { "DdsSegmentedControl: segments must not be empty" }
    val seen = HashSet<Any?>()
    for (segment in segments) {
        require(seen.add(segment.value)) { "DdsSegmentedControl: segment values must be unique (${segment.value})" }
    }
}
