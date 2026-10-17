import { DatePicker as ArkDatePicker } from "@ark-ui/solid/date-picker";
import { For, Show } from "solid-js";
import { Button } from "./controls";
import {
  dateMessages,
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
}
/** Internal view: the caller owns the single Ark root and its selection. */
export function CalendarView(props: CalendarViewProps) {
  const text = () => dateMessages(props.locale ?? "ko-KR", props.messages),
    locked = () => props.disabled || props.readOnly;
  return (
    <ArkDatePicker.View view="day">
      <ArkDatePicker.Context>
        {(picker) => (
          <>
            <ArkDatePicker.ViewControl class="dds-date-picker-header">
              <ArkDatePicker.PrevTrigger
                class="dds-btn dds-btn--secondary"
                aria-label={text().previousMonth}
              >
                <Chevron />
              </ArkDatePicker.PrevTrigger>
              <ArkDatePicker.RangeText />
              <ArkDatePicker.NextTrigger
                class="dds-btn dds-btn--secondary"
                aria-label={text().nextMonth}
              >
                <Chevron next />
              </ArkDatePicker.NextTrigger>
            </ArkDatePicker.ViewControl>
            <ArkDatePicker.Table class="dds-date-picker-table">
              <ArkDatePicker.TableHead>
                <ArkDatePicker.TableRow>
                  <For each={picker().weekDays}>
                    {(day) => (
                      <ArkDatePicker.TableHeader>
                        {day.short}
                      </ArkDatePicker.TableHeader>
                    )}
                  </For>
                </ArkDatePicker.TableRow>
              </ArkDatePicker.TableHead>
              <ArkDatePicker.TableBody>
                <For each={picker().weeks}>
                  {(week) => (
                    <ArkDatePicker.TableRow>
                      <For each={week}>
                        {(day) => (
                          <ArkDatePicker.TableCell value={day}>
                            <ArkDatePicker.TableCellTrigger>
                              {day.day}
                            </ArkDatePicker.TableCellTrigger>
                          </ArkDatePicker.TableCell>
                        )}
                      </For>
                    </ArkDatePicker.TableRow>
                  )}
                </For>
              </ArkDatePicker.TableBody>
            </ArkDatePicker.Table>
            <div class="dds-date-picker-footer">
              <Show when={props.showToday !== false}>
                <Button
                  type="button"
                  tone="secondary"
                  disabled={
                    locked() ||
                    !validateInput(
                      todayDate(props.timeZone ?? "Asia/Seoul"),
                      false,
                      props.min,
                      props.max,
                      props.locale,
                    ).valid
                  }
                  onClick={() => {
                    if (
                      !locked() &&
                      validateInput(
                        todayDate(props.timeZone ?? "Asia/Seoul"),
                        false,
                        props.min,
                        props.max,
                        props.locale,
                      ).valid
                    )
                      picker().selectToday();
                  }}
                >
                  {text().today}
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
          </>
        )}
      </ArkDatePicker.Context>
    </ArkDatePicker.View>
  );
}
