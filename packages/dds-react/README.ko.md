# DDS React

Ark UI 5.39.3과 DDS 토큰·CSS·아이콘을 사용하는 React 접근성 컴포넌트입니다. React/React DOM 18.3 또는 19를 peer dependency로 사용합니다.

```tsx
import '@devslab/dds-react/styles.css';
import { Button, Field, Select, Dialog } from '@devslab/dds-react';

<Field label="국가" helpText="국가를 선택하세요">
  {control => <Select {...control} defaultValue="kr"><option value="kr">한국</option></Select>}
</Field>
<Button onClick={() => setOpen(true)}>편집</Button>
<Dialog open={open} onOpenChange={setOpen} title="국가 편집">
  <Button onClick={() => setOpen(false)}>완료</Button>
</Dialog>
```

Button, IconButton, Field, Checkbox, Radio, Select, Switch, RadioGroup, Dialog, Tabs/TabList/Tab/TabPanel, Tooltip, Icon, ToastProvider/useToast, ConsoleShell 및 props 타입을 제공합니다. 모든 제품 문구와 접근성 이름은 호출자가 전달합니다.

React DOM 속성(`className`, `htmlFor`, `onChange`)과 객체/콜백 ref를 사용합니다. Checkbox/Radio/Switch는 `checked`, `defaultChecked`, `onCheckedChange(boolean)`을 지원하고, Select는 네이티브 value/onChange를 사용합니다. RadioGroup은 label/options와 value/defaultValue/onValueChange(string)을 받습니다. Tabs는 Ark 옵션과 onValueChange(string)을 지원합니다.

Dialog는 기본적으로 portal을 사용하며 Ark가 중첩 모달, 포커스 복원, Escape, 스크롤 잠금을 관리합니다. `portal={false}`로 SSR 열린 콘텐츠를 인라인 렌더링할 수 있습니다. `contentProps`, `actions`, `frame`, `initialFocus`, `finalFocus`, `unstyled`와 Ark root 옵션을 제공합니다. Solid의 커스텀 additionalFocusContainers는 모방하지 않습니다. 고급 구성은 ArkDialog/ArkTabs/ArkTooltip/ArkRadioGroup/ArkCheckbox/ArkSwitch/ArkField/ArkToast 네임스페이스를 사용하세요.

Tooltip은 하나의 포커스 가능한 요소 또는 trigger props를 받는 render 함수를 사용합니다. ToastProvider의 regionLabel/dismissLabel은 호출자가 지정합니다. dismissLabel이 없으면 닫기 버튼이 없습니다. useToast는 show/dismiss/clear를 반환하며 duration 0은 유지됩니다. 언마운트 때 알림을 정리합니다.

ConsoleShell은 brand/nav/header/labels/foot을 받으며 인스턴스별 고유 ID를 사용합니다. 브라우저 전역 없이 import와 SSR이 가능하고, React useId로 hydration 연결을 유지합니다. Solid accessor/ref/render 방식 대신 React JSX/ref와 Ark asChild 요소 구성을 사용합니다. AG Grid는 별도 패키지 `@devslab/dds-table-react`입니다.

ESM, 타입 선언 및 명시적 CSS export를 제공합니다. React/React DOM/Ark를 번들에 복제하지 않습니다. 라이선스는 저장소와 동일한 포함 LICENSE를 확인하세요. 상세 API는 영문 README를 참고하세요.

## DatePicker

```tsx
import { DatePicker } from "@devslab/dds-react";
<DatePicker label="시작 날짜" value={date} onChange={setDate} />
```

Controlled `value` uses `YYYY-MM-DD` or an empty string. `locale` defaults to `ko-KR`, `timeZone` to `Asia/Seoul`. Optional `min`, `max` and `disabled` constrain selection. Import the package stylesheet. Time selection is a separate field. Ark owns calendar focus, keyboard navigation and popup dismissal.

## createStatusPill

```tsx
const StatusPill = createStatusPill({
  tones: { job: { ready: "success" } },
  label: (domain, value, locale) => value === "ready" ? "준비됨" : undefined,
});
<StatusPill domain="job" value="ready" locale="ko" />
```

