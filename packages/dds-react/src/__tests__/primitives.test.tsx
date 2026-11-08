import { createRef, StrictMode, useEffect, useState } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
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
  type ToastApi,
  type ToastProviderProps,
} from "../index";
describe("React DDS behavior", () => {
  it("forwards native refs and prevents loading button activation", async () => {
    const ref = createRef<HTMLButtonElement>();
    const click = vi.fn();
    render(
      <Button ref={ref} loading onClick={click}>
        <svg aria-hidden="true" />
        저장
      </Button>,
    );
    // The label stays in the button while loading (it is only not painted,
    // D-043), so the name does not change and the spinner adds nothing to it.
    expect(ref.current).toBe(screen.getByRole("button", { name: "저장" }));
    expect(ref.current).toHaveAccessibleName("저장");
    expect(ref.current).toBeDisabled();
    await userEvent.click(ref.current!);
    expect(click).not.toHaveBeenCalled();
    expect(ref.current).toHaveAttribute("aria-busy", "true");
  });
  it("links a stable field label and descriptions to the caller control", () => {
    render(
      <Field label="이름" helpText="안내" error="필수">
        {(props) => <input {...props} />}
      </Field>,
    );
    const input = screen.getByRole("textbox", { name: "이름" });
    expect(input).toHaveAccessibleDescription("안내 필수");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });
  it("keeps controlled selection owned by caller and supports uncontrolled checkboxes", async () => {
    const change = vi.fn();
    const view = render(
      <Checkbox label="동의" checked={false} onCheckedChange={change} />,
    );
    await userEvent.click(screen.getByRole("checkbox"));
    expect(change).toHaveBeenCalledWith(true);
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    view.rerender(
      <Checkbox label="동의" checked={true} onCheckedChange={change} />,
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
      </Tabs>,
    );
    screen.getByRole("tab", { name: "첫째" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() =>
      expect(screen.getByRole("tab", { name: "둘째" })).toHaveAttribute(
        "aria-selected",
        "true",
      ),
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
      />,
    );
    screen.getByRole("radio", { name: "한국어" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() =>
      expect(screen.getByRole("radio", { name: "English" })).toBeChecked(),
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
      </StrictMode>,
    );
    await userEvent.click(screen.getByRole("button", { name: "열기" }));
    const innerTrigger = await screen.findByRole("button", {
      name: "안쪽 열기",
    });
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
        screen.queryByRole("dialog", { name: "안쪽" }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("dialog", { name: "바깥" })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "안쪽 열기" })).toHaveFocus(),
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "열기" })).toHaveFocus(),
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
      </ToastProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "알림" }));
    expect(await screen.findByText("완료")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "닫기" }));
    await waitFor(() =>
      expect(screen.queryByText("완료")).not.toBeInTheDocument(),
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
    </>,
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
    </Dialog>,
  );
  expect(
    await screen.findByRole("dialog", { name: "설정" }),
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
            toast.show({ message: `완료 ${ids.length + 1}`, duration: 0 }),
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
    </ToastProvider>,
  );
  await userEvent.click(screen.getByRole("button", { name: "알림" }));
  view.rerender(
    <ToastProvider defaultDuration={200}>
      <Demo />
    </ToastProvider>,
  );
  await userEvent.click(screen.getByRole("button", { name: "알림" }));
  expect(new Set(ids).size).toBe(2);
  expect(await screen.findByText("완료 1")).toBeInTheDocument();
  expect(await screen.findByText("완료 2")).toBeInTheDocument();
  expect(
    new Set(screen.getAllByRole("status").map((node) => node.id)).size,
  ).toBe(2);
});

function mountToast(props: Omit<ToastProviderProps, "children"> = {}) {
  let api!: ToastApi;
  function Capture() {
    api = useToast();
    return null;
  }
  const view = render(
    <ToastProvider {...props}>
      <Capture />
    </ToastProvider>,
  );
  return { ...view, api };
}

