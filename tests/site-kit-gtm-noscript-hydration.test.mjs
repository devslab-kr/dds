import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * The body half of Tag Manager (D-031): the README tells a product to render
 * `<noscript innerHTML={gtmNoscriptIframe(id)} />` as the first thing in its
 * <body>, behind a per-route condition. site-kit ships no component for it —
 * the shells do not own <body> — so this checks the documented JSX itself.
 *
 * The page is compiled by Solid's real compiler (babel-preset-solid, the one
 * vite-plugin-solid runs) twice — `ssr` for the server, `dom` for the client,
 * both hydratable — server-rendered in this harness's child, then hydrated in
 * jsdom with scripts enabled (so, as in a browser, the <noscript> content is
 * text, not an iframe) under Solid's development build, the strict one that
 * throws `Hydration Mismatch` on a key the server never wrote (D-028). It
 * passes when nothing throws, every server key survives, the element after
 * the <noscript> is the server's, and no iframe exists in the live DOM.
 * Same harness shape as site-kit-status-banner-hydration.test.mjs.
 */

const root = fileURLToPath(new URL("..", import.meta.url));
const kit = join(root, "packages", "site-kit");
const kitRequire = createRequire(join(kit, "package.json"));
const solidPluginRequire = createRequire(kitRequire.resolve("vite-plugin-solid"));
const babel = solidPluginRequire("@babel/core");
const solidPreset = solidPluginRequire.resolve("babel-preset-solid");

// What a product's root document body looks like with the documented pattern:
// the noscript first, behind a route-level condition, then the app.
const PAGE_JSX = `
import { Show, createSignal } from "solid-js";
import { gtmNoscriptIframe } from ${JSON.stringify(pathToFileURL(join(kit, "src", "core", "gtm.mjs")).href)};
export function Body(props) {
  const [count, setCount] = createSignal(0);
  return <div id="app">
    <Show when={props.gtm}>{(id) => <noscript innerHTML={gtmNoscriptIframe(id())} />}</Show>
    <main><h1>Public page</h1><button type="button" onClick={() => setCount(count() + 1)}>clicked {count()}</button></main>
  </div>;
}
`;

const compile = (generate) => babel.transformSync(PAGE_JSX, {
  filename: `page.${generate}.jsx`,
  babelrc: false,
  configFile: false,
  presets: [[solidPreset, { generate, hydratable: true }]],
}).code;

const ssrScript = (gtm) => `
import { renderToString, generateHydrationScript } from "solid-js/web";
import { createComponent } from "solid-js";
import { Body } from "./page.ssr.mjs";
const html = renderToString(() => createComponent(Body, { gtm: ${JSON.stringify(gtm)} }));
process.stdout.write(JSON.stringify({ bootstrap: generateHydrationScript(), html }));
`;

