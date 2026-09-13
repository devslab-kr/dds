import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const json = async (path) => JSON.parse(await read(path));

test("public foundation packages use the @devslab scope, source-available license, and TypeScript 7", async () => {
  const expected = {
    "packages/dds-tokens/package.json": "@devslab/dds-tokens",
    "packages/dds-css/package.json": "@devslab/dds-css",
    "packages/dds-icons/package.json": "@devslab/dds-icons",
  };

  // The fixed group moves in lockstep, so one manifest is the source of
  // truth for the version and the others must agree with it. A literal here
  // was a test that every release broke — it asserted that no release had
  // happened.
  const { version } = await json("packages/dds-tokens/package.json");
  assert.match(version, /^\d+\.\d+\.\d+$/);

  for (const [path, name] of Object.entries(expected)) {
    const manifest = await json(path);
    assert.equal(manifest.name, name);
    assert.equal(manifest.version, version, `${path} must move in lockstep with dds-tokens`);
    assert.equal(manifest.license, "SEE LICENSE IN LICENSE");
    assert.equal(manifest.publishConfig?.registry, "https://registry.npmjs.org");
    assert.equal(manifest.publishConfig?.access, "public");
    assert.equal(manifest.publishConfig?.provenance, true);
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
  assert.deepEqual(config.fixed, [["@devslab/dds-tokens", "@devslab/dds-css", "@devslab/dds-icons", "@devslab/dds-solid", "@devslab/site-kit", "@devslab/dds-table"]]);
  assert.equal(config.access, "public");
  assert.match(await read("LICENSE"), /DevsLab Source-Available License 1\.0/);
  const workflow = await read(".github/workflows/release.yml");
  // The version PR must carry the lockfile (0.5.0 failed frozen-lockfile on
  // main), and the refresh must live in the npm script: changesets/action
  // passes everything after the first word of `version:` to changesets as
  // arguments, and changesets rejects them.
  assert.equal(root.scripts["version-packages"], "changeset version && pnpm install --lockfile-only");
  assert.match(workflow, /^\s*version: pnpm version-packages\s*$/m);
  assert.match(workflow, /registry-url:\s*https:\/\/registry\.npmjs\.org/);
  assert.match(workflow, /id-token:\s*write/);
  assert.match(workflow, /npm publish|changeset publish|pnpm release/);
});

test("unpublished DDS packages bootstrap from this workspace", async () => {
  const internalDependencies = {
    "packages/dds-solid/package.json": [
      "@devslab/dds-css",
      "@devslab/dds-icons",
      "@devslab/dds-tokens",
    ],
    "packages/site-kit/package.json": ["@devslab/dds-solid"],
  };

  // `changeset version` rewrites these to `workspace:<the new version>` on
  // every release (updateInternalDependencies: "patch"), so the expectation
  // is the specifier's shape and the lockstep version, not a literal.
  const { version } = await json("packages/dds-tokens/package.json");
  for (const [path, names] of Object.entries(internalDependencies)) {
    const manifest = await json(path);
    assert.equal(manifest.version, version, `${path} must move in lockstep with dds-tokens`);
    for (const name of names) {
      assert.equal(
        manifest.dependencies?.[name],
        `workspace:${version}`,
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

test("every publishable, non-foundation package's verify:<surface> scripts are wired into CI and release", async () => {
  const root = await json("package.json");
  const ci = await read(".github/workflows/ci.yml");
  const release = await read(".github/workflows/release.yml");

  // The foundation trio (dds-tokens/dds-css/dds-icons) ships one joint gate
  // (verify:foundation*, verify:release) instead of a per-package
  // verify:<surface>:* family — already asserted by "workspace exposes
  // deterministic foundation and release verification" above, so it is
  // excluded here rather than re-checked. Every other publishable package
  // follows the per-package surface convention dds-solid established
  // (verify:<surface>:test/:a11y/:..., verify:<surface>:release), so both
  // sides of this test — which packages must be wired, and which scripts
  // wire them — are derived from the workspace and from root package.json
  // rather than hardcoded. This is the guard for the gap dds-table shipped
  // with: its verify:table:* scripts existed in package.json but were
  // invoked by neither workflow, so its tests, its a11y gate, and its
  // release check (pack, publish dry-run, fresh-consumer install) never
  // ran anywhere.
  const foundationTrio = new Set(["@devslab/dds-tokens", "@devslab/dds-css", "@devslab/dds-icons"]);
  const packageDirs = await readdir(new URL("../packages/", import.meta.url));
  const expectedSurfaces = new Set();
  for (const dir of packageDirs) {
    const manifest = await json(`packages/${dir}/package.json`);
    if (manifest.private || foundationTrio.has(manifest.name)) continue;
    expectedSurfaces.add(dir.replace(/^dds-/, ""));
  }

  const surfaceScripts = new Map(); // surface -> Set(suffix), e.g. "table" -> {"test", "a11y", "release"}
  for (const script of Object.keys(root.scripts ?? {})) {
    const match = script.match(/^verify:([a-z0-9-]+):(.+)$/);
    if (!match) continue;
    const [, surface, suffix] = match;
    if (surface === "foundation" || surface === "canary" || surface === "source") continue;
    if (!surfaceScripts.has(surface)) surfaceScripts.set(surface, new Set());
    surfaceScripts.get(surface).add(suffix);
  }

  assert.deepEqual(
    [...surfaceScripts.keys()].sort(),
    [...expectedSurfaces].sort(),
    "every non-foundation publishable package must define its own verify:<surface>:* scripts, and vice versa",
  );

  for (const [surface, suffixes] of surfaceScripts) {
    assert.ok(suffixes.has("release"), `verify:${surface}:release is required`);
    for (const suffix of suffixes) {
      const script = `verify:${surface}:${suffix}`;
      const [workflow, workflowName] = suffix === "release" ? [release, "release.yml"] : [ci, "ci.yml"];
      assert.match(
        workflow,
        new RegExp(`pnpm run ${script.replaceAll(":", "\\:")}(?:\\s|$)`, "m"),
        `${script} must run in ${workflowName}`,
      );
    }
  }
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

test("buttons rendered as links carry no anchor underline", async () => {
  const button = await read("packages/dds-css/src/button.css");
  const base = button.slice(button.indexOf(".dds-btn {"), button.indexOf("}", button.indexOf(".dds-btn {")));
  assert.match(base, /text-decoration:\s*none/, ".dds-btn must reset the UA anchor underline");
  assert.doesNotMatch(button.replace(base, ""), /text-decoration:\s*(underline|revert|initial)/, "no .dds-btn state may re-add an underline");
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
