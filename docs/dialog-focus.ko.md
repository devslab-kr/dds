# DDS Dialog 프레임과 외부 포커스 영역

`Dialog`는 기존 prop과 기본 동작을 유지한다. 추가 표시·포커스 prop으로 앱의 업무 프레임을 유지하면서 DDS에 모달 동작을 맡길 수 있다.

- `portal`은 `document.body` 아래에 렌더링하며 `portalMount`로 다른 마운트된 요소를 지정할 수 있다. 기본값은 기존 인라인 렌더링이다.
- `role`은 `dialog` 또는 `alertdialog`를 받는다.
- `unstyled`는 DDS 컴포넌트 클래스를 제거한다. `class`, `overlayClass`, `titleClass`, `descriptionClass`, `actionsClass`로 앱 클래스를 지정한다.
- `frame(parts)`는 제공된 `title`, `description`, `children`, `actions` 노드를 배치한다. 제목·설명 노드를 각각 한 번 렌더링하면 자동 접근성 연결을 유지한다. DDS가 제공한 노드이므로 앱에서 Ark 컴포넌트를 import할 필요가 없다.
- `contentProps`로 `aria-busy`, `onKeyDown` 같은 네이티브 콘텐츠 속성·이벤트를 전달한다.
- `initialFocus`, `finalFocus`는 앱이 선택한 포커스 요소를 반환한다. 워크스페이스 화면이 비활성화되면 `restoreFocus={false}`로 포커스 복귀를 막을 수 있다.
- `onEscapeKeyDown(event)`는 네이티브 키보드 이벤트를 받는다. 작업 중 `event.preventDefault()`를 호출하면 Escape 닫기를 취소한다. 기존 `closeOnEscape`, `closeOnOutside` 정책도 유지한다.

`additionalFocusContainers`는 외부 DOM 영역을 모달의 Tab 순환과 접근성 범위에 명시적으로 포함한다. 재시도 토스트를 키보드로 사용할 수 있게 하면서 나머지 배경은 숨긴다.

```tsx
<Dialog
  open={taskOpen() && pageActive()}
  onOpenChange={setTaskOpen}
  title="작업 저장"
  portal
  closeOnOutside={false}
  initialFocus={() => firstField}
  finalFocus={() => usableOpener() ?? fallbackControl()}
  restoreFocus={pageActive()}
  onEscapeKeyDown={(event) => { if (busy()) event.preventDefault(); }}
  additionalFocusContainers={() => [toastRegion]}
  actions={<button onClick={save}>저장</button>}
>
  <input ref={firstField} aria-label="작업 이름" />
</Dialog>
```

같은 document의 의도한 영역만 허용한다. getter에서 반응형 참조를 읽으면 참조 변경에 따라 컨테이너 목록도 갱신된다. 이미 있는 영역에 재시도 버튼을 추가·제거하는 동작은 포커스 트랩이 처리한다. 기존 수동 dialog-to-toast Tab 브리지는 필요하지 않다. 허용된 재시도 영역 클릭은 외부 클릭으로 취급하지 않는다. 영역 자체를 제거할 때는 반응형 참조/getter도 갱신해야 한다.

브라우저 전용 포커스·컨테이너 getter는 SSR에서 실행하지 않는다. Portal 콘텐츠는 클라이언트에서 마운트된다. 일반 모달은 Ark의 포커스·접근성 격리를 유지하고, 외부 영역을 허용한 모달은 Zag의 다중 컨테이너 트랩과 공유 격리 처리를 사용한다.

DOM 테스트는 Tab/Shift+Tab 순환, 배경 격리, 포커스 복귀, 사용자 프레임·Portal, Escape 취소를 검증한다. SSR 테스트는 실행 시 예외를 내는 브라우저 전용 getter로 서버 실행 여부를 확인한다. 실제 브라우저 회귀 검증은 `node packages/dds-solid/src/__tests__/dialog-browser.test.mjs`로 실행한다. 모달이 열린 뒤 재시도 버튼을 추가하고, 실제 포커스 이동·허용 영역 클릭·작업 중 Escape·닫기 후 격리 정리를 확인한다.
