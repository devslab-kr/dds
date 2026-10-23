# @devslab/dds-vue

Native Vue 3 DDS components. Ark UI Vue owns calendar interaction; DDS CSS/tokens own presentation. No React/Solid runtime or imperative root bridge.

Native Vue counterparts now cover the existing DDS React/Solid component inventory. No app theme or business logic is bundled. The table is a separate `@devslab/dds-table-vue` package, so basic controls do not pull in AG Grid.

| Family | Components/helpers |
| --- | --- |
| Controls | Button, IconButton, Icon, Field, Select, Checkbox, Radio, Switch, RadioGroup, Input, InputGroup, NumberInput, SegmentedControl |
| Choices and dates | Combobox, SelectPicker, DatePicker, DateRangePicker, MonthPicker, TimePicker, Calendar |
| Navigation and overlays | Tabs, TabList, Tab, TabPanel, Dialog, Tooltip, DropdownMenu, Popover, ToastProvider/useToast, ConsoleShell |
| Helpers | usePendingAction/createPendingAction, createStatusPill, date/month/time validation |

Values use `v-model`/`update:modelValue`; dialogs use `v-model:open`. Content uses Vue slots rather than React render props. Compound DropdownMenu and Popover components retain Ark Vue's native props/events. ConsoleShell uses default content, `actions`, and `foot` slots. Field's default slot exposes `{ control }` for native input attributes. IconButton requires `label`.

NumberInput is `number | null`; choices persist string IDs; ranges are `{start,end}` ISO dates; MonthPicker persists YYYY-MM; TimePicker persists HH:MM. Typed invalid drafts remain visible and block native form submission. Disabled/readonly controls never commit user changes. Async actions return Vue refs (`current.value`, `busy.value`) and abort when replaced/reset/disposed.

Each of the twelve component entries (`input`, `combobox`, `select-picker`, `dropdown-menu`, `popover`, `calendar`, `date-picker`, `time-picker`, `date-range-picker`, `month-picker`, `segmented-control`, `number-input`) can be imported independently. Input's dependency graph excludes grid/virtualizer and other-framework runtimes.

This is component inventory parity, not identical framework APIs: Vue uses its own model/slot contracts; choice-list virtualization and custom Calendar/NumberInput message objects are not yet included. Large operational grids use the separate Community table adapter. Existing DatePicker's first-consumer Korean/Asia-Seoul contract is unchanged.

```sh
pnpm add @devslab/dds-vue vue
```
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Button, Input, DatePicker } from '@devslab/dds-vue'
import '@devslab/dds-vue/styles.css'
const query = ref('')
const date = ref('2026-10-22')
const dateValid = ref(true)
</script>
<template>
  <Input v-model="query" type="search" label="Customer search" clearable />
  <DatePicker v-model="date" label="Service date" @validity-change="dateValid = $event" />
  <Button :disabled="!dateValid">Save</Button>
</template>
```

Vue >=3.5 is a peer. CSS/tokens/icons stay framework neutral. `Input` accepts native input attributes/events, has labelled outside/inside/hidden placement, optional clear, readonly/disabled and exposed focus/select methods. Search inputs (`type="search"`) include a decorative DDS search icon and use the DDS clear button when `clearable` is enabled. `Button` uses tone/size/type/loading/disabled; Icon accepts a DDS name and optional accessible label.

`SelectPicker` includes a DDS chevron and keeps its selected label on one line. The full selected label is available in the trigger's `title` unless an explicit `title` is supplied; popup options wrap to show their complete labels.

DatePicker emits only canonical `YYYY-MM-DD` or optional empty values, displays Korean dates as `YYYY/MM/DD`, and exposes validityChange for button/API saves. Invalid drafts remain visible, are linked to their error, and never silently commit a previous valid date. Calendar interaction, navigation and positioning use `@ark-ui/vue`; portals stay inside their owning dialog. Required defaults true; min/max are inclusive ISO dates. Mount a fresh editor key when the consumer explicitly resets an unchanged value. Current first-consumer locale is Korean/Asia-Seoul.

Use shared semantic tokens to theme products; no EDS-specific colors, toolbar positions or IPC/store logic belong in this package. Import styles once. The date-only helper is available at `@devslab/dds-vue/date-only`.

Validation: `pnpm --filter @devslab/dds-vue check`, `test`, `build`. Public release follows the DDS lockstep Changesets/CI workflow.





## Shared application layouts

Layout, LeftNav and TopNav use the common geometry and typography rules. See [composition and exact dimensions](../../docs/layouts.md).
