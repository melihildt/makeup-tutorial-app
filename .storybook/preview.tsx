import type { Preview } from '@storybook/react-vite'
// Same two global stylesheets main.tsx loads for the real app — Tailwind's
// base/utilities plus this app's own design tokens (tokens.css: colors,
// radii, shadows, durations/easing, font families). Without these, every
// story would render unstyled (no --color-*/--radius-*/etc. custom
// properties defined, no Tailwind classes generated) since Storybook's
// preview iframe is a separate HTML document from the real app's.
import '../src/index.css'
import '../src/styles/tokens.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },

    backgrounds: {
      // --color-page-backdrop (tokens.css) — the same tone App.tsx wraps
      // every real screen in.
      default: 'app-backdrop',
      values: [{ name: 'app-backdrop', value: '#e6e1dc' }],
    },
  },
  // This app is mobile-first (every screen maxes out at 402px wide,
  // designed against a real device frame — see App.tsx's own comment), so
  // most components look wrong/oversized centered in Storybook's default
  // wide canvas. A dedicated viewport makes every story read the way it
  // actually looks on a phone by default, rather than needing every single
  // story to opt into this by hand. `globals`, not
  // `parameters.viewport.defaultViewport` — that parameter was removed in
  // Storybook 10.
  globals: {
    viewport: { value: 'mobile2' }, // Storybook's built-in ~414px preset — closest stock match to this app's 402px column
  },
}

export default preview
