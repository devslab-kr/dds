import { For, Show, type JSX } from "solid-js";

/**
 * Section primitives — the rhythm of a family landing page.
 *
 * Extracted from VisionLinq's landing (apps/web/src/components/landing/
 * sections.tsx + styles/landing.css) so AskLinq's web-next can compose the
 * same page shape. Stateless; every class lives in site-sections.css;
 * colour comes from --dds-* tokens, so light/dark needs no rule here.
 *
 * Two glyph systems, deliberately different (owner, 2026-09-05):
 *   - SectionHead.index — the SECTION's number: mono, zero-padded "01".
 *   - StepFlow markers  — a SEQUENCE inside a section: ring numerals "1".
 * A step never renders "01"; that would put two levels in one voice.
 */

export interface SectionBlockProps {
  id: string;
  labelledBy: string;
  /** `band` steps the background down one token (bg-subtle) — a decision, not a tint. */
  tone?: "default" | "band";
  children: JSX.Element;
}

export function SectionBlock(props: SectionBlockProps) {
  return (
    <section class="site-section" id={props.id} data-tone={props.tone ?? "default"} aria-labelledby={props.labelledBy}>
      <div class="site-section__shell">{props.children}</div>
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
    <header class="site-section__head">
      <p class="site-section__index" aria-hidden="true">{props.index}</p>
      <h2 id={props.titleId}>{props.title}</h2>
      <Show when={props.lede}>{(lede) => <p class="site-section__lede">{lede()}</p>}</Show>
    </header>
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
    <ol class="site-steps" aria-label={props.label}>
      <For each={props.steps}>{(step, index) => (
        <li class="site-steps__step">
          <span class="site-steps__marker" aria-hidden="true">{index() + 1}</span>
          <h3>{step.title}</h3>
          <p>{step.body}</p>
        </li>
      )}</For>
    </ol>
  );
}
