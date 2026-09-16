---
"@devslab/site-kit": patch
---

`StatusBanner` reads its `children` once. `<StatusBanner><ul>…</ul></StatusBanner>` compiles to a getter, and the banner checked it for truthiness and then inserted it — two reads, so the first built a list (and every `<li>` under it) that was thrown away, each with a hydration key the server never wrote into the HTML. Solid's production build clones a template when a key is missing, so nothing showed; the development build throws `Hydration Mismatch`, so a consumer's status page fell to its error boundary in `vite dev` (BookLinq, 0.12.1). A memo is now both the check and the insert, evaluated at the same point in the tree on both sides. A hydration test renders two banners with inline children and hydrates them with the development build.

`StatusBanner`가 `children`을 한 번만 읽는다. `<StatusBanner><ul>…</ul></StatusBanner>`는 게터로 컴파일되는데, 배너가 진위 검사 뒤 삽입으로 두 번 읽어서 첫 읽기가 만든 목록(과 그 아래 `<li>` 전부)이 버려지면서 서버 HTML엔 없는 하이드레이션 키를 각각 소모했다. Solid 프로덕션 빌드는 없는 키에 템플릿을 복제해 아무것도 안 보였지만, 개발 빌드는 `Hydration Mismatch`를 던져 소비자의 상태 페이지가 `vite dev`에서 에러 경계로 떨어졌다(BookLinq, 0.12.1). 이제 메모 하나가 검사와 삽입을 겸하고 양쪽에서 트리의 같은 지점에 한 번 평가된다. 하이드레이션 테스트가 배너 둘을 인라인 children으로 렌더해 개발 빌드로 하이드레이션한다.
