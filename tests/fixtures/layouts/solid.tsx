import { render } from "solid-js/web";
import {
  Layout,
  LeftNav,
  TopNav,
} from "../../../packages/dds-solid/dist/index.js";
const nav = [
  {
    id: "services",
    label: "Services",
    collapsible: true,
    items: [{ id: "products", href: "#products", label: "Products" }],
  },
  {
    id: "settings",
    label: "Settings",
    collapsible: true,
    items: [{ id: "policies", href: "#policies", label: "Policies" }],
  },
];
const labels = {
  skip: "Skip to content",
  menuOpen: "Open menu",
  menuClose: "Close menu",
  nav: "Navigation",
  badge: "{count} items",
};
export function start(target: HTMLElement, navigationPosition: "left" | "top") {
  const Nav = navigationPosition === "left" ? LeftNav : TopNav;
  render(
    () => (
      <Layout
        navigationPosition={navigationPosition}
        labels={labels}
        railStart={
          <a class="dds-console-rail__brand" href="#brand">
            <strong>DevsLab</strong>
          </a>
        }
        navigation={
          <Nav
            surface="fixture"
            activePath="#products"
            nav={nav}
            labels={labels}
          />
        }
        header={<h1>Page title</h1>}
      >
        <p>Body text</p>
        <section class="dds-layout__section dds-layout__panel">
          <h2>Section title</h2>
          <div class="dds-layout__fields">
            <label class="dds-field-label">
              Name
              <input
                class="dds-input"
                aria-label="Name"
                value="Example"
                readonly
              />
            </label>
            <span class="dds-chip">진행 대기</span>
          </div>
        </section>
        <p class="dds-layout__caption">Supporting description</p>
      </Layout>
    ),
    target,
  );
}
