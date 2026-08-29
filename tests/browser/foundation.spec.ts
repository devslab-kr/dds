import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

const tokens = await readFile(new URL("../../packages/dds-tokens/dist/tokens.css", import.meta.url), "utf8");
const css = await readFile(new URL("../../packages/dds-css/dist/dds.css", import.meta.url), "utf8");
const fixture = `<!doctype html><html lang="ar" dir="rtl" data-theme="light"><head><meta charset="utf-8"><title>DDS foundation accessibility fixture</title><style>${tokens}\n${css}</style></head><body>
<main style="inline-size:min(100%,320px)">
  <h1>DDS foundation accessibility fixture</h1>
  <button class="dds-btn dds-btn--primary" data-reflow>아주 긴 한국어 버튼 레이블도 잘리거나 한 줄에 억지로 고정되지 않습니다</button>
  <button class="dds-btn dds-btn--secondary" data-reflow lang="de">Deutsch: Diese ausführliche Schaltflächenbeschriftung muss vollständig lesbar umbrechen</button>
  <button class="dds-btn dds-btn--secondary" data-reflow lang="pt-BR">Português: esta descrição extensa do botão deve quebrar sem ocultar nenhuma palavra</button>
  <button class="dds-iconbtn dds-iconbtn--sm" aria-label="السابق"><svg class="dds-icon--directional" aria-hidden="true" width="24" height="24"><path d="M15 18l-6-6 6-6"/></svg></button>
  <label class="dds-field"><span class="dds-field__label">اللغة</span><span class="dds-select"><select class="dds-select__input"><option>العربية</option></select></span></label>
</main></body></html>`;

test.beforeEach(async ({ page }) => { await page.setContent(fixture); });

test("CJK, German, and Portuguese labels reflow at 200% without horizontal overflow", async ({ page }) => {
  await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  const metrics = await page.locator("[data-reflow]").evaluateAll((elements) => elements.map((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
    whiteSpace: getComputedStyle(element).whiteSpace,
  })));
  for (const metric of metrics) {
    expect(metric.scrollWidth).toBeLessThanOrEqual(metric.clientWidth);
    expect(metric.whiteSpace).toBe("normal");
  }
});

test("light and dark themes resolve distinct semantic surfaces", async ({ page }) => {
  const resolved = [];
  for (const theme of ["light", "dark"] as const) {
    resolved.push(await page.locator("html").evaluate((element, nextTheme) => {
      element.dataset.theme = nextTheme;
      const style = getComputedStyle(element);
      return { colorScheme: style.colorScheme, surface: style.getPropertyValue("--dds-color-bg-default").trim() };
    }, theme));
  }
  expect(resolved[0]?.colorScheme).toContain("light");
  expect(resolved[1]?.colorScheme).toContain("dark");
  expect(resolved[0]?.surface).not.toBe(resolved[1]?.surface);
});

test("Arabic RTL mirrors directional icons and keyboard focus remains visible", async ({ page }) => {
  await page.keyboard.press("Tab");
  const firstButton = page.locator(".dds-btn").first();
  await expect(firstButton).toBeFocused();
  expect(await firstButton.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe("solid");
  expect(await page.locator(".dds-icon--directional").evaluate((element) => getComputedStyle(element).transform)).not.toBe("none");
});

test("touch controls, forced colors, and axe meet the foundation contract", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  const media = await page.locator(".dds-iconbtn").evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      inline: Number.parseFloat(style.minInlineSize),
      block: Number.parseFloat(style.minBlockSize),
      forcedColorAdjust: style.forcedColorAdjust,
      transitionDuration: style.transitionDuration,
      animationDuration: style.animationDuration,
    };
  });
  expect(media.inline).toBeGreaterThanOrEqual(44);
  expect(media.block).toBeGreaterThanOrEqual(44);
  expect(media.forcedColorAdjust).toBe("auto");
  expect(Number.parseFloat(media.transitionDuration)).toBeLessThanOrEqual(0.00001);
  expect(Number.parseFloat(media.animationDuration)).toBeLessThanOrEqual(0.00001);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
