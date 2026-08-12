/** Global preview: loads the built token + component CSS (run `pnpm build`
 * first — the storybook scripts do) and exposes the DDS theme as a toolbar
 * switch that flips data-theme on <html>, exactly how a consumer app does. */
import "../packages/dds-tokens/dist/tokens.css";
import "../packages/dds-css/dist/dds.css";

export default {
  globalTypes: {
    theme: {
      description: "DDS theme (data-theme attribute)",
      toolbar: {
        title: "Theme",
        icon: "mirror",
        items: ["light", "dark"],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: "light" },
  decorators: [
    (story, context) => {
      document.documentElement.dataset.theme = context.globals.theme;
      document.body.style.background = "var(--dds-color-bg-default)";
      document.body.style.color = "var(--dds-color-text-primary)";
      document.body.style.fontFamily = "var(--dds-font-family-sans)";
      return story();
    },
  ],
  parameters: {
    layout: "padded",
  },
};
