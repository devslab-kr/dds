import { Fragment, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";

import { LocaleMenu, type LocaleMenuProps, type LocaleMenuVariant } from "./locale-menu";
import { ConsentSettingsButton } from "./consent";
import { hrefFor } from "./locale-state";
import { Button, Icon, IconButton } from "./primitives";
import type { ConsentManager } from "@devslab/site-kit";
import { FAMILY_LOCALES } from "../core/locales.mjs";
import type { LocaleList, LocaleState, SiteBrand, SiteLink, SiteMessages, ThemePreference } from "./types";

export type { LocaleMenuProps };

export interface ThemeToggleProps {
  messages: SiteMessages;
  value?: ThemePreference;
  defaultValue?: ThemePreference;
  onValueChange?: (theme: ThemePreference) => void;
  storageKey?: string;
}

const THEMES: ThemePreference[] = ["system", "light", "dark"];

/**
 * Two states on screen, three in storage — the Solid ThemeToggle, line for
 * line. The server cannot know the visitor's theme, so the first render (on
 * the server and in hydration) always shows the "switch to dark" icon; the
 * stored preference is applied after mount, which is the same moment on both
 * sides and so cannot drift.
 */
export function ThemeToggle(props: ThemeToggleProps) {
  const storageKey = props.storageKey ?? "site-theme";
  const [internal, setInternal] = useState<ThemePreference>(props.defaultValue ?? "system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");
  const nextTheme = resolved === "dark" ? "light" : "dark";
  const nextLabel = nextTheme === "dark" ? props.messages.themeDark : props.messages.themeLight;
  const apply = (theme: ThemePreference) => {
    const next = theme === "system"
      ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : theme;
    setResolved(next);
    document.documentElement.dataset.theme = next;
    document.documentElement.dataset.themePreference = theme;
  };
  const update = (theme: ThemePreference) => {
    if (props.value === undefined) setInternal(theme);
    props.onValueChange?.(theme);
    apply(theme);
    localStorage.setItem(storageKey, theme);
  };
  useEffect(() => {
    const stored = localStorage.getItem(storageKey) as ThemePreference | null;
    const known = stored && THEMES.includes(stored) ? stored : null;
    if (props.value === undefined && known) setInternal(known);
    apply(props.value ?? known ?? internal);
    // Applied once, on mount — the Solid onMount. Later changes go through update().
  }, []);
  const icon = nextTheme === "dark" ? "site-moon" : "site-sun";
  return (
    <IconButton
      className="site-theme-toggle"
      tone="ghost"
      aria-label={`${props.messages.themeLabel}: ${nextLabel}`}
      title={`${props.messages.themeLabel}: ${nextLabel}`}
      onClick={() => update(nextTheme)}
    >
      <Icon className="site-theme-toggle__icon" name={icon} data-icon={icon} size={20} />
    </IconButton>
  );
}

export interface SiteHeaderProps {
  brand: SiteBrand;
  navigation: SiteLink[];
  /**
   * The language picker's state. Omit it and no picker is rendered — a
   * single-language product has nothing to pick, and a picker with one entry
   * reads as broken.
   */
  locale?: LocaleState;
  messages: SiteMessages;
  theme?: Omit<ThemeToggleProps, "messages">;
  onLocaleChange?: LocaleMenuProps["onLocaleChange"];
  localeVariant?: LocaleMenuVariant;
  /** The languages the picker offers. Defaults to the family's fourteen. See LocaleList. */
  localeRegistry?: LocaleList;
  actions?: ReactNode;
}

/** The emphasis class a `SiteLink` asks for, or none. */
const linkClass = (item: SiteLink) => (item.emphasis ? "site-link--emphasis" : undefined);

export function SiteHeader(props: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  // The narrow-screen menu closes the way a menu is expected to (D-029).
  // Escape closes it and puts focus back on the button that opened it —
  // unless a control inside already used that Escape (the flag menu closes
  // itself first and marks the event handled, so one press closes one layer),
  // or it came from inside a modal, which owns its own Escape. Following a link
  // inside it closes it too: a same-page anchor ("#contact") scrolls the page
  // but leaves the document in place, and the open menu would keep covering
  // the section just asked for. Buttons (the theme toggle) leave it open, and
  // so does a link that opens a new tab or window, or one clicked with a
  // modifier key.
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Escape" || event.defaultPrevented || !menuOpen) return;
    if ((event.target as Element | null)?.closest('[aria-modal="true"]')) return;
    event.preventDefault();
    setMenuOpen(false);
    event.currentTarget.querySelector<HTMLButtonElement>(".site-menu-button")?.focus();
  };
  const closeOnLink = (event: MouseEvent<HTMLElement>) => {
    const link = (event.target as Element | null)?.closest("a");
    if (!menuOpen || !link) return;
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (link.target && link.target !== "_self") return;
    setMenuOpen(false);
  };
  const open = String(menuOpen);
  return (
    <header className="site-header" onKeyDown={onKeyDown}>
      <a className="dds-sr-only" href="#main-content">{props.messages.skipToContent}</a>
      <div className="site-header__inner">
        <a className="site-brand" href={props.brand.href} aria-label={props.brand.label}>{props.brand.logo}{props.brand.name}</a>
        <Button className="site-menu-button" tone="ghost" aria-expanded={menuOpen} aria-controls="site-navigation" onClick={() => setMenuOpen((value) => !value)}>
          {menuOpen ? props.messages.menuClose : props.messages.menuOpen}
        </Button>
        <nav id="site-navigation" className="site-nav" data-open={open} aria-label={props.messages.navigationLabel} onClick={closeOnLink}>
          <ul className="site-nav__list">
            {props.navigation.map((item) => (
              <li key={item.href}>
                <a className={linkClass(item)} href={item.href} target={item.external ? "_blank" : undefined} rel={item.external ? "noreferrer" : undefined}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="site-header__controls" data-open={open} onClick={closeOnLink}>
          {props.locale && (
            <LocaleMenu
              state={props.locale}
              messages={props.messages}
              {...(props.localeVariant ? { variant: props.localeVariant } : {})}
              {...(props.localeRegistry ? { registry: props.localeRegistry } : {})}
              {...(props.onLocaleChange ? { onLocaleChange: props.onLocaleChange } : {})}
            />
          )}
          {props.theme && <ThemeToggle {...props.theme} messages={props.messages} />}
          {props.actions}
        </div>
      </div>
    </header>
  );
}

/**
 * The footer's language row, collapsed behind the current language's own
 * name — every anchor stays in the document, so a crawler follows them all and
 * the row works with no JavaScript. Escape returns focus to the trigger.
 */
function FooterLocaleMenu(props: {
  state: LocaleState;
  registry: LocaleList;
  label: string;
  onSelect: ((locale: string) => void) | undefined;
}) {
  const details = useRef<HTMLDetailsElement>(null);
  const trigger = useRef<HTMLElement>(null);
  const current = props.registry.LOCALES.find((entry) => entry.code === props.state.locale);
  const onKeyDown = (event: KeyboardEvent<HTMLDetailsElement>) => {
    if (event.key !== "Escape" || !details.current?.open) return;
    event.preventDefault();
    details.current.open = false;
    trigger.current?.focus();
  };
  const name = current?.nativeName ?? props.state.locale;
  return (
    <nav className="site-footer__langs" aria-label={props.label}>
      <details ref={details} className="site-footer__langs-menu" onKeyDown={onKeyDown}>
        <summary ref={trigger} className="site-footer__langs-trigger" aria-label={`${props.label}: ${name}`}>
          <span lang={current?.code} dir={current?.dir}>{name}</span>
        </summary>
        <ul className="site-footer__langs-list" role="list">
          {props.registry.LOCALES.map((entry) => (
            <li key={entry.code}>
              <a
                href={hrefFor(props.state, entry.code)}
                hrefLang={entry.code}
                lang={entry.code}
                dir={entry.dir}
                aria-current={entry.code === props.state.locale ? "page" : undefined}
                onClick={() => props.onSelect?.(entry.code)}
              >{entry.nativeName}</a>
            </li>
          ))}
        </ul>
      </details>
    </nav>
  );
}

export interface SiteFooterProps {
  brand: SiteBrand;
  links: SiteLink[];
  copyright: string;
  /** Wraps the copyright in a link — the family site, usually. */
  copyrightHref?: string;
  messages: SiteMessages;
  /** The language row. Omit it and no row is rendered. */
  locale?: LocaleState;
  /** The languages the row lists. Defaults to the family's fourteen. See LocaleList. */
  localeRegistry?: LocaleList;
  /** Called with the picked code before the browser follows the link. */
  onLocaleSelect?: (locale: string) => void;
  /** Links after the brand name, middot-separated: the family line, the operator. */
  family?: SiteLink[];
  /** A block under the brand line: business registration, address. */
  details?: ReactNode;
  /** Names the link list as its own `<nav>` landmark. Without it, a plain list. */
  linksLabel?: string;
  /** A "쿠키 설정" button that re-opens the consent settings (D-034). */
  consentSettings?: { controller: ConsentManager; label: string };
}

/** The family footer: a language row, then the brand and its family links, then the page's links and the copyright. */
export function SiteFooter(props: SiteFooterProps) {
  const registry: LocaleList = props.localeRegistry ?? FAMILY_LOCALES;
  const brandLine = (
    <p className="site-footer__brand">
      {props.brand.logo}
      {/* A wordmark passed as the logo comes with `name: ""`; no empty <strong>. */}
      {props.brand.name ? <strong>{props.brand.name}</strong> : null}
      {(props.family ?? []).map((item) => (
        <Fragment key={item.href}>
          <span aria-hidden="true">·</span>
          <a className={linkClass(item)} href={item.href}>{item.label}</a>
        </Fragment>
      ))}
    </p>
  );
  const linkList = (
    <ul className="site-footer__links">
      {props.links.map((item) => <li key={item.href}><a className={linkClass(item)} href={item.href}>{item.label}</a></li>)}
      {props.consentSettings && (
        <li><ConsentSettingsButton controller={props.consentSettings.controller}>{props.consentSettings.label}</ConsentSettingsButton></li>
      )}
      {/* <bdi> keeps "© 2026 DevsLab" in writing order on an RTL page. */}
      <li>{props.copyrightHref ? <a href={props.copyrightHref}><bdi>{props.copyright}</bdi></a> : <bdi>{props.copyright}</bdi>}</li>
    </ul>
  );
  return (
    <footer className="site-footer" aria-label={props.messages.footerLabel}>
      <div className="site-footer__inner">
        {props.locale && (
          <FooterLocaleMenu state={props.locale} registry={registry} label={props.messages.localeLabel} onSelect={props.onLocaleSelect} />
        )}
        <div className="site-footer__row">
          {props.details
            ? (
              <div className="site-footer__identity">
                {brandLine}
                <div className="site-footer__details">{props.details}</div>
              </div>
            )
            : brandLine}
          {props.linksLabel ? <nav className="site-footer__nav" aria-label={props.linksLabel}>{linkList}</nav> : linkList}
        </div>
      </div>
    </footer>
  );
}
