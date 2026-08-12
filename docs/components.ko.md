# DDS 컴포넌트 — Core 6 (`@devslab-kr/dds-css`)

🌐 [English](components.md)

클래스 기반·프레임워크 중립 CSS 컴포넌트. 전부 시맨틱 토큰(`var(--dds-*)`)만
참조합니다 — `@devslab-kr/dds-tokens/tokens.css`를 먼저 로드하고
`@devslab-kr/dds-css/dds.css`(또는 `components/`의 개별 파일)를 로드하세요.
다크 모드에 컴포넌트 변경은 없습니다: `<html>` 또는 임의 서브트리에
`data-theme="dark"` (`data-theme="light"`로 되고정 가능).

모든 인터랙티브 컴포넌트는 스펙 §4.2의 전체 상태 세트(default → hover →
pressed → focus-visible → disabled → loading)를 정의하고 §6 접근성
최소선(텍스트 대비 4.5:1, 웹 클릭 타깃 ≥24×24, 키보드 도달 + 2px 포커스 링,
색 단독 신호 금지)을 통과합니다.

라이브 레퍼런스: `preview/components.html` (먼저 `pnpm build`).

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
