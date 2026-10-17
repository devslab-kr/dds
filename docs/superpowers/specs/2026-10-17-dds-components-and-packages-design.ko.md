# DDS 패키지 체계와 입력·선택·날짜 컴포넌트 설계

- 작성일: 2026-10-17 (Asia/Seoul)
- 상태: 설계 검토안. 구현·패키지 발행·소비 제품 이전은 수행하지 않았다.
- 코드 기준: GitHub main `64c4dd37d3fbb60d9c33dea003fbcb0da3ff4807`.
- 문서 작성 위치의 기존 브랜치는 `sexysinny/shared-react-site-chrome`이다. 해당 브랜치의 미병합 기능을 main의 지원 기능으로 간주하지 않는다.

## 1. 목적과 경계

제품이 공통 UI 부재 때문에 Kobalte 등을 직접 도입하는 일을 줄인다. DDS가 입력·검색·선택·메뉴·팝오버·날짜 선택의 API, 스타일, 접근성, SSR 계약과 예제를 제공한다. Solid와 React를 같은 기능 단위로 제공하며, 내부 기반은 기존 Ark UI를 유지한다.

사용자가 확정한 방향:

- UI 패키지는 `@devslab/dds-solid`, `@devslab/dds-react`를 유지한다.
- Solid 테이블 이름은 `@devslab/dds-table-solid`, React 테이블은 `@devslab/dds-table-react`로 대칭을 맞춘다.
- 기존 패키지를 진입점으로 유지하고 컴포넌트별 상세 import 경로를 제공한다.
- 드롭다운 계열부터 양쪽 프레임워크에 추가한다.
- Calendar를 독립형으로 제공하고 DatePicker와 달력 구현을 공유한다.
- 검색에 쓰는 입력창, 내용 지우기, 입력창 안쪽 라벨과 라벨 표시 선택을 지원한다.
- FM덴탈은 독립 구현을 진행한다. 이 작업은 DDS 저장소 안에서만 수행한다. FM덴탈 파일·의존성·테스트·배포·이전 작업을 포함하지 않는다.

이 문서는 기존 React/AG Grid 설계의 테이블 이름 유지 결정을 이번 후속 변경에 한해 대체한다. 테이블 엔진이나 데이터 API를 통합하는 변경은 아니다.

## 2. 현황과 보존 대상

main 기준으로 UI 두 패키지의 Select는 네이티브 `<select>` 래퍼다. 공개 DropdownMenu, Combobox, Popover, 독립 Calendar, InputGroup은 없다. Field는 라벨·설명·오류와 네이티브 컨트롤의 연결을 제공한다. 기존 사용법과 CSS 클래스는 보존한다.

DatePicker는 양쪽에 있지만 동작이 완전히 같지 않다. React에는 직접 입력 draft, 한국어 `YYYY/MM/DD` 표시, ISO 저장값, validity callback, required/readOnly, 부모 응답과 외부 reset 구분 등의 회귀 방지가 있다. Solid는 더 단순한 Ark Input 기반이다. 달력 추출 때 React 동작을 단순한 Solid 구현으로 덮어쓰지 않는다. 신규 계약은 양쪽에 적용하고 차이를 해소한다.

`dds-table`은 Solid 전용 TanStack 테이블이고 `dds-table-react`는 AG Grid Community 래퍼다. 이름을 대칭으로 바꿔도 두 엔진의 API·SSR·기능 차이는 유지하고 문서에 명시한다.

## 3. 패키지와 import 체계

### 3.1 권장 체계

| 역할 | 공개 패키지 | 조치 |
| --- | --- | --- |
| 디자인 원본 | `@devslab/dds-tokens` | 유지 |
| 프레임워크 중립 CSS | `@devslab/dds-css` | 유지 |
| 아이콘 자산 | `@devslab/dds-icons` | 유지 |
| Solid UI | `@devslab/dds-solid` | 상세 export 추가 |
| React UI | `@devslab/dds-react` | 동일한 상세 export 추가 |
| Solid 테이블 | `@devslab/dds-table-solid` | 기존 구현의 공식 이름 |
| React 테이블 | `@devslab/dds-table-react` | 유지 |
| 공개 사이트 기반 | `@devslab/site-kit` | 유지. 이번 이름 정리에서 제외 |
| 이전 Solid 테이블 이름 | `@devslab/dds-table` | 호환 전용 패키지로 전환 |

