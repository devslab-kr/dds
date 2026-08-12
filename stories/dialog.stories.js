export default {
  title: "Components/Dialog",
};

const inner = `
  <h2 class="dds-dialog__title" id="dlg-t">자료를 다시 색인할까요?</h2>
  <p class="dds-dialog__body">수정된 회사 소개 문서가 즉시 답변에 반영됩니다.</p>
  <div class="dds-dialog__actions">
    <button class="dds-btn dds-btn--ghost dds-btn--sm" data-close>나중에</button>
    <button class="dds-btn dds-btn--primary dds-btn--sm" data-close>색인하기</button>
  </div>`;

/** Overlay + panel, statically rendered inside a stage (position unfixed for
 * the story only). */
export const Static = {
  render: () => `
    <div style="position:relative; min-height:240px; border:1px solid var(--dds-color-border-default); border-radius:var(--dds-radius-lg); overflow:hidden; background:var(--dds-color-bg-subtle)">
      <div class="dds-dialog-overlay" style="position:absolute">
        <div class="dds-dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-t">${inner}</div>
      </div>
    </div>`,
};

/** Native <dialog>.showModal() — Esc, ::backdrop and focus handling come
 * from the platform. */
export const NativeDialog = {
  render: () => {
    const wrap = document.createElement("div");
    const open = document.createElement("button");
    open.className = "dds-btn dds-btn--primary";
    open.textContent = "다이얼로그 열기";
    const dlg = document.createElement("dialog");
    dlg.className = "dds-dialog";
    dlg.setAttribute("aria-labelledby", "dlg-t");
    dlg.innerHTML = inner;
    open.addEventListener("click", () => dlg.showModal());
    dlg.addEventListener("click", (e) => {
      if (e.target.closest("[data-close]") || e.target === dlg) dlg.close();
    });
    wrap.append(open, dlg);
    return wrap;
  },
};
