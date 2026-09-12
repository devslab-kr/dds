# DDS 컴포넌트 — v1 인벤토리 (`@devslab/dds-css`)

🌐 [English](components.md)

클래스 기반·프레임워크 중립 CSS 컴포넌트. 전부 시맨틱 토큰(`var(--dds-*)`)만
참조합니다 — `@devslab/dds-tokens/tokens.css`를 먼저 로드하고
`@devslab/dds-css/dds.css`(또는 `components/`의 개별 파일)를 로드하세요.
다크 모드에 컴포넌트 변경은 없습니다: `<html>` 또는 임의 서브트리에
`data-theme="dark"` (`data-theme="light"`로 되고정 가능).

모든 인터랙티브 컴포넌트는 스펙 §4.2의 전체 상태 세트(default → hover →
pressed → focus-visible → disabled → loading)를 정의하고 §6 접근성
최소선(텍스트 대비 4.5:1, 웹 클릭 타깃 ≥24×24, 키보드 도달 + 2px 포커스 링,
색 단독 신호 금지)을 통과합니다.

라이브 레퍼런스: `preview/components.html` (먼저 `pnpm build`).

출하 목록(스펙 §4.3 v1 인벤토리): Button, IconButton, TextField, Textarea,
Select, Checkbox/Radio, Switch, Badge, Chip, Avatar, Spinner, Skeleton,
Divider, Card, ListRow, Tabs, Dialog(웹 Modal), Toast, Tooltip(웹),
EmptyState. **BottomSheet은 의도적으로 없습니다** — Dialog의 네이티브 짝이고
이 패키지는 웹 CSS입니다. 역할 매핑(웹 Modal ↔ 네이티브 BottomSheet)은
스펙 §4.3·§5에 문서화돼 있고, 네이티브 구현은 네이티브 소비자가 생길 때
(Phase 3) 만듭니다.

---

## Button — `.dds-btn`

```html
<button class="dds-btn dds-btn--primary">저장</button>
<button class="dds-btn dds-btn--secondary dds-btn--sm">취소</button>
<button class="dds-btn dds-btn--primary" aria-busy="true">
  <span class="dds-spinner" aria-hidden="true"></span>저장 중…
</button>
```

- variant: `--primary` `--secondary` `--ghost` `--danger`. size: `--sm`(32px)
  / 기본(40px) / `--lg`(48px) — 높이는 간격 스케일에서.
- 상태: hover/pressed는 토큰으로(`bg.brand-hover`, 알파 틴트); disabled는
  `[disabled]`(opacity 0.45 — 유일하게 허용되는 opacity 상태); loading은
  `aria-busy="true"` + `.dds-spinner` 자식(포인터 차단, "저장 중…" 같은
  접근 가능한 이름 유지).
- **접근성**: primary 텍스트는 `on-brand`(zinc.950, 약 8:1 — 스펙 §3.1 노트);
  danger 텍스트는 `on-status`(라이트=흰색, 다크=zinc.950); 포커스 링 2px
  `border.focus` + offset 2px; 아이콘 단독 버튼은 `aria-label` 필수.
- **링크를 버튼으로**: `<a class="dds-btn dds-btn--primary" href="…">`도 같은
  모양 — 기본 규칙이 앵커 밑줄을 지우므로 소비자 쪽 보정 CSS가 필요 없습니다.
- **Do**: 화면당 primary 하나. danger는 확인 단계와 함께.
- **Don't**: 비활성을 ghost로 흉내내지 말 것 — `[disabled]`를 써야 탭 순서에서
  빠지고 AT에 올바르게 읽힙니다.

## IconButton — `.dds-iconbtn`

```html
<button class="dds-iconbtn" aria-label="닫기">
  <svg aria-hidden="true" width="20" height="20">…</svg>
</button>
<button class="dds-iconbtn dds-iconbtn--secondary dds-iconbtn--sm" aria-label="수정">…</button>
<button class="dds-iconbtn dds-iconbtn--danger" aria-label="자료 삭제">…</button>
```

- variant: 기본(ghost) / `--secondary`(보더) / `--danger`. size: `--sm`(32)
  / 기본(40) / `--lg`(48) — `.dds-btn`과 같은 높이라, 옆의 텍스트 버튼과
  몇 px 어긋나는 일이 생기지 않습니다.
- 아이콘은 `currentColor`를 상속합니다. `<svg>`에는 `aria-hidden="true"`.
- **접근성**: `aria-label` 필수 — 아이콘에는 접근 가능한 이름이 없습니다.
  `--sm`(32×32)은 웹 최소선 24×24는 넘지만 터치 타깃 44×44에는 못 미칩니다.
  터치 화면에서는 기본 크기를 쓰세요.
