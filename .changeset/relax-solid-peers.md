---
"@devslab/dds-solid": patch
"@devslab/dds-table": patch
"@devslab/dds-table-solid": patch
"@devslab/site-kit": patch
---

Accept any compatible `solid-js` 1.x release (`^1.9.19`) instead of exactly 1.9.19, and let site-kit's optional TanStack Solid router and start peers float within their major (`^1.170.30`, `^1.168.47`). Products can now take Solid and TanStack security patches without waiting for a DDS release. DDS still builds and tests against the floor versions.
