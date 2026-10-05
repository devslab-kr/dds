import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";

import {
  CONSENT_COOKIE_NAME,
  CONSENT_MAX_AGE_SECONDS,
  CONSENT_MESSAGES_EN,
  CONSENT_MESSAGES_KO,
  CONSENT_MODE_DEFAULTS,
  CONSENT_RESPONSE_HEADERS,
  analyticsConsented,
  consentCookieGrantsAnalytics,
  consentHeadScript,
  createConsentManager,
  formatConsentCookie,
  isSameOriginRequest,
  normalizeConsentPath,
  parseConsentCookie,
  parseConsentRecord,
  postConsentRecord,
  readConsentCookie,
  serializeConsentCookie,
} from "../packages/site-kit/src/core/consent.mjs";
import { gtmHeadScript } from "../packages/site-kit/src/core/gtm.mjs";
import { buildMetadata } from "../packages/site-kit/src/core/seo.mjs";
import * as core from "../packages/site-kit/src/core/index.mjs";
import { readFileSync } from "node:fs";
import * as tanstack from "../packages/site-kit/src/tanstack-start.mjs";
import { consentHeadEntry, toTanStackHead } from "../packages/site-kit/src/tanstack-start.mjs";

/*
 * D-034: analytics is opt-in. Node built-ins only — this file runs in the
 * source-contracts CI job, which installs no packages. The browser is a
 * small fake that models exactly what the manager touches: a cookie jar
 * with Domain/Max-Age semantics, script elements (the only way the page can
 * contact Google), the dataLayer, localStorage and click delegation. The
 * real banner in a real browser is tests/browser/site-kit-consent.spec.ts.
 */

const VERSION = "2026-10-05";
const GTM = "GTM-AB12CD3";
const NOW = Date.UTC(2026, 9, 5, 12, 0, 0);
const GOOGLE = /googletagmanager|google-analytics|\.google\./;
const ID = "0123456789abcdef0123456789abcdef";
const MEASUREMENT = "G-ABC123";

function fakeBrowser({ hostname = "www.example.com", cookies = [], nonce, metaNonce, blockCookies = false } = {}) {
  const jar = new Map();
  const writes = [];
  const scripts = [];
  const listeners = new Map();
  const element = (tag) => {
    const attributes = {};
    return {
      tagName: tag.toUpperCase(),
      attributes,
      setAttribute(name, value) { attributes[name] = String(value); },
      getAttribute(name) { return attributes[name] ?? null; },
    };
  };
  const head = {
    appendChild(node) { scripts.push(node); node.parentNode = head; return node; },
    insertBefore(node, before) { scripts.splice(Math.max(scripts.indexOf(before), 0), 0, node); node.parentNode = head; return node; },
  };
  const appScript = Object.assign(element("script"), { src: "/app.js", parentNode: head });
  scripts.push(appScript);
  // A browser under a header CSP hides the attribute; the property survives.
  const nonced = nonce === undefined ? null : { nonce, getAttribute: (name) => (name === "nonce" ? "" : null) };
  const meta = metaNonce === undefined ? null : { nonce: "", getAttribute: (name) => (name === "content" ? metaNonce : null) };
  const document = {
    get cookie() { return [...jar].map(([key, value]) => `${key.split("|")[0]}=${value}`).join("; "); },
    set cookie(text) {
      writes.push(text);
      if (blockCookies) return; // the visitor's browser refuses cookies for this site
      const [pair, ...rest] = text.split(";").map((part) => part.trim());
      const at = pair.indexOf("=");
      const name = pair.slice(0, at);
      const value = pair.slice(at + 1);
      const attributes = Object.fromEntries(rest.map((part) => { const [key, ...v] = part.split("="); return [key.toLowerCase(), v.join("=")]; }));
      const domain = (attributes.domain ?? "").replace(/^\./, "");
      if (domain && hostname !== domain && !hostname.endsWith(`.${domain}`)) return; // the browser refuses a foreign Domain
      const key = `${name}|${domain}`;
      if (attributes["max-age"] !== undefined && Number(attributes["max-age"]) <= 0) jar.delete(key);
      else jar.set(key, value);
    },
    head,
    documentElement: head,
    createElement: element,
    getElementsByTagName: (tag) => (tag === "script" ? scripts : []),
    querySelector(selector) {
      const prefix = selector.match(/^script\[src\^="([^"]+)"\]$/)?.[1];
      if (prefix) return scripts.find((script) => typeof script.src === "string" && script.src.startsWith(prefix)) ?? null;
      if (selector === "[nonce]") return nonced;
      if (selector === 'meta[name="csp-nonce"]') return meta;
      return null;
    },
    addEventListener(type, listener) { listeners.set(type, [...(listeners.get(type) ?? []), listener]); },
    removeEventListener(type, listener) { listeners.set(type, (listeners.get(type) ?? []).filter((entry) => entry !== listener)); },
  };
  const storage = new Map();
  const window = {
    document,
    location: { hostname, pathname: "/ko/pricing" },
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: (key) => storage.delete(key),
    },
    crypto: globalThis.crypto,
  };
  for (const [name, value, domain = ""] of cookies) jar.set(`${name}|${domain}`, value);
  const click = (target) => {
    let prevented = false;
    const event = { target, preventDefault: () => { prevented = true; } };
    for (const listener of listeners.get("click") ?? []) listener(event);
    return prevented;
  };
  return {
    window,
    jar,
    writes,
    storage,
    click,
    googleScripts: () => scripts.filter((script) => GOOGLE.test(script.src ?? "")),
    layer: () => window.dataLayer ?? [],
  };
}

