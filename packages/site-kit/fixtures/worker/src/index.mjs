import { buildMetadata, buildRobots } from "../../../src/core/index.mjs";

const json = (value, init = {}) => new Response(JSON.stringify(value), {
  ...init,
  headers: { "content-type": "application/json; charset=utf-8", ...init.headers },
});

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/robots.txt") {
      return new Response(buildRobots({
        baseUrl: url.origin,
        environment: "preview",
        policies: { search: "disallow", citation: "disallow", modelTraining: "disallow" },
      }), {
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
    if (url.pathname === "/metadata") {
      return json(buildMetadata({
        baseUrl: url.origin,
        path: "/docs",
        locale: "ar",
        defaultLocale: "ko",
        title: "وثائق",
        description: "وصف موضعي",
        siteName: "Fixture",
        image: "/social.png",
      }));
    }
    return json({ error: "not_found" }, { status: 404 });
  },
};
