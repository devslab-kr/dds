package kr.devslab.dds.compose.localization

import android.content.Context
import android.content.res.Resources
import android.icu.text.PluralRules
import androidx.annotation.PluralsRes
import androidx.annotation.StringRes
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.getValue
import androidx.compose.ui.platform.LocalResources
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.repeatOnLifecycle
import java.io.File
import java.util.Locale
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

/**
 * Keeps a validated OTA translation catalog for the app's current locale.
 *
 * Create one instance per application. [localeTag] returns the app's canonical BCP 47 tag
 * or null to use bundled resources. [allowResource] filters resource entry names before
 * looking up remote overrides.
 */
public class OtaLocalization(
    context: Context,
    appId: String,
    private val localeTag: (Resources) -> String?,
    private val allowResource: (String) -> Boolean = { true },
    catalogBaseUrl: String = "https://devslab.kr/ota-locales/v1/$appId/",
) {
    private val resourcePackages = setOf(context.applicationContext.packageName, appId)
    private val repository = CatalogRepository(
        appId,
        File(context.applicationContext.noBackupFilesDir, "ota-locales"),
        catalogBaseUrl,
    )
    private val worker = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val sync = Mutex()
    private val requestLock = Any()
    private var currentRequest: Request? = null
    private val activeCatalog = MutableStateFlow<TranslationCatalog?>(null)
    internal val catalog = activeCatalog.asStateFlow()

    /** Loads the selected locale from cache, then revalidates it in the background. */
    public fun refresh(resources: Resources): Unit = refreshLocale(selectedLocale(resources))

    /** Reads a string from the active catalog or the same bundled Android resource. */
    public fun localizedString(resources: Resources, @StringRes id: Int, vararg args: Any): String =
        stringFrom(resources, activeCatalog.value, id, *args)

    /** Reads a plural from the active catalog or the same bundled Android resource. */
    public fun localizedPlural(
        resources: Resources,
        @PluralsRes id: Int,
        quantity: Int,
        vararg args: Any,
    ): String = pluralFrom(resources, activeCatalog.value, id, quantity, *args)

    internal fun selectedLocale(resources: Resources): String? =
        localeTag(resources)?.takeIf(::isCanonicalCatalogLocale)

    internal fun refreshLocale(tag: String?) {
        synchronized(requestLock) {
            val previous = currentRequest
            if (previous?.locale == tag && previous?.job?.isActive == true) return
            previous?.job?.cancel()
            if (tag == null) {
                currentRequest = null
                activeCatalog.value = null
                return
            }
            val request = Request(tag)
            currentRequest = request
            request.job = worker.launch {
                sync.withLock {
                    ensureActive()
                    if (activeCatalog.value?.locale != tag) publish(request, repository.cached(tag))
                    ensureActive()
                    repository.refresh(tag)?.let { publish(request, it) }
                }
            }
        }
    }

    internal fun stringFrom(
        resources: Resources,
        catalog: TranslationCatalog?,
        @StringRes id: Int,
        vararg args: Any,
    ): String {
        val bundled = resources.getString(id)
        val current = catalog?.takeIf { it.locale == selectedLocale(resources) }
        val name = current?.let { resourceName(resources, id) }
        if (current != null && name != null) {
            TranslationCatalog.format(
                current.string(name), bundled, formatLocale(resources, current), *args,
            )?.let { return it }
        }
        return if (args.isEmpty()) bundled else resources.getString(id, *args)
    }

    internal fun pluralFrom(
        resources: Resources,
        catalog: TranslationCatalog?,
        @PluralsRes id: Int,
        quantity: Int,
        vararg args: Any,
    ): String {
        val bundled = resources.getQuantityString(id, quantity)
        val current = catalog?.takeIf { it.locale == selectedLocale(resources) }
        val name = current?.let { resourceName(resources, id) }
        if (current != null && name != null) {
            val locale = formatLocale(resources, current)
            val category = PluralRules.forLocale(locale).select(quantity.toDouble())
            TranslationCatalog.format(current.plural(name, category), bundled, locale, *args)
                ?.let { return it }
        }
        return if (args.isEmpty()) bundled else resources.getQuantityString(id, quantity, *args)
    }

    private fun resourceName(resources: Resources, id: Int): String? {
        if (resources.getResourcePackageName(id) !in resourcePackages) return null
        return resources.getResourceEntryName(id).takeIf(allowResource)
    }

    private fun formatLocale(resources: Resources, catalog: TranslationCatalog): Locale =
        resources.configuration.locales[0] ?: Locale.forLanguageTag(catalog.locale)

    private fun publish(request: Request, catalog: TranslationCatalog?) {
        synchronized(requestLock) {
            if (currentRequest === request) activeCatalog.value = catalog
        }
    }

    private class Request(val locale: String) {
        var job: Job? = null
    }
}

private data class OtaLocalizationScope(
    val localization: OtaLocalization,
    val catalog: TranslationCatalog?,
)

private val LocalOtaLocalization = compositionLocalOf<OtaLocalizationScope?> { null }

/** Applies OTA lookups and revalidates on foreground entry and locale changes. */
@Composable
public fun ProvideOtaLocalization(
    localization: OtaLocalization,
    content: @Composable () -> Unit,
) {
    val resources = LocalResources.current
    val locale = localization.selectedLocale(resources)
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    val catalog by localization.catalog.collectAsStateWithLifecycle()
    LaunchedEffect(localization, lifecycle, locale) {
        lifecycle.repeatOnLifecycle(Lifecycle.State.STARTED) {
            localization.refreshLocale(locale)
        }
    }
    CompositionLocalProvider(
        LocalOtaLocalization provides OtaLocalizationScope(localization, catalog),
        content = content,
    )
}

/** Like [androidx.compose.ui.res.stringResource], with a verified OTA override when available. */
@Composable
public fun localizedString(@StringRes id: Int, vararg args: Any): String {
    val resources = LocalResources.current
    val ota = LocalOtaLocalization.current
    return when {
        ota != null -> ota.localization.stringFrom(resources, ota.catalog, id, *args)
        args.isEmpty() -> resources.getString(id)
        else -> resources.getString(id, *args)
    }
}

/** Like [androidx.compose.ui.res.pluralStringResource], with the same-resource OTA override. */
@Composable
public fun localizedPlural(@PluralsRes id: Int, quantity: Int, vararg args: Any): String {
    val resources = LocalResources.current
    val ota = LocalOtaLocalization.current
    return when {
        ota != null -> ota.localization.pluralFrom(resources, ota.catalog, id, quantity, *args)
        args.isEmpty() -> resources.getQuantityString(id, quantity)
        else -> resources.getQuantityString(id, quantity, *args)
    }
}
