import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { CARD_HEIGHT, CARD_WIDTH, TUTORIALS, TutorialLookCard } from './TutorialCard'

// Real entries from the app's own tutorial data, not hand-authored sample
// objects — stays in sync automatically as TUTORIALS changes, and shows the
// exact photography/copy this component actually renders in the app.
const softSmokeyEye = TUTORIALS.find((t) => t.id === 'soft-smokey-eye')!
const everydayMattes = TUTORIALS.find((t) => t.id === 'everyday-mattes')!

const meta = {
  title: 'Tutorial Card/TutorialLookCard',
  component: TutorialLookCard,
  parameters: { layout: 'padded' },
  // CARD_WIDTH/CARD_HEIGHT (TutorialCard.tsx): the card is `h-full` +
  // `w-[338px]` internally — with no ancestor height, `h-full` alone
  // collapses to 0 (see those constants' own export comment).
  decorators: [
    (Story) => (
      <div style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}>
        <Story />
      </div>
    ),
  ],
  args: {
    onSelect: fn(),
    onToggleSave: fn(),
    saved: false,
  },
} satisfies Meta<typeof TutorialLookCard>

export default meta
type Story = StoryObj<typeof meta>

// The one tutorial with real content behind it — see Tutorial's own
// `hasContent` doc comment. Its front face looks identical to every other
// card regardless of hasContent (that only changes the flipped
// TutorialDetailCard's CTA/thumbnails, see that component's own stories) —
// this face is purely the photo pair + title/byline + bookmark.
export const Default: Story = {
  args: { tutorial: softSmokeyEye },
}

export const Saved: Story = {
  args: { tutorial: softSmokeyEye, saved: true },
}

// A tutorial with no real content yet (the other 12 of 13) — the front
// face itself doesn't gate on that at all; tapping it flips to
// TutorialDetailCard, where the gating actually shows up.
export const ComingSoonTutorial: Story = {
  args: { tutorial: everydayMattes },
}

// Every card but the front one in the real stack — no onClick/onKeyDown
// attached at all (see this component's own doc comment on why `disabled`
// removes the handlers rather than just graying them out).
export const Disabled: Story = {
  args: { tutorial: softSmokeyEye, disabled: true },
}
