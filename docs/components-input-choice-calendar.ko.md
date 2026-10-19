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

검색 전용이 아니다. text, search, email, tel, url, password, number와 네이티브 name/form/required/readOnly/disabled/ref/입력 이벤트를 지원한다. type="number"는 브라우저 기본 입력이다. 천 단위 표시·단위·− / + 버튼이 필요하면 아래 NumberInput(Solid)을 쓴다.

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

messages로 달력 문구를 바꾸고 showToday/clearable로 footer 액션을 선택한다. 독립 Calendar는 단일 날짜 controlled 모드다. 일정 관리용 월간 캘린더, 기간 선택과 복수 날짜 선택은 이번 API의 범위가 아니다.

## SegmentedControl (Solid)

SegmentedControl은 보기 전환이나 목록 필터처럼 눈에 보이는 몇 가지 중 하나를 고르는 컨트롤이다. 라디오 그룹으로 동작한다. Tab으로 한 번만 들어가고 화살표 키로 이동하면서 선택하며(글 방향을 따른다), 각 칸이 브라우저 기본 라디오라서 name/form으로 선택한 항목 ID가 제출되고 폼 초기화 시 처음 값으로 돌아간다. 직접 만든 `aria-pressed` 버튼 묶음 대신 쓴다.

```tsx
import { SegmentedControl } from '@devslab/dds-solid/segmented-control';
<SegmentedControl label="보기" name="view" value={view()} onValueChange={setView}
  items={[{ value: 'day', label: '일' }, { value: 'week', label: '주' }, { value: 'month', label: '월' }]} />
<SegmentedControl aria-label="상태 필터" size="sm" fullWidth defaultValue="open"
  items={[{ value: 'all', label: '전체' }, { value: 'open', label: '접수' }, { value: 'done', label: '완료', disabled: true }]} />
```

items의 value는 비어 있지 않고 서로 달라야 한다. 목록이 비었거나 중복되면 오류를 낸다. value/defaultValue/onValueChange는 공통 방식과 같고, onValueChange는 사용자가 고를 때만 호출된다. 보이는 label을 주거나 aria-label/aria-labelledby를 준다. size는 md(40px, 다른 한 줄 컨트롤과 같은 높이)와 sm(32px)이다. 기본은 칸이 글자 길이만큼 넓어지고 잘리지 않는다. 칸이 너무 많아 폭을 넘으면 트랙 안에서 가로로 스크롤된다. fullWidth는 폭을 똑같이 나누고 긴 글자는 말줄임으로 줄이며 전체 글자는 툴팁으로 보여 준다. disabled, readOnly, invalid, required를 지원하고 항목별로 비활성화할 수 있다. 선택된 글자는 굵게 바뀌지만 옆 칸은 움직이지 않는다. React 버전은 후속 작업이며 이번에는 dds-solid에만 들어간다.

## NumberInput (Solid)

NumberInput은 지역 형식에 맞춘 숫자 입력이다. − / + 버튼과 단위를 붙일 수 있다. 값은 숫자이고, 비어 있으면 null이다(0이 아니다). 입력창 글자는 Intl로 꾸민 표시용(기본은 천 단위 쉼표)이며 밖으로 나가지 않는다. name/form에는 `1,234,567`이 아니라 숫자 그대로 `1234567`이 제출된다.

```tsx
import { NumberInput } from '@devslab/dds-solid/number-input';
<NumberInput label="금액" name="amount" suffix="원" min={0} max={10000000}
  value={amount()} onValueChange={setAmount} />
<NumberInput label="비율" formatOptions={{ maximumFractionDigits: 2 }} step={0.5} stepper={false} />
```

locale 기본값은 `ko-KR`이며 숫자 형식과 버튼 이름을 정한다(한국어는 값 줄이기/값 늘리기, 그 밖에는 Decrease/Increase, messages로 바꿀 수 있다). formatOptions 기본값은 정수이고, 소수가 필요하면 maximumFractionDigits를 준다. onValueChange는 사용자가 바꿀 때만 호출되며, 입력창을 벗어날 때 범위에 맞춰 고친 값도 알린다. 같은 숫자를 다시 꾸미기만 할 때는 호출하지 않는다. 부모가 입력한 숫자를 받지 않으면 입력창을 벗어날 때 부모 값으로 돌아간다.

키보드: 위/아래 화살표는 step만큼, PageUp/PageDown은 step의 10배만큼 바꾼다. Home/End는 min/max가 있을 때만 그 값으로 가고, 없으면 커서를 옮긴다. 마우스 휠로는 값이 바뀌지 않는다. min/max를 벗어나 있는 동안은 오류로 표시하고, 입력창을 벗어나면 범위 안으로 맞춘다. 빈 입력은 그대로 비어 있고 required가 아니면 오류가 아니다. 글자나 다른 문자는 추측해서 바꾸지 않고 받지 않는다. min이 0 이상이면 빼기 기호를, 소수를 허용하지 않으면 소수점을 받지 않는다. 일본어·중국어 입력기에서 들어오는 전각 숫자는 일반 숫자로 바꾸고, 조합 중인 글자는 조합이 끝난 뒤에 읽는다.

단위(suffix)는 숫자 뒤 컨트롤 안에 놓이고 값과 함께 읽히며 숫자와 겹치지 않는다. − / + 버튼은 범위 끝에서 비활성화되고 폭은 최소 32px(터치 화면은 44px)이다. label은 outside(기본) 또는 hidden이며, label이 없으면 aria-label 또는 aria-labelledby를 준다. required, disabled, readOnly, invalid, placeholder를 지원한다. React 버전은 후속 작업이며 이번에는 dds-solid에만 들어간다.

## Solid 테이블 이름 이전

새 코드는 `@devslab/dds-table-solid`를 사용한다. `@devslab/dds-table-react`는 유지한다. 기존 `@devslab/dds-table`은 동일 구현과 타입을 재노출하므로 기존 import가 계속 동작한다. Solid 테이블의 스타일은 종전처럼 tokens.css와 dds-css/components/table.css에서 가져온다. npm deprecation·외부 제품 이전은 이번 구현에서 실행하지 않는다.
