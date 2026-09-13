# @devslab/dds-table

TanStack Table 기반 DDS 데이터 테이블 패키지(정확히 `9.2.4` 버전에 고정 —
고정 이유는 `docs/decisions.md` D-021 참고). `DataTable` 컴포넌트 하나와
이를 기술하는 `Column<T>`·`DataTableLabels` 타입만 제공한다. 테이블 자체는
어떤 단어도, 어떤 경로도, "다음 페이지"가 무엇을 뜻하는지도 정하지 않는다
— 방문자가 읽는 모든 문자열은 prop이다.

```sh
pnpm add @devslab/dds-table
```

이 패키지는 자체 스타일시트를 내지 않는다 — 애플리케이션 셸에서
`@devslab/dds-css`의 테이블 스타일을, 그것이 의존하는 토큰 CSS와 함께 한 번
불러온다:

```ts
import "@devslab/dds-tokens/tokens.css";
import "@devslab/dds-css/components/table.css";
```

불러오지 않으면 `<DataTable>`은 스타일 없이 렌더링된다 — `fold`는 아무
효과가 없고(컬럼 접기는 전적으로 `table.css`의 미디어 쿼리다), 시각적으로
숨겨져야 할 caption과 액션 컬럼 헤더가 눈에 보이게 렌더링된다.

```tsx
import { DataTable, type Column, type DataTableLabels } from "@devslab/dds-table";

type Job = { id: string; name: string; count: number };

const columns: Column<Job>[] = [
  { id: "name", label: "Name", cell: (row) => row.name, sortBy: (row) => row.name, rowHeader: true },
  { id: "count", label: "Count", cell: (row) => String(row.count), sortBy: (row) => row.count, numeric: true, fold: true },
];

const labels: DataTableLabels = {
  sortBy: "Sort by {column}",
  actions: "Actions",
  nextPage: "Next page",
};

<DataTable rows={jobs} columns={columns} caption="Jobs" labels={labels} sort="client" />;
```

## `DataTable` props

| Prop | 타입 | 필수/기본값 | 의미 |
| --- | --- | --- | --- |
| `rows` | `readonly T[]` | 필수 | 데이터(어떤 순서로 렌더링할지는 아래 정렬 절에서 누가 책임지는지 설명). |
| `columns` | `readonly Column<T>[]` | 필수 | 컬럼 선언 — 아래 `Column<T>` 참고. |
| `caption` | `string` | 필수 | 테이블의 접근성 이름, 시각적으로 숨겨져 렌더링(`<caption class="dds-visually-hidden">`). |
| `labels` | `DataTableLabels` | 필수 | 컴포넌트가 렌더링할 수 있는 모든 문구 — 아래 "라벨은 필수다" 참고. |
| `sort` | `"client" \| { statedOrder: string }` | 선택, 생략 시 정렬 버튼도 순서 문구도 없음 | 아래 정렬 절 참고. |
| `density` | `"comfortable" \| "dense"` | 선택, 기본값 `"comfortable"`(40px 행) | `"dense"`는 `.dds-table--dense`를 붙인다(36px 행, 셀 패딩 축소). |
| `scroll` | `"auto" \| "tall"` | 선택, 기본값 `"auto"` | `"tall"`은 `.dds-table-wrap--tall`을 붙인다 — `max-block-size: 70vh`로 스크롤되는 본문 + 고정(sticky) 헤더, 페이지를 밀어내면 안 되는 긴 인페이지 목록용. |
| `minWidth` | `string`(CSS 길이) | 선택 | `<table>`의 `min-inline-size`를 정한다 — 좁은 화면에서 컬럼이 짓눌리는 대신 `.dds-table-wrap` 안에서 가로 스크롤된다. |
| `actions` | `(row: T) => JSX.Element` | 선택 | 행마다 트레일링 셀을 렌더링(예: 행 단위 버튼); `labels.actions`로부터 시각적으로 숨겨진 헤더 셀을 추가한다. |
| `detail` | `(row: T) => JSX.Element` | 선택 | 주어진 행 아래에 펼침 행을 렌더링한다. `null`을 반환하면(예: 펼쳐지지 않은 행) 그 행에는 빈 행이 아니라 아예 detail `<tr>`이 생기지 않는다. |
| `page` | `{ nextHref?: string }` | 선택 | 아래 페이징 절 참고. |
| `empty` | `JSX.Element` | 선택 | `rows`가 비어 있을 때 `<table>` 대신 렌더링된다. 순서 문구와(있다면) 페이징 링크는 그대로 렌더링된다 — 커서 페이징 목록의 빈 페이지도 순서가 있고 여전히 다음으로 갈 방법이 필요하기 때문이다. |

