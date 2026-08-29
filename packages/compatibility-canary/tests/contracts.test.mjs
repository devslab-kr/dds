import assert from "node:assert/strict";
import test from "node:test";

import {
  assertCleanDiagnostics,
  assertNoLikelySecrets,
  createCanaryServerFunction,
  renderCanaryDocument,
  routeRequest,
} from "../src/canary-contracts.mjs";

test("SSR output carries localized head, static asset, and hydration state", () => {
  const html = renderCanaryDocument({
    locale: "ko",
    requestId: "req-test-001",
    serviceMessage: "binding-ok",
  });

  assert.match(html, /^<!doctype html><html lang="ko">/);
  assert.match(html, /<title>DDS 호환성 카나리<\/title>/);
  assert.match(html, /<meta name="description" content="Solid 2 호환성 검증">/);
  assert.match(html, /<link rel="icon" href="\/canary\.svg">/);
  assert.match(html, /data-hydration-key="canary-root"/);
  assert.match(html, /"requestId":"req-test-001"/);
  assert.match(html, /"serviceMessage":"binding-ok"/);
});

test("server function reads request context and service-binding-shaped interface", async () => {
  const serverFunction = createCanaryServerFunction({
    requestId: "req-test-002",
    services: {
      CANARY_SERVICE: {
        fetch: async (request) =>
          Response.json({ message: new URL(request.url).searchParams.get("message") }),
      },
    },
  });

  assert.deepEqual(await serverFunction("from-binding"), {
    requestId: "req-test-002",
    serviceMessage: "from-binding",
  });
});

test("unknown routes return a custom 404 instead of falling through", async () => {
  const response = await routeRequest(new Request("https://canary.invalid/missing"), {
    requestId: "req-test-003",
    services: {
      CANARY_SERVICE: { fetch: async () => Response.json({ message: "unused" }) },
    },
  });

  assert.equal(response.status, 404);
  assert.match(await response.text(), /DDS canary route not found/);
});

test("Worker response propagates one CSP nonce into every executable script", async () => {
  const response = await routeRequest(new Request("https://canary.invalid/"), {
    requestId: "req-test-nonce",
    nonce: "nonce-test-value",
    services: {
      CANARY_SERVICE: { fetch: async () => Response.json({ message: "binding-ok" }) },
    },
  });

  const policy = response.headers.get("content-security-policy");
  assert.match(policy, /script-src 'self' 'nonce-nonce-test-value'/);
  const html = await response.text();
  assert.match(html, /<script[^>]+nonce="nonce-test-value"/);
  assert.doesNotMatch(html, /<script(?![^>]+nonce="nonce-test-value")[^>]*>/);
});

test("diagnostic gate rejects hydration warnings, peer overrides, route leaks, and secrets", () => {
  for (const diagnostic of [
    "Hydration completed but contains mismatches",
    "Hydration completed with 1 unclaimed server-rendered node(s)",
    "WARN Issues with peer dependencies found",
    "No route matches URL /missing",
    "CLOUDFLARE_API_TOKEN=super-secret-value",
    '{"CLOUDFLARE_API_TOKEN":"abcdefghijklmnop"}',
  ]) {
    assert.throws(() => assertCleanDiagnostics(diagnostic), /canary verification rejected/i);
  }

  assert.doesNotThrow(() => assertCleanDiagnostics("canary preview ready on local workerd"));
});

test("secret gate rejects a high-entropy sentinel even when its key was removed", () => {
  const sentinel = "dds_sentinel_7VYk9qL2mN4pR8tW6xZ1cF3h";
  assert.throws(
    () => assertNoLikelySecrets(`compiled value: ${sentinel}`, "fixture", [sentinel]),
    /likely secret/i,
  );
});
