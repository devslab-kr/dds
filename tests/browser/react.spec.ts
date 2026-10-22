import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("grid", { name: "DDS 고객 목록" })).toBeVisible();
});
test("ui controlled controls and Ark keyboard navigation", async ({ page }) => {
  await page.getByRole("checkbox", { name: "약관 동의" }).click();
  await expect(page.getByLabel("동의 상태")).toHaveText("동의");
  await page.getByRole("tab", { name: "첫째" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "둘째" })).toBeFocused();
  await expect(page.getByRole("tabpanel")).toHaveText("둘째 내용");
  await page.getByRole("radio", { name: "한국어", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: "English" })).toBeChecked();
  await page.getByRole("button", { name: "설명 보기" }).hover();
  await expect(page.getByRole("tooltip")).toHaveText("추가 설명");
});
test("ui nested dialog Escape and focus restoration under StrictMode", async ({
  page,
}) => {
  const opener = page.getByRole("button", { name: "대화상자 열기" });
  await opener.click();
  const innerOpener = page.getByRole("button", { name: "안쪽 열기" });
  await expect(innerOpener).toBeFocused();
  await innerOpener.click();
  await expect(page.getByRole("button", { name: "안쪽 작업" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "안쪽 대화상자" })).toHaveCount(
    0,
  );
  await expect(innerOpener).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(opener).toBeFocused();
});
test("ui toast lifecycle and accessible DDS themes", async ({ page }) => {
  await page.getByRole("button", { name: "알림 표시" }).click();
  await expect(page.getByText("저장 완료")).toBeVisible();
  await page.getByRole("button", { name: "알림 닫기" }).click();
  await expect(page.getByText("저장 완료")).toHaveCount(0);
  for (const theme of ["light", "dark"]) {
    if (theme === "dark")
      await page.getByRole("button", { name: "테마 변경" }).click();
    expect(
      (
        await new AxeBuilder({ page })
          .include('section[aria-label="기본 컴포넌트"]')
          .analyze()
      ).violations,
    ).toEqual([]);
  }
});
test("grid actual sort filter selection edit and density", async ({ page }) => {
  const grid = page.getByRole("grid", { name: "DDS 고객 목록" });
  await expect(grid.locator('.ag-cell[col-id="name"] strong')).toHaveText([
    "Beta",
    "Alpha",
    "Gamma",
  ]);
  await grid.getByRole("columnheader", { name: /이름/ }).click();
  await expect(
    grid.getByRole("columnheader", { name: /이름/ }),
  ).toHaveAttribute("aria-sort", "ascending");
  await expect(
    grid.locator('.ag-row[row-index="0"] .ag-cell[col-id="name"] strong'),
  ).toHaveText("Alpha");
  await expect(
    grid.locator('.ag-row[row-index="1"] .ag-cell[col-id="name"] strong'),
  ).toHaveText("Beta");
  await page.getByRole("button", { name: "Alpha 필터", exact: true }).click();
  await expect(grid.locator('.ag-cell[col-id="name"] strong')).toHaveText([
    "Alpha",
  ]);
  await page.getByRole("button", { name: "필터 해제" }).click();
  await grid.locator('.ag-row[row-id="a"] input[type="checkbox"]').check();
  await expect(page.getByLabel("선택 수")).toHaveText("1");
  await grid.locator('.ag-row[row-id="b"] .ag-cell[col-id="name"]').dblclick();
  await grid.locator(".ag-cell-inline-editing input").fill("Edited");
  await page.keyboard.press("Enter");
  await expect(grid.getByText("Edited", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "행 추가" }).click();
  await expect(grid.getByText("Delta", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "밀도 변경" }).click();
  await expect(grid.locator(".ag-row").first()).toHaveCSS("height", "32px");
});
test("grid resizing keyboard themes and narrow viewport", async ({ page }) => {
  const grid = page.getByRole("grid", { name: "DDS 고객 목록" });
  const header = grid.locator('.ag-header-cell[col-id="name"]');
  const before = await header.boundingBox();
  const handle = header.locator(".ag-header-cell-resize");
  const box = await handle.boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + 70, box!.y + box!.height / 2);
  await page.mouse.up();
  expect((await header.boundingBox())!.width).toBeGreaterThan(
    before!.width + 40,
  );
  const cell = grid.locator('.ag-row[row-id="b"] .ag-cell[col-id="name"]');
  await cell.click();
  await page.keyboard.press("ArrowRight");
  await expect(
    grid.locator('.ag-row[row-id="b"] .ag-cell[col-id="amount"]'),
  ).toBeFocused();
  expect(
    (
      await new AxeBuilder({ page })
        .include('section[aria-label="테이블 예제"]')
        .analyze()
    ).violations,
  ).toEqual([]);
  const light = await page
    .locator(".dds-data-grid .ag-root-wrapper")
    .evaluate((element) => getComputedStyle(element).backgroundColor);
  await page.getByRole("button", { name: "테마 변경" }).click();
  await expect(page.locator(".dds-data-grid .ag-root-wrapper")).not.toHaveCSS(
    "background-color",
    light,
  );
  expect(
    (
      await new AxeBuilder({ page })
        .include('section[aria-label="테이블 예제"]')
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.setViewportSize({ width: 375, height: 812 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(375);
  await expect(grid).toBeVisible();
});

test.describe("touch and media policies", () => {
  test.use({ hasTouch: true, viewport: { width: 375, height: 812 } });
  test("ui long labels and RTL retain touch targets and keyboard focus", async ({
    page,
  }) => {
    const button = page.getByRole("button", {
      name: "Benachrichtigungseinstellungen speichern",
    });
    expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    expect(
      await button.evaluate(
        (element) => element.scrollWidth <= element.clientWidth,
      ),
    ).toBe(true);
    await page
      .locator("main")
      .evaluate((element) => element.setAttribute("dir", "rtl"));
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(375);
    await page.emulateMedia({
      forcedColors: "active",
      reducedMotion: "reduce",
    });
    await page.getByRole("tab", { name: "첫째" }).focus();
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByRole("tab", { name: "둘째" })).toBeFocused();
    expect(
      (
        await new AxeBuilder({ page })
          .include('section[aria-label="기본 컴포넌트"]')
          .analyze()
      ).violations,
    ).toEqual([]);
  });
});

for (const width of [1280, 390]) {
  test(`ui console disclosures preserve visibility and keyboard access at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/console");
    if (width < 900) await page.getByRole("button", { name: "Open menu" }).click();
    const settings = page.getByRole("button", { name: "Settings", exact: true });
    const services = page.getByRole("button", { name: "Services", exact: true });
    await expect(page.getByRole("link", { name: "Policies", exact: true })).toHaveCount(0);
    await settings.focus(); await page.keyboard.press("Enter");
    await expect(page.getByRole("link", { name: "Policies", exact: true })).toBeVisible();
    await expect(services).toHaveAttribute("aria-expanded", "true");
    await services.focus(); await page.keyboard.press("Space");
    await expect(page.getByRole("link", { name: "Products", exact: true })).toHaveCount(0);
    await expect(services).toBeFocused();
    expect((await new AxeBuilder({ page }).include('.dds-console-rail__nav').analyze()).violations).toEqual([]);
    await settings.click();
    await expect(page.locator('a[data-nav="demo.policies"]')).toBeHidden();
    if (width < 900) {
      await page.keyboard.press("Escape");
      await expect(page.getByRole("button", { name: "Open menu" })).toHaveAttribute("aria-expanded", "false");
    }
  });
}
