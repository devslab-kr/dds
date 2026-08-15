export default {
  title: "Components/Chip & Avatar",
};

export const Chip = {
  render: () => `
    <div style="display:flex; gap:var(--dds-space-8); flex-wrap:wrap">
      <button class="dds-chip" aria-pressed="true">미답변</button>
      <button class="dds-chip">웹페이지</button>
      <button class="dds-chip">파일</button>
      <button class="dds-chip">직접 입력</button>
      <button class="dds-chip" disabled>보관됨</button>
    </div>`,
};

export const Avatar = {
  render: () => `
    <div style="display:flex; gap:var(--dds-space-12); align-items:center">
      <span class="dds-avatar dds-avatar--sm" aria-hidden="true">강신</span>
      <span class="dds-avatar" aria-hidden="true">민수</span>
      <span class="dds-avatar dds-avatar--lg" aria-hidden="true">DL</span>
      <span class="dds-avatar dds-avatar--square" aria-hidden="true">DL</span>
    </div>`,
};
