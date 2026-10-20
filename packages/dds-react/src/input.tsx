import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { classes } from "./controls";

export type LabelPlacement = "outside" | "inside" | "hidden";
export interface InputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "type" | "value" | "defaultValue" | "children"
  > {
  type?: "text" | "search" | "email" | "tel" | "url" | "password" | "number";
  value?: string;
  defaultValue?: string;
  onValueChange?: (next: string) => void;
  label?: ReactNode;
  labelPlacement?: LabelPlacement;
  clearable?: boolean;
  clearLabel?: string;
  wrapperClassName?: string;
}

/** A native text input. Supply label, aria-label, or aria-labelledby. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    value,
    defaultValue = "",
    onValueChange,
    label,
    labelPlacement = "outside",
    clearable,
    clearLabel = "내용 지우기",
    wrapperClassName,
    className,
    id: requestedId,
    type = "text",
    onChange,
    onKeyDown,
    disabled,
    readOnly,
    ...rest
  },
  forwardedRef,
) {
  const generated = useId();
  const id = requestedId ?? `dds-input-${generated}`;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const initial = useRef(defaultValue);
  const [internal, setInternal] = useState(defaultValue);
  const current = value ?? internal;
  const controlled = value !== undefined;
  const latest = useRef({ controlled, current });
  latest.current = { controlled, current };
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.defaultValue = initial.current;
    // The browser resets the controls after the reset event; after a reset-button
    // click a microtask would run before that, so restore on a task. Respect
    // preventDefault, and keep the parent's controlled value.
    const reset = (event: Event) =>
      setTimeout(() => {
        if (event.defaultPrevented) return;
        if (latest.current.controlled) input.value = latest.current.current;
        else {
          input.value = initial.current;
          setInternal(initial.current);
        }
      });
    const form = input.form;
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, [rest.form]);
  const update = (next: string) => {
    if (disabled || readOnly) return;
    if (!controlled) setInternal(next);
    onValueChange?.(next);
  };
  return (
    <span
      className={classes("dds-input", wrapperClassName)}
      data-label-placement={labelPlacement}
      data-filled={current.length > 0 ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      data-readonly={readOnly ? "" : undefined}
    >
      {label != null && (
        <label htmlFor={id} className="dds-input__label">
          {label}
        </label>
      )}
      <input
        {...rest}
        id={id}
        type={type}
        disabled={disabled}
        readOnly={readOnly}
        ref={(node) => {
          inputRef.current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) forwardedRef.current = node;
        }}
        className={classes("dds-input__control", className)}
        value={current}
        onChange={(event) => {
          onChange?.(event);
          update(event.currentTarget.value);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (
            event.key === "Enter" &&
            (event.nativeEvent.isComposing || event.keyCode === 229)
          )
            event.preventDefault();
        }}
      />
      {clearable && current.length > 0 && !disabled && !readOnly && (
        <button
          type="button"
          className="dds-input__clear"
          aria-label={clearLabel}
          onPointerDown={(event) => event.preventDefault()}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            update("");
            inputRef.current?.focus();
          }}
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
    </span>
  );
});

export interface InputGroupProps extends HTMLAttributes<HTMLDivElement> {
  start?: ReactNode;
  end?: ReactNode;
}
/** Layout only: the child Input owns its value and accessible name. */
export const InputGroup = forwardRef<HTMLDivElement, InputGroupProps>(
  function InputGroup({ start, end, className, children, ...rest }, ref) {
    return (
      <div
        {...rest}
        ref={ref}
        className={classes("dds-input-group", className)}
      >
        {start != null && (
          <span className="dds-input-group__start">{start}</span>
        )}
        {children}
        {end != null && <span className="dds-input-group__end">{end}</span>}
      </div>
    );
  },
);
