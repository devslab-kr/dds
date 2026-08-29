# CLAUDE.md — DDS 작업 지시서

이 레포는 **DDS (DevsLab Design System)** — 데브스랩 제품군(devslab.kr,
AskLinq, BookLinq, FlowLinq, 이후의 모바일 앱)이 공유하는 디자인 언어의
단일 저장소다. 여기서 작업하는 세션은 아래 규칙을 따른다.

## 진실의 원천 (변경 전 반드시 읽기)

1. **`docs/design-system.ko.md`** — 규칙 명세 v0. 모든 설계 결정의 기준.
   영어 미러는 `docs/design-system.md`이며 **두 파일은 항상 함께 수정**한다.
2. **`tokens/*.json`** — Phase 0 산출물 (W3C Design Tokens 포맷).
   문서의 표와 토큰 JSON이 어긋나면 안 된다 — 한쪽을 고치면 다른 쪽도 고친다.
3. **`preview/index.html`**, **`brand/index.html`** — 토큰 값을 하드코딩으로
   반영한 단일 파일 미리보기. 토큰 값이 바뀌면 여기도 동기화한다.

## 절대 불변 규칙 (스펙 요약 — 위반하는 코드/문서를 만들지 말 것)

- **토큰이 유일한 진실.** 컴포넌트·예제 코드에 hex/px 하드코딩 금지.
  컴포넌트는 시맨틱 토큰만 참조하고, 원시 팔레트(`palette.*`) 직접 참조는
  시맨틱 매핑 정의부에서만 허용.
- **브랜드 기준은 devslab.kr.** Electric Cyan `#06B6D4`(hover `#22D3EE`) +
  zinc 뉴트럴. **라이트가 기본, 다크는 토글**이며 두 매핑 모두 1급.
  다크모드는 시맨틱 매핑 교체만으로 얻는다 — `if (dark)` 분기 금지.
- **on-brand 규칙.** cyan 면 위 텍스트는 흰색 금지, `zinc.950` 사용
  (흰색은 대비 2.3:1로 WCAG AA 미달).
- **폰트.** Geist(라틴·숫자) / Geist Mono(코드·라벨), 한글은 Pretendard →
  시스템 고딕 폴백.
- **프레임워크 중립.** 코어는 토큰 + CSS. React/Vue/Ionic/RN은 소비자.
  프레임워크별 패키지는 **그 프레임워크 제품이 실제로 존재할 때만** 만든다.
- **접근성 최소선.** 텍스트 대비 4.5:1, 터치 타깃 44×44(모바일)/24×24(웹),
  focus-visible 링, 아이콘 단독 버튼 라벨 필수, 모션 감소 설정 존중.
- **오버레이·틴트는 알파 스케일로만.** `opacity`로 때우는 건 disabled 전용.

## 작업 컨벤션

- 문서는 영/한 쌍(`*.md` + `*.ko.md`)으로 유지한다.
- 파운데이션(§3) 변경은 전 제품에 영향 — `docs/decisions.md`(없으면 생성,
  asklinq의 Decision Log 형식)에 결정 기록을 남긴다.
- 패키지가 생기면 lockstep semver (tokens/css/native 같은 버전 트레인).
  토큰 이름 변경·삭제 = breaking.
- **토큰을 바꿨으면 소비자 사본까지가 그 작업이다.** D-009로 소비자는
  커밋 사본을 들고 있으므로, 여기서 값이 바뀌면 asklinq·devslab이 낡는다.
  `pnpm run check`가 `scripts/check-consumers.mjs`로 이를 잡는다(로컬 전용 —
  체크아웃이 없는 소비자는 실패가 아니라 skip). 걸리면 해당 레포에서
  재동기화하고 **거기서 커밋**한다.
- main 직접 푸시는 문서·토큰 수정까지만. 빌드 파이프라인 등 구조 변경은
  브랜치 + PR로.

## 다음 할 일

우선순위 백로그: **`docs/backlog.md`** — 새 세션은 여기서 P1 최상단 항목부터
집는다. 항목을 시작/완료하면 백로그의 상태를 갱신한다.
