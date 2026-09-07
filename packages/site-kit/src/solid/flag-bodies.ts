/**
 * How the Solid menu reaches the flag artwork — browser build.
 *
 * The fourteen vendored SVGs are ~115 KB. A page rendered on the server
 * already carries them in its HTML, and hydration adopts that markup, so the
 * browser bundle must not import them statically: it used to, and every
 * product's main client chunk grew by the whole set just to render a header.
 *
 * `flagBodiesNow` answers synchronously only in the build that has the bodies
 * at hand (flag-bodies.server.ts, aliased in by vite.server.config.ts and
 * vitest.ssr.config.ts). Here it answers undefined, and `loadFlagBodies` is a
 * dynamic import Vite emits as its own chunk — fetched only when a flag menu
 * renders without server HTML.
 */
import type { LocaleFlag } from "../core/flag-bodies.mjs";

export type FlagBodies = Readonly<Record<string, LocaleFlag>>;

export const flagBodiesNow = (): FlagBodies | undefined => undefined;

export const loadFlagBodies = (): Promise<FlagBodies> =>
  import("../core/flag-bodies.mjs").then((module) => module.FLAGS_BY_COUNTRY);
