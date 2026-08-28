# @devslab/dds-solid

DDS의 restricted internal SolidJS 2 primitive 패키지다. 애플리케이션 셸에서
`@devslab/dds-solid/styles.css`를 한 번 불러오고, 컴포넌트는
`@devslab/dds-solid`에서 사용한다.

상태형 컴포넌트는 controlled(`value`/`open`/`checked`)와
uncontrolled(`defaultValue`/`defaultOpen`/`defaultChecked`) 방식을 모두
지원한다. Dialog는 포커스 trap·복귀와 Escape·외부 클릭 닫기를 담당하고,
Tabs는 WAI-ARIA 키보드 모델, ToastProvider는 타이머 수명주기를 담당한다.
Tooltip은 실제 trigger에 `aria-describedby`를 강제하기 위해 render prop을
사용한다.
