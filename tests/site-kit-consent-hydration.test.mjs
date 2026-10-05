import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * D-034: the consent bar on a server-rendered page, hydrated by the
 * development browser build in jsdom (the build every consumer's dev server
 * runs — the one that throws `Hydration Mismatch`, D-028).
 *
 * The server renders ConsentBanner and a SiteFooter carrying the "쿠키 설정"
 * button. The banner must write nothing on the server, so hydration adopts
 * the footer untouched; only after mount does the bar appear, from the
 * browser's own cookie. Then the footer button opens the settings dialog.
 * Same harness as site-kit-landing-chrome-hydration.test.mjs.
 */

const root = fileURLToPath(new URL("..", import.meta.url));
const kit = join(root, "packages", "site-kit");
const consentModule = pathToFileURL(join(kit, "src", "core", "consent.mjs")).href;
const ddsSolidBrowser = pathToFileURL(join(root, "packages", "dds-solid", "dist", "index.js")).href;

const MESSAGES = {
  navigationLabel: "사이트 메뉴", localeLabel: "언어", themeLabel: "테마", themeSystem: "시스템", themeLight: "라이트",
  themeDark: "다크", menuOpen: "메뉴", menuClose: "닫기", footerLabel: "바닥글", skipToContent: "본문 바로가기",
  updatedLabel: "수정", notFoundTitle: "없음", notFoundDescription: "없는 페이지", backHome: "첫 화면",
  errorTitle: "오류", errorDescription: "다시 시도", retry: "다시 시도",
};

const PAGE_SOURCE = `
export function page({ createComponent, ConsentBanner, SiteFooter, controller, CONSENT_MESSAGES_KO, MESSAGES }) {
  return [
    createComponent(ConsentBanner, { controller, messages: CONSENT_MESSAGES_KO, learnMoreHref: "/privacy#analytics", privacyHref: "/privacy" }),
    createComponent(SiteFooter, {
      brand: { name: "AskLinq", href: "/" },
      links: [{ href: "/privacy", label: "개인정보처리방침", emphasis: true }],
      copyright: "© DevsLab",
      messages: MESSAGES,
      get consentSettings() { return { controller, label: CONSENT_MESSAGES_KO.trigger }; },
    }),
  ];
}
`;

const ssrScript = () => `
import { renderToString, generateHydrationScript } from "solid-js/web";
import { createComponent } from "solid-js";
import { ConsentBanner, SiteFooter } from ${JSON.stringify(pathToFileURL(join(kit, "dist", "solid.server.js")).href)};
import { CONSENT_MESSAGES_KO, createConsentManager } from ${JSON.stringify(consentModule)};
import { page } from "./page.mjs";
const MESSAGES = ${JSON.stringify(MESSAGES)};
const controller = createConsentManager({ policyVersion: "2026-10-05", gtm: "GTM-AB12CD3", measurementIds: ["G-ABC123"] });
const html = renderToString(() => page({ createComponent, ConsentBanner, SiteFooter, controller, CONSENT_MESSAGES_KO, MESSAGES }));
process.stdout.write(JSON.stringify({ bootstrap: generateHydrationScript(), html }));
`;

