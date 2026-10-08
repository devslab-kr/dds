# @devslab/dds-solid

Public SolidJS primitives for DDS. Import `@devslab/dds-solid/styles.css`
once in the application shell, then consume the native-semantic components from
`@devslab/dds-solid`.

Stateful components accept both controlled (`value`/`open`/`checked`) and
uncontrolled (`defaultValue`/`defaultOpen`/`defaultChecked`) forms. Dialog owns
focus trap/return and Escape/outside dismissal; Tabs implements the WAI-ARIA
keyboard model; ToastProvider owns lifecycle timers; Tooltip requires a render
prop so `aria-describedby` is always attached to the actual trigger.

Pass a localized `dismissLabel` to `ToastProvider` when toasts need a manual
dismiss control. Omitting it preserves the existing provider API while leaving
out the control, so the package never emits an English accessible-name fallback.

Interactive primitives use [Ark UI](https://ark-ui.com/) internally while DDS owns
the public API and visual tokens. Existing imports and callback values stay the
same. See [the migration guide](../../docs/ark-migration.md) for integration details.

`RadioGroup` adds a labelled group from `options` (`value`, `label`, optional
`disabled`), with `name`, `value`/`defaultValue` and `onValueChange`. Existing standalone
`Radio` remains native. Use one application-level `ToastProvider`; inject a localized
`regionLabel` if the notification region needs a name. Toast timers pause during
pointer/focus interaction and when the browser page is idle. A non-positive duration
keeps the toast until dismissed.