런타임 factory나 프레임워크 자동 감지기는 만들지 않는다. React와 Solid는 별도의 명시적 의존성 경계를 유지한다. 컴포넌트마다 npm 패키지를 새로 만들지도 않는다.

```tsx
import { Combobox } from '@devslab/dds-solid/combobox';
import { DropdownMenu } from '@devslab/dds-solid/dropdown-menu';
import { SelectPicker } from '@devslab/dds-solid/select-picker';
import { Popover } from '@devslab/dds-solid/popover';
import { Input, InputGroup } from '@devslab/dds-solid/input';
import { Calendar } from '@devslab/dds-solid/calendar';
import { DatePicker } from '@devslab/dds-solid/date-picker';
import { DataTable } from '@devslab/dds-table-solid';
```

React에서는 경로의 dds-solid를 dds-react로 바꾼다. 기존 루트 import도 유지하고 같은 구현·타입을 재노출한다.

```tsx
import { Button, Combobox } from '@devslab/dds-react';
```

### 3.2 배포 계약

`package.json`의 exports에 경로를 명시한다. `src/*`나 `dist/*` deep import를 공개 계약으로 삼지 않는다. 신규 경로와 기존 루트는 동일한 컴포넌트와 context를 재노출해야 한다. 각 entry를 별도로 번들링해 context와 Ark ownership이 복제되지 않도록 공통 chunk를 사용한다.

Solid 신규 entry는 기존과 같이 browser 및 node/worker/workerd/default 조건과 타입 선언을 제공한다. 서버 조건은 DOM 전역을 읽지 않는다. React entry는 기존 React 18.3/19 지원과 SSR 계약을 유지한다. 필요한 컴포넌트를 import할 때 반대 프레임워크나 테이블 엔진이 들어오지 않아야 한다. Input entry에는 virtualizer가 따라오지 않아야 한다.

기존 `styles.css` import는 유지한다. 신규 스타일은 dds-css에 시맨틱 토큰으로 작성하고 UI 패키지 스타일 진입점에서 포함한다. 컴포넌트별 JS import가 자동으로 스타일을 설치한다고 가정하지 않는다. 기존 CSS 소비 방식과 함께 필요한 import를 예제에 명시한다.

### 3.3 dds-table 이전

구현의 소유 위치를 `packages/dds-table-solid`로 옮기고 `packages/dds-table`은 새 패키지를 재노출하는 작은 호환 패키지로 남긴다. DataTable과 모든 공개 타입, 기존 조건별 import를 유지한다. 기존 패키지에는 독립 테이블 구현을 복제하지 않는다. 기존에 없던 자체 CSS export를 이전 과정에서 있는 것처럼 안내하지 않는다.

새 패키지와 호환 패키지는 기존 Changesets fixed group에 포함하고 같은 릴리스 버전으로 맞춘다. 내부 의존성은 동일 버전의 workspace 참조를 사용한다. 패키지명 검사, canary, 릴리스 검증, lockfile, CI 필터와 README의 예제를 함께 갱신한다. DDS 내부 소비자는 새 이름을 사용하고 호환 검증 fixture만 옛 이름을 유지한다.

먼저 새 이름과 호환 패키지를 정상 발행·설치할 수 있음을 확인한다. 그 뒤 이전 이름을 안내하는 npm deprecation을 별도 릴리스 작업으로 수행한다. import 시 console warning은 출력하지 않는다. 이번 설계는 npm deprecation 실행을 의미하지 않는다. 이전 이름을 삭제하지 않으며, 향후 제거는 소비자 이전 상태와 major 정책을 별도로 검토한다.

## 4. 제공할 컴포넌트와 경계

