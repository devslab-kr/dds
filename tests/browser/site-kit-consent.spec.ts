import { expect, test, type BrowserContext, type Page, type Request } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { parseConsentRecord } from "../../packages/site-kit/src/core/consent.mjs";

/*
 * D-034 in a real browser: the built ConsentBanner + SiteFooter, the real
 * manager, a nonce CSP, cookies on a real origin. https://site.test is served
 * by page.route; every Google URL is answered by a stub the test counts; any
 * other request is aborted — nothing leaves the machine.
 */

const root = fileURLToPath(new URL("../..", import.meta.url));
const tokens = await readFile(join(root, "packages/dds-tokens/dist/tokens.css"), "utf8");
const css = await readFile(join(root, "packages/dds-css/dist/dds.css"), "utf8");
const siteBase = (await readFile(join(root, "packages/site-kit/styles.css"), "utf8")).replace(/@import[^;]+;\s*/g, "");
const siteSections = await readFile(join(root, "packages/site-kit/site-sections.css"), "utf8");
const ORIGIN = "https://site.test";
const NONCE = "n0nce-r4nd0m";
const VERSION = "2026-10-05";
const ID = "0123456789abcdef0123456789abcdef";
const GOOGLE = /googletagmanager\.com|google-analytics\.com|doubleclick\.net|google\.com/;
const SHOTS = process.env.CONSENT_SCREENSHOTS;

// What a family product puts on its own root (D-030: Korean breaks between
// words, set by the page, not by dds.css), so the screenshots read like one.
const PRODUCT_ROOT = `body { margin: 0; } :where([lang|="ko"]) { word-break: keep-all; overflow-wrap: break-word; }`;

let app = "";
test.beforeAll(async () => {
  const { buildConsentFixture } = await import(pathToFileURL(join(root, "packages/site-kit/scripts/build-consent-fixture.mjs")).href);
  app = await buildConsentFixture();
});

const html = (lang: string, theme: string) => `<!doctype html><html lang="${lang}" data-theme="${theme}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Consent</title>
<style>${tokens}\n${css}\n${siteBase}\n${siteSections}\n${PRODUCT_ROOT}</style></head><body><script type="module" src="/app.js" nonce="${NONCE}"></script></body></html>`;

interface Harness { google: Request[]; records: Array<{ body: unknown; origin: string | undefined }> }

async function open(page: Page, { lang = "ko", theme = "light" } = {}): Promise<Harness> {
  const harness: Harness = { google: [], records: [] };
  await page.route(/.*/, (route) => route.abort());
  await page.route(GOOGLE, (route) => {
    harness.google.push(route.request());
    return route.fulfill({ status: 200, contentType: "text/javascript", body: "window.__gtmRuns = (window.__gtmRuns || 0) + 1;" });
  });
  await page.route(`${ORIGIN}/**`, async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/app.js") return route.fulfill({ status: 200, contentType: "text/javascript", body: app });
    if (url.pathname === "/api/consent") {
      harness.records.push({ body: route.request().postDataJSON(), origin: route.request().headers().origin });
      return route.fulfill({ status: 204 });
    }
    return route.fulfill({
      status: 200,
      contentType: "text/html; charset=utf-8",
      // Only the nonce lets a script run: gtm.js loads only if the banner hands it the page's nonce.
      headers: { "content-security-policy": `script-src 'nonce-${NONCE}'; object-src 'none'; base-uri 'none'` },
      body: html(lang, theme),
    });
  });
  await page.goto(`${ORIGIN}/ko/pricing?utm_source=x`);
  return harness;
}

const bar = (page: Page) => page.locator(".site-consent");
const dialog = (page: Page) => page.locator('[role="dialog"]');
const consentCookie = async (context: BrowserContext) => (await context.cookies(ORIGIN)).find((cookie) => cookie.name === "site_consent");
const nowSeconds = () => Math.floor(Date.now() / 1000);
const grantCookie = (overrides: Partial<{ v: string; a: number }> = {}) => ({
  name: "site_consent", value: `v=${overrides.v ?? VERSION}&a=${overrides.a ?? 1}&t=${nowSeconds()}&id=${ID}`,
  domain: "site.test", path: "/", secure: true, sameSite: "Lax" as const,
});

