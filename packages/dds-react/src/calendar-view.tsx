import { DatePicker as ArkDatePicker } from "@ark-ui/react/date-picker";
import { Button } from "./controls";
import {
  dateMessages,
  isKorean,
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
  view = "day",
  presets = [],
  presetsLabel,
}: CalendarViewProps) {
  const text = dateMessages(locale, messages),
    locked = disabled || readOnly,
    months = view === "month",
    today = todayDate(timeZone),
    todayAllowed = validateInput(today, false, min, max, locale).valid;
  return (
    <ArkDatePicker.View view={months ? "month" : "day"}>
      <ArkDatePicker.Context>
        {(picker) => (
          <>
            <ArkDatePicker.ViewControl className="dds-date-picker-header">
              <ArkDatePicker.PrevTrigger asChild>
                <Button
                  type="button"
                  tone="secondary"
                  aria-label={months ? text.previousYear : text.previousMonth}
                >
                  <Chevron />
                </Button>
              </ArkDatePicker.PrevTrigger>
              {months ? (
                <span className="dds-date-picker-year" aria-live="polite">
                  {isKorean(locale)
                    ? `${picker.focusedValue.year}년`
                    : picker.focusedValue.year}
                </span>
              ) : (
                <ArkDatePicker.RangeText />
              )}
              <ArkDatePicker.NextTrigger asChild>
                <Button
                  type="button"
                  tone="secondary"
                  aria-label={months ? text.nextYear : text.nextMonth}
                >
                  <Chevron next />
                </Button>
              </ArkDatePicker.NextTrigger>
            </ArkDatePicker.ViewControl>
            {/* Index keys keep rows and cells in place across Ark updates, so focus stays in the grid. */}
            {months ? (
              <ArkDatePicker.Table className="dds-date-picker-table dds-date-picker-table--months">
                <ArkDatePicker.TableBody>
                  {picker
                    .getMonthsGrid({ columns: 3, format: "short" })
                    .map((row, rowIndex) => (
                      <ArkDatePicker.TableRow key={rowIndex}>
                        {row.map((month, index) => (
                          <ArkDatePicker.TableCell key={index} value={month.value}>
                            <ArkDatePicker.TableCellTrigger
                              data-today={
                                today.slice(0, 7) ===
                                `${String(picker.focusedValue.year).padStart(4, "0")}-${String(month.value).padStart(2, "0")}`
                                  ? ""
                                  : undefined
                              }
                            >
                              {month.label}
                            </ArkDatePicker.TableCellTrigger>
                          </ArkDatePicker.TableCell>
                        ))}
                      </ArkDatePicker.TableRow>
                    ))}
                </ArkDatePicker.TableBody>
              </ArkDatePicker.Table>
            ) : (
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
                  {picker.weeks.map((week, rowIndex) => (
                    <ArkDatePicker.TableRow key={rowIndex}>
                      {week.map((day, index) => (
                        <ArkDatePicker.TableCell key={index} value={day}>
                          <ArkDatePicker.TableCellTrigger>
                            {day.day}
                          </ArkDatePicker.TableCellTrigger>
                        </ArkDatePicker.TableCell>
                      ))}
                    </ArkDatePicker.TableRow>
                  ))}
                </ArkDatePicker.TableBody>
              </ArkDatePicker.Table>
            )}
            {(presets.length > 0 || showToday || showClear) && (
              <div className="dds-date-picker-footer">
                {presets.length > 0 && (
                  <div
                    className="dds-date-picker-presets"
                    role="group"
                    aria-label={presetsLabel}
                  >
                    {presets.map((preset, index) => (
                      <Button
                        key={index}
                        type="button"
                        tone="secondary"
                        size="sm"
                        disabled={locked || preset.disabled}
                        onClick={() => {
                          if (!locked && !preset.disabled) preset.onSelect();
                        }}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                )}
                {showToday && (
                  <Button
                    type="button"
                    tone="secondary"
                    disabled={locked || !todayAllowed}
                    onClick={() => {
                      if (!locked && todayAllowed) picker.selectToday();
                    }}
                  >
                    {months ? text.thisMonth : text.today}
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
            )}
          </>
        )}
      </ArkDatePicker.Context>
    </ArkDatePicker.View>
  );
}
