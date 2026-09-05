import { For, createUniqueId, type JSX } from "solid-js";

import { FAMILY_LOCALES, type LocaleRegistry, type SiteLocale } from "../core/locales.mjs";
import { flagFor } from "../core/flags.mjs";
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

function Flag(props: { locale: string; class?: string; registry: LocaleRegistry<string> }) {
  const uid = createUniqueId();
  const flag = () => flagFor(props.locale, props.registry);
  return (
    <svg
      class={props.class}
      viewBox={flag().viewBox}
      aria-hidden="true"
      innerHTML={scopeFlagIds(flag().body, uid)}
    />
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
  const registry = () => registryOf(props);
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
        <Flag locale={props.state.locale} class="site-locale-flag__svg" registry={registry()} />
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
              <Flag locale={entry.code} class="site-locale-flag__svg" registry={registry()} />
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
