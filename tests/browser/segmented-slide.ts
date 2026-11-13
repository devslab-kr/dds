import { expect, type Locator } from "@playwright/test";

/**
 * The segmented control's sliding face (D-055), the same in every framework: one indicator
 * in the track, on the chosen item's box; the chosen item draws no face of its own once the
 * indicator is placed; choosing another item moves the indicator there.
 */
export async function expectSlidingFace(group: Locator, otherLabel: string) {
  const indicator = group.locator(".dds-segmented__track > .dds-segmented__indicator");
  await expect(indicator).toHaveCount(1);
  await expect(indicator).toBeVisible();
  const box = async (locator: Locator) => (await locator.boundingBox())!;
  const near = (a: number, b: number) => Math.abs(a - b) <= 1;
  const sameBox = async (item: Locator) => {
    await expect.poll(async () => {
      const [i, c] = [await box(indicator), await box(item)];
      return near(i.x, c.x) && near(i.width, c.width) && near(i.y, c.y) && near(i.height, c.height);
    }).toBe(true);
  };
  const checked = group.locator('.dds-segmented__item[data-state="checked"]');
  await sameBox(checked);
  // One face: the chosen item's own background and edge give way to the indicator.
  expect(await checked.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe("rgba(0, 0, 0, 0)");
  expect(await indicator.evaluate((el) => getComputedStyle(el).boxShadow)).not.toBe("none");
  const other = group.locator(".dds-segmented__item", { hasText: otherLabel });
  await other.click();
  await expect(other).toHaveAttribute("data-state", "checked");
  // It travels rather than jumps: a change of choice runs a transition on its position. The
  // transition lasts 200ms and is switched off when it ends, so it is watched for, not sampled.
  await expect
    .poll(() => indicator.evaluate((el) => getComputedStyle(el).transitionProperty), { intervals: [10], timeout: 2_000 })
    .toContain("left");
  await sameBox(other);
}
