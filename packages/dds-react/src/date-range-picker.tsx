import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  DatePicker as ArkDatePicker,
  parseDate,
  type DateValue,
} from "@ark-ui/react/date-picker";
import { Portal } from "@ark-ui/react/portal";
import { Button } from "./controls";
import { CalendarView } from "./calendar-view";
import {
  canonicalInput,
  displayDate,
  isCalendarDate,
  isKorean,
  rangeMessages,
  validateRange,
  type DateRange,
  type DateRangeMessages,
} from "./date-only";
export type {
  DateRange,
  DateRangeMessages,
  DateRangeValidity,
} from "./date-only";

/** A consumer-supplied shortcut shown in the calendar footer. DDS ships no built-in list. */
export interface DateRangePreset {
  label: string;
  value: DateRange;
}

export interface DateRangePickerProps {
  label?: string;
  /** Two inputs share one field label; "inside" is not offered. */
  labelPlacement?: "outside" | "hidden";
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  /** Id of the start input; the end input receives `${id}-end`. */
  id?: string;
  value?: DateRange;
  defaultValue?: DateRange;
  /** Called on user changes only, with YYYY-MM-DD or "" on each side; never with start after end. */
  onValueChange?: (next: DateRange) => void;
  locale?: string;
  timeZone?: string;
  min?: string;
  max?: string;
  startOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  messages?: DateRangeMessages;
  clearable?: boolean;
  presets?: DateRangePreset[];
  /** Both dates are required. */
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
  /** Form field name submitting the start date (YYYY-MM-DD or ""). */
  startName?: string;
  /** Form field name submitting the end date (YYYY-MM-DD or ""). */
  endName?: string;
  form?: string;
}

const EMPTY: DateRange = { start: "", end: "" };
const same = (a: DateRange, b: DateRange) =>
  a.start === b.start && a.end === b.end;
const describedBy = (...ids: Array<string | false | null | undefined>) =>
  ids.filter(Boolean).join(" ") || undefined;

