# DDS Components — v1 inventory (`@devslab/dds-css`)

🌐 [한국어](components.ko.md)

Class-based, framework-neutral CSS components. Everything references semantic
tokens only (`var(--dds-*)`) — load
`@devslab/dds-tokens/tokens.css` first, then `@devslab/dds-css/dds.css`
(or per-component files from `components/`). Dark mode needs no component
change: set `data-theme="dark"` on `<html>` or any subtree
(`data-theme="light"` pins a subtree back).

Every interactive component defines the full state set of spec §4.2
(default → hover → pressed → focus-visible → disabled → loading) and passes
the §6 accessibility floor: 4.5:1 text contrast, ≥24×24 web click targets,
keyboard reachability with a visible 2px focus ring, no color-only signaling.

Live reference: `preview/components.html` (run `pnpm build` first).

Shipped (spec §4.3 v1 inventory): Button, IconButton, TextField, Textarea,
Select, Checkbox/Radio, Switch, Badge, Chip, Avatar, Spinner, Skeleton,
Divider, Card, ListRow, Tabs, Dialog (web Modal), Toast, Tooltip (web),
EmptyState. **BottomSheet is deliberately absent**: it is the native
counterpart of Dialog, and this package is web CSS — the role mapping
(Modal on web ↔ BottomSheet on native) is documented in spec §4.3/§5 and the
native implementation waits for a native consumer (Phase 3).

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

## IconButton — `.dds-iconbtn`

```html
<button class="dds-iconbtn" aria-label="Close">
  <svg aria-hidden="true" width="20" height="20">…</svg>
</button>
<button class="dds-iconbtn dds-iconbtn--secondary dds-iconbtn--sm" aria-label="Edit">…</button>
<button class="dds-iconbtn dds-iconbtn--danger" aria-label="Delete source">…</button>
```

- Variants: default (ghost) / `--secondary` (bordered) / `--danger`. Sizes:
  `--sm` (32) / default (40) / `--lg` (48) — the same heights as `.dds-btn`,
  so an icon button never sits a few px off the text button beside it.
- The icon inherits `currentColor`; give the `<svg>` `aria-hidden="true"`.
- **A11y**: `aria-label` is mandatory — an icon has no accessible name. `--sm`
  (32×32) clears the 24×24 web floor but not the 44×44 touch target: on
  touch surfaces use the default size.
- **Do**: pair with a Tooltip for discoverability, but keep the `aria-label`
  as the real name (the tooltip is `aria-describedby`, not the label).
- **Don't**: don't mix sizes inside one action row — pick one and keep every
  row action on it.

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

## Textarea — `.dds-textarea`

```html
<div class="dds-field">
  <label class="dds-field__label" for="intro">Introduction</label>
  <textarea class="dds-textarea" id="intro" rows="4"
            aria-describedby="intro-help"></textarea>
  <span class="dds-field__help" id="intro-help">Shown to visitors.</span>
</div>
```

- Lives in the same `.dds-field` wrapper as `.dds-input`: label, help and
  error (`.dds-field--error` / `aria-invalid`) behave identically.
- `min-height` is two control heights, `resize: vertical` (horizontal resize
  breaks the grid the form sits in).
- **Do**: give a textarea its own form row. Mixing a one-line control and a
  textarea in one row is a rejection criterion in this house — their heights
  cannot be reconciled without shrinking one of them.
- **Don't**: don't grow it by shrinking the control next to it; don't disable
  resize entirely when the content is genuinely long-form.

## Select — `.dds-select` / `.dds-select__input`

```html
<div class="dds-field">
  <label class="dds-field__label" for="locale">Language</label>
  <span class="dds-select">
    <select class="dds-select__input" id="locale">
      <option>한국어</option><option>English</option>
    </select>
  </span>
</div>
```

- A real `<select>` (keyboard, mobile picker, form semantics) with the native
  arrow replaced by the wrapper's chevron. **Leaving the OS arrow in place is
  a rejection criterion** — the same control then looks different on every
  platform and mismatches the input next to it.
- The wrapper `.dds-select` is required (it draws the chevron); the class on
  the element itself is `.dds-select__input`.
- **A11y**: label via `<label for>` like any field; the chevron is
  `pointer-events: none` so clicks always reach the select.
- **Do**: build option lists from the data (distinct values), not a
  hardcoded list.
- **Don't**: don't replace a `<select>` with a div+listbox unless you are
  also implementing the full ARIA listbox pattern.

