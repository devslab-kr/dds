import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import type { LocaleRegistry, SiteLocale } from "@devslab/site-kit";
import { FAMILY_LOCALES } from "../core/locales.mjs";
import { FLAG_VIEWBOX, flagCountryFor } from "../core/flag-countries.mjs";
import { flagBodiesNow, loadFlagBodies, type FlagBodies } from "./flag-bodies";
import { hrefFor } from "./locale-state";
import type { LocaleList, LocaleState, SiteMessages } from "./types";

export type LocaleMenuVariant = "select" | "flag";

/**
 * A standalone language picker — the one SiteHeader composes, and the one a
 * footer or an app screen (a settings page) renders on its own. It reads one
 * string, so a screen outside the marketing chrome does not need the whole
 * SiteMessages catalog.
 */
export interface LocaleMenuProps {
  state: LocaleState;
  messages: Pick<SiteMessages, "localeLabel">;
  variant?: LocaleMenuVariant;
  onLocaleChange?: (locale: SiteLocale, href: string) => void;
  /**
   * The languages to offer. Defaults to the family's fourteen; a product that
   * sells in fewer (or more) passes the registry it built with
   * `defineLocaleRegistry` — or, from a Server Component, its
   * `{ LOCALES: registry.LOCALES }` (see LocaleList).
   */
  registry?: LocaleList;
}

const registryOf = (props: LocaleMenuProps): LocaleList => props.registry ?? FAMILY_LOCALES;

// flagCountryFor reads only `LOCALES` (its JSDoc says so); its generated
// declaration names the whole registry type.
const countryOf = (locale: string, registry: LocaleList) => flagCountryFor(locale, registry as LocaleRegistry<string>);

/**
 * `useId` is the one id the server and the client agree on. Its punctuation
 * («r0», :r0:, _r_0_ depending on the React version) is stripped so the id is
 * safe inside `url(#…)`, a fragment and a CSS selector; what is left is still
 * unique per menu.
 */
const useMenuUid = () => `rx${useId().replace(/[^A-Za-z0-9_-]/g, "")}`;

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

const symbolId = (country: string, uid: string) => `site-flag-${country}-${uid}`;

function spriteMarkup(countries: readonly string[], bodies: FlagBodies, uid: string): string {
  return countries.map((country) => {
    const flag = bodies[country];
    if (!flag) throw new RangeError(`No vendored flag for country: ${country}`);
    return `<symbol id="${symbolId(country, uid)}" viewBox="${flag.viewBox}">${scopeFlagIds(flag.body, uid)}</symbol>`;
  }).join("");
}

/**
 * One copy of each flag the menu shows, as <symbol>s the flags <use> (D-020).
 *
 * The server build has the bodies and writes the sprite into the HTML. The
 * browser build does not have them, so on hydration it takes the sprite's
 * markup from the element the server wrote — the same string React then
 * compares, so nothing is patched and nothing is warned about. Only a render
 * with no server HTML (a client-only app, a jsdom test) finds no sprite and
 * fetches the bodies through `loadFlagBodies`, which is its own chunk.
 *
 * Whether the server wrote it is decided by looking at the element, not by
 * guessing whether this is a hydration — the lesson the Solid side learned
 * when a drifted hydration recreated an empty sprite (D-027).
 */
function FlagSprite({ countries, uid }: { countries: readonly string[]; uid: string }) {
  const countriesKey = countries.join(",");
  const [markup, setMarkup] = useState<string | null>(() => {
    const bodies = flagBodiesNow();
    if (bodies) return spriteMarkup(countries, bodies, uid);
    if (typeof document === "undefined") return null;
    const written = document.querySelector(`svg.site-flag-sprite[data-flag-sprite="${uid}"]`);
    return written && written.childElementCount > 0 ? written.innerHTML : null;
  });
  useEffect(() => {
    if (markup !== null) return;
    let live = true;
    void loadFlagBodies().then((loaded) => {
      if (live) setMarkup(spriteMarkup(countries, loaded, uid));
    });
    return () => { live = false; };
    // countries is compared by its contents, not its identity.
  }, [markup, countriesKey, uid]);
  return (
    <svg
      className="site-flag-sprite"
      aria-hidden="true"
      data-flag-sprite={uid}
      {...(markup === null ? {} : { dangerouslySetInnerHTML: { __html: markup } })}
    />
  );
}

