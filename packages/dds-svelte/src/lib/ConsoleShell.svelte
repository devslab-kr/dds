<script lang="ts">
  import Layout from "./Layout.svelte";
  import LeftNav from "./LeftNav.svelte";
  import type { ConsoleShellProps } from "./types";
  let {
    surface,
    activePath,
    brand,
    context,
    nav = [],
    navigation: customNavigation,
    labels,
    header: pageHeader,
    foot,
    children,
    expandedGroups,
    defaultExpandedGroups,
    onExpandedGroupsChange,
  }: ConsoleShellProps = $props();
</script>

<Layout {surface} {labels}>
  {#snippet railStart()}<a class="dds-console-rail__brand" href={brand.href}
      ><img src={brand.mark} alt="" width="20" height="20" /><strong
        >{brand.name}</strong
      ></a
    >{#if context?.length}<dl class="dds-console-rail__context">
        {#each context as row, index (index)}<div>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>{/each}
      </dl>{/if}{/snippet}
  {#snippet navigation()}{#if customNavigation}{@render customNavigation()}{:else}<LeftNav
        {surface}
        {activePath}
        {nav}
        {labels}
        {expandedGroups}
        {defaultExpandedGroups}
        {onExpandedGroupsChange}
      />{/if}{/snippet}
  {#snippet railEnd()}{#if foot}<div class="dds-console-rail__foot">
        {@render foot()}
      </div>{/if}{/snippet}
  {#snippet header()}<div class="dds-console-page-header">
      <div class="dds-console-page-header__text">
        {#if pageHeader.eyebrow}<p class="dds-console-page-eyebrow">
            {pageHeader.eyebrow}
          </p>{/if}
        <h1>{pageHeader.title}</h1>
      </div>
      {#if pageHeader.actions}<div class="dds-console-page-header__actions">
          {@render pageHeader.actions()}
        </div>{/if}
    </div>{/snippet}
  {@render children?.()}
</Layout>
