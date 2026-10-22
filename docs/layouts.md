# Shared DDS application layouts

Use the same `Layout`, `LeftNav` and `TopNav` exports from `@devslab/dds-react`,
`@devslab/dds-solid`, `@devslab/dds-vue` or `@devslab/dds-svelte`. Import that
package's `styles.css` once. Every adapter uses the same DDS CSS and tokens.

```tsx
<Layout navigationPosition="left" labels={layoutLabels}
  railStart={<Brand />} navigation={<LeftNav {...menuProps} />}
  header={<h1>Orders</h1>}>
  <section className="dds-layout__section dds-layout__panel">...</section>
</Layout>
```

For horizontal navigation, choose `navigationPosition="top"` and compose
`TopNav`. Solid uses `class` instead of React's `className`. Vue uses named
slots: `#header`, `#navigation`, `#railStart`, `#railEnd`, `#footer`, and default
content. Svelte uses snippets with exactly those names and children. See the
four runnable fixtures in `tests/fixtures/layouts` for complete examples.

Layout owns geometry and mobile navigation. LeftNav owns groups, optional
collapse, icons and active links. TopNav owns native disclosure groups with
ordinary links; it is not an application menubar. Escape closes a dropdown and
restores its summary; the next Escape closes an open mobile drawer. Outside
pointer activation closes dropdowns. Navigation preserves native link behavior.
The app owns routing, permissions, data loading, route-change group expansion
and session storage. Read storage after hydration and keep SSR/first client
state equal. Use stable group IDs; without them expansion keys use group index.
Vue expansion uses `v-model:expandedGroups`; React/Solid/Svelte use
`expandedGroups` and `onExpandedGroupsChange`. Omit for internal state, with
`defaultExpandedGroups` initial values (`[]` closes all; absent opens active groups).

## Fixed application rules

| Role | Size / line height / weight |
|---|---|
| Page title | 24 / 32px / 700 |
| Section title | 20 / 28px / 600 |
| Subheading | 17 / 24px / 600 |
| Body | 14 / 20px / 400 |
| Reading text (`dds-layout__reading`) | 16 / 24px / 400 |
| Field label | 13 / 16px / 500 |
| Supporting text (`dds-layout__caption`) | 12 / 16px / 400 |

Sidebar: 232px, 20px vertical and 12px horizontal padding. Top bar: minimum
56px; long content may wrap. Main padding: 32px desktop / 16px mobile. Mobile
breakpoint: 56.25rem. Menu targets: minimum 40px desktop / 44px mobile.
`contentWidth` is workspace (1100px, default), form (900px), settings (800px), or full.
Content/section gap is 32px. Panels use `dds-layout__panel` (24px / mobile16px);
field groups use `dds-layout__fields` (16px). Menu icon gap is 8px. Chips grow to
fit their text; do not reuse a step-number circle for a status label.

Use shared components and the named roles instead of product-specific heading,
font-size, margin, or density overrides. Existing DDS controls retain their own
semantic contracts. Brands supply logo and semantic color tokens; they do not
need a fork of the layout CSS. The host continues to load its fonts.

ConsoleShell keeps existing props and slots while composing Layout and LeftNav.
Its non-collapsible legacy groups remain open. Existing Vue `actions` and
`foot` slots remain supported (`header-actions` also supported).

Svelte currently ships these four shell/navigation components, not the full
React/Solid/Vue control and grid inventory. Package publication does not deploy
a product: each consumer must adopt the version, build, validate and deploy.

Validation: package behavior + SSR + types, `verify:foundation:layouts` for
actual desktop/mobile dimensions, keyboard focus, long labels, zoom, RTL,
themes and axe, and isolated tarball-consumer release checks.
