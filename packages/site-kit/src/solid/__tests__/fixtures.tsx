import type { LocaleState, SiteMessages } from "../types";

export const messages: SiteMessages = {
  navigationLabel: "Primary navigation",
  localeLabel: "Language",
  themeLabel: "Theme",
  themeSystem: "System",
  themeLight: "Light",
  themeDark: "Dark",
  menuOpen: "Open menu",
  menuClose: "Close menu",
  footerLabel: "Footer",
  skipToContent: "Skip to content",
  updatedLabel: "Updated",
  notFoundTitle: "Page not found",
  notFoundDescription: "The requested page does not exist.",
  backHome: "Back home",
  errorTitle: "Something went wrong",
  errorDescription: "Please try again.",
  retry: "Retry",
};

export const locale: LocaleState = {
  locale: "en",
  hrefForLocale: (next) => next === "en" ? "/" : `/${next}`,
};
