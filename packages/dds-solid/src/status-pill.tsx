import { Show, type JSX } from "solid-js";

export type StatusTone = "success" | "warning" | "danger" | "info" | "brand" | "neutral";

/* The rule, not the vocabulary. A value a CLOSED domain does not know throws:
   that can only mean a schema gained a case the catalog forgot. A value an OPEN
   domain does not know renders as raw text: that is customer data, and it must
   not crash the screen.

   `tones` declares which domains exist; `openDomains` only selects among the
   domains `tones` already declared, so it must not itself widen or narrow that
   set. */
export function createStatusPill<D extends string>(config: {
  tones: Record<D, Record<string, StatusTone>>;
  label: (domain: D, value: string, locale: string) => string | undefined;
  openDomains?: readonly NoInfer<D>[];
}) {
  const open = new Set<string>(config.openDomains ?? []);
  return function StatusPill(props: { domain: D; value: string; locale: string }): JSX.Element {
    const tone = () => config.tones[props.domain]?.[props.value];
    const label = () => config.label(props.domain, props.value, props.locale);
    const known = () => Boolean(tone() && label());
    const resolved = () => {
      const found = tone();
      if (!found) throw new Error(`StatusPill: no tone for ${props.domain}.${props.value}`);
      const text = label();
      if (!text) throw new Error(`StatusPill: no label for ${props.domain}.${props.value}`);
      return { tone: found, text };
    };
    return (
      <Show when={known() || !open.has(props.domain)} fallback={<code data-status={`${props.domain}.${props.value}`}>{props.value}</code>}>
        {(() => {
          const value = resolved();
          return (
            <span
              class={value.tone === "neutral" ? "dds-badge" : `dds-badge dds-badge--${value.tone}`}
              data-status={`${props.domain}.${props.value}`}
              data-tone={value.tone}
            >
              {value.text}
            </span>
          );
        })()}
      </Show>
    );
  };
}