describe("async toast contract", () => {
  it("supports child effect notifications through StrictMode replay and stale API references", async () => {
    let first!: ToastApi;
    function Notice() {
      const api = useToast();
      first ??= api;
      useEffect(() => {
        api.loading({ message: "효과 알림" });
      }, [api]);
      return null;
    }
    const view = render(
      <StrictMode>
        <ToastProvider defaultDuration={100}>
          <Notice />
        </ToastProvider>
      </StrictMode>,
    );
    expect(await screen.findByText("효과 알림")).toBeInTheDocument();
    view.rerender(
      <StrictMode>
        <ToastProvider defaultDuration={200}>
          <Notice />
        </ToastProvider>
      </StrictMode>,
    );
    act(() => {
      first.loading({ message: "이전 API도 활성" });
    });
    expect(await screen.findByText("이전 API도 활성")).toBeInTheDocument();
    view.unmount();
    let calls = 0;
    const pending = first.promise(
      () => {
        calls++;
        return Promise.resolve(7);
      },
      {
        loading: { message: "폐기 후" },
        success: { message: "늦은 완료" },
        error: { message: "실패" },
      },
    );
    expect(await pending).toBe(7);
    expect(calls).toBe(1);
    expect(screen.queryByText("늦은 완료")).not.toBeInTheDocument();
  });

  it("keeps loading visible and updates the same notification before normal expiry", async () => {
    vi.useFakeTimers({
      toFake: ["setTimeout", "clearTimeout", "Date", "performance"],
    });
    try {
      const { api } = mountToast({ defaultDuration: 100 });
      let id = "";
      await act(async () => {
        id = api.loading({ message: "저장 중" });
        await vi.advanceTimersByTimeAsync(0);
      });
      const original = screen.getByRole("status");
      expect(original).toHaveTextContent("저장 중");
      expect(
        original.querySelector('.dds-spinner[aria-hidden="true"]'),
      ).not.toBeNull();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });
      expect(original).toBeInTheDocument();
      await act(async () => {
        api.update(id, { message: "저장 완료", tone: "success" });
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(screen.getByRole("status")).toBe(original);
      expect(original).toHaveTextContent("저장 완료");
      expect(original.querySelector(".dds-spinner")).toBeNull();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("updates and removes an action, then activates the replacement once without submitting a form", async () => {
    let api!: ToastApi;
    let activated = 0;
    let submitted = 0;
    let stillVisible = true;
    function Capture() {
      api = useToast();
      return null;
    }
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitted++;
        }}
      >
        <ToastProvider>
          <Capture />
        </ToastProvider>
      </form>,
    );
    let id = "";
    act(() => {
      id = api.show({
        message: "내보내기 완료",
        duration: 0,
        action: {
          label: "이전 작업",
          onClick: () => {
            activated += 100;
          },
        },
      });
    });
    await screen.findByRole("button", { name: "이전 작업" });
    act(() => api.update(id, { action: null }));
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "이전 작업" }),
      ).not.toBeInTheDocument(),
    );
    act(() =>
      api.update(id, {
        action: {
          label: "결과 보기",
          onClick: () => {
            activated++;
            api.update(id, { message: "다시 나타나면 안 됨" });
            stillVisible =
              document.body.textContent?.includes("다시 나타나면 안 됨") ??
              false;
          },
        },
      }),
    );
    const action = await screen.findByRole("button", { name: "결과 보기" });
    expect(action).toHaveAttribute("type", "button");
    action.focus();
    await userEvent.keyboard("{Enter}");
    expect(activated).toBe(1);
    expect(submitted).toBe(0);
    expect(stillVisible).toBe(false);
    await waitFor(() =>
      expect(screen.queryByRole("status")).not.toBeInTheDocument(),
    );
    act(() => api.update(id, { message: "재생성 금지" }));
    expect(screen.queryByText("재생성 금지")).not.toBeInTheDocument();
  });

  it("returns the operation result and updates one promise toast with a stable ID", async () => {
    const { api } = mountToast();
    let resolve!: (value: { count: number }) => void;
    const operation = new Promise<{ count: number }>((done) => {
      resolve = done;
    });
    let calls = 0;
    let pending!: ReturnType<ToastApi["promise"]>;
    act(() => {
      pending = api.promise(
        () => {
          calls++;
          return operation;
        },
        {
          loading: { message: "처리 중" },
          success: (value) => ({
            message: `${value.count}건 완료`,
            duration: 0,
          }),
          error: { message: "실패" },
        },
      );
    });
    const original = await screen.findByRole("status");
    expect(pending.id).toEqual(expect.any(String));
    const result = { count: 2 };
    await act(async () => {
      resolve(result);
      expect(await pending).toBe(result);
    });
    expect(calls).toBe(1);
    await waitFor(() => expect(original).toHaveTextContent("2건 완료"));
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toBe(original);
  });

  it("preserves rejection identity including synchronous task throws", async () => {
    const { api } = mountToast();
    const failure = new Error("network");
    let reject!: (reason: unknown) => void;
    const operation = new Promise<never>((_, fail) => {
      reject = fail;
    });
    let pending!: ReturnType<ToastApi["promise"]>;
    act(() => {
      pending = api.promise(operation, {
        loading: { message: "전송 중" },
        success: { message: "완료" },
        error: (reason) => ({
          message: reason === failure ? "전송 실패" : "잘못된 오류",
          duration: 0,
        }),
      });
    });
    const rejected = expect(pending).rejects.toBe(failure);
    await act(async () => {
      reject(failure);
      await rejected;
    });
    expect(await screen.findByRole("alert")).toHaveTextContent("전송 실패");
    let calls = 0;
    await act(async () => {
      const thrown = api.promise(
        () => {
          calls++;
          throw failure;
        },
        {
          loading: { message: "시작 중" },
          success: { message: "완료" },
          error: { message: "시작 실패", duration: 0 },
        },
      );
      await expect(thrown).rejects.toBe(failure);
    });
    expect(calls).toBe(1);
    expect(await screen.findByText("시작 실패")).toBeInTheDocument();
  });

  for (const stop of [
    "dismiss",
    "clear",
    "update",
    "close",
    "unmount",
  ] as const) {
    it(`does not overwrite or resurrect a promise toast after ${stop}`, async () => {
      const { api, unmount } = mountToast({ dismissLabel: "닫기" });
      let resolve!: (value: string) => void;
      let mapped = 0;
      let pending!: ReturnType<ToastApi["promise"]>;
      act(() => {
        pending = api.promise(
          new Promise<string>((done) => {
            resolve = done;
          }),
          {
            loading: { message: "대기 중" },
            success: () => {
              mapped++;
              return { message: "늦은 완료" };
            },
            error: { message: "실패" },
          },
        );
      });
      await screen.findByText("대기 중");
      if (stop === "close")
        await userEvent.click(screen.getByRole("button", { name: "닫기" }));
      else if (stop === "unmount") unmount();
      else
        act(() => {
          if (stop === "dismiss") api.dismiss(pending.id);
          if (stop === "clear") api.clear();
          if (stop === "update")
            api.update(pending.id, {
              message: "사용자가 갱신",
              tone: "info",
              duration: 0,
            });
        });
      await act(async () => {
        resolve("result");
        expect(await pending).toBe("result");
      });
      expect(mapped).toBe(0);
      expect(screen.queryByText("늦은 완료")).not.toBeInTheDocument();
      if (stop === "update")
        expect(await screen.findByText("사용자가 갱신")).toBeInTheDocument();
      if (stop === "unmount") {
        act(() => {
          api.show({ message: "폐기 후 호출" });
          api.update(pending.id, { message: "폐기 후 갱신" });
        });
        expect(screen.queryByText("폐기 후 호출")).not.toBeInTheDocument();
      }
    });
  }

  it("rechecks ownership after message factories and preserves results if presentation fails", async () => {
    const { api } = mountToast();
    let resolve!: (value: number) => void;
    let pending!: ReturnType<ToastApi["promise"]>;
    act(() => {
      pending = api.promise(
        new Promise<number>((done) => {
          resolve = done;
        }),
        {
          loading: { message: "대기" },
          success: () => {
            api.clear();
            return { message: "재등장 금지" };
          },
          error: { message: "실패" },
        },
      );
    });
    await act(async () => {
      resolve(42);
      expect(await pending).toBe(42);
    });
    expect(screen.queryByText("재등장 금지")).not.toBeInTheDocument();
    await act(async () => {
      const failedDisplay = api.promise(Promise.resolve(43), {
        loading: { message: "표시 대기" },
        success: () => {
          throw new Error("message formatter");
        },
        error: { message: "실패" },
      });
      expect(await failedDisplay).toBe(43);
    });
    await waitFor(() =>
      expect(screen.queryByText("표시 대기")).not.toBeInTheDocument(),
    );
  });

  it("does not overwrite a manual update performed by a terminal message getter", async () => {
    const { api } = mountToast();
    let resolve!: (value: number) => void;
    let pending!: ReturnType<ToastApi["promise"]>;
    act(() => {
      pending = api.promise(
        new Promise<number>((done) => {
          resolve = done;
        }),
        {
          loading: { message: "대기" },
          success: () => ({
            get message() {
              api.update(pending.id, {
                message: "수동 결과",
                tone: "info",
                duration: 0,
              });
              return "덮어쓰면 안 됨";
            },
          }),
          error: { message: "실패" },
        },
      );
    });
    await act(async () => {
      resolve(1);
      await pending;
    });
    expect(await screen.findByText("수동 결과")).toBeInTheDocument();
    expect(screen.queryByText("덮어쓰면 안 됨")).not.toBeInTheDocument();
  });

  it("keeps providers independent and handles promises beyond Ark's default queue capacity", async () => {
    const first = mountToast();
    const second = mountToast();
    const regions = [...document.querySelectorAll(".dds-toast-region")];
    expect(new Set(regions.map((region) => region.id)).size).toBe(2);
    let pending!: ReturnType<ToastApi["promise"]>;
    let resolve!: (value: number) => void;
    act(() => {
      for (let n = 0; n < 25; n++)
        first.api.show({ message: `通知 ${n}`, duration: 0 });
      pending = first.api.promise(
        new Promise<number>((done) => {
          resolve = done;
        }),
        {
          loading: { message: "추가 대기" },
          success: { message: "추가 완료" },
          error: { message: "실패" },
        },
      );
      second.api.show({ message: "다른 영역", duration: 0 });
      first.api.dismiss(pending.id);
      first.api.clear();
    });
    await act(async () => {
      resolve(1);
      await pending;
    });
    expect(screen.queryByText("추가 대기")).not.toBeInTheDocument();
    expect(screen.queryByText("추가 완료")).not.toBeInTheDocument();
    expect(await screen.findByText("다른 영역")).toBeInTheDocument();
  });
});
