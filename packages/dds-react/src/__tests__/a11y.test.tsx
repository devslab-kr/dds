import { render } from "@testing-library/react";
import { it, expect } from "vitest";
import axe from "axe-core";
import { TimePicker } from "../time-picker";
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

it("TimePicker fields and an open time list have no axe violations", async () => {
  HTMLElement.prototype.scrollTo = () => {};
  const { container } = render(
    <main>
      <TimePicker label="Closing time" defaultValue="10:45" clearable />
      <TimePicker aria-label="Opening time" value="25:99" />
    </main>,
  );
  const rules = { rules: { "color-contrast": { enabled: false } } };
  expect((await axe.run(container, rules)).violations).toEqual([]);
  container.querySelector<HTMLButtonElement>(".dds-choice-trigger")!.click();
  await new Promise((resolve) => setTimeout(resolve, 80));
  expect(document.querySelector('[role="listbox"] [role="option"][data-state="checked"]')?.textContent).toBe("10:45");
  // The list is portaled to <body> beside this page's <main>; "region" judges that page layout, not the list.
  expect((await axe.run(document.body, { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } })).violations).toEqual([]);
}, 20_000);
