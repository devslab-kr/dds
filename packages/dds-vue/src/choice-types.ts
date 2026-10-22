export interface ChoiceOption { value: string; label: string; description?: string; disabled?: boolean }
export interface ChoiceMessages { open?: string; clear?: string; loading?: string; empty?: string; error?: string; retry?: string }
export const choiceMessages: Required<ChoiceMessages> = { open: '선택 열기', clear: '선택 지우기', loading: '불러오는 중', empty: '결과 없음', error: '불러오지 못했습니다', retry: '다시 시도' }
export function validateOptions(items: readonly ChoiceOption[]) { const ids = new Set<string>(); for (const item of items) { if (!item.value || ids.has(item.value)) throw new Error('DDS choice: option IDs must be nonempty and unique'); ids.add(item.value) } }
