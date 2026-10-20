import { renderToString } from "react-dom/server";
import { expect, it } from "vitest";
import { Input, InputGroup } from "../input";
import { Combobox } from "../combobox";
import { SelectPicker } from "../select-picker";
import { Calendar } from "../calendar";
import { DropdownMenu } from "../dropdown-menu";
import { Popover } from "../popover";
import { TimePicker } from "../time-picker";
import { DateRangePicker } from "../date-range-picker";
import { MonthPicker } from "../month-picker";
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

it("server-renders DateRangePicker and MonthPicker with display text and API form values", () => {
  const html = renderToString(
    <>
      <DateRangePicker
        label="조회 기간"
        startName="from"
        endName="to"
        defaultValue={{ start: "2026-10-01", end: "2026-10-20" }}
        presets={[
          { label: "이번 달", value: { start: "2026-10-01", end: "2026-10-31" } },
        ]}
      />
      <MonthPicker label="청구 월" name="month" value="2026-10" />
    </>,
  );
  expect(html).toContain('value="2026/10/01"');
  expect(html).toContain('value="2026/10/20"');
  expect(html).toContain('name="from"');
  expect(html).toContain('value="2026-10-01"');
  expect(html).toContain('value="2026/10"');
  expect(html).toContain('value="2026-10"');
  expect(html).toContain("시작일");
  expect(html).toContain("조회 기간 달력 열기");
});

it("server-renders TimePicker with the HH:MM value, label and clock trigger", () => {
  const html = renderToString(
    <form>
      <TimePicker label="마감 시간" name="closing" defaultValue="18:30:00" clearable />
      <TimePicker label="Broken" value="25:99" locale="en-US" />
    </form>,
  );
  expect(html).toContain("마감 시간");
  expect(html).toMatch(/value="18:30"/);
  expect(html).not.toContain("18:30:00");
  expect(html).toMatch(/class="dds-choice dds-time-picker\s*"/);
  expect(html).toContain('aria-label="시간 목록 열기"');
  expect(html).toContain('aria-label="Open time list"');
  expect(html).toContain('name="closing"');
  expect(html).toContain('value="25:99"');
});
