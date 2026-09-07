import { For, createUniqueId, sharedConfig, type JSX } from "solid-js";

import { FAMILY_LOCALES, type LocaleRegistry, type SiteLocale } from "../core/locales.mjs";
import { FLAG_VIEWBOX, flagCountryFor } from "../core/flag-countries.mjs";
import { flagBodiesNow, loadFlagBodies, type FlagBodies } from "./flag-bodies";
import type { LocaleState, SiteMessages } from "./types";

export type LocaleMenuVariant = "select" | "flag";

export interface LocaleMenuProps {
  state: LocaleState;
  messages: SiteMessages;
  variant?: LocaleMenuVariant;
  onLocaleChange?: (locale: SiteLocale, href: string) => void;
  /**
   * The languages to offer. Defaults to the family's fourteen; a product
   * that added its own passes the registry it built with
   * `defineLocaleRegistry`.
   */
  registry?: LocaleRegistry<string>;
}

function scopeFlagIds(body: string, uid: string): string {
  const ids = [...body.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]!);
  if (ids.length === 0) return body;
  let scoped = body;
  for (const id of ids) {
    const suffixed = `${id}-${uid}`;
    scoped = scoped
      .replaceAll(`id="${id}"`, `id="${suffixed}"`)
      .replaceAll(`href="#${id}"`, `href="#${suffixed}"`)
      .replaceAll(`url(#${id})`, `url(#${suffixed})`);
  }
  return scoped;
}

const registryOf = (props: LocaleMenuProps) => props.registry ?? (FAMILY_LOCALES as LocaleRegistry<string>);

const symbolId = (country: string, uid: string) => `site-flag-${country}-${uid}`;

function spriteMarkup(countries: readonly string[], bodies: FlagBodies, uid: string): string {
  return countries.map((country) => {
    const flag = bodies[country];
    if (!flag) throw new RangeError(`No vendored flag for country: ${country}`);
    return `<symbol id="${symbolId(country, uid)}" viewBox="${flag.viewBox}">${scopeFlagIds(flag.body, uid)}</symbol>`;
  }).join("");
}

/**
 * One copy of each flag the menu shows, as <symbol>s the flags <use>.
 *
 * The trigger and the current row used to inline the same body twice, and
 * the browser bundle carried every body so a client render could write
 * them. With a sprite, a locale change on the client only swaps an href,
 * so after hydration the browser never needs the artwork: the server build
 * writes it (flagBodiesNow), hydration adopts it untouched, and only a
 * render with no server HTML — a client-only app, a jsdom test — fetches
 * the bodies through loadFlagBodies, which the browser build emits as its
 * own chunk. Zero-sized rather than display:none so the referenced clip
 * paths and gradients still resolve.
 */
function FlagSprite(props: { countries: readonly string[]; uid: string }) {
  const bodies = flagBodiesNow();
  if (bodies) {
    return <svg class="site-flag-sprite" aria-hidden="true" innerHTML={spriteMarkup(props.countries, bodies, props.uid)} />;
  }
  return (
    <svg
      class="site-flag-sprite"
      aria-hidden="true"
      ref={(element) => {
        if (sharedConfig.context) return; // hydrating: the server already drew the sprite
        void loadFlagBodies().then((loaded) => { element.innerHTML = spriteMarkup(props.countries, loaded, props.uid); });
      }}
    />
  );
}

function Flag(props: { locale: string; class?: string; registry: LocaleRegistry<string>; uid: string }) {
  const country = () => flagCountryFor(props.locale, props.registry);
  return (
    <svg class={props.class} viewBox={FLAG_VIEWBOX} aria-hidden="true">
      <use href={`#${symbolId(country(), props.uid)}`} />
    </svg>
  );
}

function SelectLocaleMenu(props: LocaleMenuProps) {
  const registry = () => registryOf(props);
  return (
    <label>
      <span class="dds-sr-only">{props.messages.localeLabel}</span>
      <span class="dds-select site-locale">
        <select
          class="dds-select__input"
          aria-label={props.messages.localeLabel}
          onChange={(event) => {
            const locale = event.currentTarget.value as SiteLocale;
            const href = props.state.hrefForLocale(locale);
            if (props.onLocaleChange) props.onLocaleChange(locale, href);
            else window.location.assign(href);
          }}
        >
          {/*
            `selected` on the option, not `value` on the select.
            <select> has no `value` content attribute — it exists only as a
            DOM property — so under SSR, where the markup is a string,
            `value={...}` serialised to an attribute the browser ignores and
            every visitor got option[0] as their "current" language
            regardless of the page they were reading. Touching the control
            then switched them to that first language. `selected` is a real
            content attribute and survives the trip through HTML.
          */}
          <For each={registry().LOCALES}>{(locale) => (
            <option value={locale.code} lang={locale.code} dir={locale.dir} selected={locale.code === props.state.locale}>
              {locale.nativeName}
            </option>
          )}</For>
        </select>
      </span>
    </label>
  );
}

function FlagLocaleMenu(props: LocaleMenuProps) {
  let details: HTMLDetailsElement | undefined;
  let trigger: HTMLElement | undefined;
  const uid = createUniqueId();
  const registry = () => registryOf(props);
  const countries = () => [...new Set(registry().LOCALES.map((entry) => flagCountryFor(entry.code, registry())))];
  const current = () => registry().LOCALES.find((entry) => entry.code === props.state.locale);
  const close = () => { if (details) details.open = false; };
  const onKeyDown: JSX.EventHandler<HTMLDetailsElement, KeyboardEvent> = (event) => {
    if (event.key !== "Escape" || !details?.open) return;
    event.preventDefault();
    close();
    trigger?.focus();
  };
  const triggerLabel = () => {
    const name = current()?.nativeName;
    return name ? `${props.messages.localeLabel}: ${name}` : props.messages.localeLabel;
  };
  return (
    <details ref={details} class="site-locale-flag" onKeyDown={onKeyDown}>
      <summary ref={trigger} class="site-locale-flag__trigger" aria-label={triggerLabel()} title={props.messages.localeLabel}>
        <FlagSprite countries={countries()} uid={uid} />
        <Flag locale={props.state.locale} class="site-locale-flag__svg" registry={registry()} uid={uid} />
      </summary>
      <ul class="site-locale-flag__list" role="list">
        <For each={registry().LOCALES}>{(entry) => (
          <li>
            <a
              class="site-locale-flag__option"
              href={props.state.hrefForLocale(entry.code as SiteLocale)}
              lang={entry.code}
              hreflang={entry.code}
              dir={entry.dir}
              aria-current={entry.code === props.state.locale ? "true" : undefined}
              onClick={(event) => {
                if (!props.onLocaleChange) return;
                event.preventDefault();
                close();
                props.onLocaleChange(entry.code as SiteLocale, props.state.hrefForLocale(entry.code as SiteLocale));
              }}
            >
              <Flag locale={entry.code} class="site-locale-flag__svg" registry={registry()} uid={uid} />
              <span>{entry.nativeName}</span>
            </a>
          </li>
        )}</For>
      </ul>
    </details>
  );
}

export function LocaleMenu(props: LocaleMenuProps) {
  return props.variant === "flag" ? <FlagLocaleMenu {...props} /> : <SelectLocaleMenu {...props} />;
}
