import { For, createUniqueId, type JSX } from "solid-js";

import { LOCALES, type SiteLocale } from "../core/locales.mjs";
import { flagFor } from "../core/flags.mjs";
import type { LocaleState, SiteMessages } from "./types";

export type LocaleMenuVariant = "select" | "flag";

export interface LocaleMenuProps {
  state: LocaleState;
  messages: SiteMessages;
  variant?: LocaleMenuVariant;
  onLocaleChange?: (locale: SiteLocale, href: string) => void;
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

function Flag(props: { locale: SiteLocale; class?: string }) {
  const uid = createUniqueId();
  const flag = () => flagFor(props.locale);
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

function FlagLocaleMenu(props: LocaleMenuProps) {
  let details: HTMLDetailsElement | undefined;
  let trigger: HTMLElement | undefined;
  const current = () => LOCALES.find((entry) => entry.code === props.state.locale)!;
  const close = () => { if (details) details.open = false; };
  const onKeyDown: JSX.EventHandler<HTMLDetailsElement, KeyboardEvent> = (event) => {
    if (event.key !== "Escape" || !details?.open) return;
    event.preventDefault();
    close();
    trigger?.focus();
  };
  return (
    <details ref={details} class="site-locale-flag" onKeyDown={onKeyDown}>
      <summary ref={trigger} class="site-locale-flag__trigger" aria-label={`${props.messages.localeLabel}: ${current().nativeName}`} title={props.messages.localeLabel}>
        <Flag locale={props.state.locale} class="site-locale-flag__svg" />
      </summary>
      <ul class="site-locale-flag__list" role="list">
        <For each={LOCALES}>{(entry) => (
          <li>
            <a
              class="site-locale-flag__option"
              href={props.state.hrefForLocale(entry.code)}
              lang={entry.code}
              hreflang={entry.code}
              dir={entry.dir}
              aria-current={entry.code === props.state.locale ? "true" : undefined}
              onClick={(event) => {
                if (!props.onLocaleChange) return;
                event.preventDefault();
                close();
                props.onLocaleChange(entry.code, props.state.hrefForLocale(entry.code));
              }}
            >
              <Flag locale={entry.code} class="site-locale-flag__svg" />
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
