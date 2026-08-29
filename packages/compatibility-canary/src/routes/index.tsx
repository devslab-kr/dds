import { useQuery } from "@tanstack/solid-query";
import { createFileRoute } from "@tanstack/solid-router";
import { onMount } from "solid-js";

import { readCanaryContext } from "../server-canary";

export const Route = createFileRoute("/")({
  loader: () => readCanaryContext(),
  component: CanaryHome,
});

function CanaryHome() {
  const loaderData = Route.useLoaderData();
  const query = useQuery(() => ({
    queryKey: ["canary-context", loaderData().requestId],
    queryFn: async () => loaderData(),
    initialData: loaderData(),
  }));

  onMount(() => document.documentElement.setAttribute("data-canary-hydrated", "true"));

  return (
    <main data-hydration-key="canary-root">
      <h1>DDS 호환성 카나리</h1>
      <p data-request-id>{query.data?.requestId}</p>
      <p data-service-message>{query.data?.serviceMessage}</p>
      <img src="/canary.svg" alt="DDS compatibility canary" width="64" height="64" />
    </main>
  );
}
