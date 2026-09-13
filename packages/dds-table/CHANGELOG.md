# @devslab/dds-table

## 0.11.0

### Minor Changes

- 6f4a2bc: A DataTable package, a status-pill factory and a console shell.

  `@devslab/dds-table` ships a `DataTable` component built on TanStack Table (pinned to the exact version `9.2.4`). Sorting is decided by the data shape, not a flag: `sort="client"` for a table holding its whole list, `sort={{ statedOrder }}` for a server-ordered, cursor-paged one — sorting a single page of the latter would misreport the whole. Paging is a plain link (`page.nextHref`), never a button, so cursor pagination works without JavaScript. Folding narrow columns is a CSS media query, not client-side column-visibility state. Every label the component renders is a required prop; none are baked in. `@devslab/dds-solid` adds `createStatusPill` — a factory whose rule is fixed (an unknown value in a closed domain throws, in an open domain it renders as raw text) while the domains, tones and labels are entirely the consumer's — and `ConsoleShell`, a rail-and-main layout with a skip link, a responsive nav drawer, and a page header; navigation items, copy, and routing are the product's. `@devslab/dds-css` gains the `.dds-table*` and `.dds-console-shell*` styles those two consume, plus a `.dds-visually-hidden` utility.

  DataTable 패키지, status-pill 팩토리, 콘솔 셸.

  `@devslab/dds-table`은 TanStack Table(`9.2.4` 정확히 고정) 위에 지은 `DataTable` 컴포넌트를 낸다. 정렬은 플래그가 아니라 데이터 모양이 정한다 — 테이블이 전체 목록을 들고 있으면 `sort="client"`, 서버가 정렬해 커서로 페이징한 것이면 `sort={{ statedOrder }}`(후자의 한 페이지만 정렬하면 전체를 잘못 보고하게 된다). 페이징은 버튼이 아니라 평범한 링크(`page.nextHref`)라 JavaScript 없이도 커서 페이징이 동작한다. 좁은 컬럼 접기는 클라이언트 쪽 컬럼 표시 상태가 아니라 CSS 미디어 쿼리다. 컴포넌트가 렌더링하는 모든 라벨은 필수 prop이고, 내장된 것은 하나도 없다. `@devslab/dds-solid`는 `createStatusPill`을 추가한다 — 규칙은 고정(닫힌 도메인의 미지 값은 throw, 열린 도메인은 원문 텍스트로 렌더링)이고 도메인·톤·라벨은 전적으로 소비자 몫이다 — 그리고 `ConsoleShell`(skip 링크·반응형 내비 드로어·페이지 헤더를 가진 레일+본문 레이아웃이며, 내비 항목·문구·라우팅은 제품이 정한다). `@devslab/dds-css`는 이 둘이 쓰는 `.dds-table*`·`.dds-console-shell*` 스타일과 `.dds-visually-hidden` 유틸리티를 얻는다.

### Patch Changes

- Updated dependencies [6f4a2bc]
  - @devslab/dds-css@0.11.0
  - @devslab/dds-tokens@0.11.0
