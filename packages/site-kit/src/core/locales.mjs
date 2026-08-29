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

const byLower = new Map(LOCALES.map((locale) => [locale.code.toLowerCase(), locale]));
const aliases = new Map([["zh", "zh-TW"], ["pt", "pt-BR"]]);

export function canonicalLocale(candidate) {
  if (!candidate) return undefined;
  const exact = byLower.get(String(candidate).trim().toLowerCase());
  if (exact) return exact.code;
  const base = String(candidate).trim().toLowerCase().split("-")[0];
  if (aliases.has(base)) return aliases.get(base);
  return byLower.get(base)?.code;
}

export function localeAttributes(locale) {
  const canonical = canonicalLocale(locale);
  if (!canonical) throw new RangeError(`Unsupported locale: ${locale}`);
  return { lang: canonical, dir: canonical === "ar" ? "rtl" : "ltr" };
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

function acceptedLocales(header) {
  return String(header ?? "").split(",").map((part, order) => {
    const [tag, ...parameters] = part.trim().split(";");
    const q = Number(parameters.find((parameter) => parameter.trim().startsWith("q="))?.split("=")[1] ?? 1);
    return { locale: canonicalLocale(tag), q: Number.isFinite(q) ? q : 0, order };
  }).filter(({ locale, q }) => locale && q > 0).sort((a, b) => b.q - a.q || a.order - b.order);
}

export function resolveLocale({ pathname = "/", cookie = "", acceptLanguage = "", defaultLocale }) {
  const routeLocale = canonicalLocale(pathname.split("/").filter(Boolean)[0]);
  if (routeLocale) return { locale: routeLocale, source: "route" };
  const storedLocale = canonicalLocale(cookieValue(cookie, "locale"));
  if (storedLocale) return { locale: storedLocale, source: "cookie" };
  const accepted = acceptedLocales(acceptLanguage)[0]?.locale;
  if (accepted) return { locale: accepted, source: "accept-language" };
  const fallback = canonicalLocale(defaultLocale);
  if (!fallback) throw new RangeError(`Unsupported default locale: ${defaultLocale}`);
  return { locale: fallback, source: "default" };
}
