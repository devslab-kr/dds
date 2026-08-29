import { Button, Icon, IconButton } from "@devslab-kr/dds-solid";
import { For, createSignal, onMount, type JSX } from "solid-js";

import { LOCALES, type SiteLocale } from "../core/locales.mjs";
import type { LocaleState, SiteBrand, SiteLink, SiteMessages, ThemePreference } from "./types";

export interface LocaleMenuProps {
  state: LocaleState;
  messages: SiteMessages;
  onLocaleChange?: (locale: SiteLocale, href: string) => void;
}

export function LocaleMenu(props: LocaleMenuProps) {
  return (
    <label>
      <span class="dds-sr-only">{props.messages.localeLabel}</span>
      <span class="dds-select site-locale">
        <select
          class="dds-select__input"
          value={props.state.locale}
          aria-label={props.messages.localeLabel}
          onChange={(event) => {
            const locale = event.currentTarget.value as SiteLocale;
            const href = props.state.hrefForLocale(locale);
            if (props.onLocaleChange) props.onLocaleChange(locale, href);
            else window.location.assign(href);
          }}
        >
          <For each={LOCALES}>{(locale) => <option value={locale.code} lang={locale.code} dir={locale.dir}>{locale.nativeName}</option>}</For>
        </select>
      </span>
    </label>
  );
}

export interface ThemeToggleProps {
  messages: SiteMessages;
  value?: ThemePreference;
  defaultValue?: ThemePreference;
  onValueChange?: (theme: ThemePreference) => void;
  storageKey?: string;
}

export function ThemeToggle(props: ThemeToggleProps) {
  const order: ThemePreference[] = ["system", "light", "dark"];
  const [internal, setInternal] = createSignal<ThemePreference>(props.defaultValue ?? "system");
  const [resolved, setResolved] = createSignal<"light" | "dark">("light");
  const value = () => props.value ?? internal();
  const nextTheme = () => resolved() === "dark" ? "light" : "dark";
  const nextLabel = () => nextTheme() === "dark" ? props.messages.themeDark : props.messages.themeLight;
  const apply = (theme: ThemePreference) => {
    const resolved = theme === "system"
      ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : theme;
    setResolved(resolved);
    document.documentElement.dataset.theme = resolved;
    document.documentElement.dataset.themePreference = theme;
  };
  const update = (theme: ThemePreference) => {
    if (props.value === undefined) setInternal(theme);
    props.onValueChange?.(theme);
    apply(theme);
    localStorage.setItem(props.storageKey ?? "site-theme", theme);
  };
  onMount(() => {
    const stored = localStorage.getItem(props.storageKey ?? "site-theme") as ThemePreference | null;
    if (props.value === undefined && stored && order.includes(stored)) setInternal(stored);
    apply(props.value ?? stored ?? internal());
  });
  return (
    <IconButton
      class="site-theme-toggle"
      tone="ghost"
      aria-label={`${props.messages.themeLabel}: ${nextLabel()}`}
      title={`${props.messages.themeLabel}: ${nextLabel()}`}
      onClick={() => update(nextTheme())}
    >
      <Icon
        class="site-theme-toggle__icon"
        name={nextTheme() === "dark" ? "site-moon" : "site-sun"}
        data-icon={nextTheme() === "dark" ? "site-moon" : "site-sun"}
        size={20}
      />
    </IconButton>
  );
}

export interface SiteHeaderProps {
  brand: SiteBrand;
  navigation: SiteLink[];
  locale: LocaleState;
  messages: SiteMessages;
  theme?: Omit<ThemeToggleProps, "messages">;
  onLocaleChange?: LocaleMenuProps["onLocaleChange"];
  actions?: JSX.Element;
}

export function SiteHeader(props: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = createSignal(false);
  return (
    <header class="site-header">
      <a class="dds-sr-only" href="#main-content">{props.messages.skipToContent}</a>
      <div class="site-header__inner">
        <a class="site-brand" href={props.brand.href}>{props.brand.logo}{props.brand.name}</a>
        <Button class="site-menu-button" tone="ghost" aria-expanded={menuOpen()} aria-controls="site-navigation" onClick={() => setMenuOpen((open) => !open)}>
          {menuOpen() ? props.messages.menuClose : props.messages.menuOpen}
        </Button>
        <nav id="site-navigation" class="site-nav" data-open={String(menuOpen())} aria-label={props.messages.navigationLabel}>
          <ul class="site-nav__list"><For each={props.navigation}>{(item) => <li><a href={item.href} target={item.external ? "_blank" : undefined} rel={item.external ? "noreferrer" : undefined}>{item.label}</a></li>}</For></ul>
        </nav>
        <div class="site-header__controls" data-open={String(menuOpen())}>
          <LocaleMenu
            state={props.locale}
            messages={props.messages}
            {...(props.onLocaleChange ? { onLocaleChange: props.onLocaleChange } : {})}
          />
          {props.theme && <ThemeToggle {...props.theme} messages={props.messages} />}
          {props.actions}
        </div>
      </div>
    </header>
  );
}

export interface SiteFooterProps {
  brand: SiteBrand;
  links: SiteLink[];
  copyright: string;
  messages: SiteMessages;
}

export function SiteFooter(props: SiteFooterProps) {
  return (
    <footer class="site-footer" aria-label={props.messages.footerLabel}>
      <div class="site-footer__inner">
        <strong>{props.brand.name}</strong>
        <ul class="site-footer__links"><For each={props.links}>{(item) => <li><a href={item.href}>{item.label}</a></li>}</For></ul>
        <small>{props.copyright}</small>
      </div>
    </footer>
  );
}
