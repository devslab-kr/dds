# DDS 입력·선택·메뉴·날짜 컴포넌트

Solid는 `@devslab/dds-solid`, React는 `@devslab/dds-react`를 설치한다. 아래 예제는 React이며 Solid에서는 패키지 이름과 프레임워크의 상태·ref·이벤트 관례만 바꾼다. 모든 신규 컴포넌트는 루트와 상세 경로에서 동일하게 제공한다.

```tsx
import '@devslab/dds-react/styles.css';
import { Input, InputGroup } from '@devslab/dds-react/input';
import { Combobox } from '@devslab/dds-react/combobox';
import { SelectPicker } from '@devslab/dds-react/select-picker';
import { DropdownMenu } from '@devslab/dds-react/dropdown-menu';
import { Popover } from '@devslab/dds-react/popover';
import { Calendar } from '@devslab/dds-react/calendar';
import { DatePicker } from '@devslab/dds-react/date-picker';
```

## Input과 InputGroup은 일반 입력 기반

검색 전용이 아니다. text, search, email, tel, url, password, number와 네이티브 name/form/required/readOnly/disabled/ref/입력 이벤트를 지원한다. number는 브라우저 기본 입력이며 별도 NumberInput 증감 컴포넌트가 아니다.

```tsx
<Input type="email" name="email" label="이메일" required />
<Input type="password" name="password" label="비밀번호" autoComplete="current-password" />
<Input label="담당자" labelPlacement="inside" value={name} onValueChange={setName}
  clearable clearLabel="담당자 이름 지우기" />
<InputGroup start={<span aria-hidden="true">검색</span>} end={<button type="submit">찾기</button>}>
  <Input type="search" name="query" label="검색어" labelPlacement="hidden"
    value={query} onValueChange={setQuery} clearable clearLabel="검색어 지우기" />
</InputGroup>
```

labelPlacement는 outside(기본), inside(값·포커스가 있으면 위로 올라가는 라벨), hidden(시각적으로 숨김)이다. label을 생략하면 aria-label 또는 aria-labelledby를 제공한다. placeholder만으로 라벨을 대체하지 않는다. 배치를 바꿔도 input은 다시 마운트되지 않는다.

value/onValueChange는 제어 모드, defaultValue는 비제어 모드다. 제어 모드에서는 부모가 값을 갱신한다. clear는 값을 한 번 비우고 입력창으로 포커스를 돌려주며 폼을 제출하지 않는다. 필수 입력도 지울 수 있지만 빈 상태는 invalid다. disabled/readOnly에서는 지우기 버튼이 표시되지 않는다. InputGroup의 start/end는 아이콘·단위·버튼 배치만 담당한다. Field render-prop의 id/ARIA를 Input에 전달할 수 있다. input을 Field와 연결했을 때 추가 label을 이중으로 만들지 않는다.

## Select와 SelectPicker, Combobox

- Select: 기존 네이티브 select. OS 선택 UI와 기존 API를 유지한다.
- SelectPicker: 검색 입력 없는 커스텀 선택창. 가상화를 지원한다.
- Combobox: 검색 입력과 후보 선택을 함께 제공한다. 자유 텍스트 입력만 필요하면 Input을 쓴다.

```tsx
const items = [
  { value: 'a', label: '첫 후보', description: '추가 설명' },
  { value: 'b', label: '둘째 후보' },
];
<Combobox label="항목" items={items} value={selected} onValueChange={setSelected}
  virtualization={{ itemHeight: 40, overscan: 5 }} clearable
  messages={{ open: '후보 열기', clear: '선택 지우기', empty: '후보 없음' }} />
<SelectPicker label="분류" items={items} name="category" required />
```

value는 유일하고 비어 있지 않은 문자열 ID이며 선택 없음은 빈 문자열이다. 옵션은 value/label/description/disabled를 갖는다. onValueChange는 ID를 받으며 Ark details를 해석할 필요가 없다. defaultValue도 지원한다. 가상화는 기본 off이며 켜면 고정 높이 행을 사용한다. 행 높이는 최소 40px이며 더 작은 값은 40px로 보정한다. description이 있어도 행 높이는 같고 넘친 텍스트를 잘라 표시한다. 메뉴 가상화·복수 선택·그룹 가상화·무한 로딩은 제공하지 않는다.

