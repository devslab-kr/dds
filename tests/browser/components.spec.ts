import { expect, test, type Locator } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function expectActiveOption(control: Locator, label: string) {
  await expect
    .poll(() => control.getAttribute("aria-activedescendant"))
    .toBeTruthy();
  const activeId = await control.getAttribute("aria-activedescendant");
  await expect(control.page().locator(`[id="${activeId}"]`)).toHaveText(label);
  await expect(control.page().locator(`[id="${activeId}"]`)).toBeVisible();
}
for (const [framework, port] of [
  ["React", 5281],
  ["Solid", 5282],
] as const) {
  test.describe(framework, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`http://127.0.0.1:${port}`);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(
        framework,
      );
    });
    for (const width of [1280, 390])
      test(`toasts take the width of their text and stay on screen at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 });
        await page.getByRole("button", { name: "Show short notice" }).click();
        await page.getByRole("button", { name: "Show long notice" }).click();
        const toasts = page.locator(".dds-toast");
        await expect(toasts).toHaveCount(2);
        await expect(page.getByRole("alert")).toContainText("관리자에게 문의해 주세요.");
        const long = await page.getByRole("alert").boundingBox();
        const short = await toasts.filter({ hasText: "저장했습니다." }).boundingBox();
        // The region has no width of its own, so a toast that shrink-wraps to it collapses to a few characters.
        expect(long!.width).toBeGreaterThan(Math.min(320, width - 64));
        expect(long!.width).toBeLessThanOrEqual(360);
        expect(short!.width).toBeGreaterThan(120);
        expect(short!.width).toBeLessThan(long!.width);
        for (const box of [long!, short!]) {
          expect(box.x).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width).toBeLessThanOrEqual(width);
        }
        // The text stays inside its box (Korean word breaking itself is each product's root rule, D-030).
        const text = await page.getByRole("alert").locator('[data-part="description"]').boundingBox();
        expect(text!.x + text!.width).toBeLessThanOrEqual(long!.x + long!.width);
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
      });
    test("general inputs preserve native form validity, reset and pointer-clear focus", async ({
      page,
    }) => {
      const email = page.getByRole("textbox", { name: "Email", exact: true });
      await expect(email).toHaveAttribute("type", "email");
      await expect(
        page.getByLabel("Password", { exact: true }),
      ).toHaveAttribute("type", "password");
      await expect(
        page.getByRole("searchbox", { name: "Search", exact: true }),
      ).toHaveAttribute("type", "search");
      await page.getByRole("button", { name: "Submit input form" }).click();
      await expect(page.getByLabel("Submitted email")).toHaveText(
        "name@example.com",
      );
      await email.focus();
      await email.evaluate((input) => {
        (window as any).emailBlurCount = 0;
        input.addEventListener("blur", () => {
          (window as any).emailBlurCount++;
        });
      });
      await page.getByRole("button", { name: "내용 지우기" }).click();
      await expect(email).toHaveValue("");
      await expect(email).toBeFocused();
      expect(await page.evaluate(() => (window as any).emailBlurCount)).toBe(0);
      await page.getByRole("button", { name: "Submit input form" }).click();
      await expect(email).toBeFocused();
      expect(
        await email.evaluate(
          (input) => (input as HTMLInputElement).validity.valueMissing,
        ),
      ).toBe(true);
      await page.getByRole("button", { name: "Reset input form" }).click();
      await expect(email).toHaveValue("name@example.com");
    });
    test("floating and hidden labels remain accessible and do not overlap editable text", async ({
      page,
    }) => {
      for (const width of [1000, 375]) {
        await page.setViewportSize({ width, height: 900 });
        const input = page.getByLabel("Floating label", { exact: true });
        await input.focus();
        await input.fill("Typed value");
        const geometry = await input.evaluate((element) => {
          const input = element as HTMLInputElement,
            label = input.parentElement!.querySelector("label")!;
          const box = input.getBoundingClientRect(),
            labelBox = label.getBoundingClientRect(),
            style = getComputedStyle(input);
          return {
            labelBottom: labelBox.bottom,
            textTop: box.top + parseFloat(style.paddingTop),
            labelLeft: labelBox.left,
            inputRight: box.right,
          };
        });
        expect(geometry.labelBottom).toBeLessThanOrEqual(geometry.textTop + 2);
        expect(geometry.labelLeft).toBeLessThan(geometry.inputRight);
        const hidden = page.locator("label").filter({ hasText: /^Search$/ });
        expect(
          await hidden.evaluate(
            (element) => element.getBoundingClientRect().height,
          ),
        ).toBeLessThanOrEqual(1);
        await expect(input).toHaveValue("Typed value");
      }
    });
    for (const kind of ["combo", "select"] as const) {
      test(`10k ${kind} keeps far keyboard targets rendered and DOM bounded`, async ({
        page,
      }) => {
        const control = page.getByRole("combobox", {
          name: kind === "combo" ? "Virtual combo" : "Virtual select",
          exact: true,
        });
        await control.focus();
        await page.keyboard.press("ArrowDown");
        await expect(page.getByRole("listbox")).toBeVisible();
        await page.keyboard.press("End");
        await expectActiveOption(
          kind === "combo" ? control : page.getByRole("listbox"),
          "Option 09999",
        );
        expect(await page.getByRole("option").count()).toBeLessThanOrEqual(30);
        await page.keyboard.press("Enter");
        await expect(
          page.getByLabel(kind === "combo" ? "Combo value" : "Select value", {
            exact: true,
          }),
        ).toHaveText("item-9999");
        await control.focus();
        await page.keyboard.press("ArrowDown");
        await expect(
          page.getByRole("option", { name: "Option 09999", exact: true }),
        ).toBeVisible();
        await page.keyboard.press("Escape");
        if (kind === "combo") {
          await control.fill("Option 00012");
          await page.keyboard.press("ArrowDown");
          await expect(page.getByRole("option")).toHaveCount(1);
          await expect(page.getByRole("option")).toHaveText("Option 00012");
        }
      });
    }
    test("custom required choice redirects invalid focus, submits IDs and resets", async ({
      page,
    }) => {
      const form = page.getByRole("form", { name: "Choice form" }),
        control = page.getByRole("combobox", {
          name: "Required choice",
          exact: true,
        });
      await page.getByRole("button", { name: "Submit choice form" }).click();
      await expect(control).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("End");
      await page.keyboard.press("Enter");
      expect(
        await form.evaluate((element) =>
          new FormData(element as HTMLFormElement).get("choice"),
        ),
      ).toBe("item-2");
      await page.getByRole("button", { name: "Reset choice form" }).click();
      expect(
        await form.evaluate((element) =>
          new FormData(element as HTMLFormElement).get("choice"),
        ),
      ).toBe("");
    });
    test("external result replacement retains selected label and ID", async ({
      page,
    }) => {
      const control = page.getByRole("combobox", {
        name: "External combo",
        exact: true,
      });
      await expect(control).toHaveValue("Saved selection");
      await page.getByRole("button", { name: "Replace results" }).click();
      await expect(control).toHaveValue("Saved selection");
      await expect(page.getByLabel("External value")).toHaveText("saved");
      await control.fill("unmatched query");
      await page.keyboard.press("ArrowDown");
      await expect(
        page.getByRole("option", { name: "New result", exact: true }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await page.getByRole("heading", { level: 1 }).click();
      await expect(control).toHaveValue("Saved selection");
    });
    test("menu keyboard action and nested popover Escape preserve parent dialog", async ({
      page,
    }) => {
      const actions = page.getByRole("button", {
        name: "Actions",
        exact: true,
      });
      await actions.focus();
      await page.keyboard.press("ArrowDown");
      await expect(page.getByRole("menu")).toBeVisible();
      await page.keyboard.press("Enter");
      await expect(page.getByLabel("Action value")).toHaveText("export");
      const opener = page.getByRole("button", {
        name: "Open dialog",
        exact: true,
      });
      await opener.click();
      const parent = page.getByRole("dialog", {
        name: "Parent dialog",
        exact: true,
      });
      await expect(parent).toBeVisible();
      const nested = page.getByRole("button", {
        name: "Nested popover",
        exact: true,
      });
      await nested.click();
      await expect(
        page.getByText("Nested details", { exact: true }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(
        page.getByText("Nested details", { exact: true }),
      ).toBeHidden();
      await expect(parent).toBeVisible();
      await expect(nested).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(parent).toBeHidden();
      await expect(opener).toBeFocused();
    });
    test("calendar keyboard selection and popup share date-only values", async ({
      page,
    }) => {
      const calendar = page.locator(".dds-calendar"),
        selected = calendar.locator(
          '[data-part="table-cell-trigger"][data-selected]',
        );
      await selected.focus();
      await page.keyboard.press("ArrowRight");
      await expect(
        calendar.getByRole("button", {
          name: "Choose Sunday, October 18, 2026",
          exact: true,
        }),
      ).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.getByLabel("Calendar value")).toHaveText("2026-10-18");
      const input = page.getByRole("textbox", {
        name: "Picked date",
        exact: true,
      });
      await input.fill("2026-02-30");
      await input.press("Tab");
      await expect(input).toHaveValue("2026-02-30");
      await expect(page.getByLabel("Picked value")).toHaveText("2026-10-17");
      await input.fill("2026-10-20");
      await input.press("Tab");
      await expect(page.getByLabel("Picked value")).toHaveText("2026-10-20");
      await page
        .getByRole("button", { name: "Picked date Open calendar", exact: true })
        .click();
      await expect(
        page.locator(".dds-date-picker-positioner .dds-date-picker-content"),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(
        page.locator(".dds-date-picker-positioner .dds-date-picker-content"),
      ).toBeHidden();
    });
    test("composing Enter does not submit input form and inputs pass axe", async ({
      page,
    }) => {
      const search = page.getByRole("searchbox", {
        name: "Search",
        exact: true,
      });
      await search.focus();
      expect(
        await search.evaluate((element) => {
          const event = new KeyboardEvent("keydown", {
            key: "Enter",
            isComposing: true,
            bubbles: true,
            cancelable: true,
          });
          element.dispatchEvent(event);
          return event.defaultPrevented;
        }),
      ).toBe(true);
      await expect(page.getByLabel("Submitted email")).toHaveText("");
      expect(
        (
          await new AxeBuilder({ page })
            .include('section[aria-label="General inputs"]')
            .analyze()
        ).violations,
      ).toEqual([]);
    });

    test("inside empty SelectPicker separates its label from placeholder", async ({
      page,
    }) => {
      const control = page.getByRole("combobox", {
        name: "Inside empty select",
        exact: true,
      });
      const root = control.locator(
        'xpath=ancestor::*[contains(concat(" ",normalize-space(@class)," ")," dds-choice ")][1]',
      );
      const text = root.locator(".dds-choice-value");
      await expect(control).toBeVisible();
      expect(
        await text.evaluate((element) => getComputedStyle(element).visibility),
      ).toBe("hidden");
      await control.focus();
      await expect(text).toBeVisible();
      const geometry = await root.evaluate((element) => {
        const label = element.querySelector("label")!.getBoundingClientRect(),
          text = element
            .querySelector(".dds-choice-value")!
            .getBoundingClientRect();
        return { labelBottom: label.bottom, textTop: text.top };
      });
      expect(geometry.labelBottom).toBeLessThanOrEqual(geometry.textTop + 2);
    });
    test("menu checkboxes radios and anchors retain native behavior", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "Actions", exact: true }).click();
      const checkbox = page.getByRole("menuitemcheckbox", {
        name: "Notifications",
        exact: true,
      });
      await checkbox.click();
      await expect(checkbox).toHaveAttribute("aria-checked", "true");
      await expect(page.getByLabel("Notifications value")).toHaveText("on");
      const compact = page.getByRole("menuitemradio", {
        name: "Compact",
        exact: true,
      });
      await compact.click();
      await expect(compact).toHaveAttribute("aria-checked", "true");
      await expect(
        page.getByRole("menuitemradio", { name: "Comfortable", exact: true }),
      ).toHaveAttribute("aria-checked", "false");
      await expect(page.getByLabel("Density value")).toHaveText("compact");
      const link = page.getByRole("menuitem", {
        name: "Open linked destination",
        exact: true,
      });
      expect(await link.evaluate((element) => element.tagName)).toBe("A");
      await expect(link).toHaveAttribute("href", "#menu-link-target");
      await link.click();
      await expect(page).toHaveURL(/#menu-link-target$/);
    });
    test("submenu keyboard direction follows LTR and RTL", async ({ page }) => {
      for (const direction of ["ltr", "rtl"]) {
        if (direction === "rtl")
          await page
            .getByRole("button", { name: "Toggle menu direction" })
            .click();
        await expect(page.getByLabel("Menu direction")).toHaveText(direction);
        const trigger = page.getByRole("button", {
          name: "Actions",
          exact: true,
        });
        await trigger.focus();
        await page.keyboard.press("ArrowDown");
        await page.keyboard.press("Home");
        await page.keyboard.press("ArrowDown");
        await expectActiveOption(
          page.getByRole("menu", { name: "Actions", exact: true }),
          "More actions",
        );
        await page.keyboard.press(
          direction === "rtl" ? "ArrowLeft" : "ArrowRight",
        );
        await expect(
          page.getByRole("menu", { name: "More actions", exact: true }),
        ).toBeVisible();
        await page.keyboard.press("Enter");
        await expect(page.getByLabel("Action value")).toHaveText("archive");
      }
    });
    test("Dialog choice composition cannot commit and Escape closes one layer", async ({
      page,
    }) => {
      const opener = page.getByRole("button", {
        name: "Open dialog",
        exact: true,
      });
      await opener.click();
      const parent = page.getByRole("dialog", {
          name: "Parent dialog",
          exact: true,
        }),
        combo = page.getByRole("combobox", {
          name: "Dialog combo",
          exact: true,
        });
      await expect(parent).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Nested popover", exact: true }),
      ).toBeFocused();
      await combo.focus();
      await expect(combo).toBeFocused();
      await expect(parent).toBeVisible();
      await page.keyboard.press("ArrowDown");
      await expect(page.getByRole("listbox")).toBeVisible();
      await combo.dispatchEvent("compositionstart", { data: "한" });
      await page.keyboard.press("Enter");
      await expect(page.getByLabel("Dialog choice value")).toHaveText("");
      await expect(page.getByRole("listbox")).toBeVisible();
      await combo.dispatchEvent("compositionend", { data: "한" });
      await page.keyboard.press("Escape");
      await expect(page.getByRole("listbox")).toBeHidden();
      await expect(parent).toBeVisible();
      await expect(combo).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(parent).toBeHidden();
      await expect(opener).toBeFocused();
    });
    test("focused choices calendar menu and popover pass browser axe", async ({
      page,
    }) => {
      test.setTimeout(90000);
      const combo = page.getByRole("combobox", {
        name: "Virtual combo",
        exact: true,
      });
      await combo.focus();
      await page.keyboard.press("ArrowDown");
      expect(
        (
          await new AxeBuilder({ page })
            .include('section[aria-label="Virtual choices"]')
            .include('.dds-choice-content[data-state="open"]')
            .analyze()
        ).violations,
      ).toEqual([]);
      await page.keyboard.press("Escape");
      await page
        .locator(
          '.dds-calendar [data-part="table-cell-trigger"][data-selected]',
        )
        .focus();
      expect(
        (
          await new AxeBuilder({ page })
            .include('section[aria-label="Calendars"]')
            .analyze()
        ).violations,
      ).toEqual([]);
      await page.getByRole("button", { name: "Actions", exact: true }).click();
      await page
        .getByRole("menuitemcheckbox", { name: "Notifications", exact: true })
        .hover();
      expect(
        (
          await new AxeBuilder({ page })
            .include('.dds-menu[data-state="open"]')
            .analyze()
        ).violations,
      ).toEqual([]);
      await page.keyboard.press("Escape");
      await page
        .getByRole("button", { name: "Open standalone popover", exact: true })
        .click();
      await expect(
        page.getByText("Review the available options", { exact: true }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Close popover options", exact: true })
        .focus();
      expect(
        (
          await new AxeBuilder({ page })
            .include('.dds-popover[data-state="open"]')
            .analyze()
        ).violations,
      ).toEqual([]);
    });
  });
}

for (const [framework, port] of [
  ["React", 5281],
  ["Solid", 5282],
] as const) {
  test(`${framework} DatePicker stays accessible inside a modal and dismisses one layer`, async ({
    page,
  }) => {
    await page.goto(`http://127.0.0.1:${port}`);
    const opener = page.getByRole("button", {
      name: "Open dialog",
      exact: true,
    });
    await opener.click();
    const modal = page.getByRole("dialog", {
      name: "Parent dialog",
      exact: true,
    });
    await expect(modal).toBeVisible();
    const input = modal.getByRole("textbox", {
        name: "Nested date",
        exact: true,
      }),
      trigger = modal.getByRole("button", {
        name: "Nested date Open calendar",
        exact: true,
      });
    await trigger.click();
    const day = page.getByRole("button", {
      name: "Choose Sunday, October 18, 2026",
      exact: true,
    });
    await expect(day).toBeVisible();
    expect(
      await day.evaluate((element) =>
        element.closest('[aria-hidden="true"],[inert]'),
      ),
    ).toBeNull();
    await day.click();
    await expect(input).toHaveValue("2026-10-18");
    await expect(input).toBeFocused();
    await trigger.click();
    await expect(day).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(modal).toBeVisible();
    await expect(trigger).toBeFocused();
    await expect(day).toBeHidden();
    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();
    await expect(opener).toBeFocused();
  });
}

