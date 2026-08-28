import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readJson = async (path) => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), "utf8"));

test("local token resolver emits resolved, importable artifacts", async () => {
  const palette = await readJson("tokens/palette.json");
  const light = await readJson("tokens/semantic.light.json");
  const reference = light.color.bg.brand.$value.slice(1, -1).split(".");
  let expected = palette;
  for (const segment of reference) expected = expected[segment];

  const css = await readFile(new URL("../packages/dds-tokens/dist/tokens.css", import.meta.url), "utf8");
  assert.doesNotMatch(css, /\{(?:palette|foundation)\./);
  assert.match(css, new RegExp(`--dds-color-bg-brand:\\s*${expected.$value.replace("#", "#")}`, "i"));

  const built = await import(new URL("../packages/dds-tokens/dist/tokens.js", import.meta.url));
  assert.equal(built.color.light.bg.brand, expected.$value);
  assert.ok(Object.isFrozen ? typeof built.tokens === "object" : true);
});
