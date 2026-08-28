import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const json = async (path) => JSON.parse(await read(path));

test("foundation packages use the final @devslab names and TypeScript 7", async () => {
  const expected = {
    "packages/dds-tokens/package.json": "@devslab/dds-tokens",
    "packages/dds-css/package.json": "@devslab/dds-css",
    "packages/dds-icons/package.json": "@devslab/dds-icons",
  };

  for (const [path, name] of Object.entries(expected)) {
    const manifest = await json(path);
    assert.equal(manifest.name, name);
    assert.equal(manifest.version, "0.1.0");
    assert.equal(manifest.publishConfig?.registry, "https://registry.npmjs.org/");
    assert.equal(manifest.publishConfig?.access, "restricted");
  }

  const tokens = await json("packages/dds-tokens/package.json");
  assert.equal(tokens.devDependencies.typescript, "7.0.2");
});

test("workspace exposes deterministic foundation and release verification", async () => {
  const root = await json("package.json");
  for (const script of ["verify:names", "verify:foundation", "verify:release"]) {
    assert.equal(typeof root.scripts?.[script], "string", `${script} is required`);
  }
  assert.equal(root.devDependencies?.["@changesets/cli"], "2.29.7");

  const config = await json(".changeset/config.json");
  assert.deepEqual(config.fixed, [["@devslab/dds-tokens", "@devslab/dds-css", "@devslab/dds-icons", "@devslab/dds-solid"]]);
});

test("buttons preserve readable CJK labels and expose 44px touch targets", async () => {
  const button = await read("packages/dds-css/src/button.css");
  const iconButton = await read("packages/dds-css/src/iconbutton.css");
  assert.match(button, /white-space:\s*normal/);
  assert.match(button, /overflow-wrap:\s*anywhere/);
  assert.match(button, /min-block-size:\s*44px/);
  assert.match(iconButton, /min-inline-size:\s*44px/);
  assert.match(iconButton, /min-block-size:\s*44px/);
});

test("CSS defines RTL, forced-colors, and reduced-motion policies", async () => {
  const base = await read("packages/dds-css/src/base.css");
  const cssFiles = await readdir(new URL("../packages/dds-css/src/", import.meta.url));
  const bundleSources = (await Promise.all(
    cssFiles.filter((name) => name.endsWith(".css")).map((name) => read(`packages/dds-css/src/${name}`)),
  )).join("\n");

  assert.match(base, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(base, /@media\s*\(forced-colors:\s*active\)/);
  assert.match(base, /\[dir=["']rtl["']\]/);
  assert.doesNotMatch(bundleSources, /\b(?:margin|padding|border)-(?:left|right)\b/);
});

test("icons publish an explicit direction policy", async () => {
  const policy = await json("packages/dds-icons/direction-policy.json");
  assert.equal(policy.schemaVersion, 1);
  assert.ok(policy.mirrorInRtl.includes("arrow-left"));
  assert.ok(policy.mirrorInRtl.includes("arrow-right"));
  assert.ok(policy.keepDirection.includes("external-link"));
});
