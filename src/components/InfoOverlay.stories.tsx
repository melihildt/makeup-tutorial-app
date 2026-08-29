import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { InfoOverlay } from './InfoOverlay'

const meta = {
  title: 'Components/InfoOverlay',
  component: InfoOverlay,
  parameters: { layout: 'fullscreen' },
  // absolute inset-0 internally (see InfoOverlay.tsx) — needs a sized,
  // `relative`-or-better positioned ancestor to fill, same 402px-wide
  // mobile screen width as every other full-screen story here (App.tsx).
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', width: 402, height: 700, overflow: 'hidden' }}>
        <Story />
      </div>
    ),
  ],
  args: { onClose: fn() },
} satisfies Meta<typeof InfoOverlay>

export default meta
type Story = StoryObj<typeof meta>

// Real `backdrop-filter: blur()` over whatever's behind it (see this
// component's own doc comment on why that's simpler than Figma's own
// duplicated-and-blurred layer trick) — in this story that's just
// Storybook's plain canvas, not the live Home screen the real app blurs.
export const Open: Story = {
  args: { open: true },
}

export const Closed: Story = {
  args: { open: false },
}
