import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const json = async (path) => JSON.parse(await read(path));

test("dds-table pins TanStack exactly and ships the worker condition", async () => {
  const manifest = await json("packages/dds-table/package.json");
  assert.equal(manifest.name, "@devslab/dds-table");
  assert.equal(manifest.license, "SEE LICENSE IN LICENSE");
  assert.equal(manifest.publishConfig.access, "public");
  assert.equal(manifest.dependencies["@tanstack/solid-table"], "9.2.4");
  assert.equal(manifest.peerDependencies["solid-js"], "1.9.15");
  assert.equal(manifest.exports["."].worker, "./dist/server.js");
  assert.equal(manifest.exports["."].browser, "./dist/index.js");
  assert.ok(
    Object.keys(manifest.exports["."]).indexOf("worker") < Object.keys(manifest.exports["."]).indexOf("browser"),
    "Worker SSR must win when worker and browser conditions are both active",
  );
});

test("dds-table exports the table surface and nothing else", async () => {
  const entry = await read("packages/dds-table/src/index.ts");
  for (const symbol of ["DataTable", "Column", "DataTableLabels"]) {
    assert.match(entry, new RegExp(symbol), `${symbol} must be exported`);
  }
  assert.doesNotMatch(entry, /Th|Td|useDataTable/, "primitives stay unexported until a second consumer needs them");
});
