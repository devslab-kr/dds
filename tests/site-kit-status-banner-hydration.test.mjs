import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * Server-render two StatusBanners whose children are inline JSX, then hydrate
 * that HTML with the browser build in jsdom and count the server keys that
 * survived.
 *
 * BookLinq's status page (jlc488/booklinq#51) rendered site-kit's error
 * layout in `vite dev`. The banner read `props.children` twice — once for
 * the truthiness check, once to insert — and a compiled
 * `<StatusBanner><ul>…</ul></StatusBanner>` child is a getter, so the first
 * read minted a list (and every <li> under it) that was thrown away, each
 * with a hydration key the server never wrote into the HTML. On the client
 * the same discarded read asks the registry for those keys. Solid's
 * production build quietly clones a template when a key is missing, so the
 * counters stay aligned and nothing visible breaks; the development build —
 * what every consumer's dev server runs — throws `Hydration Mismatch` and
 * the error boundary swallows the page. BookLinq worked around it by
 * building the list into a const; the kit is where it belongs (D-027: the
 * kit reads what it is handed once).
 *
 * So this hydrates with `--conditions=browser --conditions=development`:
 * the strict build is the one that tells the truth about a wasted key.
 * Otherwise the harness is site-kit-hydration.test.mjs: SSR in this process
 * (server build), hydration in a child, temp scripts under the package so
 * bare imports resolve. Runs from verify:site-kit:ui after the build.
 */

const root = fileURLToPath(new URL("..", import.meta.url));
const kit = join(root, "packages", "site-kit");

// The page the way BookLinq's /status reaches the kit: sections in a <For>,
// each banner's children an inline `<ul><For>…</For></ul>` — a compiled getter
// that builds the list, and every <li> under it, on each read.
const SECTIONS = [
  { tone: "success", title: "API", items: ["Responding", "Booking flow"] },
  { tone: "warning", title: "Queue", items: ["Delayed", "Retrying"] },
];
const PAGE_SOURCE = `
export function page({ createComponent, For, ul, li, insert, StatusBanner, sections }) {
  return createComponent(For, { each: sections, children: (section) =>
    createComponent(StatusBanner, {
      get tone() { return section.tone; },
      get title() { return section.title; },
      get children() { return ul(createComponent(For, { each: section.items, children: (item) => li(item) })); },
    }),
  });
}
`;

const ssrScript = () => `
import { renderToString, generateHydrationScript, ssr, ssrHydrationKey, escape } from "solid-js/web";
import { createComponent, For } from "solid-js";
import { StatusBanner } from ${JSON.stringify(pathToFileURL(join(kit, "dist", "solid.server.js")).href)};
import { page } from "./page.mjs";
const ul = (body) => ssr(["<ul", " class=\\"detail\\">", "</ul>"], ssrHydrationKey(), escape(body));
const li = (text) => ssr(["<li", ">", "</li>"], ssrHydrationKey(), escape(text));
const html = renderToString(() => page({ createComponent, For, ul, li, StatusBanner, sections: ${JSON.stringify(SECTIONS)} }));
process.stdout.write(JSON.stringify({ bootstrap: generateHydrationScript(), html }));
`;

const hydrateScript = () => `
process.on("uncaughtException", (e) => { process.stderr.write("UNCAUGHT " + (e && e.stack || e) + String.fromCharCode(10)); process.exit(1); });
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(${JSON.stringify(pathToFileURL(join(kit, "package.json")).href)});
const { JSDOM } = require("jsdom");
const { bootstrap, html } = JSON.parse(readFileSync(new URL("./ssr.json", import.meta.url), "utf8"));
const dom = new JSDOM("<!doctype html><html><head>" + bootstrap + "</head><body><div id=\\"root\\">" + html + "</div></body></html>", { runScripts: "dangerously", pretendToBeVisual: true, url: "https://example.test/" });
for (const key of ["window", "document", "Node", "HTMLElement", "SVGElement", "MutationObserver", "navigator", "requestAnimationFrame", "localStorage", "matchMedia"]) {
  Object.defineProperty(globalThis, key, { value: dom.window[key], configurable: true, writable: true });
}
Object.defineProperty(globalThis, "_$HY", { value: dom.window._$HY, configurable: true, writable: true });
const host = document.querySelector("#root");
const serverKeys = [...host.querySelectorAll("[data-hk]")].map((element) => element.getAttribute("data-hk"));
const { hydrate, template, getNextElement, insert } = await import("solid-js/web");
const { createComponent, For } = await import("solid-js");
const { StatusBanner } = await import(${JSON.stringify(pathToFileURL(join(kit, "dist", "solid.js")).href)});
const { page } = await import("./page.mjs");
const ulTemplate = template('<ul class="detail">'), liTemplate = template("<li>");
const ul = (body) => { const element = getNextElement(ulTemplate); insert(element, body); return element; };
const li = (text) => { const element = getNextElement(liTemplate); insert(element, text); return element; };
const diagnostics = [];
const warn = console.warn, error = console.error;
console.warn = (...v) => diagnostics.push(v.join(" "));
console.error = (...v) => diagnostics.push(v.join(" "));
hydrate(() => page({ createComponent, For, ul, li, insert, StatusBanner, sections: ${JSON.stringify(SECTIONS)} }), host);
await new Promise((resolve) => setTimeout(resolve, 100));
console.warn = warn; console.error = error;
process.stdout.write(JSON.stringify({
  diagnostics,
  serverKeyed: serverKeys.length,
  lostKeys: serverKeys.filter((key) => !host.querySelector('[data-hk="' + key + '"]')).length,
  banners: host.querySelectorAll(".site-status").length,
  details: [...host.querySelectorAll(".site-status .detail")].map((element) => [...element.querySelectorAll("li")].map((item) => item.textContent)),
  detailsKeyed: [...host.querySelectorAll(".site-status .detail, .site-status li")].every((element) => element.hasAttribute("data-hk")),
}));
`;

function runBanners() {
  const dir = mkdtempSync(join(kit, ".status-banner-test-"));
  try {
    writeFileSync(join(dir, "package.json"), JSON.stringify({ type: "module" }));
    writeFileSync(join(dir, "page.mjs"), PAGE_SOURCE);
    writeFileSync(join(dir, "ssr.mjs"), ssrScript());
    writeFileSync(join(dir, "hydrate.mjs"), hydrateScript());
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

test("two status banners with inline JSX children hydrate in place under the development build — no mismatch, no server key lost", () => {
  const result = runBanners();
  assert.deepEqual(result.diagnostics, []);
  assert.equal((result.html.match(/class="detail"/g) ?? []).length, 2, "the server wrote each list exactly once");
  assert.ok(result.serverKeyed >= 8, "the server keyed both banners, both lists and every item");
  assert.equal(result.banners, 2);
  assert.deepEqual(result.details, [["Responding", "Booking flow"], ["Delayed", "Retrying"]]);
  assert.equal(result.lostKeys, 0, "every server hydration key is still in the document");
  assert.ok(result.detailsKeyed, "both lists and every item kept their server keys");
});
