import { useEffect, useRef, useState } from "react";
import {
  DatePicker as ArkDatePicker,
  parseDate,
} from "@ark-ui/react/date-picker";
import { Portal } from "@ark-ui/react/portal";
import { Button, Field } from "./controls";
import { CalendarView } from "./calendar-view";
import {
  isCalendarDate,
  isKorean,
  displayDate,
  canonicalInput,
  validateInput,
  dateMessages,
  type CalendarMessages,
  type DatePickerValidity,
} from "./date-only";
export type { DatePickerValidity, CalendarMessages } from "./date-only";

export interface DatePickerProps {
  label: string;
  /** ISO calendar date (YYYY-MM-DD), or an empty string. */
  value: string;
  onChange: (value: string) => void;
  locale?: string;
  timeZone?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  /** Initial mount and semantic draft changes, deduped across callback identity changes. Key by editor identity for a fresh initial report. Button/API saves must guard validity and use its canonical value. */
  onValidityChange?: (state: DatePickerValidity) => void;
  min?: string;
  max?: string;
  startOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  labelPlacement?: "outside" | "inside" | "hidden";
  messages?: CalendarMessages;
  clearable?: boolean;
  showToday?: boolean;
}
function CalendarIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <rect x="3.5" y="5.5" width="17" height="15" rx="2" />
      <path d="M7.5 3v5M16.5 3v5M3.5 10.5h17" />
    </svg>
  );
}
function calendarSelection(value: string) {
  return isCalendarDate(value) ? [parseDate(value)] : [];
}

