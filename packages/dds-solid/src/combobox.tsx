import { Choice } from "./internal/choice";
import type { ComboboxProps } from "./choice-types";
export type {
  ComboboxProps,
  ChoiceOption,
  ChoiceMessages,
  ChoiceVirtualization,
} from "./choice-types";
export function Combobox(props: ComboboxProps) {
  return <Choice {...props} searchable />;
}
