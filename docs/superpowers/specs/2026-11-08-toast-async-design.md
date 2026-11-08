# DDS async Toast design

## Intent and scope

The user selected the existing Ark UI engine and requested loading, update,
promise and action support in React, Solid and Vue, plus documentation and
publication. Preserve the current DDS appearance, existing API and provider
isolation. Do not add Sonner, Vaul, a state library or server-request behavior.

## Public contract (identical except framework content types)

- `ToastTone` adds `loading`.
- `ToastAction` is `{ label: string; onClick: () => void }`.
- `ToastInput` adds `action?: ToastAction | null`; null removes an action.
- `ToastUpdate = Partial<ToastInput>`.
- `loading(input: Omit<ToastInput, "tone" | "duration">): string` creates a
  persistent loading notification. Any loading-tone toast persists until updated
  or dismissed, regardless of default duration.
- `update(id: string, patch: ToastUpdate): void` changes the existing toast in
  place. Missing, expired or dismissed IDs are ignored. Omitted fields remain;
  an explicit undefined optional value resets that field to its default.
- `promise<T>(operation: Promise<T> | (() => Promise<T>), options:
  ToastPromiseOptions<T>): ToastPromise<T>` creates one loading toast and updates
  that same ID on settlement. Options have `loading`, `success`, and `error`;
  loading is the loading input above, and terminal values are ToastInput or a
  synchronous callback returning ToastInput (success receives T, error unknown).
  Terminal default tones are success/danger. `ToastPromise<T>` is a Promise<T>
  with a readonly `id: string`, so callers can await the original result/error
  and can dismiss or update it before settlement. A factory runs exactly once;
  synchronous throws become rejections. No retries, cancellation or domain
  success inference are introduced.
- Terminal message factories that throw dismiss their still-current toast;
  presentation errors never replace the operation's original result/error.
- After provider disposal, captured display APIs are inert; `promise` still
  invokes its task once and passes its outcome through without rendering.
- A manual update, dismiss, clear, action activation or provider disposal
  supersedes a pending promise's display update. Settlement still reaches the
  caller; it cannot resurrect or overwrite that toast. Do not call terminal
  message factories after the notification is superseded.
- Action renders a native button, invokes its callback once and dismisses its
  toast before the callback. Actions do not imply retry or network behavior.
- `show`, `dismiss`, `clear`, duration <= 0 persistence, localized labels,
  status/alert semantics, timers and per-provider IDs remain supported.

## Implementation choice

Use each pinned Ark toaster's create/update/remove methods and ActionTrigger.
Keep the adapter local to each existing framework package; do not introduce a
new public package just to share a small implementation. Review and exercise the
same observable contract in each framework. Mutable lifecycle state belongs to
the provider, never to a module singleton or SSR request-shared store.
Align React/Vue with Solid's existing `max: Number.MAX_SAFE_INTEGER`: the pinned
Zag store's default queue cannot remove queued IDs individually and update can
create duplicate queued entries. Avoid that hidden queue for uniform lifecycle
semantics. Callers should update/dismiss long-running tasks rather than enqueue
unbounded notices. DDS introduces no queue/cap configuration in this change.

Alternatives considered: replacing Ark with Sonner was rejected by the user;
exposing upstream Ark APIs directly would leak framework-specific contracts and
change the established DDS boundary. Native `toaster.promise` alone does not
cover DDS's explicit lifecycle supersession contract, so DDS owns that mapping.

## Taste and Polish scope / advance UI notice

- Existing React/Solid Toast: keep bottom-end position, DDS tone dots, typography,
  theme tokens and localized dismiss control. Add the existing DDS spinner for
  loading and an action row beneath the message for wrapping/localization.
- Existing Vue Toast: apply the same additions while preserving its existing
  portal ownership and provider label defaults.
- Existing Toast stories and framework browser fixtures: show loading, terminal
  updates and one explicit action; preserve unrelated component demos.
- Check light/dark, desktop/mobile, long Korean and unbroken text, RTL, keyboard
  action activation, focus, reduced motion and forced-color visibility. Spinner
  is decorative; caller message supplies the announced progress information.
- No app route, branding, business state or auth flow is changed. Query/Form/
  shared-state stack requirements do not apply to this provider-only library API.

## Delivery

Update English/Korean package READMEs and Ark/component guides. Add a minor
Changeset for React/Solid/Vue and the CSS addition; retain fixed-group versioning.
Run focused regressions first, package checks/builds/SSR/browser and the required
repository release gates. Publish through the existing GitHub trusted-publishing
workflow after protected-main integration, and verify registry versions. Record
exact SHAs, commands, outcomes and any NOT RUN checks.
