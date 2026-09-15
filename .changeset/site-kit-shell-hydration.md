---
"@devslab/site-kit": patch
---

`MarketingShell` reads its `header` and `footer` once. `header={{ … }}` compiles to a getter, and spreading `props.header` straight into `SiteHeader` re-evaluated that literal on every prop read — any JSX built eagerly inside it was built again each time and consumed hydration keys, a different number of times on the server than on the client. From the first drift the client rebuilt the whole header from templates, and the flag sprite (0.11.0) came back empty: the first consumer to ship the sprite showed a blank flag box in every browser while its server HTML carried all the symbols. A memo evaluates the literal exactly once per side, at the same point in the tree. And a sprite that reaches the client empty now loads its bodies whatever the reason — it looks at the element, not at whether hydration is running.

`MarketingShell`이 `header`·`footer`를 한 번만 읽는다. `header={{ … }}`는 게터로 컴파일되는데 `props.header`를 `SiteHeader`에 그대로 펼치면 prop을 읽을 때마다 그 리터럴이 다시 평가됐다 — 안에서 즉시 만들어진 JSX가 매번 다시 만들어지며 하이드레이션 키를 소모했고, 서버와 클라이언트의 횟수가 달랐다. 첫 어긋남부터 클라이언트가 헤더 전체를 템플릿에서 다시 만들었고 국기 스프라이트(0.11.0)는 빈 채로 돌아왔다: 스프라이트를 처음 출하한 소비자의 서버 HTML엔 심볼이 다 있었는데 모든 브라우저에서 국기 칸이 비어 있었다. 메모는 리터럴을 양쪽에서 정확히 한 번, 트리의 같은 지점에서 평가한다. 그리고 클라이언트에 빈 채로 도착한 스프라이트는 이유가 무엇이든 본문을 로드한다 — 하이드레이션 여부가 아니라 엘리먼트를 본다.
