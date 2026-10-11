import { themeQuartz } from "ag-grid-community";

/** Semantic CSS variables follow the nearest DDS light/dark token scope. */
export const ddsGridTheme = themeQuartz.withParams({
  backgroundColor: "var(--dds-color-bg-default)",
  foregroundColor: "var(--dds-color-text-primary)",
  borderColor: "var(--dds-color-border-default)",
  accentColor: "var(--dds-color-border-focus)",
  headerBackgroundColor: "var(--dds-color-bg-subtle)",
  headerTextColor: "var(--dds-color-text-secondary)",
  oddRowBackgroundColor: "var(--dds-color-bg-default)",
  rowHoverColor: "var(--dds-color-overlay-hover-tint)",
  selectedRowBackgroundColor: "var(--dds-color-bg-brand-subtle)",
  fontFamily: "var(--dds-font-family-sans)",
  fontSize: "var(--dds-typo-body-2-font-size)",
  wrapperBorderRadius: "var(--dds-radius-md)",
  spacing: "var(--dds-space-4)",
});
