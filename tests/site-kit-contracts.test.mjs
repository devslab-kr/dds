import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const json = async (path) => JSON.parse(await read(path));

test("site-kit exposes runtime-neutral, Solid, TanStack, and stylesheet boundaries", async () => {
  const manifest = await json("packages/site-kit/package.json");
  assert.equal(manifest.name, "@devslab/site-kit");
  assert.equal(manifest.license, "SEE LICENSE IN LICENSE");
  assert.equal(manifest.publishConfig.access, "public");
  for (const path of [".", "./solid", "./tanstack-start", "./styles.css"]) assert.ok(manifest.exports[path]);
  assert.equal(manifest.exports["./solid"].types, "./dist/index.d.ts");
  assert.equal(manifest.exports["./solid"].browser, "./dist/solid.js");
  assert.equal(manifest.exports["./solid"].worker, "./dist/solid.server.js");
  assert.equal(manifest.exports["./solid"].workerd, "./dist/solid.server.js");
  assert.equal(manifest.exports["./solid"].node, "./dist/solid.server.js");
  assert.ok(
    Object.keys(manifest.exports["./solid"]).indexOf("worker") < Object.keys(manifest.exports["./solid"]).indexOf("browser"),
    "Worker SSR must win when worker and browser conditions are both active",
  );
  assert.match(manifest.scripts.build, /vite build --config vite\.server\.config\.ts/);
  assert.match(await read("packages/site-kit/vite.server.config.ts"), /solid\.server\.js/);
  assert.match(await read("packages/site-kit/vitest.config.ts"), /@devslab\/dds-solid/);
  assert.equal(manifest.peerDependencies["solid-js"], "1.9.15");
  assert.equal(manifest.peerDependencies["@solidjs/web"], undefined);
  assert.equal(manifest.devDependencies["@types/node"], "26.3.0");
  assert.equal(manifest.devDependencies.typescript, "7.0.2");
});

test("Solid adapter exports every shared public-site shell", async () => {
  const source = await read("packages/site-kit/src/solid/index.ts");
  for (const symbol of [
    "SiteHeader", "LocaleMenu", "ThemeToggle", "MarketingShell", "SiteFooter",
    "LegalLayout", "StatusBanner", "RequestAccessForm", "NotFoundLayout", "ErrorLayout",
    "OssProductMark", "OssProductMarkProps",
  ]) assert.match(source, new RegExp(`\\b${symbol}\\b`), `${symbol} missing`);
});

test("OSS product marks remain caller-supplied and reference the canonical brand source", async () => {
  const component = await read("packages/site-kit/src/solid/oss-product-mark.tsx");
  const styles = await read("packages/site-kit/styles.css");
  assert.match(component, /src:\s*string/);
  assert.match(component, /name:\s*string/);
  assert.match(component, /decoding="async"/);
  assert.match(component, /props\.decorative\s*\?\s*""\s*:\s*props\.name/);
  assert.doesNotMatch(component, /editor-ruler|ssrf-guard|numkey|kokey/, "DDS must not duplicate Q-line routes");
  assert.match(styles, /\.oss-product-mark/);
  assert.match(styles, /block-size/);
  assert.doesNotMatch(styles, /\.oss-product-mark[^}]*animation\s*:/s);
  assert.match(await read("brand/index.html"), /https:\/\/devslab\.kr\/brand\/open-source\//);
  assert.match(await read("brand/index.html"), /oss-brand\/releases\/tag\/v0\.3\.0/);
});

test("public chrome requires injected copy and keeps forms native", async () => {
  const chrome = await read("packages/site-kit/src/solid/chrome.tsx");
  const layouts = await read("packages/site-kit/src/solid/layouts.tsx");
  const form = await read("packages/site-kit/src/solid/request-access.tsx");
  assert.match(chrome, /messages:\s*SiteMessages/);
  assert.match(layouts, /messages:\s*SiteMessages/);
  assert.match(layouts, /id="main-content"[^>]*tabIndex=\{-1\}/, "skip target must accept programmatic focus");
  assert.match(form, /<form/);
  assert.match(form, /type="email"/);
  assert.match(form, /aria-live/);
  assert.doesNotMatch(
    `${chrome}\n${layouts}\n${form}`,
    /props\.messages\.[A-Za-z0-9_]+\s*\?\?/,
    "translated product copy must never fall back at runtime",
  );
  assert.match(layouts, /href=\{props\.homeHref\}/, "not-found navigation must remain a semantic link");
});

test("TanStack adapter maps metadata without owning product facts", async () => {
  const source = await read("packages/site-kit/src/tanstack-start.mjs");
  assert.match(source, /toTanStackHead/);
  assert.match(source, /canonical/);
  assert.match(source, /hreflang/);
  assert.doesNotMatch(source, /VisionLinq|BookLinq|AskLinq/);
});

test("shared styles use logical properties and include RTL/mobile policies", async () => {
  const styles = await read("packages/site-kit/styles.css");
  assert.match(styles, /inline-size/);
  assert.match(styles, /border-inline-start/);
  assert.match(styles, /@media \(max-width:/);
  assert.doesNotMatch(styles, /\b(?:margin|padding|border)-(?:left|right)\b/);
  assert.match(styles, /\.dds-sr-only:focus/);
  const worker = await read("packages/site-kit/fixtures/worker/src/index.mjs");
  assert.match(worker, /environment: "preview"/);
});

test("Worker and browser fixtures consume adapters and prove hydration plus Arabic RTL", async () => {
  const [worker, browser, ssr, release, workflow, root] = await Promise.all([
    read("packages/site-kit/fixtures/worker/src/index.tsx"),
    read("tests/browser/site-kit.spec.ts"),
    read("packages/site-kit/src/solid/__tests__/ssr.test.tsx"),
    read("scripts/verify-solid-release.mjs"),
    read(".github/workflows/ci.yml"),
    json("package.json"),
  ]);
  assert.match(worker, /@devslab\/site-kit\/solid/);
  assert.match(worker, /toTanStackHead/);
  assert.match(worker, /renderToString/);
  assert.match(worker, /data-site-hydration/);
  assert.doesNotMatch(worker, /escapeHtml\(JSON\.stringify/, "hydration JSON must remain parseable script data");
  assert.match(ssr, /renderToString/);
  assert.match(release, /hydrate/);
  assert.match(release, /diagnostics\.length/);
  assert.match(browser, /375/);
  assert.match(browser, /1280/);
  assert.match(browser, /dir="rtl"/);
  assert.match(browser, /scrollWidth/);
  assert.match(browser, /toBeFocused/);
  assert.match(browser, /aria-expanded/);
  assert.equal(typeof root.scripts?.["verify:site-kit:browser"], "string");
  for (const gate of ["verify:source:stage3-4", "verify:solid:test", "verify:solid:a11y", "verify:solid:release", "verify:site-kit:ui", "verify:site-kit:browser", "verify:site-kit:release"]) {
    assert.match(workflow, new RegExp(gate.replaceAll(":", "\\:")), `${gate} must gate CI`);
  }
});
