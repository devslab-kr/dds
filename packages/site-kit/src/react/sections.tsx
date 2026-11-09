import type { ReactNode } from "react";

/**
 * Section primitives — the rhythm of a family landing page. The Solid
 * primitives, same classes (site-sections.css), same two glyph systems:
 * SectionHead.index is the section's mono "01", StepFlow markers are a
 * sequence's plain "1". Stateless.
 */

export interface SectionBlockProps {
  id: string;
  labelledBy: string;
  /** `band` steps the background down one token (bg-subtle) — a decision, not a tint. */
  tone?: "default" | "band";
  children: ReactNode;
}

export function SectionBlock(props: SectionBlockProps) {
  return (
    <section className="site-section" id={props.id} data-tone={props.tone ?? "default"} aria-labelledby={props.labelledBy}>
      <div className="site-section__shell">{props.children}</div>
    </section>
  );
}

export interface SectionHeadProps {
  /** Mono, zero-padded index ("01"). Decorative — hidden from assistive tech. */
  index: string;
  title: string;
  titleId: string;
  lede?: string;
}

export function SectionHead(props: SectionHeadProps) {
  return (
    <header className="site-section__head">
      <p className="site-section__index" aria-hidden="true">{props.index}</p>
      <h2 id={props.titleId}>{props.title}</h2>
      {props.lede ? <p className="site-section__lede">{props.lede}</p> : null}
    </header>
  );
}

export interface HeroSplitProps {
  id?: string;
  eyebrow?: string;
  title: string;
  titleId: string;
  lede: string;
  actions: ReactNode;
  /** The product's own scene. Its height is the consumer's decision. */
  aside: ReactNode;
  asideLabel: string;
}

export function HeroSplit(props: HeroSplitProps) {
  return (
    <section id={props.id} className="site-hero" aria-labelledby={props.titleId}>
      <div className="site-hero__shell">
        <div className="site-hero__copy">
          {props.eyebrow ? <p className="site-hero__eyebrow">{props.eyebrow}</p> : null}
          <h1 id={props.titleId}>{props.title}</h1>
          <p className="site-hero__lede">{props.lede}</p>
          <div className="site-hero__actions">{props.actions}</div>
        </div>
        <figure className="site-hero__aside" aria-label={props.asideLabel}>{props.aside}</figure>
      </div>
    </section>
  );
}

export interface StepFlowStep { title: string; body: string }

export interface StepFlowProps {
  steps: ReadonlyArray<StepFlowStep>;
  /** Accessible name for the list — pass the section title's words, localized. */
  label?: string;
}

export function StepFlow(props: StepFlowProps) {
  return (
    <ol className="site-steps" aria-label={props.label}>
      {props.steps.map((step, index) => (
        <li key={index} className="site-steps__step">
          <span className="site-steps__marker" aria-hidden="true">{index + 1}</span>
          <h3>{step.title}</h3>
          <p>{step.body}</p>
        </li>
      ))}
    </ol>
  );
}

export interface FeatureRow { title: string; body: string; badge?: string }

export interface FeatureRowsProps {
  rows: ReadonlyArray<FeatureRow>;
  label?: string;
}

/** Hairline rows — a card grid is the thing this primitive exists to replace. */
export function FeatureRows(props: FeatureRowsProps) {
  return (
    <ul className="site-rows" aria-label={props.label}>
      {props.rows.map((row, index) => (
        <li key={index} className="site-rows__row">
          <div className="site-rows__title">
            <h3>{row.title}</h3>
            {row.badge ? <span className="dds-badge dds-badge--brand">{row.badge}</span> : null}
          </div>
          <p className="site-rows__body">{row.body}</p>
        </li>
      ))}
    </ul>
  );
}

export interface PricingNoteProps {
  children: ReactNode;
  action: ReactNode;
}

/** One paragraph block, one action. No table, no tiers — a note, not a pricing page. */
export function PricingNote(props: PricingNoteProps) {
  return (
    <div className="site-pricing">
      <div className="site-pricing__note">{props.children}</div>
      <div className="site-pricing__action">{props.action}</div>
    </div>
  );
}
