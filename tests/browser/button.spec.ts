import { expect, test, type Page } from "@playwright/test";

// Loading Button contract (docs/decisions.md D-043): a loading button keeps
// the box its label gives it, keeps its accessible name, paints only the
// spinner (centred, 3:1 or better) and blocks the pointer. The fixture
// (tests/fixtures/components/{react,solid}/button.tsx) renders every Button
// tone × size × content and every IconButton tone × size; one toggle flips
// them all to loading.

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Geometry {
  key: string;
  name: string;
  box: Rect;
  neighbour: number;
  spinner?: Rect;
}

async function geometry(page: Page): Promise<Geometry[]> {
  return page.locator("[data-case]").evaluateAll((cases) =>
    cases.map((item) => {
      const rect = (element: Element) => {
        const { x, y, width, height } = element.getBoundingClientRect();
        return { x, y, width, height };
      };
      const button = item.querySelector("button")!;
      const spinner = button.querySelector(".dds-spinner");
      return {
        key: item.getAttribute("data-case")!,
        name: item.getAttribute("data-name")!,
        box: rect(button),
        neighbour: item.querySelector(".button-after")!.getBoundingClientRect().x,
        spinner: spinner ? rect(spinner) : undefined,
      };
    }),
  );
}

// Runs colour transitions to their end and holds every spinner at 0deg: a
// still final frame for the pixels, and an untransformed box for the centre
// and gap checks.
async function settle(page: Page) {
  await page.mouse.move(0, 0);
  await page.evaluate(() => {
    for (const animation of document.getAnimations()) {
      const target = animation.effect instanceof KeyframeEffect ? animation.effect.target : null;
      if (target?.classList.contains("dds-spinner")) {
        animation.pause();
        animation.currentTime = 0;
      } else {
        animation.finish();
      }
    }
  });
}

async function startLoading(page: Page) {
  await page.getByRole("button", { name: "Toggle loading" }).click();
  await expect(page.locator("[data-case] button[aria-busy='true']")).toHaveCount(
    await page.locator("[data-case]").count(),
  );
  await settle(page);
}

interface Paint {
  key: string;
  // Largest channel difference from the button's own background over the
  // label area (4px inside the edges, spinner excluded): 0 = nothing painted.
  ink: number;
  // Best WCAG contrast of a spinner pixel against that background.
  spinner: number;
  // Contrast at the top of the ring (its gap) and at its right side.
  gap: number;
  arc: number;
}

// Reads every loading button's rendered pixels from a real screenshot, so the
// checks see what is painted (opacity and forced colors included), not what
// the CSS says.
async function paint(page: Page): Promise<Paint[]> {
  const results: Paint[] = [];
  for (const item of await page.locator("[data-case]").all()) {
    const button = item.locator("button");
    const png = await button.screenshot();
    results.push(
      await button.evaluate(async (element, base64) => {
        const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
        const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const context = canvas.getContext("2d")!;
        context.drawImage(bitmap, 0, 0);
        const { data, width, height } = context.getImageData(0, 0, bitmap.width, bitmap.height);
        const box = element.getBoundingClientRect();
        const ring = element.querySelector(".dds-spinner")!.getBoundingClientRect();
        const sx = width / box.width;
        const sy = height / box.height;
        const at = (x: number, y: number) => {
          const row = Math.min(height - 1, Math.floor(y * sy));
          const column = Math.min(width - 1, Math.floor(x * sx));
          const i = (row * width + column) * 4;
          return [data[i]!, data[i + 1]!, data[i + 2]!];
        };
        const luminance = (rgb: number[]) => {
          const [r, g, b] = rgb.map((value) => {
            const c = value / 255;
            return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
          });
          return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
        };
        const contrast = (a: number[], b: number[]) => {
          const [high, low] = [luminance(a), luminance(b)].sort((p, q) => q - p);
          return (high! + 0.05) / (low! + 0.05);
        };
        // 3px down the middle is inside the border and the top padding.
        const background = at(box.width / 2, 3);
        const left = ring.x - box.x;
        const top = ring.y - box.y;
        const right = left + ring.width;
        const bottom = top + ring.height;
        let ink = 0;
        let spinner = 1;
        for (let y = 0; y < height; y += 1) {
          for (let x = 0; x < width; x += 1) {
            const cssX = x / sx;
            const cssY = y / sy;
            const i = (y * width + x) * 4;
            const rgb = [data[i]!, data[i + 1]!, data[i + 2]!];
            if (cssX >= left - 2 && cssX <= right + 2 && cssY >= top - 2 && cssY <= bottom + 2) {
              spinner = Math.max(spinner, contrast(rgb, background));
            } else if (cssX >= 4 && cssX <= box.width - 4 && cssY >= 4 && cssY <= box.height - 4) {
              ink = Math.max(ink, ...rgb.map((value, channel) => Math.abs(value - background[channel]!)));
            }
          }
        }
        return {
          key: element.closest("[data-case]")!.getAttribute("data-case")!,
          ink,
          spinner,
          gap: contrast(at((left + right) / 2, top + 1), background),
          arc: contrast(at(right - 1, (top + bottom) / 2), background),
        };
      }, png.toString("base64")),
    );
  }
  return results;
}