- **Do**: 발견성을 위해 Tooltip과 함께 쓰되, 진짜 이름은 `aria-label`로
  유지(툴팁은 `aria-describedby`이지 라벨이 아닙니다).
- **Don't**: 한 액션 행에서 크기를 섞지 말 것 — 하나를 정하고 그 행의 모든
  액션을 같은 크기로.

## TextField — `.dds-field` / `.dds-input`

```html
<div class="dds-field">
  <label class="dds-field__label" for="email">이메일</label>
  <input class="dds-input" id="email" type="email"
         aria-invalid="true" aria-describedby="email-help">
  <span class="dds-field__help" id="email-help">이메일 형식이 아닙니다.</span>
</div>
```

- 에러: 래퍼에 `.dds-field--error` (또는 input에 `aria-invalid="true"` —
  둘 다 보더를 칠하지만 AT에도 들리도록 aria-invalid를 쓰세요).
- **접근성**: 항상 진짜 `<label for>`; 에러/헬프는 `aria-describedby`로 연결;
  빨간 보더가 유일한 에러 신호가 아니어야 함 — 메시지는 헬프 줄이 나릅니다
  (§6 색 단독 금지).
- **Do**: 헬프 텍스트를 평상시에도 유지해 에러 전환 시 레이아웃이 튀지 않게.
- **Don't**: `placeholder`를 라벨로 쓰지 말 것 — 입력하면 사라지고 라벨
  대용으로는 대비도 미달입니다.

## Textarea — `.dds-textarea`

```html
<div class="dds-field">
  <label class="dds-field__label" for="intro">회사 소개</label>
  <textarea class="dds-textarea" id="intro" rows="4"
            aria-describedby="intro-help"></textarea>
  <span class="dds-field__help" id="intro-help">방문자에게 표시됩니다.</span>
</div>
```

- `.dds-input`과 같은 `.dds-field` 래퍼 안에 삽니다 — 라벨·헬프·에러
  (`.dds-field--error` / `aria-invalid`) 동작이 동일합니다.
- `min-height`는 컨트롤 높이의 두 배, `resize: vertical`(가로 리사이즈는
  폼이 올라앉은 그리드를 깨뜨립니다).
- **Do**: textarea는 자기 행을 갖습니다. 한 줄 컨트롤과 textarea를 한 행에
  동거시키는 것은 이 집의 반려 기준입니다 — 한쪽을 억지로 줄이지 않고는
  높이를 맞출 수 없습니다.
- **Don't**: 옆 컨트롤을 줄여서 높이를 맞추지 말 것. 실제로 긴 글을 받는
  칸이라면 resize를 완전히 막지도 말 것.

## Select — `.dds-select` / `.dds-select__input`

```html
<div class="dds-field">
  <label class="dds-field__label" for="locale">언어</label>
  <span class="dds-select">
    <select class="dds-select__input" id="locale">
      <option>한국어</option><option>English</option>
    </select>
  </span>
</div>
```

- 진짜 `<select>`(키보드·모바일 피커·폼 시맨틱 그대로)에 네이티브 화살표만
  래퍼의 셰브론으로 교체했습니다. **네이티브 화살표 방치는 반려 기준** —
  같은 컨트롤이 플랫폼마다 다르게 보이고 옆의 입력 필드와도 안 맞습니다.
- 래퍼 `.dds-select`는 필수(셰브론을 그립니다). 요소 자체의 클래스는
  `.dds-select__input`입니다.
- **접근성**: 다른 필드와 똑같이 `<label for>`로 라벨링. 셰브론은
  `pointer-events: none`이라 클릭은 항상 select에 닿습니다.
- **Do**: 옵션 목록은 데이터에서(distinct 값). 고정 리스트 박제 금지.
- **Don't**: 전체 ARIA listbox 패턴을 구현할 게 아니라면 `<select>`를
  div+listbox로 바꾸지 말 것.

## Checkbox / Radio — `.dds-check` / `.dds-check__input`

```html
<label class="dds-check">
  <input class="dds-check__input" type="checkbox" checked>
  주간 다이제스트 받기
</label>
<label class="dds-check">
  <input class="dds-check__input" type="radio" name="cadence" value="daily">
  매일
</label>
```

- 하나의 클래스로 둘 다: input의 `type`이 모양을 정합니다(사각형+체크 vs
  원+도트). "일부 선택" 헤더용 `:indeterminate`도 스타일됩니다.
- 체크/도트는 `on-brand`(zinc.950)이지 흰색이 아닙니다 — primary 버튼과
  같은 규칙(스펙 §3.1).
