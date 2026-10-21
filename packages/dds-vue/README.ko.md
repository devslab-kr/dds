# @devslab/dds-vue

Vue 3용 DDS 공통 컴포넌트입니다. 달력 동작은 Ark UI Vue, 디자인은 공통 CSS·토큰이 담당하며 React/Solid 런타임이나 명령형 root 브리지를 사용하지 않습니다.

첫 범위는 EDS Desktop에서 옮긴 **Button, Icon, Input, DatePicker**입니다. 실제 소비자가 필요로 할 때 추가합니다. React/Solid의 전체 컴포넌트와 동등한 범위라는 뜻은 아닙니다.

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
