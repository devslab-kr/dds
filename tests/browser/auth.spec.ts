import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("login keyboard, error recovery, pending and explicit missing configuration", async ({
  page,
}) => {
  await page.goto("/login.html");
  await page.getByLabel("표시 상태").selectOption("error");
  const google = page.getByRole("button", { name: "Google로 계속하기" });
  await google.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("alert")).toContainText(
    "로그인 연결을 확인하지 못했습니다.",
  );
  await expect(
    page.getByRole("button", { name: "다시 선택하기" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(google).toBeFocused();
  await page.getByLabel("표시 상태").selectOption("loading");
  await google.click();
  await expect(google).toHaveAttribute("aria-busy", "true");
  await expect(page.getByRole("region").getByRole("status")).toContainText(
    "Google 로그인 페이지",
  );
  await expect(
    page.getByRole("button", { name: "카카오로 계속하기" }),
  ).toBeDisabled();
  await page.getByLabel("표시 상태").selectOption("unconfigured");
  for (const name of [
    "Google로 계속하기",
    "카카오로 계속하기",
    "네이버로 계속하기",
  ]) {
    await expect(page.getByRole("button", { name })).toBeDisabled();
    await expect(
      page.getByRole("button", { name }),
    ).toHaveAccessibleDescription("서비스의 로그인 연결 설정이 필요합니다.");
  }
});

test("login responsive themes, long copy, accessible names and legal links", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/login.html");
  for (const width of [1280, 768, 320]) {
    await page.setViewportSize({ width, height: 900 });
    if (width === 320)
      await page.getByRole("button", { name: "긴 문구" }).click();
    for (const theme of ["light", "dark"]) {
      await expect(
        page.getByRole("button", { name: "네이버로 계속하기" }),
      ).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
      if (width === 320) {
        const intactWords = await page
          .getByRole("heading", { level: 2 })
          .evaluate((heading) => {
            const text = heading.firstChild!;
            return ["사용하는", "서비스에"].every((word) => {
              const start = text.textContent!.indexOf(word);
              const range = document.createRange();
              range.setStart(text, start);
              range.setEnd(text, start + word.length);
              return range.getClientRects().length === 1;
            });
          });
        expect(intactWords).toBe(true);
      }
      for (const name of [
        "Google로 계속하기",
        "카카오로 계속하기",
        "네이버로 계속하기",
      ]) {
        expect(
          (await page.getByRole("button", { name }).boundingBox())!.height,
        ).toBeGreaterThanOrEqual(48);
      }
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      const symbolContrast = await page
        .locator('[data-provider="kakao"] .dds-login__provider-icon')
        .evaluate((element) => {
          const channels = getComputedStyle(element)
            .backgroundColor.match(/[\d.]+/g)!
            .slice(0, 3)
            .map(Number);
          const linear = channels.map((channel) => {
            const value = channel / 255;
            return value <= 0.04045
              ? value / 12.92
              : ((value + 0.055) / 1.055) ** 2.4;
          });
          const background =
            0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
          // The unchanged provider asset is near-black (#191919); its backing must keep it legible.
          const mark = ((25 / 255 + 0.055) / 1.055) ** 2.4;
          return (background + 0.05) / (mark + 0.05);
        });
      expect(symbolContrast).toBeGreaterThanOrEqual(3);
      for (const image of await page
        .locator(".dds-login__provider-icon img")
        .all()) {
        expect(
          await image.evaluate(
            (element: HTMLImageElement) =>
              element.complete && element.naturalWidth > 0,
          ),
        ).toBe(true);
      }
      const terms = page.getByRole("link", { name: "이용약관" });
      await page.getByRole("button", { name: "네이버로 계속하기" }).focus();
      await page.keyboard.press("Tab");
      await expect(terms).toBeFocused();
      expect(
        await terms.evaluate(
          (element) => getComputedStyle(element).outlineStyle,
        ),
      ).not.toBe("none");
      await page.screenshot({
        path: `test-results/login-${width}-${theme}.png`,
        fullPage: true,
      });
      await page.getByRole("button", { name: "테마 변경" }).click();
    }
  }
  await page.getByRole("button", { name: "언어 변경" }).click();
  await expect(
    page.getByRole("button", { name: "Continue with Naver" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue with Naver" }).click();
  await expect(page.getByLabel("시뮬레이션 이동 주소")).toHaveText(
    "https://auth.example.test/authorize",
  );
  await expect(page.getByRole("region").getByRole("status")).toHaveText(
    "Opening the sign-in page.",
  );
  expect(errors).toEqual([]);
});
