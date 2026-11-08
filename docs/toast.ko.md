# DDS Toast

[English](toast.md)

React·Solid·Vue는 고정된 Ark UI 엔진 위에 동일한 `ToastProvider` / `useToast`
API를 제공합니다. 프레임워크별 DDS 스타일시트를 가져오고 provider 안에서
`useToast`를 호출합니다(Vue는 `setup` 내부). message 타입은 각각 `ReactNode`,
`JSX.Element`, `VNodeChild`이며 action label은 현지화된 문자열입니다.

## API

| API | 계약 |
| --- | --- |
| `show({ message, tone?, duration?, action? })` | provider가 소유하는 문자열 ID를 반환합니다. 기본 tone은 info입니다. |
| `loading({ message, action? })` | 완료 전까지 유지되는 로딩 알림의 ID를 반환합니다. |
| `update(id, patch)` | 기존 알림에 ToastUpdate를 얕게 병합하고 ID를 유지합니다. 없거나 만료·제거된 ID는 무시합니다. |
| `promise(operation, { loading, success, error })` | readonly id가 있는 await 가능한 ToastPromise<T>를 반환하며 같은 알림을 갱신합니다. |
| `dismiss(id)` | 이 provider의 알림 하나를 제거합니다. |
| `clear()` | 이 provider의 알림을 모두 제거합니다. |

공개 타입은 `ToastTone`, `ToastAction`, `ToastInput`, `ToastUpdate`,
`ToastLoadingInput`, `ToastRecord`, `ToastPromiseOptions<T>`, `ToastPromise<T>`,
`ToastApi`입니다. React/Solid는 `ToastProviderProps`도 내보내며, Vue는 컴포넌트에서
추론한 prop 타입과 children 슬롯을 사용합니다.

tone은 success/warning/danger/info/loading입니다. loading은 항상 유지됩니다.
다른 tone은 입력 duration이 없으면 provider의 defaultDuration(5000ms)을
사용하며 0 이하는 유지됩니다. update에서 생략한 필드는 유지하고, 선택 필드에
명시한 undefined는 기본값으로 초기화합니다. loading에서 완료 tone으로 바꾸면
일반 만료 시간이 시작되며 tone을 생략하면 loading이 유지됩니다.
`action: null` 또는 `action: undefined`는 action을 제거합니다.

```ts
const id = toast.loading({ message: "내보내기 준비 중" });
toast.update(id, {
  message: "내보내기 완료",
  tone: "success",
  action: { label: "내보낸 파일 열기", onClick: openExport },
});
```

action은 네이티브 type="button"입니다. 키보드로 실행할 때도 알림을 먼저 닫고
onClick을 한 번 호출합니다. DDS는 요청이나 재시도를 대신 수행하지 않습니다.
필수 작업 버튼은 사라지는 알림 외의 화면에서도 제공하세요.

## Promise 알림

```ts
const pending = toast.promise(() => save(), {
  loading: { message: "저장 중" },
  success: (value) => ({ message: `${value.count}건을 저장했습니다` }),
  error: () => ({ message: "저장에 실패했습니다", duration: 0 }),
});

try {
  const value = await pending;
  // 작업의 원래 결과를 사용합니다.
} catch (error) {
  // 원래 rejection을 처리합니다. 알림 표시가 오류를 소비하지 않습니다.
}
// pending.id는 즉시 update/dismiss에 사용할 수 있습니다.
```

operation은 Promise 또는 한 번만 실행되는 Promise 반환 함수입니다. 함수가
동기적으로 던진 오류도 rejection이 됩니다. success/error는 ToastInput 또는
동기적으로 이를 반환하는 함수이며 기본 tone은 success/danger입니다. loading
입력에 완료 입력을 병합하므로 기존 action을 없애려면 명시적으로 제거하세요.
DDS는 HTTP 응답이나 업무 payload를 검사해 성공을 추론하지 않습니다. operation
안에서 실제 결과를 검증한 뒤 resolve하세요.

수동 update·dismiss·clear·action 실행·provider 폐기는 대기 중 알림의 갱신 권한을
없앱니다. 이후 완료 문구 함수를 호출하지 않고, 알림을 재생성하거나 덮지
않습니다. 작업은 계속 실행되고 원래 결과·rejection도 호출자에게 전달됩니다.
문구 함수 자체가 update/dismiss를 호출할 수 있으므로 호출 후 소유권을 다시
확인합니다. 함수가 예외를 던지면 아직 유효한 알림만 제거하고 작업 결과는 보존합니다.

provider 폐기 후 보관된 API는 화면에 표시하지 않습니다. 보관된 promise는
작업을 한 번 실행하며 DDS가 요청을 취소하거나 재시도하지 않습니다. 결제·주문의
진실이나 mutation 재시도 정책을 알림 상태로 판단하지 마세요. Query 갱신과
업무의 결과 불명 복구는 앱이 담당합니다.

## 표시와 수명

- 독립된 알림 범위가 필요하지 않으면 앱 최상위 provider 하나를 사용합니다.
  기록·ID·정리는 provider별로 소유하며 SSR 요청 사이에 전역 가변 상태를 공유하지 않습니다.
- 진행 중인 작업은 같은 ID를 갱신하세요. 숨은 Ark 24개 대기 큐나 표시 제한을
  두지 않으므로 필요 없는 알림은 clear/dismiss로 정리하세요.
- 문구는 호출자가 제공합니다. React/Solid는 dismissLabel이 있을 때만 닫기
  버튼을 표시하고 Vue는 기존 한국어 기본 라벨을 유지합니다. 앱 로케일에 맞는
  provider 라벨을 전달하세요.
- danger는 alert, 나머지는 status입니다. 스피너는 보조 기술에서 숨기고 message로
  진행 상황을 알립니다.
- DDS 토큰·라이트/다크 테마·RTL 위치·긴 문구 줄바꿈과 기존 모션 감소·고대비
  스피너 규칙을 적용합니다.
- action은 message 아래에 배치해 모바일 줄바꿈을 유지합니다. 포인터·포커스
  상호작용과 비활성 페이지에서는 만료 타이머가 멈춥니다.

Do: 앱에서 확인한 실제 결과와 유용한 현지화 문구를 표시하세요. Don't: 전송
Promise의 resolve만으로 업무 완료를 단정하거나 실패 알림을 이유로 쓰기를 자동
재시도하지 마세요.
