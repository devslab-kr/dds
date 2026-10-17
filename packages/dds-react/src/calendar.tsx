import {
  DatePicker as ArkDatePicker,
  parseDate,
} from "@ark-ui/react/date-picker";
import { CalendarView } from "./calendar-view";
import {
  isCalendarDate,
  validateInput,
  dateMessages,
  type CalendarMessages,
} from "./date-only";
export interface CalendarProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  locale?: string;
  timeZone?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  readOnly?: boolean;
  startOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  messages?: CalendarMessages;
  showToday?: boolean;
  clearable?: boolean;
}
export type { CalendarMessages } from "./date-only";
export function Calendar({
  label,
  value,
  onChange,
  locale = "ko-KR",
  timeZone = "Asia/Seoul",
  min,
  max,
  disabled = false,
  readOnly = false,
  startOfWeek = 0,
  messages,
  showToday = true,
  clearable = true,
}: CalendarProps) {
  const text = dateMessages(locale, messages);
  return (
    <ArkDatePicker.Root
      className="dds-calendar"
      aria-label={label}
      role="group"
      inline
      locale={locale}
      timeZone={timeZone}
      disabled={disabled}
      readOnly={readOnly}
      min={min && isCalendarDate(min) ? parseDate(min) : undefined}
      max={max && isCalendarDate(max) ? parseDate(max) : undefined}
      startOfWeek={startOfWeek}
      minView="day"
      maxView="day"
      fixedWeeks
      value={isCalendarDate(value) ? [parseDate(value)] : []}
      translations={{
        dayCell: (state) => text.selectDate(state.valueText),
        clearTrigger: text.clear,
      }}
      onValueChange={(details) => {
        const next = details.value[0]?.toString() ?? "";
        if (
          !disabled &&
          !readOnly &&
          validateInput(next, false, min, max, locale).valid
        )
          onChange(next);
      }}
    >
      <ArkDatePicker.Content
        className="dds-date-picker-content"
        aria-label={label}
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
        />
      </ArkDatePicker.Content>
    </ArkDatePicker.Root>
  );
}
