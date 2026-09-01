import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { ProductCard } from './ProductCard'
import eyeshadowImg from '../assets/product-images/Chanel-Les4ombres.png'

const meta = {
  title: 'Components/ProductCard',
  component: ProductCard,
  parameters: { layout: 'padded' },
  // 338px: this app's one canonical content-column width (TutorialCard.tsx,
  // StepScreen.tsx) — this row is always inset in a card at this width.
  decorators: [
    (Story) => (
      <div style={{ width: 338 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    brand: 'Chanel',
    name: 'Les 4 Ombres',
    checked: false,
    animate: false, // see CheckIndicator's own stories — animate replays a mount-triggered animation, not a steady-state look
    onToggleChecked: fn(),
  },
} satisfies Meta<typeof ProductCard>

export default meta
type Story = StoryObj<typeof meta>

export const Unchecked: Story = {
  args: { image: eyeshadowImg },
}

export const Checked: Story = {
  args: { image: eyeshadowImg, checked: true },
}

// No `image` — renders the flat --color-image-placeholder box every
// product without real photography falls back to (ProductCard's own
// comment; same fallback ProductsPreview's placeholder thumbnails use).
export const NoImage: Story = {
  args: {},
}

// The third, optional shade/variant line — stretches the row to the image's
// full height with brand/name pinned to the top instead of centered.
export const WithShade: Story = {
  args: { image: eyeshadowImg, shade: '79 - Spices' },
}
