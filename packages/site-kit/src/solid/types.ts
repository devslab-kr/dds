import type { JSX } from "solid-js";
import type { SiteLocale } from "../core/locales.mjs";

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
   * Drawn heavier than its neighbours. For a link the product must make
   * easy to find — a Korean site's 개인정보처리방침 (privacy policy), which
   * the law asks to stand out from the other footer links.
   */
  emphasis?: boolean;
}
export interface SiteBrand {
  name: string;
  href: string;
  logo?: JSX.Element;
  /**
   * The header brand link's accessible name, when the visible name is not
   * enough ("Acme home"). Start it with the visible name so voice users can
   * say what they see. A product whose wordmark is its logo passes the mark
   * as `logo` and `name: ""` — the name would otherwise print twice — and
   * names the link here.
   */
  label?: string;
}
export interface LocaleState { locale: SiteLocale; hrefForLocale: (locale: SiteLocale) => string }
export type ThemePreference = "system" | "light" | "dark";