const isArgs = (item) => Object.prototype.toString.call(item) === "[object Arguments]";
// JSON round trip: the head script runs in a vm realm whose objects have another Object.prototype.
const commands = (browser) => JSON.parse(JSON.stringify(Array.from(browser.layer()).filter(isArgs).map((item) => [...item])));
const events = (browser) => Array.from(browser.layer()).filter((item) => !isArgs(item));
const manager = (browser, extra = {}) => createConsentManager({ policyVersion: VERSION, gtm: GTM, measurementIds: [MEASUREMENT], window: browser.window, now: () => NOW, ...extra });
const cookieOf = (browser, name = CONSENT_COOKIE_NAME) => [...browser.jar].find(([key]) => key.startsWith(`${name}|`))?.[1];
const stateAt = (overrides = {}) => ({ v: VERSION, a: 1, t: Math.floor(NOW / 1000), id: ID, ...overrides });
const header = (state) => `theme=dark; ${CONSENT_COOKIE_NAME}=${formatConsentCookie(state)}; session=abc`;

test("the cookie value is v, a, t and id, and the parser takes nothing else", () => {
  const state = stateAt();
  const value = formatConsentCookie(state);
  assert.equal(value, `v=${VERSION}&a=1&t=${state.t}&id=${ID}`);
  assert.deepEqual(parseConsentCookie(value), state);
  for (const bad of [
    "", undefined, null, 42, `v=${VERSION}&a=1&t=${state.t}`, `${value}&x=1`, `v=${VERSION}&a=2&t=${state.t}&id=${ID}`,
    `v=${VERSION}&a=1&t=0&id=${ID}`, `v=${VERSION}&a=1&t=12.5&id=${ID}`, `v=${VERSION}&a=1&t=${state.t}&id=${ID.toUpperCase()}`,
    `v=${VERSION}&a=1&t=${state.t}&id=abc`, `v=<x>&a=1&t=${state.t}&id=${ID}`, `v=${VERSION}&v=${VERSION}&a=1&t=${state.t}`,
    `v=${VERSION}&a=1=1&t=${state.t}&id=${ID}`, `{"v":"${VERSION}"}`, "x".repeat(300),
  ]) assert.equal(parseConsentCookie(bad), null, `refuses ${JSON.stringify(bad)}`);
  assert.throws(() => formatConsentCookie({ ...state, a: true }), RangeError);
});

test("the cookie is first-party, Path=/, SameSite=Lax, Secure, twelve months, readable by the banner", () => {
  const cookie = serializeConsentCookie(stateAt());
  assert.equal(cookie, `site_consent=${formatConsentCookie(stateAt())}; Path=/; Max-Age=${CONSENT_MAX_AGE_SECONDS}; SameSite=Lax; Secure`);
  assert.equal(CONSENT_MAX_AGE_SECONDS, 31536000);
  assert.doesNotMatch(cookie, /HttpOnly|Domain/);
  assert.match(serializeConsentCookie(stateAt(), { domain: "example.com" }), /; Domain=example\.com; /);
  assert.throws(() => serializeConsentCookie(stateAt(), { domain: "example.com; Secure=" }), RangeError);
  assert.throws(() => serializeConsentCookie(stateAt(), { name: "a b" }), RangeError);
  assert.throws(() => serializeConsentCookie(stateAt(), { maxAgeSeconds: CONSENT_MAX_AGE_SECONDS + 1 }), RangeError);
});

