import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

const tokens = await readFile(new URL("../../packages/dds-tokens/dist/tokens.css", import.meta.url), "utf8");
const css = await readFile(new URL("../../packages/dds-css/dist/dds.css", import.meta.url), "utf8");
const siteBase = (await readFile(new URL("../../packages/site-kit/styles.css", import.meta.url), "utf8")).replace(/@import[^;]+;\s*/g, "");
const siteSections = await readFile(new URL("../../packages/site-kit/site-sections.css", import.meta.url), "utf8");
const site = `${siteBase}\n${siteSections}`;
const fixture = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>${tokens}\n${css}\n${site}</style></head><body>
<div class="site-shell"><header class="site-header"><div class="site-header__inner">
<a class="site-brand" href="/ar">لينك</a>
<button type="button" class="dds-btn dds-btn--ghost site-menu-button" aria-expanded="false" aria-controls="site-navigation">فتح القائمة</button>
<nav id="site-navigation" class="site-nav" data-open="false" aria-label="التنقل الرئيسي"><ul class="site-nav__list"><li><a href="/docs">الوثائق</a></li></ul></nav>
<div class="site-header__controls" data-open="false"><label><span class="dds-sr-only">اللغة</span><select class="dds-select__input" aria-label="اللغة"><option>العربية</option></select></label><a class="dds-btn dds-btn--primary" href="/access">طلب الوصول</a></div>
</div></header><main id="main-content" class="site-main"><h1>واجهة عربية طويلة لا ينبغي أن تتجاوز عرض الشاشة</h1></main></div>
<script>document.querySelector('.site-menu-button').addEventListener('click', (event) => { const button=event.currentTarget; const open=button.getAttribute('aria-expanded')!=='true'; button.setAttribute('aria-expanded', String(open)); document.querySelector('#site-navigation').dataset.open=String(open); document.querySelector('.site-header__controls').dataset.open=String(open); });</script>
</body></html>`;

const flagFixture = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>${tokens}\n${css}\n${site}</style></head><body>
<div class="site-shell"><header class="site-header"><div class="site-header__inner">
<a class="site-brand" href="/ar">لينك</a>
<button type="button" class="dds-btn dds-btn--ghost site-menu-button" aria-expanded="false" aria-controls="site-navigation">فتح القائمة</button>
<nav id="site-navigation" class="site-nav" data-open="false" aria-label="التنقل الرئيسي"><ul class="site-nav__list"><li><a href="/docs">الوثائق</a></li></ul></nav>
<div class="site-header__controls" data-open="false"><details class="site-locale-flag"><summary class="site-locale-flag__trigger" aria-label="اللغة: العربية"><svg class="site-locale-flag__svg" viewBox="0 0 640 480" aria-hidden="true"><rect width="640" height="480" fill="green"/></svg></summary><ul class="site-locale-flag__list" role="list"><li><a class="site-locale-flag__option" href="/ko" lang="ko" hreflang="ko" dir="ltr"><svg class="site-locale-flag__svg" viewBox="0 0 640 480" aria-hidden="true"><rect width="640" height="480" fill="white"/></svg><span>한국어</span></a></li><li><a class="site-locale-flag__option" href="/ar" lang="ar" hreflang="ar" dir="rtl" aria-current="true"><svg class="site-locale-flag__svg" viewBox="0 0 640 480" aria-hidden="true"><rect width="640" height="480" fill="green"/></svg><span>العربية</span></a></li></ul></details><a class="dds-btn dds-btn--primary" href="/access">طلب الوصول</a></div>
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

const sectionFixture = `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${tokens}\n${css}\n${site}</style></head><body>
<section class="site-section" data-tone="band"><div class="site-section__shell"><h2>Band</h2></div></section>
</body></html>`;

test("a band-tone section resolves to the family's subtle background token", async ({ page }) => {
  await page.setContent(sectionFixture);
  const [bandBackground, subtleToken] = await page.evaluate(() => {
    const section = document.querySelector(".site-section")!;
    const probe = document.createElement("div");
    probe.style.background = "var(--dds-color-bg-subtle)";
    document.body.appendChild(probe);
    const result = [getComputedStyle(section).backgroundColor, getComputedStyle(probe).backgroundColor] as const;
    probe.remove();
    return result;
  });
  expect(bandBackground).toBe(subtleToken);
});

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

for (const width of [1280, 375]) {
  test(`flag locale menu opens, is keyboard-operable, and does not overflow in RTL at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 });
    await page.setContent(flagFixture);
    if (width === 375) {
      await page.getByRole("button", { name: "فتح القائمة" }).click();
    }
    const trigger = page.locator(".site-locale-flag__trigger");
    await expect(trigger).toHaveAttribute("aria-label", "اللغة: العربية");
    const box = (await trigger.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    await trigger.click();
    await expect(page.locator("details.site-locale-flag")).toHaveAttribute("open", "");
    const hit = await page.locator('.site-locale-flag__option[lang="ko"]').evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)?.closest(".site-locale-flag__option") === element;
    });
    expect(hit, "the row must be the element under its own centre — visible AND usable").toBe(true);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await page.keyboard.press("Tab");
    await expect(page.locator('.site-locale-flag__option[lang="ko"]')).toBeFocused();
  });
}

