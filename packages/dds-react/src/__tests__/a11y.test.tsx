import { fireEvent, render, waitFor } from "@testing-library/react";
import { it, expect } from "vitest";
import axe from "axe-core";
import {
  Field,
  Checkbox,
  RadioGroup,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  DateRangePicker,
  MonthPicker,
} from "../index";
it("has no axe violations in labeled controls and tabs", async () => {
  const { container } = render(
    <main>
      <Field label="이름" helpText="안내">
        {(props) => <input {...props} />}
      </Field>
      <Checkbox label="동의" />
      <RadioGroup label="종류" options={[{ value: "a", label: "첫째" }]} />
      <Tabs defaultValue="a">
        <TabList aria-label="영역">
          <Tab value="a">첫째</Tab>
        </TabList>
        <TabPanel value="a">내용</TabPanel>
      </Tabs>
    </main>
  );
  expect(
    (
      await axe.run(container, {
        rules: { "color-contrast": { enabled: false } },
      })
    ).violations
  ).toEqual([]);
});

it("DateRangePicker and MonthPicker fields and open calendars have no detectable axe violations", async () => {
  const { container } = render(
    <main>
      <DateRangePicker
        label="조회 기간"
        required
        startName="from"
        endName="to"
        defaultValue={{ start: "2026-10-01", end: "2026-10-20" }}
        presets={[
          { label: "이번 달", value: { start: "2026-10-01", end: "2026-10-31" } },
        ]}
      />
      <DateRangePicker
        aria-label="Hidden label period"
        labelPlacement="hidden"
        locale="en-US"
      />
      <MonthPicker label="청구 월" name="month" defaultValue="2026-10" />
      <MonthPicker
        label="Billing month"
        locale="en-US"
        labelPlacement="inside"
        invalid
      />
    </main>,
  );
  const rules = { rules: { "color-contrast": { enabled: false } } };
  expect((await axe.run(container, rules)).violations).toEqual([]);
  const triggers = container.querySelectorAll<HTMLButtonElement>(
    '[data-part="trigger"]',
  );
  fireEvent.click(triggers[0]!);
  await waitFor(() =>
    expect(
      document.querySelector('.dds-date-range-content[data-state="open"]'),
    ).not.toBeNull(),
  );
  expect(
    (
      await axe.run(
        document.querySelector<HTMLElement>(
          '.dds-date-range-content[data-state="open"]',
        )!,
        rules,
      )
    ).violations,
  ).toEqual([]);
  fireEvent.click(triggers[2]!);
  await waitFor(() =>
    expect(
      document.querySelector('.dds-month-picker-content[data-state="open"]'),
    ).not.toBeNull(),
  );
  expect(
    (
      await axe.run(
        document.querySelector<HTMLElement>(
          '.dds-month-picker-content[data-state="open"]',
        )!,
        rules,
      )
    ).violations,
  ).toEqual([]);
}, 20_000);