test("a decision counts only for the current policy version and only while it is fresh", () => {
  const options = { policyVersion: VERSION, now: NOW };
  assert.deepEqual(readConsentCookie(header(stateAt()), options), stateAt());
  assert.equal(consentCookieGrantsAnalytics(header(stateAt()), options), true);
  assert.equal(consentCookieGrantsAnalytics(header(stateAt({ a: 0 })), options), false);
  assert.deepEqual(readConsentCookie(header(stateAt({ a: 0 })), options), stateAt({ a: 0 }), "a refusal is a decision: do not ask again");
  assert.equal(readConsentCookie(header(stateAt({ v: "2026-01-01" })), options), null, "an older policy version asks again");
  assert.equal(readConsentCookie(header(stateAt({ t: stateAt().t - CONSENT_MAX_AGE_SECONDS - 1 })), options), null, "older than twelve months asks again");
  assert.equal(readConsentCookie(header(stateAt({ t: stateAt().t + 3600 })), options), null, "a decision dated in the future is not trusted");
  assert.equal(readConsentCookie("theme=dark; session=abc", options), null);
  assert.equal(readConsentCookie(undefined, options), null);
  assert.equal(readConsentCookie(`${CONSENT_COOKIE_NAME}=garbage`, options), null);
  assert.equal(consentCookieGrantsAnalytics(`other=${formatConsentCookie(stateAt())}`, options), false, "only the named cookie counts");
  assert.equal(consentCookieGrantsAnalytics(`other=${formatConsentCookie(stateAt())}`, { ...options, cookieName: "other" }), true);
  assert.equal(analyticsConsented(stateAt(), VERSION, { now: NOW }), true);
  assert.equal(analyticsConsented(stateAt({ v: "old" }), VERSION, { now: NOW }), false);
  assert.equal(analyticsConsented(null, VERSION), false);
  assert.throws(() => readConsentCookie(header(stateAt()), { policyVersion: "" }), RangeError);
  assert.throws(() => readConsentCookie(header(stateAt()), { policyVersion: "a b" }), RangeError);
});

/** Runs a head script body against a fake page, the way the browser runs the inline <script>. */
function runHead(body, browser) {
  vm.runInNewContext(body, { window: browser.window, document: browser.window.document });
}

test("without a grant the head script is Consent Mode defaults only — no Google host anywhere in it", () => {
  const body = consentHeadScript({ granted: false, gtm: GTM });
  assert.equal(body, consentHeadScript());
  assert.doesNotMatch(body, GOOGLE);
  assert.doesNotMatch(body, /<\/?script|nonce=/, "the renderer owns the element and its nonce");
  const browser = fakeBrowser();
  runHead(body, browser);
  runHead(body, browser);
  assert.deepEqual(commands(browser), [["consent", "default", { ...CONSENT_MODE_DEFAULTS }]], "pushed once, as an arguments object, all four signals denied");
  assert.deepEqual(events(browser), []);
  assert.deepEqual(browser.googleScripts(), []);
  assert.equal(browser.window.__siteConsent, "denied");
});

test("with a grant the head script grants analytics_storage, then runs Google's own loader once", () => {
  const body = consentHeadScript({ granted: true, gtm: GTM });
  assert.ok(body.includes(gtmHeadScript(GTM)), "Google's nonce-aware snippet, byte for byte");
  const browser = fakeBrowser({ nonce: "r4nd0m" });
  runHead(body, browser);
  runHead(body, browser);
  assert.deepEqual(commands(browser), [
    ["consent", "default", { ...CONSENT_MODE_DEFAULTS }],
    ["consent", "update", { analytics_storage: "granted" }],
  ]);
  assert.equal(events(browser).filter((item) => item.event === "gtm.js").length, 1);
  assert.equal(browser.googleScripts().length, 1, "a second copy of the head (client navigation) loads nothing");
  assert.equal(browser.googleScripts()[0].getAttribute("nonce"), "r4nd0m");
  assert.equal(consentHeadScript({ granted: true }), consentHeadScript({ granted: true, gtm: undefined }));
  assert.doesNotMatch(consentHeadScript({ granted: true }), GOOGLE, "granted without a container: nothing to load");
  assert.throws(() => consentHeadScript({ granted: true, gtm: "GTM-x'); alert(1); ('" }), RangeError);
});