- **접근성**: 텍스트를 `<label>` 안에 넣어 행 전체가 히트 영역이 되게
  하세요(18px 박스만으로는 터치 최소선 미달). disabled는 라벨에서 한 번만
  흐려집니다(박스에서 또 흐려져 겹치지 않게).
- **Do**: 제출 시 반영되는 택1은 radio, 독립 옵션은 checkbox.
- **Don't**: 즉시 반영되는 설정에 checkbox를 쓰지 말 것 — 그건 Switch입니다.

## Switch — `.dds-switch` / `.dds-switch__input`

```html
<label class="dds-switch">
  <input class="dds-switch__input" type="checkbox" role="switch" checked>
  문의 알림
</label>
```

- 즉시 반영되는 on/off. 트랙 36×20, 노브 16(간격이 아니라 글리프
  지오메트리). 브랜드로 채워진 트랙 위에서 노브는 `on-brand`가 됩니다 —
  cyan 위에 흰색을 올리지 않는 그 규칙과 같습니다.
- `prefers-reduced-motion`에서 트랜지션이 제거됩니다.
- **접근성**: input에 `role="switch"`를 줘야 AT가 체크/해제가 아니라
  켬/끔으로 읽습니다. 라벨 텍스트가 접근 가능한 이름입니다.
- **Do**: 변경은 즉시 적용하고 실패는 토스트로 알릴 것 — 조용한 무반응은
  반려 기준입니다.
- **Don't**: 스위치 옆에 저장 버튼을 두지 말 것. 저장이 필요한 값이면
  checkbox입니다.

## Badge — `.dds-badge`

```html
<span class="dds-badge dds-badge--success">연결됨</span>
```

- variant: `--brand` `--success` `--warning` `--danger` `--info`.
- 색은 항상 페어 세트(진한 전경 + `-bg` 틴트, 스펙 §3.1); 앞의 도트가 톤을
  반복해 색이 유일한 신호가 되지 않습니다.
- **Do**: 상태 표시용으로만. 액션에는 버튼.
- **Don't**: 새 전경/배경 조합을 만들지 말 것 — 페어가 토큰의 계약입니다
  (`status.*` + `status.*-bg`).

## Chip — `.dds-chip`

```html
<button class="dds-chip" aria-pressed="true">미답변</button>
<button class="dds-chip">웹페이지</button>
<button class="dds-chip" disabled>보관됨</button>
```

- 작은 **인터랙티브** 컨트롤: 필터 토글, 추천 질문, 삭제 가능한 태그.
  Badge와 Chip은 일부러 다른 컴포넌트입니다 — 배지는 읽는 상태, 칩은 누르는
  것. 한쪽을 다른 쪽으로 재스타일하지 마세요(중복 정의된 `.chip` 하나가
  이미 실사고를 냈습니다).
- 선택 상태는 `aria-pressed="true"`(AT에 읽힘). `--selected`는
  `aria-pressed`를 쓸 수 없는 마크업(링크 칩 등) 전용입니다.
- **Do**: 칩은 한 줄 높이로 유지하고 행을 스크롤시킬 것. 라벨은 값 그대로
  ("필터 1" 같은 이름 금지).
- **Don't**: 화면의 주요 액션을 칩으로 만들지 말 것 — 그건 Button입니다.

## Avatar — `.dds-avatar`

```html
<span class="dds-avatar" aria-hidden="true">강신</span>
<span class="dds-avatar dds-avatar--lg">
  <img class="dds-avatar__img" src="/u/12.jpg" alt="">
</span>
<span class="dds-avatar dds-avatar--square dds-avatar--sm" aria-hidden="true">DL</span>
```

- 크기 32 / 40 / 48은 간격 스케일에서 — 리스트 행에서 같은 크기의 컨트롤과
  줄이 맞습니다. 회사·테넌트 마크에는 `--square`(로고를 원으로 자르면
  잘립니다).
- 이니셜은 brand-subtle 페어를 쓰므로 제품 브랜드 색으로 함께 재착색됩니다.
- **접근성**: 행에 이미 이름이 있으면 아바타는 장식입니다 — 이니셜에는
  `aria-hidden="true"`, 이미지에는 `alt=""`. 아바타가 **유일한** 식별
  수단일 때만 이름을 주세요.
- **Do**: 이니셜은 행에 표시되는 그 이름 문자열에서 파생.
- **Don't**: 아바타 안에 상태 텍스트를 넣지 말 것 — 옆에 Badge를.

## Spinner `.dds-spinner` / Skeleton `.dds-skeleton`

