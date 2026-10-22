import { mount,unmount,tick } from "svelte";
import { expect,it } from "vitest";
import { Layout } from "../src/lib";
it("opens and closes the mobile navigation with focus restoration",async()=>{
 const host=document.body.appendChild(document.createElement("div"));
 const instance=mount(Layout,{target:host,props:{labels:{skip:"Skip",menuOpen:"Open menu",menuClose:"Close menu"}}});await tick();
 const opener=host.querySelector<HTMLButtonElement>('button[data-action="toggle-rail"]')!;opener.click();await tick();expect(opener.getAttribute("aria-expanded")).toBe("true");
 document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true}));await tick();expect(opener.getAttribute("aria-expanded")).toBe("false");expect(document.activeElement).toBe(opener);
 await unmount(instance);host.remove();
});
