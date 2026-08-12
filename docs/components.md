# DDS Components — Core 6 (`@devslab-kr/dds-css`)

🌐 [한국어](components.ko.md)

Class-based, framework-neutral CSS components. Everything references semantic
tokens only (`var(--dds-*)`) — load
`@devslab-kr/dds-tokens/tokens.css` first, then `@devslab-kr/dds-css/dds.css`
(or per-component files from `components/`). Dark mode needs no component
change: set `data-theme="dark"` on `<html>` or any subtree
(`data-theme="light"` pins a subtree back).

Every interactive component defines the full state set of spec §4.2
(default → hover → pressed → focus-visible → disabled → loading) and passes
the §6 accessibility floor: 4.5:1 text contrast, ≥24×24 web click targets,
keyboard reachability with a visible 2px focus ring, no color-only signaling.

Live reference: `preview/components.html` (run `pnpm build` first).

---

## Button — `.dds-btn`

```html
<button class="dds-btn dds-btn--primary">Save</button>
<button class="dds-btn dds-btn--secondary dds-btn--sm">Cancel</button>
<button class="dds-btn dds-btn--primary" aria-busy="true">
  <span class="dds-spinner" aria-hidden="true"></span>Saving…
</button>
```

- Variants: `--primary` `--secondary` `--ghost` `--danger`. Sizes: `--sm`
  (32px) / default (40px) / `--lg` (48px) — heights from the spacing scale.
- States: hover/pressed via tokens (`bg.brand-hover`, alpha tints);
  disabled = `[disabled]` (opacity 0.45 — the one allowed opacity state);
  loading = `aria-busy="true"` + a `.dds-spinner` child (blocks pointer
  events; the accessible name stays, e.g. "Saving…").
- **A11y**: primary text is `on-brand` (zinc.950, ~8:1 — spec §3.1 note);
  danger text is `on-status` (white/light, dark/zinc.950); focus ring 2px
  `border.focus` offset 2px; icon-only buttons must add `aria-label`.
- **Do**: one primary per view; pair danger with a confirm step.
- **Don't**: don't fake a disabled state with a ghost variant — use
  `[disabled]` so it's out of the tab order and announced correctly.

## TextField — `.dds-field` / `.dds-input`

```html
<div class="dds-field">
  <label class="dds-field__label" for="email">Email</label>
  <input class="dds-input" id="email" type="email"
         aria-invalid="true" aria-describedby="email-help">
  <span class="dds-field__help" id="email-help">Not an email address.</span>
</div>
```

- Error: `.dds-field--error` on the wrapper (or `aria-invalid="true"` on the
  input — both style the border; use aria-invalid so AT hears it too).
- **A11y**: always a real `<label for>`; error/help text linked via
  `aria-describedby`; the red border is never the only error signal — the
  help line carries the message (§6 no-color-only).
- **Do**: keep help text present in both normal and error states so the
  layout doesn't jump.
- **Don't**: don't use `placeholder` as the label — it disappears on input
  and fails contrast as a label substitute.

## Badge — `.dds-badge`

```html
<span class="dds-badge dds-badge--success">Connected</span>
```

- Variants: `--brand` `--success` `--warning` `--danger` `--info`.
- Colors are always the paired set (dark foreground + `-bg` tint, spec §3.1);
  the leading dot repeats the tone so color isn't the only signal.
- **Do**: use for state, not for actions.
- **Don't**: don't invent new fg/bg combinations — the pairs are the tokens'
  contract (`status.*` + `status.*-bg`).

## Spinner `.dds-spinner` / Skeleton `.dds-skeleton`

```html
<span class="dds-spinner" role="status" aria-label="Loading"></span>

<div aria-busy="true">
  <span class="dds-skeleton dds-skeleton--circle" aria-hidden="true" style="width:40px;height:40px"></span>
  <span class="dds-skeleton dds-skeleton--text" aria-hidden="true" style="width:60%"></span>
</div>
```

- Spinner inherits `currentColor` (correct on any surface, including inside
  a primary button). Standalone spinners need `role="status"` +
  `aria-label`. Under reduced motion it slows instead of freezing — a
  stopped spinner reads as a hang.
- Skeleton fill is an alpha tint (works on default and subtle backgrounds in
  both themes). Size is the consumer's (width/height inline or via layout);
  `--text` is one line, `--circle` for avatars. Mark the region
  `aria-busy="true"`, keep skeleton elements `aria-hidden="true"`; the pulse
  stops under reduced motion.
- **Do**: skeleton for content-shaped waits, spinner for action-shaped waits.
- **Don't**: don't announce each skeleton to AT — one busy region is enough.

## Dialog — `.dds-dialog`

```html
<div class="dds-dialog-overlay">
  <div class="dds-dialog" role="dialog" aria-modal="true" aria-labelledby="t">
    <h2 class="dds-dialog__title" id="t">Reindex sources?</h2>
    <p class="dds-dialog__body">Changes apply to answers immediately.</p>
    <div class="dds-dialog__actions">
      <button class="dds-btn dds-btn--ghost dds-btn--sm">Later</button>
      <button class="dds-btn dds-btn--primary dds-btn--sm">Reindex</button>
    </div>
  </div>
</div>
```

- Native `<dialog class="dds-dialog">` is also styled (incl. `::backdrop`).
- Behavior contract (spec §5): closes on outside tap and Esc; focus moves in
  on open, is trapped while open, returns to the opener on close — that's
  the opening code's job (native `<dialog>.showModal()` gives you most of it).
- **A11y**: `aria-modal="true"` + `aria-labelledby` to the title.
- **Do**: actions right-aligned, primary last (matches the modal convention
  used across DevsLab admin surfaces).
- **Don't**: don't stack dialogs; don't use a dialog for non-blocking notices
  — that's the toast's job.

## Toast — `.dds-toast`

```html
<div class="dds-toast-region" role="status">
  <div class="dds-toast dds-toast--success">Indexing finished.</div>
  <div class="dds-toast dds-toast--danger" role="alert">Sending failed.</div>
</div>
```

- Region is fixed bottom-end; toasts stack with a grid gap. Variants add the
  status dot (same 6px dot as the badge). Entry animation uses
  `duration.base` + `easing.enter` and is removed under reduced motion.
- **A11y**: region `role="status"` (polite); use `role="alert"` only on
  danger toasts. Auto-dismiss should pause on hover/focus (consumer JS).
- **Do**: every failed action gets a toast — silent failure is a rejection
  criterion in this house.
- **Don't**: don't put required actions only inside a toast (it disappears);
  don't stack more than ~3 — collapse older ones.
