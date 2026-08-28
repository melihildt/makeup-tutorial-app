import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { CARD_WIDTH, TUTORIALS, TutorialStack, toggleInSet } from './TutorialCard'
import type { LookType } from './HomeScreen'

// HomeScreen's own real filter (visibleTutorials, HomeScreen.tsx) — each
// chip's actual four-tutorial slice, not hand-picked sample data, so these
// stories show exactly what a real filter tap hands the stack.
const dayTutorials = TUTORIALS.filter((t) => t.lookType === 'day')
const nightTutorials = TUTORIALS.filter((t) => t.lookType === 'night')
const glamTutorials = TUTORIALS.filter((t) => t.lookType === 'glam')

const meta = {
  title: 'Tutorial Card/TutorialStack',
  component: TutorialStack,
  parameters: { layout: 'padded' },
  // Unlike TutorialLookCard/TutorialDetailCard's own decorator (see those
  // files' stories), no fixed height is needed here: the drag-stack branch
  // sizes itself explicitly (CARD_HEIGHT, inline style on its own root), and
  // the reduced-motion branch's plain vertical list is meant to grow past a
  // single card's height anyway — a fixed-height ancestor would just clip it.
  decorators: [
    (Story) => (
      <div style={{ width: CARD_WIDTH }}>
        <Story />
      </div>
    ),
  ],
  // savedIds/onToggleSave here are never actually read (see StackStory
  // below, which owns its own real state instead) — present only so each
  // story's own `args` doesn't have to repeat them just to satisfy
  // StoryObj's type, same "required to satisfy the type, unused by render"
  // reasoning as LookSelectorChip.stories.tsx's FilterRow story.
  args: { onSelect: fn(), savedIds: new Set(), onToggleSave: fn() },
} satisfies Meta<typeof TutorialStack>

export default meta
type Story = StoryObj<typeof meta>

// savedIds/onToggleSave are real state lifted all the way up to App.tsx in
// the app (see TutorialStackProps' own comment) — a static `Set` arg
// couldn't actually toggle when a story's bookmark button is tapped, so
// this reproduces that one level up instead, same render-function-with-
// its-own-useState pattern LookSelectorChip.stories.tsx's FilterRow story
// already uses for the same "this prop is really lifted app state" reason.
// One shared component (not each story repeating the same body) since all
// three Day/Night/Glam stories need the identical wiring, just a different
// tutorials/lookType pair.
function StackStory({ tutorials, lookType, onSelect }: { tutorials: typeof TUTORIALS; lookType: LookType; onSelect?: () => void }) {
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set())
  return (
    <TutorialStack
      tutorials={tutorials}
      lookType={lookType}
      onSelect={onSelect}
      savedIds={savedIds}
      onToggleSave={(id) => setSavedIds((prev) => toggleInSet(prev, id))}
    />
  )
}

// One story per real Day/Night/Glam chip (HomeScreen's own LOOK_TYPES) —
// each shows that chip's actual four tutorials, front card + one peeking
// card behind, with the real drag/swipe-to-advance, tap-to-flip, and
// "Start Over" terminal slot all live (this isn't a static render of one
// frame — try dragging or tapping a card in the Storybook canvas).
export const Day: Story = {
  args: { tutorials: dayTutorials, lookType: 'day' },
  render: function Render(args) {
    return <StackStory tutorials={dayTutorials} lookType="day" onSelect={args.onSelect} />
  },
}

export const Night: Story = {
  args: { tutorials: nightTutorials, lookType: 'night' },
  render: function Render(args) {
    return <StackStory tutorials={nightTutorials} lookType="night" onSelect={args.onSelect} />
  },
}

export const Glam: Story = {
  args: { tutorials: glamTutorials, lookType: 'glam' },
  render: function Render(args) {
    return <StackStory tutorials={glamTutorials} lookType="glam" onSelect={args.onSelect} />
  },
}

// No dedicated reduced-motion story: this Storybook setup has no addon that
// emulates `prefers-reduced-motion` (checked .storybook/main.ts — just
// addon-a11y/addon-docs), and useReducedMotion() (Framer Motion) reads the
// real OS/browser media query directly, not anything a plain decorator can
// override — forcing it would mean mocking matchMedia globally for this one
// story file, which isn't the "straightforward" case worth adding. The
// static list that branch renders is exercised directly instead, in
// TutorialLookCard.stories.tsx and TutorialDetailCard.stories.tsx (the same
// two components TutorialStack's reduced-motion branch renders verbatim,
// just without the drag-stack wrapper around them) — anyone who wants to
// preview it for real can toggle their OS's reduce-motion setting and reload
// this file's own stories above.
