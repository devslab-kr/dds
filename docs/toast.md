# DDS Toast

[한국어](toast.ko.md)

React, Solid and Vue expose the same `ToastProvider` / `useToast` API over the
pinned Ark UI engine. Import your framework's DDS stylesheet and call `useToast`
inside its provider (Vue: inside `setup`). Message content uses `ReactNode`,
`JSX.Element` or `VNodeChild` respectively; action labels are localized strings.

## API

| API | Contract |
| --- | --- |
| `show({ message, tone?, duration?, action? })` | Return a provider-owned string ID. Default tone is `info`. |
| `loading({ message, action? })` | Return an ID for a persistent loading notice. |
| `update(id, patch)` | Shallow-merge `ToastUpdate` into the existing notice; retain its ID. Missing/expired/dismissed IDs are ignored. |
| `promise(operation, { loading, success, error })` | Return an awaitable `ToastPromise<T>` with readonly `id`; update one notice as the operation settles. |
| `dismiss(id)` | Remove one notice from this provider. |
| `clear()` | Remove this provider's notices. |

Exported types are `ToastTone`, `ToastAction`, `ToastInput`, `ToastUpdate`,
`ToastLoadingInput`, `ToastRecord`, `ToastPromiseOptions<T>`, `ToastPromise<T>`,
`ToastApi`. React/Solid also export `ToastProviderProps`; Vue provider props use
the component's inferred prop types and children are passed through slots.

Tones are `success`, `warning`, `danger`, `info`, `loading`. Loading always
persists. Other tones use the provider's `defaultDuration` (5000 ms) unless the
input specifies a duration; non-positive duration persists. Omitted update
fields remain, while explicitly undefined optional fields reset to defaults.
Changing loading to a terminal tone starts normal expiry; omitting `tone` keeps
it loading. `action: null` or `action: undefined` removes the action.

```ts
const id = toast.loading({ message: "Preparing export…" });
toast.update(id, {
  message: "Export ready",
  tone: "success",
  action: { label: "Open export", onClick: openExport },
});
```

An action is a native `type="button"` control. It dismisses its notice before
calling `onClick` once, including keyboard activation. DDS performs no request
or retry on behalf of the action. Keep essential actions available elsewhere.

## Promise notifications

```ts
const pending = toast.promise(() => save(), {
  loading: { message: "Saving…" },
  success: (value) => ({ message: `Saved ${value.count} records` }),
  error: () => ({ message: "Save failed", duration: 0 }),
});

try {
  const value = await pending;
  // Use the operation's original result.
} catch (error) {
  // Handle the original rejection; displaying a toast does not consume it.
}
// pending.id is available immediately for update/dismiss.
```

`operation` is a Promise or a once-only Promise-returning factory. A synchronous
factory throw becomes a rejection. Success/error options accept `ToastInput` or
a synchronous function returning it; their default tones are success/danger.
The loading input is merged with the terminal input, so remove a retained action
explicitly if needed. DDS does not inspect HTTP responses or business payloads
to infer success: validate them in the operation before resolving.

Manual update, dismiss, clear, action activation and provider disposal supersede
the pending notification. Its terminal message function is no longer called,
and completion cannot recreate or overwrite it. The operation still runs and
its result/rejection still reaches the caller. A message function can itself
update/dismiss; DDS rechecks ownership afterward. If that function throws, DDS
removes only its still-current notice and preserves the operation's outcome.

After provider disposal, captured APIs display nothing. A captured `promise`
still runs its task once; DDS does not cancel or retry requests. Do not use a
toast as the source of truth for payment/order status or as a mutation retry
policy. Query invalidation and domain-level unknown-result recovery remain the
application's responsibility.

## Presentation and lifetime

- Keep one application-level provider unless independent notification scopes
  are needed. Each provider owns its records, IDs and cleanup; no module-level
  mutable state is shared between SSR requests.
- Update a long-running task's ID instead of creating repeated notices. There
  is no hidden 24-item Ark queue or display cap; clear/dismiss obsolete notices.
- Message and action copy comes from the caller. React/Solid show a close button
  only when `dismissLabel` is provided; Vue retains its existing Korean defaults.
  Pass localized provider labels in every application.
- `danger` uses `alert`; other tones use `status`. The loading spinner is hidden
  from assistive technology so the message provides progress information.
- DDS tokens, light/dark themes, RTL placement, long-text wrapping and the
  existing reduced-motion/forced-color spinner rules apply to these states.
- Action buttons sit beneath the message to preserve mobile wrapping. Expiry
  pauses during pointer/focus interaction and while the page is inactive.

Do: reflect a confirmed application result and provide a useful localized
message. Do not: equate a resolved transport Promise with confirmed business
success, or automatically retry a write because a toast reports failure.
