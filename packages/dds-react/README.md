# DDS React

Accessible React primitives using Ark UI 5.39.3 and shared DDS tokens, CSS and icons. React and React DOM are peers (18.3 or 19). Import CSS once in the application:

```tsx
import '@devslab/dds-react/styles.css';
import { Button, Field, Select, Dialog, Tabs, TabList, Tab, TabPanel } from '@devslab/dds-react';

<Field label="Country" helpText="Choose a country">
  {control => <Select {...control} defaultValue="kr"><option value="kr">Korea</option></Select>}
</Field>
<Button tone="primary" onClick={() => setOpen(true)}>Edit</Button>
<Dialog open={open} onOpenChange={setOpen} title="Edit country" description="Changes apply to your profile">
  <Button onClick={() => setOpen(false)}>Done</Button>
</Dialog>
<Tabs defaultValue="overview">
  <TabList aria-label="Sections"><Tab value="overview">Overview</Tab></TabList>
  <TabPanel value="overview">Content</TabPanel>
</Tabs>
```

Exports: `Button`, `IconButton`, `Field`, `Checkbox`, `Radio`, `Select`, `Switch`, `RadioGroup`, `Dialog`, `Tabs`, `TabList`, `Tab`, `TabPanel`, `Tooltip`, `Icon`, `ToastProvider`, `useToast`, `ConsoleShell`, and their prop types. Labels, tooltip messages, dialog titles and notification copy come from the caller. There is no translated fallback copy.

Native DOM attributes use React spelling (`className`, `htmlFor`, `onChange`). DOM components accept React object or callback refs; Select refs target its select and Dialog refs target content. Button defaults to `type="button"`; loading prevents activation and preserves its name. Checkbox, Radio and Switch accept `checked`/`defaultChecked`, `onCheckedChange(boolean)` and native input attributes. Select uses native `value`/`defaultValue` and `onChange`. RadioGroup takes `label` and `options: { value, label, disabled? }[]`, with `value`/`defaultValue` and `onValueChange(string)`.

Tabs extends Ark root options, with `onValueChange(string)`; parts accept normal Ark DOM props including `asChild`. Dialog accepts Ark root options with `onOpenChange(boolean)`, `closeOnOutside`, `initialFocus`, `finalFocus`, `contentProps`, `actions`, `frame(parts)` and `unstyled`. Dialog portals by default; use `portal={false}` for inline markup, including open SSR content. Ark owns nested modal isolation, focus, Escape handling and scroll locking. Additional focus containers from the Solid package are not emulated; use Ark `persistentElements` and `modal`/`trapFocus` according to application needs.

Tooltip accepts one element child (Ark `asChild`) or a render function receiving native button trigger props. Use a focusable trigger and preserve the supplied events. `ToastProvider` accepts optional caller `regionLabel` and `dismissLabel` (string or record-to-string function); without `dismissLabel` it renders no close button. `useToast()` returns `show({ message, tone?, duration? })`, `dismiss(id)`, and `clear()`; duration 0 persists. Providers clear their notifications on unmount.

Advanced compositional parts are exported as `ArkDialog`, `ArkTabs`, `ArkTooltip`, `ArkRadioGroup`, `ArkCheckbox`, `ArkSwitch`, `ArkField`, and `ArkToast`. They are the pinned upstream Ark namespaces, useful inside convenience component children or for application-owned composition.

ConsoleShell accepts caller brand/navigation/header/labels/foot slots and unique per-instance landmark IDs. Its rail uses caller route state; no router or business store is included. Imports and server rendering require no browser globals; client-only effects start after mounting. React `useId` keeps label associations stable through hydration. React JSX, React refs and Ark `asChild` element composition differ from Solid render callbacks/accessors. The grid is a separate dependency: use `@devslab/dds-table-react` for AG Grid.

ESM and declarations are shipped; React, React DOM and Ark remain external to the DDS bundle. This package is source-available under the included LICENSE, matching the DDS repository.
