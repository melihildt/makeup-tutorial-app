import type { CSSProperties } from 'react'
import { BackIcon, DoneIcon, SearchIcon, WidgetIcon } from './icons'

type ScreenHeaderProps = {
  /** Which view is currently showing — determines which of Search/Widget is highlighted. */
  activeView: 'step' | 'list'
  onBack?: () => void
  /** Search icon click — switches to the per-step view. */
  onSelectStepView?: () => void
  /** Widget icon click — switches to the All Steps list view (wired once that view exists). */
  onSelectListView?: () => void
  onDone?: () => void
}

// BackIcon/DoneIcon/SearchIcon/WidgetIcon (plus their shared
// ICON_OPACITY_ACTIVE/ICON_OPACITY_INACTIVE constants and the reasoning
// behind their viewBox/opacity choices) moved to icons.tsx along with
// every other icon in the app — see that file's own module comment for
// the consolidation, and its Step-screen-header section specifically for
// the V5 rebuild history and the "why native size, why these opacities"
// reasoning.

// V5 (docs/figma-step-screen-restyle.md): shared "frosted chip" chrome for
// every active/standalone header button — Back, Done, and whichever of
// Search/Widget is active. Exactly the same tokens + shape HomeScreen.tsx
// already uses for its own header icons (--color-header-icon-bg/border,
// --radius-filter-chip — see that token's own tokens.css comment: "V4
// reuses this same radius for the header icon boxes too") — this comment
// already said "reused here rather than duplicated under a new name" back
// when this constant was first written, but it was never actually
// `export`ed, so HomeScreen.tsx's info/user icon buttons and InfoOverlay
// .tsx's close button each ended up re-typing the same object literal by
// hand anyway (code review finding #7). Exported now so those call sites
// can import and spread it instead.
export const HEADER_CHIP_STYLE: CSSProperties = {
  background: 'var(--color-header-icon-bg)',
  borderColor: 'var(--color-header-icon-border)',
}

/**
 * Shared top header for the per-step screens and the All Steps list view:
 * back button, a Search/Widget tab pair that switches between those two
 * views, and an icon-only Done button.
 *
 * V5 rebuild (docs/figma-step-screen-restyle.md): replaces the old
 * rounded-full pill + sliding-highlight-circle toggle with two independent
 * rounded-[--radius-filter-chip] buttons — a real structural change, not a
 * reskin, confirmed against Figma's pulled markup (Step 1/2/3/5/6/7/8 all
 * show the same shape). The active button gets its own frosted chip
 * (HEADER_CHIP_STYLE); the inactive one is bare — no dimmed opacity on its
 * icon either, unlike the old V2 header's opacity-30 inactive state
 * (figma-v2-redesign.md): none of this pass's pulls show an opacity class
 * on the inactive CTA, so that dimming was dropped in this iteration, not
 * missed. Back and Done now get the same frosted-chip treatment too — they
 * were bare icon-only buttons before.
 */
