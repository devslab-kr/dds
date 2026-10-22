import type { Component } from "vue";

export interface ConsoleNavItem {
  id: string;
  href: string;
  label: string;
  /** Decorative component; the navigation label supplies its accessible name. */
  icon?: Component;
  badge?: number;
  active?: boolean;
}
export interface ConsoleNavGroup {
  /** Stable expansion key. Defaults to `group-${index}`. */
  id?: string;
  /** Legacy groups stay expanded unless this is true. */
  collapsible?: boolean;
  label: string;
  items: readonly ConsoleNavItem[];
}
export interface ConsoleShellLabels {
  skip: string;
  menuOpen: string;
  menuClose: string;
  nav: string;
  /** Badge accessible name template containing {count}. */
  badge: string;
}
export interface ConsoleHeader {
  eyebrow?: string;
  title: string;
}
export interface LeftNavProps {
  surface: string;
  activePath: string;
  nav: readonly ConsoleNavGroup[];
  /** Controlled expansion; pair with v-model:expandedGroups. */
  expandedGroups?: readonly string[];
  /** Initial uncontrolled expansion. Omit to initially expand active groups. */
  defaultExpandedGroups?: readonly string[];
  labels: Pick<ConsoleShellLabels, "nav" | "badge">;
}
export interface ConsoleShellProps extends Omit<
  LeftNavProps,
  "nav" | "labels"
> {
  brand: { href: string; name: string; mark: string };
  context?: readonly { label: string; value: string }[];
  /** Omit when composing a menu through the navigation slot. */
  nav?: readonly ConsoleNavGroup[];
  labels: ConsoleShellLabels;
  header: ConsoleHeader;
}

export interface LayoutProps {
  navigationPosition?: "left" | "top";
  contentWidth?: "workspace" | "form" | "settings" | "full";
  labels: Pick<ConsoleShellLabels, "skip" | "menuOpen" | "menuClose">;
  surface?: string;
}
export type TopNavProps = Pick<
  LeftNavProps,
  "surface" | "activePath" | "nav" | "labels"
>;