서버 검색에는 filterMode="external"로 서버가 필터링한 items를 전달한다. inputValue/onInputValueChange로 검색어를 제어하고 loading/error/onRetry로 조회 상태를 표시한다. 현재 선택이 후보에 없으면 같은 value의 selectedOption으로 label을 제공한다. DDS는 조회·권한·debounce를 수행하지 않는다. 제품의 데이터 계층에서 AbortController나 요청 세대로 이전 응답이 최신 검색을 덮지 못하게 한다. loading/empty/error는 선택된 값으로 취급하지 않는다.

선택한 뒤 검색어를 바꿨다가 후보 확정 없이 벗어나면 기존 선택 label로 돌아간다. 단순 타이핑은 선택 완료가 아니며, clear는 선택값과 검색어를 비운다. name/form/required를 지원하고 제출값은 표시 label이 아니라 선택 ID다. required 검증 실패는 보이는 컨트롤에 초점을 준다.

## 메뉴와 Popover

```tsx
<DropdownMenu.Root>
  <DropdownMenu.Trigger>작업</DropdownMenu.Trigger>
  <DropdownMenu.Content aria-label="항목 작업">
    <DropdownMenu.Item value="edit" onSelect={openEditor}>수정</DropdownMenu.Item>
    <DropdownMenu.Separator />
    <DropdownMenu.Item value="delete" disabled>삭제</DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>

<Popover.Root>
  <Popover.Trigger>필터</Popover.Trigger>
  <Popover.Content>
    <Popover.Title>필터 조건</Popover.Title>
    <Popover.Description>검색할 범위를 정하세요.</Popover.Description>
    <Popover.CloseTrigger aria-label="필터 닫기">닫기</Popover.CloseTrigger>
  </Popover.Content>
</Popover.Root>
```

DropdownMenu는 Group/Label/CheckboxItem/RadioGroup/RadioItem/ItemIndicator/Submenu/SubmenuTrigger도 제공한다. Root.onSelect는 ID, Root.onOpenChange는 boolean을 받는다. Item.onSelect는 작업 callback이다. 하위 메뉴는 Submenu 안에 SubmenuTrigger와 Content를 배치한다. 링크 항목은 Ark의 프레임워크별 asChild 방식으로 실제 anchor를 유지한다. Trigger도 asChild로 Button/IconButton과 결합해 이중 button을 피한다.

Popover의 기본은 비모달이다. modal 작업에는 기존 Dialog를 사용한다. Content는 기본 portal이며 Dialog 내부에서는 가까운 모달 DOM 안에 연결해 접근성 트리와 포커스를 유지한다. portal={false} 또는 portalMount로 mount 위치를 조정할 수 있다. 복합 레이어는 DDS의 공통 overlay layer 변수 `--dds-overlay-z-index`를 사용한다. 접근 가능한 제목/설명/닫기 이름을 직접 제공한다.

## Calendar와 DatePicker

```tsx
<Calendar label="예약 날짜" value={date} onChange={setDate} locale="ko-KR"
  timeZone="Asia/Seoul" min="2026-01-01" max="2026-12-31" />
<DatePicker label="납기일" value={date} onChange={setDate} required
  labelPlacement="inside" onValidityChange={setValidity} />
```

Calendar는 항상 보이는 독립 달력이고 DatePicker는 입력창과 팝업 달력이다. 각 프레임워크 안에서 같은 내부 CalendarView를 공유한다. 값은 YYYY-MM-DD와 빈 문자열이며 Date/UTC timestamp로 변환하지 않는다. 한국어 입력 표시는 YYYY/MM/DD다. min/max는 양 끝을 포함한다. timeZone은 오늘 판정에 사용한다. startOfWeek는 0(일요일)이 기본이며 0–6을 받는다.

DatePicker는 미완성·잘못된 직접 입력을 draft로 유지하고 onValidityChange로 알린다. 저장 버튼은 validity.valid와 canonical value를 확인한다. 부모가 값을 늦게 반영해도 최신 draft를 무조건 덮지 않는다. 동일 문자열로 명시적 reset을 구분해야 하는 편집기는 문서 ID/reset revision을 key로 새로 마운트한다. disabled/readOnly에서는 직접 입력·달력·오늘·지우기로 값을 변경할 수 없다.

