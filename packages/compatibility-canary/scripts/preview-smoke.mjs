import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

import { assertCleanDiagnostics } from "../src/canary-contracts.mjs";

const port = 4179;
const origin = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, [resolve("node_modules/vite/bin/vite.js"), "preview", "--host", "127.0.0.1", "--port", String(port)], {
  cwd: process.cwd(),
  env: process.env,
  stdio: ["ignore", "pipe", "pipe"],
});
let diagnostics = "";
for (const stream of [server.stdout, server.stderr]) stream.on("data", (chunk) => { diagnostics += chunk; });

try {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { if ((await fetch(origin)).ok) break; } catch {}
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }

  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const page = await browser.newPage();
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) diagnostics += `\n${message.type()}: ${message.text()}`;
    });
    page.on("pageerror", (error) => { diagnostics += `\npageerror: ${error.message}`; });
    const response = await page.goto(origin, { waitUntil: "networkidle" });
    assert.equal(response?.status(), 200);
    await page.waitForSelector('html[data-canary-hydrated="true"]');
    await page.waitForSelector('[data-service-message]:has-text("service-binding-ok")');
    assert.match(await page.title(), /DDS 호환성 카나리/);
    assert.equal((await page.request.get(`${origin}/canary.svg`)).status(), 200);
    assert.equal((await page.request.get(`${origin}/missing`)).status(), 404);
    assertCleanDiagnostics(diagnostics);
  } finally {
    await browser.close();
  }
  console.log("workerd preview SSR, hydration, binding, asset, and 404 smoke passed");
} finally {
  server.kill();
}