function Flag({ locale, className, registry, uid }: { locale: string; className?: string; registry: LocaleList; uid: string }) {
  const country = countryOf(locale, registry);
  return (
    <svg className={className} viewBox={FLAG_VIEWBOX} aria-hidden="true">
      <use href={`#${symbolId(country, uid)}`} />
    </svg>
  );
}

function SelectLocaleMenu(props: LocaleMenuProps) {
  const registry = registryOf(props);
  return (
    <label>
      <span className="dds-sr-only">{props.messages.localeLabel}</span>
      <span className="dds-select site-locale">
        <select
          className="dds-select__input"
          aria-label={props.messages.localeLabel}
          // React writes `selected` on the matching <option> in server HTML,
          // which is what the browser reads; a bare `value` attribute on
          // <select> is ignored (the Solid side learned this on a deployed worker).
          value={props.state.locale}
          onChange={(event) => {
            const locale = event.currentTarget.value as SiteLocale;
            const href = hrefFor(props.state, locale);
            if (props.onLocaleChange) props.onLocaleChange(locale, href);
            else window.location.assign(href);
          }}
        >
          {registry.LOCALES.map((locale) => (
            <option key={locale.code} value={locale.code} lang={locale.code} dir={locale.dir}>
              {locale.nativeName}
            </option>
          ))}
        </select>
      </span>
    </label>
  );
}

function FlagLocaleMenu(props: LocaleMenuProps) {
  const details = useRef<HTMLDetailsElement>(null);
  const trigger = useRef<HTMLElement>(null);
  const uid = useMenuUid();
  const registry = registryOf(props);
  const countries = [...new Set(registry.LOCALES.map((entry) => countryOf(entry.code, registry)))];
  const current = registry.LOCALES.find((entry) => entry.code === props.state.locale);
  const close = () => { if (details.current) details.current.open = false; };
  const onKeyDown = (event: KeyboardEvent<HTMLDetailsElement>) => {
    if (event.key !== "Escape" || !details.current?.open) return;
    event.preventDefault();
    close();
    trigger.current?.focus();
  };
  const name = current?.nativeName;
  const triggerLabel = name ? `${props.messages.localeLabel}: ${name}` : props.messages.localeLabel;
  return (
    <details ref={details} className="site-locale-flag" onKeyDown={onKeyDown}>
      <summary ref={trigger} className="site-locale-flag__trigger" aria-label={triggerLabel} title={props.messages.localeLabel}>
        <FlagSprite countries={countries} uid={uid} />
        <Flag locale={props.state.locale} className="site-locale-flag__svg" registry={registry} uid={uid} />
      </summary>
      <ul className="site-locale-flag__list" role="list">
        {registry.LOCALES.map((entry) => {
          const href = hrefFor(props.state, entry.code);
          return (
            <li key={entry.code}>
              <a
                className="site-locale-flag__option"
                href={href}
                lang={entry.code}
                hrefLang={entry.code}
                dir={entry.dir}
                aria-current={entry.code === props.state.locale ? "true" : undefined}
                onClick={(event) => {
                  if (!props.onLocaleChange) return;
                  event.preventDefault();
                  close();
                  props.onLocaleChange(entry.code as SiteLocale, href);
                }}
              >
                <Flag locale={entry.code} className="site-locale-flag__svg" registry={registry} uid={uid} />
                <span>{entry.nativeName}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </details>
  );
}

export function LocaleMenu(props: LocaleMenuProps) {
  return props.variant === "flag" ? <FlagLocaleMenu {...props} /> : <SelectLocaleMenu {...props} />;
}
