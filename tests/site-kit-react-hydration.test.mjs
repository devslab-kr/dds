import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * `@devslab/site-kit/react`, built, the way a Next.js app meets it (D-045).
 *
 * The React entry imports its flag bodies by package name,
 * `@devslab/site-kit/react/flag-bodies`, and package.json answers that name
 * per export condition. Each scenario here runs real Node processes against
 * dist/, so the conditions are the real ones:
 *
 *   - SSR in a child with Node's default conditions → the server file, which
 *     carries the bodies and writes the sprite.
 *   - Hydration in a child with --conditions=browser → the stub, which has no
 *     bodies and must adopt the sprite the server wrote, untouched, with
 *     React's development build reporting nothing.
 *
 * Plus the one claim the two framework builds share: for the same props,
 * Solid and React write the same markup, so styles.css cannot tell them
 * apart. Needs the installed workspace and a built site-kit — it runs from
 * verify:site-kit:ui after the build.
 */

const root = fileURLToPath(new URL("..", import.meta.url));
const kit = join(root, "packages", "site-kit"); // temp scripts live under the package so bare imports (react, jsdom) resolve
const href = (...parts) => JSON.stringify(pathToFileURL(join(kit, ...parts)).href);

const MESSAGES = {
  navigationLabel: "Site", localeLabel: "Language", themeLabel: "Theme", themeSystem: "System", themeLight: "Light",
  themeDark: "Dark", menuOpen: "Menu", menuClose: "Close", footerLabel: "Footer", skipToContent: "Skip to content",
  updatedLabel: "Updated", notFoundTitle: "Not found", notFoundDescription: "Nothing here", backHome: "Home",
  errorTitle: "Error", errorDescription: "Something broke", retry: "Retry",
};

// The Qooroo landing's shape: four languages, the flag menu, a theme toggle,
// a mark beside a localized wordmark, section primitives under the shell.
const FIXTURE = `
export function shellProps({ h, FAMILY_LOCALES, defineLocaleRegistry, MESSAGES, sections }) {
  const registry = defineLocaleRegistry({ only: ["ko", "en", "ja", "zh-TW"] });
  const state = { locale: "ko", hrefs: { ko: "/ko", en: "/en", ja: "/ja", "zh-TW": "/zh-TW" } };
  return {
    messages: MESSAGES,
    mainWidth: "bleed",
    header: {
      brand: { name: "", href: "/ko", label: "쿠루 홈", logo: h("span", { className: "wordmark" }, "쿠루") },
      navigation: [{ href: "#how", label: "How" }, { href: "#who", label: "Who" }],
      locale: state, localeVariant: "flag", localeRegistry: registry, theme: { storageKey: "hydration-theme" },
      messages: MESSAGES,
    },
    footer: {
      brand: { name: "Qooroo", href: "/" }, links: [{ href: "/privacy", label: "Privacy", emphasis: true }],
      linksLabel: "Legal", locale: state, localeRegistry: registry, copyright: "© 2026 DevsLab", messages: MESSAGES,
    },
    children: h(sections.SectionBlock, { id: "how", labelledBy: "how-title" },
      h(sections.SectionHead, { index: "01", title: "How it works", titleId: "how-title" }),
      h(sections.StepFlow, { label: "How it works", steps: [{ title: "Make", body: "Make a card." }, { title: "Share", body: "Share the QR." }] }),
    ),
  };
}
`;

const SSR = `
import { createElement as h } from "react";
import { renderToString } from "react-dom/server";
import * as kit from ${href("dist", "react", "index.js")};
import { FAMILY_LOCALES, defineLocaleRegistry } from ${href("src", "core", "locales.mjs")};
import { shellProps } from "./fixture.mjs";
const props = shellProps({ h, FAMILY_LOCALES, defineLocaleRegistry, MESSAGES: ${JSON.stringify(MESSAGES)}, sections: kit });
const html = renderToString(h(kit.MarketingShell, props));
process.stdout.write(JSON.stringify({ html, bodies: import.meta.resolve("@devslab/site-kit/react/flag-bodies") }));
`;