## `Column<T>`

| 필드 | 타입 | 의미 |
| --- | --- | --- |
| `id` | `string` | 컬럼 고유 식별자 — 정렬 키와 `data-fold`/`data-column` 속성에 쓰인다. |
| `label` | `string` | 헤더 텍스트(정렬 버튼의 화면 표시 라벨이기도 하다). |
| `cell` | `(row: T) => JSX.Element` | 셀 본문을 렌더링한다. 시각적 마크업은 소비자 몫이고, TanStack이 보는 컬럼 정의에는 정렬 접근자 외 아무것도 담기지 않는다. |
| `sortBy?` | `(row: T) => string \| number \| null` | 있으면 → (오직 `sort="client"` 모드에서만) 정렬 가능해지고 정렬 버튼이 붙는다. 없으면 → 평범한 헤더, 버튼이 절대 안 붙는다. "값 없음"은 `null`을 반환하면 되고, 그 행들은 맨 뒤로 정렬된다(`sortUndefined: "last"`) — 맨 앞이 아니다. |
| `width?` | `string` | CSS 너비. 아무 컬럼이든 이 값을 주는 순간 테이블 전체가 `table-layout: fixed`로 바뀌고 `<colgroup>`이 생성된다. |
| `fold?` | `boolean` | 좁은 화면에서 뺄 수 있는 컬럼으로 표시한다(아래 "컬럼 접기" 참고). |
| `numeric?` | `boolean` | 오른쪽 정렬 + 고정폭 숫자체를 적용한다. |
| `rowHeader?` | `boolean` | 이 컬럼의 셀을 `<td>` 대신 `<th scope="row">`로 렌더링한다 — 테이블당 정확히 한 컬럼만 이 값을 켜야 한다. |

## 정렬: `sort`

`sort`는 두 모양 중 하나를 받는다 — 이 타입은 내보내지지 않는다(값을 그대로
써넣으면 된다, import할 것이 없다):

```ts
"client" | { statedOrder: string }
```

- **`sort="client"`** — 테이블이 전체 목록을 메모리에 들고 있는 경우. `sortBy`가
  있는 컬럼에 정렬 버튼이 렌더링되고, 누르면 TanStack Table이 이미 손에 쥔 행을
  재정렬한다. 이게 안전한 이유는 정확히 "전체 행"과 "화면에 보이는 행"이 같은
  집합이기 때문이다.
- **`sort={{ statedOrder: "…" }}`** — 서버가 정렬해 커서로 페이징한 한 페이지를
  보여주는 테이블일 때. 이 모드에서는 `sortBy`가 있어도 어떤 컬럼도 정렬 버튼을
  렌더링하지 않는다 — 클라이언트 정렬은 현재 페이지에 있는 행만 재배열할 수
  있는데, 테이블의 진짜 순서는 브라우저가 아직 본 적 없는 여러 페이지에 걸쳐
  백엔드 쿼리가 만든 순서이기 때문이다. 그런 버튼은 데이터를 정렬한 것처럼
  보이지만 실제로는 잘못 보고하는 것이다. 대신 테이블은 자기 위에 실제 순서를
  텍스트로 찍는다(`.dds-table__order`) — `statedOrder`가 그 문장이다(예:
  "최신순"). 백엔드의 정렬 어휘를 DDS는 모르므로 이 문장은 소비자가 넘긴다.

