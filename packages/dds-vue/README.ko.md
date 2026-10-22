# @devslab/dds-vue

Vue 3용 DDS 공통 컴포넌트입니다. 달력 동작은 Ark UI Vue, 디자인은 공통 CSS·토큰이 담당하며 React/Solid 런타임이나 명령형 root 브리지를 사용하지 않습니다.

기존 DDS React/Solid의 공개 컴포넌트 목록을 기준으로 Vue 구현을 확장했습니다. 테이블은 `@devslab/dds-table-vue`로 분리해 일반 입력을 사용할 때 AG Grid가 따라오지 않습니다.

| 구분 | 컴포넌트·도우미 |
| --- | --- |
| 기본 컨트롤 | Button, IconButton, Icon, Field, Select, Checkbox, Radio, Switch, RadioGroup, Input, InputGroup, NumberInput, SegmentedControl |
| 선택·날짜 | Combobox, SelectPicker, DatePicker, DateRangePicker, MonthPicker, TimePicker, Calendar |
| 탐색·오버레이 | Tabs, TabList, Tab, TabPanel, Dialog, Tooltip, DropdownMenu, Popover, ToastProvider/useToast, ConsoleShell |
| 도우미 | usePendingAction/createPendingAction, createStatusPill, 날짜·월·시간 검증 |

값은 v-model/update:modelValue, 대화상자 열림은 v-model:open으로 연결합니다. React render prop 대신 Vue slot을 사용합니다. DropdownMenu/Popover의 compound 부품은 Ark Vue의 기본 props/events를 따릅니다. ConsoleShell은 기본 내용·actions·foot 슬롯, Field는 `{ control }` 기본 슬롯을 제공합니다. IconButton에는 label이 필요합니다.

NumberInput은 number/null, 선택기는 문자열 ID, 기간은 `{start,end}` ISO 날짜, MonthPicker는 YYYY-MM, TimePicker는 HH:MM을 저장합니다. 잘못된 초안은 그대로 보여주고 native form 제출을 차단합니다. disabled/readonly에서 사용자 변경을 확정하지 않습니다. 비동기 도우미는 current.value/busy.value를 제공하며 교체·초기화·scope 종료 시 AbortSignal을 취소합니다.

input, combobox, select-picker, dropdown-menu, popover, calendar, date-picker, time-picker, date-range-picker, month-picker, segmented-control, number-input의 12개 개별 import 경로를 제공합니다. Input 의존 경로에는 grid·virtualizer·다른 프레임워크 런타임이 없습니다.

컴포넌트 목록을 맞춘 것이며 프레임워크별 API가 완전히 같다는 뜻은 아닙니다. Vue는 model/slot 계약을 따르고, 선택 목록 가상화와 Calendar/NumberInput 사용자 지정 메시지 객체는 아직 포함하지 않습니다. 대용량 업무 그리드는 별도 Community 테이블 어댑터를 사용합니다. 기존 DatePicker의 한국어·Asia/Seoul 계약은 유지합니다.

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





## 공통 업무 화면

Layout·LeftNav·TopNav는 공통 간격과 타이포 규격을 사용합니다. [조립 방법과 수치](../../docs/layouts.ko.md)를 참고하세요.
