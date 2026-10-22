import { For, Show, createSignal, createUniqueId, type JSX } from "solid-js";
import type { ConsoleNavGroup, ConsoleShellLabels } from "./console-shell";

export interface LeftNavProps {
  surface: string;
  activePath: string;
  nav: readonly ConsoleNavGroup[];
  labels: Pick<ConsoleShellLabels, "nav" | "badge">;
  expandedGroups?: readonly string[] | undefined;
  defaultExpandedGroups?: readonly string[] | undefined;
  onExpandedGroupsChange?: ((groupIds: string[]) => void) | undefined;
  onNavigate?: () => void;
}

/* An index route matches exactly; everything else matches by prefix. A caller
   that knows better passes `active` on the item. */
function isActive(
  activePath: string,
  href: string,
  explicit?: boolean,
): boolean {
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

export function LeftNav(props: LeftNavProps): JSX.Element {
  const [internalExpandedGroups, setInternalExpandedGroups] = createSignal<
    readonly string[]
  >(
    props.defaultExpandedGroups ??
      props.nav.flatMap((group, index) =>
        group.collapsible &&
        group.items.some((item) =>
          isActive(props.activePath, item.href, item.active),
        )
          ? [group.id ?? `group-${index}`]
          : [],
      ),
  );
  const expanded = () => props.expandedGroups ?? internalExpandedGroups();
  const toggleGroup = (groupId: string) => {
    const next = expanded().includes(groupId)
      ? expanded().filter((value) => value !== groupId)
      : [...expanded(), groupId];
    if (props.expandedGroups === undefined) setInternalExpandedGroups(next);
    props.onExpandedGroupsChange?.(next);
  };
  return (
    <nav class="dds-console-rail__nav" aria-label={props.labels.nav}>
      <For each={props.nav}>
        {(group, index) => {
          const groupId = `dds-console-group-${createUniqueId()}`;
          const itemsId = `${groupId}-items`;
          const stateId = () => group.id ?? `group-${index()}`;
          const isExpanded = () =>
            !group.collapsible || expanded().includes(stateId());
          return (
            <section
              class="dds-console-rail__group"
              aria-labelledby={groupId}
              data-collapsible={group.collapsible ? "true" : undefined}
            >
              <h2 id={groupId} class="dds-console-rail__group-label">
                <Show when={group.collapsible} fallback={group.label}>
                  <button
                    type="button"
                    class="dds-console-rail__group-toggle"
                    aria-expanded={isExpanded()}
                    aria-controls={itemsId}
                    onClick={() => toggleGroup(stateId())}
                  >
                    <span>{group.label}</span>
                    <span
                      class="dds-console-rail__chevron"
                      aria-hidden="true"
                    />
                  </button>
                </Show>
              </h2>
              <ul id={itemsId} hidden={!isExpanded()}>
                <For each={group.items}>
                  {(item) => (
                    <li>
                      <a
                        class="dds-console-rail__item"
                        data-nav={`${props.surface}.${item.id}`}
                        href={item.href}
                        aria-current={
                          isActive(props.activePath, item.href, item.active)
                            ? "page"
                            : undefined
                        }
                        onClick={() => props.onNavigate?.()}
                      >
                        <Show
                          when={item.icon != null}
                          fallback={<span>{item.label}</span>}
                        >
                          <span class="dds-console-rail__item-content">
                            <span
                              class="dds-console-rail__item-icon"
                              aria-hidden="true"
                            >
                              {item.icon}
                            </span>
                            <span>{item.label}</span>
                          </span>
                        </Show>
                        <Show when={item.badge !== undefined && item.badge > 0}>
                          <span
                            class="dds-console-rail__badge"
                            aria-label={fillBadgeLabel(
                              props.labels.badge,
                              item.badge!,
                            )}
                          >
                            {item.badge}
                          </span>
                        </Show>
                      </a>
                    </li>
                  )}
                </For>
              </ul>
            </section>
          );
        }}
      </For>
    </nav>
  );
}
