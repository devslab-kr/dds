package kr.devslab.dds.compose.theme

import androidx.compose.material3.Typography
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.text.PlatformTextStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.LineHeightStyle
import androidx.compose.ui.unit.sp
import kr.devslab.dds.compose.R
import kr.devslab.dds.tokens.DdsLargeType
import kr.devslab.dds.tokens.DdsType
import kr.devslab.dds.tokens.DdsTypeToken

/**
 * Pretendard, one file per weight the type scale uses.
 *
 * The web sets Latin in Geist and Korean in Pretendard, per glyph. Compose
 * picks a font by weight, not by script — list two families at the same
 * weight and only the first is ever used — so Android sets everything in
 * Pretendard. The files hold Latin and the 2,350 KS X 1001 syllables; a rarer
 * syllable falls back to the system font.
 */
public val DdsSans: FontFamily = FontFamily(
    Font(R.font.pretendard_regular, FontWeight.Normal),
    Font(R.font.pretendard_medium, FontWeight.Medium),
    Font(R.font.pretendard_semibold, FontWeight.SemiBold),
    Font(R.font.pretendard_bold, FontWeight.Bold),
)

/** Geist Mono, for code and fixed-width labels (Latin only). */
public val DdsMono: FontFamily = FontFamily(
    Font(R.font.geist_mono_regular, FontWeight.Normal),
    Font(R.font.geist_mono_medium, FontWeight.Medium),
)

/**
 * The DDS type scale. Eight styles; no size outside them.
 * Sizes are sp, so the system font scale applies on top.
 */
@Immutable
public class DdsTypography internal constructor(
    /** 32/40 bold — large numbers. */
    public val display: TextStyle,
    /** 24/32 bold — screen title. */
    public val title1: TextStyle,
    /** 20/28 semibold — section and dialog title. */
    public val title2: TextStyle,
    /** 17/24 semibold — card title, emphasized row. */
    public val title3: TextStyle,
    /** 16/24 — body. */
    public val body1: TextStyle,
    /** 14/20 — dense body. */
    public val body2: TextStyle,
    /** 13/16 medium — buttons, field labels, tabs. */
    public val label: TextStyle,
    /** 12/16 — timestamps and secondary detail. Never body text. */
    public val caption: TextStyle,
)

private fun DdsTypeToken.style(): TextStyle = TextStyle(
    fontFamily = DdsSans,
    fontSize = fontSize.sp,
    lineHeight = lineHeight.sp,
    fontWeight = FontWeight(fontWeight),
    // Center the glyphs in the line box and drop the legacy font padding, so a
    // label sits on the optical center of a 48dp button instead of a few
    // pixels low.
    platformStyle = PlatformTextStyle(includeFontPadding = false),
    lineHeightStyle = LineHeightStyle(LineHeightStyle.Alignment.Center, LineHeightStyle.Trim.None),
)

internal fun ddsTypography(largeText: Boolean): DdsTypography =
    if (largeText) {
        DdsTypography(
            display = DdsLargeType.display.style(),
            title1 = DdsLargeType.title1.style(),
            title2 = DdsLargeType.title2.style(),
            title3 = DdsLargeType.title3.style(),
            body1 = DdsLargeType.body1.style(),
            body2 = DdsLargeType.body2.style(),
            label = DdsLargeType.label.style(),
            caption = DdsLargeType.caption.style(),
        )
    } else {
        DdsTypography(
            display = DdsType.display.style(),
            title1 = DdsType.title1.style(),
            title2 = DdsType.title2.style(),
            title3 = DdsType.title3.style(),
            body1 = DdsType.body1.style(),
            body2 = DdsType.body2.style(),
            label = DdsType.label.style(),
            caption = DdsType.caption.style(),
        )
    }

/**
 * The eight DDS styles on Material3's fifteen slots. Several slots share a
 * style on purpose: stock Material components then stay inside the scale.
 */
internal fun materialTypography(t: DdsTypography): Typography = Typography(
    displayLarge = t.display,
    displayMedium = t.display,
    displaySmall = t.display,
    headlineLarge = t.display,
    headlineMedium = t.title1,
    headlineSmall = t.title2,
    titleLarge = t.title2,
    titleMedium = t.title3,
    titleSmall = t.label,
    bodyLarge = t.body1,
    bodyMedium = t.body2,
    bodySmall = t.caption,
    labelLarge = t.label,
    labelMedium = t.caption,
    labelSmall = t.caption,
)

internal val LocalDdsTypography = staticCompositionLocalOf<DdsTypography> {
    error("DdsTheme is missing: wrap the content in DdsTheme { }")
}

/**
 * Android breaks Korean between any two syllables. This joins the characters
 * of each word so a line breaks only at spaces — the same result as the web's
 * `word-break: keep-all`.
 *
 * Use it for short Korean UI text (titles, buttons, notices). Do not use it
 * on a string with no spaces that may be longer than the line: it could then
 * not wrap at all.
 */
public fun String.keepWords(): String {
    if (isEmpty()) return this
    val out = StringBuilder(length * 2)
    var i = 0
    while (i < length) {
        // Step by code point, so an emoji or a rare ideograph (a surrogate pair) is never split.
        val codePoint = codePointAt(i)
        val next = i + Character.charCount(codePoint)
        out.appendCodePoint(codePoint)
        if (next < length && !Character.isWhitespace(codePoint) && !Character.isWhitespace(codePointAt(next))) {
            out.append(WORD_JOINER)
        }
        i = next
    }
    return out.toString()
}

/** U+2060 WORD JOINER: invisible, zero width, forbids a line break on either side. */
private const val WORD_JOINER: Char = 0x2060.toChar()
