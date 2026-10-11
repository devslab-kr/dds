import { createRef, StrictMode, useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import {
  Button,
  Checkbox,
  Field,
  Dialog,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  RadioGroup,
  ToastProvider,
  useToast,
} from "../index";
describe("React DDS behavior", () => {
  it("forwards native refs and prevents loading button activation", async () => {
    const ref = createRef<HTMLButtonElement>();
    const click = vi.fn();
    render(
      <Button ref={ref} loading onClick={click}>
        저장
      </Button>
    );
    expect(ref.current).toBe(screen.getByRole("button", { name: "저장" }));
    await userEvent.click(ref.current!);
    expect(click).not.toHaveBeenCalled();
    expect(ref.current).toHaveAttribute("aria-busy", "true");
  });
  it("links a stable field label and descriptions to the caller control", () => {
    render(
      <Field label="이름" helpText="안내" error="필수">
        {(props) => <input {...props} />}
      </Field>
    );
    const input = screen.getByRole("textbox", { name: "이름" });
    expect(input).toHaveAccessibleDescription("안내 필수");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });
  it("keeps controlled selection owned by caller and supports uncontrolled checkboxes", async () => {
    const change = vi.fn();
    const view = render(
      <Checkbox label="동의" checked={false} onCheckedChange={change} />
    );
    await userEvent.click(screen.getByRole("checkbox"));
    expect(change).toHaveBeenCalledWith(true);
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    view.rerender(
      <Checkbox label="동의" checked={true} onCheckedChange={change} />
    );
    expect(screen.getByRole("checkbox")).toBeChecked();
    view.unmount();
    render(<Checkbox label="알림" defaultChecked />);
    await userEvent.click(screen.getByRole("checkbox"));
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });
  it("delegates tab keyboard selection and panel visibility to Ark", async () => {
    render(
      <Tabs defaultValue="a">
        <TabList aria-label="영역">
          <Tab value="a">첫째</Tab>
          <Tab value="b">둘째</Tab>
        </TabList>
        <TabPanel value="a">첫 내용</TabPanel>
        <TabPanel value="b">둘 내용</TabPanel>
      </Tabs>
    );
    screen.getByRole("tab", { name: "첫째" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() =>
      expect(screen.getByRole("tab", { name: "둘째" })).toHaveAttribute(
        "aria-selected",
        "true"
      )
    );
    expect(screen.getByRole("tabpanel")).toHaveTextContent("둘 내용");
  });
  it("uses Ark radio roving focus", async () => {
    render(
      <RadioGroup
        label="언어"
        defaultValue="ko"
        options={[
          { value: "ko", label: "한국어" },
          { value: "en", label: "English" },
        ]}
      />
    );
    screen.getByRole("radio", { name: "한국어" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() =>
      expect(screen.getByRole("radio", { name: "English" })).toBeChecked()
    );
  });
  it("closes the nested StrictMode dialog first and restores the trigger", async () => {
    function Demo() {
      const [open, setOpen] = useState(false);
      const [inner, setInner] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>열기</Button>
          <Dialog open={open} onOpenChange={setOpen} title="바깥">
            <Button onClick={() => setInner(true)}>안쪽 열기</Button>
            <Dialog open={inner} onOpenChange={setInner} title="안쪽">
              <Button>작업</Button>
            </Dialog>
          </Dialog>
        </>
      );
    }
    const view = render(
      <StrictMode>
        <Demo />
      </StrictMode>
    );
    await userEvent.click(screen.getByRole("button", { name: "열기" }));
    const innerTrigger = await screen.findByRole("button", { name: "안쪽 열기" });
    // Ark activates its focus trap and modal layer on animation frames. A
    // rendered trigger alone does not establish that the outer layer is ready.
    const outerDialog = await screen.findByRole("dialog", { name: "바깥" });
    // jsdom has no layout, so Ark initially focuses the dialog fallback.
    await waitFor(() => expect(outerDialog).toHaveFocus());
    await userEvent.click(innerTrigger);
    const innerDialog = await screen.findByRole("dialog", { name: "안쪽" });
    await waitFor(() => expect(innerDialog).toHaveFocus());
    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "안쪽" })
      ).not.toBeInTheDocument()
    );
    expect(screen.getByRole("dialog", { name: "바깥" })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "안쪽 열기" })).toHaveFocus()
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "열기" })).toHaveFocus()
    );
    view.unmount();
    expect(document.body.style.overflow).not.toBe("hidden");
  });
  it("creates localized notifications and clears them on unmount", async () => {
    function Demo() {
      const toast = useToast();
      return (
        <Button onClick={() => toast.show({ message: "완료", duration: 0 })}>
          알림
        </Button>
      );
    }
    const view = render(
      <ToastProvider regionLabel="알림 영역" dismissLabel="닫기">
        <Demo />
      </ToastProvider>
    );
    await userEvent.click(screen.getByRole("button", { name: "알림" }));
    expect(await screen.findByText("완료")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "닫기" }));
    await waitFor(() =>
      expect(screen.queryByText("완료")).not.toBeInTheDocument()
    );
    view.unmount();
  });
});

it("keeps styled radio inputs visible and forwards checkable native change and ref", async () => {
  const ref = createRef<HTMLInputElement>();
  const change = vi.fn();
  render(
    <>
      <Checkbox ref={ref} label="동의" onChange={change} />
      <RadioGroup label="종류" options={[{ value: "a", label: "첫째" }]} />
    </>
  );
  await userEvent.click(screen.getByRole("checkbox"));
  expect(ref.current).toBeChecked();
  expect(change).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("radio").style.position).not.toBe("absolute");
  expect(screen.getByRole("radio").style.width).not.toBe("1px");
});

it("associates the dialog description", async () => {
  render(
    <Dialog defaultOpen title="설정" description="변경 안내">
      <Button>완료</Button>
    </Dialog>
  );
  expect(
    await screen.findByRole("dialog", { name: "설정" })
  ).toHaveAccessibleDescription("변경 안내");
});

it("does not reuse toast IDs when provider duration changes", async () => {
  const ids: string[] = [];
  function Demo() {
    const toast = useToast();
    return (
      <Button
        onClick={() =>
          ids.push(
            toast.show({ message: `완료 ${ids.length + 1}`, duration: 0 })
          )
        }
      >
        알림
      </Button>
    );
  }
  const view = render(
    <ToastProvider defaultDuration={100}>
      <Demo />
    </ToastProvider>
  );
  await userEvent.click(screen.getByRole("button", { name: "알림" }));
  view.rerender(
    <ToastProvider defaultDuration={200}>
      <Demo />
    </ToastProvider>
  );
  await userEvent.click(screen.getByRole("button", { name: "알림" }));
  expect(new Set(ids).size).toBe(2);
  expect(await screen.findByText("완료 1")).toBeInTheDocument();
  expect(await screen.findByText("완료 2")).toBeInTheDocument();
  expect(
    new Set(screen.getAllByRole("status").map((node) => node.id)).size
  ).toBe(2);
});
