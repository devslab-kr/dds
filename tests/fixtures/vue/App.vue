<script setup lang="ts">
import { ref, defineComponent, h, watch } from 'vue'
import { Button, Icon, IconButton, Field, Input, Select, Checkbox, Switch, RadioGroup, NumberInput, SegmentedControl, Tabs, TabList, Tab, TabPanel, Combobox, SelectPicker, DatePicker, DateRangePicker, MonthPicker, TimePicker, Calendar, Dialog, Tooltip, Popover, DropdownMenu, ToastProvider, useToast, ConsoleShell, createStatusPill } from '@devslab/dds-vue'
import { DataTable, type DataTableRef } from '@devslab/dds-table-vue'
import type { ColDef } from '../../../packages/dds-table-vue/node_modules/ag-grid-community'
import mark from '../../../packages/dds-icons/svg/layout-grid.svg?url'
const query = ref(''); const checked = ref(false); const switched = ref(false); const radio = ref('a'); const segment = ref('a'); const tab = ref('a'); const quantity = ref<number | null>(1)
const dark = ref(false)
watch(dark, value => document.documentElement.dataset.theme = value ? 'dark' : 'light')
const city = ref(''); const selected = ref('a'); const native = ref('a'); const date = ref('2026-10-22'); const range = ref({ start: '2026-10-21', end: '2026-10-22' }); const month = ref('2026-10'); const time = ref('09:30'); const calendar = ref('2026-10-22')
const dialog = ref(false); const lastMenu = ref(''); const selectedRows = ref(0); const grid = ref<DataTableRef<Row> | null>(null)
const items = [{ value: 'a', label: '서울', description: '수도권' }, { value: 'b', label: '부산', description: '영남권' }, { value: 'c', label: '제주', disabled: true }]
const Pill = createStatusPill({ tones: { order: { waiting: 'warning', ready: 'success' } }, label: (_, value) => value === 'waiting' ? '진행 대기' : '준비 완료' })
type Row = { id: string; name: string; amount: number }
const rows = ref<Row[]>([{id:'a',name:'서울',amount:300},{id:'b',name:'부산',amount:100},{id:'c',name:'대전',amount:200}])
const columns: ColDef<Row>[] = [{ field: 'name', headerName: '거래처', filter: true, flex: 1 }, { field: 'amount', headerName: '금액', filter: true, flex: 1 }]
function addRow() { rows.value = [...rows.value, { id: 'd', name: '광주', amount: 400 }] }
const Notify = defineComponent({ setup() { const toast = useToast(); return () => h(Button, { tone: 'secondary', onClick: () => toast.show({ message: '저장 완료', duration: 0 }) }, () => '토스트 표시') } })
</script>
<template>
  <ConsoleShell surface="vue-components" active-path="/components" :brand="{ href: '#', name: 'DDS Vue', mark }" :nav="[{label:'컴포넌트',items:[{id:'components',href:'/components',label:'공통 컴포넌트'},{id:'table',href:'#table',label:'데이터 테이블'}]}]" :labels="{skip:'본문으로',menuOpen:'메뉴 열기',menuClose:'메뉴 닫기',nav:'검증 항목',badge:'{count}개 알림'}" :header="{eyebrow:'DEVELOPMENT · SAMPLE DATA',title:'Vue 컴포넌트 검증'}">
    <template #actions><Switch v-model="dark" label="다크 테마" /></template>
    <div class="gallery">
      <p>공통 DDS 토큰과 네이티브 Vue 동작을 확인하는 개발용 화면입니다.</p>
      <section aria-labelledby="controls-title"><h2 id="controls-title">입력과 선택</h2><div class="fields">
        <Input v-model="query" label="검색" type="search" clearable />
        <Field label="기본 선택" v-slot="{control}"><Select v-bind="control" v-model="native"><option value="a">서울</option><option value="b">부산</option></Select></Field>
        <NumberInput v-model="quantity" label="수량" :min="0" :max="3" suffix="개" />
        <Combobox v-model="city" label="거래처 검색" :items="items" clearable />
        <SelectPicker v-model="selected" label="지역 선택" :items="items" clearable />
        <RadioGroup v-model="radio" label="구분" :items="[{value:'a',label:'수거'},{value:'b',label:'배송'}]" />
      </div><div class="actions"><Checkbox v-model="checked" label="항목 선택" /><Switch v-model="switched" label="자동 갱신" /><SegmentedControl v-model="segment" label="밀도" :items="[{value:'a',label:'기본'},{value:'b',label:'촘촘하게'}]" /><Pill domain="order" value="waiting" /><Pill domain="order" value="ready" /></div></section>
      <section aria-labelledby="dates-title"><h2 id="dates-title">날짜와 시간</h2><div class="fields"><DatePicker v-model="date" label="날짜" /><DateRangePicker v-model="range" label="기간" clearable /><MonthPicker v-model="month" label="월" clearable /><TimePicker v-model="time" label="시각" clearable /></div></section>
      <section aria-labelledby="overlay-title"><h2 id="overlay-title">탭과 오버레이</h2><Tabs v-model="tab"><TabList><Tab value="a">기본</Tab><Tab value="b">추가</Tab></TabList><TabPanel value="a"><p>기본 탭 내용</p></TabPanel><TabPanel value="b"><p>추가 탭 내용</p></TabPanel></Tabs>
        <div class="actions"><Button @click="dialog = true">대화상자 열기</Button><Tooltip content="DDS 공통 아이콘"><IconButton label="도움말"><Icon name="info" /></IconButton></Tooltip>
          <Popover.Root><Popover.Trigger as-child><Button tone="secondary">팝오버 열기</Button></Popover.Trigger><Popover.Content><Popover.Title>안내</Popover.Title><Popover.Description>Vue 네이티브 팝오버입니다.</Popover.Description><Popover.CloseTrigger as-child><Button tone="secondary">닫기</Button></Popover.CloseTrigger></Popover.Content></Popover.Root>
          <DropdownMenu.Root @select="lastMenu = $event.value"><DropdownMenu.Trigger as-child><Button tone="secondary">메뉴 열기</Button></DropdownMenu.Trigger><DropdownMenu.Content><DropdownMenu.Item value="new">새 항목</DropdownMenu.Item><DropdownMenu.Item value="disabled" disabled>사용 불가</DropdownMenu.Item></DropdownMenu.Content></DropdownMenu.Root><output aria-label="메뉴 결과">{{ lastMenu }}</output><ToastProvider><Notify /></ToastProvider>
        </div>
      </section>
      <section id="table" aria-labelledby="table-title"><div class="section-heading"><h2 id="table-title">데이터 테이블</h2><Button tone="secondary" @click="addRow">행 추가</Button></div><p>표 선택 {{ selectedRows }}건 · 전체 {{ rows.length }}건</p><DataTable ref="grid" label="샘플 거래처" :rows="rows" :columns="columns" :density="segment === 'b' ? 'dense' : 'comfortable'" :grid-props="{getRowId:p=>p.data.id,rowSelection:{mode:'multiRow'},onSelectionChanged:e=>selectedRows=e.api.getSelectedRows().length}" /></section>
      <details><summary>독립 달력</summary><Calendar v-model="calendar" label="독립 달력" /></details>
    </div>
    <Dialog v-model:open="dialog" title="변경 확인" description="운영 서버에 연결하지 않는 예시입니다."><Input v-model="query" label="메모" /><SelectPicker v-model="selected" label="대화상자 지역" :items="items" /><template #actions><Button tone="secondary" @click="dialog = false">취소</Button><Button @click="dialog = false">확인</Button></template></Dialog>
  </ConsoleShell>
</template>
<style>
.gallery { padding: var(--dds-space-20); display: flex; flex-direction: column; gap: var(--dds-space-24); }
.gallery section { padding-block: var(--dds-space-12); border-block-start: var(--dds-space-2) solid var(--dds-color-border-default); }
.gallery h2 { font-size: var(--dds-typo-title-3-font-size); margin-block: 0 var(--dds-space-16); }
.gallery p { color: var(--dds-color-text-secondary); }
.fields { display: grid; grid-template-columns: repeat(auto-fit,minmax(calc(var(--dds-space-40) * 6),1fr)); gap: var(--dds-space-16); }
.actions,.section-heading { display: flex; align-items: center; flex-wrap: wrap; gap: var(--dds-space-16); margin-block: var(--dds-space-16); }
.section-heading { justify-content: space-between; }
.gallery .dds-date-range-box { min-inline-size: 0; }
</style>