```html
<span class="dds-spinner" role="status" aria-label="불러오는 중"></span>

<div aria-busy="true">
  <span class="dds-skeleton dds-skeleton--circle" aria-hidden="true" style="width:40px;height:40px"></span>
  <span class="dds-skeleton dds-skeleton--text" aria-hidden="true" style="width:60%"></span>
</div>
```

- Spinner는 `currentColor` 상속(primary 버튼 안에서도 올바른 색). 단독
  사용 시 `role="status"` + `aria-label` 필수. 모션 감소 설정에서는 멈추지
  않고 느려집니다 — 멈춘 스피너는 행(hang)으로 읽힙니다.
- Skeleton 채움은 알파 틴트(두 테마의 default·subtle 배경 모두에서 자연스러움).
  크기는 소비자 몫(width/height); `--text`는 한 줄, `--circle`은 아바타.
  영역에 `aria-busy="true"`, 스켈레톤 요소는 `aria-hidden="true"`; 펄스는
  모션 감소 설정에서 정지.
- **Do**: 콘텐츠 모양의 대기는 skeleton, 액션 진행은 spinner.
- **Don't**: 스켈레톤 하나하나를 AT에 알리지 말 것 — busy 영역 하나면 충분.

## Divider — `.dds-divider`

```html
<hr class="dds-divider">
<div style="display:flex">A<hr class="dds-divider dds-divider--vertical">B</div>
```

- `--vertical`은 늘어나는 부모(flex 행 / 그리드 셀)가 필요합니다.
- **Do**: 구분이 의미를 가지면 `<hr>`로, 순수 장식이면
  `role="presentation"`을 추가.
- **Don't**: 이미 간격이 그룹을 나누고 있는 자리에 구분선을 또 넣지 말 것 —
  구분자 둘이 겹치면 소음입니다.

## Card — `.dds-card`

```html
<section class="dds-card">
  <h3 class="dds-card__title">재크롤 일정</h3>
  <p class="dds-card__body">매일 04:00(KST)에 자료를 다시 읽습니다.</p>
</section>
<section class="dds-card dds-card--subtle">…</section>
```

- 보더 + `bg.elevated` + `elevation.1`. 그림자 토큰은 두 테마에 그대로
  출하됩니다 — zinc.950 페이지 위에서는 거의 보이지 않고, 그게 의도한 다크
  모습입니다. **컴포넌트는 테마로 분기하지 않습니다**(스펙 §3.1).
- `--subtle`은 이미 떠 있는 면(다이얼로그 안의 카드)에서 쓰는 납작한
  변형입니다 — 그림자를 두 번 겹치면 소음이 됩니다.
- **Do**: 카드 하나 = 주제 하나. 액션은 카드 안 버튼 행으로.
- **Don't**: 카드 안에 온전한 카드를 중첩하지 말 것 — `--subtle`이나
  Divider를 쓰세요.

## ListRow — `.dds-listrow`

```html
<ul style="list-style:none;margin:0;padding:0">
  <li><button class="dds-listrow dds-listrow--interactive">
    <span class="dds-avatar dds-avatar--sm" aria-hidden="true">강신</span>
    <span class="dds-listrow__body">
      <span class="dds-listrow__title">강신</span>
      <span class="dds-listrow__sub">대표 · 초대함</span>
    </span>
    <span class="dds-badge dds-badge--success">활성</span>
  </button></li>
</ul>
```

- 슬롯: 앞쪽(임의의 flex 자식), `__body`(`__title` + `__sub`),
  `__actions`. 행끼리 스스로 구분됩니다(`+ .dds-listrow`가 줄을 그립니다).
- 행 자체가 컨트롤이면 `--interactive` — 진짜 `<button>`이나 `<a>`를 쓰세요.
  포커스 링은 안쪽으로 그립니다(가장자리까지 채운 행에는 바깥 여백이 없음).
- 긴 제목은 말줄임 처리되고 행 높이는 일정하게 유지됩니다.
- **Do**: 행을 자기완결형으로 — 정보가 행에 들어가면 상세 페이지로 미루지
  않습니다.
- **Don't**: 삭제·수정이 가능한 행에 인라인 아코디언을 넣지 말 것 — 조작 후
  재렌더가 열림 상태를 파괴합니다. 전용 뷰로.

## Tabs — `.dds-tabs` / `.dds-tab`

```html
<div class="dds-tabs" role="tablist">
  <button class="dds-tab" role="tab" aria-selected="true" aria-controls="p1" id="t1">자료</button>
  <button class="dds-tab" role="tab" aria-selected="false" aria-controls="p2" id="t2">방문자 질문</button>
</div>
<div role="tabpanel" id="p1" aria-labelledby="t1">…</div>
```

