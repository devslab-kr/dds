---
"@devslab/site-kit": minor
---

The flag artwork leaves the browser bundle. `@devslab/site-kit/solid` was one 138 KB file, and a consumer that imported only `SiteHeader` shipped nearly all of it — not because tree-shaking failed (importing every export adds just 13 KB) but because the menu imported the fourteen vendored flag SVGs statically (~115 KB; Spain's coat of arms alone is 85 KB) and re-wrote them into the DOM on the client, hydration included. `LocaleMenu` decides `select` vs `flag` at runtime, so every header reached them.

Now each flag menu renders one `<symbol>` sprite and every flag is an `<svg><use href="#…">` of it, so a locale change on the client only swaps an `href`. The server build writes the sprite; hydration adopts it; the browser build reaches the bodies only through a dynamic `import()` — emitted as its own chunk, `dist/flag-bodies.js` — taken when a flag menu renders with no server HTML (a client-only app, a jsdom test). The generated data splits into `flag-countries.mjs` (the map the menu needs) and `flag-bodies.mjs`; `@devslab/site-kit/flags` keeps its API and gains `flagCountryFor` and `FLAG_VIEWBOX`. `pnpm check` now builds a minimal consumer (`fixtures/bundle-probe`) with Vite + vite-plugin-solid and fails if a flag body ever returns to the main chunk. No consumer code changes.

Measured, gzip in parentheses. `dist/solid.js`: 138.2 KB (32.5) → 28.7 KB (8.2). Minimal consumer importing `SiteHeader` only: 147.5 KB (38.8) → 42.8 KB (15.1). TraceLinq landing (`packages/landing`, TanStack Start, main client chunk): 291.0 KB (86.5) → 186.3 KB (62.1); the 105 KB (23.7) flag chunk is emitted beside it and is not requested by a hydrated page. Server-rendered HTML still carries the bodies, once per country per menu instead of the current locale twice.

국기 아트워크가 브라우저 번들에서 빠집니다. `@devslab/site-kit/solid`는 138 KB 파일 하나였고 `SiteHeader`만 import한 소비자도 거의 통째로 실었습니다 — tree-shaking 실패가 아니라(전부 import해도 13 KB 차이) 메뉴가 벤더링한 국기 SVG 14개(~115 KB, 스페인 문장 하나가 85 KB)를 정적으로 import하고 클라이언트에서, 하이드레이션 중에도, DOM에 다시 쓰고 있었기 때문입니다. `LocaleMenu`가 `select`/`flag`를 런타임에 고르므로 모든 헤더가 거기에 닿았습니다.

이제 국기 메뉴마다 `<symbol>` 스프라이트 하나를 렌더링하고 모든 국기는 그것을 `<svg><use href="#…">`로 참조하므로, 클라이언트에서 로케일이 바뀌어도 `href`만 바뀝니다. 스프라이트는 서버 빌드가 쓰고, 하이드레이션은 그대로 인수하며, 브라우저 빌드는 본문을 동적 `import()`(자기 청크 `dist/flag-bodies.js`)로만 닿습니다 — 서버 HTML 없이 국기 메뉴가 렌더링될 때(클라이언트 전용 앱, jsdom 테스트)에만. 생성 데이터는 `flag-countries.mjs`(메뉴가 필요한 지도)와 `flag-bodies.mjs`로 나뉘고 `@devslab/site-kit/flags`는 API를 유지한 채 `flagCountryFor`·`FLAG_VIEWBOX`를 얻습니다. `pnpm check`가 최소 소비자(`fixtures/bundle-probe`)를 Vite + vite-plugin-solid로 빌드해 국기 본문이 메인 청크로 되돌아오면 실패합니다. 소비자 코드 변경은 없습니다.

측정(괄호는 gzip). `dist/solid.js`: 138.2 KB (32.5) → 28.7 KB (8.2). `SiteHeader`만 import한 최소 소비자: 147.5 KB (38.8) → 42.8 KB (15.1). TraceLinq 랜딩(`packages/landing`, TanStack Start, 클라이언트 메인 청크): 291.0 KB (86.5) → 186.3 KB (62.1); 105 KB (23.7) 국기 청크는 옆에 생성되지만 하이드레이션된 페이지는 요청하지 않습니다. 서버 렌더 HTML에는 본문이 여전히 실립니다 — 현재 로케일 두 번 대신 메뉴당 나라마다 한 번.
