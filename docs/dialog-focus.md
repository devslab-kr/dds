# DDS Dialog frames and external focus regions

`Dialog` keeps its existing props and defaults. Its optional presentation and focus props let an application keep its own task frame while DDS owns dialog interaction.

- `portal` renders under `document.body`; `portalMount` chooses another mounted element. The default remains inline rendering.
- `role` accepts `dialog` or `alertdialog`.
- `contentAs` selects the native `div` (default) or `section` while keeping the generated dialog attributes, presence lifecycle, and focus registration.
- `unstyled` removes DDS component classes. `class`, `overlayClass`, `titleClass`, `descriptionClass`, and `actionsClass` add application classes.
- `frame(parts)` arranges the supplied `title`, `description`, `children`, and `actions` nodes. Render each supplied title/description once to retain its generated accessible association. These are DDS-owned nodes; applications do not import Ark components.
- `contentProps` supplies native content attributes and handlers, such as `aria-busy` and `onKeyDown`.
- `initialFocus` and `finalFocus` return application-selected focus targets. `restoreFocus={false}` suppresses restoration when a workspace page or task is no longer active.
- `onEscapeKeyDown(event)` receives the native keyboard event. `event.preventDefault()` cancels Escape dismissal, for example while an application is busy. `closeOnEscape` and `closeOnOutside` keep their existing policies.

`additionalFocusContainers` explicitly authorizes external DOM regions to join the modal's focus cycle **and** its accessibility scope. A retry toast can then remain keyboard reachable without exposing the rest of the background:

```tsx
<Dialog
  open={taskOpen() && pageActive()}
  onOpenChange={setTaskOpen}
  title="Save task"
  portal
  closeOnOutside={false}
  initialFocus={() => firstField}
  finalFocus={() => usableOpener() ?? fallbackControl()}
  restoreFocus={pageActive()}
  onEscapeKeyDown={(event) => { if (busy()) event.preventDefault(); }}
  additionalFocusContainers={() => [toastRegion]}
  actions={<button onClick={save}>Save</button>}
>
  <input ref={firstField} aria-label="Task name" />
</Dialog>
```

Authorize only the intended regions in the same document. The getter can read reactive references; changes update the container list. Adding/removing retry controls inside an existing region is handled by the focus trap. No manual dialog-to-toast Tab bridge is needed. An authorized retry click does not count as outside interaction. Removing an authorized region should update its reference/reactive getter.

Browser-only focus/container getters are not evaluated during SSR. The portalled content mounts on the client. Normal dialogs retain Ark's focus and isolation behavior; external-scope dialogs reuse Zag's multi-container trap and shared modal isolation bookkeeping.

Validation: DOM tests cover native section presence/dismissal, the combined Tab/Shift+Tab cycle, background isolation, restoration, custom frame/portal and Escape cancellation. SSR tests cover native sections and throwing browser-only getters. Run the real-browser regression with `node packages/dds-solid/src/__tests__/dialog-browser.test.mjs`; it additionally mounts a section, adds retry controls and a reactive external popup region after opening without resetting focus, and checks real focus, authorized clicks, busy Escape and isolation cleanup.