export function DatePicker({
  label,
  value,
  onChange,
  locale = "ko-KR",
  timeZone = "Asia/Seoul",
  disabled = false,
  readOnly = false,
  required = false,
  onValidityChange,
  min,
  max,
  startOfWeek = 0,
  labelPlacement = "outside",
  messages,
  clearable = true,
  showToday = true,
}: DatePickerProps) {
  const [draft, setDraft] = useState(() => displayDate(value, locale));
  const [selection, setSelection] = useState(() => calendarSelection(value));
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const escapeFrame = useRef<number | undefined>(undefined);
  useEffect(
    () => () => {
      if (escapeFrame.current !== undefined)
        cancelAnimationFrame(escapeFrame.current);
    },
    [],
  );
  const [portalMount, setPortalMount] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const input = inputRef.current;
    if (input) {
      // A modal hides its body siblings from assistive technology. Keep the
      // calendar within that modal while preserving the server Portal boundary.
      setPortalMount(
        input.closest<HTMLElement>('[role="dialog"], [role="alertdialog"]') ??
          input.ownerDocument.body,
      );
    }
  }, []);
  const restoreInputFocus = useRef(false);
  const observedValue = useRef(value);
  const observedLocale = useRef(locale);
  // Every outstanding emission is retained, including repeated B/C/B values.
  // Entries end on acknowledgement, an unmatched external reset, or unmount.
  const pendingEchoes = useRef<string[]>([]);
  const emittedValue = useRef(value);
  const notified = useRef("");
  // Convert a complete draft before reporting validity in the new locale.
  const canonicalDraft = canonicalInput(draft, observedLocale.current);
  const effectiveDraft =
    observedLocale.current !== locale && isCalendarDate(canonicalDraft)
      ? displayDate(canonicalDraft, locale)
      : draft;
  const validity = validateInput(effectiveDraft, required, min, max, locale);
  const text = dateMessages(locale, messages);
  const error = validity.valid
    ? undefined
    : validity.reason === "required"
      ? text.required
      : text.invalid;
  useEffect(() => {
    const previousLocale = observedLocale.current;
    observedLocale.current = locale;
    if (observedValue.current === value) {
      if (previousLocale !== locale) setDraft(effectiveDraft);
      return;
    }
    observedValue.current = value;
    // A matched outstanding value is an acknowledgement, not a draft reset.
    const acknowledged = pendingEchoes.current.indexOf(value);
    if (acknowledged !== -1) {
      pendingEchoes.current.splice(acknowledged, 1);
      return;
    }
    pendingEchoes.current = [];
    emittedValue.current = value;
    setDraft(displayDate(value, locale));
    if (value === "" || isCalendarDate(value))
      setSelection(calendarSelection(value));
  }, [value, locale]);
  useEffect(() => {
    inputRef.current?.setCustomValidity(error ?? "");
    const key = JSON.stringify(validity);
    if (onValidityChange && notified.current !== key) {
      notified.current = key;
      onValidityChange(validity);
    }
  }, [draft, required, min, max, locale, error, onValidityChange]);
  useEffect(() => {
    if (disabled || readOnly) {
      restoreInputFocus.current = false;
      setOpen(false);
    }
  }, [disabled, readOnly]);
  // Ark's calendar restores focus to its trigger when it does not own an Input.
  // Return to the DDS input after that calendar frame; cancel on lock/unmount.
  useEffect(() => {
    if (!restoreInputFocus.current || disabled || readOnly) return;
    const frame = requestAnimationFrame(() => {
      restoreInputFocus.current = false;
      inputRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [open, selection, disabled, readOnly]);
  function commit(next: string) {
    const state = validateInput(next, required, min, max, locale);
    if (next !== "" && !state.valid) return;
    const canonical = next === "" ? "" : state.value!;
    setSelection(calendarSelection(canonical));
    // Blur/Enter must not emit the same local commit again while props lag.
    if (canonical !== emittedValue.current) {
      emittedValue.current = canonical;
      pendingEchoes.current.push(canonical);
      onChange(canonical);
    }
  }
  function changeDraft(next: string) {
    setDraft(next);
    const state = validateInput(next, required, min, max, locale);
    // Native form submission and callback-based saves both see this edit.
    inputRef.current?.setCustomValidity(
      state.valid ? "" : (error ?? "Enter a valid date (YYYY-MM-DD)."),
    );
    if (next === "" || state.valid) {
      setDraft(displayDate(state.value ?? "", locale));
      commit(next);
    }
  }
  return (
    <Field
      label={label}
      required={required}
      error={error}
      className={`dds-date-picker dds-date-picker--${labelPlacement}`}
      data-filled={effectiveDraft !== "" ? "true" : undefined}
    >
      {(control) => (
        <ArkDatePicker.Root
          locale={locale}
          timeZone={timeZone}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          invalid={!validity.valid}
          open={open && !disabled && !readOnly}
          onOpenChange={(details) =>
            setOpen(details.open && !disabled && !readOnly)
          }
          min={min && isCalendarDate(min) ? parseDate(min) : undefined}
          max={max && isCalendarDate(max) ? parseDate(max) : undefined}
          startOfWeek={startOfWeek}
          minView="day"
          maxView="day"
          fixedWeeks
          translations={{
            dayCell: (state) => text.selectDate(state.valueText),
            clearTrigger: text.clear,
          }}
          value={selection}
          format={(v) => displayDate(v.toString(), locale)}
          onValueChange={(details) => {
            const next = details.value[0]?.toString() || "";
            if (
              next !== "" &&
              !validateInput(next, required, min, max, locale).valid
            )
              return;
            restoreInputFocus.current = true;
            setDraft(displayDate(next, locale));
            commit(next);
          }}
          positioning={{
            placement: "bottom-start",
            gutter: 8,
            strategy: portalMount?.matches(
              '[role="dialog"], [role="alertdialog"]',
            )
              ? "fixed"
              : "absolute",
            hideWhenDetached: !!portalMount?.matches(
              '[role="dialog"], [role="alertdialog"]',
            ),
          }}
        >
          {/* DDS owns the raw text input; Ark owns calendar interaction, not draft DOM writes. */}
          <ArkDatePicker.Control className="dds-date-picker-control">
            <input
              {...control}
              ref={inputRef}
              type="text"
              value={effectiveDraft}
              onChange={() => {}}
              required={required}
              readOnly={readOnly}
              disabled={disabled}
              placeholder={isKorean(locale) ? "YYYY/MM/DD" : "YYYY-MM-DD"}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              onInputCapture={(event) => {
                if (disabled || readOnly) return;
                event.stopPropagation();
                changeDraft(event.currentTarget.value);
              }}
              onBlur={() => {
                if (!disabled && !readOnly) commit(effectiveDraft);
              }}
              onKeyDownCapture={(event) => {
                if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  event.stopPropagation();
                  if (!disabled && !readOnly) commit(effectiveDraft);
                }
              }}
            />
            <ArkDatePicker.Trigger asChild>
              <Button
                ref={triggerRef}
                type="button"
                tone="secondary"
                aria-label={`${label} ${text.openCalendar}`}
              >
                <CalendarIcon />
              </Button>
            </ArkDatePicker.Trigger>
          </ArkDatePicker.Control>
          <Portal
            container={portalMount ? { current: portalMount } : undefined}
          >
            <ArkDatePicker.Positioner className="dds-date-picker-positioner">
              <ArkDatePicker.Content
                onKeyDownCapture={(event) => {
                  if (event.key !== "Escape") return;
                  restoreInputFocus.current = false;
                  if (escapeFrame.current !== undefined)
                    cancelAnimationFrame(escapeFrame.current);
                  escapeFrame.current = requestAnimationFrame(() => {
                    escapeFrame.current = requestAnimationFrame(() => {
                      if (!disabled && !readOnly)
                        triggerRef.current?.focus({ preventScroll: true });
                    });
                  });
                }}
                className="dds-date-picker-content"
                aria-label={`${label} 날짜 선택`}
              >
                <CalendarView
                  timeZone={timeZone}
                  min={min}
                  max={max}
                  locale={locale}
                  messages={messages}
                  disabled={disabled}
                  readOnly={readOnly}
                  showToday={showToday}
                  showClear={clearable}
                  onClear={() => {
                    setDraft("");
                    commit("");
                  }}
                />
              </ArkDatePicker.Content>
            </ArkDatePicker.Positioner>
          </Portal>
        </ArkDatePicker.Root>
      )}
    </Field>
  );
}
