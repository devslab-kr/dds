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
  test.setTimeout(90000);
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

test("a service can opt into additional methods and control order and availability", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/login.html");
  await page.getByRole("button", { name: "추가 제공자 예제" }).click();
  await page.getByRole("button", { name: "언어 변경" }).click();
  const panel = page.getByRole("region", { name: "Sign in to your service" });
  await expect(panel.getByRole("button")).toHaveText([
    "Continue with Google",
    "Continue with Naver",
    "Continue with Discord",
    "Continue with X",
    "Continue with GitHub",
    "Continue with Notion",
    "Continue with Zoom",
    "Continue with GitLab",
  ]);
  await expect(panel.getByRole("button", { name: "Continue with Zoom" })).toBeDisabled();
  await expect(panel.locator("[data-packaged-mark]")).toHaveCount(7);
  await expect(panel.locator('[data-provider="naver"] [data-packaged-mark]')).toHaveCSS("background-image", /naver-official-symbol\.png/);
  const group = panel.getByRole("group");
  const alignments = await group.evaluate((element) => {
    const measure = () => ({
      icons: [...element.querySelectorAll("[data-packaged-mark]")].map((node) => node.getBoundingClientRect().left),
      labels: [...element.querySelectorAll(".dds-login__provider-label")].map((node) => node.getBoundingClientRect().left),
      iconOnRight: element.querySelector("[data-packaged-mark]")!.getBoundingClientRect().left >
        element.querySelector(".dds-login__provider-label")!.getBoundingClientRect().left,
    });
    const ltr = measure();
    element.setAttribute("dir", "rtl");
    const rtl = measure();
    element.removeAttribute("dir");
    return { ltr, rtl };
  });
  for (const { icons, labels } of [alignments.ltr, alignments.rtl]) {
    expect(new Set(icons).size).toBe(1);
    expect(new Set(labels).size).toBe(1);
  }
  expect(alignments.ltr.iconOnRight).toBe(false);
  expect(alignments.rtl.iconOnRight).toBe(true);
  if (process.env.DDS_AUTH_PREVIEW_PATH) {
    await page.setViewportSize({ width: 390, height: 900 });
    await panel.screenshot({ path: process.env.DDS_AUTH_PREVIEW_PATH });
    await page.setViewportSize({ width: 320, height: 900 });
  }
  await page.getByRole("button", { name: "테마 변경" }).click();
  const mark = panel.locator('[data-provider="x"] [data-packaged-mark]');
  await expect(mark).toHaveCSS("background-image", /x-symbol-light\.png/);
  expect(await mark.evaluate(async (element) => {
    const url = getComputedStyle(element).backgroundImage.slice(5, -2);
    const image = new Image();
    image.src = url;
    await image.decode();
    return image.naturalWidth;
  })).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await panel.getByRole("button", { name: "Continue with Discord" }).click();
  await expect(page.getByLabel("시뮬레이션 이동 주소")).toHaveText("https://auth.example.test/authorize");
});