function channel(value: number) {
  const normalized = value / 255;
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}
function contrast(foreground: string, background: string) {
  const parse = (color: string) => color.match(/[\d.]+/g)!.slice(0, 3).map(Number);
  const luminance = (color: string) => { const [r, g, b] = parse(color); return 0.2126 * channel(r!) + 0.7152 * channel(g!) + 0.0722 * channel(b!); };
  const light = Math.max(luminance(foreground), luminance(background));
  const dark = Math.min(luminance(foreground), luminance(background));
  return (light + 0.05) / (dark + 0.05);
}

/** The three choices: same box, same paint. */
async function expectEqualWeight(page: Page, selector: string) {
  const buttons = await page.locator(selector).evaluateAll((elements) => elements.map((element) => {
    const style = getComputedStyle(element);
    const box = element.getBoundingClientRect();
    return {
      width: box.width, height: box.height,
      paint: [style.backgroundColor, style.color, style.borderTopColor, style.borderTopWidth, style.fontSize, style.fontWeight, style.fontFamily].join("|"),
      clipped: element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1,
    };
  }));
  expect(buttons).toHaveLength(3);
  for (const button of buttons) {
    expect(Math.abs(button.width - buttons[0]!.width), "equal width").toBeLessThan(0.5);
    expect(Math.abs(button.height - buttons[0]!.height), "equal height").toBeLessThan(0.5);
    expect(button.paint, "same tone").toBe(buttons[0]!.paint);
    expect(button.clipped, "label not clipped").toBe(false);
  }
  return buttons;
}

async function expectNoOverflow(page: Page, selector: string) {
  const layout = await page.evaluate((target) => {
    const element = document.querySelector(target)!;
    const box = element.getBoundingClientRect();
    // .dds-sr-only clips on purpose; everything a sighted reader sees must fit its box.
    const clipped = [...element.querySelectorAll("h2, h3, p, a, button, span")].filter((child) => !child.closest(".dds-sr-only")).filter((child) => {
      const style = getComputedStyle(child);
      return style.overflow !== "visible" && (child.scrollWidth > child.clientWidth + 1);
    }).length;
    return { pageOverflow: document.documentElement.scrollWidth - window.innerWidth, left: box.left, right: box.right, bottom: box.bottom, width: window.innerWidth, height: window.innerHeight, clipped };
  }, selector);
  expect(layout.pageOverflow, "no horizontal page scroll").toBeLessThanOrEqual(0);
  expect(layout.left).toBeGreaterThanOrEqual(0);
  expect(layout.right).toBeLessThanOrEqual(layout.width + 0.5);
  expect(layout.bottom).toBeLessThanOrEqual(layout.height + 0.5);
  expect(layout.clipped).toBe(0);
}

async function expectReadable(page: Page, scope: string, background: string) {
  const pairs = await page.evaluate(({ scope, background }) => {
    const surface = getComputedStyle(document.querySelector(background)!).backgroundColor;
    return [...document.querySelectorAll(`${scope} :is(h2, h3, p, a, button, .dds-badge)`)]
      .filter((element) => element.textContent?.trim() && !element.closest(".dds-sr-only"))
      .map((element) => {
        const style = getComputedStyle(element);
        const own = style.backgroundColor;
        return { text: element.textContent!.trim().slice(0, 24), color: style.color, background: own === "rgba(0, 0, 0, 0)" ? surface : own };
      });
  }, { scope, background });
  expect(pairs.length).toBeGreaterThan(3);
  for (const pair of pairs) expect(contrast(pair.color, pair.background), pair.text).toBeGreaterThanOrEqual(4.5);
}

test("first visit: the bar asks, and nothing reaches Google — not even an event the page pushes", async ({ page, context }) => {
  const harness = await open(page);
  await expect(bar(page)).toBeVisible();
  await expect(bar(page).locator(".site-consent__actions button")).toHaveText(["모두 허용", "거부", "설정"]);
  const kept = await page.evaluate(() => {
    const layer = (window as unknown as { dataLayer: unknown[] }).dataLayer;
    layer.push({ event: "contact_cta" });
    return layer.filter((item) => Object.prototype.toString.call(item) !== "[object Arguments]").length;
  });
  expect(kept).toBe(0);
  await page.waitForTimeout(300);
  expect(harness.google).toHaveLength(0);
  expect(await consentCookie(context)).toBeUndefined();
});

