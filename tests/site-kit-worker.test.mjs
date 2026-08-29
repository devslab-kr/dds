import assert from "node:assert/strict";
import test from "node:test";

import worker from "../packages/site-kit/fixtures/worker/src/index.mjs";

test("Worker fixture emits preview robots and localized RTL metadata", async () => {
  const robots = await worker.fetch(new Request("https://preview.example/robots.txt"));
  assert.equal(robots.status, 200);
  assert.match(await robots.text(), /Disallow: \//);

  const metadata = await worker.fetch(new Request("https://preview.example/metadata"));
  assert.equal(metadata.status, 200);
  assert.deepEqual((await metadata.json()).html, { lang: "ar", dir: "rtl" });

  const missing = await worker.fetch(new Request("https://preview.example/missing"));
  assert.equal(missing.status, 404);
});