const hydrateScript = () => `
process.on("uncaughtException", (e) => { process.stderr.write("UNCAUGHT " + (e && e.stack || e) + String.fromCharCode(10)); process.exit(1); });
import { readFileSync } from "node:fs";
import { createRequire, registerHooks } from "node:module";
// Node always matches the "node" export condition, which dds-solid lists before
// "browser": without this the client half would get dds-solid's server build,
// whose components render nothing outside SSR. A browser bundler never sees "node".
registerHooks({ resolve: (specifier, context, next) => specifier === "@devslab/dds-solid" ? { url: ${JSON.stringify(ddsSolidBrowser)}, shortCircuit: true } : next(specifier, context) });
const require = createRequire(${JSON.stringify(pathToFileURL(join(kit, "package.json")).href)});
const { JSDOM } = require("jsdom");
const { bootstrap, html } = JSON.parse(readFileSync(new URL("./ssr.json", import.meta.url), "utf8"));
const dom = new JSDOM("<!doctype html><html><head>" + bootstrap + "</head><body><div id=\\"root\\">" + html + "</div></body></html>", { runScripts: "dangerously", pretendToBeVisual: true, url: "https://example.test/ko" });
for (const key of ["window", "document", "Node", "HTMLElement", "SVGElement", "MutationObserver", "navigator", "requestAnimationFrame", "localStorage", "matchMedia", "KeyboardEvent"]) {
  Object.defineProperty(globalThis, key, { value: dom.window[key], configurable: true, writable: true });
}
Object.defineProperty(globalThis, "_$HY", { value: dom.window._$HY, configurable: true, writable: true });
const host = document.querySelector("#root");
const serverKeys = [...host.querySelectorAll("[data-hk]")].map((element) => element.getAttribute("data-hk"));
const { hydrate } = await import("solid-js/web");
const { createComponent } = await import("solid-js");
const { ConsentBanner, SiteFooter } = await import(${JSON.stringify(pathToFileURL(join(kit, "dist", "solid.js")).href)});
const { CONSENT_MESSAGES_KO, createConsentManager } = await import(${JSON.stringify(consentModule)});
const { page } = await import("./page.mjs");
const MESSAGES = ${JSON.stringify(MESSAGES)};
const controller = createConsentManager({ policyVersion: "2026-10-05", gtm: "GTM-AB12CD3", measurementIds: ["G-ABC123"] });
const diagnostics = [];
const warn = console.warn, error = console.error;
console.warn = (...v) => diagnostics.push(v.join(" "));
console.error = (...v) => diagnostics.push(v.join(" "));
hydrate(() => page({ createComponent, ConsentBanner, SiteFooter, controller, CONSENT_MESSAGES_KO, MESSAGES }), host);
await new Promise((resolve) => setTimeout(resolve, 50));
const trigger = host.querySelector("footer .site-consent-trigger");
const result = {
  serverKeyed: serverKeys.length,
  lostKeys: serverKeys.filter((key) => !host.querySelector('[data-hk="' + key + '"]')).length,
  triggerKeyed: Boolean(trigger && trigger.hasAttribute("data-hk")),
  bar: host.querySelectorAll(".site-consent").length,
  barButtons: [...host.querySelectorAll(".site-consent__actions button")].map((button) => button.textContent),
  google: [...document.querySelectorAll("script")].filter((script) => script.src.includes("googletagmanager")).length,
};
trigger.click();
await new Promise((resolve) => setTimeout(resolve, 50));
result.dialog = host.querySelector('[role="dialog"] h2')?.textContent ?? null;
console.warn = warn; console.error = error;
result.diagnostics = diagnostics;
process.stdout.write(JSON.stringify(result));
`;

function runPage() {
  const dir = mkdtempSync(join(kit, ".consent-hydration-test-"));
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

test("the consent bar comes in after hydration, without disturbing the server's footer, and the footer button opens the settings", () => {
  const result = runPage();
  assert.deepEqual(result.diagnostics, []);
  assert.doesNotMatch(result.html, /site-consent__|googletagmanager/, "the server writes no bar and no loader");
  assert.match(result.html, /class="site-consent-trigger"/);
  assert.ok(result.serverKeyed > 0);
  assert.equal(result.lostKeys, 0, "every server hydration key is still in the document");
  assert.ok(result.triggerKeyed, "the footer button was adopted, not rebuilt");
  assert.equal(result.bar, 1, "no decision in the browser's cookie: the bar is shown after mount");
  assert.deepEqual(result.barButtons, ["모두 허용", "거부", "설정"]);
  assert.equal(result.google, 0, "nothing loads before a decision");
  assert.equal(result.dialog, "쿠키 설정");
});
