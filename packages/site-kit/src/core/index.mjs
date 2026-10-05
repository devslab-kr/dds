// The root barrel re-exports each module whole, statement for statement the
// same as index.d.mts. It used to name every export by hand, and the consent
// list fell behind its own declarations: CONSENT_RECORD_MAX_BYTES and nine
// other names type-checked from "@devslab/site-kit" and were undefined at
// runtime. A module that should stay off the root (flags, devslab) is simply
// not listed here; scripts/verify-site-kit-release.mjs checks the packed
// tarball's declared exports against what each entry point really exports.
export * from "./locales.mjs";
export * from "./catalog.mjs";
export * from "./seo.mjs";
export * from "./geo.mjs";
export * from "./publisher.mjs";
export * from "./gtm.mjs";
export * from "./fonts.mjs";
export * from "./consent.mjs";
