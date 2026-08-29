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

export interface SiteLink { href: string; label: string; external?: boolean }
export interface SiteBrand { name: string; href: string; logo?: JSX.Element }
export interface LocaleState { locale: SiteLocale; hrefForLocale: (locale: SiteLocale) => string }
export type ThemePreference = "system" | "light" | "dark";