for (const width of [390, 1280]) {
  for (const theme of ["light", "dark"]) {
    test(`the bar and the settings fit at ${width}px in ${theme}, with three equal, readable choices`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await open(page, { theme });
      await expect(bar(page)).toBeVisible();
      await expectEqualWeight(page, ".site-consent__actions button");
      await expectNoOverflow(page, ".site-consent");
      await expectReadable(page, ".site-consent", ".site-consent");
      if (SHOTS) await page.screenshot({ path: join(SHOTS, `bar-${width}-${theme}.png`) });
      await bar(page).getByRole("button", { name: "설정" }).click();
      await expect(dialog(page)).toBeVisible();
      await expectEqualWeight(page, ".site-consent-dialog .dds-dialog__actions button");
      await expectNoOverflow(page, ".site-consent-dialog");
      await expectReadable(page, ".site-consent-dialog", ".site-consent-dialog");
      // The two category rows share one grid: their right-hand controls end on one line.
      const ends = await page.locator(".site-consent-category__status, .site-consent-category__switch").evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().right));
      expect(Math.abs(ends[0]! - ends[1]!)).toBeLessThan(1);
      if (SHOTS) await page.screenshot({ path: join(SHOTS, `settings-${width}-${theme}.png`) });
    });
  }
}

test("accepting loads Tag Manager once, with the page's nonce, records the grant same-origin, and the next page loads it once", async ({ page, context }) => {
  const harness = await open(page);
  await bar(page).getByRole("button", { name: "모두 허용" }).click();
  await expect(bar(page)).toHaveCount(0);
  await expect.poll(() => harness.records.length).toBe(1);
  expect(harness.google.map((request) => request.url())).toEqual(["https://www.googletagmanager.com/gtm.js?id=GTM-AB12CD3"]);
  expect(await page.evaluate(() => (window as unknown as { __gtmRuns?: number }).__gtmRuns), "the CSP let gtm.js run: it carried the nonce").toBe(1);
  const [{ body, origin }] = harness.records as [{ body: Record<string, unknown>; origin: string }];
  expect(origin).toBe(ORIGIN);
  expect(body).toMatchObject({ policyVersion: VERSION, analytics: true, action: "grant", source: "web", path: "/ko/pricing" });
  expect(parseConsentRecord(body, { policyVersion: VERSION }), "the server-side validator accepts what the browser sends").not.toBeNull();
  const cookie = await consentCookie(context);
  expect(cookie?.value).toMatch(new RegExp(`^v=${VERSION}&a=1&t=\\d+&id=[0-9a-f]{32}$`));
  expect(cookie?.secure).toBe(true);
  expect(cookie?.sameSite).toBe("Lax");
  expect(cookie?.httpOnly).toBe(false);
  expect(cookie!.expires - nowSeconds()).toBeGreaterThan(364 * 86400);
  await expect(page.getByRole("status")).toHaveText("쿠키 설정을 저장했습니다.");

  harness.google.length = 0;
  await page.reload();
  await page.waitForFunction(() => (window as unknown as { __gtmRuns?: number }).__gtmRuns === 1);
  expect(harness.google).toHaveLength(1);
  await expect(bar(page)).toHaveCount(0);
});

test("rejecting records a deny and Google is never contacted", async ({ page, context }) => {
  const harness = await open(page, { lang: "en" });
  await bar(page).getByRole("button", { name: "Reject" }).click();
  await expect.poll(() => harness.records.length).toBe(1);
  expect(harness.records[0]!.body).toMatchObject({ action: "deny", analytics: false });
  expect((await consentCookie(context))?.value).toContain("&a=0&");
  await page.reload();
  await expect(bar(page)).toHaveCount(0);
  await page.waitForTimeout(300);
  expect(harness.google).toHaveLength(0);
});

test("the settings dialog traps focus, and Escape closes it without saving", async ({ page, context }) => {
  const harness = await open(page);
  const settings = bar(page).getByRole("button", { name: "설정" });
  await settings.focus();
  await page.keyboard.press("Enter");
  await expect(dialog(page)).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.querySelector('[role="dialog"]')!.contains(document.activeElement))).toBe(true);
  for (const key of [...Array(10).fill("Tab"), ...Array(10).fill("Shift+Tab")]) {
    await page.keyboard.press(key);
    expect(await page.evaluate(() => document.querySelector('[role="dialog"]')!.contains(document.activeElement)), `${key} stays inside`).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toHaveCount(0);
  await expect(settings).toBeFocused();
  await expect(bar(page)).toBeVisible();
  expect(harness.records).toHaveLength(0);
  expect(await consentCookie(context)).toBeUndefined();
});

