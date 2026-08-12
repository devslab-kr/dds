/** Manager (chrome) theme — DDS brand instead of the default Storybook look.
 * Values come from the generated tokens.js, same source as tokens.css, so
 * the workbench chrome can't drift from the palette it documents.
 * Dark chrome matches devslab.kr's terminal mood; the canvas itself is
 * controlled by the theme toolbar (preview.js), not by this file. */
import { addons } from "storybook/manager-api";
import { create } from "storybook/theming";
import tokens from "../packages/dds-tokens/dist/tokens.js";

const { palette, fontFamily } = tokens;

addons.setConfig({
  theme: create({
    base: "dark",
    brandTitle: "DDS — DevsLab Design System",
    brandUrl: "https://github.com/devslab-kr/dds",

    colorPrimary: palette.cyan["500"],
    // selected-item background carries white text in Storybook's sidebar —
    // cyan.700 keeps that readable (same reasoning as the on-brand rule).
    colorSecondary: palette.cyan["700"],

    appBg: palette.zinc["950"],
    appContentBg: palette.zinc["950"],
    appPreviewBg: palette.white,
    appBorderColor: palette.zinc["800"],
    appBorderRadius: 8,

    textColor: palette.zinc["50"],
    textInverseColor: palette.zinc["950"],
    textMutedColor: palette.zinc["400"],

    barBg: palette.zinc["950"],
    barTextColor: palette.zinc["400"],
    barHoverColor: palette.cyan["400"],
    barSelectedColor: palette.cyan["400"],

    inputBg: palette.zinc["900"],
    inputBorder: palette.zinc["700"],
    inputTextColor: palette.zinc["50"],
    inputBorderRadius: 8,

    buttonBg: palette.zinc["900"],
    buttonBorder: palette.zinc["700"],
    booleanBg: palette.zinc["900"],
    booleanSelectedBg: palette.cyan["700"],

    fontBase: fontFamily.sans,
    fontCode: fontFamily.mono,
  }),
});
