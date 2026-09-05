export const LOCALES = Object.freeze([
  { code: "ko", language: "Korean", nativeName: "한국어", dir: "ltr" },
  { code: "en", language: "English", nativeName: "English", dir: "ltr" },
  { code: "ja", language: "Japanese", nativeName: "日本語", dir: "ltr" },
  { code: "zh-HK", language: "Chinese (Hong Kong)", nativeName: "繁體中文（香港）", dir: "ltr" },
  { code: "zh-TW", language: "Chinese (Taiwan)", nativeName: "繁體中文（台灣）", dir: "ltr" },
  { code: "hi", language: "Hindi", nativeName: "हिन्दी", dir: "ltr" },
  { code: "vi", language: "Vietnamese", nativeName: "Tiếng Việt", dir: "ltr" },
  { code: "id", language: "Indonesian", nativeName: "Bahasa Indonesia", dir: "ltr" },
  { code: "th", language: "Thai", nativeName: "ไทย", dir: "ltr" },
  { code: "pt-BR", language: "Portuguese (Brazil)", nativeName: "Português (Brasil)", dir: "ltr" },
  { code: "fr", language: "French", nativeName: "Français", dir: "ltr" },
  { code: "de", language: "German", nativeName: "Deutsch", dir: "ltr" },
  { code: "es", language: "Spanish", nativeName: "Español", dir: "ltr" },
  { code: "ar", language: "Arabic", nativeName: "العربية", dir: "rtl" },
]);

const FAMILY_ALIASES = Object.freeze([["zh", "zh-TW"], ["pt", "pt-BR"]]);

/**
 * The languages a site actually sells in.
 *
 * The list above is the family's — what devslab.kr markets in, and the
 * floor every product gets for free. It is not every product's list.
 * BookLinq sells to salons in India and its assistant already answers in
 * Tamil, Telugu, Bengali, Marathi, Gujarati and Kannada. Those are not
 * family languages and are not going to become family languages: putting
 * them in the list above would hand AskLinq and devslab.kr six entries
 * they have no copy for. But a BookLinq page that cannot render them is a
 * page that lies about what the product does.
 *
 * So the family owns the mechanism and the product names its own nouns. A
 * registry is the family list plus whatever a product adds, and every
 * locale-aware helper here can be bound to one. The bare exports at the
 * bottom are the family registry, so a consumer that never calls this
 * sees exactly what it saw before.
 *
 * An extra locale carries the same fields as a family one plus
 * `flagCountry`, naming a flag this package already vendors (`FLAG_COUNTRY`
 * lists them). Products do not ship SVG: flag data is licensed, generated
 * and security-scanned here, and seven Indian languages share one flag
 * anyway.
 *
 * @param {{ only?: ReadonlyArray<string>, extra?: ReadonlyArray<object>, aliases?: ReadonlyArray<[string, string]> }} [options]
 */
export function defineLocaleRegistry(options = {}) {
  const extra = options.extra ?? [];
  // `only` — the product sells in a subset of the family's languages. The
  // subset keeps the family's order (the picker order is a family decision)
  // and is applied before `extra`, so a product may still add its own.
  let family = LOCALES;
  if (options.only !== undefined) {
    if (options.only.length === 0) throw new RangeError("`only` needs at least one locale — a registry with none is a bug, not a choice");
    const wanted = new Set(options.only);
    for (const code of wanted) {
      if (!LOCALES.some((locale) => locale.code === code)) throw new RangeError(`${code} is not a family locale — \`only\` selects from the family list; use \`extra\` for a product's own`);
    }
    family = Object.freeze(LOCALES.filter((locale) => wanted.has(locale.code)));
  }
  const seen = new Set(family.map(({ code }) => code));
  for (const locale of extra) {
    if (!locale?.code) throw new TypeError("every extra locale needs a code");
    if (LOCALES.some((known) => known.code === locale.code)) {
      throw new RangeError(`${locale.code} is already a family locale — remove it from \`extra\``);
    }
    if (seen.has(locale.code)) {
      throw new RangeError(`${locale.code} appears twice in \`extra\``);
    }
    if (!locale.nativeName) throw new TypeError(`${locale.code} needs a nativeName — it is what the picker shows`);
    if (locale.dir !== "ltr" && locale.dir !== "rtl") throw new RangeError(`${locale.code} needs dir "ltr" or "rtl"`);
    seen.add(locale.code);
  }

  const locales = Object.freeze([...family, ...extra.map((locale) => Object.freeze({ ...locale }))]);
  const byLower = new Map(locales.map((locale) => [locale.code.toLowerCase(), locale]));
  const aliases = new Map([...FAMILY_ALIASES, ...(options.aliases ?? [])]);

  function canonicalLocale(candidate) {
    if (!candidate) return undefined;
    const exact = byLower.get(String(candidate).trim().toLowerCase());
    if (exact) return exact.code;
    const base = String(candidate).trim().toLowerCase().split("-")[0];
    if (aliases.has(base)) { const target = aliases.get(base); return byLower.has(target.toLowerCase()) ? target : undefined; }
    return byLower.get(base)?.code;
  }

  function definitionFor(locale) {
    const canonical = canonicalLocale(locale);
    if (!canonical) throw new RangeError(`Unsupported locale: ${locale}`);
    return byLower.get(canonical.toLowerCase());
  }

  function localeAttributes(locale) {
    const definition = definitionFor(locale);
    // `dir` comes off the definition rather than a test for Arabic. The
    // old form read `canonical === "ar" ? "rtl" : "ltr"`, which was right
    // only while Arabic stayed the family's one RTL language — a product
    // adding Urdu or Hebrew would have had it rendered left-to-right with
    // every test still green.
    return { lang: definition.code, dir: definition.dir };
  }

  function resolveLocale({ pathname = "/", cookie = "", acceptLanguage = "", defaultLocale }) {
    const routeLocale = canonicalLocale(pathname.split("/").filter(Boolean)[0]);
    if (routeLocale) return { locale: routeLocale, source: "route" };
    const storedLocale = canonicalLocale(cookieValue(cookie, "locale"));
    if (storedLocale) return { locale: storedLocale, source: "cookie" };
    const accepted = acceptedLocales(acceptLanguage, canonicalLocale)[0]?.locale;
    if (accepted) return { locale: accepted, source: "accept-language" };
    const fallback = canonicalLocale(defaultLocale);
    if (!fallback) throw new RangeError(`Unsupported default locale: ${defaultLocale}`);
    return { locale: fallback, source: "default" };
  }

  return Object.freeze({ LOCALES: locales, canonicalLocale, localeAttributes, resolveLocale, definitionFor });
}

function cookieValue(header, name) {
  for (const part of String(header ?? "").split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() === name) {
      try { return decodeURIComponent(part.slice(separator + 1).trim()); }
      catch { return undefined; }
    }
  }
  return undefined;
}

function acceptedLocales(header, canonicalLocale) {
  return String(header ?? "").split(",").map((part, order) => {
    const [tag, ...parameters] = part.trim().split(";");
    const q = Number(parameters.find((parameter) => parameter.trim().startsWith("q="))?.split("=")[1] ?? 1);
    return { locale: canonicalLocale(tag), q: Number.isFinite(q) ? q : 0, order };
  }).filter(({ locale, q }) => locale && q > 0).sort((a, b) => b.q - a.q || a.order - b.order);
}

/** The family registry — what every helper in this package uses by default. */
export const FAMILY_LOCALES = defineLocaleRegistry();

export const { canonicalLocale, localeAttributes, resolveLocale } = FAMILY_LOCALES;