서버 정렬 테이블이 "이 컬럼만" 클라이언트 정렬을 허용하도록 하는 세 번째
모드는 없다 — 컬럼이 몇 개든 실패 양상(페이지 하나의 순서를 전체 목록의
순서인 양 조용히 보고하는 것)은 동일하기 때문이다.

## 페이징: `page`

```ts
page?: { nextHref?: string }
```

`nextHref`는 다음 페이지 컨트롤을 `<a class="dds-btn dds-btn--secondary" href="…">`
(라벨이 붙은 `<nav>` 안)로 렌더링한다 — `<button onClick>`이 아니다. 커서
페이징 목록은 결국 쿼리 문자열만 다른 URL이고, 진짜 링크여야 JavaScript가
꺼져 있을 때·하이드레이션 전 느린 연결 상태에서·브라우저의 "새 탭에서 열기"에서
그대로 동작한다. `nextHref`(또는 `page` prop 전체)를 생략하면 페이징 `<nav>`는
비활성 컨트롤을 그리지 않고 아예 사라진다.

## 컬럼 접기: `fold`

`fold: true`로 표시한 컬럼은 고정된 분기점(`dds-css`의 `table.css`에 있는
`@media (max-width: 56.25rem)`) 아래에서 `[data-fold]`에 걸린 순수 CSS
규칙으로 사라진다 — JavaScript로 만든 컬럼 표시 상태도, resize observer도,
뷰포트별 재렌더도 없다. 컬럼은 DOM에 항상 존재하고 그릴지 말지는 브라우저가
정한다. 그 덕에 접기는 SSR에서도 그대로 작동하고(스크립트가 돌기 전에도
서버가 렌더한 좁은 화면은 이미 올바르게 그 컬럼을 숨긴 상태다), 정렬·페이징
상태와 맞춰야 할 상태 자체가 없으므로 동기화 비용이 없다.

## 라벨은 필수다, 기본값이 없다

`DataTableLabels`에는 선택 필드가 하나도 없고 `DataTable`은 대체 문자열을
전혀 갖고 있지 않다:

```ts
type DataTableLabels = {
  sortBy: string;   // "{column}"이 컬럼 라벨로 치환된다
  actions: string;  // 트레일링 액션 컬럼의 헤더(시각적으로 숨김)
  nextPage: string; // 다음 페이지 링크의 접근성 이름이자 표시 텍스트
};
```

DDS는 소비자의 사용자가 어떤 언어를 읽는지 정하지 않으므로, 화면 낭독기가
읽을 영어(또는 다른 어떤 언어의) 문구도 대신 실어 보내지 않는다. 라벨을
빠뜨린 소비자는 조용히 영어가 나가거나 빈칸이 나가는 대신 TypeScript
에러를 받는다.

## 이 패키지가 내보내지 않는 것

`DataTable`이 유일한 컴포넌트다. TanStack Table 자체 문서가 테이블을
조립하는 재료로 쓰는 행/셀 프리미티브(`Th`, `Td`, `useDataTable` 훅)는
의도적으로 미노출이다 — 오늘 소비자는 정확히 하나이고, 유지해야 할 API
표면을 두 벌 두는 비용은 필요해지기 전에 미리 치를 이유가 없다. `DataTable`의
props로 표현할 수 없는 테이블 모양이 필요한 두 번째 소비자가 나타나면 그때
프리미티브를 내보낸다.

클라이언트 페이징·필터링(TanStack Table의 `getPaginationRowModel` 등)도
마찬가지로 배선하지 않았다: 이 컴포넌트를 부르는 곳은 언제나 메모리에 다
올라가는 작은 목록(`sort="client"`)이거나 이미 페이지가 나뉜 서버 응답
(`page.nextHref`)이라, 그 기능은 발화할 일이 없이 모든 소비자의 번들에
얹히기만 할 것이다.
