import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { resolve } from "node:path";

import { assertCleanDiagnostics } from "../src/canary-contracts.mjs";

const port = 4181;
const origin = `http://127.0.0.1:${port}`;
const gatewayConfig = resolve("fixtures/binding-gateway/wrangler.jsonc");
const serviceConfig = resolve("fixtures/binding-service/wrangler.jsonc");
const wrangler = resolve("node_modules/wrangler/bin/wrangler.js");
const startWorker = (config, workerPort, inspectorPort) => spawn(
  process.execPath,
  [
    wrangler, "dev", "-c", config,
    "--ip", "127.0.0.1",
    "--port", String(workerPort),
    "--inspector-port", String(inspectorPort),
  ],
  { cwd: process.cwd(), env: process.env, stdio: ["ignore", "pipe", "pipe"] },
);
let diagnostics = "";
const servers = [];
const trackWorker = (server) => {
  servers.push(server);
  for (const stream of [server.stdout, server.stderr]) {
    stream.on("data", (chunk) => { diagnostics += chunk.toString(); });
  }
  return server;
};
const waitForReady = async (workerOrigin, server, label) => {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`${label} exited with ${server.exitCode}\n${diagnostics}`);
    try {
      const response = await fetch(workerOrigin, { signal: AbortSignal.timeout(500) });
      if (response.ok) return response;
      await response.body?.cancel();
    } catch {}
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  throw new Error(`${label} did not become ready\n${diagnostics}`);
};
const stopWorker = async (server) => {
  if (server.exitCode !== null) return;
  server.kill();
  await Promise.race([
    once(server, "exit"),
    new Promise((resolveWait) => setTimeout(resolveWait, 5_000)),
  ]);
};

try {
  const service = trackWorker(startWorker(serviceConfig, 4182, 9230));
  const serviceResponse = await waitForReady("http://127.0.0.1:4182", service, "binding service");
  await serviceResponse.body?.cancel();
  const gateway = trackWorker(startWorker(gatewayConfig, port, 9231));
  const response = await waitForReady(origin, gateway, "binding gateway");
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
  await Promise.all(servers.reverse().map(stopWorker));
}
