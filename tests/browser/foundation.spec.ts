import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

const tokens = await readFile(new URL("../../packages/dds-tokens/dist/tokens.css", import.meta.url), "utf8");
const css = await readFile(new URL("../../packages/dds-css/dist/dds.css", import.meta.url), "utf8");
const fixture = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>${tokens}\n${css}</style></head><body>
<main style="inline-size:min(100%,320px)">
  <button class="dds-btn dds-btn--primary">아주 긴 한국어 버튼 레이블도 잘리거나 한 줄에 억지로 고정되지 않습니다</button>
  <button class="dds-iconbtn dds-iconbtn--sm" aria-label="السابق"><svg class="dds-icon--directional" aria-hidden="true" width="24" height="24"><path d="M15 18l-6-6 6-6"/></svg></button>
  <label class="dds-field"><span class="dds-field__label">اللغة</span><span class="dds-select"><select class="dds-select__input"><option>العربية</option></select></span></label>
</main></body></html>`;

test.beforeEach(async ({ page }) => { await page.setContent(fixture); });

test("CJK labels reflow at 200% without horizontal overflow", async ({ page }) => {
  await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  const metrics = await page.locator(".dds-btn").evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
    whiteSpace: getComputedStyle(element).whiteSpace,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
  expect(metrics.whiteSpace).toBe("normal");
});

test("Arabic RTL mirrors directional icons and keyboard focus remains visible", async ({ page }) => {
  await page.keyboard.press("Tab");
  await expect(page.locator(".dds-btn")).toBeFocused();
  expect(await page.locator(".dds-btn").evaluate((element) => getComputedStyle(element).outlineStyle)).toBe("solid");
  expect(await page.locator(".dds-icon--directional").evaluate((element) => getComputedStyle(element).transform)).not.toBe("none");
});

test("touch controls, forced colors, and axe meet the foundation contract", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  const size = await page.locator(".dds-iconbtn").evaluate((element) => {
    const style = getComputedStyle(element);
    return { inline: Number.parseFloat(style.minInlineSize), block: Number.parseFloat(style.minBlockSize) };
  });
  expect(size.inline).toBeGreaterThanOrEqual(44);
  expect(size.block).toBeGreaterThanOrEqual(44);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
