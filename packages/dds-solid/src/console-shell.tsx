import { For, Show, createSignal, createUniqueId, onCleanup, onMount, type JSX } from "solid-js";

/** One item in a nav group's list. `active` is a caller override — pass it
 * only when the generic prefix rule below gets a route wrong. "Index route"
 * in that rule means an `href` exactly one path segment deep (e.g.
 * `/dashboard`); a console mounted under a path prefix (so its own root is
 * two or more segments deep) should pass `active` explicitly on that item
 * rather than rely on the generic rule. */
export interface ConsoleNavItem {
  id: string;
  href: string;
  label: string;
  badge?: number;
  active?: boolean;
}

export interface ConsoleNavGroup {
  label: string;
  items: readonly ConsoleNavItem[];
}

export interface ConsoleShellLabels {
  skip: string;
  menuOpen: string;
  menuClose: string;
  /** Accessible name for the rail's `<nav>` landmark (e.g. "Dashboard
   * navigation"). Required, not optional: a console page also has the
   * DataTable's pagination `<nav>` (named via its own `labels.nextPage`),
   * and an unnamed landmark next to a named one is a regression a
   * screen-reader user would notice immediately — the rail is the primary
   * nav, so it must never be the anonymous one. */
  nav: string;
  /** Badge accessible name template. `{count}` is substituted with the
   * item's pending count — DDS supplies no words of its own. */
  badge: string;
}

export interface ConsoleHeader {
  eyebrow?: string;
  title: string;
  actions?: JSX.Element;
}

export interface ConsoleShellProps {
  surface: string;
  activePath: string;
  brand: { href: string; name: string; mark: string };
  /** Lines pinned under the brand — a product's organization, environment,
   * or role context. */
  context?: readonly { label: string; value: string }[];
  nav: readonly ConsoleNavGroup[];
  labels: ConsoleShellLabels;
  header: ConsoleHeader;
  /** Slot for the rail's bottom — DDS must not depend on site-kit, so a
   * theme toggle, locale picker, or sign-out form all arrive as children
   * the product renders itself. */
  foot?: JSX.Element;
  children: JSX.Element;
}

/* An index route matches exactly; everything else matches by prefix. A caller
   that knows better passes `active` on the item. */
function isActive(activePath: string, href: string, explicit?: boolean): boolean {
  if (explicit !== undefined) return explicit;
  const segments = href.split("/").filter(Boolean);
  if (segments.length <= 1) return activePath === href;
  return activePath === href || activePath.startsWith(`${href}/`);
}

/** Fills the `{count}` placeholder in a consumer-supplied badge label
 *  template. A function replacer, not `template.replace("{count}", value)`
 *  — a string replacement value is subject to special
 *  `$&`/`$$`/`` $` ``/`$'` patterns. `count` is always a plain digit string
 *  today, so this is defensive rather than a live bug, but it is the same
 *  class of mistake as dds-table's analogous `sortBy` label fix — no
 *  shared helper between the two packages (see that fix's note). */
function fillBadgeLabel(template: string, count: number): string {
  return template.replace("{count}", () => String(count));
}

export function ConsoleShell(props: ConsoleShellProps): JSX.Element {
  const [open, setOpen] = createSignal(false);
  const close = () => setOpen(false);
  // Delegated listeners (the rail toggle's onClick among them) attach once
  // Solid finishes hydrating; this flips only then, so a harness can wait
  // for the same readiness signal a real click depends on instead of
  // guessing with a retry. onMount never runs during SSR, so this listener
  // is never attached — and this attribute never rendered — on the server.
  const [hydrated, setHydrated] = createSignal(false);
  onMount(() => {
    setHydrated(true);
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    onCleanup(() => document.removeEventListener("keydown", onKey));
  });

  return (
    <div class="dds-console-shell" data-surface={props.surface} data-hydrated={hydrated() ? "true" : undefined}>
      <a class="dds-console-skip dds-visually-hidden" href="#dds-console-main">{props.labels.skip}</a>
      <button
        class="dds-console-rail__toggle"
        type="button"
        data-action="toggle-rail"
        aria-controls="dds-console-rail"
        aria-expanded={open()}
        onClick={() => setOpen(!open())}
      >
        <span aria-hidden="true" />
        <span class="dds-visually-hidden">{open() ? props.labels.menuClose : props.labels.menuOpen}</span>
      </button>
      <div class="dds-console-rail__scrim" data-open={open() ? "true" : "false"} onClick={close} />
      <aside id="dds-console-rail" class="dds-console-rail" data-open={open() ? "true" : "false"}>
        {/* No aria-label here: the decorative img (alt="") contributes
            nothing to the accessible name, so it resolves to the visible
            "{brand.name}" text alone — the original concatenated a
            hardcoded English word ("home") onto this, which is exactly the
            kind of copy this package must not author itself. */}
        <a class="dds-console-rail__brand" href={props.brand.href}>
          <img src={props.brand.mark} alt="" width="20" height="20" />
          <strong>{props.brand.name}</strong>
        </a>
        <Show when={props.context && props.context.length > 0}>
          <dl class="dds-console-rail__context">
            <For each={props.context}>{(row) => <div><dt>{row.label}</dt><dd>{row.value}</dd></div>}</For>
          </dl>
        </Show>
        <nav class="dds-console-rail__nav" aria-label={props.labels.nav}>
          <For each={props.nav}>{(group) => {
            const groupId = `dds-console-group-${createUniqueId()}`;
            return (
              <section class="dds-console-rail__group" aria-labelledby={groupId}>
                <h2 id={groupId} class="dds-console-rail__group-label">{group.label}</h2>
                <ul>
                  <For each={group.items}>{(item) => (
                    <li>
                      <a
                        class="dds-console-rail__item"
                        data-nav={`${props.surface}.${item.id}`}
                        href={item.href}
                        aria-current={isActive(props.activePath, item.href, item.active) ? "page" : undefined}
                        onClick={close}
                      >
                        <span>{item.label}</span>
                        <Show when={item.badge !== undefined && item.badge > 0}>
                          <span class="dds-console-rail__badge" aria-label={fillBadgeLabel(props.labels.badge, item.badge!)}>{item.badge}</span>
                        </Show>
                      </a>
                    </li>
                  )}</For>
                </ul>
              </section>
            );
          }}</For>
        </nav>
        <Show when={props.foot}>
          <div class="dds-console-rail__foot">{props.foot}</div>
        </Show>
      </aside>
      <main id="dds-console-main" class="dds-console-main" tabIndex={-1}>
        <header class="dds-console-page-header">
          <div class="dds-console-page-header__text">
            <Show when={props.header.eyebrow}>
              <p class="dds-console-page-eyebrow">{props.header.eyebrow}</p>
            </Show>
            <h1>{props.header.title}</h1>
          </div>
          <Show when={props.header.actions}>
            <div class="dds-console-page-header__actions">{props.header.actions}</div>
          </Show>
        </header>
        {props.children}
      </main>
    </div>
  );
}
