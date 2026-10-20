import {
  NumberInput as ArkNumberInput,
  useNumberInput,
} from "@ark-ui/react/number-input";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type FocusEvent,
} from "react";
import { classes } from "./controls";
import { isKorean } from "./date-only";
import { useDirection, type Direction } from "./direction";

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
  className?: string;
}

// Inlined from @devslab/dds-icons (minus/plus): importing the shared Icon here
// would move the whole icon set into a chunk shared with the root entry.
const MINUS = ["M5 12h14"];
const PLUS = ["M12 5v14", "M5 12h14"];
function StepIcon({ path }: { path: string[] }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {path.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

// Layout timing in the browser; the server has no field to write to.
const useClientLayoutEffect =
  typeof document === "undefined" ? useEffect : useLayoutEffect;

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
  const generated = useId();
  const id = props.id ?? `dds-number-input-${generated}`;
  const suffixId = `${id}-suffix`;
  const locale = props.locale ?? "ko-KR";
  const messages = numberInputMessages(locale, props.messages);
  // Inline option literals are new objects each render; key on their content.
  const optionsKey = JSON.stringify(props.formatOptions ?? null);
  const formatOptions = useMemo<Intl.NumberFormatOptions>(
    () => props.formatOptions ?? { maximumFractionDigits: 0 },
    [optionsKey],
  );
  const formatter = useMemo(
    () => new Intl.NumberFormat(locale, formatOptions),
    [locale, formatOptions],
  );
  const syntax = useMemo(() => separators(formatter), [formatter]);
  const fractions =
    (formatter.resolvedOptions().maximumFractionDigits ?? 0) > 0;
  const format = (next: number | null) =>
    next === null || !Number.isFinite(next) ? "" : formatter.format(next);

  const controlled = props.value !== undefined;
  const [internal, setInternal] = useState<number | null>(
    props.defaultValue ?? null,
  );
  const current = controlled ? (props.value ?? null) : internal;
  // draft is the text in the field; draftNumber is what that text means.
  const [draft, setDraftState] = useState(() => format(current));
  const [draftNumber, setDraftNumberState] = useState(current);
  // Zag and DOM handlers can run several times before React re-renders, so
  // they read and write these mirrors synchronously (as Solid signals do).
  const live = useRef({ draft, draftNumber, current, internal });
  live.current.current = controlled ? (props.value ?? null) : live.current.internal;
  const setDraft = (text: string, value: number | null) => {
    live.current.draft = text;
    live.current.draftNumber = value;
    setDraftState(text);
    setDraftNumberState(value);
  };
  const initialDraft = useRef(draft).current;

  const outOfRange =
    draftNumber !== null &&
    ((props.min !== undefined && draftNumber < props.min) ||
      (props.max !== undefined && draftNumber > props.max));
  const invalid = !!props.invalid || outOfRange;

  const root = useRef<HTMLDivElement | null>(null);
  const input = useRef<HTMLInputElement | null>(null);
  const composing = useRef(false);
  const resetting = useRef(false);
  const direction = useDirection(root, props.dir);

  const commit = (next: number | null) => {
    if (next === live.current.current) return;
    if (!controlled) {
      live.current.internal = next;
      live.current.current = next;
      setInternal(next);
    }
    props.onValueChange?.(next);
  };

  const api = useNumberInput({
    id: `${id}-root`,
    // Zag prefixes part IDs with "number-input:"; pin the two DDS documents.
    ids: { root: `${id}-root`, input: id },
    // Ark's React hook types dir as coming from LocaleProvider, but spreads
    // these props last, so an explicit direction still reaches Zag.
    ...({ dir: direction } as object),
    locale,
    formatOptions,
    value: draft,
    step: props.step ?? 1,
    // Unset bounds stay absent: Zag's defaults are the safe-integer limits.
    ...(props.min !== undefined ? { min: props.min } : {}),
    ...(props.max !== undefined ? { max: props.max } : {}),
    allowMouseWheel: false,
    clampValueOnBlur: true,
    spinOnPress: true,
    inputMode: fractions ? "decimal" : "numeric",
    disabled: props.disabled,
    readOnly: props.readOnly,
    required: props.required,
    invalid,
    translations: {
      decrementLabel: messages.decrease,
      incrementLabel: messages.increase,
      valueText: (text: string) =>
        text && props.suffix ? `${text} ${props.suffix}` : text,
    },
    onValueChange: (details) => {
      if (resetting.current) return;
      const next = Number.isNaN(details.valueAsNumber)
        ? null
        : details.valueAsNumber;
      setDraft(details.value, next);
      commit(next);
    },
  });

  // A parent-owned value that changes from outside replaces the field text.
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (current === live.current.draftNumber) return;
    setDraft(format(current), current);
  }, [current]);

  // The field is uncontrolled for React (Zag and IME composition write to it
  // directly); a new draft is written only when it actually changes.
  useClientLayoutEffect(() => {
    const field = input.current;
    if (field && field.value !== draft) field.value = draft;
  }, [draft]);

  const defaultValue = props.defaultValue;
  const resetState = useRef({ controlled, value: props.value, defaultValue, format });
  resetState.current = { controlled, value: props.value, defaultValue, format };
  useEffect(() => {
    const form = input.current?.form;
    if (!form) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const reset = (event: Event) => {
      resetting.current = true;
      // A task, not a microtask: after a reset-button click, microtasks run
      // before the browser resets the controls and would be overwritten.
      timer = setTimeout(() => {
        resetting.current = false;
        if (event.defaultPrevented) return;
        const state = resetState.current;
        let next: number | null;
        if (state.controlled) next = state.value ?? null;
        else {
          next = state.defaultValue ?? null;
          live.current.internal = next;
          live.current.current = next;
          setInternal(next);
        }
        const text = state.format(next);
        setDraft(text, next);
        if (input.current) input.current.value = text;
      });
    };
    // Capture runs before Zag's own reset listener, which would emit a change.
    form.addEventListener("reset", reset, { capture: true });
    return () => {
      form.removeEventListener("reset", reset, { capture: true });
      if (timer !== undefined) clearTimeout(timer);
      resetting.current = false;
    };
  }, [props.form]);

  const acceptable = (text: string) => {
    const { group, decimal, minus, affixes } = syntax;
    let decimals = 0;
    for (const char of text) {
      if (char >= "0" && char <= "9") continue;
      if (char === group || (group.trim() === "" && char === " ")) continue;
      if (char === decimal) {
        decimals += 1;
        if (!fractions || decimals > 1) return false;
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
  const acceptableRef = useRef(acceptable);
  acceptableRef.current = acceptable;

  // React's onBeforeInput is synthesized from other events; the native one
  // carries the inserted text for every input method.
  useEffect(() => {
    const field = input.current;
    if (!field) return;
    const beforeInput = (event: InputEvent) => {
      if (composing.current || event.isComposing) return;
      const target = event.currentTarget as HTMLInputElement;
      const data = normalizeNumberText(event.data ?? "");
      const next =
        target.value.slice(0, target.selectionStart ?? target.value.length) +
        data +
        target.value.slice(target.selectionEnd ?? target.value.length);
      if (!acceptableRef.current(normalizeNumberText(next)))
        event.preventDefault();
    };
    field.addEventListener("beforeinput", beforeInput);
    return () => field.removeEventListener("beforeinput", beforeInput);
  }, []);

  const stepBy = (delta: number) => {
    let next = (live.current.draftNumber ?? 0) + delta;
    if (props.min !== undefined) next = Math.max(props.min, next);
    if (props.max !== undefined) next = Math.min(props.max, next);
    api.setValue(next);
  };

  // Keep everything from Zag except the handlers DDS composes below.
  const {
    onKeyDown: zagKeyDown,
    onBeforeInput: _beforeInput,
    onInput: zagInput,
    onBlur: zagBlur,
    value: _value,
    defaultValue: _defaultValue,
    ...inputAttributes
  } = api.getInputProps() as Record<string, unknown> & {
    onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
    onInput?: (event: FormEvent<HTMLInputElement>) => void;
    onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  };

  return (
    <ArkNumberInput.RootProvider
      ref={root}
      value={api}
      className={classes("dds-number-input", props.className)}
      data-label-placement={props.labelPlacement ?? "outside"}
      data-readonly={props.readOnly ? "" : undefined}
      data-stepper={props.stepper === false ? undefined : ""}
    >
      {props.label ? (
        <ArkNumberInput.Label className="dds-number-input__label">
          {props.label}
        </ArkNumberInput.Label>
      ) : null}
      <ArkNumberInput.Control className="dds-number-input__control">
        <input
          {...inputAttributes}
          ref={input}
          className="dds-number-input__field"
          defaultValue={initialDraft}
          placeholder={props.placeholder}
          aria-label={props.label ? undefined : props["aria-label"]}
          aria-labelledby={props.label ? undefined : props["aria-labelledby"]}
          aria-describedby={
            [props.suffix ? suffixId : undefined, props["aria-describedby"]]
              .filter(Boolean)
              .join(" ") || undefined
          }
          onCompositionStart={() => {
            composing.current = true;
          }}
          onCompositionEnd={(event) => {
            composing.current = false;
            // Hand the finished composition to the normal input path.
            event.currentTarget.dispatchEvent(
              new InputEvent("input", { bubbles: true }),
            );
          }}
          onInput={(event) => {
            if (composing.current) return;
            const target = event.currentTarget;
            const normalized = normalizeNumberText(target.value);
            if (!acceptable(normalized)) {
              // Letters, pasted units and the like are refused, not guessed at.
              target.value = live.current.draft;
              return;
            }
            if (normalized !== target.value) {
              const start = target.selectionStart;
              const end = target.selectionEnd;
              target.value = normalized;
              target.setSelectionRange(start, end);
            }
            zagInput?.(event);
          }}
          onKeyDown={(event) => {
            if (props.readOnly || props.disabled) return;
            if (event.nativeEvent.isComposing || event.keyCode === 229) return;
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
            zagKeyDown?.(event);
          }}
          onBlur={(event) => {
            zagBlur?.(event);
            // A parent that declined the typed number gets its own value back.
            const { draftNumber: typed, current: owned } = live.current;
            if (controlled && typed !== owned) setDraft(format(owned), owned);
          }}
        />
        {props.suffix ? (
          <span id={suffixId} className="dds-number-input__suffix">
            {props.suffix}
          </span>
        ) : null}
        {props.stepper !== false ? (
          <span className="dds-number-input__steppers">
            <ArkNumberInput.DecrementTrigger className="dds-number-input__step">
              <StepIcon path={MINUS} />
            </ArkNumberInput.DecrementTrigger>
            <ArkNumberInput.IncrementTrigger className="dds-number-input__step">
              <StepIcon path={PLUS} />
            </ArkNumberInput.IncrementTrigger>
          </span>
        ) : null}
      </ArkNumberInput.Control>
      <input
        type="hidden"
        name={props.name}
        form={props.form}
        value={draftNumber === null ? "" : String(draftNumber)}
        disabled={props.disabled}
      />
    </ArkNumberInput.RootProvider>
  );
}
