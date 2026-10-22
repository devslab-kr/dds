import { afterEach, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import Layout from "../Layout.vue";
import TopNav from "../TopNav.vue";
const labels={skip:"Skip",menuOpen:"Open menu",menuClose:"Close menu",nav:"Navigation",badge:"{count} items"};
let cleanup:(()=>void)|undefined;afterEach(()=>{cleanup?.();document.body.innerHTML=""});
it("composes navigation and restores focus on Escape",async()=>{
 const w=mount(Layout,{props:{labels},slots:{navigation:()=>h("a",{href:"#body"},"Products"),default:()=>h("p","Body")},attachTo:document.body});cleanup=()=>w.unmount();
 const opener=w.get('button[data-action="toggle-rail"]');await opener.trigger("click");expect(opener.attributes("aria-expanded")).toBe("true");
 document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true}));await w.vm.$nextTick();expect(opener.attributes("aria-expanded")).toBe("false");expect(document.activeElement).toBe(opener.element);
});
it("closes top navigation disclosure on Escape",async()=>{
 const w=mount(TopNav,{props:{surface:"demo",activePath:"/products",labels,nav:[{label:"Services",items:[{id:"p",href:"/products",label:"Products"}]}]},attachTo:document.body});cleanup=()=>w.unmount();
 (w.get("details").element as HTMLDetailsElement).open=true;await w.get("summary").trigger("keydown",{key:"Escape"});expect((w.get("details").element as HTMLDetailsElement).open).toBe(false);expect(document.activeElement).toBe(w.get("summary").element);
});
