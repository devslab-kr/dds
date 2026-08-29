export type SiteLocale = "ko" | "en" | "ja" | "zh-HK" | "zh-TW" | "hi" | "vi" | "id" | "th" | "pt-BR" | "fr" | "de" | "es" | "ar";
export type TextDirection = "ltr" | "rtl";
export interface LocaleDefinition { readonly code: SiteLocale; readonly language: string; readonly nativeName: string; readonly dir: TextDirection }
export declare const LOCALES: readonly LocaleDefinition[];
export declare function canonicalLocale(candidate: string | undefined | null): SiteLocale | undefined;
export declare function localeAttributes(locale: string): { lang: SiteLocale; dir: TextDirection };
export declare function resolveLocale(input: { pathname?: string; cookie?: string; acceptLanguage?: string; defaultLocale: SiteLocale }): { locale: SiteLocale; source: "route" | "cookie" | "accept-language" | "default" };
