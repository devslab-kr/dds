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
