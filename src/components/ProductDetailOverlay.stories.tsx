import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { ProductDetailOverlay } from './ProductDetailOverlay'
import { STEP_CONTENT } from '../data/stepContent'

// A real product from the app's own step data, not a hand-authored sample —
// same reasoning as TutorialLookCard/TutorialDetailCard's stories.
const eyeshadowPalette = STEP_CONTENT[2].products[0]

const meta = {
  title: 'Components/ProductDetailOverlay',
  component: ProductDetailOverlay,
  parameters: { layout: 'fullscreen' },
  // absolute inset-0 internally (see ProductDetailOverlay.tsx, reusing
  // InfoOverlay's own mechanics) — same 402px-wide mobile screen decorator
  // as InfoOverlay's stories.
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', width: 402, height: 700, overflow: 'hidden' }}>
        <Story />
      </div>
    ),
  ],
  args: { onClose: fn() },
} satisfies Meta<typeof ProductDetailOverlay>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  args: { product: eyeshadowPalette },
}

// `product: null` — see this component's own doc comment on why `product`
// itself (not a separate `open` boolean) drives visibility, and why the
// content keeps showing the last real product internally during the close
// fade rather than going blank.
export const Closed: Story = {
  args: { product: null },
}
