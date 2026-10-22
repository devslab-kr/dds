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
  /** Month-grid header controls (MonthPicker). */
  previousYear?: string;
  nextYear?: string;
  today?: string;
  /** Footer action of the month grid (MonthPicker). */
  thisMonth?: string;
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
    previousYear: ko ? "이전 해" : "Previous year",
    nextYear: ko ? "다음 해" : "Next year",
    today: ko ? "오늘" : "Today",
    thisMonth: ko ? "이번 달" : "This month",
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

/* ── Date ranges ─────────────────────────────────────────────────────────── */

/** A period of two date-only values; either side may be "" (not chosen). */
export interface DateRange {
  start: string;
  end: string;
}

export interface DateRangeMessages extends CalendarMessages {
  /** Accessible name of the first input. */
  startLabel?: string;
  /** Accessible name of the second input. */
  endLabel?: string;
  /** Accessible name of the calendar popup. */
  chooseRange?: string;
  /** Shown when both dates are typed but the end is before the start. */
  order?: string;
  /** Accessible name of the preset button group. */
  presets?: string;
}

export function rangeMessages(locale: string, messages: DateRangeMessages = {}) {
  const ko = isKorean(locale);
  return {
    ...dateMessages(locale),
    clear: ko ? "선택 기간 지우기" : "Clear selected period",
    startLabel: ko ? "시작일" : "Start date",
    endLabel: ko ? "종료일" : "End date",
    chooseRange: ko ? "기간 선택" : "Choose a period",
    presets: ko ? "빠른 기간 선택" : "Quick periods",
    required: ko
      ? "시작일과 종료일을 입력해 주세요."
      : "Enter a start date and an end date.",
    order: ko
      ? "종료일은 시작일과 같거나 그 이후여야 합니다."
      : "The end date must be on or after the start date.",
    ...messages,
  };
}

export interface DateRangeValidity {
  start: DatePickerValidity;
  end: DatePickerValidity;
  /** Canonical range, or null while either side is invalid/incomplete or out of order. */
  value: DateRange | null;
  valid: boolean;
  reason: DatePickerValidity["reason"] | "order";
}

/** Each side follows DatePicker's rules; a typed end before the start is invalid, never swapped. */
export function validateRange(
  startText: string,
  endText: string,
  required: boolean,
  min?: string,
  max?: string,
  locale = "en-US",
): DateRangeValidity {
  const start = validateInput(startText, required, min, max, locale),
    end = validateInput(endText, required, min, max, locale);
  let reason: DateRangeValidity["reason"] = !start.valid
    ? start.reason
    : !end.valid
      ? end.reason
      : "valid";
  if (reason === "valid" && start.value && end.value && start.value > end.value)
    reason = "order";
  return {
    start,
    end,
    value:
      reason === "valid" ? { start: start.value!, end: end.value! } : null,
    valid: reason === "valid",
    reason,
  };
}

/* ── Months ──────────────────────────────────────────────────────────────── */

export function isCalendarMonth(value: string) {
  if (!/^\d{4}-\d{2}$/.test(value)) return false;
  const year = Number(value.slice(0, 4)),
    month = Number(value.slice(5, 7));
  return year >= 1 && month >= 1 && month <= 12;
}

export function displayMonth(value: string, locale: string) {
  return isKorean(locale) && isCalendarMonth(value)
    ? value.replace("-", "/")
    : value;
}

/** Accepts YYYY-MM, YYYY/MM, YYYY.MM and YYYYMM; other text is returned unchanged. */
export function canonicalMonth(inputValue: string) {
  const match =
    /^(\d{4})[-/.](\d{2})$/.exec(inputValue) ?? /^(\d{4})(\d{2})$/.exec(inputValue);
  return match ? `${match[1]}-${match[2]}` : inputValue;
}

export interface MonthPickerValidity {
  /** Exact displayed draft; never persist this display text as an API month. */
  inputValue: string;
  /** Valid YYYY-MM, optional empty string, or null when invalid/incomplete. */
  value: string | null;
  valid: boolean;
  reason: DatePickerValidity["reason"];
}

export function validateMonth(
  inputValue: string,
  required: boolean,
  min?: string,
  max?: string,
): MonthPickerValidity {
  const canonical = canonicalMonth(inputValue);
  const incomplete = /^\d{0,5}$/.test(inputValue) || /^\d{4}[-/.]\d?$/.test(inputValue);
  let reason: MonthPickerValidity["reason"] = "valid";
  if (inputValue === "") reason = required ? "required" : "valid";
  else if (!isCalendarMonth(canonical))
    reason = incomplete ? "incomplete" : "invalid";
  else if (
    (min && !isCalendarMonth(min)) ||
    (max && !isCalendarMonth(max)) ||
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

/** Month bounds widened to whole days, so any day inside an allowed month stays selectable. */
export function monthBounds(min?: string, max?: string) {
  const last = (month: string) => {
    const year = Number(month.slice(0, 4)),
      index = Number(month.slice(5, 7)),
      leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    return [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][index - 1]!;
  };
  return {
    min: min && isCalendarMonth(min) ? `${min}-01` : undefined,
    max: max && isCalendarMonth(max) ? `${max}-${last(max)}` : undefined,
  };
}

export interface MonthPickerMessages {
  previousYear?: string;
  nextYear?: string;
  thisMonth?: string;
  clear?: string;
  openCalendar?: string;
  /** Accessible name of the month popup. */
  chooseMonth?: string;
  required?: string;
  invalid?: string;
}

export function monthMessages(locale: string, messages: MonthPickerMessages = {}) {
  const ko = isKorean(locale);
  return {
    previousYear: ko ? "이전 해" : "Previous year",
    nextYear: ko ? "다음 해" : "Next year",
    thisMonth: ko ? "이번 달" : "This month",
    clear: ko ? "선택 월 지우기" : "Clear selected month",
    openCalendar: ko ? "달력 열기" : "Open calendar",
    chooseMonth: ko ? "월 선택" : "Choose a month",
    required: ko ? "월을 입력해 주세요." : "Enter a month.",
    invalid: ko
      ? "YYYY/MM 형식의 유효한 범위 내 월을 입력해 주세요."
      : "Enter a valid month within the allowed range (YYYY-MM).",
    ...messages,
  };
}
