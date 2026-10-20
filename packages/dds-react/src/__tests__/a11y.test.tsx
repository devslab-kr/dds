import { render } from "@testing-library/react";
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
  SegmentedControl,
  NumberInput,
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
it("has no axe violations in segmented controls and number inputs", async () => {
  const { container } = render(
    <main>
      <SegmentedControl label="View" name="view" items={[{ value: "day", label: "Day" }, { value: "week", label: "Week" }, { value: "month", label: "Month", disabled: true }]} defaultValue="day" />
      <SegmentedControl aria-label="Status filter" items={[{ value: "all", label: "All" }, { value: "open", label: "Open" }]} defaultValue="open" size="sm" fullWidth />
      <NumberInput label="Amount" name="amount" locale="en-US" defaultValue={1500} suffix="KRW" min={0} max={2000} />
      <NumberInput aria-label="Quantity" labelPlacement="hidden" stepper={false} />
      <NumberInput label="Hidden quantity" labelPlacement="hidden" invalid required />
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
