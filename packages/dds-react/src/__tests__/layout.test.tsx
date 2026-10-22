import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { Layout } from "../layout";
import { TopNav } from "../top-nav";
const labels={skip:"Skip",menuOpen:"Open menu",menuClose:"Close menu",nav:"Navigation",badge:"{count} items"};
it("composes navigation and returns focus on Escape",async()=>{
 render(<Layout labels={labels} navigation={<a href="#content">Products</a>} header={<h1>Title</h1>}><p>Body</p></Layout>);
 const opener=screen.getByRole("button",{name:"Open menu"}); await userEvent.click(opener);
 expect(opener).toHaveAttribute("aria-expanded","true");
 fireEvent.keyDown(document,{key:"Escape"}); expect(opener).toHaveAttribute("aria-expanded","false"); expect(opener).toHaveFocus();
});
it("closes navigation on link activation without preventing routing",async()=>{
 render(<Layout labels={labels} navigation={<a href="#content">Products</a>}>Body</Layout>);
 await userEvent.click(screen.getByRole("button",{name:"Open menu"}));
 const event=new MouseEvent("click",{bubbles:true,cancelable:true}); fireEvent(screen.getByRole("link",{name:"Products"}),event);
 expect(event.defaultPrevented).toBe(false); expect(screen.getByRole("button",{name:"Open menu"})).toHaveAttribute("aria-expanded","false");
});
it("opens a top navigation disclosure and closes it with Escape",async()=>{
 render(<TopNav surface="demo" activePath="/products" labels={labels} nav={[{id:"services",label:"Services",items:[{id:"products",href:"/products",label:"Products"}]}]} />);
 const summary=screen.getByText("Services"); await userEvent.click(summary);
 expect(summary.closest("details")).toHaveAttribute("open");
 expect(screen.getByRole("link",{name:"Products"})).toHaveAttribute("aria-current","page");
 fireEvent.keyDown(summary,{key:"Escape"}); expect(summary.closest("details")).not.toHaveAttribute("open"); expect(summary).toHaveFocus();
});
