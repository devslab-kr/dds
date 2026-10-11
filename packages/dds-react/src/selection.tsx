import { forwardRef, type ComponentProps, type ReactNode } from "react";
import { Tabs as ArkTabs, useTabsContext } from "@ark-ui/react/tabs";
import {
  RadioGroup as ArkRadioGroup,
  useRadioGroupContext,
} from "@ark-ui/react/radio-group";
import { classes } from "./controls";
export interface TabsProps
  extends Omit<ComponentProps<typeof ArkTabs.Root>, "onValueChange"> {
  onValueChange?: (value: string) => void;
  unstyled?: boolean;
}
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  { onValueChange, unstyled, className, ...rest },
  ref
) {
  return (
    <ArkTabs.Root
      {...rest}
      ref={ref}
      onValueChange={(details) => onValueChange?.(details.value)}
      className={classes(!unstyled && "dds-tabs-root", className)}
    />
  );
});
export type TabProps = ComponentProps<typeof ArkTabs.Trigger> & {
  unstyled?: boolean;
};
export type TabPanelProps = ComponentProps<typeof ArkTabs.Content>;
export const TabList = forwardRef<
  HTMLDivElement,
  ComponentProps<typeof ArkTabs.List> & { unstyled?: boolean }
>(function TabList({ unstyled, className, ...rest }, ref) {
  return (
    <ArkTabs.List
      {...rest}
      ref={ref}
      className={classes(!unstyled && "dds-tabs", className)}
    />
  );
});
export const Tab = forwardRef<HTMLButtonElement, TabProps>(function Tab(
  { unstyled, className, ...rest },
  ref
) {
  return (
    <ArkTabs.Trigger
      {...rest}
      ref={ref}
      className={classes(!unstyled && "dds-tab", className)}
    />
  );
});
export const TabPanel = forwardRef<HTMLDivElement, TabPanelProps>(
  function TabPanel({ value, style, ...rest }, ref) {
    const tabs = useTabsContext();
    const inactive = tabs.value !== value;
    return (
      <ArkTabs.Content
        {...rest}
        value={value}
        ref={ref}
        hidden={inactive}
        style={inactive ? { ...style, display: "none" } : style}
      />
    );
  }
);
function VisibleRadioInput({ option }: { option: RadioOption }) {
  const group = useRadioGroupContext();
  // Ark owns selection and roving focus; DDS displays the native radio.
  const {
    style: _,
    defaultChecked: __,
    ...inputProps
  } = group.getItemHiddenInputProps(option);
  return (
    <input
      {...inputProps}
      checked={group.value === option.value}
      onChange={() => {}}
      className="dds-check__input"
    />
  );
}
export interface RadioOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}
export interface RadioGroupProps
  extends Omit<
    ComponentProps<typeof ArkRadioGroup.Root>,
    "onValueChange" | "children"
  > {
  options: readonly RadioOption[];
  label: ReactNode;
  onValueChange?: (value: string) => void;
  children?: ReactNode;
}
export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  function RadioGroup(
    { options, label, onValueChange, className, children, ...rest },
    ref
  ) {
    return (
      <ArkRadioGroup.Root
        {...rest}
        ref={ref}
        onValueChange={(details) => {
          if (details.value !== null) onValueChange?.(details.value);
        }}
        className={classes("dds-radio-group", className)}
      >
        <ArkRadioGroup.Label className="dds-field__label">
          {label}
        </ArkRadioGroup.Label>
        {options.map((option) => (
          <ArkRadioGroup.Item
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className="dds-check"
          >
            <VisibleRadioInput option={option} />
            <ArkRadioGroup.ItemText>{option.label}</ArkRadioGroup.ItemText>
          </ArkRadioGroup.Item>
        ))}
        {children}
      </ArkRadioGroup.Root>
    );
  }
);