## Checkbox / Radio — `.dds-check` / `.dds-check__input`

```html
<label class="dds-check">
  <input class="dds-check__input" type="checkbox" checked>
  Send me the weekly digest
</label>
<label class="dds-check">
  <input class="dds-check__input" type="radio" name="cadence" value="daily">
  Daily
</label>
```

- One class for both: the input's `type` picks the shape (square + tick vs
  circle + dot). `:indeterminate` is styled for "some selected" headers.
- The tick/dot is `on-brand` (zinc.950), never white — same rule as the
  primary button (spec §3.1).
- **A11y**: wrap the text in the `<label>` so the whole row is the hit area
  (the 18px box alone is below the touch floor); disabled dims the label
  once, not the box twice.
- **Do**: radio for one-of-many that takes effect on submit; checkbox for
  independent options.
- **Don't**: don't use a checkbox for a setting that applies immediately —
  that is a Switch.

## Switch — `.dds-switch` / `.dds-switch__input`

```html
<label class="dds-switch">
  <input class="dds-switch__input" type="checkbox" role="switch" checked>
  Handoff alerts
</label>
```

- An immediate on/off. Track 36×20, knob 16 (glyph geometry, not spacing).
  The knob turns `on-brand` on the brand-filled track — the same rule that
  keeps white off cyan.
- Transitions are removed under `prefers-reduced-motion`.
- **A11y**: `role="switch"` on the input so AT announces on/off rather than
  checked/unchecked; the label text is the accessible name.
- **Do**: apply the change immediately and report failure with a toast —
  silent no-op is a rejection criterion.
- **Don't**: don't put a Save button next to a switch; if the value needs
  saving, it's a checkbox.

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

## Chip — `.dds-chip`

```html
<button class="dds-chip" aria-pressed="true">Unanswered</button>
<button class="dds-chip">Web pages</button>
<button class="dds-chip" disabled>Archived</button>
```

- A small **interactive** control: filter toggle, suggested question,
  removable tag. Badge and Chip are different components on purpose — a badge
  is state you read, a chip is something you press. Never restyle one into
  the other (a duplicated `.chip` definition has already cost this house a
  live bug).
- Selected = `aria-pressed="true"` (announced); `--selected` exists only for
  markup that can't use `aria-pressed` (e.g. a link chip).
- **Do**: keep chips one line high and let the row scroll; label them with
  the value, not "Filter 1".
- **Don't**: don't use a chip as the primary action of a view — that's a
  Button.

## Avatar — `.dds-avatar`

```html
<span class="dds-avatar" aria-hidden="true">KS</span>
<span class="dds-avatar dds-avatar--lg">
  <img class="dds-avatar__img" src="/u/12.jpg" alt="">
</span>
<span class="dds-avatar dds-avatar--square dds-avatar--sm" aria-hidden="true">DL</span>
```

- Sizes 32 / 40 / 48 from the spacing scale, so an avatar lines up with the
  control of the same size in a list row. `--square` for company/tenant marks
  (a logo in a circle gets clipped).
- Initials use the brand-subtle pair, so they re-tint with the product brand.
- **A11y**: the avatar is decorative when the name is already in the row —
  `aria-hidden="true"` on initials, `alt=""` on the image. Only give it an
  alt/label when it is the *only* identification.
- **Do**: derive initials from the same name string the row shows.
- **Don't**: don't put status text inside the avatar — use a Badge next to it.

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

## Divider — `.dds-divider`

```html
<hr class="dds-divider">
<div style="display:flex">A<hr class="dds-divider dds-divider--vertical">B</div>
```

- `--vertical` needs a stretchable parent (flex row / grid cell).
- **Do**: use `<hr>` when the split is meaningful; add `role="presentation"`
  when it is purely decorative.
- **Don't**: don't use a divider where spacing already separates the groups —
  two separators in a row is visual noise.

## Card — `.dds-card`

```html
<section class="dds-card">
  <h3 class="dds-card__title">Reindex schedule</h3>
  <p class="dds-card__body">Sources are recrawled daily at 04:00 KST.</p>
</section>
<section class="dds-card dds-card--subtle">…</section>
```

- Border + `bg.elevated` + `elevation.1`. The shadow token ships in both
  themes: on a zinc.950 page it resolves to almost nothing, which is the
  intended dark look — **a component never branches on theme** (spec §3.1).
- `--subtle` is the flat variant for a card inside an already elevated
  surface (a card in a dialog), where a second shadow reads as noise.
