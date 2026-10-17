import { Combobox as C, createListCollection } from "@ark-ui/solid/combobox";
import { Select as S } from "@ark-ui/solid/select";
import { Portal } from "solid-js/web";
import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  For,
  onCleanup,
  onMount,
  Show,
  untrack,
} from "solid-js";
import {
  createVirtualizer,
  defaultRangeExtractor,
  type Range,
} from "@tanstack/solid-virtual";
import {
  choiceMessages,
  choiceWarningsEnabled,
  validateOptions,
  type ComboboxProps,
} from "../choice-types";

export function Choice(props: ComboboxProps & { searchable: boolean }) {
  const id = createUniqueId();
  const [internal, setInternal] = createSignal(props.defaultValue ?? "");
  const value = () => props.value ?? internal();
  const label = createMemo(
    () =>
      props.items.find((item) => item.value === value())?.label ??
      (props.selectedOption?.value === value()
        ? props.selectedOption.label
        : value()),
  );
  const [draft, setDraft] = createSignal(props.defaultInputValue ?? label());
  const inputValue = () => props.inputValue ?? draft();
  const [open, setOpen] = createSignal(false),
    [highlight, setHighlight] = createSignal<string | null>(null);
  let visible: HTMLInputElement | HTMLButtonElement | undefined,
    validation: HTMLInputElement | undefined;
  const [scroll, setScroll] = createSignal<HTMLDivElement | null>(null);
  const [portalMount, setPortalMount] = createSignal<HTMLElement>();
  onMount(() => {
    // Preserve the enclosing modal's isolation boundary for nested options.
    if (visible)
      setPortalMount(
        visible.closest<HTMLElement>('[role="dialog"], [role="alertdialog"]') ??
          visible.ownerDocument.body,
      );
  });
  let composing = false;
  let pendingRestore: { from: string; to: string } | null = null;
  const resolveLabel = (id: string) =>
    props.items.find((item) => item.value === id)?.label ??
    (props.selectedOption?.value === id ? props.selectedOption.label : id);
  const blocked = () => props.disabled || props.readOnly;
  const messages = () => ({ ...choiceMessages, ...props.messages });
  const setInput = (next: string) => {
    if (pendingRestore?.from === inputValue() && pendingRestore.to === next)
      return;
    pendingRestore = null;
    if (props.inputValue === undefined) setDraft(next);
    props.onInputValueChange?.(next);
  };
  const restoreInput = (next: string) => {
    const current = inputValue();
    if (next === current) return;
    if (pendingRestore?.from === current && pendingRestore.to === next) return;
    pendingRestore = { from: current, to: next };
    if (props.inputValue === undefined) setDraft(next);
    else props.onInputValueChange?.(next);
  };
  const setValue = (next: string) => {
    if (props.value === undefined) setInternal(next);
    props.onValueChange?.(next);
  };
  createEffect(() => {
    validateOptions(props.items);
  });
  createEffect(() => {
    if (
      choiceWarningsEnabled() &&
      value() &&
      !props.items.some((item) => item.value === value()) &&
      props.selectedOption?.value !== value()
    )
      console.warn(
        `DDS choice: no label supplied for selected ID ${JSON.stringify(value())}; pass selectedOption when the selection is outside items.`,
      );
  });
  let previousSelection = { value: value(), label: label() };
  createEffect(() => {
    const current = { value: value(), label: label() };
    if (
      previousSelection.value !== current.value ||
      previousSelection.label !== current.label
    ) {
      previousSelection = current;
      untrack(() => restoreInput(current.label));
    }
  });
  createEffect(() => {
    const associatedForm = props.form;
    const form = associatedForm
      ? (validation?.ownerDocument.getElementById(
          associatedForm,
        ) as HTMLFormElement | null)
      : validation?.form;
    if (!form) return;
    const reset = (event: Event) =>
      queueMicrotask(() => {
        if (event.defaultPrevented) return;
        const resetValue = props.value ?? props.defaultValue ?? "";
        const resetLabel = resolveLabel(resetValue);
        previousSelection = { value: resetValue, label: resetLabel };
        if (props.value === undefined) setInternal(resetValue);
        restoreInput(props.defaultInputValue ?? resetLabel);
        setOpen(false);
        if (visible instanceof HTMLInputElement) visible.value = inputValue();
        if (validation) validation.value = value();
      });
    form.addEventListener("reset", reset);
    onCleanup(() => form.removeEventListener("reset", reset));
  });
  const items = createMemo(() =>
    props.searchable &&
    props.filterMode !== "external" &&
    inputValue() !== label()
      ? props.items.filter((item) =>
          item.label
            .toLocaleLowerCase()
            .includes(inputValue().toLocaleLowerCase()),
        )
      : props.items,
  );
  const collection = createMemo(() =>
    createListCollection({
      items: items(),
      itemToString: (item) => item.label,
      itemToValue: (item) => item.value,
      isItemDisabled: (item) => !!item.disabled,
    }),
  );
  const virtual = () => !!props.virtualization;
  const height = () => {
    const configured = props.virtualization
      ? props.virtualization.itemHeight
      : undefined;
    return Number.isFinite(configured) ? Math.max(40, configured!) : 40;
  };
  const activeIndex = () =>
    items().findIndex((item) => item.value === highlight());
  const virtualizer = createVirtualizer<HTMLDivElement, HTMLDivElement>({
    get count() {
      return items().length;
    },
    getScrollElement: scroll,
    estimateSize: height,
    get overscan() {
      return props.virtualization ? (props.virtualization.overscan ?? 5) : 5;
    },
    get enabled() {
      return virtual() && open();
    },
    initialRect: { width: 0, height: 320 },
    get rangeExtractor() {
      const active = activeIndex();
      return (range: Range) => {
        const indexes = defaultRangeExtractor(range);
        if (active >= 0 && !indexes.includes(active)) indexes.push(active);
        return indexes.sort((a, b) => a - b);
      };
    },
  });
  createEffect(() => {
    items();
    const opened = open();
    setHighlight(null);
    if (virtual() && opened)
      virtualizer.scrollToIndex(
        Math.max(
          0,
          items().findIndex((item) => item.value === value()),
        ),
        { align: "auto" },
      );
  });
  const Parts = props.searchable ? C : S;
  const rows = createMemo(() => {
    const result = virtual()
      ? virtualizer
          .getVirtualItems()
          .map((row) => ({ index: row.index, start: row.start }))
      : items().map((_, index) => ({ index, start: 0 }));
    const active = activeIndex();
    if (virtual() && active >= 0 && !result.some((row) => row.index === active))
      result.push({ index: active, start: active * height() });
    return result;
  });
  const status = () =>
    props.loading
      ? messages().loading
      : props.error
        ? typeof props.error === "string"
          ? props.error
          : messages().error
        : items().length === 0
          ? messages().empty
          : "";
  const rootProps = {
    get collection() {
      return collection();
    },
    get value() {
      return value() ? [value()] : [];
    },
    get open() {
      return open() && !blocked();
    },
    get disabled() {
      return props.disabled;
    },
    get readOnly() {
      return props.readOnly;
    },
    onOpenChange: (details: { open: boolean }) => {
      if (!blocked()) setOpen(details.open);
    },
    onValueChange: (details: { value: string[] }) => {
      if (blocked() || composing) return;
      const next = details.value[0] ?? "";
      if (next !== value()) setValue(next);
    },
    onHighlightChange: (details: { highlightedValue: string | null }) =>
      setHighlight(details.highlightedValue),
    get scrollToIndexFn() {
      return virtual()
        ? ({ index }: { index: number }) =>
            virtualizer.scrollToIndex(index, { align: "auto" })
        : undefined;
    },
    get positioning() {
      return {
        placement: "bottom-start" as const,
        sameWidth: true,
        gutter: 4,
        strategy: portalMount()?.matches(
          '[role="dialog"], [role="alertdialog"]',
        )
          ? ("fixed" as const)
          : ("absolute" as const),
        hideWhenDetached: !!portalMount()?.matches(
          '[role="dialog"], [role="alertdialog"]',
        ),
      };
    },
  };
  const inputProps = props.searchable
    ? {
        get inputValue() {
          return inputValue();
        },
        onInputValueChange: (details: { inputValue: string }) => {
          if (!blocked() && details.inputValue !== inputValue())
            setInput(details.inputValue);
        },
        selectionBehavior: "preserve" as const,
      }
    : {};
  return (
    <Parts.Root
      {...rootProps}
      {...inputProps}
      id={props.id ?? id}
      class="dds-choice"
      data-label-placement={props.labelPlacement ?? "outside"}
      data-has-value={value() || inputValue() ? "" : undefined}
    >
      <Show when={props.label}>
        <Parts.Label class="dds-choice-label" onClick={() => visible?.focus()}>
          {props.label}
        </Parts.Label>
      </Show>
      <Parts.Control class="dds-choice-control">
        <Show when={props.searchable}>
          <C.Input
            ref={(node) => {
              visible = node;
            }}
            class="dds-choice-input"
            aria-label={props["aria-label"]}
            aria-labelledby={props["aria-labelledby"]}
            aria-describedby={props["aria-describedby"]}
            aria-required={props.required}
            placeholder={props.placeholder}
            onCompositionStart={() => {
              composing = true;
            }}
            onCompositionEnd={() => {
              composing = false;
            }}
            onKeyDown={(event) => {
              if (composing && event.key === "Enter") {
                event.preventDefault();
                event.stopPropagation();
              }
            }}
            onBlur={() => {
              if (value()) restoreInput(label());
            }}
          />
        </Show>
        <Parts.Trigger
          ref={(node) => {
            if (!props.searchable) visible = node;
          }}
          class="dds-choice-trigger"
          aria-label={props.searchable ? messages().open : props["aria-label"]}
          aria-labelledby={props["aria-labelledby"]}
          aria-describedby={props["aria-describedby"]}
          aria-required={props.required}
        >
          {props.searchable ? (
            "⌄"
          ) : (
            <span class="dds-choice-value">
              {label() || props.placeholder || messages().open}
            </span>
          )}
        </Parts.Trigger>
        <Show when={props.clearable && !blocked() && (value() || inputValue())}>
          <button
            class="dds-choice-clear"
            type="button"
            aria-label={messages().clear}
            onPointerDown={(event) => event.preventDefault()}
            onClick={() => {
              setValue("");
              setInput("");
              setOpen(false);
              visible?.focus();
            }}
          >
            ×
          </button>
        </Show>
      </Parts.Control>
      <input
        ref={validation}
        class="dds-choice-validation"
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: "0",
          border: "0",
          "clip-path": "inset(50%)",
          overflow: "hidden",
          "white-space": "nowrap",
        }}
        tabIndex={-1}
        aria-hidden="true"
        name={props.name}
        form={props.form}
        value={value()}
        required={props.required}
        disabled={props.disabled}
        onInput={(event) => {
          event.currentTarget.value = value();
        }}
        onInvalid={(event) => {
          event.preventDefault();
          visible?.focus();
        }}
      />
      <div class="dds-choice-status" role="status" aria-live="polite">
        {status()}
        <Show when={props.error && props.onRetry}>
          <button
            class="dds-choice-retry"
            type="button"
            onClick={() => props.onRetry?.()}
          >
            {messages().retry}
          </button>
        </Show>
      </div>
      <Show when={portalMount()}>
        {(mount) => (
          <Portal mount={mount()}>
            <Parts.Positioner class="dds-choice-positioner">
              <Parts.Content
                ref={setScroll}
                class="dds-choice-content"
                style={{
                  "max-height": "min(320px, var(--available-height, 320px))",
                  overflow: "auto",
                }}
              >
                <div
                  style={
                    virtual()
                      ? {
                          height: `${virtualizer.getTotalSize()}px`,
                          position: "relative",
                        }
                      : undefined
                  }
                >
                  <For each={rows()}>
                    {(row) => {
                      const item = () => items()[row.index]!;
                      return (
                        <Parts.Item
                          item={item()}
                          class="dds-choice-item"
                          aria-posinset={row.index + 1}
                          aria-setsize={items().length}
                          style={
                            virtual()
                              ? {
                                  position: "absolute",
                                  top: "0",
                                  left: "0",
                                  width: "100%",
                                  height: `${height()}px`,
                                  transform: `translateY(${row.start}px)`,
                                }
                              : undefined
                          }
                        >
                          <Parts.ItemText>{item().label}</Parts.ItemText>
                          <Show when={item().description}>
                            <span class="dds-choice-description">
                              {item().description}
                            </span>
                          </Show>
                        </Parts.Item>
                      );
                    }}
                  </For>
                </div>
              </Parts.Content>
            </Parts.Positioner>
          </Portal>
        )}
      </Show>
    </Parts.Root>
  );
}
