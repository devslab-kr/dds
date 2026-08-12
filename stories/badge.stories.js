export default {
  title: "Components/Badge",
};

export const Variants = {
  render: () => `
    <div style="display:flex; gap:var(--dds-space-8); flex-wrap:wrap">
      <span class="dds-badge dds-badge--brand">Beta</span>
      <span class="dds-badge dds-badge--success">연결됨</span>
      <span class="dds-badge dds-badge--warning">확인 필요</span>
      <span class="dds-badge dds-badge--danger">실패</span>
      <span class="dds-badge dds-badge--info">안내</span>
    </div>`,
};
