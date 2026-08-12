/** Foundations — rendered from the generated tokens.js so the stories can
 * never drift from the shipped values (same source as tokens.css). */
import tokens from "../packages/dds-tokens/dist/tokens.js";

export default {
  title: "Foundations/Tokens",
};

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

const table = (head, rows) => `
  <table style="border-collapse:collapse; font-size:var(--dds-typo-body-2-font-size); line-height:var(--dds-typo-body-2-line-height)">
    <thead><tr>${head.map((h) => `<th style="text-align:left; padding:var(--dds-space-8) var(--dds-space-12); color:var(--dds-color-text-muted); font-size:var(--dds-typo-caption-font-size); text-transform:uppercase; letter-spacing:0.04em; border-bottom:1px solid var(--dds-color-border-default)">${h}</th>`).join("")}</tr></thead>
    <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td style="padding:var(--dds-space-8) var(--dds-space-12); border-bottom:1px solid var(--dds-color-border-default)">${c}</td>`).join("")}</tr>`).join("")}</tbody>
  </table>`;

const swatch = (hex) =>
  `<span style="display:inline-flex; align-items:center; gap:var(--dds-space-8)"><i style="width:20px;height:20px;border-radius:var(--dds-radius-sm);border:1px solid var(--dds-color-border-default);background:${hex}"></i><code style="font-family:var(--dds-font-family-mono);font-size:var(--dds-typo-caption-font-size)">${hex}</code></span>`;

const flat = (node, path = []) =>
  Object.entries(node).flatMap(([k, v]) =>
    typeof v === "string" ? [[[...path, k].join("."), v]] : flat(v, [...path, k])
  );

export const SemanticColors = {
  render: () => {
    const light = Object.fromEntries(flat(tokens.color.light));
    const dark = Object.fromEntries(flat(tokens.color.dark));
    return table(
      ["token", "light", "dark"],
      Object.keys(light).map((k) => [
        `<code style="font-family:var(--dds-font-family-mono)">color.${esc(k)}</code>`,
        swatch(light[k]),
        swatch(dark[k]),
      ])
    );
  },
};

export const Typography = {
  render: () =>
    Object.entries(tokens.typo)
      .map(
        ([name, t]) => `
        <div style="display:grid; grid-template-columns:160px 1fr; gap:var(--dds-space-16); align-items:baseline; padding:var(--dds-space-12) 0; border-bottom:1px solid var(--dds-color-border-default)">
          <div style="font-size:var(--dds-typo-caption-font-size); color:var(--dds-color-text-muted)"><code style="font-family:var(--dds-font-family-mono); color:var(--dds-color-text-primary)">typo.${name}</code><br>${t.fontSize} / ${t.lineHeight} · ${t.fontWeight}</div>
          <p style="margin:0; font-size:${t.fontSize}px; line-height:${t.lineHeight}px; font-weight:${t.fontWeight}">회사에 대해 무엇이든 물어보세요 0123456789</p>
        </div>`
      )
      .join(""),
};

export const SpacingRadius = {
  name: "Spacing · Radius",
  render: () => {
    const bars = Object.entries(tokens.space)
      .map(
        ([k, v]) => `
        <div style="display:flex; align-items:center; gap:var(--dds-space-16); padding:var(--dds-space-4) 0; font-size:var(--dds-typo-body-2-font-size)">
          <code style="width:88px; font-family:var(--dds-font-family-mono); color:var(--dds-color-text-muted)">space.${k}</code>
          <div style="height:16px; width:${Math.max(v * 3, 2)}px; background:var(--dds-color-bg-brand); border-radius:2px"></div>
          <span style="color:var(--dds-color-text-muted)">${v}px</span>
        </div>`
      )
      .join("");
    const rads = Object.entries(tokens.radius)
      .map(
        ([k, v]) => `
        <div style="width:120px; height:88px; background:var(--dds-color-bg-subtle); border:1px solid var(--dds-color-border-strong); border-radius:${Math.min(v, 200)}px; display:flex; flex-direction:column; justify-content:flex-end; padding:var(--dds-space-12); font-size:var(--dds-typo-caption-font-size)">
          <b>${k}</b><span style="color:var(--dds-color-text-muted)">${v === 9999 ? "full" : v + "px"}</span>
        </div>`
      )
      .join("");
    return `${bars}<div style="display:flex; gap:var(--dds-space-16); flex-wrap:wrap; margin-top:var(--dds-space-24)">${rads}</div>`;
  },
};

export const Elevation = {
  render: () => `
    <div style="display:flex; gap:var(--dds-space-24); flex-wrap:wrap; background:var(--dds-color-bg-subtle); border:1px solid var(--dds-color-border-default); border-radius:var(--dds-radius-lg); padding:var(--dds-space-32)">
      ${Object.entries(tokens.elevation)
        .map(
          ([k, v]) => `
          <div style="background:var(--dds-color-bg-elevated); border-radius:var(--dds-radius-lg); width:200px; padding:var(--dds-space-16); font-size:var(--dds-typo-body-2-font-size); box-shadow:var(--dds-elevation-${k})">
            elevation.${k}
            <code style="display:block; margin-top:var(--dds-space-4); font-family:var(--dds-font-family-mono); font-size:var(--dds-typo-caption-font-size); color:var(--dds-color-text-muted)">${esc(v.web)} · RN ${v.androidElevation}</code>
          </div>`
        )
        .join("")}
    </div>`,
};
