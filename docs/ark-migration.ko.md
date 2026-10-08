# DDS의 Ark UI 내부 연결

DDS는 `@devslab/dds-solid`라는 기존 패키지에서 공개 API와 디자인 토큰을 유지한다.
Ark UI는 내부 접근성·상호작용 엔진이다. 별도 래퍼 패키지나 새로운 디자인 시스템은 만들지 않는다.

| DDS API | 내부 구현 | 소비자 계약 |
| --- | --- | --- |
| Tabs / TabList / Tab / TabPanel | Ark Tabs | 문자열 콜백, 자동 키보드 선택, 비활성 패널 인스턴스 유지 |
| Dialog | Ark Dialog | boolean 콜백, 포커스 트랩·복귀, 외부 클릭·Escape 정책 |
| Tooltip | Ark Tooltip | 기존 render prop 사용; 전달한 속성을 트리거에 모두 spread |
| Checkbox / Switch | Ark의 headless hooks + DDS 네이티브 input | boolean 콜백, name/value/form/required, DDS CSS 유지 |
| Field | Ark Field + DDS control props | 기존 함수형 children, label/help/error 연결 |
| ToastProvider / useToast | Ark toaster | show/dismiss/clear, DDS tone·message, 현지화된 닫기 이름 |
| RadioGroup | Ark RadioGroup | options 배열, 문자열 선택, 폼 제출과 그룹 방향키 탐색 |
| Radio / Button / IconButton / Select | 기존 네이티브 요소 | 기존 API 유지 |

## 소비 프로젝트 적용

애플리케이션 셸에서 `@devslab/dds-solid/styles.css`를 한 번 import한다.
Ark 패키지는 DDS의 런타임 의존성이므로 소비자가 별도로 Ark API를 사용하거나 설치 설정을 추가할 필요는 없다.
상태형 콜백은 Ark의 details 객체를 노출하지 않고 DDS의 boolean/string 값을 전달한다.
router, 권한, 서버 요청과 도메인 상태는 소비 프로젝트가 담당한다.

단독 `Radio`의 checked API를 유지하기 위해 개별 라디오를 억지로 하나짜리 Ark 그룹으로 감싸지 않는다.
그룹 키보드 동작이 필요한 신규 코드에서는 `RadioGroup`을 사용한다.
`TooltipTriggerProps`는 실제 DOM 트리거 속성을 표현한다. `children`의 인자를 모두 spread하고,
기존 무인자 trigger 콜백도 유지한다. 프로그램에서 상태를 제어할 때는 `open`/`onOpenChange`를 권장한다.

ToastProvider는 보통 앱 최상위에 두며, 여러 provider의 큐와 DOM ID도 각각 분리한다. `regionLabel`과 `dismissLabel`은 소비 로케일에 맞게 주입한다.
duration이 0 이하이면 알림을 유지하고, 포인터·포커스 상호작용 및 비활성 페이지에서는 타이머를 멈춘다.

Tabs의 기본 선택 방식은 자동이며 `activationMode="manual"`이면 방향키는 포커스만 옮기고 Enter/Space로 선택한다. `tabId`/`panelId`로 접근성 ID를 지정한다. `unstyled`와 네이티브 속성을 받는 `asChild` 콜백으로 앱의 레이아웃과 버튼을 Ark import 없이 유지한다. 비활성 패널은 hidden/inert와 display 제외를 보장한다. 작업 모달과 허용된 재시도 영역은 [Dialog 프레임·외부 포커스 안내](dialog-focus.ko.md)를 참고한다.
Tabs의 hidden 패널은 인스턴스를 유지하지만 실행 중인 effect나 서버 요청을 자동 중단하지 않는다.

## 검증

`pnpm --filter @devslab/dds-solid test`, `check`, `build`와 `node --test tests/dds-solid-contracts.test.mjs`를 실행한다.
실제 브라우저 픽스처는 패키지 디렉터리에서 `pnpm exec vite --config vite.preview.config.ts`로 실행한다.
Playwright CLI 세션을 해당 페이지에 연결하고 `run-code --filename scripts/verify-ark-browser.cjs`로
탭 상태 유지·방향키·폼 제출·Dialog·Tooltip·Toast를 확인한다. 데스크톱과 모바일 크기를 각각 확인한다.
jsdom에는 ResizeObserver와 레이아웃이 없으므로 컴포넌트 테스트는 해당 환경의 한계를 명시하고 브라우저 검증을 병행한다.

홈페이지 크레딧은 `Built with Ark UI · Designed by DevsLab`로 실제 의존성을 표시한다.
이 변경은 소스 변경이며 운영 사이트 배포나 npm 발행을 의미하지 않는다.
