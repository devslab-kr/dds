export type SiteLocale = "ko" | "en" | "ja" | "zh-HK" | "zh-TW" | "hi" | "vi" | "id" | "th" | "pt-BR" | "fr" | "de" | "es" | "ar";
export type LocaleCode = SiteLocale;
export type TextDirection = "ltr" | "rtl";
export interface LocaleDefinition { readonly code: SiteLocale; readonly language: string; readonly nativeName: string; readonly dir: TextDirection }

/**
 * A locale a product sells in that the family does not. `flagCountry` must
 * name a country this package already vendors a flag for — `FLAG_COUNTRY`
 * in ./flags.mjs is the list.
 */
export interface ExtraLocaleDefinition<Code extends string = string> {
  readonly code: Code;
  readonly language: string;
  readonly nativeName: string;
  readonly dir: TextDirection;
  readonly flagCountry: string;
}

export interface LocaleRegistry<Code extends string = SiteLocale> {
  readonly LOCALES: readonly (LocaleDefinition | ExtraLocaleDefinition<Code>)[];
  canonicalLocale(candidate: string | undefined | null): Code | undefined;
  localeAttributes(locale: string): { lang: Code; dir: TextDirection };
  resolveLocale(input: { pathname?: string; cookie?: string; acceptLanguage?: string; defaultLocale: Code }): { locale: Code; source: "route" | "cookie" | "accept-language" | "default" };
  definitionFor(locale: string): LocaleDefinition | ExtraLocaleDefinition<Code>;
}

export declare const LOCALES: readonly LocaleDefinition[];

/**
 * Build a registry of the family locales plus a product's own. Every
 * locale-aware helper in this package accepts one; the bare exports below
 * are the family registry, so not calling this changes nothing.
 */
export declare function defineLocaleRegistry<Extra extends string = never>(options?: {
  only?: ReadonlyArray<LocaleCode>;
  extra?: readonly ExtraLocaleDefinition<Extra>[];
  aliases?: readonly (readonly [string, SiteLocale | Extra])[];
}): LocaleRegistry<SiteLocale | Extra>;

export declare const FAMILY_LOCALES: LocaleRegistry<SiteLocale>;
export declare function canonicalLocale(candidate: string | undefined | null): SiteLocale | undefined;
export declare function localeAttributes(locale: string): { lang: SiteLocale; dir: TextDirection };
export declare function resolveLocale(input: { pathname?: string; cookie?: string; acceptLanguage?: string; defaultLocale: SiteLocale }): { locale: SiteLocale; source: "route" | "cookie" | "accept-language" | "default" };
