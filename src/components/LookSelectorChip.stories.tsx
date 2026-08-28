import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { LOOK_TYPES, LookSelectorChip } from './HomeScreen'

const meta = {
  title: 'Components/LookSelectorChip',
  component: LookSelectorChip,
  parameters: { layout: 'padded' },
  args: { onClick: fn() },
} satisfies Meta<typeof LookSelectorChip>

export default meta
type Story = StoryObj<typeof meta>

// One story per real LOOK_TYPES entry (day/night/glam, each with its own
// texture/tint/blend-mode/glow — see LOOK_TYPES' own comment) rather than a
// Controls dropdown: `type` is a whole config object, not a primitive, so a
// hand-typed select-with-mapping control would risk drifting out of sync
// with LOOK_TYPES itself if a fourth look type is ever added — three plain
// stories can't drift that way.
export const Day: Story = {
  args: { type: LOOK_TYPES[0], selected: true },
}

export const Night: Story = {
  args: { type: LOOK_TYPES[1], selected: false },
}

export const Glam: Story = {
  args: { type: LOOK_TYPES[2], selected: false },
}

// The real filter row — all three chips together, exactly one selected at a
// time, matching HomeScreen's own layout (flex row, 8px gap). A render
// function (not static args) since HomeScreen owns `selectedType` as real
// state, not a prop this component takes itself — this story reproduces
// that one level up instead of pretending the chip is self-selecting.
export const FilterRow: Story = {
  // args here are unused by `render` below (it owns its own state/props
  // per chip) — still required to satisfy StoryObj's type, since
  // LookSelectorChip's props have no defaults of their own.
  args: { type: LOOK_TYPES[0], selected: true },
  render: function Render() {
    const [selected, setSelected] = useState(LOOK_TYPES[0].id)
    return (
      <div style={{ display: 'flex', gap: 8 }}>
        {LOOK_TYPES.map((type) => (
          <LookSelectorChip key={type.id} type={type} selected={selected === type.id} onClick={() => setSelected(type.id)} />
        ))}
      </div>
    )
  },
}
