import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * Server-render the marketing shell with the flag menu, then hydrate that
 * HTML with the browser build in jsdom and check what survived.
 *
 * The first consumer of the flag sprite (AskLinq, site-kit 0.12.0) shipped
 * a header whose flag box was empty in every browser while the server HTML
 * carried all the symbols. The shell spread `{...props.header}` straight
 * into SiteHeader; `header={{ …, actions: <a/> }}` compiles to a getter, so
 * every prop read rebuilt the literal and its eager JSX, and each rebuild
 * consumed hydration keys — a different number of times on the server than
 * on the client. From the first drift, the client recreated the header from
 * templates: a fresh, empty sprite, and a <use> pointing at a new uid.
 *
 * Two guards, both exercised here. The shell reads its header and footer
 * once (createMemo), so an eagerly built prop costs the same keys on both
 * sides. And a sprite that ends up empty on the client — whatever the
 * reason — loads the bodies instead of trusting that hydration adopted it.
 *
 * SSR runs in this process (Node's default conditions pick solid-js's server
 * build); hydration runs in a child with --conditions=browser, as
 * scripts/verify-solid-release.mjs does. It needs the installed workspace
 * and a built site-kit, so it runs from verify:site-kit:ui after the build —
 * not from the source-only stage3-4 gate.
 */

const root = fileURLToPath(new URL("..", import.meta.url));
const kit = join(root, "packages", "site-kit"); // temp scripts live under the package so bare imports (solid-js, jsdom) resolve

const MESSAGES = {
  localeLabel: "Language", skipToContent: "Skip to content", themeLabel: "Theme", themeLight: "Light",
  themeDark: "Dark", themeSystem: "System", menuOpen: "Menu", menuClose: "Close", navigationLabel: "Site",
  localeSuggestionAccept: "Yes", localeSuggestionDismiss: "No", notFoundTitle: "Not found",
  notFoundBody: "Nothing here", errorTitle: "Error", errorBody: "Something broke", retry: "Retry", home: "Home",
};

// The shell props the way a compiled `header={{ … }}` reaches the kit: a
// getter that rebuilds the literal — and its eager JSX — on every read.
const SHELL_SOURCE = (mode) => `
export function shellProps({ createElement, eagerAnchor, FAMILY_LOCALES, MESSAGES }) {
  const state = { locale: "ko", hrefForLocale: (code) => "/?lang=" + code };
  const props = {
    messages: MESSAGES,
    get children() { return createElement("p", "main-copy", "Body"); },
    get header() {
      return {
        brand: { name: "Product", href: "/" },
        navigation: [{ href: "#how", label: "How" }, { href: "#who", label: "Who" }],
        locale: state,
        localeVariant: "flag",
        localeRegistry: FAMILY_LOCALES,
        messages: MESSAGES,
        actions: ${mode === "plain" ? "undefined" : "eagerAnchor()"},
      };
    },
    get footer() {
      return {
        brand: { name: "Product", href: "/" },
        locale: state,
        localeRegistry: FAMILY_LOCALES,
        links: [{ href: "/privacy", label: "Privacy" }],
        copyright: "© Product",
        messages: MESSAGES,
      };
    },
  };
  return props;
}
`;

function ssr() {
  const script = `
import { renderToString, generateHydrationScript, ssr, ssrHydrationKey, escape } from "solid-js/web";
import { createComponent } from "solid-js";
import { MarketingShell } from ${JSON.stringify(pathToFileURL(join(kit, "dist", "solid.server.js")).href)};
import { FAMILY_LOCALES } from ${JSON.stringify(pathToFileURL(join(kit, "src", "core", "locales.mjs")).href)};
import { shellProps } from "./shell.mjs";
const MESSAGES = ${JSON.stringify(MESSAGES)};
const createElement = (tag, cls, text) => ssr(["<" + tag, " class=\\"" + cls + "\\">" + escape(text) + "</" + tag + ">"], ssrHydrationKey());
const eagerAnchor = () => ssr(["<a", " class=\\"site-header__login\\" href=\\"/admin\\">Login</a>"], ssrHydrationKey());
const html = renderToString(() => createComponent(MarketingShell, shellProps({ createElement, eagerAnchor, FAMILY_LOCALES, MESSAGES })));
process.stdout.write(JSON.stringify({ bootstrap: generateHydrationScript(), html }));
`;
  return script;
}

