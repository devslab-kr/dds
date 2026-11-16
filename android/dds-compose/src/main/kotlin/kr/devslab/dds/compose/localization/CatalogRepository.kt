package kr.devslab.dds.compose.localization

import okhttp3.CookieJar
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.IOException
import java.io.InputStream
import java.net.URI
import java.nio.file.Files
import java.nio.file.StandardCopyOption.ATOMIC_MOVE
import java.nio.file.StandardCopyOption.REPLACE_EXISTING
import java.util.concurrent.TimeUnit
import java.util.Locale

internal class CatalogRepository(
    private val app: String,
    private val directory: File,
    catalogBaseUrl: String,
    private val download: (String, String?) -> Download?,
) {
    constructor(app: String, directory: File, catalogBaseUrl: String) :
        this(app, directory, catalogBaseUrl, ::fetch)

    private val baseUrl = URI(catalogBaseUrl)

    init {
        require(app.length <= 128 && APP_ID.matches(app)) { "Invalid OTA catalog app ID" }
        require(
            baseUrl.scheme == "https" && !baseUrl.host.isNullOrBlank() &&
                baseUrl.userInfo == null && baseUrl.rawQuery == null && baseUrl.rawFragment == null &&
                baseUrl.rawPath.endsWith('/'),
        ) { "OTA catalog base URL must be an HTTPS directory URL" }
    }

    private val etags = mutableMapOf<String, String>()

    /** Call from a worker thread. The host app supplies a locale from its supported list. */
    @Synchronized
    fun cached(locale: String): TranslationCatalog? {
        val file = cacheFile(locale)
        return try {
            file.inputStream().use { input -> input.readCatalog()?.let { TranslationCatalog.parse(it, app, locale) } }
        } catch (_: IOException) {
            null
        }
    }

    @Synchronized
    fun refresh(locale: String): TranslationCatalog? {
        val file = cacheFile(locale)
        val url = baseUrl.resolve("$locale.json").toASCIIString()
        val result = download(url, etags[locale]) ?: return null
        val catalog = TranslationCatalog.parse(result.bytes, app, locale) ?: return null
        if (save(file, result.bytes)) {
            result.etag?.let { etags[locale] = it } ?: etags.remove(locale)
        }
        return catalog
    }

    private fun cacheFile(locale: String): File {
        require(isCanonicalCatalogLocale(locale))
        return File(directory, "$app/$locale.json")
    }

    private fun save(file: File, bytes: ByteArray): Boolean =
        try {
            val parent = checkNotNull(file.parentFile).toPath()
            Files.createDirectories(parent)
            val pending = Files.createTempFile(parent, "catalog-", ".json")
            try {
                Files.write(pending, bytes)
                Files.move(pending, file.toPath(), ATOMIC_MOVE, REPLACE_EXISTING)
            } finally {
                Files.deleteIfExists(pending)
            }
            true
        } catch (_: IOException) {
            // A disk error leaves the previous catalog available.
            false
        }

    internal data class Download(val bytes: ByteArray, val etag: String?)

    private companion object {
        val APP_ID = Regex("[a-z][a-z0-9_]*(?:\\.[a-z][a-z0-9_]*)*")
        val HTTP = OkHttpClient.Builder()
            .cookieJar(CookieJar.NO_COOKIES)
            .followRedirects(false)
            .followSslRedirects(false)
            .retryOnConnectionFailure(false)
            .callTimeout(5, TimeUnit.SECONDS)
            .build()

        fun fetch(url: String, etag: String?): Download? {
            val request = Request.Builder().url(url)
                .header("Accept", "application/json")
                .header("Cache-Control", "no-cache")
                .header("User-Agent", "DevsLab-Translations/1")
            if (etag != null) request.header("If-None-Match", etag)
            return try {
                HTTP.newCall(request.build()).execute().use { response ->
                    if (response.code != 200) return null
                    val body = response.body
                    val mediaType = body.contentType()
                    if (mediaType?.type != "application" || mediaType.subtype != "json") return null
                    if (body.contentLength() > TranslationCatalog.MAX_BYTES) return null
                    val bytes = body.byteStream().readCatalog() ?: return null
                    val nextEtag = response.header("ETag")?.takeIf { value ->
                        value.length <= 200 && value.all { it in ' '..'~' }
                    }
                    Download(bytes, nextEtag)
                }
            } catch (_: IOException) {
                null
            }
        }

        fun InputStream.readCatalog(): ByteArray? {
            val result = ByteArrayOutputStream()
            val buffer = ByteArray(8_192)
            while (true) {
                val read = read(buffer)
                if (read < 0) return result.toByteArray()
                if (result.size() + read > TranslationCatalog.MAX_BYTES) return null
                result.write(buffer, 0, read)
            }
        }
    }
}

private val localeTagPattern = Regex("[A-Za-z0-9]{1,8}(?:-[A-Za-z0-9]{1,8})*")

internal fun isCanonicalCatalogLocale(tag: String): Boolean =
    tag.length <= 64 && tag != "und" && localeTagPattern.matches(tag) &&
        Locale.forLanguageTag(tag).toLanguageTag() == tag
