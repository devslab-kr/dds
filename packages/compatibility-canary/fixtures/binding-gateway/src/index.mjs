import { routeRequest } from "../../../src/canary-contracts.mjs";

export default {
  async fetch(request, env) {
    const response = await routeRequest(request, {
      requestId: request.headers.get("x-request-id") ?? "binding-gateway-request",
      services: { CANARY_SERVICE: env.CANARY_SERVICE },
    });
    if (!response.headers.has("content-security-policy")) {
      throw new Error("Canary response is missing its content-security-policy");
    }
    return response;
  },
};
