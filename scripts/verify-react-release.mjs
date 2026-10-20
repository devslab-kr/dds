import assert from "node:assert/strict";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const mode = process.argv[2] ?? "react";
assert.ok(["react", "table-react"].includes(mode), "Usage: node scripts/verify-react-release.mjs [react|table-react] [--react-version=18.3.1|19.3.0] [--publish-dry-run]");
const reactVersion = process.argv.find(value => value.startsWith("--react-version="))?.split("=")[1] ?? "19.3.0";
assert.ok(["18.3.1", "19.3.0"].includes(reactVersion), "React consumer version must be 18.3.1 or 19.3.0");
const reactTypes = reactVersion.startsWith("18.") ? "18" : "19.3.0";
const workspace = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const temp = await mkdtemp(join(tmpdir(), `dds-${mode}-release-`));
const target = `dds-${mode}`;
const npmPrefix = process.platform === "win32" ? [join(dirname(process.execPath), "node_modules/npm/bin/npm-cli.js")] : [];
const pnpmPrefix = process.platform === "win32" ? [join(dirname(process.execPath), "node_modules/corepack/dist/pnpm.js")] : [];
function run(command, args, cwd = temp, prefix = []) {
  const result = spawnSync(command, [...prefix, ...args], {
    cwd, encoding: "utf8", maxBuffer: 8 * 1024 * 1024, timeout: 300_000,
    env: { ...process.env, NO_COLOR: "1", NPM_CONFIG_CACHE: join(temp, ".npm-cache") },
  });
  if (result.error || result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed\n${result.error ?? ""}\n${result.stdout}\n${result.stderr}`);
  return result.stdout;
}
const npm = (args, cwd) => run(process.platform === "win32" ? process.execPath : "npm", args, cwd, npmPrefix);
const pnpm = (args, cwd) => run(process.platform === "win32" ? process.execPath : "pnpm", args, cwd, pnpmPrefix);
const node = (args) => run(process.execPath, args);

try {
  const tarballs = [];
  for (const packageName of ["dds-tokens", "dds-css", "dds-icons", target]) {
    const root = join(workspace, "packages", packageName);
    const manifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
    pnpm(["pack", "--pack-destination", temp], root);
    tarballs.push(join(temp, `${manifest.name.replace(/^@/, "").replace("/", "-")}-${manifest.version}.tgz`));
  }
  // Optional because registry availability should not decide a consumer gate.
  // This command never publishes; the fresh install below always runs.
  if (process.argv.includes("--publish-dry-run")) {
    const tarball = tarballs.at(-1);
    try { npm(["publish", tarball, "--dry-run", "--json", "--ignore-scripts"]); }
    catch (error) {
      if (!/cannot publish over the previously published versions/i.test(String(error))) throw error;
      console.log(`${basename(tarball)} is already published; dry-run skipped`);
    }
  }
  await writeFile(join(temp, "package.json"), JSON.stringify({ private: true, type: "module" }));
  console.log(`Installing fresh ${target} tarball consumer`);
  npm(["install", "--ignore-scripts", "--no-audit", "--no-fund", ...tarballs,
    `react@${reactVersion}`, `react-dom@${reactVersion}`, "jsdom@30.0.1", "typescript@7.0.2", `@types/react@${reactTypes}`, `@types/react-dom@${reactTypes}`]);
  for (const name of ["dds-tokens", "dds-css", "dds-icons", target]) {
    const root = join(temp, "node_modules/@devslab", name);
    const manifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
    await access(join(root, "LICENSE"));
    assert.equal(manifest.name, `@devslab/${name}`);
    const exportedFiles = value => typeof value === "string" ? [value] : Object.values(value ?? {}).flatMap(exportedFiles);
    for (const path of exportedFiles(manifest.exports)) {
      if (path.startsWith("./") && !path.includes("*")) await access(join(root, path));
    }
    for (const version of Object.values(manifest.dependencies ?? {})) assert.ok(!version.startsWith("workspace:"), "Packed dependencies must resolve workspace protocols");
  }
  const installed = join(temp, "node_modules/@devslab", target);
  const manifest = JSON.parse(await readFile(join(installed, "package.json"), "utf8"));
  for (const path of ["dist/index.js", "dist/index.d.ts", mode === "react" ? "styles.css" : "dist/styles.css"]) await access(join(installed, path));
  assert.ok(manifest.peerDependencies.react.includes("^19.0.0"));
  assert.ok(manifest.peerDependencies["react-dom"].includes("^19.0.0"));
  const source = await readFile(join(installed, "dist/index.js"), "utf8");
  assert.match(source, /(?:from\s*|import\s*)["']react(?:\/jsx-runtime)?["']/, "React must remain external");
  assert.match(source, mode === "react" ? /["']@ark-ui\/react(?:\/[^"']+)?["']/ : /["']ag-grid-react["']/, "Native library must remain external");

  const app = mode === "react" ? `
import { Button, Checkbox, DatePicker, Field, Icon, Tabs, TabList, Tab, TabPanel } from "@devslab/dds-react";
export const events = [];
export const dates = [];
export let dateValidity;
const reportDateValidity = state => { dateValidity = state; };
export function App() {
  const [date, setDate] = useState("2028-01-01");
  return h("section", null,
    h(DatePicker, { label: "Packed date", locale: "ko-KR", value: date, onChange: value => { dates.push(value); setDate(value); }, onValidityChange: reportDateValidity }),
    h(Button, { id: "consumer-button", onClick: () => events.push("button") }, "Fresh consumer", h(Icon, { name: "check", label: "Complete" })),
    h(Field, { label: "Name", helpText: "Your name" }, props => h("input", { ...props, defaultValue: "Consumer" })),
    h(Checkbox, { name: "agree", label: "Agree", defaultChecked: true, onCheckedChange: value => events.push(value) }),
    h(Tabs, { defaultValue: "one", onValueChange: value => events.push(value) },
      h(TabList, null, h(Tab, { value: "one" }, "One"), h(Tab, { value: "two" }, "Two")),
      h(TabPanel, { value: "one" }, "First panel"), h(TabPanel, { value: "two" }, "Second panel")));
}
` : `
import { DataTable } from "@devslab/dds-table-react";
export const gridRef = createRef();
export const regionRef = createRef();
export const events = [];
export function App() {
  return h(DataTable, {
    ref: regionRef, gridRef, rows: [{ name: "Fresh consumer" }], label: "Consumer grid",
    columns: [{ field: "name", cellRenderer: ({ value }) => h("strong", null, value) }],
    placeholder: h("p", { id: "grid-placeholder" }, "Preparing grid"),
    gridProps: { onGridReady: event => events.push(event.api), suppressColumnVirtualisation: true, suppressRowVirtualisation: true, domLayout: "autoHeight" },
  });
}
`;
  await writeFile(join(temp, "app.mjs"), 'import { createElement as h, createRef, useState } from "react";\n' + app);
  await writeFile(join(temp, "ssr.mjs"), `
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
assert.equal(typeof window, "undefined"); assert.equal(typeof document, "undefined");
const diagnostics = [];
console.warn = (...values) => diagnostics.push(values.join(" "));
console.error = (...values) => diagnostics.push(values.join(" "));
const { App } = await import("./app.mjs");
const html = renderToString(createElement(App));
assert.ok(html.includes(${JSON.stringify(mode === "react" ? "Fresh consumer" : "Preparing grid")}));
${mode === "table-react" ? 'assert.ok(html.includes(\'aria-busy="true"\')); assert.ok(!html.includes(\'role="grid"\'));' : 'assert.ok(html.includes(\'name="agree"\'));'}
${mode === "react" ? 'assert.ok(html.includes(\'value="2028/01/01"\'), "Packed Korean DatePicker SSR display is incorrect");' : ''}
assert.deepEqual(diagnostics, [], "Browser-free SSR emitted diagnostics");
// React 19's web server entry retains MessageChannel handles under Node's
// worker condition. Finish this isolated SSR process after its result flushes.
process.stdout.write(JSON.stringify({ html }), () => process.exit(0));
`);
  await writeFile(join(temp, "ssr.json"), node([join(temp, "ssr.mjs")]));
  // Workers select web server exports even though no browser globals exist.
  const workerPayload = JSON.parse(node(["--conditions=worker", join(temp, "ssr.mjs")]));
  assert.ok(workerPayload.html.length > 0, "Worker-conditioned SSR returned no markup");
  await writeFile(join(temp, "hydrate.mjs"), `
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
const { html } = JSON.parse(await readFile(new URL("./ssr.json", import.meta.url), "utf8"));
const dom = new JSDOM('<!doctype html><html><body><main id="root">' + html + '</main></body></html>', { pretendToBeVisual: true, url: "http://localhost" });
for (const key of ["window", "document", "Node", "Element", "HTMLElement", "HTMLInputElement", "HTMLFormElement", "SVGElement", "Document", "ShadowRoot", "MutationObserver", "navigator", "CustomEvent", "getComputedStyle", "requestAnimationFrame", "cancelAnimationFrame"]) {
  const value = dom.window[key];
  Object.defineProperty(globalThis, key, { value: typeof value === "function" && /^[a-z]/.test(key) ? value.bind(dom.window) : value, configurable: true, writable: true });
}
// jsdom has no layout observer; AG Grid itself and its React renderer are real.
globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
const diagnostics = []; const originalWarn = console.warn; const originalError = console.error;
console.warn = (...values) => diagnostics.push(values.join(" "));
console.error = (...values) => diagnostics.push(values.join(" "));
const { createElement: h } = await import("react");
const { hydrateRoot } = await import("react-dom/client");
const app = await import("./app.mjs");
const host = document.querySelector("#root");
const initial = [...host.querySelectorAll("*")];
// Ark Portal renders inline on the server, then mounts the positioner in body.
// Preserve every server node outside that known portal transition boundary.
const initialPortal = host.querySelector('[data-scope="date-picker"][data-part="positioner"]');
const initialPrimitives = initial.filter(element => !initialPortal?.contains(element));
const initialDateRoot = host.querySelector('[data-scope="date-picker"][data-part="root"]');
const initialDateControl = host.querySelector('[data-scope="date-picker"][data-part="control"]');
const initialDateInput = host.querySelector('input[placeholder="YYYY/MM/DD"]');
const root = hydrateRoot(host, h(app.App), { onRecoverableError: error => diagnostics.push(String(error)), onUncaughtError: error => diagnostics.push(String(error)) });
const pause = () => new Promise(resolve => setTimeout(resolve, 20));
async function until(predicate, message) { for (let i = 0; i < 250; i++) { if (predicate()) return; await pause(); } throw new Error(message); }
try {
${mode === "react" ? `
  await until(() => host.querySelector('[role="tab"][aria-selected="true"]'), "Tabs failed to hydrate");
  await pause(); await pause();
  for (const element of initialPrimitives) assert.ok(host.contains(element), "Hydration replaced server primitive DOM");
  assert.ok(initialPortal?.id, "Server DatePicker portal positioner is missing");
  assert.ok(initialDateRoot && initialDateControl && initialDateInput, "Server DatePicker control DOM is missing");
  assert.equal(host.querySelector('[data-scope="date-picker"][data-part="root"]'), initialDateRoot);
  assert.equal(host.querySelector('[data-scope="date-picker"][data-part="control"]'), initialDateControl);
  assert.equal(host.querySelector('input[placeholder="YYYY/MM/DD"]'), initialDateInput);
  const bodyPortal = document.getElementById(initialPortal.id);
  assert.ok(bodyPortal && bodyPortal !== initialPortal, "DatePicker portal did not promote its server subtree");
  assert.equal(bodyPortal.parentElement, document.body, "DatePicker portal has the wrong client container");
  assert.equal(host.querySelector('[data-scope="date-picker"][data-part="positioner"]'), null, "Inline server portal survived promotion");
  const input = host.querySelector('input[name="agree"]');
  assert.equal(input.checked, true); input.click();
  await until(() => app.events.includes(false), "Checkbox did not invoke its native callback");
  assert.equal(input.checked, false);
  host.querySelectorAll('[role="tab"]')[1].click();
  await until(() => app.events.includes("two"), "Tab did not change");
  assert.equal(host.querySelector('[role="tab"][aria-selected="true"]').textContent, "Two");
  host.querySelector("#consumer-button").click();
  assert.ok(app.events.includes("button"));
  await until(() => app.dateValidity?.value === "2028-01-01", "Packed DatePicker did not report initial canonical validity");
  const dateInput = host.querySelector('input[placeholder="YYYY/MM/DD"]');
  assert.ok(dateInput, "Packed Korean DatePicker input is missing");
  assert.equal(dateInput.value, "2028/01/01");
  const setInput = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value").set;
  const typeDate = value => { setInput.call(dateInput, value); dateInput.dispatchEvent(new dom.window.Event("input", { bubbles: true })); };
  typeDate("2028/02/29");
  await until(() => app.dates.at(-1) === "2028-02-29" && app.dateValidity?.value === "2028-02-29", "Packed DatePicker did not emit canonical leap date");
  assert.equal(dateInput.value, "2028/02/29");
  assert.equal(app.dateValidity.valid, true);
  assert.equal(dateInput.checkValidity(), true);
  const committedDates = app.dates.length;
  typeDate("2028/02/31");
  await until(() => app.dateValidity?.inputValue === "2028/02/31" && app.dateValidity?.value === null, "Packed DatePicker did not retain invalid draft");
  await pause(); await pause();
  assert.equal(dateInput.value, "2028/02/31");
  assert.equal(app.dateValidity.valid, false);
  assert.equal(dateInput.checkValidity(), false);
  assert.equal(app.dates.length, committedDates, "Invalid draft emitted a canonical change");
` : `
  const region = initial[0];
  assert.ok(initial.some(element => element.id === "grid-placeholder"));
  await until(() => app.events.length === 1 && host.querySelector('[role="grid"]') && host.querySelector("strong"), "Actual AG Grid did not become ready/render rows");
  assert.equal(host.firstElementChild, region, "Grid hydration replaced its SSR region");
  assert.equal(app.regionRef.current, region);
  assert.equal(host.querySelector("#grid-placeholder"), null);
  assert.equal(host.querySelector('[role="grid"]').getAttribute("aria-label"), "Consumer grid");
  assert.equal(host.querySelector("strong").textContent, "Fresh consumer");
  assert.equal(app.gridRef.current.api.getDisplayedRowCount(), 1);
  assert.equal(app.events[0], app.gridRef.current.api);
`}
} finally {
  root.unmount();
  console.warn = originalWarn; console.error = originalError;
}
assert.equal(host.childElementCount, 0, "Unmount left consumer DOM behind");
if (initialPortal) assert.equal(document.getElementById(initialPortal.id), null, "Unmount left DatePicker body portal behind");
${mode === "table-react" ? 'assert.equal(app.events[0].isDestroyed(), true, "AG Grid API survived unmount"); assert.equal(app.gridRef.current, null); assert.equal(app.regionRef.current, null);' : ''}
assert.deepEqual(diagnostics, [], "Hydration or native library emitted diagnostics");
dom.window.close();
`);
  node([join(temp, "hydrate.mjs")]);
  await writeFile(join(temp, "consumer.tsx"), mode === "react" ? `
import { Button, Checkbox, Field, Tabs, Tab, TabList, TabPanel, DatePicker, type DatePickerProps, type DatePickerValidity, type ButtonProps } from "@devslab/dds-react";
const props: ButtonProps = { tone: "primary", onClick: event => event.currentTarget.focus() };
const dateProps: DatePickerProps = { label: "Packed date", value: "2028-01-01", locale: "ko-KR", required: true, readOnly: false, onChange: value => { value satisfies string; }, onValidityChange: (state: DatePickerValidity) => { state.value satisfies string | null; state.inputValue satisfies string; state.valid satisfies boolean; } };
export const consumer = <><DatePicker {...dateProps}/><Button {...props}>Save</Button><Checkbox label="Agree" onCheckedChange={value => value satisfies boolean}/><Field label="Name">{control => <input {...control}/>}</Field><Tabs defaultValue="one"><TabList><Tab value="one">One</Tab></TabList><TabPanel value="one">First</TabPanel></Tabs></>;
` : `
import { createRef } from "react";
import { DataTable, ddsGridTheme, type DataTableRef, type DataTableProps } from "@devslab/dds-table-react";
type Row = { name: string };
const gridRef = createRef<DataTableRef<Row>>();
const props: DataTableProps<Row> = { rows: [{ name: "Consumer" }], columns: [{ field: "name" }], label: "Names", gridRef, gridProps: { theme: ddsGridTheme, onGridReady: event => event.api.getDisplayedRowCount() } };
export const consumer = <DataTable {...props}/>;
`);
  await writeFile(join(temp, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022", module: "ESNext", moduleResolution: "Bundler", jsx: "react-jsx", strict: true, skipLibCheck: true, noEmit: true }, files: ["consumer.tsx"] }));
  node([join(temp, "node_modules/typescript/bin/tsc"), "-p", join(temp, "tsconfig.json")]);
  if (mode === "react") {
    // Exercise StrictMode and new roots using the same installed package/React
    // version as the preserved DatePicker/checkbox/tabs consumer above.
    await writeFile(join(temp, "component-app.mjs"), await readFile(join(workspace, "scripts/fixtures/component-react-consumer.mjs"), "utf8"));
    await writeFile(join(temp, "component-ssr.mjs"), `
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
assert.equal(typeof window, "undefined"); assert.equal(typeof document, "undefined");
const diagnostics=[];
console.warn=(...values)=>diagnostics.push(values.join(" "));
console.error=(...values)=>diagnostics.push(values.join(" "));
const { App }=await import("./component-app.mjs");
const html=renderToString(createElement(App));
assert.deepEqual(diagnostics,[],"New components emitted browser-free SSR diagnostics");
process.stdout.write(JSON.stringify({html}),()=>process.exit(0));
`);
    await writeFile(join(temp, "component-ssr.json"), node([join(temp, "component-ssr.mjs")]));
    const componentWorker = JSON.parse(node(["--conditions=worker", join(temp, "component-ssr.mjs")]));
    assert.ok(componentWorker.html.includes("component-input"), "Worker SSR omitted new input controls");
    await writeFile(join(temp, "component-hydrate.mjs"), await readFile(join(workspace, "scripts/fixtures/component-react-hydrate.mjs"), "utf8"));
    node([join(temp, "component-hydrate.mjs")]);
  }
  if(mode === "react") {
    await writeFile(join(temp,"component-subpaths.mjs"), `import assert from "node:assert/strict";
import * as root from "@devslab/dds-react";
for (const [path,names] of Object.entries({input:["Input","InputGroup"],combobox:["Combobox"],"select-picker":["SelectPicker"],"dropdown-menu":["DropdownMenu"],popover:["Popover"],calendar:["Calendar"],"date-picker":["DatePicker"],"date-range-picker":["DateRangePicker"],"month-picker":["MonthPicker"]})) {const part=await import("@devslab/dds-react/"+path);for(const name of names)assert.equal(root[name],part[name],name+" root/subpath identity");}
`);
    node([join(temp,"component-subpaths.mjs")]);
  }
  console.log(`${target} React ${reactVersion} pack, installed files/types, browser-free Node/worker SSR, real hydration and disposal passed`);
} finally {
  // mkdtemp gives this process an owned, absolute child of the OS temp path.
  assert.equal(dirname(resolve(temp)), resolve(tmpdir()));
  assert.ok(basename(temp).startsWith(`dds-${mode}-release-`));
  await rm(temp, { recursive: true, force: true });
}
