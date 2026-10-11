import { renderToString } from "react-dom/server";
import { expect, it } from "vitest";
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
} from "../index";
it("imports and renders without browser globals or translated fallback copy", () => {
  expect(typeof window).toBe("undefined");
  const html = renderToString(
    <ToastProvider>
      <Field label="이름">{(props) => <input {...props} />}</Field>
      <Button>저장</Button>
      <Tabs defaultValue="a">
        <TabList aria-label="영역">
          <Tab value="a">첫째</Tab>
        </TabList>
        <TabPanel value="a">내용</TabPanel>
      </Tabs>
      <Dialog title="제목">본문</Dialog>
    </ToastProvider>
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
    </>
  );
  expect(html).toContain("열린 제목");
  expect(html).toContain("스위치");
  expect(html).toContain("라디오");
  expect(html).not.toContain("data-hydrated");
  const ids = [...html.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
  expect(new Set(ids).size).toBe(ids.length);
});
