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
- `Input`: v-model과 기본 input 속성/이벤트, outside/inside/hidden 라벨, 선택적 clear, readonly/disabled, 노출된 focus/select 메서드를 제공합니다. 검색은 type=search로 사용하며 장식용 DDS 검색 아이콘을 기본으로 표시합니다. clearable을 켜면 DDS 지우기 버튼을 사용합니다.
- `SelectPicker`: DDS 아래 화살표를 기본으로 표시하며 선택값은 한 줄로 유지합니다. 직접 title을 지정하지 않으면 전체 선택 라벨을 트리거의 title로 제공합니다. 팝업 항목은 줄바꿈하여 전체 라벨을 보여줍니다.
- `DatePicker`: 저장값은 YYYY-MM-DD, 한국어 표시는 YYYY/MM/DD입니다. required 기본값은 true, min/max는 양끝을 포함하는 ISO 날짜입니다. 첫 소비자 기준 언어/시간대는 한국어·Asia/Seoul입니다.

날짜의 잘못된 초안은 그대로 보여주고 오류 문구와 연결합니다. 이전 정상 날짜로 몰래 저장하지 않습니다. 버튼/API 저장은 `validityChange`도 검사하세요. 명시적으로 같은 값을 초기화할 때는 편집기 key를 새로 지정합니다. Ark UI Vue가 달력 탐색·위치·키보드를 담당하고, 대화상자 안에서는 포털도 해당 대화상자에 유지합니다. 날짜 검증 헬퍼는 `@devslab/dds-vue/date-only`에서 제공합니다.

EDS 전용 색상·도구 모음 위치·IPC/스토어는 제품 코드에 남깁니다. 공통 의미 토큰으로 제품 테마를 적용하세요.

## Toast

setup에서 `useToast()`를 호출하는 컴포넌트 위에 `ToastProvider`를 배치합니다. 공급자별 알림은 독립적이며, 대화상자 안에서는 해당 대화상자의 포털을 유지합니다. 기본값은 `defaultDuration=5000`, `regionLabel="알림"`, `dismissLabel="알림 닫기"`이며 공급자 props로 라벨을 번역할 수 있습니다.

```ts
import { useToast } from '@devslab/dds-vue'

const toast = useToast()
const id = toast.loading({ message: '저장 중…' })
toast.update(id, { message: '저장됨', tone: 'success' })

const saving = toast.promise(() => saveRecord(), {
  loading: { message: '저장 중…' },
  success: record => ({
    message: `${record.name} 저장됨`,
    action: { label: '내용 보기', onClick: () => openRecord(record.id) },
  }),
  error: () => ({ message: '저장하지 못했습니다. 입력 내용을 확인하고 다시 시도하세요.' }),
})
const record = await saving // 원래 결과를 반환하고 실패 시 원래 오류로 거부합니다.
// 작업 중에도 toast.dismiss(saving.id)로 알림을 닫을 수 있습니다.
```

`ToastInput`은 Vue `VNodeChild` 메시지, `tone` (`info`, `success`, `warning`, `danger`, `loading`), `duration`, 선택적 `action: { label, onClick }`을 받습니다. `show(input)`과 `loading(input)`은 ID를 반환합니다. loading은 갱신하거나 닫을 때까지 유지하며 duration <= 0도 자동으로 닫지 않습니다. 스피너는 장식용이므로 메시지에 진행 상태를 작성하세요.

`update(id, patch)`는 표시 중인 알림을 같은 자리에서 갱신합니다. 생략한 필드는 유지하고, 선택적 필드에 명시한 `undefined`는 기본값으로 되돌리며, `action: null`은 액션을 제거합니다. loading을 마치려면 완료 tone을 지정하세요. 없거나 만료·닫힌 ID는 무시합니다. `dismiss(id)`는 하나, `clear()`는 해당 공급자의 알림 전체를 제거합니다. 액션은 기본 button이며 알림을 먼저 닫고 콜백을 한 번 호출합니다. 작업을 자동 재시도하지 않습니다.

`promise(operation, { loading, success, error })`는 readonly `id`가 있는 await 가능한 `ToastPromise<T>`를 반환합니다. Promise 또는 한 번만 호출하는 팩토리를 받으며 동기 throw도 거부로 전달합니다. 완료 입력은 객체 또는 결과/오류를 받는 동기 콜백입니다. 완료 tone 기본값은 success/danger이며 다른 생략 필드는 loading 입력을 유지합니다. 수동 갱신·닫기·액션·clear·공급자 해제 후에는 완료 메시지 팩토리와 후속 화면 변경을 실행하지 않으며 원래 작업 결과는 그대로 전달합니다. 완료 메시지 팩토리가 throw하면 해당 알림을 닫고 원래 결과/거부를 보존합니다. 해제 전에 보관한 API는 이후 알림을 표시하지 않습니다. 작업 취소·재시도·업무 성공 판정은 추가하지 않습니다.

검증 명령은 `pnpm --filter @devslab/dds-vue check`, `test`, `build`입니다. 루트 `verify:vue:test`와 `verify:vue:release`가 CI 및 배포에 연결되며, 공개 배포는 기존 DDS lockstep Changesets 절차를 따릅니다.





## 공통 업무 화면

Layout·LeftNav·TopNav는 공통 간격과 타이포 규격을 사용합니다. [조립 방법과 수치](../../docs/layouts.ko.md)를 참고하세요.