Unknown closed-domain status values throw to expose incomplete catalogs. Domains listed in `openDomains` instead show the unknown value as escaped text.

### DatePicker 직접 입력과 저장

`value`/`onChange`는 기존과 같이 날짜 전용 `YYYY-MM-DD` 문자열과 명시적 지우기 `''`만 전달합니다. 입력한 날짜가 완전하고 실재하면 즉시 반영하며 잘못되거나 미완성인 입력을 이전 날짜로 치환하지 않습니다. `required`는 실제 입력의 필수 상태로 전달하고, `readOnly`는 편집과 달력 열기를 막습니다. 잠금 전환 시 열린 달력을 닫습니다. 잘못된 저장 기본값은 원문과 오류를 표시합니다.

`onValidityChange(state: DatePickerValidity)`는 원문 `inputValue`, `valid`, 사유(`valid`, `required`, `incomplete`, `invalid`, `rangeUnderflow`, `rangeOverflow`)를 전달합니다. 실제 form은 보이는 입력의 custom validity를 사용합니다. API·버튼·단축키 저장은 반드시 이 콜백의 `valid`를 검사하고 canonical `value`를 저장해야 합니다. 첫 콜백 전에는 저장을 막으세요. 잘못된 draft를 표시하는 동안 부모 `value`에는 이전 유효 날짜가 남을 수 있으므로 `value`만으로 유효성을 판단하면 안 됩니다.

엄격한 Gregorian 날짜와 양 끝을 포함한 min/max를 날짜 전용 값으로 검사하며 조용히 보정하지 않습니다. 필수 입력을 비워도 `onChange('')`는 전달하며 validity는 false입니다. 서버의 최종 검증은 유지해야 합니다. 라이브러리 테스트 통과만으로 제품의 저장 요청이 이 검사를 사용하는지 보장하지 않습니다.
기본 한국어(`ko`, `ko-KR`)의 표시 형식은 `YYYY/MM/DD`이며 `value`, `onChange`, min/max, `DatePickerValidity.value`는 `YYYY-MM-DD`를 유지합니다. `inputValue`는 화면 원문이므로 API에 저장하거나 소비자에서 구분자를 치환하지 마세요. 유효하지 않거나 미완성인 입력과 필수 빈 값의 callback `value`는 null, 선택 빈 값은 ''입니다. 표시/저장 변환은 DDS 공통에서만 처리하며 시간대 때문에 날짜를 이동하지 않습니다.

validity callback은 최초 mount, 의미 있는 입력·제약·외부 값 변경을 보고합니다. invalid/partial 입력은 `onChange`를 호출하지 않으므로 dirty/이탈 방지와 발행 확인 취소도 validity callback에 연결해야 합니다. callback 함수 identity만 바뀌면 같은 결과를 재보고하지 않아 inline setState 루프를 막습니다. 새 편집기는 문서 ID·명시적 reset revision을 key로 새로 mount하고 useCallback으로 안정적인 함수를 사용하세요. 같은 날짜여도 새 keyed 편집기는 초기 결과를 받습니다. 유효할 때 canonical value, invalid일 때 raw inputValue로 pristine 상태를 비교하면 표시 언어만 바뀔 때의 오탐과 소비자 포맷 코드를 피할 수 있습니다. 영문 예제의 keyed editor·baseline·previous 패턴을 참고하세요.

아직 반영되지 않은 로컬 값과 일치하는 부모 값은 해당 발생 건의 응답으로 보고 최신 draft를 유지합니다. B/C/B 반복을 각각 보존하고 blur/Enter 중복 commit을 막습니다. 미반영 목록에 없는 다른 외부 값은 reset으로 처리합니다. 같은 문자열만으로는 미반영 값과 같은 의도적 reset을 응답과 구별할 수 없으므로 명시적 reset은 keyed editor remount를 사용하세요. 로컬 controlled state는 즉시 갱신하고 서버 저장을 분리하세요.