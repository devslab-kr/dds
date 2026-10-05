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

// A product's own strings for its other locales; the fixture spreads them over the kit's defaults.
type ProductMessages = Partial<Record<"acceptAll" | "rejectAll" | "settings" | "save" | "cancel" | "title" | "body" | "learnMore", string>>;
const productMessagesScript = (messages?: ProductMessages) => messages
  ? `<script nonce="${NONCE}">window.__consentMessages = ${JSON.stringify(messages).replace(/</g, "\\u003c")};</script>`
  : "";

const html = (lang: string, theme: string, messages?: ProductMessages) => `<!doctype html><html lang="${lang}" data-theme="${theme}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Consent</title>
<style>${tokens}\n${css}\n${siteBase}\n${siteSections}\n${PRODUCT_ROOT}</style>${productMessagesScript(messages)}</head><body><script type="module" src="/app.js" nonce="${NONCE}"></script></body></html>`;

interface Harness { google: Request[]; records: Array<{ body: unknown; origin: string | undefined }> }

async function open(page: Page, { lang = "ko", theme = "light", messages = undefined as ProductMessages | undefined } = {}): Promise<Harness> {
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
      body: html(lang, theme, messages),
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

/** The bar's three choices, the dialog's two: same box, same paint. */
async function expectEqualWeight(page: Page, selector: string, count: number) {
  const buttons = await page.locator(selector).evaluateAll((elements) => elements.map((element) => {
    const style = getComputedStyle(element);
    const box = element.getBoundingClientRect();
    return {
      width: box.width, height: box.height,
      paint: [style.backgroundColor, style.color, style.borderTopColor, style.borderTopWidth, style.fontSize, style.fontWeight, style.fontFamily].join("|"),
      clipped: element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1,
    };
  }));
  expect(buttons).toHaveLength(count);
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

test("the bar is short and 자세히 보기 is a plain link to the policy's analytics section; the settings are cancel and save", async ({ page }) => {
  const harness = await open(page);
  await expect(bar(page).locator(".site-consent__title")).toHaveText("이용 통계 수집 동의 (선택)");
  await expect(bar(page).getByRole("link")).toHaveCount(1);
  const more = bar(page).getByRole("link", { name: "자세히 보기" });
  await expect(more).toHaveAttribute("href", "/privacy#analytics");
  // Text in the sentence, not a fourth button: the body's weight, no box of its own.
  const [body, link] = await page.locator(".site-consent__body, .site-consent__body a").evaluateAll((elements) => elements.map((element) => {
    const style = getComputedStyle(element);
    return { weight: style.fontWeight, size: style.fontSize, background: style.backgroundColor, border: style.borderTopWidth, display: style.display };
  }));
  expect(link).toMatchObject({ weight: body!.weight, size: body!.size, background: "rgba(0, 0, 0, 0)", display: "inline" });
  await bar(page).getByRole("button", { name: "설정" }).click();
  await expect(dialog(page).getByRole("link", { name: "개인정보처리방침" })).toHaveAttribute("href", "/privacy");
  await expect(dialog(page).locator(".dds-dialog__actions button")).toHaveText(["취소", "선택 저장"]);
  await dialog(page).getByRole("button", { name: "취소" }).click();
  await expect(dialog(page)).toHaveCount(0);
  await expect(bar(page)).toBeVisible();
  await more.click();
  await expect(page).toHaveURL(`${ORIGIN}/privacy#analytics`);
  expect(harness.records).toHaveLength(0);
  expect(harness.google).toHaveLength(0);
});

for (const width of [390, 1280]) {
  for (const theme of ["light", "dark"]) {
    test(`the bar and the settings fit at ${width}px in ${theme}, with three equal, readable choices`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await open(page, { theme });
      await expect(bar(page)).toBeVisible();
      await expectEqualWeight(page, ".site-consent__actions button", 3);
      await expectNoOverflow(page, ".site-consent");
      await expectReadable(page, ".site-consent", ".site-consent");
      if (SHOTS) await page.screenshot({ path: join(SHOTS, `bar-${width}-${theme}.png`) });
      await bar(page).getByRole("button", { name: "설정" }).click();
      await expect(dialog(page)).toBeVisible();
      await expectEqualWeight(page, ".site-consent-dialog .dds-dialog__actions button", 2);
      await expectNoOverflow(page, ".site-consent-dialog");
      await expectReadable(page, ".site-consent-dialog", ".site-consent-dialog");
      // The two category rows share one grid: their right-hand controls end on one line.
      const ends = await page.locator(".site-consent-category__status, .site-consent-category__switch").evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().right));
      expect(Math.abs(ends[0]! - ends[1]!)).toBeLessThan(1);
      if (SHOTS) await page.screenshot({ path: join(SHOTS, `settings-${width}-${theme}.png`) });
    });
  }
}

