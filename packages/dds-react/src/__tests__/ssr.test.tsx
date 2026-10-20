import { renderToString } from "react-dom/server";
import { expect, it } from "vitest";
import { Input, InputGroup } from "../input";
import { Combobox } from "../combobox";
import { SelectPicker } from "../select-picker";
import { Calendar } from "../calendar";
import { DropdownMenu } from "../dropdown-menu";
import { Popover } from "../popover";
import { SegmentedControl } from "../segmented-control";
import { NumberInput } from "../number-input";
import {
  Button,
  IconButton,
  Icon,
  Checkbox,
  Switch,
  Radio,
  RadioGroup,
  Select,
  Tooltip,
  ConsoleShell,
  Field,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  ToastProvider,
  Dialog,
  DatePicker,
} from "../index";
it("server-renders general inputs, choices and inline calendars without browser globals", () => {
  const items = [{ value: "customer-1", label: "Customer One" }];
  const html = renderToString(
    <>
      <InputGroup>
        <Input
          type="email"
          label="Email"
          labelPlacement="inside"
          defaultValue="one@example.test"
          clearable
        />
      </InputGroup>
      <Combobox
        label="Customer"
        items={items}
        defaultValue="customer-1"
        name="customer"
        virtualization={{}}
      />
      <SelectPicker label="Category" items={items} />
      <Calendar
        label="Booking calendar"
        value="2026-10-17"
        onChange={() => {}}
      />
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>Actions</DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Item value="edit">Edit</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
      <Popover.Root>
        <Popover.Trigger>Filters</Popover.Trigger>
        <Popover.Content>
          <Popover.Title>Filters</Popover.Title>
        </Popover.Content>
      </Popover.Root>
    </>,
  );
  expect(html).toContain("one@example.test");
  expect(html).toContain("customer-1");
  expect(html).toContain("Booking calendar");
  expect(html).toContain("Actions");
});
it("imports and renders without browser globals or translated fallback copy", () => {
  expect(typeof window).toBe("undefined");
  const html = renderToString(
    <ToastProvider>
      <Field label="이름">{(props) => <input {...props} />}</Field>
      <Button>저장</Button>
      <DatePicker label="날짜" value="2026-10-12" onChange={() => {}} />
      <Tabs defaultValue="a">
        <TabList aria-label="영역">
          <Tab value="a">첫째</Tab>
        </TabList>
        <TabPanel value="a">내용</TabPanel>
      </Tabs>
      <Dialog title="제목">본문</Dialog>
    </ToastProvider>,
  );
  expect(html).toContain("저장");
  expect(html).toContain("이름");
  expect(html).not.toContain("Notifications");
});

it("server-renders the complete inventory and gives multiple shells distinct IDs", () => {
  const labels = {
    skip: "건너뛰기",
    menuOpen: "메뉴 열기",
    menuClose: "메뉴 닫기",
    nav: "탐색",
    badge: "{count}개",
  };
  const shell = {
    surface: "test",
    activePath: "/home",
    brand: { href: "/home", name: "DDS", mark: "/mark.svg" },
    nav: [
      {
        label: "프로젝트",
        items: [{ id: "home", href: "/home", label: "홈" }],
      },
    ],
    labels,
    header: { title: "콘솔" },
  };
  const html = renderToString(
    <>
      <IconButton aria-label="확인">
        <Icon name="check" />
      </IconButton>
      <Checkbox label="체크" />
      <Switch label="스위치" />
      <Radio label="라디오" />
      <RadioGroup label="그룹" options={[{ value: "a", label: "첫째" }]} />
      <Select aria-label="선택">
        <option>항목</option>
      </Select>
      <Tooltip content="설명">
        {(props) => <button {...props}>도움말</button>}
      </Tooltip>
      <Dialog defaultOpen portal={false} title="열린 제목">
        본문
      </Dialog>
      <ConsoleShell {...shell}>하나</ConsoleShell>
      <ConsoleShell {...shell}>둘</ConsoleShell>
    </>,
  );
  expect(html).toContain("열린 제목");
  expect(html).toContain("스위치");
  expect(html).toContain("라디오");
  expect(html).not.toContain("data-hydrated");
  const ids = [...html.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
  expect(new Set(ids).size).toBe(ids.length);
});
it("server-renders SegmentedControl and NumberInput with their values and no browser globals", () => {
  expect(typeof window).toBe("undefined");
  const html = renderToString(
    <>
      <SegmentedControl
        label="보기"
        name="view"
        items={[
          { value: "day", label: "일" },
          { value: "week", label: "주" },
        ]}
        defaultValue="week"
      />
      <NumberInput label="금액" name="amount" defaultValue={1234567} suffix="원" min={0} />
    </>,
  );
  expect(html).toContain('role="radiogroup"');
  expect(html).toContain('data-state="checked"');
  expect(html).toContain('value="week"');
  expect(html).toContain('role="spinbutton"');
  expect(html).toContain('value="1,234,567"');
  expect(html).toContain('value="1234567"');
  expect(html).toContain("값 늘리기");
  expect(html).toContain("원");
});