- 잉크 언더라인 탭. 넘치면 가로 스크롤됩니다(관리자 셸의 모바일 동작).
- 선택은 `aria-selected`이지 클래스 단독이 아닙니다 — 상태가 읽혀야 하고,
  밑줄이 그것을 반복하므로 색이 유일한 신호가 아닙니다.
- **접근성**: `role="tablist"`/`tab`/`tabpanel` + `aria-controls`·
  `aria-labelledby`. 화살표 키 로빙 포커스는 소비자 JS의 몫입니다.
- **Do**: 탭은 성격별로 묶고 새 기능은 그 그룹 안 자명한 자리에 — 전부
  평면으로 나열하면 이름만 바뀐 카드 스택입니다.
- **Don't**: `[hidden]`을 이기는 `display` 규칙으로 패널을 숨기지 말 것
  (바로 그 충돌이 채워진 표 위에 빈 상태를 그린 적이 있습니다).

## Dialog — `.dds-dialog`

```html
<div class="dds-dialog-overlay">
  <div class="dds-dialog" role="dialog" aria-modal="true" aria-labelledby="t">
    <h2 class="dds-dialog__title" id="t">자료를 다시 색인할까요?</h2>
    <p class="dds-dialog__body">수정 내용이 답변에 즉시 반영됩니다.</p>
    <div class="dds-dialog__actions">
      <button class="dds-btn dds-btn--ghost dds-btn--sm">나중에</button>
      <button class="dds-btn dds-btn--primary dds-btn--sm">색인하기</button>
    </div>
  </div>
</div>
```

- 네이티브 `<dialog class="dds-dialog">`도 스타일됩니다(`::backdrop` 포함).
- 행동 계약(스펙 §5): 바깥 탭·Esc로 닫힘; 열릴 때 포커스 진입, 열려 있는 동안
  트랩, 닫히면 열었던 요소로 복귀 — 여는 코드의 몫입니다 (네이티브
  `<dialog>.showModal()`이 대부분을 줍니다).
- **접근성**: `aria-modal="true"` + 제목으로 `aria-labelledby`.
- **Do**: 액션은 우측 정렬, primary가 마지막 (데브스랩 관리 화면들의 모달
  관례와 동일).
- **Don't**: 다이얼로그 중첩 금지; 비차단 알림에 쓰지 말 것 — 그건 토스트의 일.

## Toast — `.dds-toast`

```html
<div class="dds-toast-region" role="status">
  <div class="dds-toast dds-toast--success">색인이 끝났습니다.</div>
  <div class="dds-toast dds-toast--danger" role="alert">발송에 실패했습니다.</div>
</div>
```

- 리전은 우하단 고정, 그리드 갭으로 스택. variant가 상태 도트를 추가(배지와
  같은 6px 도트). 진입 애니메이션은 `duration.base` + `easing.enter`,
  모션 감소 설정에서 제거.
- **접근성**: 리전 `role="status"`(polite); `role="alert"`는 danger 토스트에만.
  자동 닫힘은 hover/focus 시 일시정지(소비자 JS).
- **Do**: 실패한 액션에는 반드시 토스트 — 조용한 무반응은 이 집의 반려
  기준입니다.
- **Don't**: 필수 액션을 토스트에만 두지 말 것(사라집니다); 3개 이상 쌓지
  말고 오래된 것부터 접기.

## Tooltip — `.dds-tooltip` / `.dds-tooltip__bubble`

```html
<span class="dds-tooltip">
  <button class="dds-iconbtn" aria-label="재크롤" aria-describedby="tp1">
    <svg aria-hidden="true" width="20" height="20">…</svg>
  </button>
  <span class="dds-tooltip__bubble" role="tooltip" id="tp1">지금 다시 읽기</span>
</span>
```

- 웹 전용(스펙 §4.3). 네이티브에는 hover가 없으므로 같은 정보는 라벨이나
  시트로 갑니다.
- hover **와** `:focus-within` 양쪽에서 열려 키보드로 도달 가능합니다.
  버블은 `bg.inverse` / `text.on-inverse` 위에 그려집니다(D-011).
- **접근성**: `aria-label`이 아니라 `aria-describedby`로 연결하세요 —
  컨트롤은 자기 이름을 유지하고, describedby 버블은 시각적으로 열리지
  않아도 AT에 도달합니다.
- **Do**: 아이콘 단독 컨트롤의 이름, 짧은 단위 힌트에.
- **Don't**: 컨트롤을 쓰는 데 **필요한** 정보를 툴팁에 넣지 말 것 — 터치에서
  볼 수 없고 스크롤하면 사라집니다.

## EmptyState — `.dds-empty`

