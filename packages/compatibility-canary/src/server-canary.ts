import { createServerFn } from "@tanstack/solid-start";
import { getRequest } from "@tanstack/solid-start/server";

export interface ServiceBinding {
  fetch(request: Request): Promise<Response>;
}

const localServiceBinding: ServiceBinding = {
  async fetch(request) {
    const message = new URL(request.url).searchParams.get("message") ?? "binding-missing";
    return Response.json({ message });
  },
};

export const readCanaryContext = createServerFn({ method: "GET" }).handler(async () => {
  const request = getRequest();
  const requestId = request.headers.get("x-request-id") ?? "local-request-context";
  const response = await localServiceBinding.fetch(
    new Request("https://service-binding.invalid/?message=service-binding-ok"),
  );
  const payload = (await response.json()) as { message: string };

  return { requestId, serviceMessage: payload.message };
});
