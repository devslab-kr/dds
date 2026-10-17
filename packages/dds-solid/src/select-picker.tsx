import { Choice } from "./internal/choice";
import type { SelectPickerProps } from "./choice-types";
export type {
  SelectPickerProps,
  ChoiceOption,
  ChoiceMessages,
  ChoiceVirtualization,
} from "./choice-types";
export function SelectPicker(props: SelectPickerProps) {
  return <Choice {...props} searchable={false} />;
}
