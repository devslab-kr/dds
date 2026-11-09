import type { SiteLocale } from "@devslab/site-kit";
import type { LocaleState } from "./types";

/**
 * The href of one language's copy of the page, from either form of the state.
 *
 * A `hrefs` map that lacks a language the menu lists throws instead of
 * rendering `href="undefined"`: a broken language link that still looks like
 * one is worse than a page that fails where the map was built.
 */
export function hrefFor(state: LocaleState, locale: string): string {
  if (state.hrefForLocale) return state.hrefForLocale(locale as SiteLocale);
  const href = state.hrefs?.[locale];
  if (typeof href !== "string") {
    throw new RangeError(`LocaleState.hrefs has no href for locale: ${locale}`);
  }
  return href;
}
