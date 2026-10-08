import { RadioGroup as ArkRadioGroup } from "@ark-ui/solid/radio-group";
import { For, type JSX } from "solid-js";
import { classes } from "./utils";

export interface RadioOption {
  value: string;
  label: JSX.Element;
  disabled?: boolean;
}
export interface RadioGroupProps {
  options: readonly RadioOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  form?: string;
  disabled?: boolean;
  required?: boolean;
  label: JSX.Element;
  class?: string;
}

/** Grouped radios delegate selection and roving keyboard focus to Ark. */
export function RadioGroup(props: RadioGroupProps) {
  const initialValue = props.value ?? props.defaultValue;
  return <ArkRadioGroup.Root
    value={props.value} defaultValue={props.defaultValue}
    name={props.name} form={props.form} disabled={props.disabled} required={props.required}
    onValueChange={(details) => { if (details.value !== null) props.onValueChange?.(details.value); }}
    class={classes("dds-radio-group", props.class)}
  >
    <ArkRadioGroup.Label class="dds-field__label">{props.label}</ArkRadioGroup.Label>
    <For each={props.options}>{(option) => <ArkRadioGroup.Item value={option.value} disabled={option.disabled} class="dds-check">
      <ArkRadioGroup.ItemHiddenInput class="dds-check__input" style={{}}
        ref={(input) => { input.defaultChecked = initialValue === option.value; }} />
      <ArkRadioGroup.ItemText>{option.label}</ArkRadioGroup.ItemText>
    </ArkRadioGroup.Item>}</For>
  </ArkRadioGroup.Root>;
}
