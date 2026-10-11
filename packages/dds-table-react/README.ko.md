# @devslab/dds-table-react

**AG Grid Community 36.2.0**에 DDS 테마와 SSR 안전 경계를 제공하는 React 패키지입니다. `@devslab/dds-react`와 독립적이므로 기본 React 컴포넌트를 가져올 때 AG Grid가 포함되지 않습니다. React와 React DOM 18.3 또는 19를 peer dependency로 사용합니다.

```tsx
import { useRef } from "react";
import { DataTable, type DataTableRef } from "@devslab/dds-table-react";
import type { ColDef } from "ag-grid-community";
import "@devslab/dds-tokens/tokens.css";
import "@devslab/dds-css/dds.css";
import "@devslab/dds-table-react/styles.css";

type Order = { id: string; amount: number };
const columns: ColDef<Order>[] = [
  { field: "id", filter: true },
  { field: "amount", editable: true },
];
export function Orders({ rows }: { rows: readonly Order[] }) {
  const gridRef = useRef<DataTableRef<Order>>(null);
  return <DataTable rows={rows} columns={columns} label="주문"
    placeholder="주문 준비 중" gridRef={gridRef}
    gridProps={{ getRowId: ({ data }) => data.id,
      rowSelection: { mode: "multiRow" },
      localeText: { noRowsToShow: "주문 없음" } }} />;
}
```

`rows`는 `readonly T[]`이며 AG Grid에 전달할 배열을 복사합니다. 데이터가 바뀌면 새 배열을 전달하세요. `columns`는 React 셀 렌더러를 포함하는 네이티브 `ColDef<T>[]`입니다. 필수 `label`은 외부 region과 실제 grid의 접근 가능한 이름입니다. 모든 문구는 호출자가 제공하며 AG Grid 내부 문구는 `localeText`로 번역합니다.

`DataTableGridProps<T>`는 `rowData`와 `columnDefs`를 제외한 네이티브 `AgGridReactProps<T>` 별칭입니다. `gridProps`로 콜백, 필터/편집/선택, React 렌더러, `gridOptions`, `modules`, `theme`를 전달합니다. 기본값은 로컬 `AllCommunityModule`, 정렬/크기 조절 가능한 열(`minWidth: 120`), `ddsGridTheme`입니다. 직접 전달한 네이티브 속성이 같은 `gridOptions` 속성보다 우선합니다. 모듈을 직접 지정하면 기능별 모듈과 접근 가능한 이름에 필요한 `RenderApiModule`을 포함하세요. 전역 모듈 등록은 하지 않습니다.

`gridRef`는 `AgGridReact<T>`의 일반 React ref입니다. `onGridReady` 이후 `gridRef.current.api`를 사용하세요. 객체 ref와 콜백 ref, React 19 ref 정리를 지원합니다. 컴포넌트 자체 `ref`는 외부 `HTMLDivElement`이며 `id`, `className`, `style`, DOM 이벤트도 외부 region에 적용됩니다.

`density="comfortable"`이 기본이며 행/헤더 높이는 40/44px입니다. `"dense"`는 32/36px입니다. 네이티브 `rowHeight`/`headerHeight`가 우선합니다. 기본 높이는 480px이고 `style={{ height: 640 }}`으로 변경합니다. 좁은 화면에서도 최소 열 너비를 유지하고 AG Grid의 가로 스크롤을 사용합니다. `domLayout`을 변경할 때 컨테이너 크기도 함께 조정하세요.

`ddsGridTheme`는 DDS 의미 토큰의 CSS 변수를 AG Grid 테마에 연결합니다. 가까운 `[data-theme="dark"]` 등 토큰 범위를 따릅니다. `gridProps.theme`, `gridProps.gridOptions.theme`, `ddsGridTheme.withParams(...)`로 변경합니다. 기본 테마에는 AG Grid의 레거시 CSS를 함께 불러오지 마세요. [AG Grid 테마 매개변수](https://www.ag-grid.com/react-data-grid/theming-parameters/)는 CSS 변수 색상 표현식을 지원합니다.

SSR/worker import는 브라우저 전역 객체 없이 동작합니다. 서버와 최초 hydration은 동일한 이름 있는 `role="region"`, `aria-busy="true"`, 고정 높이 및 선택적 `placeholder`를 출력합니다. effect 이후 실제 AG Grid를 마운트합니다. 서버 HTML에 데이터 행이나 HTML table은 없습니다. 서버 요약이 필요하면 별도로 제공하세요. 네이티브 `loading`은 로딩 overlay와 region의 busy 상태를 제어하고 빈 배열은 네이티브 빈 상태를 사용합니다. React Server Component 환경에서는 client component 안에서 사용하세요.

정렬, 필터, 크기 조절, 편집, 선택, 가상화, infinite row model은 AG Grid가 처리합니다. 기본 client-side 모델은 전달된 행만 처리하므로 원격 결과의 일부 페이지만 전달하면 전체 결과를 정렬/필터할 수 없습니다. 원격 데이터는 Community infinite row model과 datasource의 `getRows`에서 서버 정렬/필터를 구현하세요. `rows={[]}`와 네이티브 datasource를 전달하고 DDS 입력인 `rows`/`columns`를 유지합니다. Enterprise server-side row model, 그룹/피벗 등 상용 기능은 포함되지 않습니다. 소비자가 Enterprise 모듈을 별도 설치/등록하면 라이선스와 통합도 소비자가 관리합니다. [AG Grid 행 모델](https://www.ag-grid.com/react-data-grid/row-models/)을 참고하세요.

ESM, 타입 선언, 명시적 CSS export를 제공하며 Solid runtime에 의존하지 않습니다. DDS는 [LICENSE](./LICENSE)의 source-available 라이선스를 사용하고 AG Grid Community는 자체 MIT 라이선스를 사용합니다.