| 이름 | 역할 | 일차 범위 |
| --- | --- | --- |
| Input | 네이티브 텍스트·검색 입력과 Field 연결 | controlled/uncontrolled, 지우기, 라벨 배치 |
| InputGroup | 입력창 주변 아이콘·단위·버튼의 배치 | start/end 영역과 일관된 크기·포커스 표현 |
| Combobox | 입력하며 후보를 검색하고 단일 값을 선택 | 로컬/서버 필터 결과, 가상화, 상태 표시 |
| SelectPicker | 검색 입력 없는 커스텀 단일 선택 | 가상화, 키보드 typeahead |
| DropdownMenu | 값 선택이 아닌 작업 메뉴 | 항목·구분선·그룹·체크·라디오·하위 메뉴 |
| Popover | 임의 내용을 담는 비모달 팝업 | trigger, 위치, portal, focus/닫힘 |
| Calendar | 페이지 안의 독립 날짜 선택판 | 단일 날짜·월 이동·선택 제한 |
| DatePicker | 날짜 입력 + 달력 팝업 + 검증 | 기존 API 보존과 Calendar 공유 |

기존 Select는 네이티브 Select로 남긴다. 새 커스텀 선택창은 SelectPicker로 명명해 기존 이름의 의미를 바꾸지 않는다. 검색 입력만 필요하면 Input을 사용하고, 후보 선택까지 필요할 때 Combobox를 사용한다.

DateRangePicker, MultiSelect, TagsInput, 독립 ButtonGroup, 무한 로딩, 그룹 가상화, 임의 가변 높이 행과 일정 관리용 대형 달력은 후속 범위다. 메뉴의 하위 메뉴는 일차 범위에 포함하지만 desktop menubar나 context menu 전체를 함께 구현하지 않는다.

## 5. Input과 InputGroup

### 5.1 공개 계약

- Input은 네이티브 input 속성·ref를 전달한다. React/Solid 이벤트와 className/class의 프레임워크 관례는 유지한다.
- 신규 값 API는 `value` 또는 `defaultValue`, `onValueChange(next: string)`이다. 두 제어 모드를 혼합하지 않는다. 네이티브 이벤트도 보존하되 같은 편집에 값 callback을 두 번 호출하지 않는다.
- 검색 전용이 아닌 일반 입력 기반이다. `type="text" | "search" | "email" | "tel" | "url" | "password" | "number"`를 지원하며 type별 네이티브 입력·유효성 의미를 보존한다. number는 HTML input의 동작이며 별도의 NumberInput 증감 UI를 뜻하지 않는다. 파일·체크박스·날짜 선택기를 이 API로 감싸지 않는다.
- `label`, `labelPlacement="outside" | "inside" | "hidden"`을 제공한다. 기본은 outside다.
- label을 생략하면 호출자가 `aria-label` 또는 유효한 `aria-labelledby`를 제공해야 한다. placeholder는 접근 가능한 이름을 대신하지 않는다.
- `clearable`과 현지화된 `clearLabel`을 제공한다. clearable은 텍스트 내용을 지우는 동작이며 레코드 삭제와는 다르다.
- InputGroup은 start/end 슬롯의 배치만 맡는다. 자식 Input의 값이나 라벨을 복제해서 소유하지 않는다. 그룹에는 하나의 입력 컨트롤을 둔다. Field도 한 번만 연결한다.

### 5.2 안쪽 라벨

inside는 입력창 안의 floating label이다. 비어 있고 포커스가 없으면 본문 위치에 표시하고, 포커스·값·자동완성 중에는 위로 작게 올린다. 처음부터 값이 있는 SSR도 같은 위치로 렌더링한다. 입력값·캐럿·placeholder와 겹치지 않도록 높이와 패딩을 확보한다. label의 for/id 관계를 유지한다.

hidden은 라벨을 시각적으로만 숨긴다. 접근성 트리에서는 유지한다. 장식 아이콘·단위 텍스트·실행 버튼은 label과 별개다. 입력 도중 배치를 바꾸어도 input을 remount하거나 값·선택 영역·포커스를 잃지 않는다. inside 모드의 placeholder는 라벨이 올라간 상태에서만 보여 겹침을 막는다.

### 5.3 검색과 지우기

Input은 API 호출·debounce·검색 라우팅을 수행하지 않는다. 제품이 입력값을 받아 검색을 제어한다. 별도 검색 버튼은 InputGroup의 end 슬롯에 둘 수 있고 명시적으로 submit/button을 선택한다.

