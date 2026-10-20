import { useEffect, useId, useRef, useState } from "react";
import {
  DatePicker as ArkDatePicker,
  parseDate,
  type DateValue,
} from "@ark-ui/react/date-picker";
import { Portal } from "@ark-ui/react/portal";
import { Button } from "./controls";
import { CalendarView } from "./calendar-view";
import {
  canonicalMonth,
  displayMonth,
  isCalendarMonth,
  isKorean,
  monthBounds,
  monthMessages,
  validateMonth,
  type MonthPickerMessages,
} from "./date-only";
export type { MonthPickerMessages, MonthPickerValidity } from "./date-only";

export interface MonthPickerProps {
  label?: string;
  labelPlacement?: "outside" | "inside" | "hidden";
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  id?: string;
  /** YYYY-MM or "" (no month). */
  value?: string;
  defaultValue?: string;
  /** Called on user changes only, with YYYY-MM or "". */
  onValueChange?: (next: string) => void;
  locale?: string;
  /** Decides the current month for "This month" and its marker. */
  timeZone?: string;
  /** Inclusive YYYY-MM bounds. */
  min?: string;
  max?: string;
  messages?: MonthPickerMessages;
  clearable?: boolean;
  showThisMonth?: boolean;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
  /** Form field name submitting YYYY-MM (or ""), never the display text. */
  name?: string;
  form?: string;
}

const selectionOf = (month: string): DateValue[] =>
  isCalendarMonth(month) ? [parseDate(`${month}-01`)] : [];
const describedBy = (...ids: Array<string | false | null | undefined>) =>
  ids.filter(Boolean).join(" ") || undefined;

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

