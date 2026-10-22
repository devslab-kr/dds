import { mount, unmount, tick } from "svelte";
import { getByRole, queryByRole } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { ConsoleShell } from "../src/lib";
import type { ConsoleShellProps } from "../src/lib";
const base: ConsoleShellProps = {
  surface: "demo", activePath: "/products", brand: { href: "/", name: "DevsLab", mark: "/mark.svg" },
  labels: { skip: "Skip", menuOpen: "Open menu", menuClose: "Close menu", nav: "Navigation", badge: "{count} items" },
  header: { title: "Console" }, nav: [
    { id: "services", label: "Services", collapsible: true, items: [{ id: "products", href: "/products", label: "Products" }] },
    { id: "settings", label: "Settings", collapsible: true, items: [{ id: "policies", href: "/policies", label: "Policies" }] },
  ],
};
let instances: ReturnType<typeof mount>[] = [];
afterEach(async () => { for (const instance of instances) await unmount(instance); instances=[]; document.body.innerHTML=""; });
async function show(props: ConsoleShellProps) { const target=document.createElement("div"); document.body.append(target); instances.push(mount(ConsoleShell,{target,props})); await tick(); return target; }
it("opens the active group and independently toggles via Enter and Space", async () => {
  const target=await show(base); const user=userEvent.setup();
  const services=getByRole(target,"button",{name:"Services"}); const settings=getByRole(target,"button",{name:"Settings"});
  expect(services.getAttribute("aria-expanded")).toBe("true"); expect(settings.getAttribute("aria-expanded")).toBe("false");
  expect(queryByRole(target,"link",{name:"Policies"})).toBeNull();
  settings.focus(); await user.keyboard("{Enter}"); expect(getByRole(target,"link",{name:"Policies"})).toBeTruthy();
  services.focus(); await user.keyboard(" "); expect(queryByRole(target,"link",{name:"Products"})).toBeNull(); expect(document.activeElement).toBe(services);
});
it("keeps legacy groups open and accepts an explicit closed default", async () => {
  const target=await show({...base,nav:[{label:"Legacy",items:base.nav[0].items}]});
  expect(getByRole(target,"link",{name:"Products"})).toBeTruthy(); expect(queryByRole(target,"button",{name:"Legacy"})).toBeNull();
  const closed=await show({...base,defaultExpandedGroups:[]}); expect(getByRole(closed,"button",{name:"Services"}).getAttribute("aria-expanded")).toBe("false");
});
it("reports controlled changes without changing parent state", async () => {
  const changed=vi.fn(); const target=await show({...base,expandedGroups:[],onExpandedGroupsChange:changed});
  await userEvent.click(getByRole(target,"button",{name:"Settings"})); expect(changed).toHaveBeenCalledWith(["settings"]);
  expect(getByRole(target,"button",{name:"Settings"}).getAttribute("aria-expanded")).toBe("false");
});