지우기 버튼은 `type="button"`이며 활성 상태이고 값이 있을 때만 나타난다. 한 번 활성화하면 `onValueChange('')`를 한 번 호출하고 입력창으로 포커스를 돌린다. controlled 모드는 부모가 실제 값을 갱신하며 uncontrolled 모드는 내부 상태를 갱신한다. disabled/readOnly에서는 값을 변경하지 않는다. required여도 지우기는 허용하되 비워진 필수 입력의 validity는 invalid가 된다.

clear 버튼의 pointerdown 때문에 입력창이 먼저 blur되어 이전 값이 저장되지 않도록 포커스 순서를 검증한다. 키보드로도 버튼에 접근할 수 있어야 한다. type=search의 브라우저 기본 취소 버튼과 DDS 버튼이 중복되지 않도록 처리하고, 노출된 모든 취소 경로는 같은 값 변경 계약을 따른다. Escape를 무조건 지우기로 가로채지 않는다. 한글 IME 조합 중 Enter는 검색 제출이나 후보 확정으로 처리하지 않는다.

## 6. Combobox와 SelectPicker

### 6.1 데이터와 상태

일차 옵션 형식은 `{ value: string; label: string; description?: string; disabled?: boolean }`이다. value는 유일하고 비어 있지 않은 안정적인 ID다. 빈 문자열은 선택 없음이다. 외부 옵션을 DDS 형식으로 변환하는 일은 소비자 어댑터가 담당한다. 중복 ID는 개발 환경에서 명확한 오류로 알린다.

공통 API는 `items`, `value/defaultValue`, `onValueChange`, `disabled`, `readOnly`, `required`, `name`, `label`, `labelPlacement`, `messages`, `virtualization`이다. 선택 callback에는 ID만 전달한다. Ark의 details 객체나 virtualizer 인스턴스를 공개 API의 필수값으로 노출하지 않는다. 예외적으로 labelPlacement=inside는 선택 trigger 또는 실제 입력 컨트롤에 같은 floating 규칙을 적용한다.

Combobox는 `inputValue/defaultInputValue`, `onInputValueChange`, `filterMode="local" | "external"`, `loading`, `error`, `onRetry`를 추가한다. 로컬 필터는 label의 대소문자를 구분하지 않는 포함 검색이며 옵션 ID를 바꾸지 않는다. 외부 모드에서는 받은 items를 다시 필터링하지 않는다. 서버 요청·인증·debounce·취소·이전 응답 무시는 제품의 데이터 계층이 담당한다. DDS 예제에는 AbortController 또는 요청 세대로 오래된 결과를 버리는 방법을 보여준다.

서버 검색 결과에 현재 선택 항목이 없을 수 있으므로 `selectedOption`으로 동일 value의 label을 공급할 수 있게 한다. 외부 value는 검색 결과가 바뀌어도 임의로 해제하지 않는다. 읽을 label을 알 수 없으면 ID를 표시하고 누락을 개발 환경에서 알리며, 다른 항목의 label을 잘못 붙이지 않는다. 새 외부 value/reset이 전달되면 연결된 표시값을 갱신한다.

Combobox는 후보를 확정할 때만 선택값을 변경한다. 단순 타이핑·loading·후보 없음은 선택 완료가 아니다. 선택된 상태에서 입력을 바꿨다가 확정 없이 blur하면 기존 선택 label로 복귀하고, 선택이 없으면 입력 draft를 유지한다. 자유 텍스트를 값으로 저장하는 용도는 Input을 사용한다. clear 동작은 선택 ID와 검색어를 모두 비우며 각 상태 callback을 한 번씩 전달한다.

### 6.2 가상화

Ark의 collection과 `scrollToIndexFn`을 각 프레임워크의 TanStack Virtual에 연결한다. 전체 논리 목록을 collection에 제공하고 DOM에는 화면에 보이는 행과 overscan만 유지한다. 행은 일차 구현에서 고정 높이로 제한하고 description 유무와 관계없이 같은 높이를 사용한다.

`virtualization={false | { itemHeight?: number; overscan?: number }}`이며 기본은 false다. 활성화 시 기본 높이는 40px, overscan은 각 방향 5개다. inside 라벨은 trigger/input의 배치이고 옵션 높이에는 영향을 주지 않는다. 팝업의 가시 높이는 최대 320px이며 뷰포트 여유 공간에 맞춰 줄어든다.

