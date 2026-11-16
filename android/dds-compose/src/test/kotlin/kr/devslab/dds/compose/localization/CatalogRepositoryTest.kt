package kr.devslab.dds.compose.localization

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class CatalogRepositoryTest {
    @get:Rule
    val files = TemporaryFolder()

    @Test
    fun replacesCatalogOnlyWhenTheResponseMatchesTheAppAndLocale() {
        val directory = files.newFolder()
        val pending = mutableListOf(
            CatalogRepository.Download(catalog("fr", "First"), "\"v1\""),
            CatalogRepository.Download(catalog("en", "Wrong locale"), "\"v2\""),
            CatalogRepository.Download(catalog("fr", "Corrected"), "\"v3\""),
            null,
        )
        val requests = mutableListOf<Pair<String, String?>>()
        val repository = CatalogRepository(APP, directory, BASE_URL) { url, etag ->
            requests += url to etag
            pending.removeAt(0)
        }

        assertNull(repository.cached("fr"))
        assertEquals("First", repository.refresh("fr")?.string("heading"))
        assertNull(repository.refresh("fr"))
        assertEquals("First", repository.cached("fr")?.string("heading"))
        assertEquals("Corrected", repository.refresh("fr")?.string("heading"))
        assertNull(repository.refresh("fr"))

        val reopened = CatalogRepository(APP, directory, BASE_URL)
        assertEquals("Corrected", reopened.cached("fr")?.string("heading"))
        assertNull(reopened.cached("en"))
        assertNull(CatalogRepository("com.example.other", directory, BASE_URL).cached("fr"))
        assertEquals(listOf(null, "\"v1\"", "\"v1\"", "\"v3\""), requests.map { it.second })
        assertEquals(
            listOf("https://devslab.kr/ota-locales/v1/$APP/fr.json"),
            requests.map { it.first }.distinct(),
        )
    }

    @Test
    fun doesNotRevalidateAgainstAnEditionThatCouldNotBeCached() {
        val directory = files.newFolder()
        val brokenFolder = directory.resolve(APP)
        assertTrue(brokenFolder.createNewFile())
        val etags = mutableListOf<String?>()
        val repository = CatalogRepository(APP, directory, BASE_URL) { _, etag ->
            etags += etag
            CatalogRepository.Download(catalog("fr", "Updated"), "\"new\"")
        }

        assertEquals("Updated", repository.refresh("fr")?.string("heading"))
        assertNull(repository.cached("fr"))
        assertTrue(brokenFolder.delete())
        assertEquals("Updated", repository.refresh("fr")?.string("heading"))
        assertEquals("Updated", repository.cached("fr")?.string("heading"))
        assertEquals(listOf(null, null), etags)
    }

    @Test
    fun onlyAcceptsCanonicalLocaleTags() {
        listOf("fr", "zh-Hans", "en-CA", "sr-Latn-RS", "es-419", "fil").forEach {
            assertTrue(it, isCanonicalCatalogLocale(it))
        }
        listOf("und", "en-ca", "en_CA", "../fr", "fr/CA", "fr?x=y").forEach {
            assertFalse(it, isCanonicalCatalogLocale(it))
        }
    }

    @Test(expected = IllegalArgumentException::class)
    fun rejectsInsecureCatalogEndpoints() {
        CatalogRepository(APP, files.newFolder(), "http://devslab.kr/ota-locales/v1/$APP/")
    }

    private fun catalog(locale: String, value: String) =
        """{"schema":1,"app":"$APP","locale":"$locale","strings":{"heading":"$value"},"plurals":{}}"""
            .encodeToByteArray()

    private companion object {
        const val APP = "kr.devslab.authenticator"
        const val BASE_URL = "https://devslab.kr/ota-locales/v1/$APP/"
    }
}
