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
