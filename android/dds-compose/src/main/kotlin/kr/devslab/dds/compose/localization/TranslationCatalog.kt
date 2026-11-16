package kr.devslab.dds.compose.localization

import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.intOrNull
import java.nio.charset.CharacterCodingException
import java.util.Locale

internal class TranslationCatalog private constructor(
    val locale: String,
    private val strings: JsonObject,
    private val plurals: JsonObject,
) {
    fun string(name: String): String? = strings[name].text()

    fun plural(name: String, category: String): String? {
        val choices = plurals[name] as? JsonObject ?: return null
        return choices[category].text() ?: choices["other"].text()
    }

    companion object {
        internal const val MAX_BYTES = 256 * 1024
        private const val MAX_TRANSLATION_LENGTH = 2_000
        private val formatToken = Regex("""%%|%[1-9][0-9]*\$[a-zA-Z]|%""")
        private val namedToken = Regex("""\{[A-Za-z][A-Za-z0-9_]*}""")

        internal fun parse(bytes: ByteArray, app: String, locale: String): TranslationCatalog? {
            if (bytes.size > MAX_BYTES) return null
            val text = try {
                bytes.decodeToString(throwOnInvalidSequence = true)
            } catch (_: CharacterCodingException) {
                return null
            }
            if (!hasBoundedNesting(text)) return null
            val data = try {
                Json.parseToJsonElement(text) as? JsonObject ?: return null
            } catch (_: SerializationException) {
                return null
            }
            val schema = data["schema"] as? JsonPrimitive ?: return null
            if (schema.isString || schema.intOrNull != 1) return null
            if (data["app"].text() != app || data["locale"].text() != locale) return null
            val strings = data["strings"] as? JsonObject ?: return null
            val plurals = data["plurals"] as? JsonObject ?: return null
            if (strings.values.any { it.text() == null }) return null
            if (plurals.values.any { choices ->
                    choices !is JsonObject || choices["other"].text() == null ||
                        choices.values.any { it.text() == null }
                }) return null
            return TranslationCatalog(locale, strings, plurals)
        }

        fun format(translation: String?, bundled: String, locale: Locale, vararg args: Any): String? {
            if (translation.isNullOrBlank() || translation.length > MAX_TRANSLATION_LENGTH) return null
            if (namedArguments(translation) != namedArguments(bundled)) return null
            val translatedTokens = arguments(translation)
            if (args.isEmpty()) {
                val bundledTokens = arguments(bundled)
                return translation.takeIf {
                    translatedTokens.filterNot { token -> token == "%" } ==
                        bundledTokens.filterNot { token -> token == "%" }
                }
            }
            if ("%" in translatedTokens || translatedTokens != arguments(bundled)) return null
            return try {
                String.format(locale, translation, *args)
            } catch (_: IllegalArgumentException) {
                null
            }
        }

        private fun arguments(template: String) =
            formatToken.findAll(template).map { it.value }.filter { it != "%%" }.sorted().toList()

        private fun namedArguments(template: String) =
            namedToken.findAll(template).map { it.value }.sorted().toList()

        private fun hasBoundedNesting(text: String): Boolean {
            var depth = 0
            var quoted = false
            var escaped = false
            for (char in text) {
                if (quoted) {
                    if (!escaped && char == '"') quoted = false
                    escaped = !escaped && char == '\\'
                } else {
                    when (char) {
                        '"' -> quoted = true
                        '{', '[' -> if (++depth > 4) return false
                        '}', ']' -> if (--depth < 0) return false
                    }
                }
            }
            return depth == 0 && !quoted
        }
    }
}

private fun kotlinx.serialization.json.JsonElement?.text(): String? =
    (this as? JsonPrimitive)?.takeIf { it.isString }?.content