export function ScreenHeader({
  activeView,
  onBack,
  onSelectStepView,
  onSelectListView,
  onDone,
}: ScreenHeaderProps) {
  const isListView = activeView === 'list'

  return (
    // px-[--space-sm] (16px), not the old flat 12px — matches the app-wide
    // screen-edge margin guideline (see tokens.css's own note on
    // --space-sm/--space-2xs, Figma node 738:8822): this header's icons
    // should sit flush with the same 16px line every other section on
    // these screens now aligns to (StepScreen's content column/product
    // sheet, AllStepsView's card), not its own separate inset.
    <div className="flex w-full items-start justify-between px-[--space-sm]">
      {/* Real back button on both views, not just the per-step screens.
          Previously hidden (an invisible spacer) on the All Steps list
          view under the assumption there was nothing to go "back" from
          there — a V2-era guess never actually checked against this
          view's own Figma frame. A fresh pull (docs/figma-allsteps-
          restyle.md, node 702:2694) shows the same back-arrow chip
          present on this view too, and TutorialFlow's onBack already has
          sensible behavior from here (steps back one step, or exits at
          step 1) — it was only ever visually unreachable. */}
      <button
        type="button"
        onClick={onBack}
        className="header-icon-button flex size-[40px] shrink-0 items-center justify-center rounded-[--radius-filter-chip] border-[0.5px] border-solid"
        style={HEADER_CHIP_STYLE}
      >
        <BackIcon />
      </button>

      {/* Outer group: content-sized (two 40px buttons) — rgba(255,255,255,0.6),
          matching Figma exactly (was rgba(255,255,255,0.2) under the old
          pill). `relative` so the sliding highlight below can position
          itself against this track, not against the whole header row.
          border-[--color-header-toggle-group-border] — this wrapper's own
          0.5px #E2E0DF stroke (node 896:9721), distinct from the #DAD8D7
          border on the individual chip buttons inside it; verify pass
          (2026-09-01) found it missing entirely. */}
      <div className="relative flex h-[40px] shrink-0 items-center rounded-[--radius-filter-chip] border-[0.5px] border-solid border-[--color-header-toggle-group-border] bg-[rgba(255,255,255,0.6)]">
        {/* Sliding highlight — a real segmented-control toggle, not two
            buttons independently mounting/unmounting their own chip. Was
            the latter through several rounds of trying to fix a border/
            timing bug (see the chip's own git history) that kept
            resurfacing in different forms each round: a scale-animated
            hairline border missing an edge, then a box-shadow chip
            desyncing from the button's own press-transform, then the
            icon's opacity snapping ahead of the chip's fade-in — three
            different root causes, but all stemming from the same
            structural choice: two independently-animated elements that
            only *happen* to look continuous when their timing lines up
            exactly. A single persistent element that slides between two
            fixed positions doesn't have that class of bug at all — there's
            only ever one chip, it never mounts/unmounts, and there's
            nothing else it needs to stay in sync with. `translateX(100%)`
            (not a hardcoded 40px) ties the slide distance to this
            element's own width, so it can't drift out of sync with
            `size-[40px]` if that ever changes.
            docs/figma-step-screen-restyle.md's "old rounded-full pill +
            sliding-highlight-circle toggle" note is about a genuinely
            different, older (pre-V5) design — this isn't a revert to
            that, just the same "one element translates" mechanism applied
            to the current two-square-chip shape, at the user's own
            request after the mount/unmount approach kept producing new
            timing bugs.

            One more wrinkle this ran into: Search/Widget don't actually
            toggle state *within* one mounted screen — tapping either one
            switches TutorialFlow between rendering StepScreen and
            AllStepsView entirely (see TutorialFlow.tsx), each with its
            *own* `<ScreenHeader>`. This exact div unmounts and a fresh one
            mounts on every switch — plain CSS `transition` (below) can't
            animate across that, a freshly-mounted element has no "old
            position" to interpolate from, it just appears at its final
            spot. `header-toggle-highlight` (index.css) is the actual fix:
            a `view-transition-name` that lets the browser's View
            Transitions API match this element across the two separate
            mounts and morph between their captured positions — see
            TutorialFlow.tsx's `document.startViewTransition` calls for
            the other half of this. The `transition` property below still
            matters for its own sake (any future same-instance update to
            this element), just isn't what drives the cross-screen slide. */}
        <div
          aria-hidden="true"
          className="header-toggle-highlight pointer-events-none absolute left-0 top-0 size-[40px] rounded-[--radius-filter-chip]"
          style={{
            background: 'var(--color-header-icon-bg)',
            boxShadow: 'inset 0 0 0 0.5px var(--color-header-icon-border)',
            transform: isListView ? 'translateX(100%)' : 'translateX(0)',
            transition: 'transform var(--duration-base) var(--ease-out-quart)',
          }}
        />
        <button
          type="button"
          onClick={onSelectStepView}
          aria-pressed={!isListView}
          className="header-icon-button relative flex size-[40px] items-center justify-center rounded-[--radius-filter-chip]"
        >
          <SearchIcon active={!isListView} />
        </button>
        <button
          type="button"
          onClick={onSelectListView}
          aria-pressed={isListView}
          className="header-icon-button relative flex size-[40px] items-center justify-center rounded-[--radius-filter-chip]"
        >
          <WidgetIcon active={isListView} />
        </button>
      </div>

      <button
        type="button"
        onClick={onDone}
        className="header-icon-button flex size-[40px] shrink-0 items-center justify-center rounded-[--radius-filter-chip] border-[0.5px] border-solid"
        style={HEADER_CHIP_STYLE}
      >
        <DoneIcon />
      </button>
    </div>
  )
}