test("before any decision the manager sends nothing to Google and keeps no analytics events", () => {
  const browser = fakeBrowser();
  const consent = manager(browser);
  assert.equal(browser.window.dataLayer, undefined, "creating a manager touches nothing");
  consent.start();
  consent.start();
  assert.equal(consent.needsDecision(), true);
  assert.equal(consent.state(), null);
  browser.window.dataLayer.push({ event: "contact_cta" });
  assert.deepEqual(browser.googleScripts(), []);
  assert.deepEqual(commands(browser), [["consent", "default", { ...CONSENT_MODE_DEFAULTS }]]);
  assert.deepEqual(events(browser), [], "an event pushed before consent is dropped, not queued for a later Tag Manager");
  assert.equal(cookieOf(browser), undefined, "starting writes no cookie");
});

test("accepting loads Tag Manager exactly once, with the page nonce, and records a grant", async () => {
  const records = [];
  const browser = fakeBrowser({ metaNonce: "m3ta" });
  const consent = manager(browser, { onChange: (record) => { records.push(record); } });
  consent.start();
  const record = consent.acceptAll();
  assert.deepEqual(record, { policyVersion: VERSION, analytics: true, action: "grant", anonymousId: record.anonymousId, decidedAt: Math.floor(NOW / 1000), source: "web", path: "/ko/pricing" });
  assert.match(record.anonymousId, /^[0-9a-f]{32}$/);
  const google = browser.googleScripts();
  assert.equal(google.length, 1);
  assert.equal(google[0].src, `https://www.googletagmanager.com/gtm.js?id=${GTM}`);
  assert.equal(google[0].async, true);
  assert.equal(google[0].getAttribute("nonce"), "m3ta");
  assert.deepEqual(commands(browser), [["consent", "default", { ...CONSENT_MODE_DEFAULTS }], ["consent", "update", { analytics_storage: "granted" }]]);
  assert.equal(events(browser)[0].event, "gtm.js");
  assert.deepEqual(parseConsentCookie(cookieOf(browser)), { v: VERSION, a: 1, t: record.decidedAt, id: record.anonymousId });
  assert.ok(browser.writes.some((write) => /; Path=\/; Max-Age=31536000; SameSite=Lax; Secure$/.test(write)));
  browser.window.dataLayer.push({ event: "contact_cta" });
  assert.equal(events(browser).at(-1).event, "contact_cta", "after the grant, events pass");
  const again = consent.acceptAll();
  assert.equal(again.action, "update", "saving the same choice again is an update");
  assert.equal(again.anonymousId, record.anonymousId);
  assert.equal(browser.googleScripts().length, 1, "still one Tag Manager");
  await consent.settled();
  assert.deepEqual(records, [record, again]);
  assert.equal(consent.needsDecision(), false);
  assert.equal(consent.analyticsGranted(), true);
});

test("a stored grant loads Tag Manager on the next page, once, and not again if the head already did", () => {
  const visit = fakeBrowser({ cookies: [[CONSENT_COOKIE_NAME, formatConsentCookie(stateAt())]] });
  const consent = manager(visit);
  consent.start();
  consent.start();
  assert.equal(visit.googleScripts().length, 1);
  assert.equal(consent.needsDecision(), false);

  const rendered = fakeBrowser({ cookies: [[CONSENT_COOKIE_NAME, formatConsentCookie(stateAt())]] });
  runHead(consentHeadScript({ granted: true, gtm: GTM }), rendered);
  manager(rendered).start();
  assert.equal(rendered.googleScripts().length, 1, "the server-rendered loader already ran");
  assert.equal(commands(rendered).filter(([, kind]) => kind === "default").length, 1, "defaults pushed once");
});

