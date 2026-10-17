import { Combobox as C, createListCollection } from "@ark-ui/react/combobox";
import { Select as S } from "@ark-ui/react/select";
import { Portal } from "@ark-ui/react/portal";
import { defaultRangeExtractor, useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  choiceMessages,
  choiceWarningsEnabled,
  validateOptions,
  type ComboboxProps,
} from "../choice-types";

/** The native validation input stores one ID, never a second option collection. */
const validationStyle = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  border: 0,
  clipPath: "inset(50%)",
  overflow: "hidden",
  whiteSpace: "nowrap",
} as const;
export function Choice(props: ComboboxProps & { searchable: boolean }) {
  validateOptions(props.items);
  const [internal, setInternal] = useState(props.defaultValue ?? "");
  const value = props.value ?? internal;
  const selected =
    props.items.find((item) => item.value === value) ??
    (props.selectedOption?.value === value ? props.selectedOption : undefined);
  const label = selected?.label ?? value;
  const [draft, setDraft] = useState(props.defaultInputValue ?? label);
  const inputValue = props.inputValue ?? draft;
  const [open, setOpen] = useState(false),
    [highlight, setHighlight] = useState<string | null>(null);
  const visibleRef = useRef<HTMLInputElement | HTMLButtonElement>(null),
    validationRef = useRef<HTMLInputElement>(null),
    scrollRef = useRef<HTMLDivElement>(null);
  const [portalMount, setPortalMount] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const control = visibleRef.current;
    if (control) {
      // Modal isolation hides body siblings. Keep nested choices in the modal's
      // DOM subtree so their options remain available to assistive technology.
      setPortalMount(
        control.closest<HTMLElement>('[role="dialog"], [role="alertdialog"]') ??
          control.ownerDocument.body,
      );
    }
  }, []);
  const composing = useRef(false),
    previousSelection = useRef({ value, label });
  const pendingRestore = useRef<{ from: string; to: string } | null>(null);
  const resolveLabel = (id: string) =>
    props.items.find((item) => item.value === id)?.label ??
    (props.selectedOption?.value === id ? props.selectedOption.label : id);
  const messages = { ...choiceMessages, ...props.messages };
  const blocked = props.disabled || props.readOnly;
  const setInput = (next: string) => {
    if (
      pendingRestore.current?.from === inputValue &&
      pendingRestore.current.to === next
    )
      return;
    pendingRestore.current = null;
    if (props.inputValue === undefined) setDraft(next);
    props.onInputValueChange?.(next);
  };
  const restoreInput = (next: string) => {
    if (next === inputValue) return;
    if (
      pendingRestore.current?.from === inputValue &&
      pendingRestore.current.to === next
    )
      return;
    pendingRestore.current = { from: inputValue, to: next };
    if (props.inputValue === undefined) setDraft(next);
    else props.onInputValueChange?.(next);
  };
  const setValue = (next: string) => {
    if (props.value === undefined) setInternal(next);
    props.onValueChange?.(next);
  };
  useEffect(() => {
    if (
      previousSelection.current.value !== value ||
      previousSelection.current.label !== label
    ) {
      previousSelection.current = { value, label };
      restoreInput(label);
    }
  }, [value, label]);
  useEffect(() => {
    if (choiceWarningsEnabled() && value && !selected)
      console.warn(
        `DDS choice: no label supplied for selected ID ${JSON.stringify(value)}; pass selectedOption when the selection is outside items.`,
      );
  }, [value, selected]);
  useEffect(() => {
    const form = validationRef.current?.form;
    if (!form) return;
    const reset = (event: Event) =>
      queueMicrotask(() => {
        if (event.defaultPrevented) return;
        const resetValue = props.value ?? props.defaultValue ?? "";
        const resetLabel = resolveLabel(resetValue);
        previousSelection.current = { value: resetValue, label: resetLabel };
        if (props.value === undefined) setInternal(resetValue);
        const resetQuery = props.defaultInputValue ?? resetLabel;
        pendingRestore.current = null;
        if (props.inputValue === undefined) setDraft(resetQuery);
        else restoreInput(resetQuery);
        setOpen(false);
        if (visibleRef.current instanceof HTMLInputElement)
          visibleRef.current.value = props.inputValue ?? resetQuery;
        if (validationRef.current) validationRef.current.value = resetValue;
      });
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, [
    props.defaultValue,
    props.defaultInputValue,
    props.value,
    props.inputValue,
    props.items,
    props.selectedOption,
    props.form,
  ]);
  const items = useMemo(
    () =>
      props.searchable &&
      props.filterMode !== "external" &&
      inputValue !== label
        ? props.items.filter((item) =>
            item.label
              .toLocaleLowerCase()
              .includes(inputValue.toLocaleLowerCase()),
          )
        : props.items,
    [props.items, props.searchable, props.filterMode, inputValue, label],
  );
  const collection = useMemo(
    () =>
      createListCollection({
        items,
        itemToString: (item) => item.label,
        itemToValue: (item) => item.value,
        isItemDisabled: (item) => !!item.disabled,
      }),
    [items],
  );
  const virtual = !!props.virtualization;
  const configuredHeight = props.virtualization
    ? props.virtualization.itemHeight
    : undefined;
  const height = Number.isFinite(configuredHeight)
    ? Math.max(40, configuredHeight!)
    : 40;
  const activeIndex = items.findIndex((item) => item.value === highlight);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => height,
    overscan: props.virtualization ? (props.virtualization.overscan ?? 5) : 5,
    enabled: virtual && open,
    initialRect: { width: 0, height: 320 },
    rangeExtractor: (range) => {
      const indexes = defaultRangeExtractor(range);
      if (activeIndex >= 0 && !indexes.includes(activeIndex))
        indexes.push(activeIndex);
      return indexes.sort((a, b) => a - b);
    },
  });
  useEffect(() => {
    setHighlight(null);
    if (virtual && open)
      virtualizer.scrollToIndex(
        Math.max(
          0,
          items.findIndex((item) => item.value === value),
        ),
        { align: "auto" },
      );
  }, [items, open]);
  const Parts = props.searchable ? C : S;
  const rows = virtual
    ? virtualizer
        .getVirtualItems()
        .map((row) => ({ index: row.index, start: row.start }))
    : items.map((_, index) => ({ index, start: 0 }));
  // Keep the active row mounted even before the scroll element has a measured range.
  if (
    virtual &&
    activeIndex >= 0 &&
    !rows.some((row) => row.index === activeIndex)
  )
    rows.push({ index: activeIndex, start: activeIndex * height });
  const status = props.loading
    ? messages.loading
    : props.error
      ? typeof props.error === "string"
        ? props.error
        : messages.error
      : items.length === 0
        ? messages.empty
        : "";
  const rootProps = {
    collection,
    value: value ? [value] : [],
    open: open && !blocked,
    disabled: props.disabled,
    readOnly: props.readOnly,
    onOpenChange: (details: { open: boolean }) => {
      if (!blocked) setOpen(details.open);
    },
    onValueChange: (details: { value: string[] }) => {
      if (blocked || composing.current) return;
      const next = details.value[0] ?? "";
      if (next !== value) setValue(next);
    },
    onHighlightChange: (details: { highlightedValue: string | null }) =>
      setHighlight(details.highlightedValue),
    scrollToIndexFn: virtual
      ? ({ index }: { index: number }) =>
          virtualizer.scrollToIndex(index, { align: "auto" })
      : undefined,
    positioning: {
      placement: "bottom-start" as const,
      sameWidth: true,
      gutter: 4,
      strategy: portalMount?.matches('[role="dialog"], [role="alertdialog"]')
        ? ("fixed" as const)
        : ("absolute" as const),
      hideWhenDetached: !!portalMount?.matches(
        '[role="dialog"], [role="alertdialog"]',
      ),
    },
  };
  const inputProps = props.searchable
    ? {
        inputValue,
        onInputValueChange: (details: {
          inputValue: string;
          reason?: string;
        }) => {
          if (!blocked && details.inputValue !== inputValue)
            setInput(details.inputValue);
        },
        selectionBehavior: "preserve" as const,
      }
    : {};
  return (
    <Parts.Root
      {...rootProps}
      {...inputProps}
      id={props.id}
      className="dds-choice"
      data-label-placement={props.labelPlacement ?? "outside"}
      data-has-value={value || inputValue ? "" : undefined}
    >
      {props.label && (
        <Parts.Label
          className="dds-choice-label"
          onClick={() => visibleRef.current?.focus()}
        >
          {props.label}
        </Parts.Label>
      )}
      <Parts.Control className="dds-choice-control">
        {props.searchable ? (
          <C.Input
            ref={(node) => {
              visibleRef.current = node;
            }}
            className="dds-choice-input"
            aria-label={props["aria-label"]}
            aria-labelledby={props["aria-labelledby"]}
            aria-describedby={props["aria-describedby"]}
            aria-required={props.required}
            placeholder={props.placeholder}
            onCompositionStart={() => {
              composing.current = true;
            }}
            onCompositionEnd={() => {
              composing.current = false;
            }}
            onKeyDown={(event) => {
              if (composing.current && event.key === "Enter") {
                event.preventDefault();
                event.stopPropagation();
              }
            }}
            onBlur={() => {
              if (value) restoreInput(label);
            }}
          />
        ) : null}
        <Parts.Trigger
          ref={(node) => {
            if (!props.searchable) visibleRef.current = node;
          }}
          className="dds-choice-trigger"
          aria-label={props.searchable ? messages.open : props["aria-label"]}
          aria-labelledby={props["aria-labelledby"]}
          aria-describedby={props["aria-describedby"]}
          aria-required={props.required}
        >
          {props.searchable ? (
            "⌄"
          ) : (
            <span className="dds-choice-value">
              {label || props.placeholder || messages.open}
            </span>
          )}
        </Parts.Trigger>
        {props.clearable && !blocked && (value || inputValue) ? (
          <button
            className="dds-choice-clear"
            type="button"
            aria-label={messages.clear}
            onPointerDown={(event) => event.preventDefault()}
            onClick={() => {
              setValue("");
              setInput("");
              setOpen(false);
              visibleRef.current?.focus();
            }}
          >
            ×
          </button>
        ) : null}
      </Parts.Control>
      <input
        ref={validationRef}
        className="dds-choice-validation"
        style={validationStyle}
        tabIndex={-1}
        aria-hidden="true"
        name={props.name}
        form={props.form}
        value={value}
        required={props.required}
        disabled={props.disabled}
        onChange={() => {}}
        onInvalid={(event) => {
          event.preventDefault();
          visibleRef.current?.focus();
        }}
      />
      <div className="dds-choice-status" role="status" aria-live="polite">
        {status}
        {props.error && props.onRetry ? (
          <button
            className="dds-choice-retry"
            type="button"
            onClick={props.onRetry}
          >
            {messages.retry}
          </button>
        ) : null}
      </div>
      {portalMount && (
        <Portal container={{ current: portalMount }}>
          <Parts.Positioner className="dds-choice-positioner">
            <Parts.Content
              ref={scrollRef}
              className="dds-choice-content"
              style={{
                maxHeight: "min(320px, var(--available-height, 320px))",
                overflow: "auto",
              }}
            >
              <div
                style={
                  virtual
                    ? {
                        height: virtualizer.getTotalSize(),
                        position: "relative",
                      }
                    : undefined
                }
              >
                {rows.map((row) => {
                  const item = items[row.index]!;
                  return (
                    <Parts.Item
                      key={item.value}
                      item={item}
                      className="dds-choice-item"
                      aria-posinset={row.index + 1}
                      aria-setsize={items.length}
                      style={
                        virtual
                          ? {
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              height,
                              transform: `translateY(${row.start}px)`,
                            }
                          : undefined
                      }
                    >
                      <Parts.ItemText>{item.label}</Parts.ItemText>
                      {item.description ? (
                        <span className="dds-choice-description">
                          {item.description}
                        </span>
                      ) : null}
                    </Parts.Item>
                  );
                })}
              </div>
            </Parts.Content>
          </Parts.Positioner>
        </Portal>
      )}
    </Parts.Root>
  );
}
