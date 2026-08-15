const smallIcon = (d) => `
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="${d}"/>
  </svg>`;

export default {
  title: "Components/Surfaces",
};

export const Card = {
  render: () => `
    <div style="display:grid; gap:var(--dds-space-16); max-width:420px">
      <section class="dds-card">
        <h3 class="dds-card__title">재크롤 일정</h3>
        <p class="dds-card__body">매일 04:00(KST)에 등록된 자료를 다시 읽습니다.</p>
      </section>
      <section class="dds-card dds-card--subtle">
        <h3 class="dds-card__title">--subtle</h3>
        <p class="dds-card__body">이미 떠 있는 면 안에서 쓰는 납작한 변형.</p>
      </section>
    </div>`,
};

export const Divider = {
  render: () => `
    <div style="max-width:420px">
      <p style="margin:0">위 그룹</p>
      <hr class="dds-divider">
      <p style="margin:0">아래 그룹</p>
      <div style="display:flex; align-items:center; margin-top:var(--dds-space-16)">
        <span>왼쪽</span><hr class="dds-divider dds-divider--vertical" style="height:20px"><span>오른쪽</span>
      </div>
    </div>`,
};

export const ListRow = {
  render: () => `
    <ul style="list-style:none; margin:0; padding:0; max-width:480px;
               border:1px solid var(--dds-color-border-default); border-radius:var(--dds-radius-lg); overflow:hidden">
      <li><button class="dds-listrow dds-listrow--interactive">
        <span class="dds-avatar dds-avatar--sm" aria-hidden="true">강신</span>
        <span class="dds-listrow__body">
          <span class="dds-listrow__title">강신</span>
          <span class="dds-listrow__sub">대표 · 오늘 접속</span>
        </span>
        <span class="dds-badge dds-badge--success">활성</span>
      </button></li>
      <li><button class="dds-listrow dds-listrow--interactive">
        <span class="dds-avatar dds-avatar--sm" aria-hidden="true">민수</span>
        <span class="dds-listrow__body">
          <span class="dds-listrow__title">김민수 · 영업팀 · 아주 긴 이름은 말줄임으로 잘립니다</span>
          <span class="dds-listrow__sub">초대함 · 7일 후 만료</span>
        </span>
        <span class="dds-badge dds-badge--warning">대기</span>
      </button></li>
      <li><div class="dds-listrow">
        <span class="dds-avatar dds-avatar--sm" aria-hidden="true">지현</span>
        <span class="dds-listrow__body">
          <span class="dds-listrow__title">박지현</span>
          <span class="dds-listrow__sub">비활성</span>
        </span>
        <span class="dds-listrow__actions">
          <button class="dds-iconbtn dds-iconbtn--sm" aria-label="수정">${smallIcon("M4 20h4L19 9l-4-4L4 16v4z")}</button>
          <button class="dds-iconbtn dds-iconbtn--sm dds-iconbtn--danger" aria-label="삭제">${smallIcon("M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12")}</button>
        </span>
      </div></li>
    </ul>`,
};

export const Tabs = {
  render: () => `
    <div style="max-width:480px">
      <div class="dds-tabs" role="tablist">
        <button class="dds-tab" role="tab" aria-selected="true" aria-controls="tp-a" id="tb-a">자료</button>
        <button class="dds-tab" role="tab" aria-selected="false" aria-controls="tp-b" id="tb-b">방문자 질문</button>
        <button class="dds-tab" role="tab" aria-selected="false" aria-controls="tp-c" id="tb-c">알림</button>
        <button class="dds-tab" role="tab" aria-selected="false" disabled>API 연동</button>
      </div>
      <div role="tabpanel" id="tp-a" aria-labelledby="tb-a"
           style="padding:var(--dds-space-16) 0; font-size:var(--dds-typo-body-2-font-size); color:var(--dds-color-text-secondary)">
        선택된 탭의 패널.
      </div>
    </div>`,
};

export const EmptyState = {
  render: () => `
    <div class="dds-empty" style="max-width:480px">
      <p class="dds-empty__title">등록된 자료가 없습니다</p>
      <p class="dds-empty__desc">웹페이지 주소나 PDF를 추가하면 AI가 그 내용으로 답합니다.</p>
      <div class="dds-empty__actions">
        <button class="dds-btn dds-btn--primary dds-btn--sm">자료 추가</button>
        <button class="dds-btn dds-btn--ghost dds-btn--sm">직접 입력</button>
      </div>
    </div>`,
};

export const Tooltip = {
  render: () => `
    <div style="padding:var(--dds-space-40) 0 0">
      <span class="dds-tooltip">
        <button class="dds-iconbtn dds-iconbtn--secondary" aria-label="재크롤" aria-describedby="tip1">
          ${smallIcon("M20 12a8 8 0 1 1-2.3-5.6M20 4v4h-4")}
        </button>
        <span class="dds-tooltip__bubble" role="tooltip" id="tip1">지금 다시 읽기</span>
      </span>
      <span style="margin-left:var(--dds-space-12); font-size:var(--dds-typo-caption-font-size); color:var(--dds-color-text-muted)">
        hover · focus 양쪽에서 열립니다 (Tab으로 확인)
      </span>
    </div>`,
};
