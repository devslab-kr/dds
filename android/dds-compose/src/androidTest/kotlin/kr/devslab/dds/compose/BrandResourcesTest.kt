package kr.devslab.dds.compose

import android.content.Context
import android.content.res.Configuration
import androidx.compose.ui.graphics.Color
import androidx.test.platform.app.InstrumentationRegistry
import java.util.Locale
import kr.devslab.dds.compose.theme.DdsBrand
import kr.devslab.dds.compose.theme.DdsContrastPair
import kr.devslab.dds.compose.theme.DdsMinTextContrast
import kr.devslab.dds.compose.theme.allowResource
import kr.devslab.dds.compose.theme.allowResourceName
import kr.devslab.dds.compose.theme.contrastRatio
import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * A product declares a contrast exception in its resources, next to its colors.
 *
 * The products here are resource folders under a made-up locale
 * (`src/androidTest/res/values-b+zz`, `values-b+zy`, `values-b+zy-night`): a
 * context for that locale sees them the way an app sees its own `res/values`
 * and `res/values-night`, and no other test does.
 */
class BrandResourcesTest {
    private val context: Context = InstrumentationRegistry.getInstrumentation().targetContext

    /** The context of the product whose resources sit under [language]. */
    private fun product(language: String): Context {
        val configuration = Configuration(context.resources.configuration).apply { setLocale(Locale.forLanguageTag(language)) }
        return context.createConfigurationContext(configuration)
    }

    private val orange = Color(context.getColor(android.R.color.holo_orange_dark))

    @Test
    fun withoutOverridesTheBrandIsTheDefaultAndDeclaresNothing() {
        val brand = DdsBrand.fromResources(context)
        assertEquals(DdsBrand.Default, brand)
        assertEquals(emptySet<DdsContrastPair>(), brand.light.allow)
        assertEquals(emptySet<DdsContrastPair>(), brand.dark.allow)
    }

    @Test
    fun theMessageNamesTheResourceThatIsRead() {
        for (pair in DdsContrastPair.entries) {
            assertEquals(pair.allowResourceName, context.resources.getResourceEntryName(pair.allowResource))
        }
    }

    @Test
    fun anExceptionDeclaredInValuesOnlyCoversBothThemes() {
        assertTrue("the pair must be one the rule rejects", contrastRatio(Color.White, orange) < DdsMinTextContrast)
        val brand = DdsBrand.fromResources(product("zz"))
        for (colors in listOf(brand.light, brand.dark)) {
            assertEquals(orange, colors.bgBrand)
            assertEquals(Color.White, colors.textOnBrand)
            assertEquals(setOf(DdsContrastPair.TextOnBrand), colors.allow)
        }
        // Only what the product redefined changed: brand text is still the system's, per theme.
        assertEquals(DdsBrand.Default.light.textBrand, brand.light.textBrand)
        assertEquals(DdsBrand.Default.dark.textBrand, brand.dark.textBrand)
    }

    @Test
    fun valuesNightCanTakeTheExceptionBackAndTheDarkThemeIsCheckedAgain() {
        val error = assertThrows(IllegalArgumentException::class.java) { DdsBrand.fromResources(product("zy")) }
        val message = error.message.orEmpty()
        assertTrue(message, message.startsWith("DdsBrand (dark): textOnBrand on bgBrand is "))
        assertTrue(message, message.contains("dds_allow_contrast_text_on_brand"))
        assertTrue(message, message.contains("res/values-night"))
    }
}
