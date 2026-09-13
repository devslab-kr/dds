# @devslab/dds-css

## 0.11.1

### Patch Changes

- c99f56e: The table carries the four console rules its first consumer still kept for itself.

  A `<code>` inside a `.dds-table` cell takes the mono family at 13px. Row actions (`.dds-table__actions .dds-btn`) are 32px whatever their size modifier and never wrap, and the actions cell trims its block padding, so a row with a button is as tall as a row without one; any cell holding a `.dds-btn--sm` (a copy button beside an id) trims its padding the same way. In `.dds-table--dense`, row actions and every `.dds-btn--sm` are 24px. On a coarse pointer every one of those buttons returns to the 44px touch floor — the row grows rather than the target shrinking. `.dds-table-wrap--tall` switches its table to separate borders, since collapsed borders can keep the sticky header from sticking.

  테이블이 첫 소비자가 아직 자기 쪽에 들고 있던 콘솔 규칙 네 가지를 갖는다.

  `.dds-table` 셀 안의 `<code>`는 13px 모노 서체를 쓴다. 행 액션(`.dds-table__actions .dds-btn`)은 크기 수식자와 상관없이 32px이고 줄바꿈하지 않으며, 액션 셀은 세로 패딩을 줄여 버튼이 있는 행이 없는 행과 높이가 같다. `.dds-btn--sm`(id 옆 복사 버튼)을 담은 셀도 같은 방식으로 패딩을 줄인다. `.dds-table--dense`에서는 행 액션과 모든 `.dds-btn--sm`이 24px이다. 거친 포인터(터치)에서는 이 버튼들이 전부 44px 터치 하한으로 돌아간다 — 타깃이 줄어드는 대신 행이 커진다. `.dds-table-wrap--tall`은 테이블을 분리 테두리로 바꾼다. 테두리를 합치면 sticky 헤더가 붙지 않을 수 있기 때문이다.

## 0.11.0

### Minor Changes

- 6f4a2bc: A DataTable package, a status-pill factory and a console shell.

  `@devslab/dds-table` ships a `DataTable` component built on TanStack Table (pinned to the exact version `9.2.4`). Sorting is decided by the data shape, not a flag: `sort="client"` for a table holding its whole list, `sort={{ statedOrder }}` for a server-ordered, cursor-paged one — sorting a single page of the latter would misreport the whole. Paging is a plain link (`page.nextHref`), never a button, so cursor pagination works without JavaScript. Folding narrow columns is a CSS media query, not client-side column-visibility state. Every label the component renders is a required prop; none are baked in. `@devslab/dds-solid` adds `createStatusPill` — a factory whose rule is fixed (an unknown value in a closed domain throws, in an open domain it renders as raw text) while the domains, tones and labels are entirely the consumer's — and `ConsoleShell`, a rail-and-main layout with a skip link, a responsive nav drawer, and a page header; navigation items, copy, and routing are the product's. `@devslab/dds-css` gains the `.dds-table*` and `.dds-console-shell*` styles those two consume, plus a `.dds-visually-hidden` utility.

  DataTable 패키지, status-pill 팩토리, 콘솔 셸.

  `@devslab/dds-table`은 TanStack Table(`9.2.4` 정확히 고정) 위에 지은 `DataTable` 컴포넌트를 낸다. 정렬은 플래그가 아니라 데이터 모양이 정한다 — 테이블이 전체 목록을 들고 있으면 `sort="client"`, 서버가 정렬해 커서로 페이징한 것이면 `sort={{ statedOrder }}`(후자의 한 페이지만 정렬하면 전체를 잘못 보고하게 된다). 페이징은 버튼이 아니라 평범한 링크(`page.nextHref`)라 JavaScript 없이도 커서 페이징이 동작한다. 좁은 컬럼 접기는 클라이언트 쪽 컬럼 표시 상태가 아니라 CSS 미디어 쿼리다. 컴포넌트가 렌더링하는 모든 라벨은 필수 prop이고, 내장된 것은 하나도 없다. `@devslab/dds-solid`는 `createStatusPill`을 추가한다 — 규칙은 고정(닫힌 도메인의 미지 값은 throw, 열린 도메인은 원문 텍스트로 렌더링)이고 도메인·톤·라벨은 전적으로 소비자 몫이다 — 그리고 `ConsoleShell`(skip 링크·반응형 내비 드로어·페이지 헤더를 가진 레일+본문 레이아웃이며, 내비 항목·문구·라우팅은 제품이 정한다). `@devslab/dds-css`는 이 둘이 쓰는 `.dds-table*`·`.dds-console-shell*` 스타일과 `.dds-visually-hidden` 유틸리티를 얻는다.

## 0.10.0

## 0.9.0

## 0.8.1

## 0.8.0

## 0.7.0

## 0.6.0

## 0.5.2

### Patch Changes

- 487046d: `.dds-btn` sets `text-decoration: none`, so a link styled as a button (`<a class="dds-btn">`) no longer renders the browser's anchor underline. Consumers can drop any `a.dds-btn { text-decoration: none }` shim.

## 0.5.1

## 0.5.0
