import { Button, Icon, IconButton } from "@devslab/dds-solid";
import { For, Show, createMemo, createSignal, onMount, type JSX } from "solid-js";

import { LocaleMenu, type LocaleMenuProps, type LocaleMenuVariant } from "./locale-menu";
import { FAMILY_LOCALES, type LocaleRegistry, type SiteLocale } from "../core/locales.mjs";
import type { LocaleState, SiteBrand, SiteLink, SiteMessages, ThemePreference } from "./types";

export type { LocaleMenuProps };

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
  /**
   * The language picker's state. Omit it and no picker is rendered — a
   * single-language product (FM덴탈서비스 is Korean-only) has nothing to pick,
   * and a picker with one entry reads as broken. Same contract as the
   * footer's `locale`.
   */
  locale?: LocaleState;
  messages: SiteMessages;
  theme?: Omit<ThemeToggleProps, "messages">;
  onLocaleChange?: LocaleMenuProps["onLocaleChange"];
  localeVariant?: LocaleMenuVariant;
  /**
   * The languages the picker offers. Defaults to the family's fourteen;
   * pass the registry from `defineLocaleRegistry` if this product sells in
   * languages the family does not carry.
   */
  localeRegistry?: LocaleRegistry<string>;
  actions?: JSX.Element;
}

/** The emphasis class a `SiteLink` asks for, or none. */
const linkClass = (item: SiteLink) => (item.emphasis ? "site-link--emphasis" : undefined);

export function SiteHeader(props: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = createSignal(false);
  // brand={{ logo: <Mark /> }} compiles to a getter that rebuilds the logo on
  // every read; read it once (D-027).
  const brand = createMemo(() => props.brand);
  // The narrow-screen menu closes the way a menu is expected to. Escape closes
  // it and puts focus back on the button that opened it — unless a control
  // inside already used that Escape (the flag menu closes itself first and
  // marks the event handled, so one press closes one layer). Following a link
  // inside it closes it too: a same-page anchor ("#contact") scrolls the page
  // but leaves the document in place, and without this the open menu kept
  // covering the section the reader just asked for. Buttons (the theme toggle)
  // leave it open — the reader has not gone anywhere — and so does a link that
  // opens a new tab or window. Handlers on elements inside the header run
  // before this one (the flag menu); a modal inside it (a DDS Dialog listens on
  // the document, after this) owns its own Escape, so an Escape from inside an
  // aria-modal element is left alone too.
  const onKeyDown: JSX.EventHandler<HTMLElement, KeyboardEvent> = (event) => {
    if (event.key !== "Escape" || event.defaultPrevented || !menuOpen()) return;
    if ((event.target as Element | null)?.closest('[aria-modal="true"]')) return;
    event.preventDefault();
    setMenuOpen(false);
    event.currentTarget.querySelector<HTMLButtonElement>(".site-menu-button")?.focus();
  };
  const closeOnLink: JSX.EventHandler<HTMLElement, MouseEvent> = (event) => {
    const link = (event.target as Element | null)?.closest("a");
    if (!menuOpen() || !link) return;
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (link.target && link.target !== "_self") return;
    setMenuOpen(false);
  };
  return (
    <header class="site-header" onKeyDown={onKeyDown}>
      <a class="dds-sr-only" href="#main-content">{props.messages.skipToContent}</a>
      <div class="site-header__inner">
        <a class="site-brand" href={brand().href} aria-label={brand().label}>{brand().logo}{brand().name}</a>
        <Button class="site-menu-button" tone="ghost" aria-expanded={menuOpen()} aria-controls="site-navigation" onClick={() => setMenuOpen((open) => !open)}>
          {menuOpen() ? props.messages.menuClose : props.messages.menuOpen}
        </Button>
        <nav id="site-navigation" class="site-nav" data-open={String(menuOpen())} aria-label={props.messages.navigationLabel} onClick={closeOnLink}>
          <ul class="site-nav__list"><For each={props.navigation}>{(item) => <li><a class={linkClass(item)} href={item.href} target={item.external ? "_blank" : undefined} rel={item.external ? "noreferrer" : undefined}>{item.label}</a></li>}</For></ul>
        </nav>
        <div class="site-header__controls" data-open={String(menuOpen())} onClick={closeOnLink}>
          <Show when={props.locale}>{(locale) => (
            <LocaleMenu
              state={locale()}
              messages={props.messages}
              {...(props.localeVariant ? { variant: props.localeVariant } : {})}
              {...(props.localeRegistry ? { registry: props.localeRegistry } : {})}
              {...(props.onLocaleChange ? { onLocaleChange: props.onLocaleChange } : {})}
            />
          )}</Show>
          {props.theme && <ThemeToggle {...props.theme} messages={props.messages} />}
          {props.actions}
        </div>
      </div>
    </header>
  );
}

/**
 * The footer's language row, collapsed.
 *
 * It used to be every language laid out flat, which is a different length in
 * every product — ten for one, twenty for another — so the same footer carried
 * a different visual weight depending on how many languages the product sells
 * in. A `<details>` keeps all of them: the anchors are in the document whether
 * it is open or not, so a crawler still follows every locale, and it works with
 * no JavaScript. Same mechanism as the header's flag menu, including Escape
 * returning focus to the trigger.
 *
 * The trigger is the current language's own name rather than a translated word
 * for "language": it is the one label already meaningful to a reader who cannot
 * read the page, and it is what the flat row marked with `aria-current`.
 */
