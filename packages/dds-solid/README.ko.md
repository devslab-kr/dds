# @devslab/dds-solid

DDS의 공개 SolidJS primitive 패키지다. 애플리케이션 셸에서
`@devslab/dds-solid/styles.css`를 한 번 불러오고, 컴포넌트는
`@devslab/dds-solid`에서 사용한다.

상태형 컴포넌트는 controlled(`value`/`open`/`checked`)와
uncontrolled(`defaultValue`/`defaultOpen`/`defaultChecked`) 방식을 모두
지원한다. Dialog는 포커스 trap·복귀와 Escape·외부 클릭 닫기를 담당하고,
Tabs는 WAI-ARIA 키보드 모델, ToastProvider는 타이머 수명주기를 담당한다.
Tooltip은 실제 trigger에 `aria-describedby`를 강제하기 위해 render prop을
사용한다.

수동 닫기 컨트롤이 필요한 ToastProvider에는 로케일별 `dismissLabel`을
주입한다. 생략하면 기존 provider API는 유지하면서 닫기 컨트롤만 렌더하지
않으므로 패키지가 영어 접근성 이름을 임의로 출력하지 않는다.

상호작용 primitive는 내부에서 [Ark UI](https://ark-ui.com/)를 사용하고,
DDS가 공개 API와 시각 토큰을 소유한다. 기존 import와 콜백 값은 유지한다.
연결 상세는 [마이그레이션 가이드](../../docs/ark-migration.ko.md)를 참고한다.

`RadioGroup`은 `options`(`value`, `label`, 선택적 `disabled`)로 이름 있는
그룹을 만들며 `name`, `value`/`defaultValue`, `onValueChange`를 지원한다.
기존 단독 `Radio`는 네이티브 동작을 유지한다. `ToastProvider`는 앱 최상위에
하나를 두고, 알림 영역 이름이 필요하면 현지화한 `regionLabel`을 주입한다.
포인터·포커스 상호작용 중과 브라우저 페이지가 비활성일 때는 알림 타이머가
멈춘다. duration이 0 이하이면 명시적으로 닫을 때까지 유지한다.

## createPendingAction

버튼이 여러 개인 화면은 어느 버튼이 작업을 시작했는지 알아야 한다. 모든 버튼에
같은 플래그 하나를 넘기면 한 번만 눌러도 전부 돈다.

```tsx
import { Button, createPendingAction } from "@devslab/dds-solid";
const action = createPendingAction<"approve" | "reject">();
<Button tone="danger" loading={action.is("reject")} disabled={action.busy()}
  onClick={() => action.run("reject", () => decide("reject"))}>반려</Button>
<Button loading={action.is("approve")} disabled={action.busy()}
  onClick={() => action.run("approve", () => decide("approve"))}>승인</Button>
```

`is(key)`는 실행 중인 동작에만 참이라 그 컨트롤만 진행 상태를 보이고, `busy()`로
나머지를 잠근다. `run`은 작업이 끝나면 성공·실패와 관계없이 상태를 지우고 오류는
호출자에게 그대로 넘긴다. 다른 동작이 실행 중이면 아무것도 하지 않으므로 두 번
눌러도 요청이 두 번 나가지 않는다. 목록 다시 불러오기처럼 마지막 요청이 이겨야 하는
곳에는 `{ replace: true }`를 준다.

작업은 `AbortSignal`을 받는다. 그 실행이 더는 유효하지 않을 때, 곧 `reset()`, 그
실행을 대체한 새 실행, 컴포넌트 정리 때 abort된다. await 뒤에 화면을 바꾸기 전에
`signal.aborted`를 확인하거나 signal을 `fetch`에 넘기면 되므로 요청 번호나 "아직
살아 있음" 플래그를 따로 둘 필요가 없다. 늦게 끝난 이전 작업은 새 동작의 상태를
지우지 못한다.

```tsx
const list = createPendingAction<"search" | "page">();
const reload = (key: "search" | "page") => list.run(key, async (signal) => {
  const rows = await loadRows(filter());
  if (!signal.aborted) setRows(rows);
}, { replace: true });
```

## DatePicker

```tsx
import { DatePicker } from "@devslab/dds-solid";
const [date, setDate] = createSignal("");
<DatePicker label="시작 날짜" value={date()} onChange={setDate} />
```

Ark UI owns focus, selection and keyboard navigation; DDS owns styling. Controlled `value` uses `YYYY-MM-DD` or an empty string. `locale` defaults to `ko-KR`, `timeZone` to `Asia/Seoul`; optional `min`, `max` and `disabled` constrain selection. Time of day uses TimePicker.

## TimePicker

```tsx
import { TimePicker } from "@devslab/dds-solid";
const [closing, setClosing] = createSignal("18:00");
<TimePicker label="마감 시간" value={closing()} onValueChange={setClosing} clearable />
```

브라우저 기본 `type="time"` 드롭다운 대신 Combobox와 같은 컨트롤과 목록을 씁니다. 값은 24시간 `HH:MM` 또는 빈 문자열이며, 서버가 보낸 `HH:MM:SS`는 `HH:MM`으로 보여 줍니다. 목록은 `step`분 간격(기본 10분)이고 선택한 시간이 가운데에 오도록 열립니다. `10`을 입력하면 10:00–10:50만 남고, 끝까지 입력한 시간(간격에 맞지 않는 `10:45`도)은 Enter나 칸을 벗어날 때 확정됩니다.

## 입력·선택·메뉴·공유 달력

Input/InputGroup은 검색 전용이 아닌 일반 입력 기반이며 라벨 배치·내용 지우기를 지원합니다. Combobox/SelectPicker는 가상화를, DropdownMenu/Popover는 접근 가능한 팝업을, Calendar/DatePicker는 공유 달력을 제공합니다.

상세 import: `@devslab/dds-solid/input`, `/combobox`, `/select-picker`, `/dropdown-menu`, `/popover`, `/calendar`, `/date-picker`, `/time-picker`. 기존 루트 import와 `styles.css`는 유지합니다. [공통 사용 가이드](https://github.com/devslab-kr/dds/blob/main/docs/components-input-choice-calendar.ko.md)를 참고하세요.