/*
 * Products bring their own strings, longer than the kit's and in scripts with
 * long words (BookLinq's catalogs, 2026-10). In three columns at 390px they
 * broke inside words — "Einstellun / gen". On a phone the three choices stack,
 * full width and the same size, and a label wraps only at a space. A Korean
 * label keeps whole words (keep-all) on the button itself.
 */
const LONG_LABELS: Record<string, ProductMessages> = {
  de: { acceptAll: "Alle akzeptieren", rejectAll: "Ablehnen", settings: "Einstellungen", save: "Auswahl speichern", cancel: "Abbrechen" },
  es: { acceptAll: "Aceptar todas", rejectAll: "Rechazar", settings: "Configuración", save: "Guardar selección", cancel: "Cancelar" },
  pt: { acceptAll: "Aceitar todos", rejectAll: "Recusar", settings: "Configurações", save: "Salvar escolhas", cancel: "Cancelar" },
  ta: { acceptAll: "அனைத்தையும் ஏற்கவும்", rejectAll: "நிராகரிக்கவும்", settings: "அமைப்புகள்", save: "தேர்வுகளைச் சேமிக்கவும்", cancel: "ரத்துசெய்யவும்" },
  te: { acceptAll: "అన్నింటినీ అంగీకరించండి", rejectAll: "తిరస్కరించండి", settings: "సెట్టింగ్‌లు", save: "ఎంపికలను సేవ్ చేయండి", cancel: "రద్దు చేయండి" },
  // Longer than any real label, so it has to wrap even stacked: keep-all decides where.
  ko: {
    acceptAll: "방문 통계 쿠키를 포함해서 이 사이트가 쓰는 모든 쿠키를 허용합니다",
    rejectAll: "꼭 필요한 쿠키만 남기고 방문 통계 쿠키는 쓰지 않도록 거부합니다",
    settings: "쿠키를 종류별로 하나씩 살펴보고 직접 고르는 설정 화면을 엽니다",
    save: "지금 고른 항목만 허용하고 나머지는 거부한 채로 저장합니다",
    cancel: "아무것도 바꾸지 않고 이 설정 화면을 그냥 닫겠습니다",
  },
};
const BAR_ACTIONS = ".site-consent__actions button";
const DIALOG_ACTIONS = ".site-consent-dialog .dds-dialog__actions button";

/**
 * How many lines each label takes, and every word drawn on more than one
 * line. Words come from Intl.Segmenter for the page's language; a word's
 * Range yields one client rect per line it touches.
 */
async function labelLines(page: Page, selector: string, lang: string) {
  return page.locator(selector).evaluateAll((buttons, lang) => buttons.map((button) => {
    const segmenter = new Intl.Segmenter(lang, { granularity: "word" });
    const centres: number[] = [];
    const split: string[] = [];
    const walker = document.createTreeWalker(button, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node as Text;
      for (const { segment, index, isWordLike } of segmenter.segment(text.data)) {
        const range = document.createRange();
        range.setStart(text, index);
        range.setEnd(text, index + segment.length);
        const rects = [...range.getClientRects()].filter((rect) => rect.width > 0);
        const mids = rects.map((rect) => (rect.top + rect.bottom) / 2);
        centres.push(...mids);
        // Two fragments of one word whose centres sit a half line apart are on two lines.
        const halfLine = Math.min(...rects.map((rect) => rect.height)) / 2;
        if (isWordLike && mids.length > 1 && Math.max(...mids) - Math.min(...mids) > halfLine) split.push(segment);
      }
    }
    const lines = centres.sort((a, b) => a - b).filter((mid, index, all) => index === 0 || mid - all[index - 1]! > 8).length;
    return { label: button.textContent!.trim(), lines, split };
  }), lang);
}

async function expectWholeWords(page: Page, selector: string, lang: string) {
  const labels = await labelLines(page, selector, lang);
  expect(labels.length).toBeGreaterThanOrEqual(2);
  for (const { label, split } of labels) expect(split, `"${label}" breaks only at spaces`).toEqual([]);
  return labels;
}

