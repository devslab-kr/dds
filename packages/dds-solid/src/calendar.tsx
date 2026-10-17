import {
  DatePicker as ArkDatePicker,
  parseDate,
} from "@ark-ui/solid/date-picker";
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
export function Calendar(props: CalendarProps) {
  const locale = () => props.locale ?? "ko-KR",
    text = () => dateMessages(locale(), props.messages);
  return (
    <ArkDatePicker.Root
      class="dds-calendar"
      aria-label={props.label}
      role="group"
      inline
      locale={locale()}
      timeZone={props.timeZone ?? "Asia/Seoul"}
      disabled={props.disabled}
      readOnly={props.readOnly}
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
      value={isCalendarDate(props.value) ? [parseDate(props.value)] : []}
      translations={{
        dayCell: (state) => text().selectDate(state.valueText),
        clearTrigger: text().clear,
      }}
      onValueChange={(details) => {
        const next = details.value[0]?.toString() ?? "";
        if (
          !props.disabled &&
          !props.readOnly &&
          validateInput(next, false, props.min, props.max, locale()).valid
        )
          props.onChange(next);
      }}
    >
      <ArkDatePicker.Content
        class="dds-date-picker-content"
        aria-label={props.label}
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
        />
      </ArkDatePicker.Content>
    </ArkDatePicker.Root>
  );
}
