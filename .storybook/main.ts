import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  // @storybook/addon-vitest, @chromatic-com/storybook, and @storybook/addon-mcp
  // (the other three `storybook init` installs by default) were removed —
  // none needed their companion setup (a running Vitest process, a
  // Chromatic account, and a manual postinstall step respectively) for
  // just documenting/reviewing components, and none were the source of a
  // benign PREVIEW_API console error seen on startup (still present with
  // zero addons at all — a known-harmless quirk of this exact Storybook
  // 10.5 + Vite 8 pairing, not an addon or story-content issue).
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs'],
  framework: '@storybook/react-vite',
}
export default config
