import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const json = async (path) => JSON.parse(await read(path));

test("dds-solid is a public exact-version package with stable exports", async () => {
  const manifest = await json("packages/dds-solid/package.json");
  assert.equal(manifest.name, "@devslab/dds-solid");
  assert.equal(manifest.license, "SEE LICENSE IN LICENSE");
  assert.equal(manifest.publishConfig.access, "public");
  assert.equal(manifest.peerDependencies["solid-js"], "1.9.15");
  assert.equal(manifest.peerDependencies["@solidjs/web"], undefined);
  assert.equal(manifest.devDependencies["@solidjs/web"], undefined);
  assert.equal(manifest.devDependencies["@types/node"], "26.3.0");
  assert.equal(manifest.devDependencies.typescript, "7.0.2");
  assert.equal(manifest.sideEffects.includes("./styles.css"), true);
  assert.equal(manifest.exports["."].browser, "./dist/index.js");
  assert.equal(manifest.exports["."].worker, "./dist/server.js");
  assert.equal(manifest.exports["."].workerd, "./dist/server.js");
  assert.equal(manifest.exports["."].node, "./dist/server.js");
  assert.ok(
    Object.keys(manifest.exports["."]).indexOf("worker") < Object.keys(manifest.exports["."]).indexOf("browser"),
    "Worker SSR must win when worker and browser conditions are both active",
  );

  const entry = await read("packages/dds-solid/src/index.ts");
  for (const symbol of [
    "Button", "IconButton", "Field", "Select", "Checkbox", "Radio", "Switch",
    "Dialog", "Tabs", "TabList", "Tab", "TabPanel", "ToastProvider", "useToast",
    "Tooltip", "Icon", "createStatusPill", "ConsoleShell",
  ]) assert.match(entry, new RegExp(`\\b${symbol}\\b`), `${symbol} must be exported`);
});

test("Icon and style adapters consume DDS framework-neutral contracts", async () => {
  const icon = await read("packages/dds-solid/src/icon.tsx");
  const styles = await read("packages/dds-solid/styles.css");
  assert.match(icon, /directionPolicy/);
  assert.match(icon, /aria-hidden/);
  assert.match(icon, /role=.*"img"/);
  assert.match(styles, /@devslab\/dds-tokens\/tokens\.css/);
  assert.match(styles, /@devslab\/dds-css\/dds\.css/);
});

test("Toast dismiss control has an injected localized accessible name without an English fallback", async () => {
  const toast = await read("packages/dds-solid/src/toast.tsx");
  assert.match(toast, /dismissLabel/);
  assert.doesNotMatch(toast, /Dismiss notification/);
});
