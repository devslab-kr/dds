import type { LocaleRegistry, SiteLocale } from "./locales.mjs";
export type MessageCatalog = Record<string, string>;
export declare class CatalogValidationError extends Error { readonly issues: readonly string[] }
export declare function validateCatalogs<Code extends string = SiteLocale>(
  catalogs: Record<Code, MessageCatalog>,
  referenceLocale: Code,
  options?: { registry?: LocaleRegistry<Code> },
): true;
export declare function createTranslator(catalog: MessageCatalog, locale: string): (key: string, values?: Record<string, string | number>) => string;