```html
<div class="dds-empty">
  <p class="dds-empty__title">등록된 자료가 없습니다</p>
  <p class="dds-empty__desc">웹페이지 주소나 PDF를 추가하면 AI가 그 내용으로 답합니다.</p>
  <div class="dds-empty__actions">
    <button class="dds-btn dds-btn--primary dds-btn--sm">자료 추가</button>
  </div>
</div>
```

- 빈 화면도 채워진 화면과 **같은 골격**을 보여줍니다 — 요약 칩과 필터는
  그대로 두고, 빈 상태는 화면이 아니라 행들을 대체합니다.
- `__actions`에 다음 행동을 반드시 이름 붙이세요. 나갈 길 없는 빈 상태는
  막다른 골목입니다.
- **접근성**: 경고가 아니라 평범한 콘텐츠입니다. 검색 결과로 나타난
  경우라면 결과 개수를 라이브 리전에 넣으세요.
- **Do**: "아직 없음"(온보딩 문구)과 "일치하는 게 없음"(필터 해제 유도)을
  구분할 것.
- **Don't**: `[hidden]`을 이기는 `display` 규칙으로 토글하지 말 것 —
  `.dds-empty[hidden]` 가드가 여기 있는 이유가 그것입니다.

---

## v1 이후 컴포넌트

