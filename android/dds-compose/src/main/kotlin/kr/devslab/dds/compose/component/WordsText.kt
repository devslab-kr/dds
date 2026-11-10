package kr.devslab.dds.compose.component

import androidx.compose.material3.LocalTextStyle
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import kr.devslab.dds.compose.theme.keepWords
import kr.devslab.dds.compose.theme.readAs

/**
 * Text that may wrap: drawn so a Korean word is never split, read (by a screen
 * reader, by a test) as the words that were passed in.
 */
@Composable
internal fun WordsText(
    text: String,
    modifier: Modifier = Modifier,
    style: TextStyle = LocalTextStyle.current,
    color: Color = Color.Unspecified,
    textAlign: TextAlign? = null,
    maxLines: Int = Int.MAX_VALUE,
    overflow: TextOverflow = TextOverflow.Clip,
) {
    Text(text.keepWords(), modifier.readAs(text), style = style, color = color, textAlign = textAlign, maxLines = maxLines, overflow = overflow)
}
