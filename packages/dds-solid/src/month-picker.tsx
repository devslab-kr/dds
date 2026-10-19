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
  canonicalMonth,
  displayMonth,
  isCalendarMonth,
  isKorean,
  monthBounds,
  monthMessages,
  validateMonth,
  type MonthPickerMessages,
} from "./date-only";
import { describedBy } from "./utils";
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

export function MonthPicker(props: MonthPickerProps) {
  const locale = () => props.locale ?? "ko-KR",
    id = props.id ?? `dds-month-${createUniqueId()}`,
    errorId = `${id}-error`;
  const text = () => monthMessages(locale(), props.messages);
  const [value, setValue] = createControllableSignal<string>({
    value: () => props.value,
    defaultValue: props.defaultValue ?? "",
    onChange: undefined,
  });
  // The draft keeps its formatting locale so a locale change re-displays complete months only.
  const [draftState, setDraftState] = createSignal({
    text: displayMonth(value(), locale()),
    locale: locale(),
  });
  const draft = createMemo(() => {
    const state = draftState(),
      canonical = canonicalMonth(state.text);
    return state.locale !== locale() && isCalendarMonth(canonical)
      ? displayMonth(canonical, locale())
      : state.text;
  });
  const setDraft = (next: string) =>
    setDraftState({ text: next, locale: locale() });
  const [selection, setSelection] = createSignal(selectionOf(value()));
  const [open, setOpen] = createSignal(false);
  let input: HTMLInputElement | undefined,
    trigger: HTMLButtonElement | undefined,
    emitted = value(),
    focusFrame: number | undefined;
  const [portalMount, setPortalMount] = createSignal<HTMLElement>();
  onMount(() => {
    if (input)
      setPortalMount(
        input.closest<HTMLElement>('[role="dialog"], [role="alertdialog"]') ??
          input.ownerDocument.body,
      );
  });
  const blocked = () => props.disabled || props.readOnly;
  const bounds = createMemo(() => monthBounds(props.min, props.max));
  const validity = createMemo(() =>
    validateMonth(draft(), props.required ?? false, props.min, props.max),
  );
  const error = () =>
    validity().valid
      ? undefined
      : validity().reason === "required"
        ? text().required
        : text().invalid;
  const invalid = () => props.invalid || !validity().valid;
  const fieldName = () => props.label ?? props["aria-label"] ?? "";

  createEffect(
    on(
      value,
      (next) => {
        if (next === emitted) return;
        emitted = next;
        setDraft(displayMonth(next, locale()));
        setSelection(selectionOf(next));
      },
      { defer: true },
    ),
  );
  createEffect(() => input?.setCustomValidity(error() ?? ""));
  createEffect(() => {
    if (blocked()) {
      setOpen(false);
      if (focusFrame !== undefined) cancelAnimationFrame(focusFrame);
    }
  });
  // Resolve the owning form when a reset happens: the field may mount before it joins its form.
  onMount(() => {
    const doc = input?.ownerDocument;
    if (!doc) return;
    const reset = (event: Event) => {
      const form = props.form ? doc.getElementById(props.form) : input?.form;
      if (!form || event.target !== form) return;
      // A task, not a microtask: a user-triggered reset runs its listeners before rewriting the controls.
      setTimeout(() => {
        if (event.defaultPrevented) return;
        const next = props.value ?? props.defaultValue ?? "";
        emitted = next;
        setValue(next);
        const shown = displayMonth(next, locale());
        setDraft(shown);
        setSelection(selectionOf(next));
        // Native reset rewrote the visible input; the draft may not have changed.
        if (input) input.value = shown;
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
  function commit(next: string) {
    if (blocked()) return;
    setSelection(selectionOf(next));
    if (next === emitted) return;
    emitted = next;
    setValue(next);
    props.onValueChange?.(next);
  }
  /** Committing ignores `required` like DatePicker: an emptied field is still reported. */
  function changeDraft(typed: string) {
    if (blocked()) return;
    const state = validateMonth(typed, false, props.min, props.max);
    setDraft(state.valid ? displayMonth(state.value ?? "", locale()) : typed);
    if (state.valid) commit(state.value ?? "");
  }

  return (
    <div
      class={`dds-field dds-date-picker dds-month-picker dds-date-picker--${props.labelPlacement ?? "outside"}${error() ? " dds-field--error" : ""}`}
      data-filled={draft() !== "" ? "true" : undefined}
      data-invalid={invalid() ? "" : undefined}
      data-disabled={props.disabled ? "" : undefined}
      role="group"
    >
      <Show when={props.label}>
        <label class="dds-field__label" for={id}>
          {props.label}
          <Show when={props.required}>
            <span aria-hidden="true"> *</span>
          </Show>
        </label>
      </Show>
      <ArkDatePicker.Root
        locale={locale()}
        timeZone={props.timeZone ?? "Asia/Seoul"}
        disabled={props.disabled}
        readOnly={props.readOnly}
        required={props.required}
        invalid={invalid()}
        open={open() && !blocked()}
        onOpenChange={(details) => {
          setOpen(details.open && !blocked());
          if (!details.open) setSelection(selectionOf(emitted));
        }}
        min={bounds().min ? parseDate(bounds().min!) : undefined}
        max={bounds().max ? parseDate(bounds().max!) : undefined}
        minView="month"
        maxView="month"
        defaultView="month"
        translations={{ clearTrigger: text().clear }}
        value={selection()}
        onValueChange={(details) => {
          if (blocked()) return;
          const next = details.value[0]?.toString().slice(0, 7) ?? "";
          if (
            next !== "" &&
            !validateMonth(next, false, props.min, props.max).valid
          )
            return;
          setDraft(displayMonth(next, locale()));
          commit(next);
          focusSoon(() => input, 2);
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
        <ArkDatePicker.Control
          class="dds-date-picker-control"
          data-filled={draft() !== "" ? "true" : undefined}
        >
          <input
            id={id}
            ref={input}
            form={props.form}
            aria-label={props.label ? undefined : props["aria-label"]}
            aria-labelledby={props["aria-labelledby"]}
            aria-invalid={invalid() ? "true" : undefined}
            aria-required={props.required ? "true" : undefined}
            aria-describedby={describedBy(
              props["aria-describedby"],
              error() && errorId,
            )}
            type="text"
            value={draft()}
            required={props.required}
            readOnly={props.readOnly}
            disabled={props.disabled}
            placeholder={isKorean(locale()) ? "YYYY/MM" : "YYYY-MM"}
            autocomplete="off"
            autocorrect="off"
            spellcheck={false}
            on:input={(event) => {
              event.stopPropagation();
              changeDraft(event.currentTarget.value);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.isComposing) {
                event.preventDefault();
                event.stopPropagation();
              }
            }}
          />
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
                  class="dds-date-picker-content dds-month-picker-content"
                  aria-label={`${fieldName()} ${text().chooseMonth}`.trim()}
                >
                  <CalendarView
                    view="month"
                    timeZone={props.timeZone}
                    min={bounds().min}
                    max={bounds().max}
                    locale={locale()}
                    messages={text()}
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
          )}
        </Show>
      </ArkDatePicker.Root>
      <Show when={props.name}>
        <input
          type="hidden"
          name={props.name}
          form={props.form}
          value={value()}
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
