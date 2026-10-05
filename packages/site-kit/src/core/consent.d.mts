/** Default consent cookie name: `site_consent`. */
export declare const CONSENT_COOKIE_NAME: string;
/** Twelve months, in seconds. */
export declare const CONSENT_MAX_AGE_SECONDS: number;
/** Letters, digits, `.`, `_`, `-`; starts with a letter or digit; at most 32 characters. */
export declare const CONSENT_POLICY_VERSION_PATTERN: RegExp;
/** 32 lowercase hex characters. */
export declare const CONSENT_ANONYMOUS_ID_PATTERN: RegExp;
export type ConsentAction = "grant" | "deny" | "withdraw" | "update";
export declare const CONSENT_ACTIONS: readonly ConsentAction[];
export type ConsentModeSignal = "ad_personalization" | "ad_storage" | "ad_user_data" | "analytics_storage";
/** Consent Mode v2 defaults: all four signals denied. */
export declare const CONSENT_MODE_DEFAULTS: Readonly<Record<ConsentModeSignal, "denied">>;
/** `_ga`, `_ga_<stream>`, `_gid`, `_gat`, `_gat_<…>`. */
export declare const GA_COOKIE_PATTERN: RegExp;
export declare const CONSENT_RECORD_MAX_BYTES: number;

/** What the consent cookie holds: policy version, analytics (1 granted / 0 not), unix seconds, anonymous id. */
export interface ConsentState { readonly v: string; readonly a: 0 | 1; readonly t: number; readonly id: string }

/** Strict parse of a cookie value; `null` for anything malformed. */
export declare function parseConsentCookie(value: string | null | undefined): ConsentState | null;
/** The cookie value for a state. Throws RangeError for a malformed state. */
export declare function formatConsentCookie(state: ConsentState): string;
export interface ConsentCookieOptions { name?: string; domain?: string; maxAgeSeconds?: number }
/** `name=value; Path=/; Max-Age=…; SameSite=Lax; Secure` (+ `Domain` if given), for `document.cookie` or `Set-Cookie`. */
export declare function serializeConsentCookie(state: ConsentState, options?: ConsentCookieOptions): string;

export interface ConsentReadOptions {
  policyVersion: string;
  cookieName?: string;
  /** Milliseconds since the epoch; defaults to Date.now(). */
  now?: number;
  maxAgeSeconds?: number;
}
/** The decision for the current policy version in a Cookie header or `document.cookie`; `null` (ask) when absent, malformed, expired or for another version. */
export declare function readConsentCookie(cookieHeader: string | null | undefined, options: ConsentReadOptions): ConsentState | null;
/** True when the Cookie header holds a current, unexpired analytics grant. */
export declare function consentCookieGrantsAnalytics(cookieHeader: string | null | undefined, options: ConsentReadOptions): boolean;
/** True when `state` grants analytics for `policyVersion` and is unexpired. */
export declare function analyticsConsented(state: ConsentState | null | undefined, policyVersion: string, options?: { now?: number; maxAgeSeconds?: number }): boolean;

/**
 * Body of the head `<script>` (no tag, no nonce). Not granted: Consent Mode defaults only — no Google host in the string.
 * Granted with `gtm`: defaults, an `analytics_storage` grant, then Google's Tag Manager loader unless gtm.js is already on the page.
 */
export declare function consentHeadScript(options?: { granted?: boolean; gtm?: string | undefined }): string;

/** Path before any query or fragment, starting with "/", at most 512 characters; anything else becomes "/". */
export declare function normalizeConsentPath(path: string | null | undefined): string;

