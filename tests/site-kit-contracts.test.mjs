import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const json = async (path) => JSON.parse(await read(path));

test("site-kit exposes runtime-neutral, Solid, TanStack, and stylesheet boundaries", async () => {
  const manifest = await json("packages/site-kit/package.json");
  assert.equal(manifest.name, "@devslab/site-kit");
  assert.equal(manifest.publishConfig.access, "restricted");
  for (const path of [".", "./solid", "./tanstack-start", "./styles.css"]) assert.ok(manifest.exports[path]);
  assert.equal(manifest.peerDependencies["solid-js"], "2.0.0-rc.3");
  assert.equal(manifest.devDependencies.typescript, "7.0.2");
});

test("Solid adapter exports every shared public-site shell", async () => {
  const source = await read("packages/site-kit/src/solid/index.ts");
  for (const symbol of [
    "SiteHeader", "LocaleMenu", "ThemeToggle", "MarketingShell", "SiteFooter",
    "LegalLayout", "StatusBanner", "RequestAccessForm", "NotFoundLayout", "ErrorLayout",
  ]) assert.match(source, new RegExp(`\\b${symbol}\\b`), `${symbol} missing`);
});

test("public chrome requires injected copy and keeps forms native", async () => {
  const chrome = await read("packages/site-kit/src/solid/chrome.tsx");
  const layouts = await read("packages/site-kit/src/solid/layouts.tsx");
  const form = await read("packages/site-kit/src/solid/request-access.tsx");
  assert.match(chrome, /messages:\s*SiteMessages/);
  assert.match(layouts, /messages:\s*SiteMessages/);
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
  assert.match(styles, /margin-inline-start/);
  assert.match(styles, /border-inline-start/);
  assert.match(styles, /@media \(max-width:/);
  assert.doesNotMatch(styles, /\b(?:margin|padding|border)-(?:left|right)\b/);
  const worker = await read("packages/site-kit/fixtures/worker/src/index.mjs");
  assert.match(worker, /environment: "preview"/);
});
