import type { Meta, StoryObj } from '@storybook/react-vite'
import { CheckIndicator } from './CheckIndicator'

const meta = {
  title: 'Components/CheckIndicator',
  component: CheckIndicator,
  parameters: { layout: 'centered' },
  argTypes: {
    // See CheckIndicator's own doc comment: `animate` is not a visual
    // style knob, it's "was this render caused by an actual click, or a
    // remount for an unrelated reason" — flipping it here in Controls
    // replays the draw-in/pop/ring-in mount animation on demand, which is
    // exactly the state a real click transiently passes through.
    animate: { control: 'boolean' },
  },
} satisfies Meta<typeof CheckIndicator>

export default meta
type Story = StoryObj<typeof meta>

export const Unchecked: Story = {
  args: { checked: false, animate: false },
}

export const Checked: Story = {
  args: { checked: true, animate: false },
}

// Toggle `animate` off/on (or re-select this story) to replay the
// draw-in/ring-in/pop sequence that plays on an actual click — see
// CheckIndicator's own doc comment for why `key={checked}` forces the
// remount this depends on.
export const CheckedAnimating: Story = {
  args: { checked: true, animate: true },
}
