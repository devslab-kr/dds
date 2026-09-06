---
"@devslab/site-kit": minor
---

`SiteFooter`'s language row collapses into a `<details>` menu triggered by the current language's own name. Every locale anchor stays in the document open or closed, so crawlers still follow them and it works without JavaScript; Escape closes it and returns focus to the trigger, as the header's flag menu does. The flat row was a different length in every product — ten locales in one, twenty in another — so the same footer carried a different visual weight depending on how many languages the product sells in.

`SiteFooter`의 언어 행이 `<details>` 메뉴로 접힙니다. 트리거는 **현재 언어의 자기 이름**입니다(페이지를 못 읽는 사람도 알아보는 유일한 라벨). 열려 있든 접혀 있든 로케일 앵커는 전부 문서에 남아 크롤러가 따라가고 JS 없이 동작하며, Esc로 닫고 포커스가 트리거로 돌아옵니다(헤더 국기 메뉴와 동일). 평평한 행은 제품마다 길이가 달라(10개·14개·20개) 같은 푸터가 파는 언어 수에 따라 다른 무게를 지고 있었습니다.
