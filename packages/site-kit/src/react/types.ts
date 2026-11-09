import type { ReactNode } from "react";
import type { LocaleRegistry, SiteLocale } from "@devslab/site-kit";

/**
 * The React side of `@devslab/site-kit`: the same props as `./solid`, with
 * `ReactNode` where Solid takes `JSX.Element`. The strings, the links and the
 * locale state are one contract across both, so a product can move between the
 * two without rewriting its catalog.
 */
export interface SiteMessages {
  navigationLabel: string;
  localeLabel: string;
  themeLabel: string;
  themeSystem: string;
  themeLight: string;
  themeDark: string;
  menuOpen: string;
  menuClose: string;
  footerLabel: string;
  skipToContent: string;
  updatedLabel: string;
  notFoundTitle: string;
  notFoundDescription: string;
  backHome: string;
  errorTitle: string;
  errorDescription: string;
  retry: string;
}

export interface SiteLink {
  href: string;
  label: string;
  external?: boolean;
  /**
   * Drawn heavier than its neighbours. For a link the product must make easy
   * to find — a Korean site's 개인정보처리방침 (privacy policy), which the law
   * asks to stand out from the other footer links.
   */
  emphasis?: boolean;
}

export interface SiteBrand {
  name: string;
  href: string;
  /**
   * Any node: a mark, or a mark and a localized wordmark side by side
   * (Qooroo prints "쿠루" next to its logo in Korean, "クル" in Japanese). A
   * product whose wordmark is its logo passes it here with `name: ""` and
   * names the link with `label`.
   */
  logo?: ReactNode;
  /**
   * The header brand link's accessible name, when the visible name is not
   * enough ("Acme home"). Start it with the visible name so voice users can
   * say what they see.
   */
  label?: string;
}

/**
 * Where each language's copy of this page lives.
 *
 * `hrefForLocale` is the Solid contract. In React it works from a Client
 * Component; a Server Component cannot hand a function to the client chrome
 * (functions do not cross the server/client boundary), so it passes the
 * same answers as data instead — `hrefs`, built with `localeHrefs` on the
 * server. Exactly one of the two.
 */
export type LocaleState =
  | { locale: SiteLocale; hrefForLocale: (locale: SiteLocale) => string; hrefs?: never }
  | { locale: SiteLocale; hrefs: Readonly<Record<string, string>>; hrefForLocale?: never };

export type ThemePreference = "system" | "light" | "dark";

/**
 * The languages a menu lists. A registry from `defineLocaleRegistry` is one;
 * so is `{ LOCALES: registry.LOCALES }` — the form a Server Component passes,
 * because a registry's methods cannot cross to the client chrome and its
 * `LOCALES` (frozen plain objects) can. The chrome reads nothing else.
 */
export type LocaleList = Pick<LocaleRegistry<string>, "LOCALES">;
