// Time-of-day values are 24-hour "HH:MM" strings; "" is empty. Servers may send
// "HH:MM:SS" — it is accepted and shown as HH:MM, but never rewritten until the
// user picks a time.
const API_TIME = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d(?:\.\d+)?)?$/;

/** Canonical "HH:MM" for an API value, or null when it is not a time. */
export function normalizeTime(value: string): string | null {
  const match = API_TIME.exec(value);
  return match ? `${match[1]}:${match[2]}` : null;
}

const pad = (value: number) => String(value).padStart(2, "0");
const fromParts = (hour: number, minute: number) =>
  hour <= 23 && minute <= 59 ? `${pad(hour)}:${pad(minute)}` : null;

/**
 * What a person typed, read as a complete time: "9:05", "09:05", "09:05:00",
 * "0905", or "905" when the first two digits cannot be an hour. Full-width
 * colons and dots count as colons. Partial text ("10", "10:4", and "103",
 * which is still on its way to 10:30) is not a time.
 */
export function parseTypedTime(text: string): string | null {
  const value = text.trim().replace(/[：.]/g, ":");
  const separated = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value);
  if (separated) return fromParts(Number(separated[1]), Number(separated[2]));
  if (/^\d{4}$/.test(value))
    return fromParts(Number(value.slice(0, 2)), Number(value.slice(2)));
  if (/^\d{3}$/.test(value) && Number(value.slice(0, 2)) > 23)
    return fromParts(Number(value[0]), Number(value.slice(1)));
  return null;
}

/** 00:00 up to the last step before 24:00. Steps below one minute become one; a non-number becomes 10. */
export function timeOptions(step: number) {
  const minutes = Number.isFinite(step) ? Math.max(1, Math.floor(step)) : 10;
  const values: string[] = [];
  for (let at = 0; at < 24 * 60; at += minutes)
    values.push(`${pad(Math.floor(at / 60))}:${pad(at % 60)}`);
  return values;
}

/**
 * Whether a "HH:MM" option matches partial typing. Digits read as the start of
 * the time ("10" → 10:00–10:59, "1030" → 10:30); an odd digit count or an
 * impossible hour also tries a leading zero ("9" → 09:xx, "930" → 09:30).
 * With a colon the hour may be one digit ("9:3" → 09:30–09:39).
 */
export function matchesTimeQuery(option: string, query: string) {
  const text = query.trim().replace(/[：.]/g, ":");
  if (text === "") return true;
  const typed = parseTypedTime(text);
  if (typed) return option === typed;
  if (text.includes(":")) {
    const [hour = "", minute = "", ...rest] = text.split(":");
    if (rest.length || !/^\d{1,2}$/.test(hour) || !/^\d{0,2}$/.test(minute))
      return false;
    return option.startsWith(`${hour.padStart(2, "0")}:${minute}`);
  }
  if (!/^\d{1,4}$/.test(text)) return false;
  const digits = option.replace(":", "");
  if (digits.startsWith(text)) return true;
  return (
    (text.length % 2 === 1 || Number(text.slice(0, 2)) > 23) &&
    digits.startsWith(`0${text}`)
  );
}

export interface TimeMessages {
  /** Accessible name of the clock button that opens the list. */
  open?: string;
  /** Accessible name of the clear button. */
  clear?: string;
  /** Status when nothing in the list matches the typed text. */
  empty?: string;
}
export function timeMessages(locale: string, messages: TimeMessages = {}) {
  const ko = /^ko(?:-|$)/i.test(locale);
  return {
    open: ko ? "시간 목록 열기" : "Open time list",
    clear: ko ? "시간 지우기" : "Clear time",
    empty: ko ? "맞는 시간이 없습니다" : "No matching time",
    ...messages,
  };
}
