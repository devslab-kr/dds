import {
  createEffect,
  createSignal,
  createUniqueId,
  onCleanup,
  onMount,
  splitProps,
  type JSX,
} from "solid-js";
import { classes } from "./utils";

export type LabelPlacement = "outside" | "inside" | "hidden";
export interface InputProps
  extends Omit<
    JSX.InputHTMLAttributes<HTMLInputElement>,
    "type" | "value" | "defaultValue" | "children" | "class"
  > {
  type?: "text" | "search" | "email" | "tel" | "url" | "password" | "number";
  value?: string;
  defaultValue?: string;
  onValueChange?: (next: string) => void;
  label?: JSX.Element;
  labelPlacement?: LabelPlacement;
  clearable?: boolean;
  clearLabel?: string;
  class?: string;
  wrapperClass?: string;
  /** Alias for the native Solid readonly property. */
  readOnly?: boolean;
}
function callHandler<E>(
  handler:
    | ((event: E) => void)
    | { 0: (data: any, event: E) => void; 1: any }
    | undefined,
  event: E,
) {
  if (typeof handler === "function") handler(event);
  else if (handler) handler[0](handler[1], event);
}
/** A native text input. Supply label, aria-label, or aria-labelledby. */
export function Input(props: InputProps) {
  const [local, rest] = splitProps(props, [
    "value",
    "defaultValue",
    "onValueChange",
    "label",
    "labelPlacement",
    "clearable",
    "clearLabel",
    "class",
    "wrapperClass",
    "id",
    "type",
    "ref",
    "onInput",
    "onKeyDown",
    "disabled",
    "readonly",
    "readOnly",
  ]);
  const generated = createUniqueId();
  const id = () => local.id ?? `dds-input-${generated}`;
  const initial = local.defaultValue ?? "";
  const [internal, setInternal] = createSignal(initial);
  const current = () => local.value ?? internal();
  const readOnly = () => local.readonly || local.readOnly;
  let input!: HTMLInputElement;
  onMount(() => {
    input.defaultValue = initial;
  });
  createEffect(() => {
    // Native form ownership can change after mount, including external forms.
    void rest.form;
    const form = input.form;
    const reset = (event: Event) =>
      queueMicrotask(() => {
        if (event.defaultPrevented) return;
        if (local.value === undefined) setInternal(initial);
        input.value = current();
      });
    form?.addEventListener("reset", reset);
    onCleanup(() => form?.removeEventListener("reset", reset));
  });
  const update = (next: string) => {
    if (local.disabled || readOnly()) return;
    if (local.value === undefined) setInternal(next);
    local.onValueChange?.(next);
    // A declined controlled edit must not leave the DOM holding a draft.
    input.value = current();
  };
  return (
    <span
      class={classes("dds-input", local.wrapperClass)}
      data-label-placement={local.labelPlacement ?? "outside"}
      data-filled={current().length > 0 ? "" : undefined}
      data-disabled={local.disabled ? "" : undefined}
      data-readonly={readOnly() ? "" : undefined}
    >
      {local.label != null && (
        <label for={id()} class="dds-input__label">
          {local.label}
        </label>
      )}
      <input
        {...rest}
        ref={(node) => {
          input = node;
          if (typeof local.ref === "function") local.ref(node);
        }}
        id={id()}
        type={local.type ?? "text"}
        disabled={local.disabled}
        readonly={readOnly()}
        class={classes("dds-input__control", local.class)}
        value={current()}
        onInput={(event) => {
          callHandler(local.onInput, event);
          update(event.currentTarget.value);
        }}
        onKeyDown={(event) => {
          callHandler(local.onKeyDown, event);
          if (
            event.key === "Enter" &&
            (event.isComposing || event.keyCode === 229)
          )
            event.preventDefault();
        }}
      />
      {local.clearable &&
        current().length > 0 &&
        !local.disabled &&
        !readOnly() && (
          <button
            type="button"
            class="dds-input__clear"
            aria-label={local.clearLabel ?? "내용 지우기"}
            onPointerDown={(event) => event.preventDefault()}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              update("");
              input.focus();
            }}
          >
            <span aria-hidden="true">×</span>
          </button>
        )}
    </span>
  );
}
export interface InputGroupProps extends JSX.HTMLAttributes<HTMLDivElement> {
  start?: JSX.Element;
  end?: JSX.Element;
  children?: JSX.Element;
}
/** Layout only: the child Input owns its value and accessible name. */
export function InputGroup(props: InputGroupProps) {
  const [local, rest] = splitProps(props, [
    "start",
    "end",
    "class",
    "children",
  ]);
  return (
    <div {...rest} class={classes("dds-input-group", local.class)}>
      {local.start != null && (
        <span class="dds-input-group__start">{local.start}</span>
      )}
      {local.children}
      {local.end != null && (
        <span class="dds-input-group__end">{local.end}</span>
      )}
    </div>
  );
}
