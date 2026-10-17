import { DatePicker as ArkDatePicker } from "@ark-ui/react/date-picker";
import { Button } from "./controls";
import {
  dateMessages,
  todayDate,
  validateInput,
  type CalendarMessages,
} from "./date-only";
function Chevron({ next = false }: { next?: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d={next ? "m9 5 7 7-7 7" : "m15 5-7 7 7 7"} />
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
export function CalendarView({
  locale = "ko-KR",
  timeZone = "Asia/Seoul",
  min,
  max,
  messages,
  disabled,
  readOnly,
  showToday = true,
  showClear = true,
  onClear,
}: CalendarViewProps) {
  const text = dateMessages(locale, messages),
    locked = disabled || readOnly;
  return (
    <ArkDatePicker.View view="day">
      <ArkDatePicker.Context>
        {(picker) => (
          <>
            <ArkDatePicker.ViewControl className="dds-date-picker-header">
              <ArkDatePicker.PrevTrigger asChild>
                <Button
                  type="button"
                  tone="secondary"
                  aria-label={text.previousMonth}
                >
                  <Chevron />
                </Button>
              </ArkDatePicker.PrevTrigger>
              <ArkDatePicker.RangeText />
              <ArkDatePicker.NextTrigger asChild>
                <Button
                  type="button"
                  tone="secondary"
                  aria-label={text.nextMonth}
                >
                  <Chevron next />
                </Button>
              </ArkDatePicker.NextTrigger>
            </ArkDatePicker.ViewControl>
            <ArkDatePicker.Table className="dds-date-picker-table">
              <ArkDatePicker.TableHead>
                <ArkDatePicker.TableRow>
                  {picker.weekDays.map((day, index) => (
                    <ArkDatePicker.TableHeader key={index}>
                      {day.short}
                    </ArkDatePicker.TableHeader>
                  ))}
                </ArkDatePicker.TableRow>
              </ArkDatePicker.TableHead>
              <ArkDatePicker.TableBody>
                {picker.weeks.map((week, index) => (
                  <ArkDatePicker.TableRow key={index}>
                    {week.map((day) => (
                      <ArkDatePicker.TableCell key={day.toString()} value={day}>
                        <ArkDatePicker.TableCellTrigger>
                          {day.day}
                        </ArkDatePicker.TableCellTrigger>
                      </ArkDatePicker.TableCell>
                    ))}
                  </ArkDatePicker.TableRow>
                ))}
              </ArkDatePicker.TableBody>
            </ArkDatePicker.Table>
            <div className="dds-date-picker-footer">
              {showToday && (
                <Button
                  type="button"
                  tone="secondary"
                  disabled={
                    locked ||
                    !validateInput(todayDate(timeZone), false, min, max, locale)
                      .valid
                  }
                  onClick={() => {
                    if (
                      !locked &&
                      validateInput(
                        todayDate(timeZone),
                        false,
                        min,
                        max,
                        locale,
                      ).valid
                    )
                      picker.selectToday();
                  }}
                >
                  {text.today}
                </Button>
              )}
              {showClear && (
                <ArkDatePicker.ClearTrigger hidden={false} asChild>
                  <Button
                    type="button"
                    tone="secondary"
                    disabled={locked}
                    onPointerDown={(event) => event.preventDefault()}
                    onClick={() => {
                      if (!locked) onClear?.();
                    }}
                  >
                    {text.clear}
                  </Button>
                </ArkDatePicker.ClearTrigger>
              )}
            </div>
          </>
        )}
      </ArkDatePicker.Context>
    </ArkDatePicker.View>
  );
}
