import {
  DatePicker as ArkDatePicker,
  parseDate,
  type DateValue,
} from "@ark-ui/solid/date-picker";
import { Portal } from "solid-js/web";
import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  on,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { CalendarView } from "./calendar-view";
import { createControllableSignal } from "./controllable";
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
import { describedBy } from "./utils";
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
      stroke-width="1.5"
      aria-hidden="true"
    >
      <rect x="3.5" y="5.5" width="17" height="15" rx="2" />
      <path d="M7.5 3v5M16.5 3v5M3.5 10.5h17" />
    </svg>
  );
}

export function DateRangePicker(props: DateRangePickerProps) {
  const locale = () => props.locale ?? "ko-KR",
    id = props.id ?? `dds-date-range-${createUniqueId()}`,
    endId = `${id}-end`,
    labelId = `${id}-label`,
    errorId = `${id}-error`;
  const text = () => rangeMessages(locale(), props.messages);
  const [value, setValue] = createControllableSignal<DateRange>({
    value: () => props.value,
    defaultValue: props.defaultValue ?? EMPTY,
    onChange: undefined,
  });
  const display = (range: DateRange) => ({
    start: displayDate(range.start, locale()),
    end: displayDate(range.end, locale()),
  });
  // Drafts keep their formatting locale so a locale change re-displays complete dates only.
  const [draftState, setDraftState] = createSignal({
    ...display(value()),
    locale: locale(),
  });
  const relocalize = (draft: string, from: string) => {
    const canonical = canonicalInput(draft, from);
    return from !== locale() && isCalendarDate(canonical)
      ? displayDate(canonical, locale())
      : draft;
  };
  const drafts = createMemo(() => {
    const state = draftState();
    return {
      start: relocalize(state.start, state.locale),
      end: relocalize(state.end, state.locale),
    };
  });
  const setDrafts = (next: DateRange) =>
    setDraftState({ ...next, locale: locale() });
  const [selection, setSelection] = createSignal(selectionOf(value()));
  const [open, setOpen] = createSignal(false);
  let startInput: HTMLInputElement | undefined,
    endInput: HTMLInputElement | undefined,
    trigger: HTMLButtonElement | undefined,
    emitted = value(),
    focusFrame: number | undefined;
  const [portalMount, setPortalMount] = createSignal<HTMLElement>();
  onMount(() => {
    if (startInput)
      setPortalMount(
        startInput.closest<HTMLElement>('[role="dialog"], [role="alertdialog"]') ??
          startInput.ownerDocument.body,
      );
  });
  const blocked = () => props.disabled || props.readOnly;
  const validity = createMemo(() =>
    validateRange(
      drafts().start,
      drafts().end,
      props.required ?? false,
      props.min,
      props.max,
      locale(),
    ),
  );
  const messageFor = (reason: string) =>
    reason === "required"
      ? text().required
      : reason === "order"
        ? text().order
        : text().invalid;
  const error = () =>
    validity().valid ? undefined : messageFor(validity().reason);
  const startInvalid = () => props.invalid || !validity().start.valid;
  const endInvalid = () =>
    props.invalid || !validity().end.valid || validity().reason === "order";
  const fieldName = () => props.label ?? props["aria-label"] ?? "";

  createEffect(
    on(
      () => [value().start, value().end] as const,
      ([start, end]) => {
        if (same({ start, end }, emitted)) return;
        emitted = { start, end };
        setDrafts(display(emitted));
        setSelection(selectionOf(emitted));
      },
      { defer: true },
    ),
  );
  createEffect(() => {
    const state = validity();
    startInput?.setCustomValidity(
      state.start.valid ? "" : messageFor(state.start.reason),
    );
    endInput?.setCustomValidity(
      !state.end.valid
        ? messageFor(state.end.reason)
        : state.reason === "order"
          ? text().order
          : "",
    );
  });
  createEffect(() => {
    if (blocked()) {
      setOpen(false);
      if (focusFrame !== undefined) cancelAnimationFrame(focusFrame);
    }
  });
  // Resolve the owning form when a reset happens: the field may mount before it joins its form.
  onMount(() => {
    const doc = startInput?.ownerDocument;
    if (!doc) return;
    const reset = (event: Event) => {
      const form = props.form ? doc.getElementById(props.form) : startInput?.form;
      if (!form || event.target !== form) return;
      // A task, not a microtask: a user-triggered reset runs its listeners before rewriting the controls.
      setTimeout(() => {
        if (event.defaultPrevented) return;
        const next = props.value ?? props.defaultValue ?? EMPTY;
        emitted = next;
        setValue(next);
        const shown = display(next);
        setDrafts(shown);
        setSelection(selectionOf(next));
        // Native reset rewrote the visible inputs; the drafts may not have changed.
        if (startInput) startInput.value = shown.start;
        if (endInput) endInput.value = shown.end;
      }, 0);
    };
    doc.addEventListener("reset", reset, true);
    onCleanup(() => doc.removeEventListener("reset", reset, true));
  });
  onCleanup(() => {
    if (focusFrame !== undefined) cancelAnimationFrame(focusFrame);
  });

  function focusSoon(target: () => HTMLElement | undefined, frames = 1) {
    if (focusFrame !== undefined) cancelAnimationFrame(focusFrame);
    const run = (left: number) => {
      focusFrame = requestAnimationFrame(() => {
        if (left > 1) return run(left - 1);
        if (!blocked()) target()?.focus({ preventScroll: true });
      });
    };
    run(frames);
  }
  function commit(next: DateRange) {
    if (blocked()) return;
    setSelection(selectionOf(next));
    if (same(next, emitted)) return;
    emitted = next;
    setValue(next);
    props.onValueChange?.(next);
  }
  /** Committing ignores `required` like DatePicker: an emptied side is still reported. */
  function changeDraft(side: "start" | "end", typed: string) {
    if (blocked()) return;
    const next = { ...drafts(), [side]: typed };
    const loose = validateRange(
      next.start,
      next.end,
      false,
      props.min,
      props.max,
      locale(),
    );
    const part = loose[side];
    if (part.valid) next[side] = displayDate(part.value ?? "", locale());
    setDrafts(next);
    if (loose.valid) commit(loose.value!);
  }
  function choose(range: DateRange) {
    setDrafts(display(range));
    commit(range);
  }
  const presets = () =>
    (props.presets ?? []).map((preset) => {
      const state = () =>
        validateRange(
          preset.value.start,
          preset.value.end,
          false,
          props.min,
          props.max,
          "en-US",
        );
      return {
        label: preset.label,
        disabled: !state().valid,
        onSelect: () => {
          const checked = state();
          if (blocked() || !checked.valid) return;
          choose(checked.value!);
          setOpen(false);
          focusSoon(() => endInput, 2);
        },
      };
    });


  return (
    <div
      class={`dds-field dds-date-picker dds-date-range-picker dds-date-picker--${props.labelPlacement ?? "outside"}${error() ? " dds-field--error" : ""}`}
      role="group"
      aria-labelledby={
        props["aria-labelledby"] ?? (props.label ? labelId : undefined)
      }
      aria-label={
        props.label || props["aria-labelledby"] ? undefined : props["aria-label"]
      }
      data-filled={drafts().start !== "" || drafts().end !== "" ? "true" : undefined}
      data-invalid={startInvalid() || endInvalid() ? "" : undefined}
      data-disabled={props.disabled ? "" : undefined}
    >
      <Show when={props.label}>
        <label id={labelId} class="dds-field__label" for={id}>
          {props.label}
          <Show when={props.required}>
            <span aria-hidden="true"> *</span>
          </Show>
        </label>
      </Show>
      <ArkDatePicker.Root
        locale={locale()}
        timeZone={props.timeZone ?? "Asia/Seoul"}
        selectionMode="range"
        disabled={props.disabled}
        readOnly={props.readOnly}
        required={props.required}
        invalid={props.invalid || !validity().valid}
        open={open() && !blocked()}
        onOpenChange={(details) => {
          setOpen(details.open && !blocked());
          // A half-chosen period is not a value: closing restores the committed one.
          if (!details.open) setSelection(selectionOf(emitted));
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
          dayCell: (state) => text().selectDate(state.valueText),
          clearTrigger: text().clear,
        }}
        value={selection()}
        onValueChange={(details) => {
          if (blocked()) return;
          setSelection(details.value);
          if (details.value.length < 2) return;
          const [start, end] = details.value.map((day) => day.toString()).sort();
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
          focusSoon(() => endInput, 2);
        }}
        positioning={{
          placement: "bottom-start",
          gutter: 8,
          strategy: portalMount()?.matches(
            '[role="dialog"], [role="alertdialog"]',
          )
            ? "fixed"
            : "absolute",
          hideWhenDetached: !!portalMount()?.matches(
            '[role="dialog"], [role="alertdialog"]',
          ),
        }}
      >
        <ArkDatePicker.Control class="dds-date-picker-control">
          <div
            class="dds-date-range-box"
            data-invalid={startInvalid() || endInvalid() ? "" : undefined}
            data-disabled={props.disabled ? "" : undefined}
          >
            <input
              type="text"
              class="dds-date-range-input"
              autocomplete="off"
              autocorrect="off"
              spellcheck={false}
              placeholder={isKorean(locale()) ? "YYYY/MM/DD" : "YYYY-MM-DD"}
              id={id}
              ref={startInput}
              form={props.form}
              aria-label={text().startLabel}
              aria-invalid={startInvalid() ? "true" : undefined}
              aria-required={props.required ? "true" : undefined}
              aria-describedby={describedBy(
                props["aria-describedby"],
                error() && errorId,
              )}
              value={drafts().start}
              required={props.required}
              readOnly={props.readOnly}
              disabled={props.disabled}
              on:input={(event) => {
                event.stopPropagation();
                changeDraft("start", event.currentTarget.value);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.isComposing) {
                  event.preventDefault();
                  event.stopPropagation();
                }
              }}
            />
            <span class="dds-date-range-separator" aria-hidden="true">
              ~
            </span>
            <input
              type="text"
              class="dds-date-range-input"
              autocomplete="off"
              autocorrect="off"
              spellcheck={false}
              placeholder={isKorean(locale()) ? "YYYY/MM/DD" : "YYYY-MM-DD"}
              id={endId}
              ref={endInput}
              form={props.form}
              aria-label={text().endLabel}
              aria-invalid={endInvalid() ? "true" : undefined}
              aria-required={props.required ? "true" : undefined}
              aria-describedby={describedBy(
                props["aria-describedby"],
                error() && errorId,
              )}
              value={drafts().end}
              required={props.required}
              readOnly={props.readOnly}
              disabled={props.disabled}
              on:input={(event) => {
                event.stopPropagation();
                changeDraft("end", event.currentTarget.value);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.isComposing) {
                  event.preventDefault();
                  event.stopPropagation();
                }
              }}
            />
          </div>
          <ArkDatePicker.Trigger
            ref={trigger}
            class="dds-btn dds-btn--secondary"
            aria-label={`${fieldName()} ${text().openCalendar}`.trim()}
          >
            <CalendarIcon />
          </ArkDatePicker.Trigger>
        </ArkDatePicker.Control>
        <Show when={portalMount()}>
          {(mount) => (
            <Portal mount={mount()}>
              <ArkDatePicker.Positioner class="dds-date-picker-positioner">
                <ArkDatePicker.Content
                  ref={(node) => {
                    const restoreTrigger = (event: KeyboardEvent) => {
                      if (event.key === "Escape") focusSoon(() => trigger, 2);
                    };
                    node.addEventListener("keydown", restoreTrigger, true);
                    onCleanup(() =>
                      node.removeEventListener("keydown", restoreTrigger, true),
                    );
                  }}
                  class="dds-date-picker-content dds-date-range-content"
                  aria-label={`${fieldName()} ${text().chooseRange}`.trim()}
                >
                  <CalendarView
                    timeZone={props.timeZone}
                    min={props.min}
                    max={props.max}
                    locale={locale()}
                    messages={text()}
                    disabled={props.disabled}
                    readOnly={props.readOnly}
                    showToday={false}
                    showClear={props.clearable}
                    presets={presets()}
                    presetsLabel={text().presets}
                    onClear={() => choose(EMPTY)}
                  />
                </ArkDatePicker.Content>
              </ArkDatePicker.Positioner>
            </Portal>
          )}
        </Show>
      </ArkDatePicker.Root>
      <Show when={props.startName}>
        <input
          type="hidden"
          name={props.startName}
          form={props.form}
          value={value().start}
          disabled={props.disabled}
        />
      </Show>
      <Show when={props.endName}>
        <input
          type="hidden"
          name={props.endName}
          form={props.form}
          value={value().end}
          disabled={props.disabled}
        />
      </Show>
      <Show when={error()}>
        <span id={errorId} class="dds-field__error" role="alert">
          {error()}
        </span>
      </Show>
    </div>
  );
}
