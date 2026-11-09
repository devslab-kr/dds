import type { ReactNode } from "react";

import { SiteFooter, SiteHeader, type SiteFooterProps, type SiteHeaderProps } from "./chrome";
import { Button, type ButtonTone } from "./primitives";
import type { SiteMessages } from "./types";

export interface MarketingShellProps {
  header: SiteHeaderProps;
  footer: SiteFooterProps;
  messages: SiteMessages;
  children: ReactNode;
  /** "bleed" removes the shell's max-width/inset from <main> — for pages composed from
   * full-bleed section primitives, each of which carries its own inner width. Default "shell". */
  mainWidth?: "shell" | "bleed";
}

/**
 * Header, main, footer. React props are values, not getters, so the Solid
 * shell's read-once memo (D-027) has no counterpart here: a `header={{ … }}`
 * literal is built once per render on each side, in the same order.
 */
export function MarketingShell(props: MarketingShellProps) {
  const mainClass = props.mainWidth === "bleed" ? "site-main site-main--bleed" : "site-main";
  return (
    <div className="site-shell">
      <SiteHeader {...props.header} />
      <main id="main-content" className={mainClass} tabIndex={-1}>{props.children}</main>
      <SiteFooter {...props.footer} />
    </div>
  );
}

export interface LegalLayoutProps {
  title: string;
  updatedAt: string;
  messages: SiteMessages;
  children: ReactNode;
}

export function LegalLayout(props: LegalLayoutProps) {
  return (
    <article className="site-legal">
      <header>
        <h1>{props.title}</h1>
        <p>{props.messages.updatedLabel}: <time dateTime={props.updatedAt}>{props.updatedAt}</time></p>
      </header>
      {props.children}
    </article>
  );
}

export interface StatusBannerProps {
  tone: "success" | "warning" | "danger" | "info";
  title: string;
  children?: ReactNode;
  action?: { label: string; onClick: () => void; tone?: ButtonTone };
}

export function StatusBanner(props: StatusBannerProps) {
  return (
    <section
      className={`site-status site-status--${props.tone}`}
      role={props.tone === "danger" ? "alert" : "status"}
      aria-live={props.tone === "danger" ? "assertive" : "polite"}
    >
      <strong>{props.title}</strong>
      {props.children ? <div>{props.children}</div> : null}
      {props.action && <Button tone={props.action.tone ?? "secondary"} onClick={props.action.onClick}>{props.action.label}</Button>}
    </section>
  );
}

export interface NotFoundLayoutProps { messages: SiteMessages; homeHref: string; children?: ReactNode }
export function NotFoundLayout(props: NotFoundLayoutProps) {
  return (
    <main className="site-main site-centered-layout">
      <h1>{props.messages.notFoundTitle}</h1>
      <p>{props.messages.notFoundDescription}</p>
      {props.children}
      <a className="dds-btn dds-btn--primary" href={props.homeHref}>{props.messages.backHome}</a>
    </main>
  );
}

export interface ErrorLayoutProps { messages: SiteMessages; onRetry: () => void; errorId?: string; children?: ReactNode }
export function ErrorLayout(props: ErrorLayoutProps) {
  return (
    <main className="site-main site-centered-layout">
      <h1>{props.messages.errorTitle}</h1>
      <p>{props.messages.errorDescription}</p>
      {props.errorId && <code>{props.errorId}</code>}
      {props.children}
      <Button tone="primary" onClick={props.onRetry}>{props.messages.retry}</Button>
    </main>
  );
}
