/** The default provider set, retained for existing adapter allowlists and UI. */
export const SOCIAL_PROVIDERS = ["google", "kakao", "naver"] as const;
export type SocialProvider = (typeof SOCIAL_PROVIDERS)[number];
/** Public IDs a consumer can opt into. Map provider-specific wire IDs inside the adapter. */
export const SOCIAL_PROVIDER_CATALOG = [
  ...SOCIAL_PROVIDERS,
  "line",
  "microsoft",
  "linkedin",
  "apple",
  "facebook",
  "github",
  "gitlab",
  "discord",
  "figma",
  "notion",
  "x",
  "slack",
  "zoom",
  "wechat",
] as const;
export type CatalogSocialProvider = (typeof SOCIAL_PROVIDER_CATALOG)[number];
export type SocialAuthIntent = "sign-in" | "link";
export type SocialAuthErrorCode =
  | "cancelled"
  | "unavailable"
  | "not-configured"
  | "invalid-request"
  | "invalid-response"
  | "flow-expired"
  | "forbidden"
  | "failed";

export type ProviderAvailability<Provider extends CatalogSocialProvider = SocialProvider> =
  | { id: Provider; status: "available" }
  | { id: Provider; status: "unconfigured" | "disabled"; reason: string };

export interface SocialAuthStartInput<Provider extends CatalogSocialProvider = SocialProvider> {
  provider: Provider;
  /** A service-local path. The server must also apply its own path/parameter allowlist. */
  returnTo: string;
  intent: SocialAuthIntent;
  /** Caller-owned idempotency key, when the service requires one (especially linking). */
  requestId?: string;
}

export interface SocialAuthFailure {
  status: "error";
  code: SocialAuthErrorCode;
  /** Information for the host; DDS never retries authentication automatically. */
  retryable: boolean;
}
export type SocialAuthStartResult =
  { status: "redirect"; url: string } | SocialAuthFailure;

/** Browser contract. Bind invitation, consent, UUID and native-return context in the app adapter. */
export interface SocialAuthClient<Provider extends CatalogSocialProvider = SocialProvider> {
  start(
    input: SocialAuthStartInput<Provider>,
    options: { signal: AbortSignal },
  ): Promise<SocialAuthStartResult>;
}

/** Server-only response envelopes preserve app-owned Set-Cookie, cache, redirect and status headers. */
export interface SocialAuthServerStartResult {
  result: SocialAuthStartResult;
  response: Response;
}
export type SocialAuthCallbackResult<Session> =
  | { status: "authenticated"; session: Session; response: Response }
  | { status: "redirect"; response: Response }
  | { status: "error"; error: SocialAuthFailure; response: Response };

/**
 * An adapter is request-scoped. It owns CSRF/origin, PKCE/state, one-time flow,
 * callback/return allowlists, identity/link authorization and session storage.
 * Never serialize this interface or its Session into LoginPanel/client props.
 */
export interface SocialAuthAdapter<Context, Session, Provider extends CatalogSocialProvider = SocialProvider> {
  providers(context: Context): Promise<readonly ProviderAvailability<Provider>[]>;
  start(
    input: SocialAuthStartInput<Provider>,
    context: Context,
  ): Promise<SocialAuthServerStartResult>;
  callback(
    request: Request,
    context: Context,
  ): Promise<SocialAuthCallbackResult<Session>>;
  session(context: Context): Promise<Session | null>;
  signOut(context: Context): Promise<Response>;
}

export function isSocialProvider(value: unknown): value is SocialProvider {
  return (
    typeof value === "string" &&
    SOCIAL_PROVIDERS.includes(value as SocialProvider)
  );
}

export function isCatalogSocialProvider(value: unknown): value is CatalogSocialProvider {
  return typeof value === "string" && SOCIAL_PROVIDER_CATALOG.includes(value as CatalogSocialProvider);
}

/** Missing, malformed and duplicate entries fail closed; availability is never inferred. */
export function normalizeProviders(value: unknown): readonly ProviderAvailability[];
export function normalizeProviders<Provider extends CatalogSocialProvider>(
  value: unknown,
  providerOrder: readonly Provider[],
): readonly ProviderAvailability<Provider>[];
export function normalizeProviders(
  value: unknown,
  providerOrder: readonly CatalogSocialProvider[] = SOCIAL_PROVIDERS,
): readonly ProviderAvailability<CatalogSocialProvider>[] {
  const entries = Array.isArray(value) ? value : [];
  return [...new Set(providerOrder)].filter(isCatalogSocialProvider).map((id) => {
    const matches = entries.filter(
      (entry) => entry && typeof entry === "object" && entry.id === id,
    );
    const entry = matches.length === 1 ? matches[0] : undefined;
    if (entry?.status === "available") return { id, status: "available" };
    if (
      (entry?.status === "disabled" || entry?.status === "unconfigured") &&
      typeof entry.reason === "string" &&
      entry.reason.trim()
    ) {
      return { id, status: entry.status, reason: entry.reason };
    }
    return { id, status: "unconfigured", reason: "not-configured" };
  });
}

const unsafeCharacters = /[\\\u0000-\u0020\u007f]/u;

