import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

const tokens = await readFile(new URL("../../packages/dds-tokens/dist/tokens.css", import.meta.url), "utf8");
const css = await readFile(new URL("../../packages/dds-css/dist/dds.css", import.meta.url), "utf8");
const site = (await readFile(new URL("../../packages/site-kit/styles.css", import.meta.url), "utf8")).replace(/^@import[^;]+;\s*/, "");
const fixture = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>${tokens}\n${css}\n${site}</style></head><body>
<div class="site-shell"><header class="site-header"><div class="site-header__inner">
<a class="site-brand" href="/ar">لينك</a>
<button type="button" class="dds-btn dds-btn--ghost site-menu-button" aria-expanded="false" aria-controls="site-navigation">فتح القائمة</button>
<nav id="site-navigation" class="site-nav" data-open="false" aria-label="التنقل الرئيسي"><ul class="site-nav__list"><li><a href="/docs">الوثائق</a></li></ul></nav>
<div class="site-header__controls" data-open="false"><label><span class="dds-sr-only">اللغة</span><select class="dds-select__input" aria-label="اللغة"><option>العربية</option></select></label><a class="dds-btn dds-btn--primary" href="/access">طلب الوصول</a></div>
</div></header><main id="main-content" class="site-main"><h1>واجهة عربية طويلة لا ينبغي أن تتجاوز عرض الشاشة</h1></main></div>
<script>document.querySelector('.site-menu-button').addEventListener('click', (event) => { const button=event.currentTarget; const open=button.getAttribute('aria-expanded')!=='true'; button.setAttribute('aria-expanded', String(open)); document.querySelector('#site-navigation').dataset.open=String(open); document.querySelector('.site-header__controls').dataset.open=String(open); });</script>
</body></html>`;

function channel(value: number) {
  const normalized = value / 255;
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function contrast(foreground: string, background: string) {
  const parse = (color: string) => color.match(/[\d.]+/g)!.slice(0, 3).map(Number);
  const luminance = (color: string) => {
    const [red, green, blue] = parse(color);
    return 0.2126 * channel(red!) + 0.7152 * channel(green!) + 0.0722 * channel(blue!);
  };
  const light = Math.max(luminance(foreground), luminance(background));
  const dark = Math.min(luminance(foreground), luminance(background));
  return (light + 0.05) / (dark + 0.05);
}

test("header primary action keeps readable button colors in light and dark themes", async ({ page }) => {
  await page.setContent(fixture);
  const action = page.locator('.site-header__controls .dds-btn--primary');
  for (const theme of ["light", "dark"] as const) {
    await page.locator("html").evaluate((element, value) => { element.dataset.theme = value; }, theme);
    const colors = await action.evaluate((element) => {
      const style = getComputedStyle(element);
      return { foreground: style.color, background: style.backgroundColor };
    });
    expect(contrast(colors.foreground, colors.background), `${theme} theme`).toBeGreaterThanOrEqual(4.5);
  }
});

test("desktop navigation remains centered when localized controls change width", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.setContent(fixture);
  const center = () => page.locator(".site-nav").evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return rect.left + rect.width / 2;
  });
  const initial = await center();
  await page.locator(".site-header__controls .dds-btn--primary").evaluate((element) => {
    element.textContent = "Demander l’accès à la plateforme";
  });
  expect(Math.abs((await center()) - initial)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(initial - 720)).toBeLessThanOrEqual(0.5);
});

for (const width of [1280, 375]) {
  test(`Arabic RTL navigation remains usable without overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 });
    await page.setContent(fixture);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    const overflow = await page.evaluate(() => {
      const viewport = document.documentElement.clientWidth;
      return {
        amount: document.documentElement.scrollWidth - viewport,
        offenders: [...document.querySelectorAll("*")].flatMap((element) => {
          const rect = element.getBoundingClientRect();
          return rect.left < -0.5 || rect.right > viewport + 0.5
            ? [{ element: element.tagName.toLowerCase(), className: element.className, left: rect.left, right: rect.right }]
            : [];
        }),
      };
    });
    expect(overflow.amount, JSON.stringify(overflow.offenders)).toBeLessThanOrEqual(0);
    if (width === 375) {
      const menu = page.getByRole("button", { name: "فتح القائمة" });
      await menu.focus();
      await expect(menu).toBeFocused();
      await menu.click();
      await expect(menu).toHaveAttribute("aria-expanded", "true");
      await page.keyboard.press("Tab");
      await expect(page.locator('a[href="/docs"]')).toBeFocused();
    } else {
      await page.locator(".site-brand").focus();
      await page.keyboard.press("Tab");
      await expect(page.locator('a[href="/docs"]')).toBeFocused();
    }
  });
}