export function MonthPicker(props: MonthPickerProps) {
  const locale = props.locale ?? "ko-KR",
    generated = useId(),
    id = props.id ?? `dds-month-${generated}`,
    errorId = `${id}-error`;
  const text = monthMessages(locale, props.messages);
  const [internal, setInternal] = useState(() => props.defaultValue ?? "");
  const value = props.value ?? internal;
  // The draft keeps its formatting locale so a locale change re-displays complete months only.
  const [initialDraft] = useState(() => ({
    text: displayMonth(value, locale),
    locale,
  }));
  const draftRef = useRef(initialDraft);
  const [, setDraftVersion] = useState(0);
  const currentDraft = () => {
    const state = draftRef.current,
      canonical = canonicalMonth(state.text);
    return state.locale !== locale && isCalendarMonth(canonical)
      ? displayMonth(canonical, locale)
      : state.text;
  };
  const draft = currentDraft();
  const setDraft = (next: string) => {
    draftRef.current = { text: next, locale };
    setDraftVersion((version) => version + 1);
  };
  const [selection, setSelection] = useState(() => selectionOf(value));
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null),
    triggerRef = useRef<HTMLButtonElement>(null),
    emitted = useRef(value),
    focusFrame = useRef<number | undefined>(undefined);
  const [portalMount, setPortalMount] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const input = inputRef.current;
    if (input)
      setPortalMount(
        input.closest<HTMLElement>('[role="dialog"], [role="alertdialog"]') ??
          input.ownerDocument.body,
      );
  }, []);
  const blocked = Boolean(props.disabled || props.readOnly);
  const bounds = monthBounds(props.min, props.max);
  const validity = validateMonth(
    draft,
    props.required ?? false,
    props.min,
    props.max,
  );
  const error = validity.valid
    ? undefined
    : validity.reason === "required"
      ? text.required
      : text.invalid;
  const invalid = Boolean(props.invalid) || !validity.valid;
  const fieldName = props.label ?? props["aria-label"] ?? "";
  // Handlers registered once (form reset, frames) read the latest render through this ref.
  const latest = useRef({ props, locale, blocked });
  latest.current = { props, locale, blocked };

  useEffect(() => {
    if (value === emitted.current) return;
    emitted.current = value;
    setDraft(displayMonth(value, locale));
    setSelection(selectionOf(value));
  }, [value]);
  useEffect(() => {
    inputRef.current?.setCustomValidity(error ?? "");
  }, [error]);
  useEffect(() => {
    if (!blocked) return;
    setOpen(false);
    if (focusFrame.current !== undefined)
      cancelAnimationFrame(focusFrame.current);
  }, [blocked]);
  // Resolve the owning form when a reset happens: the field may mount before it joins its form.
  useEffect(() => {
    const doc = inputRef.current?.ownerDocument;
    if (!doc) return;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const reset = (event: Event) => {
      const { props: now } = latest.current;
      const form = now.form
        ? doc.getElementById(now.form)
        : inputRef.current?.form;
      if (!form || event.target !== form) return;
      // A task, not a microtask: a user-triggered reset runs its listeners before rewriting the controls.
      const timer = setTimeout(() => {
        timers.delete(timer);
        if (event.defaultPrevented) return;
        const current = latest.current;
        const next = current.props.value ?? current.props.defaultValue ?? "";
        emitted.current = next;
        if (current.props.value === undefined) setInternal(next);
        const shown = displayMonth(next, current.locale);
        draftRef.current = { text: shown, locale: current.locale };
        setDraftVersion((version) => version + 1);
        setSelection(selectionOf(next));
        // Native reset rewrote the visible input; the draft may not have changed.
        if (inputRef.current) inputRef.current.value = shown;
      }, 0);
      timers.add(timer);
    };
    doc.addEventListener("reset", reset, true);
    return () => {
      doc.removeEventListener("reset", reset, true);
      for (const timer of timers) clearTimeout(timer);
    };
  }, []);
  useEffect(
    () => () => {
      if (focusFrame.current !== undefined)
        cancelAnimationFrame(focusFrame.current);
    },
    [],
  );

  function focusSoon(target: () => HTMLElement | null, frames = 1) {
    if (focusFrame.current !== undefined)
      cancelAnimationFrame(focusFrame.current);
    const run = (left: number) => {
      focusFrame.current = requestAnimationFrame(() => {
        if (left > 1) return run(left - 1);
        focusFrame.current = undefined;
        if (!latest.current.blocked) target()?.focus({ preventScroll: true });
      });
    };
    run(frames);
  }
  // Ark returns focus to its trigger once it sees the calendar closed; move it on after that.
  const pendingFocus = useRef<(() => HTMLElement | null) | null>(null);
  function focusAfterClose(target: () => HTMLElement | null) {
    // If the calendar stays open (This month), move focus now as well.
    pendingFocus.current = target;
    focusSoon(target, 2);
  }
  useEffect(() => {
    const target = pendingFocus.current;
    // Ark sees the closed prop in this same commit and schedules its own focus one frame out.
    if (open || !target) return;
    pendingFocus.current = null;
    focusSoon(target, 2);
  }, [open]);
  function commit(next: string) {
    if (blocked) return;
    setSelection(selectionOf(next));
    if (next === emitted.current) return;
    emitted.current = next;
    if (props.value === undefined) setInternal(next);
    props.onValueChange?.(next);
  }
  /** Committing ignores `required` like DatePicker: an emptied field is still reported. */
  function changeDraft(typed: string) {
    if (blocked) return;
    const state = validateMonth(typed, false, props.min, props.max);
    setDraft(state.valid ? displayMonth(state.value ?? "", locale) : typed);
    if (state.valid) commit(state.value ?? "");
  }
  const dialogMount = !!portalMount?.matches(
    '[role="dialog"], [role="alertdialog"]',
  );

  return (
    <div
      className={`dds-field dds-date-picker dds-month-picker dds-date-picker--${props.labelPlacement ?? "outside"}${error ? " dds-field--error" : ""}`}
      data-filled={draft !== "" ? "true" : undefined}
      data-invalid={invalid ? "" : undefined}
      data-disabled={props.disabled ? "" : undefined}
      role="group"
    >
      {props.label && (
        <label className="dds-field__label" htmlFor={id}>
          {props.label}
          {props.required && <span aria-hidden="true"> *</span>}
        </label>
      )}
      <ArkDatePicker.Root
        locale={locale}
        timeZone={props.timeZone ?? "Asia/Seoul"}
        disabled={props.disabled}
        readOnly={props.readOnly}
        required={props.required}
        invalid={invalid}
        open={open && !blocked}
        onOpenChange={(details) => {
          setOpen(details.open && !blocked);
          if (!details.open) setSelection(selectionOf(emitted.current));
        }}
        min={bounds.min ? parseDate(bounds.min) : undefined}
        max={bounds.max ? parseDate(bounds.max) : undefined}
        minView="month"
        maxView="month"
        defaultView="month"
        translations={{ clearTrigger: text.clear }}
        value={selection}
        onValueChange={(details) => {
          if (blocked) return;
          const next = details.value[0]?.toString().slice(0, 7) ?? "";
          if (
            next !== "" &&
            !validateMonth(next, false, props.min, props.max).valid
          )
            return;
          setDraft(displayMonth(next, locale));
          commit(next);
          focusAfterClose(() => inputRef.current);
        }}
        positioning={{
          placement: "bottom-start",
          gutter: 8,
          strategy: dialogMount ? "fixed" : "absolute",
          hideWhenDetached: dialogMount,
        }}
      >
        <ArkDatePicker.Control
          className="dds-date-picker-control"
          data-filled={draft !== "" ? "true" : undefined}
        >
          <input
            id={id}
            ref={inputRef}
            form={props.form}
            aria-label={props.label ? undefined : props["aria-label"]}
            aria-labelledby={props["aria-labelledby"]}
            aria-invalid={invalid ? "true" : undefined}
            aria-required={props.required ? "true" : undefined}
            aria-describedby={describedBy(
              props["aria-describedby"],
              error && errorId,
            )}
            type="text"
            value={draft}
            onChange={() => {}}
            required={props.required}
            readOnly={props.readOnly}
            disabled={props.disabled}
            placeholder={isKorean(locale) ? "YYYY/MM" : "YYYY-MM"}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            onInputCapture={(event) => {
              event.stopPropagation();
              changeDraft(event.currentTarget.value);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                event.preventDefault();
                event.stopPropagation();
              }
            }}
          />
          <ArkDatePicker.Trigger asChild>
            <Button
              ref={triggerRef}
              type="button"
              tone="secondary"
              aria-label={`${fieldName} ${text.openCalendar}`.trim()}
            >
              <CalendarIcon />
            </Button>
          </ArkDatePicker.Trigger>
        </ArkDatePicker.Control>
        <Portal container={portalMount ? { current: portalMount } : undefined}>
          <ArkDatePicker.Positioner className="dds-date-picker-positioner">
            <ArkDatePicker.Content
              onKeyDownCapture={(event) => {
                if (event.key !== "Escape") return;
                pendingFocus.current = null;
                focusSoon(() => triggerRef.current, 2);
              }}
              className="dds-date-picker-content dds-month-picker-content"
              aria-label={`${fieldName} ${text.chooseMonth}`.trim()}
            >
              <CalendarView
                view="month"
                timeZone={props.timeZone}
                min={bounds.min}
                max={bounds.max}
                locale={locale}
                messages={text}
                disabled={props.disabled}
                readOnly={props.readOnly}
                showToday={props.showThisMonth}
                showClear={props.clearable}
                onClear={() => {
                  setDraft("");
                  commit("");
                }}
              />
            </ArkDatePicker.Content>
          </ArkDatePicker.Positioner>
        </Portal>
      </ArkDatePicker.Root>
      {props.name && (
        <input
          type="hidden"
          name={props.name}
          form={props.form}
          value={value}
          disabled={props.disabled}
        />
      )}
      {error && (
        <span id={errorId} className="dds-field__error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
