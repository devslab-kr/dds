import { DatePicker as ArkDatePicker } from "@ark-ui/solid/date-picker";
import { For, Index, Show } from "solid-js";
import { Button } from "./controls";
import {
  dateMessages,
  isKorean,
  todayDate,
  validateInput,
  type CalendarMessages,
} from "./date-only";
function Chevron(props: { next?: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      aria-hidden="true"
    >
      <path d={props.next ? "m9 5 7 7-7 7" : "m15 5-7 7 7 7"} />
    </svg>
  );
}
/** A consumer-supplied footer shortcut (DateRangePicker presets). */
export interface CalendarViewPreset {
  label: string;
  disabled?: boolean | undefined;
  onSelect: () => void;
}
export interface CalendarViewProps {
  timeZone?: string | undefined;
  min?: string | undefined;
  max?: string | undefined;
  locale?: string | undefined;
  messages?: CalendarMessages | undefined;
  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  showToday?: boolean | undefined;
  showClear?: boolean | undefined;
  onClear?: (() => void) | undefined;
  /** "month" renders a 3 × 4 month grid paged by year; the caller sets Ark minView/maxView to match. */
  view?: "day" | "month" | undefined;
  presets?: CalendarViewPreset[] | undefined;
  presetsLabel?: string | undefined;
}
/** Internal view: the caller owns the single Ark root and its selection. */
export function CalendarView(props: CalendarViewProps) {
  const text = () => dateMessages(props.locale ?? "ko-KR", props.messages),
    locked = () => props.disabled || props.readOnly,
    months = () => props.view === "month",
    presets = () => props.presets ?? [],
    todayAllowed = () =>
      validateInput(
        todayDate(props.timeZone ?? "Asia/Seoul"),
        false,
        props.min,
        props.max,
        props.locale,
      ).valid;
  return (
    <ArkDatePicker.View view={months() ? "month" : "day"}>
      <ArkDatePicker.Context>
        {(picker) => (
          <>
            <ArkDatePicker.ViewControl class="dds-date-picker-header">
              <ArkDatePicker.PrevTrigger
                class="dds-btn dds-btn--secondary"
                aria-label={months() ? text().previousYear : text().previousMonth}
              >
                <Chevron />
              </ArkDatePicker.PrevTrigger>
              <Show when={months()} fallback={<ArkDatePicker.RangeText />}>
                <span class="dds-date-picker-year" aria-live="polite">
                  {isKorean(props.locale ?? "ko-KR")
                    ? `${picker().focusedValue.year}년`
                    : picker().focusedValue.year}
                </span>
              </Show>
              <ArkDatePicker.NextTrigger
                class="dds-btn dds-btn--secondary"
                aria-label={months() ? text().nextYear : text().nextMonth}
              >
                <Chevron next />
              </ArkDatePicker.NextTrigger>
            </ArkDatePicker.ViewControl>
            <Show
              when={months()}
              fallback={
                <ArkDatePicker.Table class="dds-date-picker-table">
                  <ArkDatePicker.TableHead>
                    <ArkDatePicker.TableRow>
                      <Index each={picker().weekDays}>
                        {(day) => (
                          <ArkDatePicker.TableHeader>
                            {day().short}
                          </ArkDatePicker.TableHeader>
                        )}
                      </Index>
                    </ArkDatePicker.TableRow>
                  </ArkDatePicker.TableHead>
                  <ArkDatePicker.TableBody>
                    <Index each={picker().weeks}>
                      {(week) => (
                        <ArkDatePicker.TableRow>
                          <Index each={week()}>
                            {(day) => (
                              <ArkDatePicker.TableCell value={day()}>
                                <ArkDatePicker.TableCellTrigger>
                                  {day().day}
                                </ArkDatePicker.TableCellTrigger>
                              </ArkDatePicker.TableCell>
                            )}
                          </Index>
                        </ArkDatePicker.TableRow>
                      )}
                    </Index>
                  </ArkDatePicker.TableBody>
                </ArkDatePicker.Table>
              }
            >
              <ArkDatePicker.Table class="dds-date-picker-table dds-date-picker-table--months">
                <ArkDatePicker.TableBody>
                  <Index each={picker().getMonthsGrid({ columns: 3, format: "short" })}>
                    {(row) => (
                      <ArkDatePicker.TableRow>
                        <Index each={row()}>
                          {(month) => (
                            <ArkDatePicker.TableCell value={month().value}>
                              <ArkDatePicker.TableCellTrigger
                                data-today={
                                  todayDate(props.timeZone ?? "Asia/Seoul").slice(0, 7) ===
                                  `${String(picker().focusedValue.year).padStart(4, "0")}-${String(month().value).padStart(2, "0")}`
                                    ? ""
                                    : undefined
                                }
                              >
                                {month().label}
                              </ArkDatePicker.TableCellTrigger>
                            </ArkDatePicker.TableCell>
                          )}
                        </Index>
                      </ArkDatePicker.TableRow>
                    )}
                  </Index>
                </ArkDatePicker.TableBody>
              </ArkDatePicker.Table>
            </Show>
            <Show
              when={
                presets().length > 0 ||
                props.showToday !== false ||
                props.showClear !== false
              }
            >
              <div class="dds-date-picker-footer">
                <Show when={presets().length > 0}>
                  <div
                    class="dds-date-picker-presets"
                    role="group"
                    aria-label={props.presetsLabel}
                  >
                    <For each={presets()}>
                      {(preset) => (
                        <Button
                          type="button"
                          tone="secondary"
                          size="sm"
                          disabled={locked() || preset.disabled}
                          onClick={() => {
                            if (!locked() && !preset.disabled) preset.onSelect();
                          }}
                        >
                          {preset.label}
                        </Button>
                      )}
                    </For>
                  </div>
                </Show>
                <Show when={props.showToday !== false}>
                  <Button
                    type="button"
                    tone="secondary"
                    disabled={locked() || !todayAllowed()}
                    onClick={() => {
                      if (!locked() && todayAllowed()) picker().selectToday();
                    }}
                  >
                    {months() ? text().thisMonth : text().today}
                  </Button>
                </Show>
                <Show when={props.showClear !== false}>
                  <ArkDatePicker.ClearTrigger
                    hidden={false}
                    class="dds-btn dds-btn--secondary"
                    disabled={locked()}
                    onPointerDown={(event) => event.preventDefault()}
                    onClick={() => {
                      if (!locked()) props.onClear?.();
                    }}
                  >
                    {text().clear}
                  </ArkDatePicker.ClearTrigger>
                </Show>
              </div>
            </Show>
          </>
        )}
      </ArkDatePicker.Context>
    </ArkDatePicker.View>
  );
}
