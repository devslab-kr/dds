---
"@devslab/site-kit": patch
---

Move flag locale menu data (`FLAG_COUNTRY`, `LOCALE_FLAGS`, `flagFor`) off the runtime-neutral `.` entry and onto a dedicated `@devslab/site-kit/flags` subpath, so consumers that never render a flag menu no longer bundle ~110 KB of vendored SVG. `src/solid/locale-menu.tsx` already imported `../core/flags.mjs` directly, so this only changes the public barrel.

Since `0.4.0` has not been published yet, this patch bump lands as `0.4.1` — the fixed release group means the flag locale menu (0.4.0) and this follow-up ship together as `0.4.1`.
