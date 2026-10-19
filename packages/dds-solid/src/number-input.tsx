import {
  NumberInput as ArkNumberInput,
  useNumberInput,
} from "@ark-ui/solid/number-input";
import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  mergeProps,
  on,
  onCleanup,
  Show,
} from "solid-js";
import { isKorean } from "./date-only";
import { useDirection, type Direction } from "./direction";
import { classes, describedBy } from "./utils";

export interface NumberInputMessages {
  /** Accessible name of the − button. */
  decrease?: string;
  /** Accessible name of the + button. */
  increase?: string;
}

export function numberInputMessages(
  locale: string,
  messages: NumberInputMessages = {},
): Required<NumberInputMessages> {
  const ko = isKorean(locale);
  return {
    decrease: ko ? "값 줄이기" : "Decrease",
    increase: ko ? "값 늘리기" : "Increase",
    ...messages,
  };
}

export interface NumberInputProps {
  /** null means empty. Controlled when not undefined. */
  value?: number | null;
  defaultValue?: number | null;
  /** Called with the new number, or null when emptied, only after a user change. */
  onValueChange?: (next: number | null) => void;
  min?: number;
  max?: number;
  /** Arrow keys and the stepper buttons move by step; PageUp/PageDown by ten steps. */
  step?: number;
  /** Formatting and parsing locale. Defaults to ko-KR. */
  locale?: string;
  /** Defaults to whole numbers with thousands separators. */
  formatOptions?: Intl.NumberFormatOptions;
  /** Show the − / + buttons. Defaults to true. */
  stepper?: boolean;
  /** Unit shown after the digits, for example 원, 개 or 분. */
  suffix?: string;
  label?: string;
  labelPlacement?: "outside" | "hidden";
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  id?: string;
  /** Submits the plain number (1234.5), never the formatted text. */
  name?: string;
  form?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  /** Also invalid on its own while the number is outside min/max. */
  invalid?: boolean;
  placeholder?: string;
  messages?: NumberInputMessages;
  dir?: Direction;
  class?: string;
}

// Inlined from @devslab/dds-icons (minus/plus): importing the shared Icon here
// would move the whole icon set into a chunk shared with the root entry.
const MINUS = ["M5 12h14"];
const PLUS = ["M12 5v14", "M5 12h14"];
function StepIcon(props: { path: string[] }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      {props.path.map((d) => <path d={d} />)}
    </svg>
  );
}

const FULL_WIDTH: Record<string, string> = {
  "，": ",",
  "．": ".",
  "－": "-",
  "−": "-",
};
/** Full-width digits from Japanese/Chinese IMEs become ASCII; other text is left for validation. */
export function normalizeNumberText(text: string) {
  return text.replace(/[０-９，．－−]/g, (char) =>
    char >= "０" && char <= "９"
      ? String.fromCharCode(char.charCodeAt(0) - 0xff10 + 48)
      : FULL_WIDTH[char]!,
  );
}

function separators(formatter: Intl.NumberFormat) {
  const parts = [
    ...formatter.formatToParts(-1234567.5),
    ...formatter.formatToParts(1234567.5),
  ];
  const find = (type: string) => parts.find((part) => part.type === type)?.value;
  const affixes = new Set<string>();
  for (const part of parts)
    if (!["integer", "group", "decimal", "fraction", "minusSign"].includes(part.type))
      for (const char of part.value) affixes.add(char);
  return {
    group: find("group") ?? "",
    decimal: find("decimal") ?? ".",
    minus: find("minusSign") ?? "-",
    affixes,
  };
}

/**
 * A localized number field. Values are numbers (or null for empty); display
 * text is formatted with Intl and never leaves the component.
 */
