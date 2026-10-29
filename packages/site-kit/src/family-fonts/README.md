# DDS family-font source contract

This directory owns the framework-free runtime and static exporter for the generated private package @devslab/family-fonts. Font binaries, licenses and atomic font CSS come from site-kit/fonts and its existing generator; sans and mono fallback roles come from tokens/foundation.json. Do not introduce service-specific faces or stacks here.

The generated package is a derivative with no runtime/peer dependencies or npm lifecycle. Consumers pin its archive SHA256/SRI and source provenance, retaining their separate component dependencies. A local candidate is not a published registry release.

## Browser and SSR

Import @devslab/family-fonts/fonts.css. Vite application modules use @devslab/family-fonts/vite (also /vite-entry) and getFontPreloadLinks({monospace,format:'html'|'react'}). The entry statically imports canonical assets with ?url so CSS and preloads share emitted URLs. React uses crossOrigin; HTML uses crossorigin. The central manifest selects Latin and full Korean, with optional mono.

## Node build adapters

Root exports include getBundleFontPreloadLinks(bundle,options), getBundleFontAssetHeaders(bundle), fontAssetHeaders(paths), getFontHeadLinks(baseURL,options), getFontAssetHeaders(baseURL), withFamilyFontCache(request,response), isFamilyFontAssetRequest(request,{baseURL}) and fontManifest. Node config must use these pure root helpers rather than importing the ?url entry.

Preload resolution rejects zero or multiple matching emitted assets. Bundle cache selection returns an empty array for a server bundle with no font assets. Headers are descriptors {path,headers}; the host adapter only serializes its required format.

Worker response caching applies only to /assets/<single known content-hashed WOFF2 filename>, GET/HEAD, status200/304 and font/woff2. Authorization, Range, Set-Cookie, private/no-store, missing MIME (including304), errors and non-fonts return the original response. Nested paths and upload/API routes do not become immutable.

Static descriptors and isFamilyFontAssetRequest use explicit base paths and exact manifest-generated font paths. The request-only helper does not inspect MIME, response cookies or status; use it only for generated public static files. Reserved /uploads, /api and /_serverFn prefixes are excluded. It does not replace response validation in Workers.

## Static export

Run node export.mjs --out-dir DIR --base-url /PREFIX --head-output FILE [--monospace] from the extracted generated package. The output contains generated CSS, manifest, content-hash fonts, licenses, HTML head links and cache descriptors. Applications provide URL/include/deployment adapters only. Actual provider cache behavior must be reported separately from the recommended descriptors; no hosting permissions or infrastructure are changed by the artifact.

ContractNoto/PDF fonts are document resources and remain outside this UI font artifact.
