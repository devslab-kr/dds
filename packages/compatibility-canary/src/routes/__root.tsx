import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/solid-router";
import { HydrationScript } from "@solidjs/web";
import type { JSX } from "solid-js";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "DDS 호환성 카나리" },
      { name: "description", content: "Solid 2 호환성 검증" },
    ],
    links: [{ rel: "icon", href: "/canary.svg", type: "image/svg+xml" }],
  }),
  notFoundComponent: () => <main><h1>DDS canary route not found</h1></main>,
  component: () => <Outlet />,
  shellComponent: RootDocument,
});

function RootDocument(props: { children: JSX.Element }) {
  const queryClient = new QueryClient();

  return (
    <html lang="ko">
      <head><HydrationScript /><HeadContent /></head>
      <body>
        <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>
        <Scripts />
      </body>
    </html>
  );
}
