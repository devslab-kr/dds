import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { Layout } from "./layout";
import { LeftNav, type ConsoleNavGroup } from "./left-nav";
export type { ConsoleNavItem, ConsoleNavGroup } from "./left-nav";
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
  nav?: readonly ConsoleNavGroup[];
  /** Supply a standalone LeftNav or custom navigation. */
  navigation?: ReactNode;
  expandedGroups?: readonly string[];
  defaultExpandedGroups?: readonly string[];
  onExpandedGroupsChange?: (groupIds: string[]) => void;
  labels: ConsoleShellLabels;
  header: ConsoleHeader;
  foot?: ReactNode;
  children: ReactNode;
}
export const ConsoleShell = forwardRef<HTMLDivElement,ConsoleShellProps>(function ConsoleShell({surface,activePath,brand,context,nav=[],navigation,expandedGroups,defaultExpandedGroups,onExpandedGroupsChange,labels,header,foot,children,...rest},ref){
  return <Layout {...rest} ref={ref} surface={surface} labels={labels}
    railStart={<><a className="dds-console-rail__brand" href={brand.href}><img src={brand.mark} alt="" width={20} height={20}/><strong>{brand.name}</strong></a>
      {context && context.length>0 && <dl className="dds-console-rail__context">{context.map((row,index)=><div key={index}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl>}</>}
    navigation={navigation??<LeftNav surface={surface} activePath={activePath} nav={nav} labels={labels} expandedGroups={expandedGroups} defaultExpandedGroups={defaultExpandedGroups} onExpandedGroupsChange={onExpandedGroupsChange}/>}
    railEnd={foot && <div className="dds-console-rail__foot">{foot}</div>}
    header={<div className="dds-console-page-header"><div className="dds-console-page-header__text">{header.eyebrow && <p className="dds-console-page-eyebrow">{header.eyebrow}</p>}<h1>{header.title}</h1></div>{header.actions && <div className="dds-console-page-header__actions">{header.actions}</div>}</div>}>
    {children}
  </Layout>;
});
