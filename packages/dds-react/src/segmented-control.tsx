import { SegmentGroup } from "@ark-ui/react/segment-group";
import { useCallback, useEffect, useId, useRef } from "react";
import { choiceWarningsEnabled } from "./choice-types";
import { classes } from "./controls";
import { useDirection, type Direction } from "./direction";

export interface SegmentedControlItem {
  /** Nonempty ID, unique within the control. This is what callbacks and forms receive. */
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SegmentedControlProps {
  items: readonly SegmentedControlItem[];
  value?: string;
  defaultValue?: string;
  /** Called with the chosen item ID, only after a user choice. */
  onValueChange?: (value: string) => void;
  /** Visible group label. Without it, supply aria-label or aria-labelledby. */
  label?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  id?: string;
  name?: string;
  form?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
  /** md is 40px tall like other DDS controls, sm is 32px. */
  size?: "md" | "sm";
  /** Segments share the available width equally instead of sizing to their labels. */
  fullWidth?: boolean;
  dir?: Direction;
  className?: string;
}

export function validateSegmentedItems(items: readonly SegmentedControlItem[]) {
  if (items.length === 0)
    throw new Error("DDS SegmentedControl: items must not be empty");
  const ids = new Set<string>();
  for (const item of items) {
    if (!item.value || ids.has(item.value))
      throw new Error(
        `DDS SegmentedControl: item values must be nonempty and unique (${JSON.stringify(item.value)})`,
      );
    ids.add(item.value);
  }
}

/**
 * Single choice among a few visible options (view switch, filter).
 * Radio-group semantics come from Ark: one tab stop, arrow keys move and select,
 * and each segment submits through a native radio input.
 */
export function SegmentedControl(props: SegmentedControlProps) {
  // Ark derives every part ID (label, radios) from the root ID; an undefined
  // id prop would override its generated one and collide across instances.
  const generated = useId();
  const root = useRef<HTMLDivElement | null>(null);
  const direction = useDirection(root, props.dir);
  // Native form reset returns to the first rendered choice.
  const initialValue = useRef(props.value ?? props.defaultValue).current;
  const { items, label } = props;
  const ariaLabel = props["aria-label"];
  const ariaLabelledby = props["aria-labelledby"];
  useEffect(() => validateSegmentedItems(items), [items]);
  useEffect(() => {
    if (choiceWarningsEnabled() && !label && !ariaLabel && !ariaLabelledby)
      console.warn(
        "DDS SegmentedControl: supply label, aria-label or aria-labelledby.",
      );
  }, [label, ariaLabel, ariaLabelledby]);
  const onValueChange = props.onValueChange;
  const handleValueChange = useCallback(
    (details: { value: string | null }) => {
      if (details.value !== null) onValueChange?.(details.value);
    },
    [onValueChange],
  );
  const setDefaultChecked = useCallback(
    (input: HTMLInputElement | null) => {
      if (input) input.defaultChecked = initialValue === input.value;
    },
    [initialValue],
  );
  return (
    <SegmentGroup.Root
      ref={root}
      id={props.id ?? `dds-segmented-${generated}`}
      // A consumer id lands on the group element itself, not on Zag's prefixed root ID.
      ids={props.id ? { root: props.id } : undefined}
      dir={direction}
      orientation="horizontal"
      value={props.value}
      defaultValue={props.defaultValue}
      name={props.name}
      form={props.form}
      required={props.required}
      disabled={props.disabled}
      readOnly={props.readOnly}
      invalid={props.invalid}
      onValueChange={handleValueChange}
      // Without a visible label the group is named by the consumer's attributes;
      // Ark's own aria-labelledby would otherwise point at a label that is not rendered.
      aria-label={label ? undefined : ariaLabel}
      // (null removes Ark's attribute; undefined would let it through the merge.)
      aria-labelledby={
        label ? undefined : ((ariaLabelledby ?? null) as unknown as string)
      }
      aria-describedby={props["aria-describedby"]}
      className={classes("dds-segmented", props.className)}
      data-size={props.size ?? "md"}
      data-full-width={props.fullWidth ? "" : undefined}
    >
      {label ? (
        <SegmentGroup.Label className="dds-segmented__label">
          {label}
        </SegmentGroup.Label>
      ) : null}
      <div className="dds-segmented__track">
        {items.map((item) => (
          <SegmentGroup.Item
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            className="dds-segmented__item"
            title={props.fullWidth ? item.label : undefined}
          >
            <SegmentGroup.ItemText
              className="dds-segmented__text"
              data-text={item.label}
            >
              {item.label}
            </SegmentGroup.ItemText>
            <SegmentGroup.ItemHiddenInput ref={setDefaultChecked} />
          </SegmentGroup.Item>
        ))}
      </div>
    </SegmentGroup.Root>
  );
}
