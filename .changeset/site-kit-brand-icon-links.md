---
"@devslab/site-kit": minor
---

`brandIconLinks()` and `BRAND_ICON_FILES`: one place that says which `@devslab/linq-brand` icon files a page head links, and in what order — SVG first, a 48px PNG so search engines have a declared square of the size they ask for, the 16/32/48 ICO for the bare-URL convention, the 180px apple-touch icon. `toTanStackHead(metadata, { icons })` appends them (`true` for the `/brand` default, or `{ basePath }`); omitted, nothing changes. Before this, the four family sites each linked a different subset, and one linked none — its search result kept showing the icon from before the mark changed.

`brandIconLinks()`와 `BRAND_ICON_FILES`: 페이지 head가 `@devslab/linq-brand`의 어떤 아이콘 파일을 어떤 순서로 링크하는지 정하는 한 자리 — SVG 먼저, 검색엔진이 요구하는 크기의 선언된 정사각형으로 48px PNG, 주소만으로 요청되는 관례용 16/32/48 ICO, 180px 애플 터치 아이콘. `toTanStackHead(metadata, { icons })`가 이를 덧붙인다(`true`면 `/brand` 기본값, 또는 `{ basePath }`). 생략하면 아무것도 바뀌지 않는다. 이전에는 가족 사이트 넷이 각자 다른 부분집합을 링크했고, 하나는 아무것도 링크하지 않아 마크가 바뀐 뒤에도 검색 결과가 옛 아이콘을 계속 보여줬다.
