import type { SiteLocale } from "./locales.mjs";
export type MessageCatalog = Record<string, string>;
export declare class CatalogValidationError extends Error { readonly issues: readonly string[] }
export declare function validateCatalogs(catalogs: Record<SiteLocale, MessageCatalog>, referenceLocale: SiteLocale): true;
export declare function createTranslator(catalog: MessageCatalog, locale: SiteLocale): (key: string, values?: Record<string, string | number>) => string;
