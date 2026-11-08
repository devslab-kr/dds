# 비동기 Toast 검증 — 2026-11-08

[English](README.md)

기준 소스는 `fb83b8e3294a1f9c943963a3194706f2fa8ad02a`, 작업 브랜치는
`sexysinny/dds-toast-async`입니다. 최종 커밋 SHA는 PR 필수 CI에서 확인합니다.

## 범위와 결과

- Ark UI를 유지하고 React·Solid·Vue에 동일한 loading/update/await 가능한
  promise/action 계약을 추가했습니다. 새 런타임 의존성은 없습니다.
- 구현 전에 기능 부재로 테스트가 실패함을 확인했습니다. 리뷰 중 문구 getter의
  재진입 덮어쓰기와 provider 리전 ID 중복도 회귀 테스트로 재현한 뒤 수정했습니다.
- React는 마지막 provider/getter 보정 전 전체 DOM 189개·SSR 8개를 통과했습니다.
  최종 영향 범위 primitive 23개·SSR 8개를 다시 통과했고 이후 타입·선언·빌드도 통과했습니다.
- Solid 전체 DOM 177개·SSR 10개, 타입·클라이언트/SSR/선언 빌드가 통과했습니다.
  Vue 전체 9파일 71개, 타입·빌드도 통과했습니다.
- 프레임워크 진입점·소스 계약 9개, 문서/토큰 동기화와 diff 검사를 통과했습니다.
  Changesets 계획은 열두 패키지 fixed 그룹을 0.30.0으로 올립니다.
- 실제 Chromium에서 프레임워크별 8개, 서로 다른 검사 총 24개를 통과했습니다.
  loading/update/promise ID 유지, action 클릭·Enter, 네이티브 버튼·폼 제출 방지,
  닫은 뒤 완료, 긴 현지화 문구를 확인했습니다. 데스크톱·모바일과 두 테마에서
  레이아웃을 검사했고 데스크톱 Toast axe도 통과했습니다. React 최종 런타임
  보정 후 해당 8개만 재검증했고 Solid는 통과 후 변경이 없으며 Vue는 최종 빌드입니다.
- 독립 최종 리뷰에 남은 수정 필요 결함이 없었습니다. Impeccable 소스 검사는
  한 번 실행해 `[]`를 반환했습니다. Taste는 기존 업무 UI 위계·토큰을 보존했고,
  Polish는 실제 대표 캡처에서 간격·정렬·줄바꿈·다크 테마·action 가시성을 확인했습니다.
- packed 소비자도 통과했습니다. Solid 기존 leaf 검사(새 import·SSR·hydration),
  React 19.3.0/18.3.1 leaf 검사(새 설치·타입·Node/worker 조건 SSR·hydration·폐기·
  export 동일성), `pnpm run verify:vue:release`(새 설치·템플릿 타입·Node SSR)입니다.
  기존 packed fixture는 일반 호환성을 검사하며 새 Toast 상호작용은 위 unit/browser
  검사 범위입니다. 스크립트가 만든 임시 소비자는 정리됐습니다.

## 로컬 환경의 제한

첫 보호 CI `86d8402`는 소스 계약과 Vue/Svelte/테이블 패키지 소비자 검사까지
통과한 뒤 새 Vue 다크 테마 레이아웃 2건에서 실패했습니다. RAF를 제어한 실제
브라우저 진단에서 동일한 bottom 1110px를 재현했습니다. Ark는 배치 전
`--y:100%`, opacity 0으로 시작하며 data-mounted 이후에도 다음 paint까지
짧은 전환이 남을 수 있습니다. 최종 bottom은 높이 900px 화면에서 884px였습니다.
원래 경계·줄바꿈 기준을 모두 유지하면서 mount와 토스트 전체의 뷰포트 진입을
기다린 뒤 측정하도록 보정했습니다. 제품 CSS를 바꿀 근거는 없었습니다.
수정한 PR head에서 필수 CI를 다시 수행하며 이전 실행에서 생략된 단계를 통과로
보고하지 않습니다.

`pnpm run verify`는 전체 빌드·패키지 검사·문서/토큰 동기화를 마친 뒤 기존
로컬 전용 소비자 검사에서 실패했습니다. AskLinq의
`apps/api/src/dds/tokens.ts` 사본이 뒤처져 있습니다. 이번 작업은 토큰 소스와
AskLinq 저장소를 수정하지 않았습니다.

`verify:solid:release`, `verify:react:release`는 다른 브랜치의 기존 ignored
산출물 때문에 `packages/dds-auth/`에 manifest가 없는 환경을 만나 기존
foundation 계약 검사에서 중단됐습니다. 기존 산출물은 보존했으며, 기존 packed
소비자 스크립트를 별도로 실행합니다. 보호된 CI/릴리스의 원래 전체 검증은 유지하며
깨끗한 체크아웃에서 수행됩니다.

Vue packed 검사는 Node SSR·템플릿 타입을 확인하며 Worker SSR·브라우저
hydration은 해당 검사에서 NOT RUN입니다. 실제 OS 화면 낭독기·IME·물리 모바일
기기는 NOT RUN입니다. 브라우저 키보드·axe·뷰포트 검사와 기존 CSS의 모션
감소·고대비 규칙을 검토한 범위만 기록했습니다.

## 캡처

`{react,solid,vue}-{desktop-light,mobile-dark}.png` 최종 대표 화면 6장을
이 폴더에 보관합니다. 재사용할 검증 자료이며 release 스크립트가 만든 임시
소비자 의존성은 스크립트가 정리합니다. UI fixture의 데모 버튼은 업무 완료를
주장하는 화면이 아닙니다.

발행 상태는 기능/버전 PR, GitHub `Release public packages` 실행과 npm
provenance로 확인합니다. 소스 수정이나 이 로컬 검증 기록만으로 발행 완료를
뜻하지 않습니다.