test("withdrawing turns analytics off, stops events and deletes the GA cookies wherever GA put them", async () => {
  const browser = fakeBrowser({
    hostname: "www.example.com",
    cookies: [
      [CONSENT_COOKIE_NAME, formatConsentCookie(stateAt())],
      ["_ga", "GA1.1.1.1", "example.com"],
      ["_ga_ABC123", "GS1.1.1", "example.com"],
      ["_gid", "GA1.1.2", ""],
      ["theme", "dark", ""],
    ],
  });
  const records = [];
  const consent = manager(browser, { measurementIds: ["G-ABC123"], onChange: (record) => { records.push(record); } });
  consent.start();
  assert.equal(browser.googleScripts().length, 1);
  const record = consent.withdraw();
  assert.equal(record.action, "withdraw");
  assert.equal(record.analytics, false);
  assert.equal(parseConsentCookie(cookieOf(browser)).a, 0);
  assert.deepEqual(commands(browser).at(-1), ["consent", "update", { analytics_storage: "denied" }]);
  assert.equal(browser.window["ga-disable-G-ABC123"], true);
  assert.deepEqual([...browser.jar.keys()].map((key) => key.split("|")[0]).sort(), ["site_consent", "theme"], "_ga, _ga_* and _gid are gone; other cookies stay");
  const before = events(browser).length;
  browser.window.dataLayer.push({ event: "contact_cta" });
  assert.equal(events(browser).length, before, "no event reaches the dataLayer after withdrawal");
  assert.equal(consent.analyticsGranted(), false);
  assert.equal(consent.needsDecision(), false, "a withdrawal is a decision: the bar does not come back");

  const regrant = consent.acceptAll();
  assert.equal(regrant.action, "grant");
  assert.equal(browser.window["ga-disable-G-ABC123"], false);
  assert.equal(browser.googleScripts().length, 1, "Tag Manager is already on the page");
  await consent.settled();
  assert.deepEqual(records.map((entry) => entry.action), ["withdraw", "grant"]);
});

test("rejecting first is a deny; Google is never contacted", () => {
  const browser = fakeBrowser();
  const consent = manager(browser);
  const record = consent.rejectAll();
  assert.equal(record.action, "deny");
  assert.equal(record.analytics, false);
  assert.deepEqual(browser.googleScripts(), []);
  assert.equal(parseConsentCookie(cookieOf(browser)).a, 0);
  assert.deepEqual(commands(browser), [["consent", "default", { ...CONSENT_MODE_DEFAULTS }]], "a first refusal needs no update — the default already denies");
  assert.equal(consent.save({ analytics: false }).action, "update");
  assert.equal(consent.save({ analytics: true }).action, "grant");
  assert.equal(browser.googleScripts().length, 1);
});

test("a new policy version asks again and loads nothing, but keeps the anonymous id", () => {
  const browser = fakeBrowser({ cookies: [[CONSENT_COOKIE_NAME, formatConsentCookie(stateAt({ v: "2026-01-01" }))]] });
  const consent = manager(browser);
  consent.start();
  assert.equal(consent.needsDecision(), true);
  assert.deepEqual(browser.googleScripts(), [], "a grant under the old policy loads nothing under the new one");
  const record = consent.acceptAll();
  assert.equal(record.action, "grant", "the first decision under this version");
  assert.equal(record.anonymousId, ID, "the same anonymous id links the two records");
  assert.equal(parseConsentCookie(cookieOf(browser)).v, VERSION);
});

test("dismissing is no decision: nothing is written, nothing loads, and the next visit asks again", () => {
  const browser = fakeBrowser();
  const seen = [];
  const consent = manager(browser);
  consent.subscribe((event) => seen.push(event.type));
  consent.start();
  consent.dismiss();
  assert.equal(consent.dismissed(), true);
  assert.equal(consent.needsDecision(), true);
  assert.equal(consent.analyticsGranted(), false);
  assert.equal(cookieOf(browser), undefined);
  assert.deepEqual(browser.googleScripts(), []);
  assert.deepEqual(seen, ["dismiss"]);
  const nextVisit = manager(browser);
  nextVisit.start();
  assert.equal(nextVisit.dismissed(), false);
  assert.equal(nextVisit.needsDecision(), true);
});

test("with cookies blocked, a click still decides for this page — the bar does not stay up as if nothing happened", () => {
  const browser = fakeBrowser({ blockCookies: true });
  const consent = manager(browser);
  consent.start();
  consent.acceptAll();
  assert.equal(cookieOf(browser), undefined);
  assert.equal(consent.needsDecision(), false);
  assert.equal(consent.analyticsGranted(), true);
  assert.equal(browser.googleScripts().length, 1);
  const nextPage = manager(browser);
  nextPage.start();
  assert.equal(nextPage.needsDecision(), true, "nothing was stored, so the next page asks again");
  assert.deepEqual(browser.googleScripts().length, 1);
});

