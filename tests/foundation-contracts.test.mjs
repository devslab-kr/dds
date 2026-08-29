import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const json = async (path) => JSON.parse(await read(path));

test("private foundation packages use the final @devslab-kr names and TypeScript 7", async () => {
  const expected = {
    "packages/dds-tokens/package.json": "@devslab-kr/dds-tokens",
    "packages/dds-css/package.json": "@devslab-kr/dds-css",
    "packages/dds-icons/package.json": "@devslab-kr/dds-icons",
  };

  for (const [path, name] of Object.entries(expected)) {
    const manifest = await json(path);
    assert.equal(manifest.name, name);
    assert.equal(manifest.version, "0.2.5");
    assert.equal(manifest.publishConfig?.registry, "https://npm.pkg.github.com");
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
  assert.deepEqual(config.fixed, [["@devslab-kr/dds-tokens", "@devslab-kr/dds-css", "@devslab-kr/dds-icons", "@devslab-kr/dds-solid", "@devslab-kr/site-kit"]]);
});

test("unpublished DDS packages bootstrap from this workspace", async () => {
  const internalDependencies = {
    "packages/dds-solid/package.json": [
      "@devslab-kr/dds-css",
      "@devslab-kr/dds-icons",
      "@devslab-kr/dds-tokens",
    ],
    "packages/site-kit/package.json": ["@devslab-kr/dds-solid"],
  };

  for (const [path, names] of Object.entries(internalDependencies)) {
    const manifest = await json(path);
    for (const name of names) {
      assert.equal(
        manifest.dependencies?.[name],
        "workspace:0.2.5",
        `${path} must resolve unpublished ${name} from the local release workspace`,
      );
    }
  }
});

test("CI keeps source-only gates separate and runs dependency-backed Stage 1-2 gates", async () => {
  const root = await json("package.json");
  const workflow = await read(".github/workflows/ci.yml");
  assert.equal(typeof root.scripts?.["verify:source:stage1-2"], "string");
  assert.doesNotMatch(root.scripts["verify:source:stage1-2"], /token-build|\bdist\b/, "source-only gate cannot require ignored build artifacts");
  assert.match(workflow, /source-contracts:/);
  assert.match(workflow, /pnpm run verify:source:stage1-2/);
  assert.match(workflow, /playwright install --with-deps chromium/);
  const foundationConfig = await read("playwright.foundation.config.ts");
  assert.doesNotMatch(foundationConfig, /channel:\s*["']chrome["']/);
  for (const gate of [
    "verify:canary:dependencies",
    "verify:canary:test",
    "verify:canary:build",
    "verify:canary:preview",
    "verify:foundation",
    "verify:release",
  ]) assert.match(workflow, new RegExp(`pnpm run ${gate.replaceAll(":", "\\:")}`), `${gate} must gate CI`);
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

test("foundation browser source asserts themes, long European labels, and media policies", async () => {
  const browser = await read("tests/browser/foundation.spec.ts");
  assert.match(browser, /data-theme/);
  assert.match(browser, /Deutsch/);
  assert.match(browser, /Portugu[eê]s/);
  assert.match(browser, /colorScheme/);
  assert.match(browser, /forcedColorAdjust/);
  assert.match(browser, /transitionDuration/);
  assert.match(browser, /animationDuration/);
});