/** The record a browser sends after each decision. The server adds subject, IP, user agent and its own receive time. */
export interface ConsentRecord {
  readonly policyVersion: string;
  readonly analytics: boolean;
  readonly action: ConsentAction;
  readonly anonymousId: string;
  /** Unix seconds — the `t` written into the cookie. */
  readonly decidedAt: number;
  readonly source: "web";
  readonly path: string;
}
export interface ConsentRecordParseOptions {
  /** The current version, or a list while records made under an older one may still arrive. */
  policyVersion: string | readonly string[];
  now?: number;
  /** How old a `decidedAt` may be (seconds). Default 31 days — queued records are resent on the next visit. */
  maxAgeSeconds?: number;
}
/** Strict server-side validation of a POSTed record (JSON text or object); `null` when anything is off. */
export declare function parseConsentRecord(input: unknown, options: ConsentRecordParseOptions): ConsentRecord | null;
type HeaderSource = { headers: { get(name: string): string | null } } | { get(name: string): string | null } | Record<string, string | string[] | undefined>;
/** `Origin` equals `expectedOrigin`, or — without `Origin` — `Sec-Fetch-Site: same-origin`. */
export declare function isSameOriginRequest(request: HeaderSource, expectedOrigin: string): boolean;

export interface ConsentRecordError extends Error { retryable: boolean }
/** An `onChange` that POSTs the record as JSON to a same-origin path. Rejects with `retryable` set (network, 429, 5xx → true). */
export declare function postConsentRecord(endpoint: string, options?: { fetch?: typeof fetch }): (record: ConsentRecord) => Promise<void>;

export type ConsentEvent =
  | { type: "change"; state: ConsentState; record: ConsentRecord }
  | { type: "open-settings" }
  | { type: "dismiss" };

export interface ConsentManagerOptions {
  policyVersion: string;
  /** Tag Manager container to load once analytics is granted. Omit to manage consent without Tag Manager. */
  gtm?: string;
  cookieName?: string;
  /** Share the decision across subdomains. Default: host-only. */
  cookieDomain?: string;
  maxAgeSeconds?: number;
  /** GA4 measurement ids to switch off with `ga-disable-<id>` on withdrawal. */
  measurementIds?: readonly string[];
  /** Called after every decision — POST it to your backend (see postConsentRecord). A rejection with `retryable !== false` is kept and resent on the next start(). */
  onChange?: (record: ConsentRecord) => void | Promise<void>;
  /** Redacts the page path before it goes into a record (a path that carries a secret). */
  recordPath?: (pathname: string) => string;
  /** Nonce for the gtm.js element. Default: a `csp-nonce` meta, else the first `[nonce]` element. */
  nonce?: string;
  /** For tests. */
  window?: Window;
  now?: () => number;
}

export interface ConsentManager {
  readonly policyVersion: string;
  /** Applies the stored decision to this page. Idempotent; a no-op outside a browser. */
  start(): void;
  /** The current-version, unexpired decision (from the cookie, or the one made on this page if the browser refused the cookie), or `null`. */
  state(): ConsentState | null;
  analyticsGranted(): boolean;
  needsDecision(): boolean;
  acceptAll(): ConsentRecord;
  rejectAll(): ConsentRecord;
  save(choice: { analytics: boolean }): ConsentRecord;
  withdraw(): ConsentRecord;
  /** Asks the mounted banner to open its settings dialog. */
  openSettings(): void;
  /** Hides the banner for this page view without a decision. */
  dismiss(): void;
  dismissed(): boolean;
  subscribe(listener: (event: ConsentEvent) => void): () => void;
  /** Delegated click handler for `[data-consent-settings]` triggers. Returns a remover. */
  bindTriggers(root?: Document | Element): () => void;
  /** Resolves once records sent so far are delivered or queued. */
  settled(): Promise<void>;
}
export declare function createConsentManager(options: ConsentManagerOptions): ConsentManager;

export interface ConsentMessages {
  regionLabel: string;
  title: string;
  body: string;
  privacyLink: string;
  acceptAll: string;
  rejectAll: string;
  settings: string;
  dismiss: string;
  settingsTitle: string;
  settingsIntro: string;
  necessaryTitle: string;
  necessaryBody: string;
  necessaryStatus: string;
  analyticsTitle: string;
  analyticsBody: string;
  analyticsSwitch: string;
  save: string;
  close: string;
  saved: string;
  trigger: string;
}
export declare const CONSENT_MESSAGES_KO: Readonly<ConsentMessages>;
export declare const CONSENT_MESSAGES_EN: Readonly<ConsentMessages>;
