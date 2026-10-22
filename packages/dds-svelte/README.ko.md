# @devslab/dds-svelte

공통 DDS 간격·타이포·CSS를 사용하는 Svelte 5 Layout·LeftNav·TopNav·ConsoleShell입니다.
현재 이 화면 구성 요소만 제공합니다. 다른 프레임워크의 전체 컨트롤·그리드가 포함되었다는 의미가 아닙니다.

`@devslab/dds-svelte/styles.css`를 한 번 import하세요. Layout의 navigationPosition은
left/top, contentWidth는 workspace/form/settings/full입니다. header/navigation/railStart/
railEnd/footer와 본문은 Svelte snippet으로 조립합니다. 메뉴는 레이아웃 없이도 사용합니다.
아이콘은 장식용 snippet이고 라벨이 접근 가능한 이름을 제공합니다.

LeftNav의 expandedGroups/onExpandedGroupsChange는 외부 제어, defaultExpandedGroups는
초기값입니다. 빈 배열은 모두 접고 생략하면 활성 그룹만 엽니다. 앱은 권한·라우팅·이동 시
그룹 열기·세션 보관을 담당합니다. 브라우저 저장소는 hydration 이후 읽으세요.
Layout은 모바일 탐색과 초점 복귀를 담당하고 TopNav는 네이티브 disclosure를 사용합니다.

[공통 화면 규격](../../docs/layouts.ko.md)을 참고하세요. 배포 전 test/check/build로 검증합니다.