- **Do**: one card = one subject; put its actions in a `.dds-card` footer row
  of buttons.
- **Don't**: don't nest full cards inside cards — use `--subtle` or a
  Divider.

## ListRow — `.dds-listrow`

```html
<ul style="list-style:none;margin:0;padding:0">
  <li><button class="dds-listrow dds-listrow--interactive">
    <span class="dds-avatar dds-avatar--sm" aria-hidden="true">KS</span>
    <span class="dds-listrow__body">
      <span class="dds-listrow__title">강신</span>
      <span class="dds-listrow__sub">대표 · 초대함</span>
    </span>
    <span class="dds-badge dds-badge--success">활성</span>
  </button></li>
</ul>
```

- Slots: leading (any flex child), `__body` (`__title` + `__sub`),
  `__actions`. Rows separate themselves (`+ .dds-listrow` draws the rule).
- `--interactive` for rows that *are* the control — use a real `<button>` or
  `<a>`. The focus ring is inset (a full-bleed row has no outer margin).
- Long titles ellipsize; the row height stays constant.
- **Do**: make the row self-contained — if the information fits in the row,
  don't defer it to a detail page.
- **Don't**: don't put an inline accordion in a row that can be deleted or
  edited — a re-render after the action collapses it. Use a dedicated view.

## Tabs — `.dds-tabs` / `.dds-tab`

```html
<div class="dds-tabs" role="tablist">
  <button class="dds-tab" role="tab" aria-selected="true" aria-controls="p1" id="t1">Sources</button>
  <button class="dds-tab" role="tab" aria-selected="false" aria-controls="p2" id="t2">Visitors</button>
</div>
<div role="tabpanel" id="p1" aria-labelledby="t1">…</div>
```

- Ink-underline tabs, horizontally scrollable when they overflow (the mobile
  behavior of the admin shell).
- Selection is `aria-selected`, never a class alone — the state must be
  announced, and the underline repeats it so color isn't the only signal.
- **A11y**: `role="tablist"`/`tab`/`tabpanel` with `aria-controls` +
  `aria-labelledby`; arrow-key roving focus is the consumer's JS.
- **Do**: group tabs by kind and put a new feature in the obvious existing
  group — a flat list of everything is just a stack with a new name.
- **Don't**: don't hide a tab's panel with a `display` rule that lacks a
  `[hidden]` guard (that exact collision once painted an empty state over a
  populated table).

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

## Tooltip — `.dds-tooltip` / `.dds-tooltip__bubble`

```html
<span class="dds-tooltip">
  <button class="dds-iconbtn" aria-label="Recrawl" aria-describedby="tp1">
    <svg aria-hidden="true" width="20" height="20">…</svg>
  </button>
  <span class="dds-tooltip__bubble" role="tooltip" id="tp1">Recrawl now</span>
</span>
```

- Web only (spec §4.3). On native the same information goes in a label or a
  sheet — there is no hover.
- Opens on hover **and** `:focus-within`, so it is keyboard-reachable; the
  bubble sits on `bg.inverse` / `text.on-inverse` (D-011).
- **A11y**: reference it with `aria-describedby`, not `aria-label` — the
  control keeps its own name, and a describedby bubble reaches AT even when
  it never visually opens.
- **Do**: use it for the name of an icon-only control or a short unit hint.
- **Don't**: never put information required to use the control in a tooltip —
  it is unavailable on touch and disappears on scroll.

## EmptyState — `.dds-empty`

```html
<div class="dds-empty">
  <p class="dds-empty__title">등록된 자료가 없습니다</p>
  <p class="dds-empty__desc">웹페이지 주소나 PDF를 추가하면 AI가 그 내용으로 답합니다.</p>
  <div class="dds-empty__actions">
    <button class="dds-btn dds-btn--primary dds-btn--sm">자료 추가</button>
  </div>
</div>
```

- The empty view keeps the **same skeleton** as the filled one — summary
  chips and filters stay put; the empty state replaces the rows, not the
  screen.
- Always name the next action in `__actions`; an empty state without a way
  forward is a dead end.
- **A11y**: it is ordinary content, not an alert. When it appears after a
  search, put the result count in the live region instead.
- **Do**: distinguish "nothing yet" (onboarding copy) from "nothing matched"
  (offer to clear the filter).
- **Don't**: don't toggle it with a `display` rule that outranks `[hidden]` —
  `.dds-empty[hidden]` is guarded here for exactly that reason.
