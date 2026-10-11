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
