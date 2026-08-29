const localizedHead = {
  en: {
    title: "DDS compatibility canary",
    description: "Solid and TanStack compatibility verification",
  },
  ko: {
    title: "DDS 호환성 카나리",
    description: "Solid 및 TanStack 호환성 검증",
  },
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function serializeHydrationState(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

export function createCspNonce(value = crypto.randomUUID()) {
  return String(value).replaceAll("-", "");
}

export function contentSecurityPolicy(nonce) {
  return `default-src 'self'; script-src 'self' 'nonce-${nonce}'; object-src 'none'; base-uri 'none'`;
}

export function renderCanaryDocument({ locale = "en", requestId, serviceMessage, nonce }) {
  const head = localizedHead[locale] ?? localizedHead.en;
  const state = { requestId, serviceMessage };
  const nonceAttribute = nonce ? ` nonce="${escapeHtml(nonce)}"` : "";

  return `<!doctype html><html lang="${escapeHtml(locale)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${head.title}</title><meta name="description" content="${head.description}"><link rel="icon" href="/canary.svg"></head><body><main id="canary-root" data-hydration-key="canary-root"><h1>${head.title}</h1><p data-service-message>${escapeHtml(serviceMessage)}</p></main><script id="canary-state" type="application/json"${nonceAttribute}>${serializeHydrationState(state)}</script></body></html>`;
}

export function createCanaryServerFunction(context) {
  return async (message) => {
    const response = await context.services.CANARY_SERVICE.fetch(
      new Request(`https://canary-service.invalid/?message=${encodeURIComponent(message)}`),
    );
    const payload = await response.json();

    return {
      requestId: context.requestId,
      serviceMessage: payload.message,
    };
  };
}

export async function routeRequest(request, context) {
  const url = new URL(request.url);

  if (url.pathname === "/") {
    const result = await createCanaryServerFunction(context)("binding-ok");
    const nonce = context.nonce ?? createCspNonce();
    return new Response(renderCanaryDocument({ locale: "ko", nonce, ...result }), {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "content-security-policy": contentSecurityPolicy(nonce),
      },
    });
  }

  return new Response("<!doctype html><title>Not found</title><h1>DDS canary route not found</h1>", {
    status: 404,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

const rejectedDiagnostics = [
  /warning:[^\n]*hydration|hydration[^\n]*(?:warn|mismatch|fail|unclaimed)/i,
  /(?:peer dependenc|peer override|overrid.*peer)/i,
  /no route matches|unhandled route/i,
  /(?:api[_-]?token|secret|password|private[_-]?key)\s*[:=]\s*\S+/i,
];

export function assertCleanDiagnostics(output) {
  assertNoLikelySecrets(output, "diagnostics");
  const matched = rejectedDiagnostics.find((pattern) => pattern.test(output));
  if (matched) {
    throw new Error(`Canary verification rejected diagnostic matching ${matched}`);
  }
}

const likelySecrets = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /["']?(?:CLOUDFLARE_API_TOKEN|API[_-]?TOKEN|CLIENT[_-]?SECRET|PASSWORD|PRIVATE[_-]?KEY)["']?\s*[:=]\s*["']?[A-Za-z0-9_+\/.=-]{12,}/i,
];

export function assertNoLikelySecrets(content, label = "content", sentinels = []) {
  const matched = likelySecrets.find((pattern) => pattern.test(content));
  const leakedSentinel = sentinels.find((sentinel) => content.includes(sentinel));
  if (matched || leakedSentinel) {
    throw new Error(`Canary verification rejected likely secret in ${label}`);
  }
}