const DOM_SETUP = `
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(${href("package.json")});
const { JSDOM } = require("jsdom");
const ssr = process.env.SSR_JSON ? JSON.parse(readFileSync(process.env.SSR_JSON, "utf8")) : { html: "" };
const dom = new JSDOM("<!doctype html><html><body><div id=\\"root\\">" + ssr.html + "</div></body></html>", { pretendToBeVisual: true, url: "https://example.test/" });
dom.window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
for (const key of ["window", "document", "Node", "Element", "HTMLElement", "SVGElement", "MutationObserver", "navigator", "requestAnimationFrame", "localStorage", "matchMedia", "MouseEvent", "KeyboardEvent", "Event"]) {
  Object.defineProperty(globalThis, key, { value: dom.window[key], configurable: true, writable: true });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = false;
const host = document.querySelector("#root");
const diagnostics = [];
const warn = console.warn, error = console.error;
console.warn = (...v) => diagnostics.push(v.map(String).join(" "));
console.error = (...v) => diagnostics.push(v.map(String).join(" "));
const settle = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
`;

const HYDRATE = `${DOM_SETUP}
if (process.env.STRIP_SPRITE === "1") host.querySelector(".site-flag-sprite").innerHTML = "";
// A mark on the server's nodes: if the client rewrites the sprite or rebuilds
// the header, the mark is gone. An expando, not an attribute — React's dev
// build reports an attribute it did not render, which is the point of it.
const serverSymbol = host.querySelector(".site-flag-sprite symbol");
const serverHeader = host.querySelector(".site-header");
const { createElement: h } = await import("react");
const { hydrateRoot } = await import("react-dom/client");
const kit = await import(${href("dist", "react", "index.js")});
const { FAMILY_LOCALES, defineLocaleRegistry } = await import(${href("src", "core", "locales.mjs")});
const { shellProps } = await import("./fixture.mjs");
const props = shellProps({ h, FAMILY_LOCALES, defineLocaleRegistry, MESSAGES: ${JSON.stringify(MESSAGES)}, sections: kit });
const recoverable = [];
hydrateRoot(host, h(kit.MarketingShell, props), { onRecoverableError: (e) => recoverable.push(String(e && e.message)) });
await settle(300);
const button = host.querySelector(".site-menu-button");
button.click();
await settle(50);
console.warn = warn; console.error = error;
const sprite = host.querySelector(".site-flag-sprite");
const use = host.querySelector(".site-locale-flag__trigger > .site-locale-flag__svg > use");
const target = use && use.getAttribute("href");
process.stdout.write(JSON.stringify({
  diagnostics, recoverable,
  bodies: import.meta.resolve("@devslab/site-kit/react/flag-bodies"),
  symbols: sprite ? sprite.querySelectorAll("symbol").length : -1,
  spriteAdopted: Boolean(serverSymbol) && host.querySelector(".site-flag-sprite symbol") === serverSymbol,
  headerAdopted: host.querySelector(".site-header") === serverHeader,
  useResolves: Boolean(target && document.getElementById(target.slice(1))),
  menuOpens: button.getAttribute("aria-expanded") === "true",
  theme: document.documentElement.dataset.theme ?? null,
}));
`;

const CLIENT_ONLY = `${DOM_SETUP}
const { createElement: h } = await import("react");
const { createRoot } = await import("react-dom/client");
const { LocaleMenu } = await import(${href("dist", "react", "index.js")});
createRoot(host).render(h(LocaleMenu, { variant: "flag", state: { locale: "ko", hrefForLocale: (code) => "/" + code }, messages: ${JSON.stringify(MESSAGES)} }));
await settle(500);
console.warn = warn; console.error = error;
process.stdout.write(JSON.stringify({ diagnostics, symbols: host.querySelectorAll(".site-flag-sprite symbol").length }));
`;

