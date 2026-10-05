---
"@devslab/site-kit": patch
---

Consent review fixes (D-034, follow-up to #77). `createConsentManager` now throws `RangeError` when `gtm` is given without `measurementIds`: `ga-disable-<id>` is the only switch that stops a GA4 tag Tag Manager already initialised, whose own listeners would otherwise keep sending cookieless pings after a withdrawal until the page reloads. New `CONSENT_RESPONSE_HEADERS` (`Cache-Control: private, no-store`, `Vary: Cookie`), exported from the core and the TanStack adapter, for every response whose head was decided from the consent cookie, so a shared cache never serves one visitor's granted head to another.

동의 리뷰 수정(D-034, #77 후속). `gtm`을 주고 `measurementIds`가 없으면 `createConsentManager`가 `RangeError`를 던진다 — 이미 초기화된 GA4 태그를 멈추는 유일한 스위치가 `ga-disable-<id>`라, 없으면 철회 뒤에도 새로고침 전까지 쿠키 없는 핑이 나간다. 새 `CONSENT_RESPONSE_HEADERS`(`Cache-Control: private, no-store`, `Vary: Cookie`)를 코어와 TanStack 어댑터에서 내보낸다. 동의 쿠키로 head를 정한 응답에 보내서 공유 캐시가 한 방문자의 허용 head를 다른 방문자에게 주지 않게 한다.