/** Baseline open-redirect protection, not a replacement for an app's business-route allowlist. */
export function isSafeReturnTo(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    value.length > 4096 ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    unsafeCharacters.test(value) ||
    /%(?![\da-f]{2})/i.test(value)
  )
    return false;
  try {
    if (new URL(value, "https://dds.invalid").origin !== "https://dds.invalid")
      return false;
  } catch {
    return false;
  }
  let decoded = value;
  for (let depth = 0; depth < 4; depth++) {
    // Spaces/percent literals in encoded query values are ordinary application data.
    // Controls/backslashes remain forbidden, and decoded path authority is checked separately.
    if (/[\\\u0000-\u001f\u007f]/u.test(decoded)) return false;
    const path = decoded.split(/[?#]/, 1)[0]!;
    if (!path.startsWith("/") || path.startsWith("//")) return false;
    if (!/%[\da-f]{2}/i.test(decoded)) return true;
    try {
      decoded = decoded.replace(/(?:%[\da-f]{2})+/gi, (encoded) =>
        decodeURIComponent(encoded),
      );
    } catch {
      return false;
    }
  }
  return false;
}

/** Absolute HTTP(S) destinations require an explicit trusted origin; credentials are forbidden. */
export function isSafeAuthRedirect(
  value: unknown,
  allowedOrigins: readonly string[],
): value is string {
  if (
    typeof value !== "string" ||
    value.length > 8192 ||
    unsafeCharacters.test(value)
  )
    return false;
  try {
    const url = new URL(value);
    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      return false;
    const trusted = allowedOrigins.map((origin) => new URL(origin));
    if (
      trusted.some(
        (allowed) =>
          !["https:", "http:"].includes(allowed.protocol) ||
          allowed.href !== `${allowed.origin}/` ||
          allowed.username ||
          allowed.password,
      )
    )
      return false;
    return trusted.some((allowed) => allowed.origin === url.origin);
  } catch {
    return false;
  }
}

const errorCodes: readonly SocialAuthErrorCode[] = [
  "cancelled",
  "unavailable",
  "not-configured",
  "invalid-request",
  "invalid-response",
  "flow-expired",
  "forbidden",
  "failed",
];
export function authFailure(
  code: SocialAuthErrorCode = "failed",
  retryable = true,
): SocialAuthFailure {
  return { status: "error", code, retryable };
}

/** Discards all untrusted payload fields, including provider descriptions and tokens. */
export function readSocialAuthStartResult(
  value: unknown,
): SocialAuthStartResult {
  if (!value || typeof value !== "object")
    return authFailure("invalid-response");
  const result = value as Record<string, unknown>;
  if (result.status === "redirect" && typeof result.url === "string")
    return { status: "redirect", url: result.url };
  if (
    result.status === "error" &&
    errorCodes.includes(result.code as SocialAuthErrorCode) &&
    typeof result.retryable === "boolean"
  ) {
    return authFailure(result.code as SocialAuthErrorCode, result.retryable);
  }
  return authFailure("invalid-response");
}

/** One POST per explicit action. No persistence, automatic retry, session management or global fetch. */
interface SocialAuthClientConfig {
  endpoint: string;
  fetch: typeof fetch;
  timeoutMs?: number;
}

export function createSocialAuthClient(config: SocialAuthClientConfig): SocialAuthClient;
export function createSocialAuthClient<Provider extends CatalogSocialProvider>(
  config: SocialAuthClientConfig & { providerOrder: readonly Provider[] },
): SocialAuthClient<Provider>;
export function createSocialAuthClient(
  config: SocialAuthClientConfig & { providerOrder?: readonly CatalogSocialProvider[] },
): SocialAuthClient<CatalogSocialProvider> {
  if (!isSafeReturnTo(config.endpoint))
    throw new TypeError("Auth endpoint must be a service-local path");
  const allowed = new Set((config.providerOrder ?? SOCIAL_PROVIDERS).filter(isCatalogSocialProvider));
  return {
    async start(input, { signal }) {
      if (
        !allowed.has(input.provider) ||
        !isSafeReturnTo(input.returnTo) ||
        !["sign-in", "link"].includes(input.intent)
      )
        return authFailure("invalid-request", false);
      const controller = new AbortController();
      const abort = () => controller.abort();
      if (signal.aborted) controller.abort();
      signal.addEventListener("abort", abort, { once: true });
      const timeout = setTimeout(abort, authTimeout(config.timeoutMs));
      try {
        const response = await config.fetch(config.endpoint, {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          redirect: "error",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(input),
          signal: controller.signal,
        });
        const result = readSocialAuthStartResult(
          await response.json().catch(() => null),
        );
        return !response.ok && result.status === "redirect"
          ? authFailure("invalid-response")
          : result;
      } catch (error) {
        if (controller.signal.aborted && !signal.aborted)
          return authFailure("unavailable");
        throw error;
      } finally {
        clearTimeout(timeout);
        signal.removeEventListener("abort", abort);
      }
    },
  };
}

/** Bounded for UI/network recovery, never a reason to start a second auth attempt automatically. */
export function authTimeout(value?: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(120_000, Math.max(250, value))
    : 15_000;
}
