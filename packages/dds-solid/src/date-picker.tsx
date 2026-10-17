import {
  DatePicker as ArkDatePicker,
  parseDate,
} from "@ark-ui/solid/date-picker";
import { Portal } from "solid-js/web";
import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  Show,
  onCleanup,
  onMount,
  on,
} from "solid-js";
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
  value: string;
  onChange: (value: string) => void;
  locale?: string;
  timeZone?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
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
      stroke-width="1.5"
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
export function DatePicker(props: DatePickerProps) {
  const locale = () => props.locale ?? "ko-KR",
    id = `dds-date-${createUniqueId()}`;
  const [draftState, setDraftState] = createSignal({
    text: displayDate(props.value, locale()),
    locale: locale(),
  });
  // Keep the draft's formatting locale with its text, so changing locale cannot
  // publish an intermediate invalid report before the synchronization effect.
  const draft = createMemo(() => {
    const state = draftState(),
      canonical = canonicalInput(state.text, state.locale);
    return state.locale !== locale() && isCalendarDate(canonical)
      ? displayDate(canonical, locale())
      : state.text;
  });
  const setDraft = (text: string) => setDraftState({ text, locale: locale() });
  const [selection, setSelection] = createSignal(
    calendarSelection(props.value),
  );
  const [open, setOpen] = createSignal(false);
  let input: HTMLInputElement | undefined,
    trigger: HTMLButtonElement | undefined,
    observedValue = props.value,
    emittedValue = props.value,
    notified = "",
    pendingEchoes: string[] = [],
    focusFrame: number | undefined;
  const [portalMount, setPortalMount] = createSignal<HTMLElement>();
  onMount(() => {
    if (input) {
      setPortalMount(
        input.closest<HTMLElement>('[role="dialog"], [role="alertdialog"]') ??
          input.ownerDocument.body,
      );
    }
  });
  const text = () => dateMessages(locale(), props.messages);
  const validity = createMemo(() =>
    validateInput(
      draft(),
      props.required ?? false,
      props.min,
      props.max,
      locale(),
    ),
  );
  const error = () =>
    validity().valid
      ? undefined
      : validity().reason === "required"
        ? text().required
        : text().invalid;
  createEffect(
    on(
      () => [props.value, locale()] as const,
      ([value, nextLocale]) => {
        if (observedValue === value) return;
        observedValue = value;
        const acknowledged = pendingEchoes.indexOf(value);
        if (acknowledged !== -1) {
          pendingEchoes.splice(acknowledged, 1);
          return;
        }
        pendingEchoes = [];
        emittedValue = value;
        setDraft(displayDate(value, nextLocale));
        if (value === "" || isCalendarDate(value))
          setSelection(calendarSelection(value));
      },
    ),
  );
  createEffect(() => {
    input?.setCustomValidity(error() ?? "");
    const state = validity(),
      callback = props.onValidityChange,
      key = JSON.stringify(state);
    if (callback && key !== notified) {
      notified = key;
      callback(state);
    }
  });
  createEffect(() => {
    if (props.disabled || props.readOnly) {
      setOpen(false);
      if (focusFrame !== undefined) cancelAnimationFrame(focusFrame);
    }
  });
  onCleanup(() => {
    if (focusFrame !== undefined) cancelAnimationFrame(focusFrame);
  });
  function commit(next: string) {
    if (props.disabled || props.readOnly) return;
    const state = validateInput(
      next,
      props.required ?? false,
      props.min,
      props.max,
      locale(),
    );
    if (next !== "" && !state.valid) return;
    const canonical = next === "" ? "" : state.value!;
    setSelection(calendarSelection(canonical));
    if (canonical !== emittedValue) {
      emittedValue = canonical;
      pendingEchoes.push(canonical);
      props.onChange(canonical);
    }
  }
  function changeDraft(next: string) {
    if (props.disabled || props.readOnly) return;
    setDraft(next);
    const state = validateInput(
      next,
      props.required ?? false,
      props.min,
      props.max,
      locale(),
    );
    input?.setCustomValidity(state.valid ? "" : text().invalid);
    if (next === "" || state.valid) {
      setDraft(displayDate(state.value ?? "", locale()));
      commit(next);
    }
  }
  return (
    <div
      class={`dds-field dds-date-picker dds-date-picker--${props.labelPlacement ?? "outside"}${error() ? " dds-field--error" : ""}`}
      data-filled={draft() !== "" ? "true" : undefined}
      role="group"
    >
      <label class="dds-field__label" for={id}>
        {props.label}
        <Show when={props.required}>
          <span aria-hidden="true"> *</span>
        </Show>
      </label>
      <ArkDatePicker.Root
        locale={locale()}
        timeZone={props.timeZone ?? "Asia/Seoul"}
        disabled={props.disabled}
        readOnly={props.readOnly}
        required={props.required}
        invalid={!validity().valid}
        open={open() && !props.disabled && !props.readOnly}
        onOpenChange={(details) =>
          setOpen(details.open && !props.disabled && !props.readOnly)
        }
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
        format={(value) => displayDate(value.toString(), locale())}
        onValueChange={(details) => {
          if (props.disabled || props.readOnly) return;
          const next = details.value[0]?.toString() ?? "";
          if (
            next !== "" &&
            !validateInput(
              next,
              props.required ?? false,
              props.min,
              props.max,
              locale(),
            ).valid
          )
            return;
          setDraft(displayDate(next, locale()));
          commit(next);
          if (focusFrame !== undefined) cancelAnimationFrame(focusFrame);
          focusFrame = requestAnimationFrame(() => {
            if (!props.disabled && !props.readOnly)
              input?.focus({ preventScroll: true });
          });
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
            aria-invalid={validity().valid ? undefined : "true"}
            aria-required={props.required ? "true" : undefined}
            aria-describedby={error() ? `${id}-error` : undefined}
            ref={input}
            type="text"
            value={draft()}
            required={props.required}
            readOnly={props.readOnly}
            disabled={props.disabled}
            placeholder={isKorean(locale()) ? "YYYY/MM/DD" : "YYYY-MM-DD"}
            autocomplete="off"
            autocorrect="off"
            spellcheck={false}
            on:input={(event) => {
              event.stopPropagation();
              changeDraft(event.currentTarget.value);
            }}
            onBlur={() => commit(draft())}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.isComposing) {
                event.preventDefault();
                event.stopPropagation();
                commit(draft());
              }
            }}
          />
          <ArkDatePicker.Trigger
            ref={trigger}
            class="dds-btn dds-btn--secondary"
            aria-label={`${props.label} ${text().openCalendar}`}
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
                      if (event.key !== "Escape") return;
                      if (focusFrame !== undefined)
                        cancelAnimationFrame(focusFrame);
                      focusFrame = requestAnimationFrame(() => {
                        focusFrame = requestAnimationFrame(() => {
                          if (!props.disabled && !props.readOnly)
                            trigger?.focus({ preventScroll: true });
                        });
                      });
                    };
                    node.addEventListener("keydown", restoreTrigger, true);
                    onCleanup(() =>
                      node.removeEventListener("keydown", restoreTrigger, true),
                    );
                  }}
                  class="dds-date-picker-content"
                  aria-label={`${props.label} 날짜 선택`}
                >
                  <CalendarView
                    timeZone={props.timeZone}
                    min={props.min}
                    max={props.max}
                    locale={locale()}
                    messages={props.messages}
                    disabled={props.disabled}
                    readOnly={props.readOnly}
                    showToday={props.showToday}
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
      <Show when={error()}>
        <span id={`${id}-error`} class="dds-field__error" role="alert">
          {error()}
        </span>
      </Show>
    </div>
  );
}
