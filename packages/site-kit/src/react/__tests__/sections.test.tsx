import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";

import { FeatureRows, HeroSplit, OssProductMark, PricingNote, SectionBlock, SectionHead, StepFlow } from "../index";

afterEach(() => cleanup());

it("SectionBlock is a labelled section with the family shell and an optional band tone", () => {
  const host = render(<SectionBlock id="how" labelledBy="how-title"><h2 id="how-title">How</h2></SectionBlock>).container;
  const section = host.querySelector("section")!;
  expect(section.className).toBe("site-section");
  expect(section.id).toBe("how");
  expect(section.getAttribute("aria-labelledby")).toBe("how-title");
  expect(section.getAttribute("data-tone")).toBe("default");
  expect(section.querySelector(".site-section__shell h2")?.textContent).toBe("How");
  cleanup();
  const banded = render(<SectionBlock id="b" labelledBy="b-t" tone="band"><h2 id="b-t">B</h2></SectionBlock>).container;
  expect(banded.querySelector("section")?.getAttribute("data-tone")).toBe("band");
});

it("SectionHead renders a mono index the screen reader skips, a titled heading and an optional lede", () => {
  const host = render(<SectionHead index="01" title="How it answers" titleId="how-title" lede="Three steps." />).container;
  const index = host.querySelector(".site-section__index")!;
  expect(index.textContent).toBe("01");
  expect(index.getAttribute("aria-hidden")).toBe("true");
  expect(host.querySelector("h2#how-title")?.textContent).toBe("How it answers");
  expect(host.querySelector(".site-section__lede")?.textContent).toBe("Three steps.");
  cleanup();
  expect(render(<SectionHead index="02" title="T" titleId="t" />).container.querySelector(".site-section__lede")).toBeNull();
});

it("HeroSplit puts copy beside a labelled scene", () => {
  const host = render(<HeroSplit eyebrow="QR" title="Cards that answer" titleId="hero-title" lede="Scan it." actions={<a href="#start">Start</a>} aside={<div className="scene" />} asideLabel="A card on a phone" />).container;
  expect(host.querySelector("section.site-hero")?.getAttribute("aria-labelledby")).toBe("hero-title");
  expect(host.querySelector(".site-hero__eyebrow")?.textContent).toBe("QR");
  expect(host.querySelector("h1#hero-title")?.textContent).toBe("Cards that answer");
  expect(host.querySelector(".site-hero__actions a")?.textContent).toBe("Start");
  expect(host.querySelector("figure.site-hero__aside")?.getAttribute("aria-label")).toBe("A card on a phone");
});

it("StepFlow numbers steps with plain numerals, never the section's zero-padded mono", () => {
  const host = render(<StepFlow label="Steps" steps={[
    { title: "Register", body: "Add your materials." },
    { title: "Distribute", body: "Print the QR." },
    { title: "Confirm", body: "Read the answers." },
  ]} />).container;
  const list = host.querySelector("ol.site-steps")!;
  expect(list.getAttribute("aria-label")).toBe("Steps");
  expect([...list.querySelectorAll(".site-steps__marker")].map((m) => m.textContent)).toEqual(["1", "2", "3"]);
  for (const marker of list.querySelectorAll(".site-steps__marker")) expect(marker.getAttribute("aria-hidden")).toBe("true");
  expect(host.innerHTML).not.toMatch(/>0[1-3]</);
});

it("FeatureRows renders hairline rows with a badge only where given", () => {
  const host = render(<FeatureRows label="Who" rows={[
    { title: "Shops", body: "A QR on the table." },
    { title: "People who meet clients", body: "A card.", badge: "Sales · Professionals" },
  ]} />).container;
  const rows = [...host.querySelectorAll(".site-rows__row")];
  expect(rows).toHaveLength(2);
  expect(rows[0]!.querySelector(".dds-badge")).toBeNull();
  expect(rows[1]!.querySelector(".dds-badge.dds-badge--brand")?.textContent).toBe("Sales · Professionals");
  expect(host.querySelector("ul")?.getAttribute("aria-label")).toBe("Who");
});

it("PricingNote is one paragraph block and one action", () => {
  const host = render(<PricingNote action={<a href="/signup">Start</a>}><p>Free during the beta.</p></PricingNote>).container;
  expect(host.querySelector(".site-pricing__note p")?.textContent).toBe("Free during the beta.");
  expect(host.querySelector(".site-pricing__action a")?.textContent).toBe("Start");
});

it("OssProductMark is a sized image, decorative on request", () => {
  const host = render(<><OssProductMark name="numkey" src="/numkey.svg" /><OssProductMark name="kokey" src="/kokey.svg" size="lg" decorative /></>).container;
  const [named, decorative] = [...host.querySelectorAll("img")];
  expect(named!.alt).toBe("numkey");
  expect(named!.width).toBe(32);
  expect(decorative!.alt).toBe("");
  expect(decorative!.getAttribute("aria-hidden")).toBe("true");
  expect(decorative!.className).toBe("oss-product-mark oss-product-mark--lg");
});
