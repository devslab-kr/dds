import { createMemoryHistory, createRootRoute, createRoute, createRouter, HeadContent, Outlet, RouterProvider } from "@tanstack/solid-router";
import { renderToString } from "solid-js/web";
import { expect, it } from "vitest";

import { buildMetadata } from "../../core/seo.mjs";
import { gtmHeadScript } from "../../core/gtm.mjs";
import { consentHeadScript } from "../../core/consent.mjs";
import { gtmHeadEntry, toTanStackHead } from "../../tanstack-start.mjs";

// The real router, rendered on the server: does the loader that
// toTanStackHead({ gtm }) puts in head().scripts come out of HeadContent as a
// <script> carrying the request's nonce? The nonce is the router's
// (ssr.nonce), not the entry's — this is the path the four family sites take.

const metadata = buildMetadata({ baseUrl: "https://example.com", path: "/", locale: "ko", defaultLocale: "ko", title: "Example", description: "Example site", siteName: "Example", image: "/og.png" });

async function render(nonce: string | undefined) {
  const rootRoute = createRootRoute({ component: () => <><HeadContent /><Outlet /></> });
  const publicRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", head: () => toTanStackHead(metadata, { gtm: "GTM-AB12CD3" }), component: () => <p>public</p> });
  // A route without Tag Manager passes `undefined` — typed `string | undefined`
  // so a product's per-route lookup compiles under exactOptionalPropertyTypes.
  const noGtm: string | undefined = undefined;
  const consoleRoute = createRoute({ getParentRoute: () => rootRoute, path: "/console", head: () => toTanStackHead(metadata, { gtm: noGtm }), component: () => <p>console</p> });
  const routes = { routeTree: rootRoute.addChildren([publicRoute, consoleRoute]) };
  return async (path: string) => {
    const router = createRouter({ ...routes, history: createMemoryHistory({ initialEntries: [path] }), isServer: true, ...(nonce === undefined ? {} : { ssr: { nonce } }) });
    await router.load();
    return renderToString(() => <RouterProvider router={router} />);
  };
}

const scriptsIn = (html: string) => [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].map(([, attrs, body]) => ({ attrs: attrs ?? "", body: body ?? "" }));

it("renders the Tag Manager loader as a head script stamped with the router's ssr.nonce", async () => {
  const html = await (await render("r4nd0m-n0nce"))("/");
  const loaders = scriptsIn(html).filter(({ body }) => body.includes("googletagmanager.com/gtm.js"));
  expect(loaders).toHaveLength(1);
  expect(loaders[0]!.attrs).toContain('nonce="r4nd0m-n0nce"');
  expect(loaders[0]!.body).toBe(gtmHeadScript("GTM-AB12CD3"));
  expect(html).not.toContain('nonce="undefined"');
});

it("leaves a route that does not opt in without the loader", async () => {
  const html = await (await render("r4nd0m-n0nce"))("/console");
  expect(html).not.toContain("googletagmanager");
  expect(html).toContain("console");
});

it("without ssr.nonce the loader carries no nonce — which a nonce CSP blocks, so products set it at router creation", async () => {
  // The router spreads the entry's attributes and then sets `nonce`, so the
  // nonce can only come from ssr.nonce. Set it when the router is created
  // (asklinq#427): patched in later from a component, the head has already
  // rendered without it.
  const html = await (await render(undefined))("/");
  const loaders = scriptsIn(html).filter(({ body }) => body.includes("googletagmanager.com/gtm.js"));
  expect(loaders).toHaveLength(1);
  expect(loaders[0]!.attrs).not.toContain("nonce");
  expect(gtmHeadEntry("GTM-AB12CD3")).toEqual({ children: gtmHeadScript("GTM-AB12CD3") });
});

// D-034: the consent-gated entry through the same real router. The cookie is
// what the request carried; only a current grant brings in the loader.
async function renderConsent(cookie: string) {
  const rootRoute = createRootRoute({ component: () => <><HeadContent /><Outlet /></> });
  const publicRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    head: () => toTanStackHead(metadata, { consent: { policyVersion: "2026-10-05", gtm: "GTM-AB12CD3", cookie } }),
    component: () => <p>public</p>,
  });
  const router = createRouter({ routeTree: rootRoute.addChildren([publicRoute]), history: createMemoryHistory({ initialEntries: ["/"] }), isServer: true, ssr: { nonce: "r4nd0m-n0nce" } });
  await router.load();
  return renderToString(() => <RouterProvider router={router} />);
}

it("without a consent cookie the head carries Consent Mode defaults, nonced, and nothing that contacts Google", async () => {
  const html = await renderConsent("theme=dark");
  expect(html).not.toMatch(/googletagmanager|google-analytics/);
  const consent = scriptsIn(html).filter(({ body }) => body.includes('"consent","default"'));
  expect(consent).toHaveLength(1);
  expect(consent[0]!.attrs).toContain('nonce="r4nd0m-n0nce"');
  expect(consent[0]!.body).toBe(consentHeadScript({ granted: false }));
});

it("with a current grant the same entry also carries Google's loader, nonced", async () => {
  const t = Math.floor(Date.now() / 1000);
  const html = await renderConsent(`site_consent=v=2026-10-05&a=1&t=${t}&id=0123456789abcdef0123456789abcdef`);
  const scripts = scriptsIn(html).filter(({ body }) => body.includes("googletagmanager.com/gtm.js"));
  expect(scripts).toHaveLength(1);
  expect(scripts[0]!.attrs).toContain('nonce="r4nd0m-n0nce"');
  expect(scripts[0]!.body).toContain(gtmHeadScript("GTM-AB12CD3"));
  expect(scripts[0]!.body.indexOf('"consent","default"')).toBeLessThan(scripts[0]!.body.indexOf("gtm.js"));
});
