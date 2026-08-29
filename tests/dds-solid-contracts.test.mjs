import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const json = async (path) => JSON.parse(await read(path));

test("dds-solid is a restricted exact-version package with stable exports", async () => {
  const manifest = await json("packages/dds-solid/package.json");
  assert.equal(manifest.name, "@devslab/dds-solid");
  assert.equal(manifest.publishConfig.access, "restricted");
  assert.equal(manifest.peerDependencies["solid-js"], "2.0.0-rc.3");
  assert.equal(manifest.devDependencies["@solidjs/web"], "2.0.0-rc.3");
  assert.equal(manifest.devDependencies.typescript, "7.0.2");
  assert.equal(manifest.sideEffects.includes("./styles.css"), true);

  const entry = await read("packages/dds-solid/src/index.ts");
  for (const symbol of [
    "Button", "IconButton", "Field", "Select", "Checkbox", "Radio", "Switch",
    "Dialog", "Tabs", "TabList", "Tab", "TabPanel", "ToastProvider", "useToast",
    "Tooltip", "Icon",
  ]) assert.match(entry, new RegExp(`\\b${symbol}\\b`), `${symbol} must be exported`);
});

test("native controls preserve semantic elements and accessible names", async () => {
  const controls = await read("packages/dds-solid/src/controls.tsx");
  assert.match(controls, /<button/);
  assert.match(controls, /type="checkbox"/);
  assert.match(controls, /type="radio"/);
  assert.match(controls, /role="switch"/);
  assert.match(controls, /<select/);
  assert.match(controls, /aria-invalid/);
  assert.match(controls, /aria-describedby/);
  assert.match(controls, /"aria-label": string/);
});

test("stateful primitives expose controlled and uncontrolled contracts", async () => {
  const state = await read("packages/dds-solid/src/controllable.ts");
  const dialog = await read("packages/dds-solid/src/dialog.tsx");
  const tabs = await read("packages/dds-solid/src/tabs.tsx");
  const toast = await read("packages/dds-solid/src/toast.tsx");
  const tooltip = await read("packages/dds-solid/src/tooltip.tsx");
  assert.match(state, /createControllableSignal/);
  for (const source of [dialog, tabs, tooltip]) {
    assert.match(source, /defaultOpen|defaultValue/);
    assert.match(source, /onOpenChange|onValueChange/);
  }
  assert.match(toast, /setTimeout/);
  assert.match(toast, /clearTimeout/);
  assert.match(toast, /role=.*alert/);
});

test("Dialog and Tabs implement the required keyboard and focus lifecycle", async () => {
  const dialog = await read("packages/dds-solid/src/dialog.tsx");
  const tabs = await read("packages/dds-solid/src/tabs.tsx");
  assert.match(dialog, /Escape/);
  assert.match(dialog, /Tab/);
  assert.match(dialog, /focusable/);
  assert.match(dialog, /previouslyFocused/);
  assert.match(dialog, /aria-modal="true"/);
  for (const key of ["ArrowLeft", "ArrowRight", "Home", "End"]) assert.match(tabs, new RegExp(key));
  assert.match(tabs, /aria-controls/);
  assert.match(tabs, /aria-labelledby/);
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

test("runtime suites cover every primitive, both state modes, focus lifecycle, a11y, and hydration", async () => {
  const [primitives, a11y, ssr, release] = await Promise.all([
    read("packages/dds-solid/src/__tests__/primitives.test.tsx"),
    read("packages/dds-solid/src/__tests__/a11y.test.tsx"),
    read("packages/dds-solid/src/__tests__/ssr.test.tsx"),
    read("scripts/verify-solid-release.mjs"),
  ]);
  for (const symbol of ["IconButton", "Field", "Select", "Radio", "Switch", "Tooltip", "ToastProvider", "Icon"]) {
    assert.match(primitives, new RegExp(`\\b${symbol}\\b`), `${symbol} needs runtime coverage`);
  }
  assert.match(primitives, /controlled and uncontrolled/i);
  assert.match(primitives, /focus trap cycle/i);
  assert.match(primitives, /timer lifecycle/i);
  for (const symbol of ["Dialog", "Tabs", "Tooltip", "ToastProvider", "Radio", "IconButton"]) assert.match(a11y, new RegExp(`\\b${symbol}\\b`));
  for (const symbol of ["Dialog", "Tabs", "Tooltip", "ToastProvider", "Checkbox", "Radio", "Switch", "Select", "Field", "IconButton"]) assert.match(ssr, new RegExp(`\\b${symbol}\\b`));
  assert.match(release, /renderToString/);
  assert.match(release, /hydrate/);
  assert.match(release, /@devslab\/dds-solid/);
});

test("Toast dismiss control has an injected localized accessible name without an English fallback", async () => {
  const toast = await read("packages/dds-solid/src/toast.tsx");
  assert.match(toast, /dismissLabel/);
  assert.doesNotMatch(toast, /Dismiss notification/);
});
