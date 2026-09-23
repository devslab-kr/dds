import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * Server-render a single-language SiteHeader and a SiteFooter with a details
 * block — mounted directly, outside MarketingShell — then hydrate that HTML
 * with the development browser build in jsdom and count the server keys that
 * survived (D-029).
 *
 * The props arrive the way a compiled `brand={{ logo: <Wordmark /> }}` /
 * `details={<address>…</address>}` reaches a component: getters that build
 * their JSX again on every read. The shell's own memo (D-027) does not help a
 * product that mounts the chrome itself, so the header and footer read
 * `brand` and `details` once too. Were either read twice, the discarded build
 * would ask for hydration keys the server never wrote, and the development
 * build — the one every consumer's dev server runs — throws `Hydration
 * Mismatch` (D-028). Same harness as site-kit-status-banner-hydration.test.mjs.
 */

const root = fileURLToPath(new URL("..", import.meta.url));
const kit = join(root, "packages", "site-kit");

const MESSAGES = {
  navigationLabel: "사이트 메뉴", localeLabel: "언어", themeLabel: "테마", themeSystem: "시스템", themeLight: "라이트",
  themeDark: "다크", menuOpen: "메뉴", menuClose: "닫기", footerLabel: "바닥글", skipToContent: "본문 바로가기",
  updatedLabel: "수정", notFoundTitle: "없음", notFoundDescription: "없는 페이지", backHome: "첫 화면",
  errorTitle: "오류", errorDescription: "다시 시도", retry: "다시 시도",
};

const PAGE_SOURCE = `
export function page({ createComponent, SiteHeader, SiteFooter, wordmark, action, details, MESSAGES }) {
  const header = {
    get brand() { return { name: "", label: "FM덴탈서비스 첫 화면", href: "/", logo: wordmark() }; },
    navigation: [{ href: "#how", label: "이용 방법" }, { href: "#contact", label: "문의" }],
    messages: MESSAGES,
    get actions() { return action(); },
  };
  const footer = {
    get brand() { return { name: "", href: "/", logo: wordmark() }; },
    get details() { return details(); },
    linksLabel: "바닥 메뉴",
    links: [{ href: "/terms", label: "이용약관" }, { href: "/privacy", label: "개인정보처리방침", emphasis: true }],
    copyright: "© FM덴탈서비스",
    messages: MESSAGES,
  };
  return [createComponent(SiteHeader, header), createComponent(SiteFooter, footer)];
}
`;

const ssrScript = () => `
import { renderToString, generateHydrationScript, ssr, ssrHydrationKey } from "solid-js/web";
import { createComponent } from "solid-js";
import { SiteHeader, SiteFooter } from ${JSON.stringify(pathToFileURL(join(kit, "dist", "solid.server.js")).href)};
import { page } from "./page.mjs";
const MESSAGES = ${JSON.stringify(MESSAGES)};
const wordmark = () => ssr(["<span", " class=\\"wordmark\\"><b>FM</b>덴탈서비스</span>"], ssrHydrationKey());
const action = () => ssr(["<a", " class=\\"cta\\" href=\\"#contact\\">이용 문의</a>"], ssrHydrationKey());
const details = () => ssr(["<address", " class=\\"biz\\">부산광역시 연제구</address>"], ssrHydrationKey());
const html = renderToString(() => page({ createComponent, SiteHeader, SiteFooter, wordmark, action, details, MESSAGES }));
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
const { hydrate, template, getNextElement } = await import("solid-js/web");
const { createComponent } = await import("solid-js");
const { SiteHeader, SiteFooter } = await import(${JSON.stringify(pathToFileURL(join(kit, "dist", "solid.js")).href)});
const { page } = await import("./page.mjs");
const MESSAGES = ${JSON.stringify(MESSAGES)};
const tmpl = (markup) => { const t = template(markup); return () => getNextElement(t); };
const wordmark = tmpl('<span class="wordmark"><b>FM</b>덴탈서비스</span>');
const action = tmpl('<a class="cta" href="#contact">이용 문의</a>');
const details = tmpl('<address class="biz">부산광역시 연제구</address>');
const diagnostics = [];
const warn = console.warn, error = console.error;
console.warn = (...v) => diagnostics.push(v.join(" "));
console.error = (...v) => diagnostics.push(v.join(" "));
hydrate(() => page({ createComponent, SiteHeader, SiteFooter, wordmark, action, details, MESSAGES }), host);
await new Promise((resolve) => setTimeout(resolve, 100));
console.warn = warn; console.error = error;
const brand = host.querySelector(".site-brand");
process.stdout.write(JSON.stringify({
  diagnostics,
  serverKeyed: serverKeys.length,
  lostKeys: serverKeys.filter((key) => !host.querySelector('[data-hk="' + key + '"]')).length,
  wordmarks: host.querySelectorAll(".wordmark").length,
  wordmarksKeyed: [...host.querySelectorAll(".wordmark")].every((element) => element.hasAttribute("data-hk")),
  brandLabel: brand && brand.getAttribute("aria-label"),
  brandText: brand && brand.textContent,
  pickers: host.querySelectorAll(".site-locale, .site-locale-flag, select").length,
  details: host.querySelectorAll(".site-footer__details .biz").length,
  detailsKeyed: host.querySelector(".site-footer__details .biz")?.hasAttribute("data-hk") ?? false,
  footerNav: host.querySelector("footer nav.site-footer__nav")?.getAttribute("aria-label") ?? null,
  emptyStrong: host.querySelectorAll(".site-footer__brand strong").length,
  emphasis: [...host.querySelectorAll("a.site-link--emphasis")].map((element) => element.textContent),
}));
`;

function runChrome() {
  const dir = mkdtempSync(join(kit, ".landing-chrome-test-"));
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

test("a single-language header and a footer with details, mounted directly with getter props, hydrate in place under the development build", () => {
  const result = runChrome();
  assert.deepEqual(result.diagnostics, []);
  assert.equal((result.html.match(/class="wordmark"/g) ?? []).length, 2, "the server wrote the wordmark once in the header and once in the footer");
  assert.equal((result.html.match(/class="biz"/g) ?? []).length, 1, "the server wrote the details block once");
  assert.equal(result.lostKeys, 0, "every server hydration key is still in the document");
  assert.equal(result.wordmarks, 2);
  assert.ok(result.wordmarksKeyed, "both wordmarks kept their server keys");
  assert.equal(result.details, 1);
  assert.ok(result.detailsKeyed, "the details block kept its server key");
  assert.equal(result.brandLabel, "FM덴탈서비스 첫 화면");
  assert.equal(result.brandText, "FM덴탈서비스", "the wordmark is the visible name, printed once");
  assert.equal(result.pickers, 0, "no language picker without a locale");
  assert.equal(result.footerNav, "바닥 메뉴");
  assert.equal(result.emptyStrong, 0, "an empty brand name renders no <strong>");
  assert.deepEqual(result.emphasis, ["개인정보처리방침"]);
});
