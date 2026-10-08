import {
  createUniqueId,
  splitProps,
  type JSX,
  type ParentProps,
} from "solid-js";

import { createControllableSignal } from "./controllable";
import { useCheckbox } from "@ark-ui/solid/checkbox";
import { useSwitch } from "@ark-ui/solid/switch";
import { Field as ArkField } from "@ark-ui/solid/field";
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
    <ArkField.Root id={id()} required={props.required ?? false} invalid={Boolean(props.error)} ids={{ control: `${id()}-root`, helperText: `${id()}-help`, errorText: `${id()}-error` }} class={classes("dds-field", props.error ? "dds-field--error" : undefined, props.class)}>
      <ArkField.Label class="dds-field__label" for={id()}>{props.label}{props.required && <span aria-hidden="true"> *</span>}</ArkField.Label>
      {typeof props.children === "function" ? props.children(control()) : props.children}
      {props.helpText && <ArkField.HelperText class="dds-field__help">{props.helpText}</ArkField.HelperText>}
      {props.error && <ArkField.ErrorText class="dds-field__error" role="alert">{props.error}</ArkField.ErrorText>}
    </ArkField.Root>
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
export const Checkbox = (props: CheckboxProps) => <ArkCheckable {...props} kind="checkbox" />;

export type RadioProps = CheckableProps;
export const Radio = (props: RadioProps) => <Checkable {...props} type="radio" />;

export type SwitchProps = CheckableProps;
export const Switch = (props: SwitchProps) => <ArkCheckable {...props} kind="switch" />;

function ArkCheckable(props: CheckableProps & { kind: "checkbox" | "switch" }) {
  const generated = createUniqueId();
  const [local, rest] = splitProps(props, ["checked", "defaultChecked", "onCheckedChange", "label", "class", "inputClass", "kind", "id", "onClick", "onFocusIn", "onFocusOut", "style"]);
  const options = () => ({
    id: `dds-check-${generated}`,
    ids: { hiddenInput: local.id ?? `dds-check-${generated}-input` },
    checked: local.checked, defaultChecked: local.defaultChecked,
    onCheckedChange: (details: { checked: boolean | "indeterminate" }) => local.onCheckedChange?.(details.checked === true),
    disabled: rest.disabled, required: rest.required, readOnly: rest.readonly,
    name: rest.name, form: rest.form, value: String(rest.value ?? "on"),
  });
  const api = local.kind === "switch" ? useSwitch(options) : useCheckbox(options);
  const inputClass = () => local.kind === "switch" ? "dds-switch__input" : "dds-check__input";
  const rootProps = () => {
    const [, attributes] = splitProps(api().getRootProps(), ["onClick"]);
    return attributes;
  };
  return <label {...rootProps()} class={classes(local.kind === "switch" ? "dds-switch" : "dds-check", local.class)}>
    <input {...api().getHiddenInputProps()} {...rest}
      ref={(input) => {
        // Ark normalizes defaultChecked to checked. Preserve the native reset
        // baseline as well when rendering its input visibly with DDS CSS.
        input.defaultChecked = local.checked ?? local.defaultChecked ?? false;
        if (typeof rest.ref === "function") rest.ref(input);
      }}
      type="checkbox" role={local.kind === "switch" ? "switch" : undefined}
      class={classes(inputClass(), local.inputClass)}
      style={local.style ?? {}} checked={api().checked}
      onFocusIn={(event) => {
        callInputHandler(api().getHiddenInputProps().onFocusIn, event);
        callInputHandler(local.onFocusIn, event);
      }}
      onFocusOut={(event) => {
        callInputHandler(api().getHiddenInputProps().onFocusOut, event);
        callInputHandler(local.onFocusOut, event);
      }}
      onClick={(event) => {
        if (typeof local.onClick === "function") local.onClick(event);
        else if (local.onClick) local.onClick[0](local.onClick[1], event);
        if (!event.defaultPrevented) {
          const handler = api().getHiddenInputProps().onClick;
          if (typeof handler === "function") handler(event);
          else if (handler) handler[0](handler[1], event);
        }
      }}
    />
    <span {...api().getLabelProps()}>{local.label}</span>
  </label>;
}

function callInputHandler(handler: JSX.FocusEventHandlerUnion<HTMLInputElement, FocusEvent> | undefined, event: FocusEvent & { currentTarget: HTMLInputElement; target: HTMLInputElement }) {
  if (typeof handler === "function") handler(event);
  else if (handler) handler[0](handler[1], event);
}
