export default {
  title: "Components/Spinner · Skeleton",
};

export const Spinner = {
  render: () => `
    <div style="display:flex; gap:var(--dds-space-16); align-items:center">
      <span class="dds-spinner" role="status" aria-label="불러오는 중"></span>
      <span class="dds-spinner dds-spinner--lg" role="status" aria-label="불러오는 중"></span>
      <span style="color:var(--dds-color-text-brand)"><span class="dds-spinner" role="status" aria-label="불러오는 중"></span></span>
      <button class="dds-btn dds-btn--primary" aria-busy="true"><span class="dds-spinner" aria-hidden="true"></span>저장 중</button>
    </div>`,
};

export const Skeleton = {
  render: () => `
    <div aria-busy="true" style="display:flex; gap:var(--dds-space-12); align-items:center; max-width:360px">
      <span class="dds-skeleton dds-skeleton--circle" aria-hidden="true" style="width:40px;height:40px"></span>
      <div style="flex:1; display:grid; gap:var(--dds-space-8)">
        <span class="dds-skeleton dds-skeleton--text" aria-hidden="true" style="width:60%"></span>
        <span class="dds-skeleton dds-skeleton--text" aria-hidden="true" style="width:90%"></span>
      </div>
    </div>`,
};
