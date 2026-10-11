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
      labels,
      header,
      foot,
      children,
      className,
      ...rest
    },
    ref
  ) {
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
                key={index}
                className="dds-console-rail__group"
                aria-labelledby={`${id}-group-${index}`}
              >
                <h2
                  id={`${id}-group-${index}`}
                  className="dds-console-rail__group-label"
                >
                  {group.label}
                </h2>
                <ul>
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
                        <span>{item.label}</span>
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
