export default {
  title: "Components/Button",
  argTypes: {
    label: { control: "text" },
    variant: { control: "select", options: ["primary", "secondary", "ghost", "danger"] },
    size: { control: "select", options: ["sm", "md", "lg"] },
    disabled: { control: "boolean" },
    loading: { control: "boolean" },
  },
  args: { label: "저장", variant: "primary", size: "md", disabled: false, loading: false },
  render: ({ label, variant, size, disabled, loading }) => {
    const btn = document.createElement("button");
    btn.className = `dds-btn dds-btn--${variant}${size !== "md" ? ` dds-btn--${size}` : ""}`;
    if (disabled) btn.disabled = true;
    if (loading) {
      btn.setAttribute("aria-busy", "true");
      const spin = document.createElement("span");
      spin.className = "dds-spinner";
      spin.setAttribute("aria-hidden", "true");
      btn.append(spin);
    }
    btn.append(label);
    return btn;
  },
};

export const Playground = {};

const row = (html) =>
  `<div style="display:flex; gap:var(--dds-space-8); align-items:center; flex-wrap:wrap">${html}</div>`;

export const Variants = {
  render: () =>
    row(`
      <button class="dds-btn dds-btn--primary">저장</button>
      <button class="dds-btn dds-btn--secondary">취소</button>
      <button class="dds-btn dds-btn--ghost">자세히</button>
      <button class="dds-btn dds-btn--danger">삭제</button>`),
};

export const Sizes = {
  render: () =>
    row(`
      <button class="dds-btn dds-btn--primary dds-btn--sm">작게 32</button>
      <button class="dds-btn dds-btn--primary">보통 40</button>
      <button class="dds-btn dds-btn--primary dds-btn--lg">크게 48</button>`),
};

/** §4.2 state set. hover/pressed/focus are live pseudo-classes — interact
 * with the buttons; disabled/loading are attribute states shown here. */
export const States = {
  render: () =>
    row(`
      <button class="dds-btn dds-btn--primary">default (hover me)</button>
      <button class="dds-btn dds-btn--primary" disabled>disabled</button>
      <button class="dds-btn dds-btn--primary" aria-busy="true"><span class="dds-spinner" aria-hidden="true"></span>loading</button>
      <button class="dds-btn dds-btn--danger" disabled>danger disabled</button>`),
};
