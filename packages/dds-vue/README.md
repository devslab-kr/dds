# @devslab/dds-vue

Native Vue 3 DDS components. Ark UI Vue owns calendar interaction; DDS CSS/tokens own presentation. No React/Solid runtime or imperative root bridge.

Initial inventory, migrated from EDS Desktop: **Button, Icon, Input, DatePicker**. Expand only when a real consumer needs another component. This first release does not claim the full React/Solid inventory.

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

Vue >=3.5 is a peer. CSS/tokens/icons stay framework neutral. `Input` accepts native input attributes/events, has labelled outside/inside/hidden placement, optional clear, readonly/disabled and exposed focus/select methods. `Button` uses tone/size/type/loading/disabled; Icon accepts a DDS name and optional accessible label.

DatePicker emits only canonical `YYYY-MM-DD` or optional empty values, displays Korean dates as `YYYY/MM/DD`, and exposes validityChange for button/API saves. Invalid drafts remain visible, are linked to their error, and never silently commit a previous valid date. Calendar interaction, navigation and positioning use `@ark-ui/vue`; portals stay inside their owning dialog. Required defaults true; min/max are inclusive ISO dates. Mount a fresh editor key when the consumer explicitly resets an unchanged value. Current first-consumer locale is Korean/Asia-Seoul.

Use shared semantic tokens to theme products; no EDS-specific colors, toolbar positions or IPC/store logic belong in this package. Import styles once. The date-only helper is available at `@devslab/dds-vue/date-only`.

Validation: `pnpm --filter @devslab/dds-vue check`, `test`, `build`. Public release follows the DDS lockstep Changesets/CI workflow.
