/** `GTM-` followed by uppercase letters and digits. Anything else is refused before it reaches a script string. */
export declare const GTM_CONTAINER_ID_PATTERN: RegExp;
/**
 * Body of Google's nonce-aware Tag Manager head loader for `containerId`, without the `<script>` tag or a nonce —
 * the renderer owns the element and its per-request nonce. Throws RangeError for an id that does not match GTM_CONTAINER_ID_PATTERN.
 */
export declare function gtmHeadScript(containerId: string): string;
/** The `<iframe>` HTML Google puts inside `<noscript>` right after `<body>` opens. Throws RangeError for a malformed id. */
export declare function gtmNoscriptIframe(containerId: string): string;
export type GtmCspDirective = "script-src" | "connect-src" | "img-src" | "frame-src";
/** CSP sources for Tag Manager + GA4 without Ads features (Google's CSP guide). Excludes preview mode, Custom JavaScript variables and Ads hosts. */
export declare const GTM_CSP_SOURCES: Readonly<Record<GtmCspDirective, readonly string[]>>;
