# @devslab/dds-svelte

Svelte 5 Layout, LeftNav, TopNav and ConsoleShell using the shared DDS geometry,
typography and CSS. This package currently provides these application shell
components; it does not claim the React/Solid control or grid inventory.

Import `@devslab/dds-svelte/styles.css` once. Use `Layout` with
`navigationPosition="left"` or `"top"`, `contentWidth="workspace"|"form"|"settings"|"full"`,
and header/navigation/railStart/railEnd/footer snippets plus children.
`LeftNav` and `TopNav` work independently of Layout. Icons are decorative snippets.

LeftNav supports nav groups with stable IDs and optional collapsible disclosure.
Use expandedGroups/onExpandedGroupsChange for parent control, or
 defaultExpandedGroups for initial state. Empty defaults close all groups;
otherwise active groups initially open. The app owns routing, permissions,
route-change expansion and storage; read browser storage after hydration.
Layout owns the shared mobile navigation and focus restoration. TopNav uses
native disclosure navigation, not a partial application menubar.

See [shared layout guidance](../../docs/layouts.md) for exact dimensions and
composition examples. Run package test/check/build before publication.
