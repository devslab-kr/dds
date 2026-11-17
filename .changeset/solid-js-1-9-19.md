---
"@devslab/dds-solid": patch
"@devslab/site-kit": patch
"@devslab/dds-table": patch
"@devslab/dds-table-solid": patch
---

Raise the `solid-js` pin (dependency and peer) from 1.9.15 to 1.9.19. Solid 1.9.19 depends on `seroval ~1.6.11` / `seroval-plugins ~1.6.8`, so consumers no longer need a pnpm override to escape the vulnerable seroval 1.6.4 that 1.9.15 pulled in.
