/** Icons — rendered from the generated icons.js, so the gallery is the set
 * itself and can never drift from what the package ships. */
import { icons } from "../packages/dds-icons/dist/icons.js";

export default {
  title: "Foundations/Icons",
};

const svg = (name, size = 24) => {
  const i = icons[name];
  return `<svg width="${size}" height="${size}" viewBox="${i.viewBox}" fill="none" stroke="currentColor"
    stroke-width="${i.strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${i.body}</svg>`;
};

const gallery = (set) => `
  <div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(104px,1fr)); gap:var(--dds-space-12)">
    ${Object.keys(icons)
      .filter((n) => icons[n].set === set)
      .map(
        (n) => `<span style="display:flex; flex-direction:column; align-items:center; gap:var(--dds-space-4); padding:var(--dds-space-8) var(--dds-space-4)">
          <span style="display:grid; place-items:center; width:var(--dds-space-32); height:var(--dds-space-32); outline:1px dashed var(--dds-color-border-default)">${svg(n)}</span>
          <span style="font-family:var(--dds-font-family-mono); font-size:var(--dds-typo-caption-font-size); line-height:var(--dds-typo-caption-line-height); color:var(--dds-color-text-muted); text-align:center; overflow-wrap:anywhere">${n}</span>
        </span>`,
      )
      .join("")}
  </div>`;

export const CoreSet = { render: () => gallery("core") };

export const SiteSet = { render: () => gallery("site") };

export const Sizes = {
  render: () => `
    <div style="display:flex; align-items:flex-end; gap:var(--dds-space-16)">
      ${[16, 20, 24, 32]
        .map(
          (s) => `<span style="display:flex; flex-direction:column; align-items:center; gap:var(--dds-space-4);
            font-size:var(--dds-typo-caption-font-size); color:var(--dds-color-text-muted)">${svg("search", s)}${s}</span>`,
        )
        .join("")}
    </div>`,
};

export const InControls = {
  render: () => `
    <div style="display:flex; gap:var(--dds-space-8); align-items:center">
      <button class="dds-iconbtn dds-iconbtn--secondary" aria-label="검색">${svg("search", 20)}</button>
      <button class="dds-iconbtn dds-iconbtn--danger" aria-label="삭제">${svg("trash", 20)}</button>
      <button class="dds-btn dds-btn--primary">${svg("download", 16)}내려받기</button>
      <button class="dds-btn dds-btn--secondary">다음${svg("chevron-right", 16)}</button>
    </div>`,
};
