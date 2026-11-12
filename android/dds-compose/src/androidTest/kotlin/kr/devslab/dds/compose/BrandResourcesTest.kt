package kr.devslab.dds.compose

import android.content.Context
import android.content.res.Configuration
import androidx.compose.foundation.layout.Column
import androidx.compose.material3.MaterialTheme
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.test.filters.SdkSuppress
import androidx.test.platform.app.InstrumentationRegistry
import java.util.Locale
import kr.devslab.dds.compose.component.DdsBottomBar
import kr.devslab.dds.compose.component.DdsNavItem
import kr.devslab.dds.compose.component.DdsTopBar
import kr.devslab.dds.compose.icons.DdsIcons
import kr.devslab.dds.compose.test.R as TestR
import kr.devslab.dds.compose.theme.DdsBrand
import kr.devslab.dds.compose.theme.DdsContrastPair
import kr.devslab.dds.compose.theme.DdsMinTextContrast
import kr.devslab.dds.compose.theme.DdsTheme
import kr.devslab.dds.compose.theme.allowResource
import kr.devslab.dds.compose.theme.allowResourceName
import kr.devslab.dds.compose.theme.contrastRatio
import kr.devslab.dds.tokens.DdsDarkColors
import kr.devslab.dds.tokens.DdsLightColors
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * A product declares a contrast exception, and its own backgrounds, in its
 * resources, next to its colors.
 *
 * The products here are resource folders under a made-up locale
 * (`src/androidTest/res/values-b+zz`, `values-b+zy`, `values-b+zy-night`,
 * `values-b+zx`, `values-b+zx-night`): a context for that locale sees them the
 * way an app sees its own `res/values` and `res/values-night`, and no other
 * test does.
 *
 * The stand-in is not exact. A locale qualifier outranks `night`, so a color in
 * `values-b+zz` is read in the dark theme even when DDS defines that color in
 * its own `values-night` (the three backgrounds, `dds_color_bg_brand_subtle`,
 * `dds_color_text_brand`, `dds_color_border_focus`). In a real app the library's
 * `values-night` wins there, and the app's `res/values` reaches the light theme
 * only. These tests therefore do not show how an app's colors take precedence
 * over the library's; that was not tested in a separate app. The bools are
 * defined in `values` only, so for them the fallback shown here is the real one.
 */
class BrandResourcesTest {
    @get:Rule
    val rule = createComposeRule()

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

    /** Product C's page: a warm paper color, not the system's white. */
    private val paper = Color(context.getColor(TestR.color.dds_test_paper))

    // The paper is a color state list with lStar, which Android reads from API 31 on.
    @SdkSuppress(minSdkVersion = 31)
    @Test
    fun aPageBackgroundSetInResourcesIsReadAndTheOtherTwoStayTheSystems() {
        assertNotEquals("the paper must not be the system's page", Color(DdsLightColors.bgDefault), paper)
        val brand = DdsBrand.fromResources(product("zx"))
        assertEquals(paper, brand.light.bgDefault)
        assertEquals(Color(DdsLightColors.bgSubtle), brand.light.bgSubtle)
        assertEquals(Color(DdsLightColors.bgElevated), brand.light.bgElevated)
        // The dark theme has its own page (values-b+zx-night) and the system's other two.
        assertEquals(Color.Black, brand.dark.bgDefault)
        assertEquals(Color(DdsDarkColors.bgSubtle), brand.dark.bgSubtle)
        assertEquals(Color(DdsDarkColors.bgElevated), brand.dark.bgElevated)
        // Nothing else moved, and nothing had to be declared.
        assertEquals(DdsBrand.Default.light.copy(bgDefault = paper), brand.light)
        assertEquals(DdsBrand.Default.dark.copy(bgDefault = Color.Black), brand.dark)
    }

    // The paper is a color state list with lStar, which Android reads from API 31 on.
    @SdkSuppress(minSdkVersion = 31)
    @Test
    fun theThemeTheMaterialSchemeAndTheBarsTakeTheProductPage() {
        val brand = DdsBrand.fromResources(product("zx"))
        var page = Color.Unspecified
        var card = Color.Unspecified
        var materialBackground = Color.Unspecified
        var materialSurface = Color.Unspecified
        rule.setContent {
            DdsTheme(darkTheme = false, brand = brand) {
                page = DdsTheme.colors.bgDefault
                card = DdsTheme.colors.bgElevated
                materialBackground = MaterialTheme.colorScheme.background
                materialSurface = MaterialTheme.colorScheme.surface
                Column {
                    DdsTopBar("Title", Modifier.testTag("top"))
                    DdsBottomBar(
                        items = listOf(DdsNavItem("One", DdsIcons.Calendar), DdsNavItem("Two", DdsIcons.Chat)),
                        selectedIndex = 0,
                        onSelect = {},
                        modifier = Modifier.testTag("bottom"),
                    )
                }
            }
        }
        rule.waitForIdle()
        assertEquals(paper, page)
        assertEquals(paper, materialBackground)
        assertEquals(paper, materialSurface)
        assertEquals(Color(DdsLightColors.bgElevated), card)
        // The end gutter of the top bar: past the title, nothing is drawn but the bar itself.
        val top = rule.onNodeWithTag("top").captureToImage().toPixelMap()
        assertEquals("top bar background", paper, top[top.width - 3, top.height / 2])
        // The start edge of the bottom bar, at the height of the icons: outside both tabs' pills.
        val bottom = rule.onNodeWithTag("bottom").captureToImage().toPixelMap()
        assertEquals("bottom bar background", paper, bottom[2, bottom.height / 2])
    }
}
