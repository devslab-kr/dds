import { StrictMode } from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import {
  LoginPanel,
  SocialLoginOptions,
  type LoginPanelProps,
  loginMessagesEn,
} from "../react.js";
import { authFailure, type SocialAuthStartResult } from "../index.js";

const props: LoginPanelProps = {
  brand: "Service",
  title: "Sign in",
  description: "Choose your sign-in method.",
  providers: [
    { id: "google", status: "available" },
    { id: "kakao", status: "available" },
    { id: "naver", status: "unconfigured", reason: "review-pending" },
  ],
  client: {
    start: async () => ({
      status: "redirect",
      url: "https://auth.service.test/authorize",
    }),
  },
  returnTo: "/account",
  redirectOrigins: ["https://auth.service.test"],
  onRedirect: () => {},
  terms: { href: "/terms", label: "Terms" },
  privacy: { href: "https://service.test/privacy", label: "Privacy" },
  messages: loginMessagesEn,
};

it("renders explicit provider readiness, named legal links and browser-free SSR", () => {
  const html = renderToString(
    <LoginPanel {...props} brand={<span>{"<script>"}</span>} />,
  );
  expect(html).toContain("&lt;script&gt;");
  render(<LoginPanel {...props} />);
  expect(screen.getByRole("region", { name: "Sign in" })).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Continue with Google" }),
  ).toBeEnabled();
  expect(
    screen.getByRole("button", { name: "Continue with Naver" }),
  ).toBeDisabled();
  expect(
    screen.getByRole("button", { name: "Continue with Naver" }),
  ).toHaveAccessibleDescription(loginMessagesEn.unconfigured);
  expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute(
    "href",
    "https://service.test/privacy",
  );
});

it("fails closed for missing client, all missing provider configuration and unsafe return paths", () => {
  const { rerender } = render(<LoginPanel {...props} client={undefined} />);
  expect(
    screen
      .getAllByRole("button")
      .every((button) => button.hasAttribute("disabled")),
  ).toBe(true);
  rerender(<LoginPanel {...props} providers={[]} />);
  expect(
    screen
      .getAllByRole("button")
      .every((button) => button.hasAttribute("disabled")),
  ).toBe(true);
  rerender(
    <LoginPanel
      {...props}
      returnTo="/%2f%2fevil.test"
      terms={{ href: "javascript:alert(1)", label: "Terms" }}
    />,
  );
  expect(
    screen
      .getAllByRole("button")
      .every((button) => button.hasAttribute("disabled")),
  ).toBe(true);
  expect(screen.getByRole("alert")).toHaveTextContent(
    loginMessagesEn.errors["invalid-request"],
  );
  expect(screen.queryByRole("link", { name: "Terms" })).toBeNull();
});

it("starts once under rapid input, announces progress and delegates an allowed redirect without claiming success", async () => {
  let resolve!: (result: SocialAuthStartResult) => void;
  const start = vi.fn<NonNullable<LoginPanelProps["client"]>["start"]>(
    () =>
      new Promise<SocialAuthStartResult>((done) => {
        resolve = done;
      }),
  );
  const onRedirect = vi.fn();
  render(
    <StrictMode>
      <LoginPanel
        {...props}
        client={{ start }}
        onRedirect={onRedirect}
        requestId="original-request"
        intent="link"
      />
    </StrictMode>,
  );
  const button = screen.getByRole("button", { name: "Continue with Google" });
  await userEvent.dblClick(button);
  expect(start).toHaveBeenCalledTimes(1);
  expect(start.mock.calls[0]?.[0]).toEqual({
    provider: "google",
    returnTo: "/account",
    intent: "link",
    requestId: "original-request",
  });
  expect(screen.getByRole("status")).toHaveTextContent(
    "Preparing Google sign-in.",
  );
  expect(
    screen.getByRole("button", { name: "Continue with Kakao" }),
  ).toBeDisabled();
  await act(async () => {
    resolve({ status: "redirect", url: "https://auth.service.test/authorize" });
  });
  expect(onRedirect).toHaveBeenCalledWith(
    "https://auth.service.test/authorize",
  );
  expect(screen.getByRole("status")).toHaveTextContent(
    "Opening the sign-in page.",
  );
  expect(button).toBeDisabled();
});

it("rejects unauthorized redirects and restores focus for a deliberate retry without raw error leakage", async () => {
  const onRedirect = vi.fn();
  const start = vi
    .fn()
    .mockResolvedValue({
      status: "redirect",
      url: "https://evil.test/?secret=provider",
    });
  render(<LoginPanel {...props} client={{ start }} onRedirect={onRedirect} />);
  await userEvent.click(
    screen.getByRole("button", { name: "Continue with Google" }),
  );
  expect(screen.getByRole("alert")).toHaveTextContent(
    loginMessagesEn.errors["invalid-response"],
  );
  expect(screen.getByRole("button", { name: "Choose again" })).toHaveFocus();
  expect(onRedirect).not.toHaveBeenCalled();
  expect(document.body).not.toHaveTextContent("secret=provider");
  await userEvent.click(screen.getByRole("button", { name: "Choose again" }));
  expect(
    screen.getByRole("button", { name: "Continue with Google" }),
  ).toHaveFocus();
  expect(start).toHaveBeenCalledTimes(1);
  start.mockRejectedValue(new Error("secret provider payload"));
  await userEvent.keyboard("{Enter}");
  expect(screen.getByRole("alert")).toHaveTextContent(
    loginMessagesEn.errors.failed,
  );
  expect(document.body).not.toHaveTextContent("secret provider payload");
});

