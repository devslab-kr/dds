import { useMemo, useState } from "react";
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
const clockIcon = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const matchItem = (item: ChoiceOption, query: string) =>
  matchesTimeQuery(item.value, query);
const commitDraft = (text: string) =>
  text.trim() === "" ? "" : parseTypedTime(text);

/**
 * A time-of-day field: type a time or pick one from the list. Built on the
 * same Ark combobox as Combobox, so list, keyboard and form behavior match.
 */
export function TimePicker({
  value,
  defaultValue,
  onValueChange,
  step,
  placeholder,
  invalid,
  locale,
  messages,
  ...shared
}: TimePickerProps) {
  const initial = normalizeTime(defaultValue ?? "") ?? "";
  const [internal, setInternal] = useState(initial);
  const raw = value ?? internal;
  const canonical = raw === "" ? "" : normalizeTime(raw);
  // A value that is not a time is shown as it came, marked invalid, and never rewritten.
  const current = canonical ?? raw;
  const [draft, setDraft] = useState(current);
  const typed = parseTypedTime(draft);
  const items = useMemo<ChoiceOption[]>(() => {
    const values = new Set(timeOptions(step ?? 10));
    if (canonical) values.add(canonical);
    if (typed) values.add(typed);
    return [...values].sort().map((time) => ({ value: time, label: time }));
  }, [step, canonical, typed]);
  return (
    <Choice
      {...shared}
      searchable
      rootClass="dds-time-picker"
      items={items}
      value={current}
      // Only read when the value is not a listed time (an invalid server value).
      selectedOption={{ value: current, label: current }}
      onValueChange={(next) => {
        if (value === undefined) setInternal(next);
        onValueChange?.(next);
      }}
      onFormReset={() => {
        if (value === undefined) setInternal(initial);
      }}
      // Choice owns the text (a React round-trip per keystroke drops fast typing); mirror it.
      onDraftChange={setDraft}
      matchItem={matchItem}
      commitDraft={commitDraft}
      triggerContent={clockIcon}
      autoHighlight
      centerSelected
      inputMode="numeric"
      virtualization={items.length > VIRTUALIZE_AFTER ? {} : false}
      messages={timeMessages(locale ?? "ko-KR", messages)}
      placeholder={placeholder ?? "HH:MM"}
      invalid={invalid === true || canonical === null}
    />
  );
}
