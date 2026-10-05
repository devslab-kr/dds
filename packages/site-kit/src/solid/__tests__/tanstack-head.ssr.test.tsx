import { createMemoryHistory, createRootRoute, createRoute, createRouter, HeadContent, Outlet, RouterProvider } from "@tanstack/solid-router";
import { renderToString } from "solid-js/web";
import { expect, it } from "vitest";

import { buildMetadata } from "../../core/seo.mjs";
import { gtmHeadScript } from "../../core/gtm.mjs";
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