it("surfaces callback/forbidden errors without retrying or linking accounts automatically", async () => {
  const start = vi.fn().mockResolvedValue(authFailure("forbidden", false));
  render(<LoginPanel {...props} client={{ start }} error="flow-expired" />);
  expect(screen.getByRole("alert")).toHaveTextContent(
    loginMessagesEn.errors["flow-expired"],
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Continue with Kakao" }),
  );
  expect(screen.getByRole("alert")).toHaveTextContent(
    loginMessagesEn.errors.forbidden,
  );
  expect(screen.queryByRole("button", { name: "Choose again" })).toBeNull();
  expect(start).toHaveBeenCalledTimes(1);
});

it("aborts obsolete in-flight work on scope change and unmount, ignoring its redirect", async () => {
  let resolve!: (result: SocialAuthStartResult) => void;
  const signals: AbortSignal[] = [];
  const client: NonNullable<LoginPanelProps["client"]> = {
    start: vi.fn((_input, { signal }) => {
      signals.push(signal);
      return new Promise<SocialAuthStartResult>((done) => {
        resolve = done;
      });
    }),
  };
  const onRedirect = vi.fn();
  const { rerender, unmount } = render(
    <LoginPanel {...props} client={client} onRedirect={onRedirect} />,
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Continue with Google" }),
  );
  rerender(
    <LoginPanel
      {...props}
      client={client}
      onRedirect={onRedirect}
      returnTo="/store"
    />,
  );
  expect(signals[0]?.aborted).toBe(true);
  await act(async () => {
    resolve({ status: "redirect", url: "https://auth.service.test/authorize" });
  });
  expect(onRedirect).not.toHaveBeenCalled();
  await userEvent.click(
    screen.getByRole("button", { name: "Continue with Kakao" }),
  );
  unmount();
  expect(signals[1]?.aborted).toBe(true);
});

it("recovers from a hung adapter with a bounded timeout and never automatically repeats the request", async () => {
  const start = vi.fn<NonNullable<LoginPanelProps["client"]>["start"]>(
    () => new Promise(() => {}),
  );
  render(<LoginPanel {...props} client={{ start }} timeoutMs={250} />);
  await userEvent.click(
    screen.getByRole("button", { name: "Continue with Google" }),
  );
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent(
      loginMessagesEn.errors.unavailable,
    ),
  );
  expect(start).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: "Choose again" })).toHaveFocus();
});

it("aborts a delayed result when provider readiness or redirect trust is revoked", async () => {
  let resolve!: (result: SocialAuthStartResult) => void;
  const client: NonNullable<LoginPanelProps["client"]> = {
    start: () =>
      new Promise((done) => {
        resolve = done;
      }),
  };
  const onRedirect = vi.fn();
  const { rerender } = render(
    <LoginPanel {...props} client={client} onRedirect={onRedirect} />,
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Continue with Google" }),
  );
  rerender(
    <LoginPanel
      {...props}
      client={client}
      onRedirect={onRedirect}
      redirectOrigins={[]}
    />,
  );
  await act(async () => {
    resolve({ status: "redirect", url: "https://auth.service.test/authorize" });
  });
  expect(onRedirect).not.toHaveBeenCalled();
  rerender(<LoginPanel {...props} client={client} onRedirect={onRedirect} />);
  await userEvent.click(
    screen.getByRole("button", { name: "Continue with Google" }),
  );
  rerender(
    <LoginPanel
      {...props}
      client={client}
      onRedirect={onRedirect}
      providers={[]}
    />,
  );
  await act(async () => {
    resolve({ status: "redirect", url: "https://auth.service.test/authorize" });
  });
  expect(onRedirect).not.toHaveBeenCalled();
});

it("exposes controlled provider UI without owning the app's mutation, recent-provider or native transport", async () => {
  const onSelect = vi.fn();
  const { rerender } = render(
    <SocialLoginOptions
      providers={props.providers}
      onSelect={onSelect}
      messages={loginMessagesEn}
      aria-label="Account sign-in methods"
      buttonLabel={(_id, label) => `${label} sign in`}
      providerBadge={(id) =>
        id === "google" ? <span>Recently used</span> : null
      }
    />,
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Google sign in Recently used" }),
  );
  expect(onSelect).toHaveBeenCalledExactlyOnceWith("google");
  rerender(
    <SocialLoginOptions
      providers={props.providers}
      onSelect={onSelect}
      messages={loginMessagesEn}
      pendingProvider="kakao"
    />,
  );
  expect(
    screen.getByRole("button", { name: "Continue with Kakao" }),
  ).toHaveAttribute("aria-busy", "true");
  expect(
    screen
      .getAllByRole("button")
      .every((button) => button.hasAttribute("disabled")),
  ).toBe(true);
  expect(onSelect).toHaveBeenCalledTimes(1);
});
