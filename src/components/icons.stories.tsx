import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  AtIcon,
  BackIcon,
  BookmarkGlyphIcon,
  BookmarkIcon,
  BoxIcon,
  CalculatorIcon,
  ChevronRightIcon,
  CloseIcon,
  DiamondIcon,
  DoneIcon,
  InfoIcon,
  LevelIcon,
  LinkIcon,
  LockIcon,
  MenuDotsIcon,
  MoonIcon,
  PlusIcon,
  RotateRightIcon,
  SearchIcon,
  SunIcon,
  UserIcon,
  WidgetIcon,
} from './icons'

// One labeled cell in the grid below — name + a neutral-ink swatch behind
// each icon (most icons here are themed via `currentColor`/CSS variables
// tied to --color-tutorial-card-text, not a fixed color of their own, so
// they need *some* background to read against; white keeps every icon's
// real opacity/weight visible rather than a mid-tone that would wash out
// the 50%-opacity ones).
function IconCell({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="flex size-[56px] items-center justify-center rounded-[12px] border border-solid"
        style={{ background: '#fff', borderColor: 'rgba(44, 41, 38, 0.1)', color: 'var(--color-tutorial-card-text)' }}
      >
        {children}
      </div>
      <p className="text-center text-[11px] leading-tight" style={{ color: 'var(--color-tutorial-card-text)' }}>
        {name}
      </p>
    </div>
  )
}

function IconGridSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] uppercase tracking-wide opacity-60" style={{ color: 'var(--color-tutorial-card-text)' }}>
        {title}
      </p>
      <div className="grid grid-cols-4 gap-4">{children}</div>
    </div>
  )
}

/**
 * Every icon in the app (icons.tsx), grouped by which screen originally
 * owned each one — see icons.tsx's own module comment for the full
 * consolidation story and the one real naming collision it surfaced
 * (BookmarkGlyphIcon vs. the toggle-state BookmarkIcon).
 */
function AllIcons() {
  return (
    <div className="flex max-w-[500px] flex-col gap-8 p-6">
      <IconGridSection title="Account screen">
        <IconCell name="BoxIcon">
          <BoxIcon />
        </IconCell>
        <IconCell name="BookmarkGlyphIcon">
          <BookmarkGlyphIcon />
        </IconCell>
        <IconCell name="CalculatorIcon">
          <CalculatorIcon />
        </IconCell>
        <IconCell name="ChevronRightIcon">
          <ChevronRightIcon />
        </IconCell>
      </IconGridSection>

      <IconGridSection title="Info / Product Detail overlays">
        <IconCell name="CloseIcon">
          <CloseIcon />
        </IconCell>
        <IconCell name="LinkIcon">
          <LinkIcon />
        </IconCell>
        <IconCell name="AtIcon">
          <AtIcon />
        </IconCell>
      </IconGridSection>

      <IconGridSection title="Home screen">
        <IconCell name="SunIcon (Day)">
          <SunIcon />
        </IconCell>
        <IconCell name="MoonIcon (Night)">
          <MoonIcon />
        </IconCell>
        <IconCell name="DiamondIcon (Glam)">
          <DiamondIcon />
        </IconCell>
        <IconCell name="InfoIcon">
          <InfoIcon />
        </IconCell>
        <IconCell name="UserIcon">
          <UserIcon />
        </IconCell>
      </IconGridSection>

      <IconGridSection title="My Products screen">
        <IconCell name="PlusIcon">
          <PlusIcon />
        </IconCell>
        <IconCell name="MenuDotsIcon">
          <MenuDotsIcon />
        </IconCell>
      </IconGridSection>

      <IconGridSection title="Tutorial card family">
        <IconCell name="BookmarkIcon (unsaved)">
          <BookmarkIcon filled={false} />
        </IconCell>
        <IconCell name="BookmarkIcon (saved)">
          <BookmarkIcon filled />
        </IconCell>
        <IconCell name="RotateRightIcon">
          <RotateRightIcon />
        </IconCell>
        <IconCell name="LevelIcon (easy)">
          <LevelIcon level="easy" />
        </IconCell>
        <IconCell name="LevelIcon (medium)">
          <LevelIcon level="medium" />
        </IconCell>
        <IconCell name="LevelIcon (experienced)">
          <LevelIcon level="experienced" />
        </IconCell>
        <IconCell name="LockIcon">
          <LockIcon />
        </IconCell>
      </IconGridSection>

      <IconGridSection title="Step screen header">
        <IconCell name="BackIcon">
          <BackIcon />
        </IconCell>
        <IconCell name="DoneIcon">
          <DoneIcon />
        </IconCell>
        <IconCell name="SearchIcon (active)">
          <SearchIcon active />
        </IconCell>
        <IconCell name="SearchIcon (inactive)">
          <SearchIcon active={false} />
        </IconCell>
        <IconCell name="WidgetIcon (active)">
          <WidgetIcon active />
        </IconCell>
        <IconCell name="WidgetIcon (inactive)">
          <WidgetIcon active={false} />
        </IconCell>
      </IconGridSection>
    </div>
  )
}

const meta = {
  title: 'Icons/All Icons',
  component: AllIcons,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof AllIcons>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
