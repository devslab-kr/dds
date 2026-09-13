import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

// The table's console rules are geometry, and geometry is a cascade result:
// .dds-table__actions .dds-btn out-specifies button.css's coarse-pointer
// floor, a dense --sm button's own padding out-measures min-block-size, and
// a collapsed table can keep a sticky header from sticking. None of that is
// visible in the selector text, so it is pinned here against the built
// bundle in a real browser, once per pointer type.
const tokens = await readFile(new URL("../../packages/dds-tokens/dist/tokens.css", import.meta.url), "utf8");
const css = await readFile(new URL("../../packages/dds-css/dist/dds.css", import.meta.url), "utf8");

const actions = `<td><div class="dds-table__actions"><button type="button" class="dds-btn dds-btn--secondary">Revoke key</button><button type="button" class="dds-btn dds-btn--ghost dds-btn--sm">Rotate</button></div></td>`;
const copy = `<button type="button" class="dds-btn dds-btn--ghost dds-btn--sm" aria-label="Copy key_8f2a91c4">Copy</button>`;
const tallRows = Array.from({ length: 30 }, (_, index) => `<tr><th scope="row">job_${index}</th><td data-numeric>${index}</td></tr>`).join("");

// Each geometry table has a buttonless twin with the same text. A row's
// height is a cascade of line height, cell padding and collapsed borders
// (the first row takes half a border), so "40px" is only a floor — the
// contract is that buttons add nothing to the height their row already has.
const apiKeys = (name: string, withButtons: boolean) => `<div class="dds-table-wrap" data-fixture="${name}"><table class="dds-table">
    <caption class="dds-visually-hidden">API keys</caption>
    <thead><tr><th scope="col">Name</th><th scope="col">Key</th><th scope="col"><span class="dds-visually-hidden">Actions</span></th></tr></thead>
    <tbody>
      <tr><th scope="row">Production</th><td><code>key_8f2a91c4</code></td>${withButtons ? actions : "<td></td>"}</tr>
      <tr><th scope="row">Staging</th><td><code>key_03bb77d1</code> ${withButtons ? copy : ""}</td><td></td></tr>
      <tr><th scope="row">Ci runner with a much longer name</th><td><code>key_c9e0a4f2</code></td>${withButtons ? actions : "<td></td>"}</tr>
    </tbody>
  </table></div>`;
const audit = (name: string, withButtons: boolean) => `<div class="dds-table-wrap" data-fixture="${name}"><table class="dds-table dds-table--dense">
    <caption class="dds-visually-hidden">Audit</caption>
    <thead><tr><th scope="col">Actor</th><th scope="col">Key</th><th scope="col"><span class="dds-visually-hidden">Actions</span></th></tr></thead>
    <tbody>
      <tr><th scope="row">owner@example.com</th><td><code>key_8f2a91c4</code> ${withButtons ? copy : ""}</td>${withButtons ? actions : "<td></td>"}</tr>
      <tr><th scope="row">member@example.com</th><td><code>key_03bb77d1</code></td><td></td></tr>
      <tr><th scope="row">viewer@example.com</th><td><code>key_c9e0a4f2</code> ${withButtons ? copy : ""}</td>${withButtons ? actions : "<td></td>"}</tr>
    </tbody>
  </table></div>`;

const fixture = `<!doctype html><html lang="en" data-theme="light"><head><meta charset="utf-8"><title>DDS table fixture</title><style>${tokens}\n${css}</style></head><body>
<main>
  ${apiKeys("comfortable", true)}
  ${apiKeys("comfortable-plain", false)}
  ${audit("dense", true)}
  ${audit("dense-plain", false)}
  <div class="dds-table-wrap dds-table-wrap--tall" data-fixture="tall" style="max-block-size: 12rem"><table class="dds-table">
    <caption class="dds-visually-hidden">Jobs</caption>
    <thead><tr><th scope="col">Job</th><th scope="col" data-numeric>Attempts</th></tr></thead>
    <tbody>${tallRows}</tbody>
  </table></div>
</main></body></html>`;

const rowHeights = (page: Page, fixtureName: string) =>
  page.locator(`[data-fixture="${fixtureName}"] tbody tr`).evaluateAll((rows) => rows.map((row) => row.getBoundingClientRect().height));

const buttonHeights = (page: Page, selector: string) =>
  page.locator(selector).evaluateAll((buttons) => buttons.map((button) => ({
    height: button.getBoundingClientRect().height,
    lines: Math.round(button.getBoundingClientRect().height / Number.parseFloat(getComputedStyle(button).lineHeight)),
    whiteSpace: getComputedStyle(button).whiteSpace,
  })));

test.describe("fine pointer", () => {
  test.use({ viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1 });

  test.beforeEach(async ({ page }) => {
    await page.setContent(fixture);
    expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(false);
  });

  test("row actions are 32px, one line, and add no height to their row", async ({ page }) => {
    expect(await rowHeights(page, "comfortable")).toEqual(await rowHeights(page, "comfortable-plain"));
    const rows = await rowHeights(page, "comfortable-plain");
    expect(Math.max(...rows) - Math.min(...rows)).toBeLessThanOrEqual(1); // the collapsed half border, no more
    expect(Math.min(...rows)).toBeGreaterThanOrEqual(40);
    for (const button of await buttonHeights(page, '[data-fixture="comfortable"] .dds-table__actions .dds-btn')) {
      expect(button.height).toBe(32);
      expect(button.whiteSpace).toBe("nowrap");
    }
  });

  test("a dense table holds its small buttons and row actions to 24px", async ({ page }) => {
    expect(await rowHeights(page, "dense")).toEqual(await rowHeights(page, "dense-plain"));
    expect(Math.min(...await rowHeights(page, "dense-plain"))).toBeGreaterThanOrEqual(36);
    for (const button of await buttonHeights(page, '[data-fixture="dense"] .dds-btn--sm, [data-fixture="dense"] .dds-table__actions .dds-btn')) {
      expect(button.height).toBe(24);
    }
  });

  test("code cells take the mono family at 13px", async ({ page }) => {
    const code = await page.locator('[data-fixture="comfortable"] code').first().evaluate((element) => {
      const style = getComputedStyle(element);
      return { family: style.fontFamily, size: style.fontSize };
    });
    expect(code.family).toContain("Geist Mono");
    expect(code.size).toBe("13px");
  });

  test("the tall wrap's header stays pinned while its body scrolls", async ({ page }) => {
    const wrap = page.locator('[data-fixture="tall"]');
    expect(await wrap.locator("table").evaluate((table) => getComputedStyle(table).borderCollapse)).toBe("separate");
    await wrap.evaluate((element) => { element.scrollTop = 240; });
    const { wrapTop, headerTop, borderTop } = await wrap.evaluate((element) => ({
      wrapTop: element.getBoundingClientRect().top,
      headerTop: element.querySelector("thead th")!.getBoundingClientRect().top,
      borderTop: Number.parseFloat(getComputedStyle(element).borderTopWidth),
    }));
    expect(headerTop).toBe(wrapTop + borderTop);
  });
});

test.describe("coarse pointer", () => {
  test.beforeEach(async ({ page }) => {
    await page.setContent(fixture);
    expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(true);
  });

  test("table buttons keep the 44px touch floor", async ({ page }) => {
    for (const button of await buttonHeights(page, ".dds-table__actions .dds-btn, .dds-table--dense .dds-btn--sm")) {
      expect(button.height).toBeGreaterThanOrEqual(44);
    }
  });
});