방향키·Home/End·typeahead·초기 선택 위치 이동은 논리 인덱스로 수행한다. 화면 밖 항목을 활성화하면 먼저 해당 행을 렌더링하고, 접근성 활성 ID는 실제 DOM에 존재하는 option을 가리켜야 한다. 단순 overscan 증가를 해결책으로 삼지 않는다. disabled 항목을 건너뛰고 전체 목록의 위치/개수를 올바르게 알린다.

검색 결과가 교체되면 이전 스크롤·highlight를 정리한다. 선택 항목이 결과 안에 있으면 재개방 시 그 항목을 보여주고, 없으면 처음부터 보여준다. SSR와 첫 hydration에서는 팝업이 닫힌 안정적인 컨트롤을 렌더링하며 측정은 마운트 뒤에만 한다. 첫 버전에는 defaultOpen/open SSR를 노출하지 않는다.

전체 항목의 `<option>`을 hidden select로 다시 생성해 가상화 효과를 없애지 않는다. 선택 ID만 form data에 포함하고, required·disabled·form reset과 invalid 시 보이는 컨트롤로의 초점 이동을 폼 연결 계층에서 보장한다. hidden input만으로 브라우저 required 검증이 된다고 가정하지 않는다. 필수 검증 브리지는 실제 브라우저에서 검증하는 출시 조건이다.

### 6.3 상태와 접근성

messages로 열기·지우기·불러오는 중·후보 없음·오류·재시도 문구를 받는다. 로딩·오류는 선택 가능한 option으로 만들지 않는다. error는 성공한 빈 결과와 구분하며 재시도 버튼은 폼을 제출하지 않는다. 상태 변경을 적절한 live region으로 알린다. readOnly는 현재 값을 읽고 포커스할 수 있지만 팝업을 열어 선택을 변경할 수 없다.

## 7. DropdownMenu와 Popover

DropdownMenu는 Ark Menu 기반 compound API로 Root, Trigger, Content, Item, Group, Label, Separator, CheckboxItem, RadioGroup/RadioItem, Submenu를 제공한다. JSX 구성은 프레임워크별 자연스러운 방식으로 제공하고 의미·이벤트 계약은 동일하게 한다. Item의 `onSelect`는 작업 실행, checkbox/radio의 callback은 값 변경으로 구분한다. 비동기 작업·권한 판단·라우팅은 제품이 맡는다.

트리거는 기존 Button/IconButton과 결합할 수 있고 이중 button을 만들지 않는다. 링크 항목은 실제 anchor를 유지한다. pointer와 키보드로 하위 메뉴를 이동하고 RTL에서 열림 방향을 반영한다. disabled 항목은 실행되지 않는다. 일반 선택은 닫히고, 체크/라디오의 closeOnSelect는 명시적으로 설정한다. 메뉴 가상화는 일차 범위가 아니다.

Popover는 Ark Popover 기반 Root, Trigger, Content, Title, Description, CloseTrigger를 제공한다. 기본은 비모달이며 Dialog를 대체하지 않는다. portal container와 위치·충돌 회피를 설정할 수 있다. UI 구현은 각 Ark primitive의 focus/positioning을 사용하고, 별도 범용 오버레이 엔진은 만들지 않는다.

메뉴·선택창·달력을 Dialog 안에서 열 때 Escape 한 번은 최상위 레이어만 닫고 트리거로 초점을 돌린다. 내부 클릭이 부모 Dialog의 바깥 클릭으로 오인되지 않아야 한다. z-index는 DDS 토큰과 기존 Dialog 정책을 따른다. 단순히 큰 숫자로 덮지 않는다.

## 8. Calendar와 DatePicker 공유 구조

각 프레임워크 안에 CalendarView라는 내부 달력 표현을 한 번 둔다. 독립 Calendar는 inline Ark DatePicker root와 CalendarView를 사용하고, DatePicker는 자기 Ark root·입력 draft·팝업 안에서 같은 CalendarView를 사용한다. DatePicker 안에 별도의 Calendar root를 중첩해 서로 다른 선택 상태/context를 만들지 않는다.