export function NumberInput(props: NumberInputProps) {
  const generated = createUniqueId();
  const id = () => props.id ?? `dds-number-input-${generated}`;
  const suffixId = () => `${id()}-suffix`;
  const locale = () => props.locale ?? "ko-KR";
  const messages = () => numberInputMessages(locale(), props.messages);
  const formatOptions = createMemo<Intl.NumberFormatOptions>(
    () => props.formatOptions ?? { maximumFractionDigits: 0 },
  );
  const formatter = createMemo(
    () => new Intl.NumberFormat(locale(), formatOptions()),
  );
  const syntax = createMemo(() => separators(formatter()));
  const fractions = () =>
    (formatter().resolvedOptions().maximumFractionDigits ?? 0) > 0;
  const format = (next: number | null) =>
    next === null || !Number.isFinite(next) ? "" : formatter().format(next);

  const controlled = () => props.value !== undefined;
  const [internal, setInternal] = createSignal<number | null>(
    props.defaultValue ?? null,
  );
  const current = () => (controlled() ? (props.value ?? null) : internal());
  // draft is the text in the field; draftNumber is what that text means.
  const [draft, setDraft] = createSignal(format(current()));
  const [draftNumber, setDraftNumber] = createSignal(current());
  const outOfRange = () => {
    const next = draftNumber();
    return (
      next !== null &&
      ((props.min !== undefined && next < props.min) ||
        (props.max !== undefined && next > props.max))
    );
  };
  const invalid = () => !!props.invalid || outOfRange();

  let root: HTMLDivElement | undefined;
  let input: HTMLInputElement | undefined;
  let composing = false;
  let resetting = false;
  const direction = useDirection(() => root, () => props.dir);

  const commit = (next: number | null) => {
    if (next === current()) return;
    if (!controlled()) setInternal(next);
    props.onValueChange?.(next);
  };

  const api = useNumberInput(() => ({
    id: `${id()}-root`,
    // Zag prefixes part IDs with "number-input:"; pin the two DDS documents.
    ids: { root: `${id()}-root`, input: id() },
    dir: direction(),
    locale: locale(),
    formatOptions: formatOptions(),
    value: draft(),
    step: props.step ?? 1,
    // Unset bounds stay absent: Zag's defaults are the safe-integer limits.
    ...(props.min !== undefined ? { min: props.min } : {}),
    ...(props.max !== undefined ? { max: props.max } : {}),
    allowMouseWheel: false,
    clampValueOnBlur: true,
    spinOnPress: true,
    inputMode: fractions() ? ("decimal" as const) : ("numeric" as const),
    disabled: props.disabled,
    readOnly: props.readOnly,
    required: props.required,
    invalid: invalid(),
    translations: {
      decrementLabel: messages().decrease,
      incrementLabel: messages().increase,
      valueText: (text: string) =>
        text && props.suffix ? `${text} ${props.suffix}` : text,
    },
    onValueChange: (details) => {
      if (resetting) return;
      const next = Number.isNaN(details.valueAsNumber)
        ? null
        : details.valueAsNumber;
      setDraft(details.value);
      setDraftNumber(next);
      commit(next);
    },
  }));

  // A parent-owned value that changes from outside replaces the field text.
  createEffect(
    on(
      current,
      (next) => {
        if (next === draftNumber()) return;
        setDraft(format(next));
        setDraftNumber(next);
      },
      { defer: true },
    ),
  );

  createEffect(() => {
    void props.form;
    const form = input?.form;
    if (!form) return;
    const reset = (event: Event) => {
      resetting = true;
      queueMicrotask(() => {
        resetting = false;
        if (event.defaultPrevented) return;
        if (!controlled()) setInternal(props.defaultValue ?? null);
        setDraft(format(current()));
        setDraftNumber(current());
        if (input) input.value = draft();
      });
    };
    // Capture runs before Zag's own reset listener, which would emit a change.
    form.addEventListener("reset", reset, { capture: true });
    onCleanup(() => form.removeEventListener("reset", reset, { capture: true }));
  });

  // Keep everything from Zag except the handlers DDS composes below.
  const inputAttributes = mergeProps(() => {
    const {
      onKeyDown: _keyDown,
      onBeforeInput: _beforeInput,
      onInput: _input,
      onFocusOut: _focusOut,
      value: _value,
      ...attributes
    } = api().getInputProps() as Record<string, unknown>;
    return attributes;
  });
  const zag = () =>
    api().getInputProps() as Record<string, ((event: Event) => void) | undefined>;

  const acceptable = (text: string) => {
    const { group, decimal, minus, affixes } = syntax();
    let decimals = 0;
    for (const char of text) {
      if (char >= "0" && char <= "9") continue;
      if (char === group || (group.trim() === "" && char === " ")) continue;
      if (char === decimal) {
        decimals += 1;
        if (!fractions() || decimals > 1) return false;
        continue;
      }
      if (char === minus || char === "-") {
        if (props.min !== undefined && props.min >= 0) return false;
        continue;
      }
      if (affixes.has(char)) continue;
      return false;
    }
    return true;
  };

  const stepBy = (delta: number) => {
    let next = (draftNumber() ?? 0) + delta;
    if (props.min !== undefined) next = Math.max(props.min, next);
    if (props.max !== undefined) next = Math.min(props.max, next);
    api().setValue(next);
  };

  return (
    <ArkNumberInput.RootProvider
      ref={root}
      value={api}
      class={classes("dds-number-input", props.class)}
      data-label-placement={props.labelPlacement ?? "outside"}
      data-readonly={props.readOnly ? "" : undefined}
      data-stepper={props.stepper === false ? undefined : ""}
    >
      <Show when={props.label}>
        <ArkNumberInput.Label class="dds-number-input__label">
          {props.label}
        </ArkNumberInput.Label>
      </Show>
      <ArkNumberInput.Control class="dds-number-input__control">
        <input
          {...inputAttributes}
          ref={input}
          class="dds-number-input__field"
          value={draft()}
          placeholder={props.placeholder}
          aria-label={props.label ? undefined : props["aria-label"]}
          aria-labelledby={props.label ? undefined : props["aria-labelledby"]}
          aria-describedby={describedBy(
            props.suffix ? suffixId() : undefined,
            props["aria-describedby"],
          )}
          onCompositionStart={() => {
            composing = true;
          }}
          onCompositionEnd={(event) => {
            composing = false;
            // Hand the finished composition to the normal input path.
            event.currentTarget.dispatchEvent(
              new InputEvent("input", { bubbles: true }),
            );
          }}
          onBeforeInput={(event) => {
            if (composing || event.isComposing) return;
            const target = event.currentTarget;
            const data = normalizeNumberText(event.data ?? "");
            const next =
              target.value.slice(0, target.selectionStart ?? target.value.length) +
              data +
              target.value.slice(target.selectionEnd ?? target.value.length);
            if (!acceptable(normalizeNumberText(next))) event.preventDefault();
          }}
          onInput={(event) => {
            if (composing) return;
            const target = event.currentTarget;
            const normalized = normalizeNumberText(target.value);
            if (!acceptable(normalized)) {
              // Letters, pasted units and the like are refused, not guessed at.
              target.value = draft();
              return;
            }
            if (normalized !== target.value) {
              const start = target.selectionStart;
              const end = target.selectionEnd;
              target.value = normalized;
              target.setSelectionRange(start, end);
            }
            zag().onInput?.(event);
          }}
          onKeyDown={(event) => {
            if (props.readOnly || props.disabled) return;
            if (event.isComposing || event.keyCode === 229) return;
            const step = props.step ?? 1;
            if (event.key === "PageUp" || event.key === "PageDown") {
              event.preventDefault();
              stepBy((event.key === "PageUp" ? 10 : -10) * step);
              return;
            }
            // Home/End jump to a bound only when that bound exists;
            // otherwise they keep moving the caret.
            if (event.key === "Home" && props.min === undefined) return;
            if (event.key === "End" && props.max === undefined) return;
            zag().onKeyDown?.(event);
          }}
          onFocusOut={(event) => {
            zag().onFocusOut?.(event);
            // A parent that declined the typed number gets its own value back.
            if (controlled() && draftNumber() !== current()) {
              setDraft(format(current()));
              setDraftNumber(current());
            }
          }}
        />
        <Show when={props.suffix}>
          <span id={suffixId()} class="dds-number-input__suffix">
            {props.suffix}
          </span>
        </Show>
        <Show when={props.stepper !== false}>
          <span class="dds-number-input__steppers">
            <ArkNumberInput.DecrementTrigger class="dds-number-input__step">
              <StepIcon path={MINUS} />
            </ArkNumberInput.DecrementTrigger>
            <ArkNumberInput.IncrementTrigger class="dds-number-input__step">
              <StepIcon path={PLUS} />
            </ArkNumberInput.IncrementTrigger>
          </span>
        </Show>
      </ArkNumberInput.Control>
      <input
        type="hidden"
        name={props.name}
        form={props.form}
        value={draftNumber() === null ? "" : String(draftNumber())}
        disabled={props.disabled}
      />
    </ArkNumberInput.RootProvider>
  );
}