const hydrateScript = (gtm) => `
process.on("uncaughtException", (e) => { process.stderr.write("UNCAUGHT " + (e && e.stack || e) + String.fromCharCode(10)); process.exit(1); });
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(${JSON.stringify(pathToFileURL(join(kit, "package.json")).href)});
const { JSDOM } = require("jsdom");
const { bootstrap, html } = JSON.parse(readFileSync(new URL("./ssr.json", import.meta.url), "utf8"));
const dom = new JSDOM("<!doctype html><html><head>" + bootstrap + "</head><body>" + html + "</body></html>", { runScripts: "dangerously", pretendToBeVisual: true, url: "https://example.test/" });
for (const key of ["window", "document", "Node", "HTMLElement", "SVGElement", "MutationObserver", "navigator", "requestAnimationFrame", "localStorage", "matchMedia"]) {
  Object.defineProperty(globalThis, key, { value: dom.window[key], configurable: true, writable: true });
}
Object.defineProperty(globalThis, "_$HY", { value: dom.window._$HY, configurable: true, writable: true });
const body = document.body;
const serverKeys = [...body.querySelectorAll("[data-hk]")].map((element) => element.getAttribute("data-hk"));
const serverButton = body.querySelector("button");
const { hydrate, createComponent } = await import("solid-js/web");
const { Body } = await import("./page.dom.mjs");
const diagnostics = [];
const warn = console.warn, error = console.error;
console.warn = (...v) => diagnostics.push(v.join(" "));
console.error = (...v) => diagnostics.push(v.join(" "));
hydrate(() => createComponent(Body, { gtm: ${JSON.stringify(gtm)} }), body);
await new Promise((resolve) => setTimeout(resolve, 50));
const button = body.querySelector("button");
button.click();
await new Promise((resolve) => setTimeout(resolve, 10));
console.warn = warn; console.error = error;
const noscript = body.querySelector("noscript");
process.stdout.write(JSON.stringify({
  diagnostics,
  serverKeyed: serverKeys.length,
  lostKeys: serverKeys.filter((key) => !body.querySelector('[data-hk="' + key + '"]')).length,
  sameButton: button === serverButton,
  buttonText: button.textContent,
  noscripts: body.querySelectorAll("noscript").length,
  noscriptText: noscript ? noscript.textContent : null,
  firstInApp: body.querySelector("#app").firstElementChild.tagName,
  liveIframes: body.querySelectorAll("iframe").length,
}));
`;

function run(gtm) {
  const dir = mkdtempSync(join(kit, ".gtm-noscript-test-"));
  try {
    writeFileSync(join(dir, "package.json"), JSON.stringify({ type: "module" }));
    writeFileSync(join(dir, "page.ssr.mjs"), compile("ssr"));
    writeFileSync(join(dir, "page.dom.mjs"), compile("dom"));
    writeFileSync(join(dir, "ssr.mjs"), ssrScript(gtm));
    writeFileSync(join(dir, "hydrate.mjs"), hydrateScript(gtm));
    const env = { ...process.env, NODE_PATH: join(kit, "node_modules") };
    const server = spawnSync(process.execPath, [join(dir, "ssr.mjs")], { cwd: kit, encoding: "utf8", env });
    assert.equal(server.status, 0, server.stderr);
    writeFileSync(join(dir, "ssr.json"), server.stdout);
    const client = spawnSync(process.execPath, ["--conditions=browser", "--conditions=development", join(dir, "hydrate.mjs")], { cwd: kit, encoding: "utf8", env });
    assert.equal(client.status, 0, `the development build must hydrate without throwing:\n${client.stderr}`);
    return { html: JSON.parse(server.stdout).html, ...JSON.parse(client.stdout) };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("the documented <noscript innerHTML={gtmNoscriptIframe(id)} /> hydrates in place under the development build", () => {
  const result = run("GTM-AB12CD3");
  assert.match(result.html, /<noscript[^>]*><iframe src="https:\/\/www\.googletagmanager\.com\/ns\.html\?id=GTM-AB12CD3" height="0" width="0" style="display:none;visibility:hidden"><\/iframe><\/noscript>/, "the server writes Google's iframe inside the noscript");
  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.serverKeyed, 2, "the server keyed the app root and the noscript");
  assert.equal(result.lostKeys, 0, "every server hydration key is still in the document");
  assert.equal(result.sameButton, true, "the element after the noscript is the server's, adopted, not rebuilt");
  assert.equal(result.buttonText, "clicked 1", "and it is live");
  assert.equal(result.noscripts, 1);
  assert.equal(result.firstInApp, "NOSCRIPT");
  assert.match(result.noscriptText, /ns\.html\?id=GTM-AB12CD3/, "with scripting on, the noscript keeps its markup as text");
  assert.equal(result.liveIframes, 0, "no iframe is loaded when JavaScript runs");
});

test("a route without Tag Manager renders and hydrates with no noscript at all", () => {
  const result = run(undefined);
  assert.doesNotMatch(result.html, /noscript|googletagmanager/);
  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.lostKeys, 0);
  assert.equal(result.buttonText, "clicked 1");
  assert.equal(result.firstInApp, "MAIN");
});
