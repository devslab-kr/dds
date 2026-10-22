import type { Snippet } from "svelte";
export interface ConsoleNavItem {
  id: string;
  href: string;
  label: string;
  badge?: number;
  active?: boolean;
  icon?: Snippet;
}
export interface ConsoleNavGroup {
  id?: string;
  label: string;
  items: readonly ConsoleNavItem[];
  collapsible?: boolean;
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
  actions?: Snippet;
}
export interface ConsoleShellProps {
  surface: string;
  activePath: string;
  brand: { href: string; name: string; mark: string };
  context?: readonly { label: string; value: string }[];
  nav?: readonly ConsoleNavGroup[];
  navigation?: Snippet;
  labels: ConsoleShellLabels;
  header: ConsoleHeader;
  foot?: Snippet;
  children?: Snippet;
  expandedGroups?: readonly string[];
  defaultExpandedGroups?: readonly string[];
  onExpandedGroupsChange?: (groupIds: string[]) => void;
}

export interface LeftNavProps {
  surface: string;
  activePath: string;
  nav: readonly ConsoleNavGroup[];
  labels: Pick<ConsoleShellLabels, "nav" | "badge">;
  expandedGroups?: readonly string[];
  defaultExpandedGroups?: readonly string[];
  onExpandedGroupsChange?: (ids: string[]) => void;
  onNavigate?: () => void;
}
export type TopNavProps = Pick<
  LeftNavProps,
  "surface" | "activePath" | "nav" | "labels" | "onNavigate"
>;
export interface LayoutProps {
  navigationPosition?: "left" | "top";
  contentWidth?: "workspace" | "form" | "settings" | "full";
  labels: Pick<ConsoleShellLabels, "skip" | "menuOpen" | "menuClose">;
  surface?: string;
  header?: Snippet;
  navigation?: Snippet;
  railStart?: Snippet;
  railEnd?: Snippet;
  footer?: Snippet;
  children?: Snippet;
}
