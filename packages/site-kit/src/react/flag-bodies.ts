/**
 * How the React menu reaches the flag artwork — browser build.
 *
 * Same split as the Solid side (D-020): the fourteen vendored SVGs are
 * ~115 KB, a server render already carries them in its HTML, and hydration
 * adopts that markup, so the browser bundle must not import them statically.
 * `flagBodiesNow` answers undefined here and `loadFlagBodies` is a dynamic
 * import, fetched only when a flag menu renders without server HTML.
 *
 * The published React entry imports this module by its package name,
 * `@devslab/site-kit/react/flag-bodies`, not by a relative path. That is what
 * lets each bundler layer pick its own file through the export conditions: a
 * Next.js app's server layers resolve flag-bodies.server, its browser layer
 * this file, while the component module itself — the one a "use client"
 * reference points at — is the same file in every layer.
 */
import type { LocaleFlag } from "@devslab/site-kit/flags";

export type FlagBodies = Readonly<Record<string, LocaleFlag>>;

export const flagBodiesNow = (): FlagBodies | undefined => undefined;

export const loadFlagBodies = (): Promise<FlagBodies> =>
  import("../core/flag-bodies.mjs").then((module) => module.FLAGS_BY_COUNTRY);