test("a cookie that changed after the page was rendered wins over the head", () => {
  // Rendered as granted; another tab withdrew before this page started.
  const browser = fakeBrowser({ cookies: [[CONSENT_COOKIE_NAME, formatConsentCookie(stateAt({ a: 0 }))], ["_ga", "GA1.1", "example.com"]] });
  runHead(consentHeadScript({ granted: true, gtm: GTM }), browser);
  manager(browser).start();
  assert.deepEqual(commands(browser).at(-1), ["consent", "update", { analytics_storage: "denied" }]);
  assert.equal([...browser.jar.keys()].some((key) => key.startsWith("_ga|")), false);
});

test("a record that fails to send is kept and sent on the next page; a refused one is dropped", async () => {
  const browser = fakeBrowser();
  const failing = manager(browser, { onChange: () => { throw Object.assign(new Error("offline"), { retryable: true }); } });
  const record = failing.acceptAll();
  await failing.settled();
  assert.deepEqual(JSON.parse(browser.storage.get(`${CONSENT_COOKIE_NAME}_pending`)), [record]);

  const received = [];
  const next = manager(browser, { onChange: (entry) => { received.push(entry); } });
  next.start();
  await next.settled();
  assert.deepEqual(received, [record]);
  assert.equal(browser.storage.has(`${CONSENT_COOKIE_NAME}_pending`), false);

  const refused = manager(fakeBrowser(), { onChange: async () => { throw Object.assign(new Error("400"), { retryable: false }); } });
  refused.acceptAll();
  await refused.settled();
});

test("postConsentRecord POSTs JSON to a same-origin path and says which failures to retry", async () => {
  const calls = [];
  const respond = (status) => async (url, init) => { calls.push({ url, init }); return { ok: status < 400, status }; };
  const record = { policyVersion: VERSION, analytics: true, action: "grant", anonymousId: ID, decidedAt: 1, source: "web", path: "/" };
  await postConsentRecord("/api/consent", { fetch: respond(204) })(record);
  assert.equal(calls[0].url, "/api/consent");
  assert.equal(calls[0].init.method, "POST");
  assert.equal(calls[0].init.credentials, "same-origin");
  assert.equal(calls[0].init.keepalive, true);
  assert.equal(calls[0].init.headers["content-type"], "application/json");
  assert.deepEqual(JSON.parse(calls[0].init.body), record);
  for (const [status, retryable] of [[500, true], [503, true], [429, true], [400, false], [403, false]]) {
    await assert.rejects(postConsentRecord("/api/consent", { fetch: respond(status) })(record), (error) => error.retryable === retryable);
  }
  await assert.rejects(postConsentRecord("/api/consent", { fetch: async () => { throw new TypeError("network"); } })(record), (error) => error.retryable === true);
  for (const endpoint of ["https://evil.example/collect", "//evil.example/collect", "api/consent", ""]) {
    assert.throws(() => postConsentRecord(endpoint), RangeError, `${endpoint} is not same-origin`);
  }
});

test("the server accepts exactly the record the browser sends, and nothing that could carry more", () => {
  const browser = fakeBrowser();
  const sent = manager(browser).acceptAll();
  const options = { policyVersion: VERSION, now: NOW };
  assert.deepEqual(parseConsentRecord(JSON.stringify(sent), options), sent);
  assert.deepEqual(parseConsentRecord({ ...sent }, options), sent);
  assert.deepEqual(parseConsentRecord({ ...sent, policyVersion: "2026-01-01" }, { ...options, policyVersion: [VERSION, "2026-01-01"] })?.policyVersion, "2026-01-01");
  for (const [label, bad] of [
    ["an extra field", { ...sent, email: "a@b.c" }],
    ["a missing field", { ...sent, path: undefined }],
    ["another version", { ...sent, policyVersion: "2026-01-01" }],
    ["grant without analytics", { ...sent, analytics: false }],
    ["withdraw with analytics", { ...sent, action: "withdraw" }],
    ["an unknown action", { ...sent, action: "accept" }],
    ["a query in the path", { ...sent, path: "/ko?email=a@b.c" }],
    ["a non-hex id", { ...sent, anonymousId: "user-42-kim" }],
    ["an app source", { ...sent, source: "app" }],
    ["a future decision", { ...sent, decidedAt: sent.decidedAt + 3600 }],
    ["an old decision", { ...sent, decidedAt: sent.decidedAt - 32 * 86400 }],
    ["a string analytics", { ...sent, analytics: "true" }],
    ["an array", [sent]],
    ["bad JSON", "{"],
    ["an oversized body", JSON.stringify({ ...sent, pad: "x".repeat(2000) })],
    ["null", null],
  ]) assert.equal(parseConsentRecord(bad, options), null, `refuses ${label}`);
});

