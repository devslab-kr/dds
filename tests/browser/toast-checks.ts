import { expect, test, type Locator } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const actionLabel = "데모 액션을 실행하고 이 알림을 닫습니다";

async function rootId(toast: Locator) {
  await expect(toast).toHaveCount(1);
  return toast.getAttribute("id");
}

/** Exercise the same public Toast contract through each framework's real UI. */
export function registerToastChecks(framework: string, url: string) {
  test.describe(`${framework} async Toast`, () => {
    test.beforeEach(async ({ page }) => {
      page.on("pageerror", error => { throw error; });
      await page.goto(url);
      await expect(page.getByRole("form", { name: "Toast demo form" })).toBeVisible();
    });

    test("updates loading and settles a promise without replacing its toast ID", async ({ page }) => {
      const toast = page.locator(".dds-toast");
      await page.getByRole("button", { name: "Show loading notice", exact: true }).click();
      await expect(toast).toHaveText(/알림 갱신 데모 진행 중/);
      await expect(toast.locator(".dds-spinner")).toHaveAttribute("aria-hidden", "true");
      const loadingId = await rootId(toast);
      const publicId = await page.getByLabel("Toast demo ID", { exact: true }).textContent();
      expect(loadingId).toContain(publicId);
      await page.getByRole("button", { name: "Update demo notice", exact: true }).click();
      await expect(toast).toHaveText(/알림 갱신 데모 완료/);
      expect(await rootId(toast)).toBe(loadingId);
      await expect(toast.locator(".dds-spinner")).toHaveCount(0);

      await page.getByRole("button", { name: "Start demo promise", exact: true }).click();
      await expect(toast).toHaveText(/비동기 알림 데모 진행 중/);
      const promiseId = await rootId(toast);
      expect(promiseId).not.toBe(loadingId);
      expect(promiseId).toContain(await page.getByLabel("Toast demo ID", { exact: true }).textContent());
      await page.getByRole("button", { name: "Resolve demo promise", exact: true }).click();
      await expect(page.getByLabel("Toast promise outcome")).toHaveText("resolved");
      await expect(toast).toHaveText(/비동기 알림 데모 완료/);
      expect(await rootId(toast)).toBe(promiseId);
      await expect(toast.locator(".dds-spinner")).toHaveCount(0);
    });

    for (const activation of ["pointer", "Enter"] as const) {
      test(`activates an action by ${activation} once without submitting its associated form`, async ({ page }) => {
        await page.getByRole("button", { name: "Show action notice", exact: true }).click();
        const action = page.getByRole("button", { name: actionLabel, exact: true });
        await expect(action).toBeVisible();
        await expect(action).toHaveAttribute("type", "button");
        // Vue intentionally portals to body. Native form association exercises
        // the same submit behavior for a portalled or inline action button.
        await action.evaluate(button => button.setAttribute("form", "toast-demo-form"));
        if (activation === "pointer") await action.click();
        else { await action.focus(); await page.keyboard.press("Enter"); }
        await expect(page.getByLabel("Toast action count")).toHaveText("1");
        await expect(page.getByLabel("Toast form submissions")).toHaveText("0");
        await expect(page.locator(".dds-toast")).toHaveCount(0);
      });
    }

    test("does not resurrect a dismissed notification when its promise resolves", async ({ page }) => {
      await page.getByRole("button", { name: "Start demo promise", exact: true }).click();
      await expect(page.locator(".dds-toast")).toHaveText(/비동기 알림 데모 진행 중/);
      await page.getByRole("button", { name: "Close demo notice", exact: true }).click();
      await expect(page.locator(".dds-toast")).toHaveCount(0);
      await page.getByRole("button", { name: "Resolve demo promise", exact: true }).click();
      // The output follows the awaitable API's settlement, rather than relying
      // on a fixed delay that could pass before a late notification appears.
      await expect(page.getByLabel("Toast promise outcome")).toHaveText("resolved");
      await expect(page.locator(".dds-toast")).toHaveCount(0);
    });

    for (const width of [1280, 390]) for (const theme of ["light", "dark"] as const) {
      test(`wraps a long Korean message and action at ${width}px in ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.getByRole("button", { name: "Show action notice", exact: true }).click();
        const toast = page.locator(".dds-toast");
        await expect(toast).toHaveCount(1);
        await expect(toast.getByRole("button", { name: actionLabel, exact: true })).toBeVisible();
        const geometry = await toast.evaluate(element => {
          const root = element.getBoundingClientRect();
          return {
            left: root.left, right: root.right, bottom: root.bottom,
            children: Array.from(element.querySelectorAll('[data-part="description"],button')).map(child => {
              const box = child.getBoundingClientRect();
              return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, clientWidth: child.clientWidth, scrollWidth: child.scrollWidth };
            }),
          };
        });
        expect(geometry.left).toBeGreaterThanOrEqual(0);
        expect(geometry.right).toBeLessThanOrEqual(width);
        expect(geometry.bottom).toBeLessThanOrEqual(900);
        for (const child of geometry.children) {
          expect(child.left).toBeGreaterThanOrEqual(geometry.left);
          expect(child.right).toBeLessThanOrEqual(geometry.right);
          expect(child.bottom).toBeLessThanOrEqual(geometry.bottom);
          expect(child.scrollWidth).toBeLessThanOrEqual(child.clientWidth + 1);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
        if (width === 1280) {
          const results = await new AxeBuilder({ page }).include(".dds-toast-region").analyze();
          expect(results.violations).toEqual([]);
        }
        if ((width === 1280 && theme === "light") || (width === 390 && theme === "dark")) {
          const directory = resolve("docs/qa/toast-async-20261108");
          await mkdir(directory, { recursive: true });
          await page.screenshot({ path: resolve(directory, `${framework.toLowerCase()}-${width === 1280 ? "desktop" : "mobile"}-${theme}.png`) });
        }
      });
    }
  });
}
