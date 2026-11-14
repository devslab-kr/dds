// @vitest-environment node
import { expect, it, vi } from "vitest";
import {
  SOCIAL_PROVIDERS,
  authFailure,
  createSocialAuthClient,
  isSafeAuthRedirect,
  isSafeReturnTo,
  normalizeProviders,
  readSocialAuthStartResult,
  type SocialAuthAdapter,
} from "../index.js";

it("does not infer readiness from missing, malformed or duplicate provider configuration", () => {
  expect(
    normalizeProviders(null).every((entry) => entry.status === "unconfigured"),
  ).toBe(true);
  const normalized = normalizeProviders([
    { id: "google", status: "available" },
    { id: "google", status: "available" },
    { id: "kakao", status: "disabled", reason: "review-pending" },
    { id: "naver", configured: true },
  ]);
  expect(normalized.map((entry) => entry.id)).toEqual(SOCIAL_PROVIDERS);
  expect(normalized.map((entry) => entry.status)).toEqual([
    "unconfigured",
    "disabled",
    "unconfigured",
  ]);
});

it("keeps the historical allowlist and only includes explicitly ordered new methods", () => {
  const configured = [
    { id: "google", status: "available" },
    { id: "github", status: "available" },
    { id: "discord", status: "available" },
    { id: "discord", status: "available" },
    { id: "zoom", status: "disabled", reason: "review-pending" },
  ];
  expect(normalizeProviders(configured).map(({ id }) => id)).toEqual([
    "google", "kakao", "naver",
  ]);
  expect(normalizeProviders(configured, ["zoom", "discord", "x", "zoom"])).toEqual([
    { id: "zoom", status: "disabled", reason: "review-pending" },
    { id: "discord", status: "unconfigured", reason: "not-configured" },
    { id: "x", status: "unconfigured", reason: "not-configured" },
  ]);
});

it("only submits requests for the client-selected methods", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>(async () =>
    Response.json({ status: "redirect", url: "https://auth.service.test/authorize" }),
  );
  const providerOrder = ["discord", "x"] as const;
  const legacyClient = createSocialAuthClient({ endpoint: "/auth/start", fetch });
  const input = { provider: "discord" as const, intent: "sign-in" as const, returnTo: "/account" };
  const options = { signal: new AbortController().signal };
  // Simulate runtime input that bypasses the legacy caller's compile-time provider declaration.
  expect(await legacyClient.start(input as unknown as Parameters<typeof legacyClient.start>[0], options))
    .toEqual(authFailure("invalid-request", false));
  expect(fetch).not.toHaveBeenCalled();
  const client = createSocialAuthClient({ endpoint: "/auth/start", fetch, providerOrder });
  expect(await client.start(input, options)).toEqual({
    status: "redirect", url: "https://auth.service.test/authorize",
  });
  expect(fetch).toHaveBeenCalledExactlyOnceWith(
    "/auth/start", expect.objectContaining({ body: JSON.stringify(input) }),
  );
});

it.each([
  "/",
  "/account?tab=social",
  "/join/abc?return=%2Fstore%3Fview%3Dorders",
  "/store#orders",
  "/app?search=%EA%B0%95%EB%82%A8%20station",
  "/app?search=50%25",
  "/app?q=100%2525",
  "/my%20page",
])("accepts local return path %s", (value) => {
  expect(isSafeReturnTo(value)).toBe(true);
});
it.each([
  "https://evil.test/",
  "//evil.test/",
  "/\\evil.test/",
  "/%2f%2fevil.test",
  "/%252f%252fevil.test",
  "/%5cevil.test",
  "/%255cevil.test",
  "/ok?next=%0d%0aLocation:evil",
  "/ok?x=%250a",
  "/ok\n",
  " /ok",
  "/bad%",
  "/%E9",
])("rejects unsafe or malformed return path %s", (value) => {
  expect(isSafeReturnTo(value)).toBe(false);
});

it("requires exact authorization origins and safe URL schemes without credentials", () => {
  const origins = ["https://auth.service.test"];
  expect(
    isSafeAuthRedirect(
      "https://auth.service.test/authorize?state=abc",
      origins,
    ),
  ).toBe(true);
  for (const value of [
    "javascript:alert(1)",
    "data:text/plain,hello",
    "//auth.service.test/authorize",
    "https://evil.test/authorize",
    "https://auth.service.test.evil.test/",
    "https://user:secret@auth.service.test/",
    "http://auth.service.test/",
    "https://auth.service.test/\n",
  ]) {
    expect(isSafeAuthRedirect(value, origins), value).toBe(false);
  }
  expect(
    isSafeAuthRedirect("https://auth.service.test/", [
      "https://auth.service.test/a",
    ]),
  ).toBe(false);
  expect(
    isSafeAuthRedirect("http://localhost:7777/start", [
      "http://localhost:7777",
    ]),
  ).toBe(true);
  expect(
    isSafeAuthRedirect("https://auth.service.test/", [
      "https://auth.service.test",
      "invalid",
    ]),
  ).toBe(false);
  expect(
    isSafeAuthRedirect("https://auth.service.test/", [
      "invalid",
      "https://auth.service.test",
    ]),
  ).toBe(false);
});

