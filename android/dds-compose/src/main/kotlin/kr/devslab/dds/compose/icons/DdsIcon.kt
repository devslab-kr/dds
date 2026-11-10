package kr.devslab.dds.compose.icons

import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.material3.LocalContentColor
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.addPathNodes
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import kr.devslab.dds.tokens.DdsIcon as DdsIconSize

/** Builds one icon of the set from its path data (used by the generated [DdsIcons]). */
internal fun ddsIcon(name: String, vararg paths: String, autoMirror: Boolean = false): ImageVector {
    val builder = ImageVector.Builder(
        name = name,
        defaultWidth = GRID.dp,
        defaultHeight = GRID.dp,
        viewportWidth = GRID,
        viewportHeight = GRID,
        autoMirror = autoMirror,
    )
    for (path in paths) {
        builder.addPath(
            pathData = addPathNodes(path),
            // Any opaque color: the icon is tinted with the content color when drawn.
            stroke = SolidColor(Color.Black),
            strokeLineWidth = DDS_ICON_STROKE,
            strokeLineCap = StrokeCap.Round,
            strokeLineJoin = StrokeJoin.Round,
        )
    }
    return builder.build()
}

private const val GRID = 24f

/**
 * Draws a DDS icon in the color of the surrounding content.
 *
 * @param contentDescription what the icon says to a screen reader. Pass null only
 * when the icon repeats text right next to it; an icon that stands alone must be described
 * @param size [DdsIconSize.md] (24) by default; [DdsIconSize.sm] (20) inside dense rows
 */
@Composable
public fun DdsIcon(
    icon: ImageVector,
    contentDescription: String?,
    modifier: Modifier = Modifier,
    size: Dp = DdsIconSize.md.dp,
    tint: Color = LocalContentColor.current,
) {
    Icon(imageVector = icon, contentDescription = contentDescription, modifier = modifier.size(size), tint = tint)
}
