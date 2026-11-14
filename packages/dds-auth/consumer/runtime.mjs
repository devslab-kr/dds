import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Worker } from "node:worker_threads";
import { createElement as h, act } from "react";
import { renderToString } from "react-dom/server";
import {
  LoginPanel,
  SocialLoginOptions,
  loginMessagesEn,
} from "@devslab-kr/dds-auth/react";
import { normalizeProviders } from "@devslab-kr/dds-auth";
import { JSDOM } from "jsdom";

assert.equal(typeof globalThis.window, "undefined");
assert.equal(
  normalizeProviders([]).every(
    (provider) => provider.status === "unconfigured",
  ),
  true,
);
const worker = new Worker(new URL("./worker.mjs", import.meta.url));
await new Promise((resolve, reject) => {
  worker.once("message", resolve);
  worker.once("error", reject);
});
await worker.terminate();
const props = {
  brand: "Packed service",
  title: "Sign in",
  providers: [{ id: "google", status: "available" }],
  client: {
    start: async () => ({
      status: "error",
      code: "unavailable",
      retryable: true,
    }),
  },
  returnTo: "/account",
  redirectOrigins: ["https://auth.example.test"],
  onRedirect() {},
  terms: { href: "/terms", label: "Terms" },
  privacy: { href: "/privacy", label: "Privacy" },
  messages: loginMessagesEn,
};
const app = h(LoginPanel, props);
const html = renderToString(app);
assert.match(html, /Continue with Google/);
assert.match(
  renderToString(h(SocialLoginOptions, { providers: [], onSelect() {} })),
  /disabled/,
);
const dom = new JSDOM(`<main id="root">${html}</main>`, {
  url: "https://service.example.test",
});
for (const key of [
  "window",
  "document",
  "HTMLElement",
  "HTMLButtonElement",
  "Node",
  "Event",
  "MouseEvent",
  "MutationObserver",
  "getComputedStyle",
  "navigator",
]) {
  Object.defineProperty(globalThis, key, {
    value: dom.window[key],
    configurable: true,
  });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { hydrateRoot } = await import("react-dom/client");
const container = document.getElementById("root");
const serverButton = container.querySelector("button");
const recoverable = [];
let root;
await act(async () => {
  root = hydrateRoot(container, app, {
    onRecoverableError: (error) => recoverable.push(error),
  });
});
assert.equal(
  container.querySelector("button"),
  serverButton,
  "Hydration must retain the server control",
);
await act(async () => {
  serverButton.click();
});
assert.match(
  container.querySelector('[role="alert"]').textContent,
  /Sign-in is unavailable/,
);
assert.equal(recoverable.length, 0);
await act(async () => root.unmount());
dom.window.close();
const moduleText = await readFile(
  new URL("./node_modules/@devslab-kr/dds-auth/dist/react.js", import.meta.url),
  "utf8",
);
assert.ok(
  moduleText.startsWith('"use client";'),
  "Published React entry must preserve the Next client boundary",
);
console.log(
  "Packed Node/worker import, server rendering, hydration identity and error interaction passed",
);