function FooterLocaleMenu(props: {
  state: LocaleState;
  registry: LocaleRegistry<string>;
  label: string;
  /* Required key, optional value: the caller always passes it through, and
     `exactOptionalPropertyTypes` rejects an explicit undefined on an optional. */
  onSelect: ((locale: string) => void) | undefined;
}) {
  let details: HTMLDetailsElement | undefined;
  let trigger: HTMLElement | undefined;
  const current = () => props.registry.LOCALES.find((entry) => entry.code === props.state.locale);
  const close = () => { if (details) details.open = false; };
  const onKeyDown: JSX.EventHandler<HTMLDetailsElement, KeyboardEvent> = (event) => {
    if (event.key !== "Escape" || !details?.open) return;
    event.preventDefault();
    close();
    trigger?.focus();
  };
  return (
    <nav class="site-footer__langs" aria-label={props.label}>
      <details ref={details} class="site-footer__langs-menu" onKeyDown={onKeyDown}>
        <summary ref={trigger} class="site-footer__langs-trigger" aria-label={`${props.label}: ${current()?.nativeName ?? props.state.locale}`}>
          <span lang={current()?.code} dir={current()?.dir}>{current()?.nativeName ?? props.state.locale}</span>
        </summary>
        <ul class="site-footer__langs-list" role="list">
          <For each={props.registry.LOCALES}>{(entry) => (
            <li>
              <a
                href={props.state.hrefForLocale(entry.code as SiteLocale)}
                hreflang={entry.code}
                lang={entry.code}
                dir={entry.dir}
                aria-current={entry.code === props.state.locale ? "page" : undefined}
                onClick={() => props.onSelect?.(entry.code)}
              >{entry.nativeName}</a>
            </li>
          )}</For>
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
  /**
   * The language row. Omit it and no row is rendered: a product whose header
   * already offers every language may not want a second copy of the list.
   */
  locale?: LocaleState;
  /** The languages the row lists. Defaults to the family's fourteen. */
  localeRegistry?: LocaleRegistry<string>;
  /**
   * Called with the code the reader picked, before the browser follows the
   * link — for a product that remembers the choice in a cookie.
   */
  onLocaleSelect?: (locale: string) => void;
  /** Links after the brand name, middot-separated: the family line, the operator. */
  family?: SiteLink[];
  /**
   * A block under the brand line: the business registration line and the
   * address a Korean commercial site must print, for one. Rendered as a block
   * (the brand line is an inline `<p>`, where an `<address>` cannot go), and
   * read once — JSX handed to the kit is built once per side (D-027, D-028).
   */
  details?: JSX.Element;
  /**
   * Names the link list: with it the list sits in `<nav aria-label>`, a
   * landmark a screen-reader user can jump to — name it differently from the
   * header's navigation. Without it the list stays a plain list.
   */
  linksLabel?: string;
}

/**
 * The family footer: a language row, then the brand beside its family links,
 * then the page's links and the copyright.
 *
 * Every product wrote this by hand. VisionLinq, BookLinq and TraceLinq each
 * carried their own copy with a comment saying the kit's footer "takes only a
 * flat link list; extending it is a dds release this page would then wait on" —
 * three copies and three notes naming the same missing release. Their CSS had
 * already converged byte-for-byte. This is that release.
 *
 * Additive: a caller that passes only brand/links/copyright/messages gets the
 * same single row it got before, plus its brand mark if it set one.
 */
export function SiteFooter(props: SiteFooterProps) {
  const registry = () => props.localeRegistry ?? (FAMILY_LOCALES as LocaleRegistry<string>);
  const brand = createMemo(() => props.brand);
  const details = createMemo(() => props.details);
  // Each of these is called in exactly one branch of its <Show>, so each
  // builds its nodes once.
  const brandLine = () => (
    <p class="site-footer__brand">
      {brand().logo}
      {/* A wordmark passed as the logo comes with `name: ""`; no empty <strong>. */}
      <Show when={brand().name}>{(name) => <strong>{name()}</strong>}</Show>
      <For each={props.family ?? []}>{(item) => <>
        <span aria-hidden="true">·</span>
        <a class={linkClass(item)} href={item.href}>{item.label}</a>
      </>}</For>
    </p>
  );
  const linkList = () => (
    <ul class="site-footer__links">
      <For each={props.links}>{(item) => <li><a class={linkClass(item)} href={item.href}>{item.label}</a></li>}</For>
      {/*
        A copyright like "© 2026 DevsLab" mixes neutral, digit and Latin
        runs, which the bidi algorithm reorders on an RTL page into
        "DevsLab 2026 ©". <bdi> isolates it so it reads as written in
        every direction.
      */}
      <li><Show when={props.copyrightHref} fallback={<bdi>{props.copyright}</bdi>}>
        {(href) => <a href={href()}><bdi>{props.copyright}</bdi></a>}
      </Show></li>
    </ul>
  );
  return (
    <footer class="site-footer" aria-label={props.messages.footerLabel}>
      <div class="site-footer__inner">
        <Show when={props.locale}>{(locale) => (
          <FooterLocaleMenu
            state={locale()}
            registry={registry()}
            label={props.messages.localeLabel}
            onSelect={props.onLocaleSelect}
          />
        )}</Show>
        <div class="site-footer__row">
          <Show when={details()} fallback={brandLine()}>{(content) => (
            <div class="site-footer__identity">
              {brandLine()}
              <div class="site-footer__details">{content()}</div>
            </div>
          )}</Show>
          <Show when={props.linksLabel} fallback={linkList()}>{(label) => (
            <nav class="site-footer__nav" aria-label={label()}>{linkList()}</nav>
          )}</Show>
        </div>
      </div>
    </footer>
  );
}