```text
dds-solid/calendar ── inline Ark root ─┐
                                    ├─ Solid 내부 CalendarView
dds-solid/date-picker ─ Ark root ─ popup┘

dds-react/calendar ── inline Ark root ─┐
                                    ├─ React 내부 CalendarView
dds-react/date-picker ─ Ark root ─ popup┘
```

프레임워크 간 JSX는 공유하지 않는다. DDS CSS·토큰·메시지 구조·ISO 날짜 계약·검증 사례를 공유한다. React hooks를 Solid에 가져오거나, JSX 공용화를 위해 새 런타임 factory를 만들지 않는다. 별도 공용 날짜 npm 패키지도 일차 범위에 만들지 않는다.

공통 날짜 모델은 Gregorian date-only `YYYY-MM-DD`와 선택 없음 `''`이다. 저장 과정에서 Date/UTC timestamp로 변환해 날짜를 이동시키지 않는다. timeZone은 오늘 판정에 사용하며 저장 날짜에는 시간대를 붙이지 않는다. min/max는 inclusive다. 범위 밖 날짜·존재하지 않는 날짜를 자동 보정해 선택 완료로 알리지 않는다.

Calendar는 label, value/onChange, locale, timeZone, min, max, disabled, readOnly, startOfWeek, messages를 제공한다. 최초 버전은 기존 DatePicker와 맞춰 controlled 단일 선택이다. 오늘/지우기 액션은 공통 뷰에서 설정 가능하다. locale 기본 ko-KR, timeZone 기본 Asia/Seoul, startOfWeek 기본 0을 보존하고 문구는 messages로 교체할 수 있게 한다. 달 이동과 날짜 선택은 별도 상태이며 월 이동만으로 onChange를 호출하지 않는다.

DatePicker의 기존 `value/onChange`와 한국어 표시/ISO 저장 계약을 보존한다. InputGroup 배치를 재사용할 수 있지만 일반 Input의 문자열 변경 callback을 날짜 commit과 동일시하지 않는다. raw draft → 유효성 판정 → 유효한 ISO 날짜 commit 단계를 유지한다. 입력 중인 부분 문자열과 불가능한 날짜는 draft로 보존하고 validity만 알린다. 빈 값은 required 여부에 따라 validity를 계산한다.

React의 onValidityChange 의미·부모의 지연된 응답·동일 문자열 반복·외부 reset·callback identity 변경에 따른 중복 알림 방지를 유지하고 Solid에도 대응 계약을 제공한다. 신규 labelPlacement와 지우기는 양쪽에서 동일하게 동작한다. required 상태에서도 clear는 가능하며 invalid 상태를 보고한다. disabled/readOnly에서는 달력 선택·오늘·지우기·직접 입력 모두 값을 바꾸지 않는다.

날짜 메시지·키보드 안내·월/요일 표시는 locale에 맞춰 제공한다. 날짜 파싱과 포맷의 확장은 별도 계약 없이 Intl의 임의 입력 해석에 맡기지 않는다. DateRangePicker는 공유 CalendarView 확장을 염두에 두되 이번 단일 날짜 API에 미리 섞지 않는다.

## 9. 구현 단위와 순서

하나의 거대한 PR로 모든 기능을 발행하지 않는다. 각 단계는 양쪽 프레임워크의 문서·예제·검증을 함께 완료한다.

1. **패키지 진입점과 이름**: 상세 export·빌드 구조, table-solid 이름, legacy 호환 경로, Changesets·검증 경로 정리.
2. **입력 기반**: Input/InputGroup, 검색 입력·clearable·라벨 배치·폼 계약.
3. **팝업과 작업 메뉴**: Popover/DropdownMenu, 중첩 레이어와 포커스.
4. **선택 계열**: Combobox/SelectPicker, 상태·폼·고정 높이 가상화.
5. **날짜 계열**: CalendarView 추출, 독립 Calendar, DatePicker 회귀 보존·양쪽 계약 정렬.

이 순서는 설계상 의존 순서다. 단계별 구체적인 파일 변경·명령·리뷰 순서는 이 문서 승인 후 작성할 구현 계획에서 정한다. 단계 1은 새 컴포넌트의 빈 placeholder export를 발행하지 않는다.

