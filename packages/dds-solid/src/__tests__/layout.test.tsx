import { render } from "solid-js/web";
import { afterEach, expect, it } from "vitest";
import { Layout } from "../layout";
import { TopNav } from "../top-nav";
const labels={skip:"Skip",menuOpen:"Open menu",menuClose:"Close menu",nav:"Navigation",badge:"{count} items"};
let dispose: (()=>void)|undefined;
afterEach(()=>{dispose?.();document.body.innerHTML=""});
it("composes navigation and restores the menu opener on Escape",()=>{
 const host=document.body.appendChild(document.createElement("div"));
 dispose=render(()=><Layout labels={labels} navigation={<a href="#body">Products</a>}><h1>Body</h1></Layout>,host);
 const opener=host.querySelector<HTMLButtonElement>('button[data-action="toggle-rail"]')!;opener.click();expect(opener.getAttribute("aria-expanded")).toBe("true");
 document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true}));expect(opener.getAttribute("aria-expanded")).toBe("false");expect(document.activeElement).toBe(opener);
});
it("closes top navigation disclosure on Escape",()=>{
 const host=document.body.appendChild(document.createElement("div"));
 dispose=render(()=><TopNav surface="demo" activePath="/products" labels={labels} nav={[{label:"Services",items:[{id:"p",label:"Products",href:"/products"}]}]}/>,host);
 const summary=host.querySelector("summary")!;const details=summary.closest("details")!;details.open=true;
 summary.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true}));expect(details.open).toBe(false);expect(document.activeElement).toBe(summary);
});
