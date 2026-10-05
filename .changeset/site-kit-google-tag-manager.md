---
"@devslab/site-kit": minor
---

Google Tag Manager, written once for the family sites. `gtmHeadScript(id)` is Google's nonce-aware head loader (from "Use Tag Manager with a Content Security Policy", byte for byte, id substituted), `gtmNoscriptIframe(id)` is the noscript iframe, `GTM_CSP_SOURCES` lists the CSP sources Tag Manager and GA4 without Ads features need, and an id that does not match `/^GTM-[A-Z0-9]+$/` throws `RangeError` before it reaches a script string. `toTanStackHead(metadata, { gtm })` adds the loader as a head script, and `gtmHeadEntry(id)` is the same entry for a route that builds its own head. The entry has no nonce: the router stamps `ssr.nonce` on it, so set `ssr.nonce` to the request's nonce on the server and to `""` on the client (see the README). Omitted, nothing changes.

Google Tag Manager를 가족 사이트를 위해 한 번만 쓴다. `gtmHeadScript(id)`는 구글의 nonce 대응 head 로더("Use Tag Manager with a Content Security Policy"의 것을 바이트 그대로, ID만 치환), `gtmNoscriptIframe(id)`는 noscript iframe, `GTM_CSP_SOURCES`는 Tag Manager와 Ads 기능 없는 GA4에 필요한 CSP 출처이고, `/^GTM-[A-Z0-9]+$/`에 맞지 않는 ID는 스크립트 문자열에 닿기 전에 `RangeError`를 던진다. `toTanStackHead(metadata, { gtm })`가 로더를 head 스크립트로 더하고, `gtmHeadEntry(id)`는 head를 직접 만드는 라우트를 위한 같은 항목이다. 항목에는 nonce가 없다. 라우터가 `ssr.nonce`를 찍으므로 서버에서는 요청의 nonce, 클라이언트에서는 `""`로 정한다(README 참고). 옵션을 생략하면 아무것도 바뀌지 않는다.
