# DevsLab Design System (DDS) — Rules Spec v0

🌐 [한국어](design-system.ko.md)

The rules that bind **web and mobile apps into one design language** across the
DevsLab product family (AskLinq, BookLinq, FlowLinq — the Linq family). We use
[Toss Design System (TDS)](https://tossmini-docs.toss.im/tds-react-native/) as
the reference model — token-based foundations + per-platform component
packages — while staying framework-neutral (TDS 2.x depends on Toss's own RN
framework, Granite — we do not create that kind of dependency).

> **A note on location.** This document lives in the asklinq repo until the
> spec settles. Once implementation starts it graduates to a shared package at
> the [linq-kit](https://github.com/devslab-kr/linq-kit) level (or a dedicated
> `devslab-kr/dds` repo). AskLinq is the first consumer, not the owner.

---

## 1. Principles

1. **Tokens are the single source of truth.** Every visual value — color,
   typography, spacing, radius, shadow, motion — comes from a token. No
   hard-coded hex or px values in components or product code.
2. **One language, two runtimes.** Web (React) and mobile (React Native) share
   component names, props contracts, and tokens. Only the implementation
   differs.
3. **Semantic over raw.** Components never reference the raw palette
   (`cyan-500`) directly — only semantic tokens (`color.bg.brand`). Dark mode
   is obtained purely by swapping the semantic mapping.
4. **Accessible by default.** Contrast, touch targets, and focus indication are
   not options; they are minimum conditions a component must pass.
5. **The system owns pieces, products own screens.** Page layout and business
   flows belong to product code; the system provides reusable parts and rules.

---

## 2. Architecture

Three layers. The lower, the more platform-neutral.

```text
[ Components ]  Button, TextField, Dialog …          ← per-platform impls (web / native)
[ Primitives ]  Text, Box, Stack, Pressable …        ← thin platform adapters
[ Tokens ]      color / typography / spacing / …     ← pure JSON, platform-neutral
```

### Package layout (when implemented)

| Package | Contents | Consumers |
| --- | --- | --- |
| `@devslab-kr/dds-tokens` | Token JSON + build outputs (table below) | everywhere |
| `@devslab-kr/dds-css` | CSS component layer (class-based, framework-agnostic) | SSR pages, vanilla widget, Vue, React, Ionic |
| `@devslab-kr/dds-native` | React Native components | mobile apps (if RN is chosen) |
| `@devslab-kr/dds-icons` | Icons (single SVG source → per-platform codegen) | everywhere |

Token builds use a [Style Dictionary](https://styledictionary.com/)-class tool
to generate every platform output **from one source**. The moment web and
native hold their own copies of values, consistency is over.

**`dds-tokens` build outputs** — each framework consumes tokens in a different
shape, so the token package emits all of them:

| Output | Shape | Consumers |
| --- | --- | --- |
| CSS custom properties | `tokens.css` (`--dds-color-bg-brand: …`) | all web (SSR, Vue, React, Ionic) |
| Tailwind preset | v4 `@theme` CSS + v3 `preset.js` | any project using Tailwind |
| TypeScript constants | `tokens.ts` | RN, code needing tokens at runtime |
| Ionic theme mapping | `ionic.css` (`--ion-color-primary: var(--dds-color-bg-brand)` …) | Ionic apps (if chosen) |

### Framework strategy — "the core is CSS; frameworks are consumers"

The current DevsLab web stack has no framework (AskLinq = Hono SSR + a vanilla
JS widget). That is an opportunity, not a constraint — by making the **CSS
layer the core** instead of binding components to one framework, React, Vue,
Ionic, and SSR pages all share the same parts.

- **Tailwind** — a distribution channel for tokens, not a separate system.
  `dds-tokens` emits a Tailwind preset, so utilities like `bg-brand`,
  `text-primary`, `p-4` *are* DDS tokens. Tailwind arbitrary values
  (`bg-[#06b6d4]`, `p-[13px]`) are the same violation as hard-coding tokens.
- **Vue** — no separate `dds-vue` package. Vue projects use `dds-css` classes
  and Tailwind utilities directly, wrapping thinly inside the product repo if
  needed. If two or more Vue products actually exist, package promotion is
  reconsidered then (same logic as the §4.3 promotion rule).
- **Ionic** — Ionic components are web components themed via CSS variables
  (`--ion-color-*`), so a single Ionic mapping file from `dds-tokens` dresses
  all of Ionic in DDS colors and typography. Even if mobile goes Ionic instead
  of RN, the token and contract layers stay unchanged (see §8 Phase 3).
- **React** — also a consumer. When a React product exists, it gets a thin
  wrapper over `dds-css`.

**Rule.** A per-framework component package is created **only when a product
built on that framework actually exists**. Framework bindings without a
consumer are maintenance debt.

Token files follow the
[W3C Design Tokens](https://design-tokens.github.io/community-group/format/)
format:

```json
{
  "color": {
    "bg": {
      "brand": { "$value": "{palette.cyan.500}", "$type": "color" }
    }
  }
}
```

---

## 3. Foundations

### 3.1 Color

The color system adopts TDS's structure directly: three tiers — **raw palette
(10 steps, 50–900, per hue) + alpha scale + semantic (adaptive) tokens**. Just
as TDS separates palette entries like `colors.blue500` from adaptive tokens
like `colors.background` / `colors.greyBackground` /
`colors.layeredBackground`, DDS separates palette from semantics, and
components only ever see the semantic layer.

**The brand anchor is the DevsLab homepage (devslab.kr).** AskLinq's teal was
provisional; the system standardizes on what the homepage actually uses —
**cyan** (`#06b6d4`, hover `#22d3ee`) and **zinc neutrals** (`#09090b` dark
background, `#fafafa` light). AskLinq converges on cyan when it moves onto
tokens in Phase 1.

**Raw palette — brand & neutral (full scales).**

| Step | `cyan` (brand) | `zinc` (neutral) |
| --- | --- | --- |
| 50 | `#ecfeff` | `#fafafa` |
| 100 | `#cffafe` | `#f4f4f5` |
| 200 | `#a5f3fc` | `#e4e4e7` |
| 300 | `#67e8f9` | `#d4d4d8` |
| 400 | `#22d3ee` | `#a1a1aa` |
| 500 | `#06b6d4` | `#71717a` |
| 600 | `#0891b2` | `#52525b` |
| 700 | `#0e7490` | `#3f3f46` |
| 800 | `#155e75` | `#27272a` |
| 900 | `#164e63` | `#18181b` |
| 950 | — | `#09090b` |

**Raw palette — status hues (anchors; full scales fixed in the token JSON).**

| Scale | Use | Anchors |
| --- | --- | --- |
| `red.50–900` | danger · errors | `red.500 = #ef4444`, `red.700 = #b91c1c`, `red.50 = #fef2f2` |
| `amber.50–900` | warnings | `amber.500 = #f59e0b`, `amber.700 = #b45309`, `amber.50 = #fffbeb` |
| `green.50–900` | success | `green.500 = #22c55e`, `green.700 = #15803d`, `green.50 = #f0fdf4` |
| `blue.50–900` | info · links | `blue.500 = #3b82f6`, `blue.700 = #1d4ed8`, `blue.50 = #eff6ff` |

**Alpha scale** — DDS's equivalent of TDS greyOpacity. Overlays, pressed
states, and dims are solved with alpha, not opaque greys (so they layer
naturally over any background). Anchored to values the homepage actually
uses:

| Token | Value | Use |
| --- | --- | --- |
| `alpha.black.5` | `#0000000d` | hover tint (light) |
| `alpha.black.8` | `#00000014` | pressed tint (light) |
| `alpha.black.10` | `#0000001a` | hairline separators, dim borders |
| `alpha.black.25` | `#00000040` | dim overlay (behind modals) |
| `alpha.white.8` | `#ffffff14` | hover/pressed tint (dark) |
| `alpha.white.85` | `#ffffffd9` | translucent text on dark |

**Semantic tokens** — the only layer components actually reference. Two
mappings exist. Matching the homepage, **light is the default and dark is a
toggle**; both mappings are first-class from day one.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `color.bg.default` | `#ffffff` | `zinc.950` | base screen background |
| `color.bg.subtle` | `zinc.50` | `zinc.900` | section/card separation (TDS greyBackground) |
| `color.bg.elevated` | `#ffffff` + elevation | `zinc.900` | modals, popovers, sheets (TDS layered/floated) |
| `color.bg.brand` | `cyan.500` | `cyan.500` | brand surfaces (primary buttons etc.) |
| `color.bg.brand-hover` | `cyan.400` | `cyan.400` | brand surface hover (homepage idiom) |
| `color.bg.brand-subtle` | `cyan.50` | `cyan.900` | soft brand backgrounds |
| `color.text.primary` | `zinc.950` | `zinc.50` | body & headings |
| `color.text.secondary` | `zinc.600` | `zinc.400` | supporting copy |
| `color.text.muted` | `zinc.500` | `zinc.500` | disabled, placeholders |
| `color.text.on-brand` | `zinc.950` | `zinc.950` | **text on brand surfaces (note below)** |
| `color.text.brand` | `cyan.700` | `cyan.400` | brand text & links |
| `color.border.default` | `zinc.200` | `zinc.800` | default borders |
| `color.border.strong` | `zinc.300` | `zinc.700` | emphasized borders (inputs) |
| `color.border.focus` | `cyan.500` | `cyan.400` | focus ring |
| `color.status.success` / `.success-bg` | `green.700` / `green.50` | `green.400` / `green.900` | success |
| `color.status.warning` / `.warning-bg` | `amber.700` / `amber.50` | `amber.400` / `amber.900` | warning |
| `color.status.danger` / `.danger-bg` | `red.700` / `red.50` | `red.400` / `red.900` | danger · errors |
| `color.status.info` / `.info-bg` | `blue.700` / `blue.50` | `blue.400` / `blue.900` | info |

> **The on-brand note.** Cyan is a light hue — white text on `cyan.500` has a
> contrast of ~2.3:1, far below WCAG AA. Text on brand surfaces is therefore
> **`zinc.950` (dark)**, not white (~8:1 contrast) — which also matches the
> homepage's terminal motif (dark panels with cyan prompts). The "primary
> button = colored background + white text" habit is dropped here.

**Rules.**

- Components and product code use semantic tokens only. Raw palette references
  are allowed solely inside the semantic layer definitions.
- Dark mode must be achievable by adding one semantic mapping file. If a
  component needs an `if (dark)` branch, the token design is wrong.
- Status colors (success/warning/danger/info) are always used with their `-bg`
  pair (strong foreground + soft background). No ad-hoc combinations.
- Overlays and hover/pressed tints use the alpha scale only. Faking them with
  the `opacity` property is allowed for disabled states only (same as §4.2).

### 3.2 Typography

**Font.** Matching the homepage (devslab.kr): Latin and numerals use
[Geist](https://vercel.com/font), code and labels use Geist Mono. Geist has no
Hangul glyphs, so Korean falls back to
[Pretendard](https://github.com/orioncactus/pretendard) → system gothic
(stack: `Geist, Pretendard, system-ui, …`). Screens where numbers matter
(dashboard stats) enable tabular figures.

**Scale** — name, size, line-height, and weight form one set. Web uses `rem`
(1rem = 16px); RN uses the same numbers as pt. Since the numbers match, there
is one table.

| Token | Size/Line | Weight | Use |
| --- | --- | --- | --- |
| `typo.display` | 32 / 40 | 700 | landing hero, big numbers |
| `typo.title-1` | 24 / 32 | 700 | page titles |
| `typo.title-2` | 20 / 28 | 600 | section titles, dialog titles |
| `typo.title-3` | 17 / 24 | 600 | card titles, emphasized list rows |
| `typo.body-1` | 16 / 24 | 400 | default body (incl. chat messages) |
| `typo.body-2` | 14 / 20 | 400 | dense body, dashboard cells |
| `typo.label` | 13 / 16 | 500 | buttons, input labels, tabs |
| `typo.caption` | 12 / 16 | 400 | timestamps, auxiliary info |

**Rules.**

- No sizes outside the scale. If a new size is needed, the PR that adds it to
  the scale comes first.
- Size and line-height are never tuned independently (sets only).
- Minimum body text: 14px web / 14pt mobile. Caption is never used for body
  copy.

### 3.3 Spacing

4px grid. Allowed values:

```text
0  2  4  8  12  16  20  24  32  40  48  64
```

Token names are the values themselves (`space.8`, `space.16`). Component
padding, gaps, and layout margins all pick from this scale only. If an odd or
arbitrary value (`13px`, `18px`) seems needed, fit the design to the scale —
not the scale to the design.

### 3.4 Radius

| Token | Value | Use |
| --- | --- | --- |
| `radius.sm` | 4 | checkboxes, tags |
| `radius.md` | 8 | buttons, inputs, cards |
| `radius.lg` | 12 | dialogs, popovers |
| `radius.xl` | 16 | bottom sheets, large cards |
| `radius.full` | 9999 | pills, avatars, chips |

### 3.5 Elevation

Three levels only. Tokens define the web `box-shadow` and the RN iOS
`shadow*` / Android `elevation` values together (never maintained separately
per platform).

| Token | Use | Web | RN elevation |
| --- | --- | --- | --- |
| `elevation.1` | cards | `0 1px 3px rgba(20,22,26,.08)` | 2 |
| `elevation.2` | dropdowns, popovers | `0 4px 12px rgba(20,22,26,.12)` | 6 |
| `elevation.3` | modals, bottom sheets | `0 12px 32px rgba(20,22,26,.18)` | 12 |

### 3.6 Motion

| Token | Value | Use |
| --- | --- | --- |
| `motion.duration.fast` | 100ms | hover/press feedback |
| `motion.duration.base` | 200ms | transitions, fades, toasts |
| `motion.duration.slow` | 300ms | sheet/modal enter & exit |
| `motion.easing.standard` | `cubic-bezier(0.2, 0, 0, 1)` | most transitions |
| `motion.easing.enter` | `cubic-bezier(0, 0, 0, 1)` | entrances (decelerate) |
| `motion.easing.exit` | `cubic-bezier(0.3, 0, 1, 1)` | exits (accelerate) |

**Rule.** Always respect the OS reduced-motion setting
(`prefers-reduced-motion`, RN `AccessibilityInfo.isReduceMotionEnabled`) —
decorative animation is disabled; transitions that convey state complete
instantly instead.

### 3.7 Icons

- One set, 24px grid, 1.5px stroke, color inherited via `currentColor`.
- Names follow a `function-variant` pattern (`chevron-down`, `check-circle`).
  Brand logos are separate assets, not part of the icon set.
- Web and RN components are code-generated from the same SVG source. Never
  hand-maintain two copies.

---

## 4. Component rules

### 4.1 API contract — what web and native share

A component with the same name has **identical core props** on both platforms:

- `variant` — visual kind (`primary` / `secondary` / `ghost` / `danger` …)
- `size` — `sm` / `md` / `lg` (per-component subsets allowed; names unified)
- `disabled`, `loading` — state booleans
- Content via `children` first; auxiliary slots are `leading` / `trailing`

**The only permitted divergence: the event prop.** Web keeps `onClick`, RN
keeps `onPress` — better than forcing a unified name that feels wrong on both.
Any other prop-name divergence is a contract violation.

### 4.2 States

Every interactive component defines and documents all of:

```text
default → hover (web only) → pressed → focused (web: focus-visible) → disabled → loading
```

Per-state colors come from `-hover` / `-pressed` variants of semantic tokens.
Faking states with opacity (`opacity: 0.5`) is allowed for disabled only.

### 4.3 Component tiers and initial inventory

| Tier | Definition | Examples |
| --- | --- | --- |
| **Core** | Atoms every product uses. Implemented on both platforms | Button, TextField, Checkbox, Switch, Badge, Spinner |
| **Composite** | Compositions of Core. Implemented platform-first as needed | Dialog, BottomSheet, Toast, Tabs, ListRow, EmptyState |
| **Product-local** | Single-product components. Live in the product repo, outside the system | chat bubble, QR card |

**Promotion rule.** The moment a product-local component is needed by a second
product, it becomes a promotion candidate. Promote before the second
copy-paste happens.

**v1 target inventory (Core + Composite, ~20).**
Button, IconButton, TextField, Textarea, Select, Checkbox, Radio, Switch,
Badge, Chip, Avatar, Spinner, Skeleton, Divider, Card, ListRow, Tabs,
Dialog, BottomSheet (native) / Modal (web), Toast, Tooltip (web), EmptyState.

### 4.4 Definition of Done

A component enters the system only with:

1. Both platform implementations — or a documented reason one is missing
2. Stories for every state, variant, and size (web: Storybook; RN: showcase app)
3. Accessibility pass (§6) — labels, contrast, focus, touch targets
4. Usage guide — at least one do and one don't

---

## 5. Cross-platform rules

**Shared** — token values, component names, props contracts, state
definitions, documentation, behavior specs ("Dialog closes on outside tap").

**Left to the platform** — implementation code, navigation idioms (web routing
vs native stacks), hover (web only), keyboard focus traversal (web), gestures
and haptics (native), date/time pickers (native prefers OS defaults).

**Forbidden.** Porting web idioms to native (hover-dependent UI on mobile) or
forcing native idioms onto web (bottom sheets on desktop). Components with the
same role may take different forms per platform — map them **at the role
level**, like Modal (web) ↔ BottomSheet (native), and record the mapping in
the docs.

---

## 6. Accessibility — the minimum bar

- Text contrast ≥ 4.5:1; large text and UI elements ≥ 3:1 (WCAG AA)
- Touch targets ≥ 44×44 (mobile) / click targets ≥ 24×24 (web)
- Web: every interactive element keyboard-reachable, with a `focus-visible`
  ring (`color.border.focus`, 2px, offset 2px)
- Icon-only buttons require `aria-label` (web) / `accessibilityLabel` (RN)
- Never convey state by color alone (pair with icon or text)
- Respect reduced-motion settings (§3.6)

---

## 7. Governance

- **Versioning.** `dds-tokens` / `dds-web` / `dds-native` release on one
  version train (lockstep semver). Renaming or removing a token = breaking =
  major.
- **Change process.** Proposal (a short RFC in the style of this doc) → review
  → implementation + stories + docs → release. Foundation changes (§3) affect
  every product, so they are recorded in a decision log (decisions.md format).
- **Deprecation.** Warn for at least one minor version, remove in the next
  major.
- **Docs are the contract.** Undocumented behavior must not be relied on; when
  docs and implementation disagree, the implementation is fixed to match the
  docs.

---

## 8. Adoption path

| Phase | Contents | When |
| --- | --- | --- |
| **Phase 0** | Finalize this doc + author the `dds-tokens` JSON | now |
| **Phase 1** | Token build pipeline (CSS variables + Tailwind preset) + `dds-css` Core 6 (Button, TextField, Badge, Spinner, Dialog, Toast) → applied to the AskLinq widget & SSR pages | when web UI work resumes |
| **Phase 2** | `dds-icons` + more Composites + public Storybook | after Phase 1 stabilizes |
| **Phase 3** | Starts with mobile work — **if RN**, implement `dds-native`; **if Ionic**, the `dds-tokens` Ionic mapping + `dds-css` are reused (no new package) | when mobile work starts |

No mobile package before Phase 3 — platform implementations without a consumer
rot. The RN-vs-Ionic choice is made from product needs at mobile kickoff
(native performance/gestures vs web code reuse) and recorded in decisions.md.
Either way the tokens and API contract (§3, §4) stay unchanged, so Phase 3 is
implementation work, not a redesign.

---

## References

- [TDS React Native docs](https://tossmini-docs.toss.im/tds-react-native/) — structural reference model
- [Toss Design System intro (Apps in Toss)](https://developers-apps-in-toss.toss.im/design/components.html)
- [Rethinking design systems — Toss Tech](https://toss.tech/article/rethinking-design-system)
- [W3C Design Tokens Format](https://design-tokens.github.io/community-group/format/)
- [Pretendard](https://github.com/orioncactus/pretendard)
