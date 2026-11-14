import assert from "node:assert/strict";
import { parentPort } from "node:worker_threads";
import {
  createSocialAuthClient,
  isSafeReturnTo,
  normalizeProviders,
} from "@devslab-kr/dds-auth";
assert.equal(typeof globalThis.document, "undefined");
assert.equal(typeof globalThis.window, "undefined");
assert.equal(isSafeReturnTo("/account?search=50%25"), true);
assert.equal(normalizeProviders([]).length, 3);
assert.equal(
  typeof createSocialAuthClient({ endpoint: "/auth/start", fetch }).start,
  "function",
);
parentPort.postMessage("worker contract passed");
