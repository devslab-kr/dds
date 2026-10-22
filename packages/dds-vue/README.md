# @devslab/dds-vue

Native Vue 3 DDS components. Ark UI Vue owns calendar interaction; DDS CSS/tokens own presentation. No React/Solid runtime or imperative root bridge.

Inventory: **Button, Icon, Input, DatePicker, ConsoleShell, LeftNav**. Expand only when a real consumer needs another component. This package does not claim the full React/Solid inventory.

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

`ConsoleShell` provides the shared responsive console rail, skip link, context rows, page header, and mobile scrim/Escape behavior. Required props are `surface`, `activePath`, `brand` (`href`, `name`, `mark`), `labels` (`skip`, `menuOpen`, `menuClose`, `nav`, `badge`, with `{count}` in the badge template), and `header` (`title`, optional `eyebrow`). Optional `context` contains label/value rows. Its slots are default page content, `header-actions`, `foot`, and `navigation` (receives a `close` function for mobile navigation). Native attributes and events fall through to the shell root. The optional `nav` prop defaults to `[]` and renders a `LeftNav`; the navigation slot replaces it.

```vue
<ConsoleShell surface="ops" :active-path="route.path" :brand="brand" :nav="nav"
  :labels="labels" :header="{ title: 'Orders' }" v-model:expanded-groups="expandedGroups">
  <template #header-actions><Button>Create order</Button></template>
  <p>Order content</p>
  <template #foot><a href="/account">Account</a></template>
</ConsoleShell>
```

`LeftNav` can render independently in any layout. It accepts `surface`, `activePath`, `nav`, `labels` containing only `nav`/`badge`, and the expansion props below. It emits `navigate` when a link is clicked and `update:expandedGroups` when expansion is requested. Layout and menu can also be composed explicitly:

```vue
<ConsoleShell surface="ops" :active-path="route.path" :brand="brand" :labels="labels" :header="{ title: 'Orders' }">
  <template #navigation="{ close }">
    <LeftNav surface="ops" :active-path="route.path" :nav="nav" :labels="labels"
      v-model:expanded-groups="expandedGroups" @navigate="close" />
  </template>
  <p>Order content</p>
</ConsoleShell>
```

Each nav group accepts `label`, `items`, optional stable `id`, and opt-in `collapsible`. Without `collapsible`, groups stay expanded. Collapsible groups initially open when they contain an active item. `defaultExpandedGroups` overrides that initial state; `[]` closes all collapsible groups. `expandedGroups` controls the state and `update:expandedGroups` emits requested arrays (use `v-model:expanded-groups`). Uncontrolled shells also emit changes. A group without an ID uses `group-${index}`; supply stable IDs when reordering or persisting groups. Route changes and persistence belong to the application; the shell does not reopen groups after initial setup.

Nav items accept `id`, `href`, `label`, optional positive `badge`, `active` override, and decorative Vue `Component` `icon` rendered with `:is`. For example, `icon: markRaw(OrderIcon)` avoids reactive component warnings when nav data is reactive; wrap DDS `Icon` in a component to supply its props. `ConsoleNavItem`, `ConsoleNavGroup`, `LeftNavProps`, `ConsoleShellLabels`, `ConsoleHeader`, and `ConsoleShellProps` are exported types. Native disclosure buttons provide keyboard activation and ARIA targets use Vue `useId` for SSR/hydration. When mounting multiple independent Vue apps in one document, assign a distinct `app.config.idPrefix` to each app, using the same prefix on server and client.
