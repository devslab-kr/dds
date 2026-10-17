export interface DatePickerValidity {
  /** Exact displayed draft; never persist this display text as an API date. */
  inputValue: string;
  /** Valid ISO date, optional empty string, or null when invalid/incomplete. */
  value: string | null;
  valid: boolean;
  reason:
    | "valid"
    | "required"
    | "incomplete"
    | "invalid"
    | "rangeUnderflow"
    | "rangeOverflow";
}
// Date-only Gregorian validation: never let a permissive parser repair user text.
export function isCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const year = Number(value.slice(0, 4)),
    month = Number(value.slice(5, 7)),
    day = Number(value.slice(8, 10));
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  return (
    day <=
    [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]!
  );
}
export function isKorean(locale: string) {
  return /^ko(?:-|$)/i.test(locale);
}
export function displayDate(value: string, locale: string) {
  return isKorean(locale) && isCalendarDate(value)
    ? value.replaceAll("-", "/")
    : value;
}
export function canonicalInput(inputValue: string, locale: string) {
  return isKorean(locale) && /^\d{4}\/\d{2}\/\d{2}$/.test(inputValue)
    ? inputValue.replaceAll("/", "-")
    : inputValue;
}
export function validateInput(
  inputValue: string,
  required: boolean,
  min?: string,
  max?: string,
  locale = "en-US",
): DatePickerValidity {
  const canonical = canonicalInput(inputValue, locale);
  const incomplete =
    inputValue.length < 10 &&
    (/^\d{0,4}(?:-\d{0,2}(?:-\d{0,2})?)?$/.test(inputValue) ||
      (isKorean(locale) &&
        /^\d{0,4}(?:\/\d{0,2}(?:\/\d{0,2})?)?$/.test(inputValue)));
  let reason: DatePickerValidity["reason"] = "valid";
  if (inputValue === "") reason = required ? "required" : "valid";
  else if (!isCalendarDate(canonical))
    reason = incomplete ? "incomplete" : "invalid";
  else if (
    (min && !isCalendarDate(min)) ||
    (max && !isCalendarDate(max)) ||
    (min && max && min > max)
  )
    reason = "invalid";
  else if (min && canonical < min) reason = "rangeUnderflow";
  else if (max && canonical > max) reason = "rangeOverflow";
  return {
    inputValue,
    value: reason === "valid" ? canonical : null,
    valid: reason === "valid",
    reason,
  };
}

export interface CalendarMessages {
  previousMonth?: string;
  nextMonth?: string;
  today?: string;
  clear?: string;
  openCalendar?: string;
  selectDate?: (dateText: string) => string;
  required?: string;
  invalid?: string;
}
export function dateMessages(locale: string, messages: CalendarMessages = {}) {
  const ko = isKorean(locale);
  return {
    previousMonth: ko ? "이전 달" : "Previous month",
    nextMonth: ko ? "다음 달" : "Next month",
    today: ko ? "오늘" : "Today",
    clear: ko ? "선택 날짜 지우기" : "Clear selected date",
    openCalendar: ko ? "달력 열기" : "Open calendar",
    selectDate: (text: string) => (ko ? `${text} 선택` : `Choose ${text}`),
    required: ko ? "날짜를 입력해 주세요." : "Enter a date.",
    invalid: ko
      ? "YYYY/MM/DD 형식의 유효한 범위 내 날짜를 입력해 주세요."
      : "Enter a valid date within the allowed range (YYYY-MM-DD).",
    ...messages,
  };
}

/** Today is the sole timestamp boundary; stored dates remain Gregorian date-only strings. */
export function todayDate(timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US-u-ca-gregory-nu-latn", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) =>
    parts.find((item) => item.type === type)!.value;
  return `${part("year").padStart(4, "0")}-${part("month")}-${part("day")}`;
}