test("Escape on the bar closes it without a decision, and the next visit asks again", async ({ page, context }) => {
  const harness = await open(page);
  await bar(page).getByRole("button", { name: "모두 허용" }).focus();
  await page.keyboard.press("Escape");
  await expect(bar(page)).toHaveCount(0);
  expect(await consentCookie(context)).toBeUndefined();
  await page.reload();
  await expect(bar(page)).toBeVisible();
  expect(harness.google).toHaveLength(0);
  expect(harness.records).toHaveLength(0);
});

test("a decision under an older policy version asks again and loads nothing", async ({ page, context }) => {
  await context.addCookies([grantCookie({ v: "2026-01-01" })]);
  const harness = await open(page);
  await expect(bar(page)).toBeVisible();
  await page.waitForTimeout(300);
  expect(harness.google).toHaveLength(0);
});

test("the footer's 쿠키 설정 withdraws: GA cookies are deleted and events stop", async ({ page, context }) => {
  await context.addCookies([
    grantCookie(),
    { name: "_ga", value: "GA1.1.1.1", domain: ".site.test", path: "/" },
    { name: "_ga_ABC123", value: "GS1.1.1", domain: ".site.test", path: "/" },
    { name: "theme", value: "dark", domain: "site.test", path: "/" },
  ]);
  const harness = await open(page);
  await page.waitForFunction(() => (window as unknown as { __gtmRuns?: number }).__gtmRuns === 1);
  await expect(bar(page)).toHaveCount(0);
  await page.locator("footer").getByRole("button", { name: "쿠키 설정" }).click();
  await expect(dialog(page)).toBeVisible();
  const toggle = dialog(page).getByRole("switch", { name: "방문 통계 허용" });
  await expect(toggle).toBeChecked();
  await toggle.click();
  await expect(toggle).not.toBeChecked();
  await dialog(page).getByRole("button", { name: "선택 저장" }).click();
  await expect(dialog(page)).toHaveCount(0);
  await expect.poll(() => harness.records.length).toBe(1);
  expect(harness.records[0]!.body).toMatchObject({ action: "withdraw", analytics: false });
  const names = (await context.cookies(ORIGIN)).map((cookie) => cookie.name).sort();
  expect(names).toEqual(["site_consent", "theme"]);
  expect((await consentCookie(context))?.value).toContain("&a=0&");
  const after = await page.evaluate(() => {
    const w = window as unknown as { dataLayer: unknown[]; "ga-disable-G-ABC123"?: boolean };
    const before = w.dataLayer.length;
    w.dataLayer.push({ event: "contact_cta" });
    const last = w.dataLayer.filter((item) => Object.prototype.toString.call(item) === "[object Arguments]").at(-1) as ArrayLike<unknown>;
    return { grew: w.dataLayer.length - before, disabled: w["ga-disable-G-ABC123"], last: Array.from(last) };
  });
  expect(after.grew).toBe(0);
  expect(after.disabled).toBe(true);
  expect(after.last).toEqual(["consent", "update", { analytics_storage: "denied" }]);
  if (SHOTS) await page.screenshot({ path: join(SHOTS, "footer-after-withdraw.png"), fullPage: true });
});

test("a keyboard choice on the bar hands focus to the page's main content, not the top of the document", async ({ page }) => {
  await open(page);
  await bar(page).getByRole("button", { name: "거부" }).focus();
  await page.keyboard.press("Enter");
  await expect(bar(page)).toHaveCount(0);
  await expect(page.locator("#main-content")).toBeFocused();
});

test("while the bar is up the end of the page can still be scrolled above it", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await open(page);
  await expect(bar(page)).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const [footerBottom, barTop] = await page.evaluate(() => [
    document.querySelector("footer")!.getBoundingClientRect().bottom,
    document.querySelector(".site-consent")!.getBoundingClientRect().top,
  ]);
  expect(footerBottom).toBeLessThanOrEqual(barTop + 0.5);
  await bar(page).getByRole("button", { name: "모두 허용" }).click();
  await expect(bar(page)).toHaveCount(0);
  expect(await page.evaluate(() => getComputedStyle(document.body).paddingBottom), "the room goes with the bar").toBe("0px");
});
