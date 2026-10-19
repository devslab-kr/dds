import { createMemo, createSignal, splitProps } from "solid-js";
import type { ChoiceOption } from "./choice-types";
import { Choice } from "./internal/choice";
import {
  matchesTimeQuery,
  normalizeTime,
  parseTypedTime,
  timeMessages,
  timeOptions,
  type TimeMessages,
} from "./time-only";
export type { TimeMessages } from "./time-only";

export interface TimePickerProps {
  /** 24-hour "HH:MM" ("" is empty). "HH:MM:SS" is accepted and shown as HH:MM. */
  value?: string;
  defaultValue?: string;
  /** Receives "HH:MM" or "" — only when the person picks, types or clears a time. */
  onValueChange?: (value: string) => void;
  /** Minutes between listed times, from 00:00 (default 10). Typed times off the step are still accepted. */
  step?: number;
  label?: string;
  labelPlacement?: "outside" | "inside" | "hidden";
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  id?: string;
  name?: string;
  form?: string;
  placeholder?: string;
  clearable?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  invalid?: boolean;
  /** Chooses the built-in Korean or English text (default "ko-KR"). */
  locale?: string;
  messages?: TimeMessages;
}

/** Above this many rows the list is virtualized (1-minute steps list 1,440 times). */
const VIRTUALIZE_AFTER = 300;

// The dds-icons "clock" glyph, inlined like DatePicker's calendar so this
// subpath does not pull in the whole icon set.
function ClockIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

/**
 * A time-of-day field: type a time or pick one from the list. Built on the
 * same Ark combobox as Combobox, so list, keyboard and form behavior match.
 */
export function TimePicker(props: TimePickerProps) {
  const [local, shared] = splitProps(props, [
    "value",
    "defaultValue",
    "onValueChange",
    "step",
    "placeholder",
    "invalid",
    "locale",
    "messages",
  ]);
  const initial = () => normalizeTime(local.defaultValue ?? "") ?? "";
  const [internal, setInternal] = createSignal(initial());
  const raw = () => local.value ?? internal();
  const canonical = () => (raw() === "" ? "" : normalizeTime(raw()));
  // A value that is not a time is shown as it came, marked invalid, and never rewritten.
  const current = () => canonical() ?? raw();
  const [draft, setDraft] = createSignal(current());
  const items = createMemo<ChoiceOption[]>(() => {
    const values = new Set(timeOptions(local.step ?? 10));
    const selected = canonical(),
      typed = parseTypedTime(draft());
    if (selected) values.add(selected);
    if (typed) values.add(typed);
    return [...values].sort().map((value) => ({ value, label: value }));
  });
  return (
    <Choice
      {...shared}
      searchable
      rootClass="dds-time-picker"
      items={items()}
      value={current()}
      // Only read when the value is not a listed time (an invalid server value).
      selectedOption={{ value: current(), label: current() }}
      onValueChange={(next) => {
        if (local.value === undefined) setInternal(next);
        local.onValueChange?.(next);
      }}
      onFormReset={() => {
        if (local.value === undefined) setInternal(initial());
      }}
      inputValue={draft()}
      onInputValueChange={setDraft}
      matchItem={(item, query) => matchesTimeQuery(item.value, query)}
      commitDraft={(text) => (text.trim() === "" ? "" : parseTypedTime(text))}
      triggerContent={() => <ClockIcon />}
      autoHighlight
      centerSelected
      inputMode="numeric"
      virtualization={items().length > VIRTUALIZE_AFTER ? {} : false}
      messages={timeMessages(local.locale ?? "ko-KR", local.messages)}
      placeholder={local.placeholder ?? "HH:MM"}
      invalid={local.invalid === true || canonical() === null}
    />
  );
}
