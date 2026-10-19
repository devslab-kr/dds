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
  type JSX,
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
  type ChoiceOption,
  type ComboboxProps,
} from "../choice-types";

/**
 * Options for DDS components built on Choice (TimePicker). They are not part
 * of the public Combobox/SelectPicker props; every default keeps the existing
 * Combobox and SelectPicker behavior.
 */
export interface ChoiceInternals {
  searchable: boolean;
  /** Replaces the default case-insensitive label substring filter. */
  matchItem?: (item: ChoiceOption, query: string) => boolean;
  /** On blur, the value the typed text stands for, "" to clear, or null to restore the label. */
  commitDraft?: (text: string) => string | null;
  /** Content of the searchable trigger button (default "⌄"). */
  triggerContent?: () => JSX.Element;
  rootClass?: string;
  invalid?: boolean;
  /** Highlight the first match while typing so Enter picks it. */
  autoHighlight?: boolean;
  /** Scroll the selected option to the middle of the list when it opens. */
  centerSelected?: boolean;
  inputMode?: JSX.HTMLAttributes<HTMLInputElement>["inputMode"];
  /** Called before a native form reset restores the value. */
  onFormReset?: () => void;
}

export function Choice(props: ComboboxProps & ChoiceInternals) {
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
  let consumedOnBlur: string | null = null;
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
        props.onFormReset?.();
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
          props.matchItem
            ? props.matchItem(item, inputValue())
            : item.label
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
        { align: props.centerSelected ? "center" : "auto" },
      );
  });
  createEffect(() => {
    const content = scroll();
    if (!props.centerSelected || !open() || virtual() || !content) return;
    // Ark only scrolls the highlighted option to the nearest edge.
    const frame = requestAnimationFrame(() => {
      const selected = content.querySelector<HTMLElement>(
        '[data-part="item"][data-state="checked"]',
      );
      if (!selected) return;
      const list = content.getBoundingClientRect(),
        row = selected.getBoundingClientRect();
      content.scrollTop +=
        row.top - list.top - (content.clientHeight - row.height) / 2;
    });
    onCleanup(() => cancelAnimationFrame(frame));
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
    get invalid() {
      return props.invalid;
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
        onInputValueChange: (details: {
          inputValue: string;
          reason?: string | undefined;
        }) => {
          // Ark reports a keystroke after the blur that already committed it.
          const stale =
            consumedOnBlur === details.inputValue &&
            details.reason === "input-change" &&
            visible?.ownerDocument.activeElement !== visible;
          consumedOnBlur = null;
          if (stale) return;
          if (!blocked() && details.inputValue !== inputValue())
            setInput(details.inputValue);
        },
        selectionBehavior: "preserve" as const,
        ...(props.autoHighlight
          ? { inputBehavior: "autohighlight" as const }
          : {}),
      }
    : {};
  return (
    <Parts.Root
      {...rootProps}
      {...inputProps}
      id={props.id ?? id}
      class={props.rootClass ? `dds-choice ${props.rootClass}` : "dds-choice"}
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
            inputMode={props.inputMode}
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
            onBlur={(event) => {
              if (props.commitDraft) {
                // The DOM holds the latest keystroke; Ark's input state may still be queued.
                consumedOnBlur = event.currentTarget.value;
                const next = blocked()
                  ? null
                  : props.commitDraft(consumedOnBlur);
                if (next !== null && next !== value()) setValue(next);
                restoreInput(label());
                return;
              }
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
            props.triggerContent ? (
              props.triggerContent()
            ) : (
              "⌄"
            )
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