## 10. 출시 전 검증

저장소 AGENTS.md의 테스트 가치·CI 비용 원칙을 따른다. 구현 문자열·파일 배치 전체를 고정하는 테스트 대신 실제 동작과 공개 API를 검증한다. 기존 테스트를 확장하고 중복 suite를 다시 실행하는 CI 단계를 만들지 않는다.

| 영역 | 필수 검증 |
| --- | --- |
| 패키징 | tarball 신규 소비자에서 루트·상세 경로·types·SSR/worker 조건 import, 루트/상세 혼용 시 context 공유 |
| 이름 이전 | legacy/new DataTable의 export·타입·SSR 동일성, 옛 소비 fixture와 새 canary 모두 동작 |
| 의존성 | React import에 Solid 없음, UI import에 테이블 엔진 없음, Input import에 virtualizer 없음 |
| Input | controlled/uncontrolled, clear 1회, ref·reset·폼 제출·required·disabled·readOnly, IME, inside/hidden label·autofill·hydration |
| 메뉴/팝업 | 방향키·typeahead·하위 메뉴·RTL·링크·중첩 Dialog·Escape·포커스 복귀·unmount 정리 |
| 선택창 | 로컬/external 검색, 늦게 도착한 결과 예제, 선택 label 유지, empty/loading/error/retry, 제출 ID와 폼 validity |
| 가상화 | 10,000개 fixture, 렌더 행 수는 viewport+overscan 및 필요한 활성 행에 한정, 먼 항목 방향키/Home/End 이동·선택, 필터 후 스크롤, 실제 존재하는 aria-activedescendant |
| 날짜 | 공유 뷰의 독립/팝업 모드, 윤년·범위·오늘 시간대, 한국어 표시와 ISO 저장, 부분 입력·잘못된 입력 보존, 늦은 부모 응답·reset·validity 중복 방지 |
| 시각/접근성 | 라이트·다크·375px·200% 확대·RTL·긴 라벨·터치 타깃·reduced motion, 실제 브라우저 axe와 키보드 |

가상화·geometry·focus는 jsdom만으로 완료 판정하지 않는다. React StrictMode와 Solid hydration을 검증한다. 단일 프레임워크에서만 완료한 기능을 양쪽 지원으로 문서화하지 않는다.

## 11. 설계 완료와 후속 작업

이 문서의 산출물은 지원 범위, 이름, 공개 계약, 단계와 검증 기준이다. 제품 코드는 아직 변경하지 않는다. 설계 승인 뒤 단계별 구현 계획을 작성한다. 실제 구현 시 최신 main과 차이를 다시 확인하고 공개 symbol의 호출·의존 범위를 추적한다.

설계 문서 변경 자체에 제품 테스트를 새로 추가하거나 전체 CI를 재실행하지 않는다. 문서의 요구사항 누락·모순·빈 placeholder·diff 형식을 확인한다. 기존 운영 사이트나 FM덴탈의 동작 검증을 이번 설계 검증으로 주장하지 않는다.

## 12. 근거

- `packages/dds-solid/src/controls.tsx`, `packages/dds-react/src/controls.tsx`: Field·네이티브 Select·버튼 계약.
- `packages/dds-solid/src/date-picker.tsx`, `packages/dds-react/src/date-picker.tsx`: main 기준 날짜 입력 구현과 차이.
- 각 UI 패키지의 package.json·Vite 설정: 현재 단일 entry와 Solid 조건별 빌드.
- `packages/dds-table/package.json`, `packages/dds-table/src/index.ts`: 기존 Solid 테이블 공개 API.
- `scripts/verify-package-names.mjs`, `.changeset/config.json`, 릴리스 검증 스크립트: 이름·릴리스 영향 범위.
- `docs/decisions.md` D-037·D-038: Ark 기반 UI와 별도 프레임워크/테이블 패키지.
- [Ark UI Combobox](https://ark-ui.com/docs/components/combobox): collection·외부 검색·가상화 연결.
- [Ark UI 가상화 Select](https://ark-ui.com/examples/virtualized-select): virtualizer 연동 예제.
- [Ark UI DatePicker](https://ark-ui.com/docs/components/date-picker): inline·팝업·달력 context.
