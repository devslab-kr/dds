import { expect, it } from "vitest";

import * as kit from "../index";
import * as core from "../../core/index.mjs";

it("exports only components — anything else from a \"use client\" module could not be called on the server", () => {
  // A Next.js Server Component that imports this entry gets a client reference
  // for every export. A component reference renders; a helper reference
  // throws when called (localeHrefs did, in the first Next.js build).
  for (const [name, value] of Object.entries(kit)) {
    expect(typeof value, name).toBe("function");
    expect(name, name).toMatch(/^[A-Z]/);
  }
  expect(typeof core.localeHrefs).toBe("function");
});
