import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { CARD_HEIGHT, CARD_WIDTH, TUTORIALS, TutorialDetailCard } from './TutorialCard'

const softSmokeyEye = TUTORIALS.find((t) => t.id === 'soft-smokey-eye')!
const dakotaAfterDark = TUTORIALS.find((t) => t.id === 'dakota-after-dark')!

const meta = {
  title: 'Tutorial Card/TutorialDetailCard',
  component: TutorialDetailCard,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}>
        <Story />
      </div>
    ),
  ],
  args: {
    onFlipBack: fn(),
    onStart: fn(),
  },
} satisfies Meta<typeof TutorialDetailCard>

export default meta
type Story = StoryObj<typeof meta>

// hasContent: true (only Soft Smokey Eye, currently) — real product
// photography in the preview row, "Start Tutorial" actually opens the flow.
export const WithContent: Story = {
  args: { tutorial: softSmokeyEye },
}

// hasContent: false (the other 12 of 13) — blurred/tinted placeholder
// thumbnails (a real photo from the app's own set + a warm, randomized-but-
// stable tint, see ProductsPreview's own doc comment) and a disabled
// "Coming soon" pill instead of "Start Tutorial". This is the state most
// tutorials are in right now.
export const ComingSoon: Story = {
  args: { tutorial: dakotaAfterDark },
}

// The three TutorialLevel values — same tutorial, level swapped, to compare
// the level pill's bar-icon fill side by side without hunting for a
// specific tutorial per level in TUTORIALS.
export const LevelEasy: Story = {
  args: { tutorial: { ...dakotaAfterDark, level: 'easy' } },
}
export const LevelMedium: Story = {
  args: { tutorial: { ...dakotaAfterDark, level: 'medium' } },
}
export const LevelExperienced: Story = {
  args: { tutorial: { ...dakotaAfterDark, level: 'experienced' } },
}

// The product-preview pop-in's entrance (product-preview-pop-in, index.css)
// — see ProductsPreview's own doc comment for the delay math this plays
// against. Re-select this story (or toggle `justRevealed` in Controls) to
// replay it; reduced-motion swaps it in instantly with no animation instead
// (this component's own `reduceMotion` check, independent of this prop).
export const JustRevealed: Story = {
  args: { tutorial: softSmokeyEye, justRevealed: true },
}

// Every card but the front one in the real stack.
export const Disabled: Story = {
  args: { tutorial: softSmokeyEye, disabled: true },
}
