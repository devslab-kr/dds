import {
  forwardRef,
  useId,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { Field as ArkField } from "@ark-ui/react/field";
import { Checkbox as ArkCheckbox } from "@ark-ui/react/checkbox";
import { Switch as ArkSwitch } from "@ark-ui/react/switch";
export const classes = (...values: (string | false | undefined)[]) =>
  values.filter(Boolean).join(" ");
export type ButtonTone = "primary" | "secondary" | "ghost" | "danger";
export type ControlSize = "sm" | "md" | "lg";
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: ButtonTone;
  size?: ControlSize;
  loading?: boolean;
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      tone = "primary",
      size = "md",
      loading,
      disabled,
      type = "button",
      className,
      children,
      ...rest
    },
    ref
  ) {
    return (
      <button
        {...rest}
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={classes(
          "dds-btn",
          `dds-btn--${tone}`,
          size !== "md" && `dds-btn--${size}`,
          className
        )}
      >
        {loading && <span className="dds-spinner" aria-hidden />}
        {children}
      </button>
    );
  }
);
export interface IconButtonProps extends Omit<ButtonProps, "tone"> {
  "aria-label": string;
  tone?: "ghost" | "secondary" | "danger";
}
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
      tone = "ghost",
      size = "md",
      loading,
      disabled,
      type = "button",
      className,
      children,
      ...rest
    },
    ref
  ) {
    return (
      <button
        {...rest}
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={classes(
          "dds-iconbtn",
          tone !== "ghost" && `dds-iconbtn--${tone}`,
          size !== "md" && `dds-iconbtn--${size}`,
          className
        )}
      >
        {loading ? <span className="dds-spinner" aria-hidden /> : children}
      </button>
    );
  }
);
export interface FieldControlProps {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
  "aria-required"?: true;
}
export interface FieldProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label: ReactNode;
  helpText?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  children: ReactNode | ((props: FieldControlProps) => ReactNode);
}
export const Field = forwardRef<HTMLDivElement, FieldProps>(function Field(
  {
    id: requested,
    label,
    helpText,
    error,
    required,
    className,
    children,
    ...rest
  },
  ref
) {
  const generated = useId();
  const id = requested ?? `dds-field-${generated}`;
  const control: FieldControlProps = {
    id,
    "aria-describedby":
      [helpText && `${id}-help`, error && `${id}-error`]
        .filter(Boolean)
        .join(" ") || undefined,
    "aria-invalid": error ? true : undefined,
    "aria-required": required ? true : undefined,
  };
  return (
    <ArkField.Root
      {...rest}
      ref={ref}
      invalid={Boolean(error)}
      required={required}
      id={id}
      ids={{
        control: `${id}-root`,
        helperText: `${id}-help`,
        errorText: `${id}-error`,
      }}
      className={classes(
        "dds-field",
        Boolean(error) && "dds-field--error",
        className
      )}
    >
      <ArkField.Label htmlFor={id} className="dds-field__label">
        {label}
        {required && <span aria-hidden> *</span>}
      </ArkField.Label>
      {typeof children === "function" ? children(control) : children}
      {helpText && (
        <ArkField.HelperText className="dds-field__help">
          {helpText}
        </ArkField.HelperText>
      )}
      {error && (
        <ArkField.ErrorText className="dds-field__error" role="alert">
          {error}
        </ArkField.ErrorText>
      )}
    </ArkField.Root>
  );
});
export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
  wrapperClassName?: string;
}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    { invalid, wrapperClassName, className, children, ...rest },
    ref
  ) {
    return (
      <span className={classes("dds-select", wrapperClassName)}>
        <select
          {...rest}
          ref={ref}
          className={classes("dds-select__input", className)}
          aria-invalid={invalid || rest["aria-invalid"]}
        >
          {children}
        </select>
      </span>
    );
  }
);
export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "children"> {
  label: ReactNode;
  onCheckedChange?: (checked: boolean) => void;
  inputClassName?: string;
}
export type RadioProps = CheckboxProps;
export type SwitchProps = CheckboxProps;
const Checkable = forwardRef<
  HTMLInputElement,
  CheckboxProps & { kind: "checkbox" | "switch" }
>(function Checkable(
  {
    kind,
    label,
    checked,
    defaultChecked,
    onCheckedChange,
    id,
    name,
    value,
    disabled,
    required,
    readOnly,
    form,
    className,
    inputClassName,
    onChange,
    ...rest
  },
  ref
) {
  const Root = kind === "switch" ? ArkSwitch.Root : ArkCheckbox.Root;
  const Label = kind === "switch" ? ArkSwitch.Label : ArkCheckbox.Label;
  const Context = kind === "switch" ? ArkSwitch.Context : ArkCheckbox.Context;
  const base = kind === "switch" ? "dds-switch" : "dds-check";
  return (
    <Root
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={(details) => onCheckedChange?.(details.checked === true)}
      ids={id ? { hiddenInput: id } : undefined}
      name={name}
      value={String(value ?? "on")}
      disabled={disabled}
      required={required}
      readOnly={readOnly}
      form={form}
      className={classes(base, className)}
    >
      <Context>
        {(api) => {
          // DDS styles the actual input. Keep Ark's events and state, but omit
          // its visually hidden style and use React's controlled checked prop
          // so a caller-declined change also restores the native DOM value.
          const {
            style: _,
            defaultChecked: __,
            ...inputProps
          } = api.getHiddenInputProps();
          return (
            <input
              {...inputProps}
              {...rest}
              ref={ref}
              checked={api.checked}
              role={kind === "switch" ? "switch" : undefined}
              onChange={onChange ?? (() => {})}
              onClick={(event) => {
                rest.onClick?.(event);
                if (!event.defaultPrevented) inputProps.onClick?.(event);
              }}
              className={classes(`${base}__input`, inputClassName)}
            />
          );
        }}
      </Context>
      <Label>{label}</Label>
    </Root>
  );
});
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (props, ref) => <Checkable {...props} kind="checkbox" ref={ref} />
);
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  (props, ref) => <Checkable {...props} kind="switch" ref={ref} />
);
export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, className, inputClassName, onCheckedChange, onChange, ...rest },
  ref
) {
  return (
    <label className={classes("dds-check", className)}>
      <input
        {...rest}
        ref={ref}
        type="radio"
        className={classes("dds-check__input", inputClassName)}
        onChange={(event) => {
          onChange?.(event);
          if (!event.defaultPrevented)
            onCheckedChange?.(event.currentTarget.checked);
        }}
      />
      <span>{label}</span>
    </label>
  );
});