// Solid-only until React parity lands (DDS 0.24 adds these to dds-solid first).
test.describe("Solid SegmentedControl and NumberInput", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://127.0.0.1:5282");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Solid");
  });
  test("segmented control moves and selects with arrow keys and submits the item ID", async ({ page }) => {
    const group = page.getByRole("radiogroup", { name: "View", exact: true });
    const day = group.getByRole("radio", { name: "Day", exact: true });
    await day.focus();
    await page.keyboard.press("ArrowRight");
    await expect(group.getByRole("radio", { name: "Week", exact: true })).toBeChecked();
    await expect(group.getByRole("radio", { name: "Week", exact: true })).toBeFocused();
    await expect(page.getByLabel("View value")).toHaveText("week");
    await expect(group.locator('.dds-segmented__item[data-state="checked"]')).toHaveText("Week");
    await expect(group.locator(".dds-segmented__item[data-focus-visible]")).toHaveText("Week");
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByLabel("View value")).toHaveText("day");
    await group.getByText("Month", { exact: true }).click();
    await expect(page.getByLabel("View value")).toHaveText("month");
    const filter = page.getByRole("radiogroup", { name: "Status filter", exact: true });
    await expect(filter.getByRole("radio", { name: "완료", exact: true })).toBeDisabled();
    const long = filter.locator(".dds-segmented__item", { hasText: "보류 중인 요청 전체 보기" });
    await expect(long).toHaveAttribute("title", "보류 중인 요청 전체 보기");
    await page.getByRole("button", { name: "Submit number form" }).click();
    await expect(page.getByLabel("Number submission")).toHaveText("month|15000");
  });
  test("number input formats, steps, clamps on blur, ignores the wheel and submits the plain number", async ({ page }) => {
    const amount = page.getByRole("spinbutton", { name: "Amount", exact: true });
    await expect(amount).toHaveValue("15,000");
    await expect(amount).toHaveAttribute("aria-valuetext", "15,000 원");
    await amount.focus();
    await page.keyboard.press("ArrowUp");
    await expect(page.getByLabel("Amount value")).toHaveText("15001");
    await page.keyboard.press("PageDown");
    await expect(page.getByLabel("Amount value")).toHaveText("14991");
    await page.keyboard.press("End");
    await expect(page.getByLabel("Amount value")).toHaveText("1000000");
    await expect(amount).toHaveValue("1,000,000");
    await amount.hover();
    await page.mouse.wheel(0, 300);
    await expect(page.getByLabel("Amount value")).toHaveText("1000000");
    await amount.fill("");
    await expect(page.getByLabel("Amount value")).toHaveText("empty");
    await amount.pressSequentially("12345678");
    await expect(amount).toHaveAttribute("aria-invalid", "true");
    await amount.blur();
    await expect(amount).toHaveValue("1,000,000");
    await expect(page.getByLabel("Amount value")).toHaveText("1000000");
    await amount.fill("");
    await amount.pressSequentially("ab-1.5");
    await expect(amount).toHaveValue("15");
    await page.getByRole("button", { name: "Submit number form" }).click();
    await expect(page.getByLabel("Number submission")).toHaveText("day|15");
    const quantity = page.getByRole("spinbutton", { name: "Quantity", exact: true });
    await expect(page.getByRole("button", { name: "Decrease" }).first()).toBeDisabled();
    await page.getByRole("button", { name: "Increase" }).first().click();
    await expect(quantity).toHaveValue("2");
    await expect(page.getByRole("button", { name: "Decrease" }).first()).toBeEnabled();
  });
  for (const width of [1280, 390])
    test(`segmented and number controls match Input height and edges without clipping at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const grid = page.locator(".control-grid");
      const input = await grid.locator(".dds-input__control").boundingBox();
      const number = await grid.locator(".dds-number-input__control").boundingBox();
      const track = await grid.locator(".dds-segmented__track").boundingBox();
      expect(input!.height).toBe(40);
      expect(number!.height).toBe(40);
      expect(track!.height).toBe(40);
      if (width === 390) {
        expect(number!.x).toBe(input!.x);
        expect(number!.width).toBe(input!.width);
      } else expect(number!.y).toBe(input!.y);
      for (const control of await page.locator(".dds-number-input__control").all()) {
        const box = (await control.boundingBox())!;
        const steps = await control.locator(".dds-number-input__step").all();
        for (const step of steps) {
          const stepBox = (await step.boundingBox())!;
          expect(stepBox.width).toBeGreaterThanOrEqual(32);
          expect(stepBox.x + stepBox.width).toBeLessThanOrEqual(box.x + box.width);
        }
        const field = control.locator(".dds-number-input__field");
        const fieldBox = (await field.boundingBox())!;
        const suffix = control.locator(".dds-number-input__suffix");
        if (await suffix.count()) {
          const suffixBox = (await suffix.boundingBox())!;
          expect(suffixBox.x).toBeGreaterThanOrEqual(fieldBox.x + fieldBox.width - 0.5);
          expect(suffixBox.x + suffixBox.width).toBeLessThanOrEqual((await steps[0]!.boundingBox())!.x + 0.5);
        }
        expect(await field.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
      }
      const segments = page.getByRole("radiogroup", { name: "View", exact: true }).locator(".dds-segmented__item");
      const heights = new Set<number>();
      for (const segment of await segments.all()) {
        heights.add((await segment.boundingBox())!.height);
        expect(await segment.locator(".dds-segmented__text").evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
      }
      expect(heights.size).toBe(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    });
  test("choosing a segment does not shift its neighbours", async ({ page }) => {
    const group = page.getByRole("radiogroup", { name: "View", exact: true });
    const before = await group.locator(".dds-segmented__item").evaluateAll((items) => items.map((item) => item.getBoundingClientRect().x));
    await group.getByText("Week", { exact: true }).click();
    const after = await group.locator(".dds-segmented__item").evaluateAll((items) => items.map((item) => item.getBoundingClientRect().x));
    expect(after).toEqual(before);
  });
  test("focused segmented and number controls pass browser axe", async ({ page }) => {
    await page.getByRole("radio", { name: "Day", exact: true }).first().focus();
    expect((await new AxeBuilder({ page }).include('section[aria-label="Segments and numbers"]').analyze()).violations).toEqual([]);
    await page.getByRole("spinbutton", { name: "Amount", exact: true }).focus();
    expect((await new AxeBuilder({ page }).include('section[aria-label="Segments and numbers"]').analyze()).violations).toEqual([]);
  });
});
