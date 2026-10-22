# @devslab/dds-table-vue

AG Grid Community 36.2.0의 네이티브 Vue 3 어댑터입니다. DDS 공통 시맨틱 테마를 사용하며, 기본 컴포넌트의 의존성에 그리드가 들어가지 않도록 `dds-vue`와 분리합니다. Vue >=3.5가 peer입니다. 설치와 완전한 Vue 예제는 [영문 가이드](README.md)를 참고하세요.

- `rows`: 읽기 전용 배열을 허용합니다. 변경 시 배열을 교체하세요. `columns`는 Vue 렌더러를 포함한 네이티브 `ColDef<T>[]`입니다.
- `label`: 영역과 그리드의 접근성 이름이며 변경을 반영합니다. `@grid-ready`와 `gridProps.onGridReady`는 각각 한 번 호출됩니다. 준비 후 컴포넌트 ref의 `api`/`getApi()`로 `GridApi<T>`를 얻습니다.
- `gridProps`: DDS가 소유하는 `rowData`/`columnDefs`를 제외한 네이티브 `GridOptions<T>`와 로컬 `modules`를 받습니다. 기본 `AllCommunityModule`이며 전역 등록이나 Enterprise 모듈은 없습니다. 커스텀 모듈 집합은 기능별 모듈과 접근성 이름용 `RenderApiModule`을 포함해야 합니다.
- 정렬·열 크기 조절은 기본 활성, 최소 열 너비 120px입니다. 필터·편집·행 선택은 네이티브 옵션으로 켭니다. 그리드 문구는 `localeText`로 번역합니다.
- `density`: 기본 comfortable은 행 40px/헤더 44px, dense는 32px/36px입니다. 네이티브 높이 옵션이 우선합니다. 기본 전체 높이 480px이며 컴포넌트 `style`로 변경합니다. 나머지 DOM 속성은 바깥 영역에 전달됩니다. 좁은 화면은 최소 열 너비와 내부 가로 스크롤을 유지합니다.
- `styles.css`를 한 번 가져오세요. DDS 토큰/코어가 포함됩니다. `ddsGridTheme`는 `[data-theme="dark"]`를 포함한 공통 변수를 따르며 `gridProps.theme` 또는 `withParams`로 확장합니다. 기본 테마와 레거시 AG Grid CSS를 함께 로드하지 마세요.
- SSR/첫 hydration은 이름이 있는 busy 영역과 `placeholder` 슬롯만 렌더링합니다. 마운트 후 그리드를 만듭니다. 서버용 데이터 요약이 필요하면 별도 제공하세요. `loading`은 네이티브 로딩 오버레이와 영역 상태에 반영됩니다.

Community의 정렬·필터·크기 조절·편집·선택·가상화를 사용합니다. 기본 클라이언트 모델은 전달된 행에만 작동합니다. 전체 원격 데이터 정렬/필터는 Community infinite row model, 빈 `rows`, 해당 처리를 구현한 datasource를 사용하세요. Enterprise 서버 행 모델·그룹·피벗은 포함하지 않습니다. 별도 Enterprise 연결과 라이선스는 소비자가 관리합니다.

루트 검증 명령은 `verify:table-vue:test`, `verify:table-vue:release`, `verify:vue:browser`입니다. 실제 그리드 동작, SSR, 패킹된 새 Vue 프로젝트 타입 검사를 포함합니다. DDS는 [source-available 라이선스](LICENSE), AG Grid Community는 별도 MIT 라이선스입니다.
