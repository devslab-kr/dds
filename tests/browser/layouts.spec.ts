import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";
test("shared layout typography and spacing", async ({ page }) => {
  await page.goto("/tests/fixtures/layouts/index.html");
  await expect(page.locator("h1")).toHaveCSS("font-size", "24px");
  await expect(page.locator("h1")).toHaveCSS("line-height", "32px");
  await expect(page.locator("h1")).toHaveCSS("font-weight", "700");
  await expect(page.locator("p")).toHaveCSS("font-size", "14px");
  await expect(page.locator(".dds-layout__main")).toHaveCSS(
    "padding-inline-start",
    "32px",
  );
  await page.setViewportSize({ width: 390, height: 800 });
  await expect(page.locator(".dds-layout__main")).toHaveCSS(
    "padding-inline-start",
    "16px",
  );
});

for (const framework of ["react", "solid", "vue", "svelte"])
  for (const layout of ["left", "top"]) {
    test(`${framework} ${layout}: shared measurements and responsive navigation`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.setViewportSize({ width: 1280, height: 850 });
      await page.goto(
        `/tests/fixtures/layouts/index.html?framework=${framework}&layout=${layout}`,
      );
      await expect(
        page.getByRole("heading", { name: "Page title" }),
      ).toBeVisible();
      await expect(page.locator(".dds-layout")).toHaveAttribute(
        "data-hydrated",
        "true",
      );
      await expect(page.locator("h1")).toHaveCSS("font-size", "24px");
      await expect(page.locator("h1")).toHaveCSS("line-height", "32px");
      await expect(page.locator("h1")).toHaveCSS("font-weight", "700");
      await expect(
        page.locator("h2").filter({ hasText: "Section title" }),
      ).toHaveCSS("font-size", "20px");
      await expect(page.locator(".dds-field-label")).toHaveCSS(
        "font-size",
        "13px",
      );
      await expect(page.locator(".dds-layout__caption")).toHaveCSS(
        "font-size",
        "12px",
      );
      await expect(page.locator("p").first()).toHaveCSS("font-size", "14px");
      await expect(page.locator(".dds-layout__main")).toHaveCSS(
        "padding-inline-start",
        "32px",
      );
      await expect(page.locator(".dds-layout__panel")).toHaveCSS(
        "padding-inline-start",
        "24px",
      );
      await expect(page.locator(".dds-layout__fields")).toHaveCSS(
        "row-gap",
        "16px",
      );
      if (layout === "left")
        await expect(page.locator(".dds-layout__navigation")).toHaveCSS(
          "width",
          "232px",
        );
      else {
        const summary = page.locator("summary").first();
        await summary.click();
        await expect(
          page.locator('a[data-nav="fixture.products"]'),
        ).toBeVisible();
        await summary.press("Escape");
        await expect(page.locator("details").first()).not.toHaveAttribute(
          "open",
        );
      }
      expect(
        (await new AxeBuilder({ page }).include(".dds-layout").analyze())
          .violations,
      ).toEqual([]);
      await page.setViewportSize({ width: 390, height: 850 });
      await expect(page.locator(".dds-layout__main")).toHaveCSS(
        "padding-inline-start",
        "16px",
      );
      await expect(page.locator(".dds-layout__panel")).toHaveCSS(
        "padding-inline-start",
        "16px",
      );
      const opener = page.locator('[data-action="toggle-rail"]');
      await expect(page.locator(".dds-layout__navigation")).toBeHidden();
      await opener.focus();
      await page.keyboard.press("Tab");
      expect(
        await page.evaluate(
          () => !!document.activeElement?.closest(".dds-layout__navigation"),
        ),
      ).toBe(false);
      await opener.click();
      await expect(opener).toHaveAttribute("aria-expanded", "true");
      await expect(page.locator(".dds-layout__navigation")).toBeVisible();
      if (layout === "top") await page.locator("summary").first().click();
      await page.keyboard.press("Escape");
      if ((await opener.getAttribute("aria-expanded")) === "true")
        await page.keyboard.press("Escape");
      await expect(opener).toHaveAttribute("aria-expanded", "false");
      await expect(opener).toBeFocused();
      await page.setViewportSize({ width: 1280, height: 850 });
      await page.evaluate(() => {
        document.documentElement.dir = "rtl";
        document.documentElement.dataset.theme = "dark";
        document.body.style.zoom = "2";
        document.querySelector("h1")!.textContent =
          "긴 한국어 제목과 Long European workspace title that must wrap safely";
      });
      await expect(page.locator("h1")).toBeVisible();
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth + 1,
        ),
      ).toBe(true);
      expect(errors).toEqual([]);
    });
  }
