import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Toast } from './Toast'

const meta = {
  title: 'Components/Toast',
  component: Toast,
  parameters: { layout: 'fullscreen' },
  // Toast positions itself `absolute inset-x-0 top-0` against its own
  // screen's root (see its own doc comment for why — every real call site,
  // AccountScreen/MyProductsScreen, is already `relative`) — 402px: this
  // app's own mobile screen width (App.tsx), so the banner's real max-width
  // (370px) reads at the size it actually appears at, not stretched across
  // Storybook's default wide canvas.
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', width: 402, height: 160, background: 'var(--color-page-backdrop, #e6e1dc)' }}>
        <Story />
      </div>
    ),
  ],
  args: { onClose: fn() },
} satisfies Meta<typeof Toast>

export default meta
type Story = StoryObj<typeof meta>

// Copy is hardcoded (Toast.tsx has no message prop) — every trigger across
// the app (MyProductsScreen's "+"/"⋮", AccountScreen's Bookmarks row) shows
// this exact "coming soon" message, see Toast's own doc comment.
export const Open: Story = {
  args: { open: true },
}

export const Closed: Story = {
  args: { open: false },
}