// D-029: a single-language landing (FM덴탈서비스) — no picker, a named wordmark
// link, a footer with business details, emphasised privacy link, sections that
// stop below the sticky header. The markup is what SiteHeader/SiteFooter render
// with those props; the geometry is the real cascade at both pointer types.
const landingFixture = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${tokens}\n${css}\n${site}
.landing-root { --site-hero-eyebrow-tracking: 0; --site-hero-eyebrow-weight: 600; }
.spacer { block-size: 900px; }</style></head><body class="landing-root">
<div class="site-shell"><header class="site-header"><div class="site-header__inner">
<a class="site-brand" href="/" aria-label="FM덴탈서비스 첫 화면"><span class="wordmark"><b>FM</b>덴탈서비스</span></a>
<button type="button" class="dds-btn dds-btn--ghost site-menu-button" aria-expanded="false" aria-controls="site-navigation">메뉴</button>
<nav id="site-navigation" class="site-nav" data-open="false" aria-label="사이트 메뉴"><ul class="site-nav__list"><li><a href="#how">이용 방법</a></li><li><a href="#scope">서비스 범위</a></li><li><a href="#contact">문의</a></li></ul></nav>
<div class="site-header__controls" data-open="false"><a class="dds-btn dds-btn--ghost" href="/login">로그인</a><a class="dds-btn dds-btn--primary" href="#contact">이용 문의</a></div>
</div></header><main id="main-content" class="site-main site-main--bleed">
<section class="site-hero" aria-labelledby="hero-t"><div class="site-hero__shell"><div class="site-hero__copy"><p class="site-hero__eyebrow">부산 치과기공소 전담 수거·배송</p><h1 id="hero-t">이제 치기공물 수거·배송은
FM덴탈서비스에서</h1><p class="site-hero__lede">거래 치과에서 수거해 기공소로.</p><div class="site-hero__actions"></div></div><figure class="site-hero__aside" aria-label="기공소 화면 예시"></figure></div></section>
<section class="site-section" id="how" data-tone="band" aria-labelledby="how-t"><div class="site-section__shell"><h2 id="how-t">이용 방법</h2><div class="spacer"></div></div></section>
<section class="site-section" id="scope" data-tone="default" aria-labelledby="scope-t"><div class="site-section__shell"><h2 id="scope-t">서비스 범위</h2><div class="spacer"></div></div></section>
<section class="site-section" id="contact" data-tone="band" aria-labelledby="contact-t"><div class="site-section__shell"><h2 id="contact-t">문의</h2><div class="spacer"></div></div></section>
</main><footer class="site-footer" aria-label="바닥글"><div class="site-footer__inner"><div class="site-footer__row">
<div class="site-footer__identity"><p class="site-footer__brand"><span class="wordmark"><b>FM</b>덴탈서비스</span></p><div class="site-footer__details"><p>상호 FM덴탈서비스 · 대표 ○○○ · 사업자등록번호 ○○○-○○-○○○○○</p><address>부산광역시 연제구 거제대로108번길 47, 2층</address></div></div>
<nav class="site-footer__nav" aria-label="바닥 메뉴"><ul class="site-footer__links"><li><a href="/terms">이용약관</a></li><li><a class="site-link--emphasis" href="/privacy">개인정보처리방침</a></li><li><a href="/login">로그인</a></li><li><bdi>© FM덴탈서비스</bdi></li></ul></nav>
</div></div></footer></div>
<script>document.querySelector('.site-menu-button').addEventListener('click', (event) => { const button=event.currentTarget; const open=button.getAttribute('aria-expanded')!=='true'; button.setAttribute('aria-expanded', String(open)); document.querySelector('#site-navigation').dataset.open=String(open); document.querySelector('.site-header__controls').dataset.open=String(open); });</script>
</body></html>`;

// The top of an element's first line of text — boxes on touch are 44px tall around their text.
const textTops = (page: import("@playwright/test").Page, selectors: string[]) =>
  page.evaluate((list) => list.map((selector) => {
    const range = document.createRange();
    range.selectNodeContents(document.querySelector(selector)!);
    return Math.round(range.getClientRects()[0]!.top);
  }), selectors);

const svgMarkFixture = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${tokens}\n${css}\n${site}</style></head><body>
<footer class="site-footer" id="wordmark"><div class="site-footer__inner"><div class="site-footer__row"><p class="site-footer__brand"><svg class="mark" width="120" height="20" viewBox="0 0 120 20" aria-label="Acme"><rect width="120" height="20"/></svg></p><ul class="site-footer__links"><li><a href="/p">Privacy</a></li></ul></div></div></footer>
<footer class="site-footer" id="icon"><div class="site-footer__inner"><div class="site-footer__row"><p class="site-footer__brand"><svg class="mark" width="120" height="20" viewBox="0 0 120 20" aria-hidden="true"><rect width="120" height="20"/></svg><strong>Acme</strong></p><ul class="site-footer__links"><li><a href="/p">Privacy</a></li></ul></div></div></footer>
</body></html>`;

