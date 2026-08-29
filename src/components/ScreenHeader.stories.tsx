import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { ScreenHeader } from './ScreenHeader'

const meta = {
  title: 'Components/ScreenHeader',
  component: ScreenHeader,
  parameters: { layout: 'padded' },
  // 402px: this app's own mobile screen width (App.tsx) — this header
  // spans the full screen width, not a card's narrower content column.
  decorators: [
    (Story) => (
      <div style={{ width: 402 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    onBack: fn(),
    onSelectStepView: fn(),
    onSelectListView: fn(),
    onDone: fn(),
  },
} satisfies Meta<typeof ScreenHeader>

export default meta
type Story = StoryObj<typeof meta>

// StepScreen's own state: Search (per-step view) highlighted.
export const StepView: Story = {
  args: { activeView: 'step' },
}

// AllStepsView's own state: Widget (list view) highlighted. Same component,
// same instance shape — see this component's own doc comment on why the
// sliding highlight between these two actually crosses a real unmount/
// remount (TutorialFlow swaps StepScreen/AllStepsView entirely) rather than
// animating within one mounted header.
export const ListView: Story = {
  args: { activeView: 'list' },
}