function run(scripts, steps) {
  const dir = mkdtempSync(join(kit, ".react-hydration-test-"));
  try {
    // No package.json of its own: the scripts sit in site-kit's package scope
    // (type: module), so a bare "@devslab/site-kit/…" resolves through its exports.
    writeFileSync(join(dir, "fixture.mjs"), FIXTURE);
    for (const [name, source] of Object.entries(scripts)) writeFileSync(join(dir, name), source);
    return steps(dir, (args, env = {}) => {
      const result = spawnSync(process.execPath, args, { cwd: kit, encoding: "utf8", env: { ...process.env, ...env } });
      assert.equal(result.status, 0, result.stderr);
      return JSON.parse(result.stdout);
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function serverThenClient(extraEnv = {}) {
  return run({ "ssr.mjs": SSR, "hydrate.mjs": HYDRATE }, (dir, node) => {
    const server = node([join(dir, "ssr.mjs")]);
    writeFileSync(join(dir, "ssr.json"), JSON.stringify(server));
    const client = node(["--conditions=browser", join(dir, "hydrate.mjs")], { SSR_JSON: join(dir, "ssr.json"), ...extraEnv });
    return { server, client };
  });
}

test("the server layer resolves the bodies and writes the sprite; the browser layer resolves the stub", () => {
  const { server, client } = serverThenClient();
  assert.match(server.bodies, /\/dist\/react\/flag-bodies\.server\.js$/);
  assert.match(client.bodies, /\/dist\/react\/flag-bodies\.js$/);
  assert.equal((server.html.match(/<symbol /g) ?? []).length, 4, "one symbol per country the four languages use");
  assert.match(server.html, /^<div class="site-shell"><header class="site-header">/);
});

test("hydration adopts the server's sprite and header in place, with React's dev build reporting nothing", () => {
  const { client } = serverThenClient();
  assert.deepEqual(client.recoverable, []);
  assert.deepEqual(client.diagnostics, []);
  assert.equal(client.symbols, 4);
  assert.ok(client.spriteAdopted, "the sprite's server nodes are still the ones in the document");
  assert.ok(client.headerAdopted, "the header was hydrated, not rebuilt");
  assert.ok(client.useResolves, "the trigger's <use> points at a symbol that exists");
  assert.ok(client.menuOpens, "event handlers are attached after hydration");
  assert.equal(client.theme, "light", "the theme toggle applied the preference after mount");
});

test("a sprite that reaches the client empty loads the bodies instead of staying blank", () => {
  const { client } = serverThenClient({ STRIP_SPRITE: "1" });
  assert.equal(client.symbols, 4);
  assert.ok(client.useResolves);
});

test("a client-only render fetches the bodies from their own chunk", () => {
  const result = run({ "client.mjs": CLIENT_ONLY }, (dir, node) => node(["--conditions=browser", join(dir, "client.mjs")]));
  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.symbols, 14);
});

// ── Solid ↔ React parity ─────────────────────────────────────────────────
//
// The rule (D-045): both builds take their look from styles.css and
// site-sections.css alone, so for the same props they must write the same
// element tree, classes, ARIA and data attributes. A change to one side only —
// a class renamed in React, an attribute added in Solid — fails here in CI.
// Ignored: hydration bookkeeping (data-hk, marker comments), the per-render
// menu uid, and the sprite's React-only lookup attribute.

const PARITY_FIXTURE = (framework) => `
export function render() {
  const messages = ${JSON.stringify(MESSAGES)};
  const registry = defineLocaleRegistry({ only: ["ko", "en", "ja", "zh-TW"] });
  const state = { locale: "ja", hrefForLocale: (code) => "/" + code };
  const shell = {
    messages, mainWidth: "bleed",
    header: {
      brand: { name: "Qooroo", href: "/", label: "Qooroo home" },
      navigation: [{ href: "#how", label: "How" }, { href: "https://example.com", label: "Docs", external: true }, { href: "/pricing", label: "Pricing", emphasis: true }],
      locale: state, localeVariant: "flag", localeRegistry: registry, theme: {}, messages,
    },
    footer: {
      brand: { name: "Qooroo", href: "/" }, links: [{ href: "/terms", label: "Terms" }, { href: "/privacy", label: "Privacy", emphasis: true }],
      family: [{ href: "https://devslab.kr/", label: "DevsLab" }], linksLabel: "Legal", locale: state, localeRegistry: registry,
      copyright: "© 2026 DevsLab", copyrightHref: "https://devslab.kr/", messages,
    },
  };
  const pages = {
    shell: [kit.MarketingShell, shell],
    select: [kit.LocaleMenu, { state, messages, registry }],
    flagMenu: [kit.LocaleMenu, { variant: "flag", state, messages, registry }],
    header: [kit.SiteHeader, { ...shell.header, actions: null }],
    footer: [kit.SiteFooter, { ...shell.footer, details: null }],
    hero: [kit.HeroSplit, { eyebrow: "QR", title: "Cards", titleId: "t", lede: "Scan.", actions: null, aside: null, asideLabel: "Scene" }],
    steps: [kit.StepFlow, { label: "Steps", steps: [{ title: "A", body: "a" }, { title: "B", body: "b" }] }],
    rows: [kit.FeatureRows, { label: "Who", rows: [{ title: "Shops", body: "x" }, { title: "Sales", body: "y", badge: "New" }] }],
    head: [kit.SectionHead, { index: "01", title: "How", titleId: "how", lede: "Three." }],
    status: [kit.StatusBanner, { tone: "warning", title: "Heads up" }],
    legal: [kit.NotFoundLayout, { messages, homeHref: "/" }],
    mark: [kit.OssProductMark, { name: "numkey", src: "/n.svg", size: "sm" }],
  };
  const out = {};
  for (const [name, [Component, props]] of Object.entries(pages)) out[name] = ${framework === "solid"
    ? "renderToString(() => createComponent(Component, props))"
    : "renderToString(createElement(Component, props))"};
  return out;
}
`;

const PARITY = {
  "solid.mjs": `
import { renderToString } from "solid-js/web";
import { createComponent } from "solid-js";
import * as kit from ${href("dist", "solid.server.js")};
import { defineLocaleRegistry } from ${href("src", "core", "locales.mjs")};
${PARITY_FIXTURE("solid")}
process.stdout.write(JSON.stringify(render()));
`,
  "react.mjs": `
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import * as kit from ${href("dist", "react", "index.js")};
import { defineLocaleRegistry } from ${href("src", "core", "locales.mjs")};
${PARITY_FIXTURE("react")}
process.stdout.write(JSON.stringify(render()));
`,
  "normalize.mjs": `
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(${href("package.json")});
const { JSDOM } = require("jsdom");
const pages = JSON.parse(readFileSync(process.env.PAGES, "utf8"));
// Hydration bookkeeping and per-render ids are framework business, not design:
// Solid's data-hk and marker comments, React's text separators, the sprite's
// lookup attribute, the menu uid suffixed onto every flag id (Solid's server
// writes "-013000", its client "-cl-1", React "-rx…"), and the trailing space
// dds-solid leaves in a class list. The uid only ever ends an id, a fragment
// or a url(#…) target, so nothing else (path data) is touched.
const UID = /-(?:cl-\\d+|\\d+|rx[A-Za-z0-9_-]+)$/;
const ID_ATTRIBUTES = new Set(["id", "href", "xlink:href"]);
const normalize = (name, value) => {
  if (name === "class") return value.trim().split(/\\s+/).join(" ");
  if (ID_ATTRIBUTES.has(name)) return value.replace(UID, "-UID");
  return value.replace(/url\\(#([^)]+)\\)/g, (_, id) => "url(#" + id.replace(UID, "-UID") + ")");
};
const outline = (node) => {
  if (node.nodeType === 3) return node.textContent;
  if (node.nodeType !== 1) return null;
  // React 19 writes a preload hint for every <img> it renders; that is React's
  // resource scheduling, not markup a component asked for.
  if (node.tagName === "LINK" && node.getAttribute("rel") === "preload") return null;
  const attributes = [...node.attributes]
    .filter((a) => a.name !== "data-hk" && a.name !== "data-flag-sprite")
    .map((a) => a.name + "=" + normalize(a.name, a.value))
    .sort();
  const children = [];
  for (const child of node.childNodes) {
    const value = outline(child);
    if (value === null) continue;
    if (typeof value === "string" && typeof children.at(-1) === "string") children[children.length - 1] += value;
    else children.push(value);
  }
  return [node.tagName.toLowerCase(), attributes, children.filter((c) => c !== "")];
};
const out = {};
for (const [name, html] of Object.entries(pages)) {
  const body = new JSDOM("<!doctype html><body>" + html + "</body>").window.document.body;
  out[name] = [...body.childNodes].map(outline).filter((v) => v !== null);
}
process.stdout.write(JSON.stringify(out));
`,
};

test("Solid and React write the same markup for the same props", () => {
  const { solid, react } = run(PARITY, (dir, node) => {
    const outlines = {};
    for (const framework of ["solid", "react"]) {
      const pages = node([join(dir, `${framework}.mjs`)]);
      writeFileSync(join(dir, `${framework}.json`), JSON.stringify(pages));
      outlines[framework] = node([join(dir, "normalize.mjs")], { PAGES: join(dir, `${framework}.json`) });
    }
    return outlines;
  });
  assert.deepEqual(Object.keys(react), Object.keys(solid));
  for (const name of Object.keys(solid)) {
    assert.deepEqual(react[name], solid[name], `${name}: React and Solid markup differ`);
  }
});