function hydrateScript() {
  return `
process.on("uncaughtException", (e) => { console.error("UNCAUGHT", e && e.name, e && e.message, e && e.stack); process.exit(1); });
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
if (process.env.STRIP_SPRITE === "1") host.querySelector(".site-flag-sprite").innerHTML = "";
const serverKeys = [...host.querySelectorAll("header [data-hk]")].map((element) => element.getAttribute("data-hk"));
const { hydrate, template, getNextElement } = await import("solid-js/web");
const { createComponent } = await import("solid-js");
const { MarketingShell } = await import(${JSON.stringify(pathToFileURL(join(kit, "dist", "solid.js")).href)});
const { FAMILY_LOCALES } = await import(${JSON.stringify(pathToFileURL(join(kit, "src", "core", "locales.mjs")).href)});
const { shellProps } = await import("./shell.mjs");
const MESSAGES = ${JSON.stringify(MESSAGES)};
const tmpl = (markup) => { const t = template(markup); return () => getNextElement(t); };
const createElement = (tag, cls, text) => tmpl("<" + tag + " class=\\"" + cls + "\\">" + text + "</" + tag + ">")();
const eagerAnchor = tmpl('<a class="site-header__login" href="/admin">Login</a>');
const diagnostics = [];
const warn = console.warn, error = console.error;
console.warn = (...v) => diagnostics.push(v.join(" "));
console.error = (...v) => diagnostics.push(v.join(" "));
hydrate(() => createComponent(MarketingShell, shellProps({ createElement, eagerAnchor, FAMILY_LOCALES, MESSAGES })), host);
await new Promise((resolve) => setTimeout(resolve, 100));
console.warn = warn; console.error = error;
const sprite = host.querySelector(".site-flag-sprite");
const use = host.querySelector(".site-locale-flag__svg use");
const href = use && (use.getAttribute("href") || use.getAttribute("xlink:href"));
const headerElements = [...host.querySelectorAll("header *")];
process.stdout.write(JSON.stringify({
  diagnostics,
  serverKeyed: serverKeys.length,
  // Only template roots carry data-hk (nested static nodes never do), so the
  // question is whether every key the server wrote is still in the document:
  // a key that vanished means the client threw that subtree away and rebuilt it.
  lostKeys: serverKeys.filter((key) => !host.querySelector('[data-hk="' + key + '"]')).length,
  recreated: headerElements.filter((element) => !element.hasAttribute("data-hk") && element.getAttribute("class")).map((element) => element.tagName + "." + element.getAttribute("class")).slice(0, 8),
  symbols: sprite ? sprite.querySelectorAll("symbol").length : -1,
  useResolves: Boolean(href && document.getElementById(href.slice(1))),
  loginKeyed: host.querySelector(".site-header__login")?.hasAttribute("data-hk") ?? false,
}));
`;
}

function runShell(mode, extraEnv = {}) {
  const dir = mkdtempSync(join(kit, ".hydration-test-"));
  try {
    writeFileSync(join(dir, "package.json"), JSON.stringify({ type: "module" }));
    writeFileSync(join(dir, "shell.mjs"), SHELL_SOURCE(mode));
    writeFileSync(join(dir, "ssr.mjs"), ssr());
    writeFileSync(join(dir, "hydrate.mjs"), hydrateScript());
    const env = { ...process.env, NODE_PATH: join(kit, "node_modules"), ...extraEnv };
    const server = spawnSync(process.execPath, [join(dir, "ssr.mjs")], { cwd: kit, encoding: "utf8", env });
    assert.equal(server.status, 0, server.stderr);
    writeFileSync(join(dir, "ssr.json"), server.stdout);
    const client = spawnSync(process.execPath, ["--conditions=browser", join(dir, "hydrate.mjs")], { cwd: kit, encoding: "utf8", env });
    assert.equal(client.status, 0, client.stderr);
    return { html: JSON.parse(server.stdout).html, ...JSON.parse(client.stdout) };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("a shell whose header prop rebuilds eager JSX on every read still hydrates in place", () => {
  const result = runShell("eager");
  assert.deepEqual(result.diagnostics, []);
  // The server wrote the sprite; the client must adopt the header rather than rebuild it.
  assert.ok((result.html.match(/<symbol /g) ?? []).length >= 14, "server writes every flag symbol");
  assert.ok(result.serverKeyed >= 10, "the server keyed the header's template roots");
  assert.equal(result.lostKeys, 0, "every server hydration key in the header is still in the document");
  assert.ok(result.loginKeyed, "the eagerly built action kept its server key");
  assert.equal(result.symbols, 14);
  assert.ok(result.useResolves, "the trigger's <use> points at a symbol that exists");
});

test("a sprite that reaches the client empty loads the bodies instead of staying blank", () => {
  const dir = mkdtempSync(join(kit, ".sprite-test-"));
  try {
    writeFileSync(join(dir, "package.json"), JSON.stringify({ type: "module" }));
    writeFileSync(join(dir, "empty.mjs"), `
import { createRequire } from "node:module";
const require = createRequire(${JSON.stringify(pathToFileURL(join(kit, "package.json")).href)});
const { JSDOM } = require("jsdom");
const dom = new JSDOM("<!doctype html><html><body><div id=\\"root\\"></div></body></html>", { pretendToBeVisual: true });
for (const key of ["window", "document", "Node", "HTMLElement", "SVGElement", "MutationObserver", "navigator", "requestAnimationFrame"]) {
  Object.defineProperty(globalThis, key, { value: dom.window[key], configurable: true, writable: true });
}
const { render } = await import("solid-js/web");
const { createComponent } = await import("solid-js");
const { LocaleMenu } = await import(${JSON.stringify(pathToFileURL(join(kit, "dist", "solid.js")).href)});
const { FAMILY_LOCALES } = await import(${JSON.stringify(pathToFileURL(join(kit, "src", "core", "locales.mjs")).href)});
const state = { locale: "ko", hrefForLocale: (code) => "/?lang=" + code };
render(() => createComponent(LocaleMenu, { variant: "flag", state, messages: ${JSON.stringify(MESSAGES)}, registry: FAMILY_LOCALES }), document.querySelector("#root"));
await new Promise((resolve) => setTimeout(resolve, 300));
const sprite = document.querySelector(".site-flag-sprite");
process.stdout.write(JSON.stringify({ symbols: sprite ? sprite.querySelectorAll("symbol").length : -1 }));
`);
    const client = spawnSync(process.execPath, ["--conditions=browser", join(dir, "empty.mjs")], { cwd: kit, encoding: "utf8" });
    assert.equal(client.status, 0, client.stderr);
    assert.equal(JSON.parse(client.stdout).symbols, 14);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});


test("a sprite emptied before hydration is refilled from the bodies chunk, not left blank", () => {
  // Stands in for a hydration that drifted upstream and recreated the sprite
  // from its template: hydration is running, the element is empty.
  const result = runShell("eager", { STRIP_SPRITE: "1" });
  assert.equal(result.symbols, 14);
  assert.ok(result.useResolves);
});
