import {
  forwardRef,
  useEffect,
  useId,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { classes } from "./controls";
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
export interface ConsoleShellLabels {
  skip: string;
  menuOpen: string;
  menuClose: string;
  nav: string;
  badge: string;
}
export interface ConsoleHeader {
  eyebrow?: string;
  title: string;
  actions?: ReactNode;
}
export interface ConsoleShellProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "context"> {
  surface: string;
  activePath: string;
  brand: { href: string; name: string; mark: string };
  context?: readonly { label: string; value: string }[];
  nav: readonly ConsoleNavGroup[];
  expandedGroups?: readonly string[];
  defaultExpandedGroups?: readonly string[];
  onExpandedGroupsChange?: (groupIds: string[]) => void;
  labels: ConsoleShellLabels;
  header: ConsoleHeader;
  foot?: ReactNode;
  children: ReactNode;
}
function isActive(path: string, item: ConsoleNavItem) {
  return (
    item.active ??
    (item.href.split("/").filter(Boolean).length <= 1
      ? path === item.href
      : path === item.href || path.startsWith(`${item.href}/`))
  );
}
export const ConsoleShell = forwardRef<HTMLDivElement, ConsoleShellProps>(
  function ConsoleShell(
    {
      surface,
      activePath,
      brand,
      context,
      nav,
      expandedGroups,
      defaultExpandedGroups,
      onExpandedGroupsChange,
      labels,
      header,
      foot,
      children,
      className,
      ...rest
    },
    ref
  ) {
    const [internalExpandedGroups, setInternalExpandedGroups] = useState<readonly string[]>(
      () => defaultExpandedGroups ?? nav.flatMap((group, index) =>
        group.collapsible && group.items.some(item => isActive(activePath, item))
          ? [group.id ?? `group-${index}`] : []),
    );
    const expanded = expandedGroups ?? internalExpandedGroups;
    function toggleGroup(groupId: string) {
      const next = expanded.includes(groupId)
        ? expanded.filter(value => value !== groupId)
        : [...expanded, groupId];
      if (expandedGroups === undefined) setInternalExpandedGroups(next);
      onExpandedGroupsChange?.(next);
    }
    const [open, setOpen] = useState(false);
    const [hydrated, setHydrated] = useState(false);
    const id = useId();
    const railId = `dds-console-rail-${id}`;
    const mainId = `dds-console-main-${id}`;
    useEffect(() => {
      setHydrated(true);
      const onKey = (event: KeyboardEvent) => {
        if (event.key === "Escape") setOpen(false);
      };
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    }, []);
    return (
      <div
        {...rest}
        ref={ref}
        className={classes("dds-console-shell", className)}
        data-surface={surface}
        data-hydrated={hydrated ? "true" : undefined}
      >
        <a className="dds-console-skip dds-visually-hidden" href={`#${mainId}`}>
          {labels.skip}
        </a>
        <button
          className="dds-console-rail__toggle"
          type="button"
          data-action="toggle-rail"
          aria-controls={railId}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span aria-hidden />
          <span className="dds-visually-hidden">
            {open ? labels.menuClose : labels.menuOpen}
          </span>
        </button>
        <div
          className="dds-console-rail__scrim"
          data-open={String(open)}
          onClick={() => setOpen(false)}
        />
        <aside
          id={railId}
          className="dds-console-rail"
          data-open={String(open)}
        >
          <a className="dds-console-rail__brand" href={brand.href}>
            <img src={brand.mark} alt="" width={20} height={20} />
            <strong>{brand.name}</strong>
          </a>
          {context && context.length > 0 && (
            <dl className="dds-console-rail__context">
              {context.map((row, index) => (
                <div key={index}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          )}
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
                      <span className="dds-console-rail__chevron" aria-hidden="true" />
                    </button>
                  ) : group.label}
                </h2>
                <ul id={`${id}-group-items-${index}`} hidden={group.collapsible && !expanded.includes(group.id ?? `group-${index}`)}>
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <a
                        className="dds-console-rail__item"
                        data-nav={`${surface}.${item.id}`}
                        href={item.href}
                        aria-current={
                          isActive(activePath, item) ? "page" : undefined
                        }
                        onClick={() => setOpen(false)}
                      >
                        {item.icon != null ? (
                          <span className="dds-console-rail__item-content">
                            <span className="dds-console-rail__item-icon" aria-hidden="true">{item.icon}</span>
                            <span>{item.label}</span>
                          </span>
                        ) : <span>{item.label}</span>}
                        {item.badge !== undefined && item.badge > 0 && (
                          <span
                            className="dds-console-rail__badge"
                            aria-label={labels.badge.replace("{count}", () =>
                              String(item.badge)
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
          {foot && <div className="dds-console-rail__foot">{foot}</div>}
        </aside>
        <main id={mainId} className="dds-console-main" tabIndex={-1}>
          <header className="dds-console-page-header">
            <div className="dds-console-page-header__text">
              {header.eyebrow && (
                <p className="dds-console-page-eyebrow">{header.eyebrow}</p>
              )}
              <h1>{header.title}</h1>
            </div>
            {header.actions && (
              <div className="dds-console-page-header__actions">
                {header.actions}
              </div>
            )}
          </header>
          {children}
        </main>
      </div>
    );
  }
);
