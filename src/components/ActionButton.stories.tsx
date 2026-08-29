import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { ActionButton } from './ActionButton'

const meta = {
  title: 'Components/ActionButton',
  component: ActionButton,
  parameters: {
    // 338px: this app's own card content width (TutorialCard.tsx,
    // StepScreen.tsx) — ActionButton is always inset in a card at this
    // width, never rendered edge-to-edge, so a full-bleed canvas would
    // stretch it to a width it never actually appears at.
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 338 }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    variant: { control: 'radio', options: ['default', 'final'] },
  },
  args: { onClick: fn() },
} satisfies Meta<typeof ActionButton>

export default meta
type Story = StoryObj<typeof meta>

// Steps 1-6's "Next" — subtle tinted background, black text.
export const Default: Story = {
  args: { label: 'Next', variant: 'default' },
}

// Step 7's "Finish" (and the All Steps list's own) — solid near-black
// background, off-white text; the only variant that ends a tutorial.
export const Final: Story = {
  args: { label: 'Finish', variant: 'final' },
}
