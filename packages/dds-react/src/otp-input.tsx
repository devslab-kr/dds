import {
  forwardRef,
  useState,
  type ClipboardEvent,
  type ComponentPropsWithoutRef,
} from "react";

const codeLength = 6;
const digitsOnly = (text: string) => text.replace(/[^0-9]/g, "");

export interface OtpInputProps extends Omit<
  ComponentPropsWithoutRef<"input">,
  "value" | "defaultValue" | "type" | "inputMode" | "autoComplete" | "pattern" | "maxLength" | "onChange" | "children"
> {
  value: string;
  onValueChange: (value: string) => void;
  /** Called only when an edit produces a changed six-digit code. */
  onComplete?: (digits: string) => void;
}

/** Six visual cells share one native input, selection and autofill target. */
export const OtpInput = forwardRef<HTMLInputElement, OtpInputProps>(function OtpInput(
  { value, onValueChange, onComplete, onFocus, onSelect, onPaste, className, disabled, ...inputProps },
  ref,
) {
  const code = digitsOnly(value).slice(0, codeLength);
  const [selection, setSelection] = useState({ edge: code.length, collapsed: true });
  const edge = Math.min(selection.edge, code.length);
  const activeCell = Math.min(edge, codeLength - 1);
  const caret = edge === codeLength ? "after" : edge === code.length ? "center" : "before";

  function trackSelection(input: HTMLInputElement) {
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    setSelection({ edge: input.selectionDirection === "backward" ? start : end, collapsed: start === end });
  }

  function update(input: HTMLInputElement) {
    const raw = input.value;
    const next = digitsOnly(raw).slice(0, codeLength);
    if (next !== raw) {
      const start = digitsOnly(raw.slice(0, input.selectionStart ?? raw.length)).length;
      const end = digitsOnly(raw.slice(0, input.selectionEnd ?? raw.length)).length;
      const direction = input.selectionDirection;
      input.value = next;
      input.setSelectionRange(start, end, direction ?? "none");
    }
    trackSelection(input);
    if (next === code) return;
    onValueChange(next);
    if (next.length === codeLength) onComplete?.(next);
  }

  function paste(event: ClipboardEvent<HTMLInputElement>) {
    onPaste?.(event);
    if (event.defaultPrevented || disabled || inputProps.readOnly) return;
    event.preventDefault();
    const input = event.currentTarget;
    const start = input.selectionStart ?? code.length;
    const end = input.selectionEnd ?? start;
    const incoming = digitsOnly(event.clipboardData.getData("text")).slice(0, codeLength - code.length + end - start);
    if (incoming) {
      input.setRangeText(incoming, start, end, "end");
      update(input);
    }
  }

  return (
    <div className="dds-otp-input" dir="ltr" data-disabled={disabled || undefined}>
      {Array.from({ length: codeLength }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          data-active={index === activeCell || undefined}
          data-caret={index === activeCell && selection.collapsed ? caret : undefined}
        />
      ))}
      <input
        {...inputProps}
        ref={ref}
        className={["dds-otp-input__control", className].filter(Boolean).join(" ")}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        maxLength={codeLength}
        value={code}
        disabled={disabled}
        onFocus={event => { trackSelection(event.currentTarget); onFocus?.(event); }}
        onSelect={event => { trackSelection(event.currentTarget); onSelect?.(event); }}
        onChange={event => update(event.currentTarget)}
        onPaste={paste}
      />
    </div>
  );
});
