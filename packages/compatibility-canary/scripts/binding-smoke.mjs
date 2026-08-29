import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

import { assertCleanDiagnostics } from "../src/canary-contracts.mjs";

const port = 4181;
const origin = `http://127.0.0.1:${port}`;
const gatewayConfig = resolve("fixtures/binding-gateway/wrangler.jsonc");
const serviceConfig = resolve("fixtures/binding-service/wrangler.jsonc");
const wrangler = resolve("node_modules/wrangler/bin/wrangler.js");
const startWorker = (config, workerPort) => spawn(
  process.execPath,
  [wrangler, "dev", "-c", config, "--ip", "127.0.0.1", "--port", String(workerPort)],
  { cwd: process.cwd(), env: process.env, stdio: ["ignore", "pipe", "pipe"] },
);
const service = startWorker(serviceConfig, 4182);
const gateway = startWorker(gatewayConfig, port);
let diagnostics = "";
for (const server of [service, gateway]) {
  for (const stream of [server.stdout, server.stderr]) {
    stream.on("data", (chunk) => { diagnostics += chunk.toString(); });
  }
}

try {
  let response;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      response = await fetch(origin);
      if (response.ok) break;
    } catch {}
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  assert.equal(response?.status, 200, diagnostics);
  const policy = response.headers.get("content-security-policy");
  const nonce = policy?.match(/'nonce-([^']+)'/)?.[1];
  assert.ok(nonce, "binding gateway CSP nonce is missing");
  const html = await response.text();
  assert.match(html, /data-service-message>binding-ok</);
  assert.match(html, new RegExp(`nonce=["']${nonce}["']`));
  assertCleanDiagnostics(diagnostics);
  console.log("Wrangler multi-config service binding and CSP nonce smoke passed");
} finally {
  gateway.kill();
  service.kill();
}
