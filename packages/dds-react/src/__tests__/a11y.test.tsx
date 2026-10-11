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
