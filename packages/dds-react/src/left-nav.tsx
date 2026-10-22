import { useId, useState, type ReactNode } from "react";
export interface ConsoleNavItem {
  id: string;
  href: string;
  label: string;
  /** Decorative icon; the label supplies the accessible name. */
  icon?: ReactNode;
  badge?: number;
  active?: boolean;
}
export interface ConsoleNavGroup {
  /** Stable key for expansion state. Falls back to the group index. */
  id?: string;
  /** Opt in to a disclosure button; legacy groups remain expanded. */
  collapsible?: boolean;
  label: string;
  items: readonly ConsoleNavItem[];
}
export interface LeftNavProps {
  surface: string;
  activePath: string;
  nav: readonly ConsoleNavGroup[];
  labels: { nav: string; badge: string };
  expandedGroups?: readonly string[];
  defaultExpandedGroups?: readonly string[];
  onExpandedGroupsChange?: (groupIds: string[]) => void;
  onNavigate?: () => void;
}
function isActive(path: string, item: ConsoleNavItem) {
  return (
    item.active ??
    (item.href.split("/").filter(Boolean).length <= 1
      ? path === item.href
      : path === item.href || path.startsWith(`${item.href}/`))
  );
}
export function LeftNav({
  surface,
  activePath,
  nav,
  labels,
  expandedGroups,
  defaultExpandedGroups,
  onExpandedGroupsChange,
  onNavigate,
}: LeftNavProps) {
  const id = useId();
  const [internalExpandedGroups, setInternalExpandedGroups] = useState<
    readonly string[]
  >(
    () =>
      defaultExpandedGroups ??
      nav.flatMap((group, index) =>
        group.collapsible &&
        group.items.some((item) => isActive(activePath, item))
          ? [group.id ?? `group-${index}`]
          : [],
      ),
  );
  const expanded = expandedGroups ?? internalExpandedGroups;
  function toggleGroup(groupId: string) {
    const next = expanded.includes(groupId)
      ? expanded.filter((value) => value !== groupId)
      : [...expanded, groupId];
    if (expandedGroups === undefined) setInternalExpandedGroups(next);
    onExpandedGroupsChange?.(next);
  }
  return (
    <nav className="dds-console-rail__nav" aria-label={labels.nav}>
      {nav.map((group, index) => (
        <section
          key={group.id ?? index}
          data-collapsible={group.collapsible ? "true" : undefined}
          className="dds-console-rail__group"
          aria-labelledby={`${id}-group-${index}`}
        >
          <h2
            id={`${id}-group-${index}`}
            className="dds-console-rail__group-label"
          >
            {group.collapsible ? (
              <button
                type="button"
                className="dds-console-rail__group-toggle"
                aria-expanded={expanded.includes(group.id ?? `group-${index}`)}
                aria-controls={`${id}-group-items-${index}`}
                onClick={() => toggleGroup(group.id ?? `group-${index}`)}
              >
                <span>{group.label}</span>
                <span
                  className="dds-console-rail__chevron"
                  aria-hidden="true"
                />
              </button>
            ) : (
              group.label
            )}
          </h2>
          <ul
            id={`${id}-group-items-${index}`}
            hidden={
              group.collapsible &&
              !expanded.includes(group.id ?? `group-${index}`)
            }
          >
            {group.items.map((item) => (
              <li key={item.id}>
                <a
                  className="dds-console-rail__item"
                  data-nav={`${surface}.${item.id}`}
                  href={item.href}
                  aria-current={isActive(activePath, item) ? "page" : undefined}
                  onClick={onNavigate}
                >
                  {item.icon != null ? (
                    <span className="dds-console-rail__item-content">
                      <span
                        className="dds-console-rail__item-icon"
                        aria-hidden="true"
                      >
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </span>
                  ) : (
                    <span>{item.label}</span>
                  )}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className="dds-console-rail__badge"
                      aria-label={labels.badge.replace("{count}", () =>
                        String(item.badge),
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  );
}
