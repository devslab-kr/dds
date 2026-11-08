export default {
  title: "Components/Toast",
};

export const Variants = {
  render: () => `
    <div style="position:relative; min-height:260px; border:1px solid var(--dds-color-border-default); border-radius:var(--dds-radius-lg); overflow:hidden; background:var(--dds-color-bg-subtle)">
      <div class="dds-toast-region" role="status" style="position:absolute">
        <div class="dds-toast">설정을 저장했습니다.</div>
        <div class="dds-toast dds-toast--success">자료 색인이 끝났습니다.</div>
        <div class="dds-toast dds-toast--warning">크롤 결과가 부족합니다.</div>
        <div class="dds-toast dds-toast--info">새 버전이 있습니다.</div>
        <div class="dds-toast dds-toast--danger" role="alert">메일 발송에 실패했습니다.</div>
      </div>
    </div>`,
};

/** CSS presentation sample; the framework fixtures exercise the actual API. */
export const LoadingAndAction = {
  render: () => {
    const wrap = document.createElement("div");
    wrap.style.cssText =
      "position:relative; min-block-size:calc(var(--dds-space-64) * 5); padding:var(--dds-space-16); background:var(--dds-color-bg-subtle)";
    wrap.innerHTML = `
      <div class="dds-toast-region" role="region" style="position:absolute" aria-label="알림 예제">
        <div class="dds-toast dds-toast--loading" role="status">
          <span class="dds-spinner" aria-hidden="true"></span>
          <span data-part="description">자료를 내보내고 있습니다.</span>
        </div>
        <div class="dds-toast dds-toast--success dds-toast--action" role="status">
          <span data-part="description">내보내기가 끝났습니다. 생성한 파일을 확인할 수 있습니다.</span>
          <button type="button" class="dds-btn dds-btn--secondary dds-btn--sm dds-toast__action" data-part="action-trigger">예제 알림 닫기</button>
        </div>
      </div>`;
    wrap.querySelector("button").addEventListener("click", (event) => {
      event.currentTarget.closest(".dds-toast").remove();
    });
    return wrap;
  },
};

/** Live enqueue — the entry animation (duration.base + easing.enter) runs on
 * each append; respects prefers-reduced-motion. */
export const LiveEnqueue = {
  render: () => {
    const wrap = document.createElement("div");
    wrap.style.cssText =
      "position:relative; min-height:260px; border:1px solid var(--dds-color-border-default); border-radius:var(--dds-radius-lg); overflow:hidden; background:var(--dds-color-bg-subtle); padding:var(--dds-space-16)";
    const btn = document.createElement("button");
    btn.className = "dds-btn dds-btn--secondary dds-btn--sm";
    btn.textContent = "토스트 띄우기";
    const region = document.createElement("div");
    region.className = "dds-toast-region";
    region.setAttribute("role", "status");
    region.style.position = "absolute";
    let n = 0;
    btn.addEventListener("click", () => {
      const t = document.createElement("div");
      t.className = "dds-toast dds-toast--success";
      t.textContent = `저장했습니다 (${++n})`;
      region.append(t);
      setTimeout(() => t.remove(), 4000);
    });
    wrap.append(btn, region);
    return wrap;
  },
};