test("only a same-origin request may write a record", () => {
  const origin = "https://getasklinq.app";
  assert.equal(isSameOriginRequest({ headers: new Headers({ origin }) }, origin), true);
  assert.equal(isSameOriginRequest(new Headers({ origin: "https://evil.example" }), origin), false);
  assert.equal(isSameOriginRequest({ Origin: origin }, `${origin}/`), true);
  assert.equal(isSameOriginRequest({ "sec-fetch-site": "same-origin" }, origin), true);
  assert.equal(isSameOriginRequest({ "sec-fetch-site": "cross-site" }, origin), false);
  assert.equal(isSameOriginRequest({}, origin), false);
  assert.equal(isSameOriginRequest(new Headers({ origin: "null" }), origin), false);
});

test("record paths drop the query and fragment and refuse anything that is not a path", () => {
  assert.equal(normalizeConsentPath("/ko/pricing?utm=1#plans"), "/ko/pricing");
  assert.equal(normalizeConsentPath("/"), "/");
  for (const bad of ["", "pricing", "//evil.example/x", "https://example.com/", "/a\nb", `/${"x".repeat(600)}`, undefined]) {
    assert.equal(normalizeConsentPath(bad), "/");
  }
  const browser = fakeBrowser();
  browser.window.location.pathname = "/c/acme/k/0f0f0f0f";
  const record = manager(browser, { recordPath: (path) => path.replace(/\/k\/[^/]+/, "/k/:key") }).rejectAll();
  assert.equal(record.path, "/c/acme/k/:key", "a product can redact a path that carries a secret");
});

test("a [data-consent-settings] click anywhere opens the settings", () => {
  const browser = fakeBrowser();
  const consent = manager(browser);
  const opened = [];
  consent.subscribe((event) => opened.push(event.type));
  const remove = consent.bindTriggers();
  const link = { closest: (selector) => (selector === "[data-consent-settings]" ? link : null) };
  const other = { closest: () => null };
  assert.equal(browser.click({ closest: () => link }), true, "the trigger's default navigation is prevented");
  assert.equal(browser.click(other), false);
  remove();
  browser.click(link);
  assert.deepEqual(opened, ["open-settings"]);
});

test("the TanStack head loads Tag Manager only when the request's cookie grants the current version", () => {
  const metadata = buildMetadata({ baseUrl: "https://example.com", path: "/", locale: "ko", defaultLocale: "ko", title: "t", description: "d", siteName: "s", image: "/og.png" });
  const head = (cookie) => toTanStackHead(metadata, { consent: { policyVersion: VERSION, gtm: GTM, cookie } });
  const granted = head(header(stateAt({ t: Math.floor(Date.now() / 1000) })));
  assert.equal(granted.scripts.length, 1);
  assert.ok(granted.scripts[0].children.includes(gtmHeadScript(GTM)));
  for (const cookie of [undefined, "", "theme=dark", header(stateAt({ a: 0, t: Math.floor(Date.now() / 1000) })), header(stateAt({ v: "2026-01-01", t: Math.floor(Date.now() / 1000) }))]) {
    const { scripts } = head(cookie);
    assert.deepEqual(scripts, [{ children: consentHeadScript({ granted: false }) }]);
    assert.doesNotMatch(JSON.stringify(scripts), GOOGLE, `nothing contacts Google for ${JSON.stringify(cookie)}`);
  }
  assert.deepEqual(consentHeadEntry({ policyVersion: VERSION, cookie: undefined }), { children: consentHeadScript({ granted: false }) });
  assert.throws(() => toTanStackHead(metadata, { gtm: GTM, consent: { policyVersion: VERSION, cookie: "" } }), TypeError, "both would load Tag Manager without consent");
  assert.throws(() => toTanStackHead(metadata, { consent: { policyVersion: "", gtm: GTM, cookie: "" } }), RangeError, "a missing policy version is an error, not silence");
});

