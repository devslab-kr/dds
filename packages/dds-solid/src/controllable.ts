import { createSignal, type Accessor } from "solid-js";

export interface ControllableOptions<T> {
  value: Accessor<T | undefined>;
  defaultValue: T;
  onChange: ((value: T) => void) | undefined;
}

export type ControllableSetter<T> = (next: T | ((previous: T) => T)) => T;

export function createControllableSignal<T>(options: ControllableOptions<T>): [Accessor<T>, ControllableSetter<T>] {
  const [internal, setInternal] = createSignal(options.defaultValue);
  const value: Accessor<T> = () => options.value() ?? internal();
  const setInternalValue = setInternal as unknown as ControllableSetter<T>;
  const setValue: ControllableSetter<T> = (next) => {
    const resolved = typeof next === "function"
      ? (next as (previous: T) => T)(value())
      : next;
    if (options.value() === undefined) setInternalValue(() => resolved);
    options.onChange?.(resolved);
    return resolved;
  };
  return [value, setValue];
}
