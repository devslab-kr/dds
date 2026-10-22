import { useState } from "react";
import { ConsoleShell, Icon } from "@devslab/dds-react";
export function ConsoleDemo() {
  const [expanded, setExpanded] = useState<string[]>(["services"]);
  return <ConsoleShell surface="demo" activePath="/console"
    brand={{ href: "/", name: "DevsLab", mark: "/mark.svg" }}
    labels={{ skip: "Skip to content", menuOpen: "Open menu", menuClose: "Close menu", nav: "Console navigation", badge: "{count} items" }}
    header={{ title: "Console demo" }} expandedGroups={expanded} onExpandedGroupsChange={setExpanded}
    nav={[
      { id: "services", label: "Services", collapsible: true, items: [{ id: "products", href: "/console", label: "Products", icon: <Icon name="check" /> }] },
      { id: "settings", label: "Settings", collapsible: true, items: [{ id: "policies", href: "#policies", label: "Policies" }] },
    ]}>
    <p>Console navigation fixture</p>
  </ConsoleShell>;
}