/** One column: every choice spans its container, one under the next. */
async function expectStacked(page: Page, container: string, selector: string) {
  const frame = await page.locator(container).evaluate((element) => element.getBoundingClientRect().toJSON());
  const boxes = await page.locator(selector).evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().toJSON()));
  expect(boxes.length).toBeGreaterThanOrEqual(2);
  boxes.forEach((box, index) => {
    expect(Math.abs(box.left - frame.left), "starts at the container's start").toBeLessThan(0.5);
    expect(Math.abs(box.right - frame.right), "ends at the container's end").toBeLessThan(0.5);
    if (index > 0) expect(box.top, "below the previous choice").toBeGreaterThanOrEqual(boxes[index - 1]!.bottom - 0.5);
  });
}

/** One row: the choices share a top edge. */
async function expectOneRow(page: Page, selector: string) {
  const tops = await page.locator(selector).evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().top));
  expect(tops.length).toBeGreaterThanOrEqual(2);
  for (const top of tops) expect(Math.abs(top - tops[0]!)).toBeLessThan(0.5);
}

for (const [lang, labels] of Object.entries(LONG_LABELS)) {
  for (const width of [320, 360, 390]) {
    test(`${lang} at ${width}px: long labels stack full width and equal, and never break inside a word`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await open(page, { lang, messages: labels });
      await expect(bar(page)).toBeVisible();
      await expect(bar(page).locator(BAR_ACTIONS)).toHaveText([labels.acceptAll!, labels.rejectAll!, labels.settings!]);
      if (SHOTS) await page.screenshot({ path: join(SHOTS, `long-${lang}-${width}-bar.png`) });
      const lines = await expectWholeWords(page, BAR_ACTIONS, lang);
      // Korean is the case where a wrap happens at all; keep-all has to be what placed it.
      if (lang === "ko") expect(Math.max(...lines.map((label) => label.lines)), "a Korean label wraps").toBeGreaterThan(1);
      await expectNoOverflow(page, ".site-consent");
      await expectEqualWeight(page, BAR_ACTIONS, 3);
      await expectStacked(page, ".site-consent__actions", BAR_ACTIONS);

      await bar(page).locator(BAR_ACTIONS).nth(2).click();
      await expect(dialog(page)).toBeVisible();
      await page.mouse.move(0, 0);
      if (SHOTS) await page.screenshot({ path: join(SHOTS, `long-${lang}-${width}-settings.png`) });
      await expectWholeWords(page, DIALOG_ACTIONS, lang);
      await expectNoOverflow(page, ".site-consent-dialog");
      await expectEqualWeight(page, DIALOG_ACTIONS, 2);
      await expectStacked(page, ".site-consent-dialog .dds-dialog__actions", DIALOG_ACTIONS);
    });
  }
}

// Where there is room the bar keeps its one row of three, and the long words still fit whole.
for (const width of [600, 768, 1024, 1280]) {
  test(`at ${width}px long labels sit in one row of three equal choices, whole words, no overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    for (const [lang, labels] of Object.entries(LONG_LABELS)) {
      // The last iteration clicked a button; a pointer left over it would paint a hover.
      await page.mouse.move(0, 0);
      await open(page, { lang, messages: labels });
      await expect(bar(page)).toBeVisible();
      if (SHOTS) await page.screenshot({ path: join(SHOTS, `long-${lang}-${width}-bar.png`) });
      await expectWholeWords(page, BAR_ACTIONS, lang);
      await expectNoOverflow(page, ".site-consent");
      await expectEqualWeight(page, BAR_ACTIONS, 3);
      await expectOneRow(page, BAR_ACTIONS);
      // The choices never cover the copy, and the copy keeps a readable measure beside or above them.
      const [copy, actions] = await page.locator(".site-consent__copy, .site-consent__actions").evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().toJSON()));
      const apart = actions!.top >= copy!.bottom - 0.5 || actions!.left >= copy!.right - 0.5;
      expect(apart, `${lang}: the choices sit beside or below the copy, not over it`).toBe(true);
      expect(copy!.width, `${lang}: the copy is at least 18rem wide`).toBeGreaterThanOrEqual(288);
      await bar(page).locator(BAR_ACTIONS).nth(2).click();
      await expect(dialog(page)).toBeVisible();
      await page.mouse.move(0, 0);
      if (SHOTS) await page.screenshot({ path: join(SHOTS, `long-${lang}-${width}-settings.png`) });
      await expectWholeWords(page, DIALOG_ACTIONS, lang);
      await expectNoOverflow(page, ".site-consent-dialog");
      await expectEqualWeight(page, DIALOG_ACTIONS, 2);
      await expectOneRow(page, DIALOG_ACTIONS);
      await page.unrouteAll({ behavior: "ignoreErrors" });
    }
  });
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
  const toggle = dialog(page).getByRole("switch", { name: "이용 통계 수집 허용" });
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
