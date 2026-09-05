import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { render } from "solid-js/web";
import { afterEach, expect, it } from "vitest";

import * as kit from "../index";

let dispose: (() => void) | undefined;
afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.replaceChildren();
});

function mount(node: () => any) {
  const host = document.body.appendChild(document.createElement("div"));
  dispose = render(node, host);
  return host;
}

const SECTIONS_CSS = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "../../../site-sections.css"),
  "utf8",
);

it("SectionBlock is a labelled section with the family shell and an optional band tone", () => {
  const { SectionBlock } = kit;
  const host = mount(() => <SectionBlock id="how" labelledBy="how-title"><h2 id="how-title">How</h2></SectionBlock>);
  const section = host.querySelector("section.site-section")!;
  expect(section.id).toBe("how");
  expect(section.getAttribute("aria-labelledby")).toBe("how-title");
  expect(section.getAttribute("data-tone")).toBe("default");
  expect(section.querySelector(".site-section__shell h2")?.textContent).toBe("How");

  const banded = mount(() => <SectionBlock id="ask" labelledBy="ask-title" tone="band"><h2 id="ask-title">Ask</h2></SectionBlock>);
  expect(banded.querySelector("section")?.getAttribute("data-tone")).toBe("band");
});

it("SectionHead renders a mono index the screen reader skips, a titled heading and an optional lede", () => {
  const { SectionHead } = kit;
  const host = mount(() => <SectionHead index="01" title="How it answers" titleId="how-title" lede="Three steps." />);
  const index = host.querySelector(".site-section__index")!;
  expect(index.textContent).toBe("01");
  expect(index.getAttribute("aria-hidden")).toBe("true");
  expect(host.querySelector("h2#how-title")?.textContent).toBe("How it answers");
  expect(host.querySelector(".site-section__lede")?.textContent).toBe("Three steps.");

  const bare = mount(() => <SectionHead index="02" title="Ask" titleId="ask-title" />);
  expect(bare.querySelector(".site-section__lede")).toBeNull();
});

it("site-sections.css defines every class the primitives render and stays token-only", () => {
  expect(SECTIONS_CSS).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  expect(SECTIONS_CSS).not.toMatch(/prefers-color-scheme|\[data-theme/);
  for (const cls of ["site-section", "site-section__shell", "site-section__head", "site-section__index", "site-section__lede"]) {
    expect(SECTIONS_CSS, cls).toMatch(new RegExp(`\\.${cls.replace(/[$()*+.?[\\\]^{|}]/g, "\\$&")}\\b`));
  }
});

it("StepFlow numbers steps with ring numerals, never the section's zero-padded mono", () => {
  const { StepFlow } = kit;
  const host = mount(() => <StepFlow label="Steps" steps={[
    { title: "Register", body: "Upload." },
    { title: "Distribute", body: "Print the QR." },
    { title: "Confirm", body: "Only what needs a human." },
  ]} />);
  const list = host.querySelector("ol.site-steps")!;
  expect(list.getAttribute("aria-label")).toBe("Steps");
  const markers = [...list.querySelectorAll(".site-steps__marker")].map((m) => m.textContent);
  expect(markers).toEqual(["1", "2", "3"]);
  for (const marker of list.querySelectorAll(".site-steps__marker")) expect(marker.getAttribute("aria-hidden")).toBe("true");
  expect([...list.querySelectorAll("h3")].map((h) => h.textContent)).toEqual(["Register", "Distribute", "Confirm"]);
  expect(list.querySelectorAll(".site-steps__step p")[1]?.textContent).toBe("Print the QR.");
  expect(host.innerHTML).not.toMatch(/>0[1-3]</);
  for (const cls of ["site-steps", "site-steps__step", "site-steps__marker"]) expect(SECTIONS_CSS).toMatch(new RegExp(`\\.${cls}\\b`));
});
