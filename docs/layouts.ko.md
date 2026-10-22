# DDS 공통 업무 화면 규격

React·Solid·Vue·Svelte 모두 `Layout`, `LeftNav`, `TopNav`를 같은 이름으로 제공합니다.
각 프레임워크 DDS 패키지의 `styles.css`를 한 번 불러옵니다. 공통 CSS와 토큰 한 벌이
간격·글자·모양을 결정하므로 서비스마다 화면 여백을 다시 정하지 않습니다.

- Layout: `navigationPosition="left"` 또는 `"top"`, 본문·헤더·메뉴·하단 영역 배치와 모바일 탐색.
- LeftNav: 세로 그룹·항목·아이콘·활성 표시·선택형 접기/펼치기.
- TopNav: 가로 그룹과 일반 링크의 네이티브 disclosure. 별도 모바일 햄버거를 중복으로 만들지 않습니다.

React/Solid는 header/navigation/railStart/railEnd/footer 노드를 props로 넣고 본문은 children으로 넣습니다.
Vue는 같은 이름의 named slot(예: `#railStart`), Svelte는 같은 이름의 snippet을 사용합니다.
동작하는 전체 예시는 `tests/fixtures/layouts` 네 프레임워크 파일을 참고하세요.

| 역할 | 크기 / 줄 높이 / 굵기 |
|---|---|
| 페이지 제목 | 24 / 32px / 700 |
| 섹션 제목 | 20 / 28px / 600 |
| 하위 제목 | 17 / 24px / 600 |
| 업무 본문 | 14 / 20px / 400 |
| 읽기 설명 | 16 / 24px / 400 |
| 필드 라벨 | 13 / 16px / 500 |
| 보조 설명 | 12 / 16px / 400 |

왼쪽 폭232px, 상단 최소56px, 본문 여백32px/모바일16px, 섹션 간격32px,
패널24px/모바일16px, 필드 간격16px, 아이콘 간격8px를 사용합니다.
모바일 전환은56.25rem이며 메뉴 조작 대상은 데스크톱40px/모바일44px 이상입니다.
본문 폭은 `contentWidth`로 workspace1100px·form900px·settings800px·full 중 선택합니다.
구획은 `dds-layout__section`, 패널은 `dds-layout__panel`, 필드 묶음은
`dds-layout__fields`, 읽기 설명은 `dds-layout__reading`, 보조 설명은 `dds-layout__caption`을 사용합니다.

앱은 메뉴 데이터·권한·라우팅·페이지 이동 시 그룹 열기·세션 보관을 담당합니다.
저장소는 hydration 이후 읽고 최초 SSR/클라이언트 상태를 일치시키세요.
그룹 ID는 안정적인 고유 값으로 지정합니다. 초기 접기는 defaultExpandedGroups이며 빈 배열은
모두 접기, 생략은 활성 그룹 열기입니다. 외부 제어는 Vue의 v-model:expandedGroups,
다른 프레임워크의 expandedGroups/onExpandedGroupsChange를 사용합니다.

모바일 닫힘 메뉴에는 키보드가 진입하지 않으며 Escape로 닫으면 열기 버튼으로 초점이 돌아옵니다.
TopNav 하위 그룹의 Escape는 해당 제목으로 돌아오고, 다음 Escape가 모바일 메뉴를 닫습니다.
기본 링크 동작은 가로채지 않습니다. 브랜드는 로고와 의미 색상 토큰을 설정하고 폰트는 호스트가 불러옵니다.

ConsoleShell 기존 사용법은 유지하며 내부에서 Layout·LeftNav를 조립합니다.
Vue의 기존 actions/foot 슬롯과 header-actions 확장도 유지합니다.
Svelte는 현재 이 네 구성 요소만 제공하며 전체 컨트롤·그리드 지원을 의미하지 않습니다.

패키지 발행만으로 서비스 화면이 자동 배포되지는 않습니다. 소비 서비스에서 버전 채택·빌드·검증·배포해야 반영됩니다.
