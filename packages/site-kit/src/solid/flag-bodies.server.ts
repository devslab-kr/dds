/**
 * How the Solid menu reaches the flag artwork — server build.
 *
 * The server writes the sprite into the HTML in one pass, so it needs the
 * bodies synchronously and may carry them: a Worker bundle is not a page
 * weight. Same signatures as flag-bodies.ts; the server Vite and Vitest
 * configs alias `./flag-bodies` here.
 */
import { FLAGS_BY_COUNTRY } from "../core/flag-bodies.mjs";
import type { FlagBodies } from "./flag-bodies";

export const flagBodiesNow = (): FlagBodies => FLAGS_BY_COUNTRY;

export const loadFlagBodies = async (): Promise<FlagBodies> => FLAGS_BY_COUNTRY;
