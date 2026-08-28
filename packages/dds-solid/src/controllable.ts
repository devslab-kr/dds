import { createSignal, type Accessor, type Setter } from "solid-js";

export interface ControllableOptions<T> {
  value: Accessor<T | undefined>;
  defaultValue: T;
  onChange: ((value: T) => void) | undefined;
}

export function createControllableSignal<T>(options: ControllableOptions<T>): [Accessor<T>, Setter<T>] {
  const [internal, setInternal] = createSignal(options.defaultValue);
  const value: Accessor<T> = () => options.value() ?? internal();
  const setValue: Setter<T> = (next) => {
    const resolved = typeof next === "function"
      ? (next as (previous: T) => T)(value())
      : next;
    if (options.value() === undefined) setInternal(() => resolved);
    options.onChange?.(resolved);
    return resolved;
  };
  return [value, setValue];
}
