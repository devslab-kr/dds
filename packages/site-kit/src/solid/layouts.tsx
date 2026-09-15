import { Button, type ButtonTone } from "@devslab/dds-solid";
import { createMemo, type JSX } from "solid-js";

import { SiteFooter, SiteHeader, type SiteFooterProps, type SiteHeaderProps } from "./chrome";
import type { SiteMessages } from "./types";

export interface MarketingShellProps {
  header: SiteHeaderProps;
  footer: SiteFooterProps;
  messages: SiteMessages;
  children: JSX.Element;
  /** "bleed" removes the shell's max-width/inset from <main> — for pages composed from
   * full-bleed section primitives, each of which carries its own inner width. Default "shell". */
  mainWidth?: "shell" | "bleed";
}

export function MarketingShell(props: MarketingShellProps) {
  const mainClass = () => (props.mainWidth === "bleed" ? "site-main site-main--bleed" : "site-main");
  // Read header and footer once, here, before any element of the shell exists.
  // `header={{ … }}` compiles to a getter, so spreading `props.header` straight
  // into SiteHeader re-evaluated the literal on every prop read — and any JSX
  // built eagerly inside it (an `actions` anchor, a logo) was built again each
  // time, consuming hydration keys. The server and the client read a different
  // number of times, so from the first extra read every key after it was off,
  // and the client rebuilt the whole header from templates: the flag sprite
  // came back empty (AskLinq, site-kit 0.12.0). A memo evaluates the literal
  // exactly once per side, at the same point in the tree.
  const header = createMemo(() => props.header);
  const footer = createMemo(() => props.footer);
  return <div class="site-shell"><SiteHeader {...header()} /><main id="main-content" class={mainClass()} tabIndex={-1}>{props.children}</main><SiteFooter {...footer()} /></div>;
}

export interface LegalLayoutProps {
  title: string;
  updatedAt: string;
  messages: SiteMessages;
  children: JSX.Element;
}

export function LegalLayout(props: LegalLayoutProps) {
  return <article class="site-legal"><header><h1>{props.title}</h1><p>{props.messages.updatedLabel}: <time datetime={props.updatedAt}>{props.updatedAt}</time></p></header>{props.children}</article>;
}

export interface StatusBannerProps {
  tone: "success" | "warning" | "danger" | "info";
  title: string;
  children?: JSX.Element;
  action?: { label: string; onClick: () => void; tone?: ButtonTone };
}

export function StatusBanner(props: StatusBannerProps) {
  return <section class={`site-status site-status--${props.tone}`} role={props.tone === "danger" ? "alert" : "status"} aria-live={props.tone === "danger" ? "assertive" : "polite"}>
    <strong>{props.title}</strong>{props.children && <div>{props.children}</div>}{props.action && <Button tone={props.action.tone ?? "secondary"} onClick={props.action.onClick}>{props.action.label}</Button>}
  </section>;
}

export interface NotFoundLayoutProps { messages: SiteMessages; homeHref: string; children?: JSX.Element }
export function NotFoundLayout(props: NotFoundLayoutProps) {
  return <main class="site-main site-centered-layout"><h1>{props.messages.notFoundTitle}</h1><p>{props.messages.notFoundDescription}</p>{props.children}<a class="dds-btn dds-btn--primary" href={props.homeHref}>{props.messages.backHome}</a></main>;
}

export interface ErrorLayoutProps { messages: SiteMessages; onRetry: () => void; errorId?: string; children?: JSX.Element }
export function ErrorLayout(props: ErrorLayoutProps) {
  return <main class="site-main site-centered-layout"><h1>{props.messages.errorTitle}</h1><p>{props.messages.errorDescription}</p>{props.errorId && <code>{props.errorId}</code>}{props.children}<Button tone="primary" onClick={props.onRetry}>{props.messages.retry}</Button></main>;
}
