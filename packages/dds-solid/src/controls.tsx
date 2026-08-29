import {
  createUniqueId,
  splitProps,
  type JSX,
  type ParentProps,
} from "solid-js";

import { createControllableSignal } from "./controllable";
import { classes, describedBy } from "./utils";

export type ButtonTone = "primary" | "secondary" | "ghost" | "danger";
export type ControlSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "class"> {
  class?: string;
  tone?: ButtonTone;
  size?: ControlSize;
  loading?: boolean;
}

export function Button(props: ParentProps<ButtonProps>) {
  const [local, rest] = splitProps(props, ["class", "tone", "size", "loading", "disabled", "type", "children"]);
  return (
    <button
      {...rest}
      type={local.type ?? "button"}
      class={classes("dds-btn", `dds-btn--${local.tone ?? "primary"}`, local.size !== "md" && local.size ? `dds-btn--${local.size}` : undefined, local.class)}
      disabled={local.disabled || local.loading}
      aria-busy={local.loading ? "true" : undefined}
    >
      {local.loading && <span class="dds-spinner" aria-hidden="true" />}
      {local.children}
    </button>
  );
}

export interface IconButtonProps extends Omit<ButtonProps, "tone" | "children"> {
  "aria-label": string;
  tone?: "ghost" | "secondary" | "danger";
  children: JSX.Element;
}

export function IconButton(props: IconButtonProps) {
  const [local, rest] = splitProps(props, ["class", "tone", "size", "loading", "disabled", "type", "children"]);
  return (
    <button
      {...rest}
      type={local.type ?? "button"}
      class={classes("dds-iconbtn", local.tone && local.tone !== "ghost" ? `dds-iconbtn--${local.tone}` : undefined, local.size !== "md" && local.size ? `dds-iconbtn--${local.size}` : undefined, local.class)}
      disabled={local.disabled || local.loading}
      aria-busy={local.loading ? "true" : undefined}
    >
      {local.loading ? <span class="dds-spinner" aria-hidden="true" /> : local.children}
    </button>
  );
}

export interface FieldControlProps {
  id: string;
  "aria-describedby": string | undefined;
  "aria-invalid": "true" | undefined;
  "aria-required": "true" | undefined;
}

export interface FieldProps {
  id?: string;
  label: JSX.Element;
  helpText?: JSX.Element;
  error?: JSX.Element;
  required?: boolean;
  class?: string;
  children: JSX.Element | ((props: FieldControlProps) => JSX.Element);
}

export function Field(props: FieldProps) {
  const generated = createUniqueId();
  const id = () => props.id ?? `dds-field-${generated}`;
  const helpId = () => props.helpText ? `${id()}-help` : undefined;
  const errorId = () => props.error ? `${id()}-error` : undefined;
  const control = (): FieldControlProps => ({
    id: id(),
    "aria-describedby": describedBy(helpId(), errorId()),
    "aria-invalid": props.error ? "true" : undefined,
    "aria-required": props.required ? "true" : undefined,
  });
  return (
    <div class={classes("dds-field", props.error ? "dds-field--error" : undefined, props.class)}>
      <label class="dds-field__label" for={id()}>{props.label}{props.required && <span aria-hidden="true"> *</span>}</label>
      {typeof props.children === "function" ? props.children(control()) : props.children}
      {props.helpText && <div id={helpId()} class="dds-field__help">{props.helpText}</div>}
      {props.error && <div id={errorId()} class="dds-field__error" role="alert">{props.error}</div>}
    </div>
  );
}

export interface SelectProps extends Omit<JSX.SelectHTMLAttributes<HTMLSelectElement>, "class"> {
  class?: string;
  invalid?: boolean;
}

export function Select(props: ParentProps<SelectProps>) {
  const [local, rest] = splitProps(props, ["class", "invalid", "children"]);
  return (
    <span class={classes("dds-select", local.class)}>
      <select {...rest} class="dds-select__input" aria-invalid={local.invalid ? "true" : undefined}>
        {local.children}
      </select>
    </span>
  );
}

interface CheckableProps extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "checked" | "class" | "onChange" | "role" | "type"> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label: JSX.Element;
  class?: string;
  inputClass?: string;
}

function Checkable(props: CheckableProps & { type: "checkbox" | "radio"; role?: "switch" }) {
  const [local, rest] = splitProps(props, ["checked", "defaultChecked", "onCheckedChange", "label", "class", "inputClass", "type", "role"]);
  const [checked, setChecked] = createControllableSignal({
    value: () => local.checked,
    defaultValue: local.defaultChecked ?? false,
    onChange: local.onCheckedChange,
  });
  return (
    <label class={classes(local.role === "switch" ? "dds-switch" : "dds-check", local.class)}>
      <input
        {...rest}
        type={local.type}
        role={local.role}
        class={classes(local.role === "switch" ? "dds-switch__input" : "dds-check__input", local.inputClass)}
        checked={checked()}
        onChange={(event) => setChecked(event.currentTarget.checked)}
      />
      <span>{local.label}</span>
    </label>
  );
}

export type CheckboxProps = CheckableProps;
export const Checkbox = (props: CheckboxProps) => <Checkable {...props} type="checkbox" />;

export type RadioProps = CheckableProps;
export const Radio = (props: RadioProps) => <Checkable {...props} type="radio" />;

export type SwitchProps = CheckableProps;
export const Switch = (props: SwitchProps) => <Checkable {...props} type="checkbox" role="switch" />;
