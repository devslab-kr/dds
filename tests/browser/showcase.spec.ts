import { expect, test } from "@playwright/test";
import { fileURLToPath } from "node:url";

// The showcase pages are shipped as-is to devslab.kr/dds/ (the site vendors
// them), so a phone-width overflow here is a phone-width overflow there.
// Served from disk under a stand-in origin: icons.html imports icons.js as an
// ES module, which Chromium refuses over file://.
const origin = "http://dds.showcase.test";
const repo = new URL("../../", import.meta.url);
const pages = ["index", "components", "icons"] as const;
const widths = [320, 360, 375, 1440] as const;

test.beforeEach(async ({ page }) => {
  await page.route(`${origin}/**`, (route) => {
    const path = new URL(route.request().url()).pathname.slice(1);
    return route.fulfill({ path: fileURLToPath(new URL(path, repo)) });
  });
});

for (const name of pages) {
  for (const width of widths) {
    test(`preview/${name}.html fits ${width}px and keeps each nav command on one line`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(`${origin}/preview/${name}.html`);

      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth, "the page must not scroll sideways").toBeLessThanOrEqual(clientWidth);

      // A nowrap nav squeezes each link to its narrowest word, so "> ./dds
      // --components" stacks as "> ./dds --" / "components". Wrapping between
      // links keeps every command whole.
      const links = await page.locator("header.site nav a").evaluateAll((elements) => elements.map((element) => ({
        text: element.textContent,
        height: element.getBoundingClientRect().height,
        lineHeight: parseFloat(getComputedStyle(element).lineHeight),
      })));
      expect(links.length).toBeGreaterThan(0);
      for (const link of links) {
        expect(link.height, `"${link.text}" must render on a single line`).toBeLessThanOrEqual(link.lineHeight + 0.5);
      }
    });
  }
}