test("a manager that loads Tag Manager must name the GA4 streams it switches off on withdrawal", () => {
  // Without ga-disable-<id>, the GA4 tag Tag Manager already initialised keeps
  // its own listeners (history page_view, scroll, outbound clicks) and sends
  // cookieless pings to Google until the page reloads — withdrawal would not stop sending.
  const browser = fakeBrowser();
  for (const measurementIds of [undefined, []]) {
    assert.throws(() => createConsentManager({ policyVersion: VERSION, gtm: GTM, measurementIds, window: browser.window }), RangeError, `measurementIds ${JSON.stringify(measurementIds)}`);
  }
  assert.throws(() => createConsentManager({ policyVersion: VERSION, gtm: GTM, measurementIds: ["UA-1"], window: browser.window }), RangeError);
  assert.doesNotThrow(() => createConsentManager({ policyVersion: VERSION, gtm: GTM, measurementIds: [MEASUREMENT], window: browser.window }));
  assert.doesNotThrow(() => createConsentManager({ policyVersion: VERSION, window: browser.window }), "without Tag Manager there is no GA4 tag to switch off");
  const consent = manager(browser);
  consent.acceptAll();
  consent.withdraw();
  assert.equal(browser.window[`ga-disable-${MEASUREMENT}`], true);
});

test("a response whose head depends on the consent cookie is never stored by a shared cache", () => {
  // One visitor's granted head (with the Tag Manager loader) must not be served to another.
  assert.deepEqual({ ...CONSENT_RESPONSE_HEADERS }, { "Cache-Control": "private, no-store", Vary: "Cookie" });
  assert.ok(Object.isFrozen(CONSENT_RESPONSE_HEADERS));
  assert.equal(core.CONSENT_RESPONSE_HEADERS, CONSENT_RESPONSE_HEADERS);
  assert.equal(tanstack.CONSENT_RESPONSE_HEADERS, CONSENT_RESPONSE_HEADERS);
  for (const file of ["packages/site-kit/README.md", "packages/site-kit/README.ko.md", "docs/decisions.md"]) {
    const text = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    assert.match(text, /CONSENT_RESPONSE_HEADERS/, `${file} tells products to send the headers`);
    assert.match(text, /private, no-store/, file);
  }
  for (const file of ["packages/site-kit/README.md", "packages/site-kit/README.ko.md"]) {
    const text = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    const withGtm = [...text.matchAll(/createConsentManager\(\{[\s\S]*?\}\)/g)].map(([example]) => example).filter((example) => /\bgtm:/.test(example));
    assert.equal(withGtm.length, 2, `${file}: the TanStack and static examples both load Tag Manager`);
    for (const example of withGtm) {
      assert.match(example, /measurementIds:/, `${file}: every example that loads Tag Manager names its GA4 streams`);
    }
  }
});

test("the core barrel exports the consent API and both message sets have the same keys", () => {
  for (const name of ["createConsentManager", "consentHeadScript", "readConsentCookie", "consentCookieGrantsAnalytics", "parseConsentRecord", "postConsentRecord", "isSameOriginRequest", "CONSENT_MESSAGES_KO", "CONSENT_MESSAGES_EN"]) {
    assert.ok(name in core, `${name} missing from @devslab/site-kit`);
  }
  assert.deepEqual(Object.keys(CONSENT_MESSAGES_EN).sort(), Object.keys(CONSENT_MESSAGES_KO).sort());
  for (const messages of [CONSENT_MESSAGES_KO, CONSENT_MESSAGES_EN]) {
    for (const [key, value] of Object.entries(messages)) assert.ok(typeof value === "string" && value.trim().length > 0, key);
    // What, why, who, where and how long — the banner names all of them.
    assert.match(messages.body, /Google LLC/);
    assert.match(messages.body, /14/);
    assert.match(messages.analyticsBody, /Google LLC/);
    assert.match(messages.analyticsBody, /14/);
    assert.doesNotMatch(JSON.stringify(messages), /§/);
  }
  assert.match(CONSENT_MESSAGES_KO.body, /미국/);
  assert.match(CONSENT_MESSAGES_EN.body, /United States/);
  assert.equal(CONSENT_MESSAGES_KO.acceptAll, "모두 허용");
  assert.equal(CONSENT_MESSAGES_KO.rejectAll, "거부");
  assert.equal(CONSENT_MESSAGES_KO.settings, "설정");
  assert.equal(CONSENT_MESSAGES_KO.trigger, "쿠키 설정");
});
