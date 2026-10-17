export interface ChoiceOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}
export interface ChoiceMessages {
  open?: string;
  clear?: string;
  loading?: string;
  empty?: string;
  error?: string;
  retry?: string;
}
export type ChoiceVirtualization =
  | false
  | { itemHeight?: number; overscan?: number };
export interface ChoiceProps {
  items: ChoiceOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  selectedOption?: ChoiceOption;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  name?: string;
  form?: string;
  id?: string;
  label?: string;
  labelPlacement?: "outside" | "inside" | "hidden";
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  placeholder?: string;
  clearable?: boolean;
  messages?: ChoiceMessages;
  virtualization?: ChoiceVirtualization;
}
export interface ComboboxProps extends ChoiceProps {
  inputValue?: string;
  defaultInputValue?: string;
  onInputValueChange?: (value: string) => void;
  filterMode?: "local" | "external";
  loading?: boolean;
  error?: string | boolean;
  onRetry?: () => void;
}
export interface SelectPickerProps extends ChoiceProps {}

export function validateOptions(items: ChoiceOption[]) {
  const ids = new Set<string>();
  for (const item of items) {
    if (!item.value || ids.has(item.value))
      throw new Error(
        `DDS choice: option IDs must be nonempty and unique (${JSON.stringify(item.value)})`,
      );
    ids.add(item.value);
  }
}
export const choiceMessages: Required<ChoiceMessages> = {
  open: "선택 열기",
  clear: "선택 지우기",
  loading: "불러오는 중",
  empty: "결과 없음",
  error: "불러오지 못했습니다",
  retry: "다시 시도",
};

/** Read the consumer environment at runtime, rather than the library build mode. */
export function choiceWarningsEnabled() {
  return (
    (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env
      ?.NODE_ENV !== "production"
  );
}
