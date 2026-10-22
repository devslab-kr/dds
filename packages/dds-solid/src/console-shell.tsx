import { For, Show, type JSX } from "solid-js";
import { LeftNav } from "./left-nav";
import { Layout } from "./layout";
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
  /** Decorative icon; the label supplies the accessible name. */
  icon?: JSX.Element;
  badge?: number;
  active?: boolean;
}

export interface ConsoleNavGroup {
  /** Stable key for expansion state. Falls back to `group-${index}`. */
  id?: string;
  /** Opt in to a disclosure button; legacy groups remain expanded. */
  collapsible?: boolean;
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
  nav?: readonly ConsoleNavGroup[];
  /** Custom menu content, such as a separately composed LeftNav. */
  navigation?: JSX.Element;
  expandedGroups?: readonly string[] | undefined;
  defaultExpandedGroups?: readonly string[] | undefined;
  onExpandedGroupsChange?: ((groupIds: string[]) => void) | undefined;
  labels: ConsoleShellLabels;
  header: ConsoleHeader;
  /** Slot for the rail's bottom — DDS must not depend on site-kit, so a
   * theme toggle, locale picker, or sign-out form all arrive as children
   * the product renders itself. */
  foot?: JSX.Element;
  children: JSX.Element;
}

export function ConsoleShell(props: ConsoleShellProps): JSX.Element {
  return (
    <Layout
      labels={props.labels}
      surface={props.surface}
      railStart={
        <>
          <a class="dds-console-rail__brand" href={props.brand.href}>
            <img src={props.brand.mark} alt="" width="20" height="20" />
            <strong>{props.brand.name}</strong>
          </a>
          <Show when={props.context && props.context.length > 0}>
            <dl class="dds-console-rail__context">
              <For each={props.context}>
                {(row) => (
                  <div>
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                )}
              </For>
            </dl>
          </Show>
        </>
      }
      navigation={
        props.navigation ?? (
          <LeftNav
            surface={props.surface}
            activePath={props.activePath}
            nav={props.nav ?? []}
            labels={props.labels}
            expandedGroups={props.expandedGroups}
            defaultExpandedGroups={props.defaultExpandedGroups}
            onExpandedGroupsChange={props.onExpandedGroupsChange}
          />
        )
      }
      railEnd={
        props.foot && <div class="dds-console-rail__foot">{props.foot}</div>
      }
      header={
        <div class="dds-console-page-header">
          <div class="dds-console-page-header__text">
            <Show when={props.header.eyebrow}>
              <p class="dds-console-page-eyebrow">{props.header.eyebrow}</p>
            </Show>
            <h1>{props.header.title}</h1>
          </div>
          <Show when={props.header.actions}>
            <div class="dds-console-page-header__actions">
              {props.header.actions}
            </div>
          </Show>
        </div>
      }
    >
      {props.children}
    </Layout>
  );
}
