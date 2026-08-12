/** Storybook config — spec §4.4 DoD item 2: every component ships stories
 * for all states/variants/sizes. Framework-neutral like dds-css itself:
 * plain HTML stories, no React. */
export default {
  framework: "@storybook/html-vite",
  stories: ["../stories/**/*.stories.js"],
};