아래 두 섹션은 위 스펙 §4.3 v1 인벤토리 **이후**에 출하됐고 그 목록에
속하지 않습니다 — `Table`과 `Console shell`은 콘솔 컴포넌트를 DDS로 옮긴
작업에서 왔습니다(`docs/decisions.md` D-021). 참조 방식은 위 섹션들과
동일합니다(실제 출하된 클래스만, 사용 예시, 접근성 노트, Do/Don't).

## Table — `.dds-table`

```html
<div class="dds-table-wrap">
  <table class="dds-table dds-table--fixed">
    <caption class="dds-visually-hidden">작업</caption>
    <colgroup>
      <col style="width: 60%" />
      <col data-fold style="width: 40%" />
    </colgroup>
    <thead>
      <tr>
        <th scope="col" data-column="name" aria-sort="ascending">
          <button type="button" class="dds-table__sort" aria-label="이름으로 정렬">
            이름
            <span class="dds-table__sort-mark" aria-hidden="true" data-sort-state="ascending"></span>
          </button>
        </th>
        <th scope="col" data-column="count" data-fold data-numeric>건수</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th scope="row">재색인</th>
        <td data-fold data-numeric>12</td>
      </tr>
    </tbody>
  </table>
</div>
<nav class="dds-table__pagination" aria-label="다음 페이지">
  <a class="dds-btn dds-btn--secondary" href="?cursor=abc">다음 페이지</a>
</nav>
```

- 래퍼: `.dds-table-wrap`은 넘치면 가로로 스크롤되고,
  절대 위치로 클리핑되는 `.dds-visually-hidden` caption이 페이지가 아니라
  이 박스를 기준으로 클리핑되게 해주는 포지셔닝 조상입니다. `--tall`은
  70vh로 높이를 제한하고 헤더(`thead th`)를 `position: sticky`로 고정합니다.
- 밀도·레이아웃: `.dds-table--dense`는 행 높이를 `--dds-space-40` 토큰(40px)
  에서 2.25rem(36px)으로 줄입니다. `.dds-table--fixed`는
  `table-layout: fixed`로 바꾸고 `<colgroup>`을 기대하는데, 컴포넌트는
  어떤 컬럼이든 `width`를 선언하는 순간 둘 다 자동으로 적용합니다.
- 정렬: `.dds-table__sort`는 정렬 가능한 헤더의 버튼(클라이언트 정렬
  가능한 컬럼에서만 렌더링)이고, `.dds-table__sort-mark`는 그 화살표로
  `data-sort-state` 속성에 `"none"`/`"ascending"`/`"descending"`을
  담습니다 — 헤더 자신의 `aria-sort`가 담는 것과 같은 세 값입니다.
- `.dds-table__order`는 소비자가 정렬 버튼 대신 실제 순서 문장을 넘겼을 때
  (아래 `sort` prop 참고) 테이블 위에 그 문장을 렌더링합니다.
- `.dds-table__actions`는 트레일링 액션 셀의 내용을 오른쪽 정렬하고, 액션
  컬럼 자체의 헤더는 `.dds-visually-hidden` 유틸리티를 써서 화면엔
  안 보여도 접근성 이름은 갖습니다.
- `.dds-table__pagination`은 라벨 붙은 `<nav>`가 평범한
  `.dds-btn.dds-btn--secondary` 링크를 감싼 것입니다 — 버튼이 아닙니다 —
  덕분에 커서 페이징이 JavaScript 없이도 동작합니다. 다음 페이지가 없으면
  통째로 `[hidden]`입니다.
- 속성 훅: `[data-fold]`는 접을 수 있는 컬럼(`<col>`·`<th>`·`<td>`)을
  표시하며 `56.25rem`(900px) 아래에서 순수 미디어 쿼리로(JavaScript 없이)
  통째로 숨깁니다. `[data-numeric]`은 셀을 오른쪽 정렬하고 고정폭
  숫자체를 줍니다. `[data-sort-state]`(위)는 세 정렬 상태를 담습니다.
  `[data-column]`은 소비자 자신의 훅을 위해 컬럼 이름을 붙일 뿐 CSS는
  전혀 갖지 않습니다.
- **접근성**: caption은 실제로 존재하고 시각적으로만 숨겨져 있습니다.
  정렬 가능한 헤더는 `aria-label`이 붙은 진짜 `<button>`이지, 클릭만
  가능한 맨 `<th>`가 아닙니다. 테이블당 정확히 한 컬럼만 `<td>` 대신
  `<th scope="row">`로 렌더링해야 합니다.
- **Do**: 모든 테이블에 caption을 주세요 — 시각적으로 숨겨도 좋습니다.
  테이블의 접근성 이름이 그것입니다.
- **Don't**: 서버가 정렬한 데이터를 보여주는 테이블에 정렬 버튼을 달지
  마세요 — 페이징된 한 조각만 클라이언트에서 정렬하면 전체 목록의 순서를
  잘못 보고하게 되므로, 이 마크업은 그 경우(`sort`의 `{ statedOrder }`
  형태 — `@devslab/dds-table`의 README 참고)에 버튼을 아예 렌더링하지
  않습니다.

## Console shell — `.dds-console-shell`

```html
<div class="dds-console-shell" data-surface="dashboard" data-hydrated="true">
  <a class="dds-console-skip dds-visually-hidden" href="#dds-console-main">본문으로 건너뛰기</a>
  <button class="dds-console-rail__toggle" type="button" aria-controls="dds-console-rail" aria-expanded="false">
    <span aria-hidden="true"></span>
  </button>
  <div class="dds-console-rail__scrim" data-open="false"></div>
  <aside id="dds-console-rail" class="dds-console-rail" data-open="false">
    <a class="dds-console-rail__brand" href="/">
      <img src="/mark.svg" alt="" width="20" height="20" /><strong>Acme</strong>
    </a>
    <nav class="dds-console-rail__nav" aria-label="대시보드 내비게이션">
      <section class="dds-console-rail__group" aria-labelledby="g1">
        <h2 id="g1" class="dds-console-rail__group-label">오늘</h2>
        <ul>
          <li><a class="dds-console-rail__item" href="/overview" aria-current="page">
            개요
            <span class="dds-console-rail__badge" aria-label="3건 대기">3</span>
          </a></li>
        </ul>
      </section>
    </nav>
  </aside>
  <main id="dds-console-main" class="dds-console-main" tabindex="-1">
    <header class="dds-console-page-header">
      <div class="dds-console-page-header__text">
        <p class="dds-console-page-eyebrow">Acme</p>
        <h1>개요</h1>
      </div>
    </header>
    …
  </main>
</div>
```

- 레이아웃: `.dds-console-shell`은 14.5rem(232px) 레일 + 본문 CSS
  그리드입니다. `56.25rem`(900px) 아래 — 테이블의 `[data-fold]`와 같은
  분기점이라, 한 콘솔 안에서 레일과 접히는 컬럼이 같은 뷰포트 폭에서
  함께 모양을 바꿉니다 — 에서 그리드는 한 열로 접히고 `.dds-console-rail`은
  고정된 오프캔버스 드로어가 됩니다.
- 레일 구성 요소: `.dds-console-rail__brand`, `__context`(라벨/값 행의
  `<dl>`), `__nav`, 라벨 붙은 섹션마다 하나씩인 `__group`(+
  `__group-label`), `__item`(hover·`:focus-visible`·`aria-current="page"`
  상태 포함), `__badge`(대기 건수 알약), `margin-block-start: auto`로
  바닥에 고정되는 `__foot` 슬롯.
- 드로어(900px 아래에서만 작동): `.dds-console-rail__toggle`은 분기점
  위에서는 `display: none`이고 아래에서 고정 햄버거 버튼이 됩니다.
  `.dds-console-rail__scrim`도 마찬가지로 분기점 위에서는 숨겨져 있다가
  아래에서 전체 화면 딤 처리가 됩니다. 토글·스크림·레일 자신 모두
  `data-open="true"` 또는 `data-open="false"`를 갖습니다 — **항상 둘 중
  하나이고 아예 없는 경우가 없습니다** — 그래서 드로어의 열림/닫힘 CSS
  (translate, `visibility`, 스크림의 opacity/`pointer-events`)가 이
  카탈로그의 다른 곳에서 쓰는 `[data-fold]`나 `[hidden]`처럼 속성의
  존재/부재에 기대지 않고 `[data-open="true"]`를 직접 겨냥합니다.
  `prefers-reduced-motion: reduce`는 드로어의 전환 효과를 없앱니다.
- `data-surface`는 콘솔 이름(`"dashboard"`·`"admin"` 등)을 소비자 자신의
  훅을 위해 붙일 뿐 CSS는 없습니다. `data-hydrated="true"`는 클라이언트
  하이드레이션이 실제로 끝난 뒤에만 나타납니다 — 첫 페인트 시점과
  하이드레이션이 아예 닿지 않는 환경에서는 `"false"`가 아니라 **속성
  자체가 없습니다.**
- `.dds-console-main`은 skip 링크의 목적지(`id="dds-console-main"`,
  `tabindex="-1"`)이고 `.dds-console-page-header`를 담습니다 — `__text`
  (`.dds-console-page-eyebrow` + `<h1>`)와, 소비자가 넘겼을 때만 헤더
  오른쪽의 `__actions`.
- 밀도: `.dds-console-shell` 안에서 렌더링되는 `.dds-btn`·`.dds-input`·
  `.dds-select`·`.dds-textarea`는 자기 기본 크기 대신 body-2(14px)
  크기로 렌더링됩니다 — 컨트롤마다 각자 오버라이드하는 대신 콘솔이 한
  번에 정합니다.
- **접근성**: skip 링크는 실제 마크업이고 포커스를 받을 때까지만
  `.dds-visually-hidden`으로 숨겨집니다. 레일의 `<nav>`는 소비자가 넘긴
  `aria-label`을 요구합니다 — 콘솔 화면에는 (위) 테이블 자신의 페이징
  `<nav>`도 있으므로, 이름 없는 레일 랜드마크가 이름 있는 것 옆에 있으면
  그 자체로 회귀입니다. 이 스타일시트에서 `display`를 주는 모든 클래스는
  드로어 미디어 쿼리 안의 것까지 포함해 바로 옆에 `[hidden] { display:
  none }`을 다시 선언하므로, 숨겨진 레일·토글·스크림은 뷰포트 폭과 무관하게
  절대 화면에 강제로 그려질 수 없습니다.
- **Do**: 배지는 장식용 점이 아니라 실제 대기 건수에 쓰세요 — 접근성
  이름은 이 패키지가 정한 단어가 아니라 소비자가 넘긴 라벨 템플릿에서
  채워집니다.
- **Don't**: 드로어를 열고 닫는 데 `[hidden]`을 쓰지 마세요 — 컴포넌트가
  이미 `data-open`을 소유하고 있고, 위 CSS는 속성의 존재/부재가 아니라
  그 정확한 문자열 값에 의존합니다.

## Visually hidden — `.dds-visually-hidden`

```html
<span class="dds-visually-hidden">액션</span>
```

- 특정 컴포넌트에 묶이지 않은 `base.css`의 유틸리티입니다 — 콘텐츠를
  1px 박스로 클리핑해(`clip-path: inset(50%)`) 화면에는 공간을 차지하지
  않지만 접근성 트리에는 남습니다. 트리에서도 함께 지워버리는 `[hidden]`
  (또는 `display: none`)과 다릅니다.
- 담고 있는 블록은 `position: relative`여야 페이지가 아니라 그 박스를
  기준으로 클리핑됩니다 — `.dds-table-wrap`이 정확히 이 이유로 그렇게
  설정돼 있어, 래퍼가 가로로 스크롤된 상태에서도 테이블 자신의 caption이
  올바르게 클리핑됩니다.
- 실제로 쓰는 곳: 위 테이블의 caption과 액션 컬럼 헤더, 그리고 콘솔
  셸의 skip 링크(포커스를 받을 때만 자신의 `:focus` 규칙으로 보임).
- **Do**: 화면으로 보는 사람에겐 필요 없지만 화면 낭독기에는 필요한
  텍스트에 쓰세요 — caption, 랜드마크의 접근성 이름, 아이콘만 있는
  컨트롤의 라벨.
- **Don't**: 누구에게나 잠깐 숨기려는 용도로 쓰지 마세요 — 이건 접근성
  트리에서 아무것도 지우지 않는데, 지금 아무도 지각하면 안 되는 콘텐츠엔
  정확히 틀린 선택입니다. 그런 경우엔 `[hidden]`을 쓰세요.
