<script setup lang="ts">
import { ref, useId, onMounted, onUnmounted, nextTick } from 'vue'
import type { LayoutProps } from './console-shell.types'
withDefaults(defineProps<LayoutProps>(), { navigationPosition: 'left', contentWidth: 'workspace' })
const id=useId(), railId=`dds-console-rail-${id}`,mainId=`dds-console-main-${id}`
const open=ref(false),hydrated=ref(false),toggle=ref<HTMLButtonElement>(),rail=ref<HTMLElement>()
function close(){open.value=false;toggle.value?.focus()}
defineExpose({ close })
function focusables(){return [toggle.value,...Array.from(rail.value?.querySelectorAll<HTMLElement>('a[href],button,summary,input,select,textarea,[tabindex="0"]')??[])].filter((el):el is HTMLElement=>!!el && !el.closest('[hidden]')&&el.getClientRects().length>0&&!el.hasAttribute('disabled'))}
async function toggleMenu(){if(open.value)close();else{open.value=true;await nextTick();focusables()[1]?.focus()}}
function key(event:KeyboardEvent){if(!open.value)return;if(event.key==='Escape'){event.preventDefault();close()}if(event.key==='Tab'){const items=focusables(),first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}}}
function navigate(event:MouseEvent){if(open.value&&event.target instanceof Element&&event.target.closest('a[href]'))close()}
onMounted(()=>{hydrated.value=true;document.addEventListener('keydown',key)})
onUnmounted(()=>document.removeEventListener('keydown',key))
</script>
<template>
<div class="dds-console-shell dds-layout" :data-navigation-position="navigationPosition" :data-surface="surface" :data-hydrated="hydrated?'true':undefined">
 <a class="dds-console-skip dds-visually-hidden" :href="`#${mainId}`">{{labels.skip}}</a>
 <button ref="toggle" class="dds-console-rail__toggle" type="button" data-action="toggle-rail" :aria-controls="railId" :aria-expanded="open" @click="toggleMenu"><span aria-hidden="true"></span><span class="dds-visually-hidden">{{open?labels.menuClose:labels.menuOpen}}</span></button>
 <div class="dds-console-rail__scrim" :data-open="String(open)" @click="close"></div>
 <aside ref="rail" :id="railId" class="dds-console-rail dds-layout__navigation" :data-open="String(open)" @click="navigate"><slot name="railStart"/><slot name="navigation" :close="close"/><slot name="railEnd"/></aside>
 <main :id="mainId" class="dds-console-main dds-layout__main" tabindex="-1"><div class="dds-layout__content" :data-width="contentWidth"><header v-if="$slots.header" class="dds-layout__header"><slot name="header"/></header><slot/><footer v-if="$slots.footer" class="dds-layout__footer"><slot name="footer"/></footer></div></main>
</div>
</template>
