const icon = (d, size = 20) => `
  <svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="${d}"/>
  </svg>`;

const EDIT = "M4 20h4L19 9l-4-4L4 16v4z";
const CLOSE = "M6 6l12 12M18 6L6 18";
const TRASH = "M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12";

export default {
  title: "Components/IconButton",
};

export const Variants = {
  render: () => `
    <div style="display:flex; gap:var(--dds-space-8); align-items:center">
      <button class="dds-iconbtn" aria-label="닫기">${icon(CLOSE)}</button>
      <button class="dds-iconbtn dds-iconbtn--secondary" aria-label="수정">${icon(EDIT)}</button>
      <button class="dds-iconbtn dds-iconbtn--danger" aria-label="자료 삭제">${icon(TRASH)}</button>
      <button class="dds-iconbtn dds-iconbtn--secondary" aria-label="수정" disabled>${icon(EDIT)}</button>
    </div>`,
};

export const Sizes = {
  render: () => `
    <div style="display:flex; gap:var(--dds-space-8); align-items:center">
      <button class="dds-iconbtn dds-iconbtn--sm dds-iconbtn--secondary" aria-label="수정">${icon(EDIT, 16)}</button>
      <button class="dds-iconbtn dds-iconbtn--secondary" aria-label="수정">${icon(EDIT)}</button>
      <button class="dds-iconbtn dds-iconbtn--lg dds-iconbtn--secondary" aria-label="수정">${icon(EDIT, 24)}</button>
      <button class="dds-btn dds-btn--secondary">텍스트 버튼 (높이 대조)</button>
    </div>`,
};
