<script lang="ts">
 import { untrack } from 'svelte';
 import type { LeftNavProps, ConsoleNavItem } from './types';
 let {surface,activePath,nav,labels,expandedGroups,defaultExpandedGroups,onExpandedGroupsChange,onNavigate}:LeftNavProps=$props();
 const id=$props.id();
 function active(item:ConsoleNavItem){return item.active??(activePath===item.href||(item.href.split('/').filter(Boolean).length>1&&activePath.startsWith(`${item.href}/`)))}
 let internal=$state<readonly string[]>(untrack(()=>defaultExpandedGroups??nav.flatMap((group,index)=>group.collapsible&&group.items.some(active)?[group.id??`group-${index}`]:[])));
 let expanded=$derived(expandedGroups??internal);
 function toggle(groupId:string){const next=expanded.includes(groupId)?expanded.filter(value=>value!==groupId):[...expanded,groupId];if(expandedGroups===undefined)internal=next;onExpandedGroupsChange?.(next)}
</script>
<nav class="dds-console-rail__nav" aria-label={labels.nav}>
 {#each nav as group,index (group.id??index)}
  <section class="dds-console-rail__group" aria-labelledby={`${id}-group-${index}`} data-collapsible={group.collapsible?'true':undefined}>
   <h2 id={`${id}-group-${index}`} class="dds-console-rail__group-label">{#if group.collapsible}<button type="button" class="dds-console-rail__group-toggle" aria-expanded={expanded.includes(group.id??`group-${index}`)} aria-controls={`${id}-items-${index}`} onclick={()=>toggle(group.id??`group-${index}`)}><span>{group.label}</span><span class="dds-console-rail__chevron" aria-hidden="true"></span></button>{:else}{group.label}{/if}</h2>
   <ul id={`${id}-items-${index}`} hidden={group.collapsible&&!expanded.includes(group.id??`group-${index}`)}>
    {#each group.items as item (item.id)}<li><a class="dds-console-rail__item" data-nav={`${surface}.${item.id}`} href={item.href} aria-current={active(item)?'page':undefined} onclick={()=>onNavigate?.()}>
     {#if item.icon}<span class="dds-console-rail__item-content"><span class="dds-console-rail__item-icon" aria-hidden="true">{@render item.icon()}</span><span>{item.label}</span></span>{:else}<span>{item.label}</span>{/if}
     {#if item.badge!=null&&item.badge>0}<span class="dds-console-rail__badge" aria-label={labels.badge.replace('{count}',()=>String(item.badge))}>{item.badge}</span>{/if}
    </a></li>{/each}
   </ul>
  </section>
 {/each}
</nav>