messages로 달력 문구를 바꾸고 showToday/clearable로 footer 액션을 선택한다. 독립 Calendar는 단일 날짜 controlled 모드다. 기간 선택은 아래 Solid DateRangePicker가 맡는다. 일정 관리용 월간 캘린더와 복수 날짜 선택은 범위가 아니다.

## 기간과 월 선택 (Solid)

지금은 Solid에서만 제공한다(React는 후속). `@devslab/dds-solid/date-range-picker`, `@devslab/dds-solid/month-picker` 또는 루트에서 가져온다.

```tsx
<DateRangePicker label="조회 기간" value={range} onValueChange={setRange}
  startName="from" endName="to" min="2026-01-01" max="2026-12-31"
  presets={[{ label: '이번 달', value: { start: '2026-10-01', end: '2026-10-31' } }]} />
<MonthPicker label="청구 월" value={month} onValueChange={setMonth}
  name="month" min="2026-01" max="2026-12" />
```

DateRangePicker는 기간을 날짜 칸 두 개로 받던 화면을 대신한다. 값은 `{ start, end }`이고 각각 YYYY-MM-DD 또는 빈 문자열이다. 테두리 하나 안에 시작일·종료일 입력과 `~`가 있고 옆에 달력 버튼이 있다. 두 입력은 각자 이름(messages.startLabel/endLabel, 기본 "시작일"/"종료일")을 갖고, 필드 라벨이 둘을 묶는다. 직접 입력 규칙은 DatePicker와 같다. 종료일을 시작일보다 앞으로 입력하면 오류로 보여 주고, 날짜를 바꿔 넣거나 값을 알리지 않는다. onValueChange는 사용자가 바꿨을 때만 부르며 시작일이 종료일보다 늦은 값은 보내지 않는다. 한쪽을 지우면 그쪽을 빈 문자열로 알린다. required는 두 날짜가 모두 필요하다는 표시다. 달력에서는 첫 클릭이 시작일, 두 번째 클릭이 종료일이며 순서는 Ark가 맞춘다. 마우스를 올리면 기간을 미리 보여 주고, 한 번만 누르고 닫으면 기존 기간이 그대로 남는다. presets는 소비 제품이 넘기는 데이터로 달력 아래 버튼이 되며, min/max 밖이면 비활성이다. DDS는 기본 목록을 두지 않는다. 기간 모드에는 단일 날짜용 "오늘" 버튼이 없다. 폼에는 표시 문자열이 아니라 `startName`, `endName` 이름으로 YYYY-MM-DD가 제출된다. labelPlacement는 outside와 hidden만 받는다. 입력이 둘이라 inside 라벨은 두지 않는다.

MonthPicker는 제품마다 따로 만든 월 입력(예: 청구 월)을 대신한다. 값은 YYYY-MM 또는 빈 문자열이다. 직접 입력은 YYYY-MM, YYYY/MM, YYYY.MM, YYYYMM을 받고 한국어 표시는 YYYY/MM이다. 팝업은 해 단위로 넘기며 3열 × 4행 월 목록을 보여 준다. min/max(YYYY-MM, 양 끝 포함) 밖의 월은 비활성, 이번 달(timeZone 기준)은 밑줄, 선택한 월은 채움으로 표시한다. showThisMonth와 clearable로 아래 버튼을 고른다. `name`으로 YYYY-MM을 제출한다. labelPlacement는 DatePicker처럼 outside/inside/hidden을 받는다.

둘 다 value/defaultValue/onValueChange, locale(ko/en 기본 문구), messages, required, disabled, readOnly, invalid, form, id, aria-label/labelledby/describedby를 지원한다. 폼 reset은 defaultValue(controlled면 현재 값)로 되돌린다. Escape는 팝업을 닫고 달력 버튼으로 초점을 돌려준다. Dialog 안에서는 팝업이 그 Dialog 안에 연결된다.

## Solid 테이블 이름 이전

새 코드는 `@devslab/dds-table-solid`를 사용한다. `@devslab/dds-table-react`는 유지한다. 기존 `@devslab/dds-table`은 동일 구현과 타입을 재노출하므로 기존 import가 계속 동작한다. Solid 테이블의 스타일은 종전처럼 tokens.css와 dds-css/components/table.css에서 가져온다. npm deprecation·외부 제품 이전은 이번 구현에서 실행하지 않는다.
