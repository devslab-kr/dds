package kr.devslab.dds.compose.localization

import java.util.Locale
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class TranslationCatalogTest {
    private val app = "kr.devslab.authenticator"
    private val catalog = """
        {"schema":1,"app":"kr.devslab.authenticator","locale":"fr","strings":{"heading":"Nouveau"},
        "plurals":{"count":{"one":"Un élément","other":"%1${'$'}d éléments"}}}
    """.trimIndent().toByteArray()

    @Test
    fun acceptsOnlyTheExpectedVersionAndLocale() {
        val parsed = requireNotNull(TranslationCatalog.parse(catalog, app, "fr"))
        assertEquals("Nouveau", parsed.string("heading"))
        assertNull(parsed.string("missing"))
        assertEquals("Un élément", parsed.plural("count", "one"))
        assertEquals("%1${'$'}d éléments", parsed.plural("count", "few"))
        assertNull(TranslationCatalog.parse(catalog, app, "ko"))
        assertNull(TranslationCatalog.parse(catalog, "com.example.other", "fr"))
        assertNull(TranslationCatalog.parse(catalog.toString(Charsets.UTF_8).replace("\"schema\":1", "\"schema\":2").toByteArray(), app, "fr"))
        assertNull(TranslationCatalog.parse(ByteArray(TranslationCatalog.MAX_BYTES + 1), app, "fr"))
    }

    @Test
    fun validatesFormatArgumentsAndPreservesTheirOrderSemantics() {
        val bundled = "%1${'$'}s chose %2${'$'}d"
        assertEquals("42 choisi par Alex", TranslationCatalog.format("%2${'$'}d choisi par %1${'$'}s", bundled, Locale.FRENCH, "Alex", 42))
        assertNull(TranslationCatalog.format("%1${'$'}s", bundled, Locale.FRENCH, "Alex", 42))
        assertNull(TranslationCatalog.format("Incorrect %1${'$'}d %2${'$'}s", bundled, Locale.FRENCH, "Alex", 42))
        assertNull(TranslationCatalog.format("%1${'$'}s %2${'$'}d %q", bundled, Locale.FRENCH, "Alex", 42))
    }

    @Test
    fun ignoresBlankOrNonTextOverrides() {
        assertNull(TranslationCatalog.format(" ", "Bundled", Locale.ENGLISH))
        val bytes = """{"schema":1,"app":"kr.devslab.authenticator","locale":"en","strings":{"heading":12},"plurals":{}}""".toByteArray()
        assertNull(TranslationCatalog.parse(bytes, app, "en"))
    }

    @Test
    fun preservesNamedTokensWithoutBlockingLiteralPercentages() {
        assertEquals(
            "10% avec {terms}",
            TranslationCatalog.format("10% avec {terms}", "10% with {terms}", Locale.FRENCH),
        )
        assertNull(TranslationCatalog.format("Sans lien", "Read {terms}", Locale.FRENCH))
        assertNull(TranslationCatalog.format("Texte %1${'$'}s", "Read only", Locale.FRENCH))
    }

    @Test
    fun rejectsInvalidUtf8AndExcessivelyNestedInput() {
        assertNull(TranslationCatalog.parse(byteArrayOf(0xc3.toByte(), 0x28), app, "fr"))
        assertNull(TranslationCatalog.parse("[[[[[[]]]]]]".encodeToByteArray(), app, "fr"))
    }
}
