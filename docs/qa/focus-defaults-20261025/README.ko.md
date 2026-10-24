# DDS 공통 초점 기본값 · 2026-10-25

사용자는 FM에서 확인한 중립색 초점과 테두리 안쪽 정렬을 다음 DDS 소비자에도 기본 적용하고 패키지 배포까지 요청했다. 기존 DDS 레이아웃·브랜드 면·폼 API·키보드 동작을 보존하며 Taste로 공통 입력 경계를 검토한 뒤 Impeccable Polish로 색·간격·오류 상태를 마무리했다. 새 페이지/통계/모션을 추가하지 않았다.

## 실제 변경

- `color.border.focus`: palette의 neutral-focus.light/dark를 통해 밝음#52606d, 어두움#b0bbc4. 기존 의미 토큰이므로 CSS·Tailwind·TS/RN·Ionic 생성 결과에 함께 전달된다.
- Input/TextField/Textarea/native Select/Choice/NumberInput/DatePicker/MonthPicker/DateRangePicker: 2px 초점선을 -2px offset으로 박스 안쪽 정렬. 복합 입력은 기존 wrapper 초점선 하나를 유지한다.
- 오류 입력은 -3px로 기존1px 오류 테두리를 보존한다. 달력 팝업 초점색도 border.focus를 사용한다. 작은 컨트롤은 기존 컴포넌트별 위치를 유지한다.
- Solid/React/Vue/Svelte는 같은 공유 CSS와 토큰을 사용한다. 기존 제품의 명시적 토큰 override나 고정된 구버전은 자동으로 바뀌지 않는다.
- changeset은 tokens/css patch 두 항목. 12개 공개 패키지 fixed group의 정상 버전/발행 절차를 사용한다.

## 검증 근거

- base `78a173c`의 새 branch `sexysinny/dds-neutral-inset-focus`. 이전 dental-common-controls 브랜치와 파일을 되돌리지 않았다. 원격 조회에서 기존 PR121과0.29.1 발행 완료를 확인한 뒤 새 패치로 분리했다.
- `pnpm install --frozen-lockfile`: exit0, lockfile diff 없음. 초기 source fixture의 solid-virtual resolve 실패는 설치된 의존성이 lock과 달랐던 문제로, 설치 후 원래 시작한 서버만 재기동했다.
- `node packages/dds-tokens/build.mjs`:8개 생성 성공. `node packages/dds-tokens/scripts/validate-tokens.mjs`:134경로 및 light/dark parity 통과.
- `node packages/dds-css/build.mjs`:33개 CSS bundle/component 생성 성공. `node packages/dds-css/scripts/check-css.mjs`: hardcoded색 없음, source/bundle동기화 통과.
- `node scripts/check-docs-sync.mjs`: en/ko spec 및 preview/token 동기화 통과. `git diff --check`: exit0.
- 실제 원본 Solid fixture(Vite 단독, 자동 runner 아님) `http://127.0.0.1:5282/`: Input/Choice/Number/Date/Time/Month/Range를 직접 키보드로 이동. 기본 focus색과 안쪽2px 확인. 값을 제출하거나 외부에 전달하지 않았다.
- 실제 생성 CSS 미리보기 `http://127.0.0.1:8770/preview/components.html`: 밝음·어두움 오류 TextField의 붉은1px border와 중립2px focus가 동시에 보임. native Select·오류 Textarea도 확인했다. PNG·AX·DOM계산값은 같은 폴더에 보존했다.
- 독립 정적 리뷰에서 초기 오류 border 가림을 발견했고, 오류 상태 -3px 예외와 실제 두 테마 이미지로 해결 확인했다.

이 문서는 패키지 발행 전 소스/부분 수동 검수 기록이다. 모든 프레임워크·폭·상태의 실검수 통과나 npm 발행 완료로 대신하지 않는다. 발행은 정상 PR CI → 병합 → Changesets 릴리스 PR → 검증 후 npm 발행 및 registry 확인 순서로 이어간다. FM의 기존 자동 검사/앱 배포 제한은 유지한다.

## 발행 검증의 최초 실패와 수정

- PR122 최초 head `baff33202765958045395ea24b301b98b5019dd5`의 CI run `40106128250`, verify job `120908136902`는 Svelte 발행 모의검증에서 실패했다. Svelte 빌드와 앞 단계는 통과했으나 npm이 이미 공개된 `0.29.1`의 publish dry-run을 거부했다. [최초 실패 로그](https://github.com/devslab-kr/dds/actions/runs/40106128250/job/120908136902)를 보존한다.
- `verify-svelte-release.mjs`를 기존 Vue 검증과 동일하게 수정했다. 이미 발행된 버전이라는 정확한 registry 충돌만 구분하며, 다른 실패는 다시 던진다. tarball의 exports/types/styles/license 및 별도 소비 앱 SSR·클라이언트 검증은 그대로 필수다. 실제 npm 발행이나 CI 기준 완화는 하지 않았다.
- 수정 후 `pnpm run verify:svelte:release`: exit0. 기존 버전 충돌을 명시한 뒤 패키지 구성과 별도 소비 앱의 SSR·클라이언트 마운트 검증을 통과했다. 이 결과는 새 head의 전체 CI 또는 npm 발행 완료를 대신하지 않는다.
