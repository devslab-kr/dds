# @devslab/dds-vue

Vue 3용 DDS 공통 컴포넌트입니다. 달력 동작은 Ark UI Vue, 디자인은 공통 CSS·토큰이 담당하며 React/Solid 런타임이나 명령형 root 브리지를 사용하지 않습니다.

제공 범위는 **Button, Icon, Input, DatePicker, ConsoleShell, LeftNav**입니다. 실제 소비자가 필요로 할 때 추가합니다. React/Solid의 전체 컴포넌트와 동등한 범위라는 뜻은 아닙니다.

```sh
pnpm add @devslab/dds-vue vue
```
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Button, Input, DatePicker } from '@devslab/dds-vue'
import '@devslab/dds-vue/styles.css'
const query = ref('')
const date = ref('2026-10-22')
const dateValid = ref(true)
</script>
<template>
  <Input v-model="query" type="search" label="고객 검색" clearable />
  <DatePicker v-model="date" label="운행일자" @validity-change="dateValid = $event" />
  <Button :disabled="!dateValid">저장</Button>
</template>
```

Vue >=3.5는 peer 의존성입니다. 스타일은 한 번만 import합니다. 공통 CSS/토큰/아이콘은 프레임워크 중립 계층에 유지합니다.

- `Button`: tone·size·type·loading·disabled와 기본 HTML 속성/이벤트를 지원합니다.
- `Icon`: DDS 아이콘 이름, 선택적 접근성 label과 size를 받습니다. label 없는 아이콘은 장식용입니다.
- `Input`: v-model과 기본 input 속성/이벤트, outside/inside/hidden 라벨, 선택적 clear, readonly/disabled, 노출된 focus/select 메서드를 제공합니다. 검색은 type=search로 사용합니다.
- `DatePicker`: 저장값은 YYYY-MM-DD, 한국어 표시는 YYYY/MM/DD입니다. required 기본값은 true, min/max는 양끝을 포함하는 ISO 날짜입니다. 첫 소비자 기준 언어/시간대는 한국어·Asia/Seoul입니다.

날짜의 잘못된 초안은 그대로 보여주고 오류 문구와 연결합니다. 이전 정상 날짜로 몰래 저장하지 않습니다. 버튼/API 저장은 `validityChange`도 검사하세요. 명시적으로 같은 값을 초기화할 때는 편집기 key를 새로 지정합니다. Ark UI Vue가 달력 탐색·위치·키보드를 담당하고, 대화상자 안에서는 포털도 해당 대화상자에 유지합니다. 날짜 검증 헬퍼는 `@devslab/dds-vue/date-only`에서 제공합니다.

EDS 전용 색상·도구 모음 위치·IPC/스토어는 제품 코드에 남깁니다. 공통 의미 토큰으로 제품 테마를 적용하세요.

검증 명령은 `pnpm --filter @devslab/dds-vue check`, `test`, `build`입니다. 루트 `verify:vue:test`와 `verify:vue:release`가 CI 및 배포에 연결되며, 공개 배포는 기존 DDS lockstep Changesets 절차를 따릅니다.

`ConsoleShell`은 반응형 콘솔 레일, 본문 건너뛰기 링크, 컨텍스트 행, 페이지 헤더, 모바일 배경 클릭/Escape 닫기를 제공합니다. 필수 props는 `surface`, `activePath`, `brand` (`href`, `name`, `mark`), `labels` (`skip`, `menuOpen`, `menuClose`, `nav`, `{count}`를 포함하는 `badge`), `header` (`title`, 선택적 `eyebrow`)입니다. 선택적 `context`는 label/value 행 배열입니다. 기본 슬롯은 페이지 본문, `header-actions`는 헤더 액션, `foot`은 레일 하단, `navigation`은 메뉴 교체 슬롯입니다. `navigation`은 모바일 메뉴를 닫는 `close` 함수를 받습니다. 기본 HTML 속성·이벤트는 루트에 전달됩니다. 선택적 `nav`는 기본값 `[]`이며 기본 `LeftNav`에 전달되고, navigation 슬롯을 지정하면 그 슬롯으로 교체합니다.

```vue
<ConsoleShell surface="ops" :active-path="route.path" :brand="brand" :nav="nav"
  :labels="labels" :header="{ title: '주문' }" v-model:expanded-groups="expandedGroups">
  <template #header-actions><Button>주문 추가</Button></template>
  <p>주문 본문</p>
  <template #foot><a href="/account">계정</a></template>
</ConsoleShell>
```

`LeftNav`는 어떤 레이아웃에서도 독립적으로 사용할 수 있습니다. `surface`, `activePath`, `nav`, `nav`/`badge`만 있는 `labels`, 아래 펼침 상태 props를 받습니다. 링크 클릭 시 `navigate`, 펼침 변경 요청 시 `update:expandedGroups`를 보냅니다. 레이아웃과 메뉴를 따로 조합하는 예입니다.

```vue
<ConsoleShell surface="ops" :active-path="route.path" :brand="brand" :labels="labels" :header="{ title: '주문' }">
  <template #navigation="{ close }">
    <LeftNav surface="ops" :active-path="route.path" :nav="nav" :labels="labels"
      v-model:expanded-groups="expandedGroups" @navigate="close" />
  </template>
  <p>주문 본문</p>
</ConsoleShell>
```

그룹은 `label`, `items`, 선택적 고정 `id`, 선택적 `collapsible`을 받습니다. `collapsible`이 없으면 기존처럼 항상 펼칩니다. 접기 가능한 그룹은 최초 렌더 시 활성 항목이 있으면 펼칩니다. `defaultExpandedGroups`로 초기 상태를 지정하며 `[]`는 모두 접습니다. `expandedGroups`는 제어 상태, `update:expandedGroups`는 요청한 ID 배열 이벤트입니다 (`v-model:expanded-groups`). 비제어 모드에서도 변경 이벤트를 보냅니다. ID 생략 시 `group-${index}`를 사용하므로 순서 변경·저장에는 고정 ID를 지정하세요. 최초 설정 이후의 경로 변경과 상태 저장은 앱이 담당하며 자동으로 다시 펼치지 않습니다.

항목은 `id`, `href`, `label`, 선택적 양수 `badge`, `active` 재정의, 장식용 Vue `Component`인 `icon`을 받습니다. 아이콘은 `:is`로 렌더합니다. 반응형 nav 데이터에는 `icon: markRaw(OrderIcon)`을 사용하면 컴포넌트 반응형 경고를 피할 수 있습니다. DDS `Icon`에 props를 전달하려면 래퍼 컴포넌트를 사용하세요. `ConsoleNavItem`, `ConsoleNavGroup`, `LeftNavProps`, `ConsoleShellLabels`, `ConsoleHeader`, `ConsoleShellProps` 타입을 export합니다. 기본 button이 키보드 활성화를 제공하고 Vue `useId`가 SSR/hydration의 ARIA 연결을 유지합니다. 같은 문서에 독립 Vue 앱을 여러 개 마운트하면 각 앱의 `app.config.idPrefix`를 다르게 지정하고 서버·클라이언트에서 동일한 값을 사용하세요.