function expectOnlySpinnerPainted(results: Paint[]) {
  expect(results.length).toBeGreaterThan(0);
  for (const result of results) {
    expect.soft(result.ink, `${result.key}: label pixels painted while loading`).toBeLessThanOrEqual(8);
    expect.soft(result.spinner, `${result.key}: spinner contrast`).toBeGreaterThanOrEqual(3);
    expect.soft(result.arc, `${result.key}: spinner arc contrast`).toBeGreaterThanOrEqual(3);
    expect.soft(result.gap, `${result.key}: spinner gap`).toBeLessThan(1.2);
  }
}

for (const [framework, port] of [
  ["React", 5281],
  ["Solid", 5282],
] as const) {
  test.describe(`${framework} loading buttons`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`http://127.0.0.1:${port}/button.html`);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(framework);
    });

    for (const dir of ["ltr", "rtl"] as const)
      test(`keep each box, neighbour and name, and centre the spinner (${dir})`, async ({ page }) => {
        await page.evaluate((value) => {
          document.documentElement.dir = value;
        }, dir);
        const idle = await geometry(page);
        await startLoading(page);
        const loading = await geometry(page);
        expect(loading.map((item) => item.key)).toEqual(idle.map((item) => item.key));
        for (const [index, before] of idle.entries()) {
          const after = loading[index]!;
          for (const side of ["x", "y", "width", "height"] as const)
            expect.soft(Math.abs(after.box[side] - before.box[side]), `${before.key}: ${side}`).toBeLessThan(0.01);
          expect.soft(Math.abs(after.neighbour - before.neighbour), `${before.key}: neighbour moved`).toBeLessThan(0.01);
          const spinner = after.spinner!;
          const centre = (rect: Rect) => [rect.x + rect.width / 2, rect.y + rect.height / 2];
          const [spinnerX, spinnerY] = centre(spinner);
          const [boxX, boxY] = centre(after.box);
          expect.soft(Math.abs(spinnerX! - boxX!), `${before.key}: spinner x centre`).toBeLessThan(0.5);
          expect.soft(Math.abs(spinnerY! - boxY!), `${before.key}: spinner y centre`).toBeLessThan(0.5);
          await expect.soft(page.locator(`[data-case="${before.key}"] button`)).toHaveAccessibleName(before.name);
        }
        // The pointer cannot activate a loading button.
        for (const item of loading.slice(0, 3))
          await page.mouse.click(item.box.x + item.box.width / 2, item.box.y + item.box.height / 2);
        await expect(page.getByLabel("Clicks")).toHaveText("0");
      });

    test("paint only the spinner, at 3:1 or better, in light and dark", async ({ page }) => {
      await startLoading(page);
      for (const theme of ["light", "dark"]) {
        await page.evaluate((value) => {
          document.documentElement.dataset.theme = value;
        }, theme);
        await settle(page);
        expectOnlySpinnerPainted(await paint(page));
      }
    });

    test("keep the label hidden and the spinner's gap open in forced colors", async ({ page }) => {
      await page.emulateMedia({ forcedColors: "active" });
      await startLoading(page);
      expectOnlySpinnerPainted(await paint(page));
      // Opted out of forced colors, a fading background would show the brand
      // color it no longer forces for the length of the fade.
      const fading = await page.locator("[data-case] button.dds-btn").evaluateAll((buttons) =>
        buttons.filter((button) => {
          const style = getComputedStyle(button);
          return style.transitionProperty !== "none" && style.transitionDuration.split(",").some((value) => Number.parseFloat(value) > 0);
        }).length,
      );
      expect(fading).toBe(0);
    });

    test("slow the spinner down instead of stopping it under reduced motion", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.getByRole("button", { name: "Toggle loading" }).click();
      const spinners = page.locator("[data-case] .dds-spinner");
      await expect(spinners).toHaveCount(await page.locator("[data-case]").count());
      const timings = await spinners.evaluateAll((elements) =>
        elements.map((element) => {
          const [animation] = element.getAnimations();
          const timing = animation?.effect?.getComputedTiming();
          return {
            running: animation?.playState === "running",
            endless: timing?.iterations === Infinity,
            duration: Number(timing?.duration),
          };
        }),
      );
      for (const timing of timings) {
        expect.soft(timing.running).toBe(true);
        expect.soft(timing.endless).toBe(true);
        expect.soft(timing.duration).toBeGreaterThan(800);
      }
    });

    test.describe("on a touch screen", () => {
      test.use({ hasTouch: true, isMobile: true, viewport: { width: 412, height: 915 } });
      test("keep the 44px touch height and the same box", async ({ page }) => {
        expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(true);
        const idle = await geometry(page);
        await startLoading(page);
        const loading = await geometry(page);
        for (const [index, before] of idle.entries()) {
          const after = loading[index]!;
          expect.soft(before.box.height, `${before.key}: touch height`).toBeGreaterThanOrEqual(44);
          expect.soft(Math.abs(after.box.width - before.box.width), `${before.key}: width`).toBeLessThan(0.01);
          expect.soft(Math.abs(after.box.height - before.box.height), `${before.key}: height`).toBeLessThan(0.01);
        }
      });
    });
  });
}