test("a footer wordmark logo keeps its own size; an icon mark beside a name is 16px", async ({ page }) => {
  await page.setContent(svgMarkFixture);
  const widths = await page.evaluate(() => ["#wordmark", "#icon"].map((id) => Math.round(document.querySelector(`${id} .mark`)!.getBoundingClientRect().width)));
  expect(widths).toEqual([120, 16]);
});

const heightsOf = (page: import("@playwright/test").Page, selector: string) =>
  page.locator(selector).evaluateAll((elements) => elements.map((element) => Math.round(element.getBoundingClientRect().height)));

test.describe("landing chrome, fine pointer", () => {
  test.use({ viewport: { width: 1280, height: 900 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1 });

  test.beforeEach(async ({ page }) => {
    await page.setContent(landingFixture);
    expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(false);
  });

  test("the header is one 64px row with centred links and no picker", async ({ page }) => {
    expect(await heightsOf(page, ".site-header__inner")).toEqual([64]);
    const centre = await page.evaluate(() => {
      const nav = document.querySelector(".site-nav")!.getBoundingClientRect();
      const inner = document.querySelector(".site-header__inner")!.getBoundingClientRect();
      return Math.abs(nav.left + nav.width / 2 - (inner.left + inner.width / 2));
    });
    expect(centre).toBeLessThanOrEqual(1);
    await expect(page.locator(".site-header select, .site-locale-flag")).toHaveCount(0);
  });

  test("an in-page link stops the section below the sticky header", async ({ page }) => {
    await page.evaluate(() => { location.hash = "#contact"; });
    const top = await page.locator("#contact").evaluate((element) => Math.round(element.getBoundingClientRect().top));
    // 64px header row; the section keeps 8px of air below it.
    expect(top).toBe(72);
  });

  test("the eyebrow takes the product's tracking and weight", async ({ page }) => {
    const eyebrow = await page.locator(".site-hero__eyebrow").evaluate((element) => ({
      letterSpacing: getComputedStyle(element).letterSpacing,
      fontWeight: getComputedStyle(element).fontWeight,
    }));
    expect(["0px", "normal"]).toContain(eyebrow.letterSpacing);
    expect(eyebrow.fontWeight).toBe("600");
  });

  test("the footer details sit under the brand, the links level with its first line, the privacy link heavier", async ({ page }) => {
    const layout = await page.evaluate(() => {
      const brand = document.querySelector(".site-footer__brand")!.getBoundingClientRect();
      const details = document.querySelector(".site-footer__details")!;
      const firstDetail = details.firstElementChild!.getBoundingClientRect();
      const privacy = getComputedStyle(document.querySelector('a[href="/privacy"]')!);
      const terms = getComputedStyle(document.querySelector('.site-footer__links a[href="/terms"]')!);
      return { brandBottom: Math.round(brand.bottom), detailsTop: Math.round(firstDetail.top), detailsMargin: getComputedStyle(details.firstElementChild!).marginBlockStart, privacyWeight: privacy.fontWeight, termsWeight: terms.fontWeight, privacyColor: privacy.color, termsColor: terms.color };
    });
    // the details start one 8px gap under the brand line — no browser paragraph margin
    expect(layout.detailsMargin).toBe("0px");
    expect(layout.detailsTop - layout.brandBottom).toBe(8);
    const [brandText, linkText, copyrightText] = await textTops(page, [".site-footer__brand", '.site-footer__links a[href="/terms"]', ".site-footer__links bdi"]);
    // baseline-aligned: text of different sizes may differ by a couple of pixels, never a whole line
    expect(Math.abs(brandText! - linkText!)).toBeLessThanOrEqual(3);
    expect(copyrightText).toBe(linkText);
    expect(layout.privacyWeight).toBe("700");
    expect(layout.termsWeight).not.toBe("700");
    expect(layout.privacyColor).not.toBe(layout.termsColor);
    expect(await page.locator(".site-footer__details address").evaluate((element) => getComputedStyle(element).fontStyle)).toBe("normal");
  });
});

test.describe("landing chrome, coarse pointer", () => {
  test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });

  test.beforeEach(async ({ page }) => {
    await page.setContent(landingFixture);
    expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(true);
  });

  test("the closed header keeps 64px with a 44px menu button and a 44px brand link", async ({ page }) => {
    expect(await heightsOf(page, ".site-header__inner")).toEqual([64]);
    expect(await heightsOf(page, ".site-menu-button")).toEqual([44]);
    expect(await heightsOf(page, ".site-brand")).toEqual([44]);
  });

  test("the open menu is 44px link rows and the footer links are 44px targets", async ({ page }) => {
    await page.getByRole("button", { name: "메뉴" }).click();
    expect(await heightsOf(page, ".site-nav__list a")).toEqual([44, 44, 44]);
    const rowsFill = await page.locator(".site-nav__list a").evaluateAll((elements) => {
      const list = elements[0]!.closest("ul")!.getBoundingClientRect();
      return elements.every((element) => Math.round(element.getBoundingClientRect().width) === Math.round(list.width));
    });
    expect(rowsFill, "each menu row is the full width of the list").toBe(true);
    for (const height of await heightsOf(page, ".site-footer__links a")) expect(height).toBeGreaterThanOrEqual(44);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe("landing chrome footer, coarse pointer, one row", () => {
  test.use({ viewport: { width: 1024, height: 768 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });

  test("44px footer links stay level with the brand line and the copyright", async ({ page }) => {
    await page.setContent(landingFixture);
    expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(true);
    for (const height of await heightsOf(page, ".site-footer__links a")) expect(height).toBeGreaterThanOrEqual(44);
    const [brandText, linkText, copyrightText] = await textTops(page, [".site-footer__brand", '.site-footer__links a[href="/terms"]', ".site-footer__links bdi"]);
    expect(Math.abs(brandText! - linkText!)).toBeLessThanOrEqual(3);
    expect(copyrightText).toBe(linkText);
  });
});