it("discards raw provider errors and unknown result fields", () => {
  expect(
    readSocialAuthStartResult({
      status: "error",
      code: "failed",
      retryable: true,
      token: "secret",
    }),
  ).toEqual(authFailure());
  expect(
    readSocialAuthStartResult({
      status: "error",
      code: "secret-provider-message",
      retryable: true,
    }),
  ).toEqual(authFailure("invalid-response"));
  expect(
    readSocialAuthStartResult({
      status: "redirect",
      url: "https://auth.service.test/",
      token: "secret",
    }),
  ).toEqual({ status: "redirect", url: "https://auth.service.test/" });
});

it("posts once with caller-owned request ID, abort signal and no cache; never retries unknown outcomes", async () => {
  const fetch = vi
    .fn<typeof globalThis.fetch>()
    .mockRejectedValue(new Error("network outcome unknown"));
  const client = createSocialAuthClient({
    endpoint: "/api/social/start",
    fetch,
  });
  const controller = new AbortController();
  const input = {
    provider: "naver" as const,
    returnTo: "/account",
    intent: "link" as const,
    requestId: "caller-owned-uuid",
  };
  await expect(
    client.start(input, { signal: controller.signal }),
  ).rejects.toThrow();
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch).toHaveBeenCalledWith(
    "/api/social/start",
    expect.objectContaining({
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      redirect: "error",
      signal: expect.any(AbortSignal),
      body: JSON.stringify(input),
    }),
  );
});

it("rejects a redirect carried by a failed HTTP response and invalid local requests", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
    new Response(
      JSON.stringify({
        status: "redirect",
        url: "https://auth.service.test/",
      }),
      { status: 500 },
    ),
  );
  const client = createSocialAuthClient({
    endpoint: "/api/social/start",
    fetch,
  });
  expect(
    await client.start(
      { provider: "google", returnTo: "/account", intent: "sign-in" },
      { signal: new AbortController().signal },
    ),
  ).toEqual(authFailure("invalid-response"));
  expect(
    await client.start(
      { provider: "google", returnTo: "//evil.test", intent: "sign-in" },
      { signal: new AbortController().signal },
    ),
  ).toEqual(authFailure("invalid-request", false));
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(() =>
    createSocialAuthClient({ endpoint: "https://evil.test/", fetch }),
  ).toThrow();
});

it("bounds a stalled fetch, aborts transport and reports an unknown outcome without a retry", async () => {
  let transportSignal: AbortSignal | undefined;
  const fetch = vi.fn<typeof globalThis.fetch>(
    (_url, init) =>
      new Promise((_resolve, reject) => {
        transportSignal = init?.signal ?? undefined;
        transportSignal?.addEventListener(
          "abort",
          () => reject(new Error("aborted")),
          { once: true },
        );
      }),
  );
  const client = createSocialAuthClient({
    endpoint: "/api/social/start",
    fetch,
    timeoutMs: 250,
  });
  expect(
    await client.start(
      { provider: "google", returnTo: "/account", intent: "sign-in" },
      { signal: new AbortController().signal },
    ),
  ).toEqual(authFailure("unavailable"));
  expect(transportSignal?.aborted).toBe(true);
  expect(fetch).toHaveBeenCalledTimes(1);
});

it("allows request-scoped adapters to preserve opaque server sessions and response cookies", async () => {
  const response = new Response(null, {
    status: 303,
    headers: {
      Location: "/account",
      "Set-Cookie": "opaque=app-owned; HttpOnly; Secure; SameSite=Lax",
      "Cache-Control": "private, no-store",
    },
  });
  const contexts: string[] = [];
  const adapter: SocialAuthAdapter<
    { requestId: string },
    { encryptedSessionRef: string }
  > = {
    providers: async () => [{ id: "google", status: "available" }],
    start: async () => ({
      result: { status: "redirect", url: "https://auth.service.test/" },
      response,
    }),
    callback: async (_request, context) => {
      contexts.push(context.requestId);
      return {
        status: "authenticated",
        session: { encryptedSessionRef: context.requestId },
        response,
      };
    },
    session: async (context) => ({ encryptedSessionRef: context.requestId }),
    signOut: async () => response,
  };
  const result = await adapter.callback(
    new Request("https://service.test/auth/callback?code=opaque"),
    { requestId: "request-1" },
  );
  expect(result.response).toBe(response);
  expect(result.response.headers.get("set-cookie")).toContain("HttpOnly");
  expect(contexts).toEqual(["request-1"]);
  expect(await adapter.session({ requestId: "request-2" })).toEqual({
    encryptedSessionRef: "request-2",
  });
});
