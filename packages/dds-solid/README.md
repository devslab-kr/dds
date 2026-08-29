# @devslab/dds-solid

Restricted internal SolidJS 2 primitives for DDS. Import `@devslab/dds-solid/styles.css`
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
