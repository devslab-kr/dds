package kr.devslab.dds.compose.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Shapes
import androidx.compose.ui.unit.dp
import kr.devslab.dds.tokens.DdsRadius

/**
 * DDS radii on Material3's five shape slots.
 *
 *   extraSmall  radius.sm   checkbox, tag
 *   small       radius.md   button, text field
 *   medium      radius.lg   card
 *   large       radius.xl   sheet, dialog
 *   extraLarge  radius.xl   (DDS has nothing rounder short of a pill)
 */
internal val DdsShapes: Shapes = Shapes(
    extraSmall = RoundedCornerShape(DdsRadius.sm.dp),
    small = RoundedCornerShape(DdsRadius.md.dp),
    medium = RoundedCornerShape(DdsRadius.lg.dp),
    large = RoundedCornerShape(DdsRadius.xl.dp),
    extraLarge = RoundedCornerShape(DdsRadius.xl.dp),
)
