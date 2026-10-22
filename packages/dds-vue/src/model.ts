import { computed, ref } from 'vue'

/** Uncontrolled state is local; a defined v-model always remains parent-owned. */
export function useModel<T>(read: () => T | undefined, initial: T, emit: (value: T) => void) {
  const local = ref(initial) as { value: T }
  return computed({ get: () => read() === undefined ? local.value : read()!, set: value => { if (Object.is(value, read() === undefined ? local.value : read())) return; local.value = value; emit(value) } })
}