function selectionOf(range: DateRange): DateValue[] {
  if (!isCalendarDate(range.start)) return [];
  const start = parseDate(range.start);
  return isCalendarDate(range.end) && range.start <= range.end
    ? [start, parseDate(range.end)]
    : [start];
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

type Drafts = DateRange & { locale: string };

export function DateRangePicker(props: DateRangePickerProps) {
  const locale = props.locale ?? "ko-KR",
    generated = useId(),
    id = props.id ?? `dds-date-range-${generated}`,
    endId = `${id}-end`,
    labelId = `${id}-label`,
    errorId = `${id}-error`;
  const text = rangeMessages(locale, props.messages);
  const [internal, setInternal] = useState<DateRange>(
    () => props.defaultValue ?? EMPTY,
  );
  const value = props.value ?? internal;
  const display = (range: DateRange, at = locale) => ({
    start: displayDate(range.start, at),
    end: displayDate(range.end, at),
  });
  // Drafts keep their formatting locale so a locale change re-displays complete dates only.
  const [initialDrafts] = useState<Drafts>(() => ({
    ...display(value),
    locale,
  }));
  const draftRef = useRef(initialDrafts);
  const [, setDraftVersion] = useState(0);
  const relocalize = (draft: string, from: string) => {
    const canonical = canonicalInput(draft, from);
    return from !== locale && isCalendarDate(canonical)
      ? displayDate(canonical, locale)
      : draft;
  };
  const currentDrafts = (): DateRange => ({
    start: relocalize(draftRef.current.start, draftRef.current.locale),
    end: relocalize(draftRef.current.end, draftRef.current.locale),
  });
  const drafts = currentDrafts();
  const setDrafts = (next: DateRange) => {
    draftRef.current = { ...next, locale };
    setDraftVersion((version) => version + 1);
  };
  const [selection, setSelection] = useState(() => selectionOf(value));
  const [open, setOpen] = useState(false);
  const startRef = useRef<HTMLInputElement>(null),
    endRef = useRef<HTMLInputElement>(null),
    triggerRef = useRef<HTMLButtonElement>(null),
    emitted = useRef(value),
    focusFrame = useRef<number | undefined>(undefined);
  const [portalMount, setPortalMount] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const input = startRef.current;
    if (input)
      setPortalMount(
        input.closest<HTMLElement>('[role="dialog"], [role="alertdialog"]') ??
          input.ownerDocument.body,
      );
  }, []);
  const blocked = Boolean(props.disabled || props.readOnly);
  const validity = validateRange(
    drafts.start,
    drafts.end,
    props.required ?? false,
    props.min,
    props.max,
    locale,
  );
  const messageFor = (reason: string) =>
    reason === "required"
      ? text.required
      : reason === "order"
        ? text.order
        : text.invalid;
  const error = validity.valid ? undefined : messageFor(validity.reason);
  const startInvalid = Boolean(props.invalid) || !validity.start.valid;
  const endInvalid =
    Boolean(props.invalid) ||
    !validity.end.valid ||
    validity.reason === "order";
  const fieldName = props.label ?? props["aria-label"] ?? "";
  // Handlers registered once (form reset, frames) read the latest render through this ref.
  const latest = useRef({ props, locale, blocked, display });
  latest.current = { props, locale, blocked, display };

  useEffect(() => {
    if (same(value, emitted.current)) return;
    emitted.current = { start: value.start, end: value.end };
    setDrafts(display(emitted.current));
    setSelection(selectionOf(emitted.current));
  }, [value.start, value.end]);
  const startMessage = validity.start.valid
    ? ""
    : messageFor(validity.start.reason);
  const endMessage = !validity.end.valid
    ? messageFor(validity.end.reason)
    : validity.reason === "order"
      ? text.order
      : "";
  useEffect(() => {
    startRef.current?.setCustomValidity(startMessage);
    endRef.current?.setCustomValidity(endMessage);
  }, [startMessage, endMessage]);
  useEffect(() => {
    if (!blocked) return;
    setOpen(false);
    if (focusFrame.current !== undefined)
      cancelAnimationFrame(focusFrame.current);
  }, [blocked]);
  // Resolve the owning form when a reset happens: the field may mount before it joins its form.
  useEffect(() => {
    const doc = startRef.current?.ownerDocument;
    if (!doc) return;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const reset = (event: Event) => {
      const { props: now } = latest.current;
      const form = now.form
        ? doc.getElementById(now.form)
        : startRef.current?.form;
      if (!form || event.target !== form) return;
      // A task, not a microtask: a user-triggered reset runs its listeners before rewriting the controls.
      const timer = setTimeout(() => {
        timers.delete(timer);
        if (event.defaultPrevented) return;
        const current = latest.current;
        const next = current.props.value ?? current.props.defaultValue ?? EMPTY;
        emitted.current = next;
        if (current.props.value === undefined) setInternal(next);
        const shown = current.display(next, current.locale);
        draftRef.current = { ...shown, locale: current.locale };
        setDraftVersion((version) => version + 1);
        setSelection(selectionOf(next));
        // Native reset rewrote the visible inputs; the drafts may not have changed.
        if (startRef.current) startRef.current.value = shown.start;
        if (endRef.current) endRef.current.value = shown.end;
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
  function commit(next: DateRange) {
    if (blocked) return;
    setSelection(selectionOf(next));
    if (same(next, emitted.current)) return;
    emitted.current = next;
    if (props.value === undefined) setInternal(next);
    props.onValueChange?.(next);
  }
  /** Committing ignores `required` like DatePicker: an emptied side is still reported. */
  function changeDraft(side: "start" | "end", typed: string) {
    if (blocked) return;
    const next = { ...currentDrafts(), [side]: typed };
    const loose = validateRange(
      next.start,
      next.end,
      false,
      props.min,
      props.max,
      locale,
    );
    const part = loose[side];
    if (part.valid) next[side] = displayDate(part.value ?? "", locale);
    setDrafts(next);
    if (loose.valid) commit(loose.value!);
  }
  function choose(range: DateRange) {
    setDrafts(display(range));
    commit(range);
  }
  const presets = (props.presets ?? []).map((preset) => {
    const checked = validateRange(
      preset.value.start,
      preset.value.end,
      false,
      props.min,
      props.max,
      "en-US",
    );
    return {
      label: preset.label,
      disabled: !checked.valid,
      onSelect: () => {
        if (blocked || !checked.valid) return;
        choose(checked.value!);
        setOpen(false);
        focusAfterClose(() => endRef.current);
      },
    };
  });
  const dialogMount = !!portalMount?.matches(
    '[role="dialog"], [role="alertdialog"]',
  );
  const placeholder = isKorean(locale) ? "YYYY/MM/DD" : "YYYY-MM-DD";
  const stopEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  return (
    <div
      className={`dds-field dds-date-picker dds-date-range-picker dds-date-picker--${props.labelPlacement ?? "outside"}${error ? " dds-field--error" : ""}`}
      role="group"
      aria-labelledby={
        props["aria-labelledby"] ?? (props.label ? labelId : undefined)
      }
      aria-label={
        props.label || props["aria-labelledby"] ? undefined : props["aria-label"]
      }
      data-filled={drafts.start !== "" || drafts.end !== "" ? "true" : undefined}
      data-invalid={startInvalid || endInvalid ? "" : undefined}
      data-disabled={props.disabled ? "" : undefined}
    >
      {props.label && (
        <label id={labelId} className="dds-field__label" htmlFor={id}>
          {props.label}
          {props.required && <span aria-hidden="true"> *</span>}
        </label>
      )}
      <ArkDatePicker.Root
        locale={locale}
        timeZone={props.timeZone ?? "Asia/Seoul"}
        selectionMode="range"
        disabled={props.disabled}
        readOnly={props.readOnly}
        required={props.required}
        invalid={Boolean(props.invalid) || !validity.valid}
        open={open && !blocked}
        onOpenChange={(details) => {
          setOpen(details.open && !blocked);
          // A half-chosen period is not a value: closing restores the committed one.
          if (!details.open) setSelection(selectionOf(emitted.current));
        }}
        min={
          props.min && isCalendarDate(props.min)
            ? parseDate(props.min)
            : undefined
        }
        max={
          props.max && isCalendarDate(props.max)
            ? parseDate(props.max)
            : undefined
        }
        startOfWeek={props.startOfWeek ?? 0}
        minView="day"
        maxView="day"
        fixedWeeks
        translations={{
          dayCell: (state) => text.selectDate(state.valueText),
          clearTrigger: text.clear,
        }}
        value={selection}
        onValueChange={(details) => {
          if (blocked) return;
          setSelection(details.value);
          if (details.value.length < 2) return;
          const [start, end] = details.value
            .map((day) => day.toString())
            .sort();
          const checked = validateRange(
            start!,
            end!,
            false,
            props.min,
            props.max,
            "en-US",
          );
          if (!checked.valid) return;
          choose(checked.value!);
          focusAfterClose(() => endRef.current);
        }}
        positioning={{
          placement: "bottom-start",
          gutter: 8,
          strategy: dialogMount ? "fixed" : "absolute",
          hideWhenDetached: dialogMount,
        }}
      >
        <ArkDatePicker.Control className="dds-date-picker-control">
          <div
            className="dds-date-range-box"
            data-invalid={startInvalid || endInvalid ? "" : undefined}
            data-disabled={props.disabled ? "" : undefined}
          >
            <input
              type="text"
              className="dds-date-range-input"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder={placeholder}
              id={id}
              ref={startRef}
              form={props.form}
              aria-label={text.startLabel}
              aria-invalid={startInvalid ? "true" : undefined}
              aria-required={props.required ? "true" : undefined}
              aria-describedby={describedBy(
                props["aria-describedby"],
                error && errorId,
              )}
              value={drafts.start}
              onChange={() => {}}
              required={props.required}
              readOnly={props.readOnly}
              disabled={props.disabled}
              onInputCapture={(event) => {
                event.stopPropagation();
                changeDraft("start", event.currentTarget.value);
              }}
              onKeyDown={stopEnter}
            />
            <span className="dds-date-range-separator" aria-hidden="true">
              ~
            </span>
            <input
              type="text"
              className="dds-date-range-input"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder={placeholder}
              id={endId}
              ref={endRef}
              form={props.form}
              aria-label={text.endLabel}
              aria-invalid={endInvalid ? "true" : undefined}
              aria-required={props.required ? "true" : undefined}
              aria-describedby={describedBy(
                props["aria-describedby"],
                error && errorId,
              )}
              value={drafts.end}
              onChange={() => {}}
              required={props.required}
              readOnly={props.readOnly}
              disabled={props.disabled}
              onInputCapture={(event) => {
                event.stopPropagation();
                changeDraft("end", event.currentTarget.value);
              }}
              onKeyDown={stopEnter}
            />
          </div>
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
              className="dds-date-picker-content dds-date-range-content"
              aria-label={`${fieldName} ${text.chooseRange}`.trim()}
            >
              <CalendarView
                timeZone={props.timeZone}
                min={props.min}
                max={props.max}
                locale={locale}
                messages={text}
                disabled={props.disabled}
                readOnly={props.readOnly}
                showToday={false}
                showClear={props.clearable}
                presets={presets}
                presetsLabel={text.presets}
                onClear={() => choose(EMPTY)}
              />
            </ArkDatePicker.Content>
          </ArkDatePicker.Positioner>
        </Portal>
      </ArkDatePicker.Root>
      {props.startName && (
        <input
          type="hidden"
          name={props.startName}
          form={props.form}
          value={value.start}
          disabled={props.disabled}
        />
      )}
      {props.endName && (
        <input
          type="hidden"
          name={props.endName}
          form={props.form}
          value={value.end}
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
