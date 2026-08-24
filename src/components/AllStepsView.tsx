import { useState } from 'react'
import { ScreenHeader } from './ScreenHeader'
import { ActionButton } from './ActionButton'
import { ProductCard } from './ProductCard'
import { STEP_CONTENT, TOTAL_STEPS } from '../data/stepContent'

type AllStepsViewProps = {
  /** Checked state for every product across every step, keyed by
   *  `${step}-${brand}-${name}` — owned by TutorialFlow and shared with
   *  StepScreen so both views stay in sync. */
  checkedOverrides: Record<string, boolean>
  /** See StepScreen's copy of this prop — same TutorialFlow-owned state,
   *  shared so a toggle made in either view only animates in that one. */
  justToggledKey: string | null
  /** See StepScreen's copy of this prop for what the third arg is for —
   *  same reasoning, it's what lets TutorialFlow send you back to the
   *  right step when you leave this view via onSelectStepView below. */
  onToggleChecked: (key: string, defaultChecked: boolean, step: number) => void
  onBack?: () => void
  onDone?: () => void
  /** Called when the header's Search icon is clicked, to switch back to the
   *  per-step view — lands on whatever step's product was last toggled
   *  here, if any (TutorialFlow's lastToggledStep), not necessarily
   *  wherever StepScreen was paused before this view was opened. */
  onSelectStepView?: () => void
  /** Called when the bottom "Finish" button is clicked — same completion action as step 7's. */
  onFinish?: () => void
}

/**
 * All Steps list view: every step's products in one scrollable card,
 * grouped by step (short title + "N/7 steps" badge per group), with a
 * single Finish button at the end. Reached via the header's Widget icon.
 * Checked state is shared with the per-step screens via TutorialFlow
 * (same `${step}-${brand}-${name}` key), so toggling a product here or
 * on its step screen stays in sync in both places.
 */
export function AllStepsView({
  checkedOverrides,
  justToggledKey,
  onToggleChecked,
  onBack,
  onDone,
  onSelectStepView,
  onFinish,
}: AllStepsViewProps) {
  const steps = Object.entries(STEP_CONTENT)
    .map(([step, content]) => ({ step: Number(step), ...content }))
    .filter(({ step }) => step <= TOTAL_STEPS) // exclude the step-8 "done" entry

  // Drives the header's fade tail (below) — hidden at the very top of the
  // list so the card's own rounded top corners show cleanly against the
  // header, and fading in once there's actually something scrolled up
  // underneath it to blend out. Can't do this with CSS alone: it depends
  // on live scroll position, not anything expressible as a selector.
  const [isScrolled, setIsScrolled] = useState(false)

  return (
    // Fixed h-dvh (not min-h-dvh), same reasoning as StepScreen: the fade
    // overlay below needs to sit at a stable spot relative to the
    // viewport, pinned over whatever's currently scrolled into view —
    // it can't do that if the whole frame (and the page along with it)
    // just grows taller than the viewport for a long list.
    //
    // overflow-hidden: without it, rounded-2xl was doing nothing visible
    // here — the sticky header's own solid background paints flush to
    // this outer div's very top edge (its own top padding is 0; the
    // header's inset comes from the sticky wrapper's pt-4/md:pt-6 below,
    // not from this div), so it just covered wherever the rounded top
    // corners would otherwise show. This clips content to the rounded
    // shape instead of relying on padding to accidentally avoid the
    // problem. Doesn't affect the header's `sticky` behavior — that's
    // scoped to its actual scrolling ancestor (the overflow-y-auto div
    // below), not this outer one.
    // md:rounded-2xl, not rounded-2xl: on mobile the frame fills the real
    // viewport edge-to-edge, so rounding it just shows the page backdrop
    // color through the corners instead of a flush square screen — same
    // fix as App.tsx's own wrapper and HomeScreen/StepScreen's roots.
    <div
      className="relative mx-auto flex h-dvh w-full max-w-[402px] flex-col overflow-hidden md:h-full md:rounded-2xl"
      style={{ background: 'var(--gradient-bg-screen)' }}
    >
      {/* Scrollable region. The header now lives *inside* it (sticky, see
          below) rather than as a sibling above it — sticky positioning
          only pins an element within its actual scrolling ancestor, so
          for content to visibly scroll *underneath* the header (needed
          for the fade below to read as anything, rather than just a
          static gradient sitting over nothing) the header has to be a
          descendant of this scroll container, not a sibling of it. The
          bottom fade overlay stays a true sibling, outside the scroll —
          it doesn't need anything to scroll underneath it since it's
          pinned to the viewport bottom regardless of scroll position. */}
      {/* overflow-x-hidden alongside overflow-y-auto: setting only
          overflow-y leaves overflow-x at its default `visible`, making
          this a latent horizontally-scrollable surface even though
          nothing here currently overflows sideways — see HomeScreen.tsx's
          matching comment for the real bug this pattern caused there
          (the tutorial card stack's fly-off animation). Applied here too,
          defensively, since this container has the exact same shape. */}
      <div
        className="relative flex-1 overflow-y-auto overflow-x-hidden"
        onScroll={(e) => setIsScrolled(e.currentTarget.scrollTop > 0)}
      >
        {/* Sticky header — solid background (#e6d6d1, --gradient-bg-screen's
            own first stop; keep them in sync if that gradient changes)
            sized to just the header row itself, plus a separate fade
            *tail* absolutely positioned right below it. The tail is
            layout-neutral (position:absolute, out of flow) on purpose —
            sizing the fade by padding the sticky box's own height instead
            would push the list content down by that same amount, which
            isn't what a "fade" should do; this way the header stays a
            normal ~64px tall and the fade is purely a decorative 32px
            strip painted over whatever content has scrolled up under it.
            z-10 so both paint above the list.

            The tail is hidden until isScrolled — at rest (scrollTop 0)
            it would otherwise sit right over the card's own rounded top
            corners, washing them out with pink instead of letting them
            read clearly against the header above. */}
        {/* pt-4 md:pt-6, not pt-6 — matches StepScreen's own root split (see
            its comment on the same values): the extra 8px on desktop only
            exists to keep this header's position identical to StepScreen's
            (whose own inset there serves the rounded-corner/backdrop look),
            not because this sticky header needs it. Without matching them,
            the toggle would sit at a different vertical position in each
            view on mobile — a visible jump switching between them. */}
        <div className="sticky top-0 z-10 pb-2 pt-4 md:pt-6" style={{ background: '#e6d6d1' }}>
          <ScreenHeader
            activeView="list"
            onBack={onBack}
            onDone={onDone}
            onSelectStepView={onSelectStepView}
          />
          <div
            className="pointer-events-none absolute inset-x-0 top-full h-8"
            style={{
              background: 'linear-gradient(180deg, #e6d6d1 0%, rgba(230,214,209,0) 100%)',
              opacity: isScrolled ? 1 : 0,
              transition: 'opacity var(--duration-base) var(--ease-out-quart)',
            }}
          />
        </div>

        <div className="px-[--space-xs] pb-4">
          {/* Quiet fade + small rise on mount, applied to the white card
              only — not the screen's own root, which would also fade in
              the background gradient and the header/toggle along with it.
              Those are chrome, not content: they should just be there
              instantly, the same way they are on StepScreen (whose header
              never animates either). This card (like the rest of
              AllStepsView) is torn down and recreated wholesale by
              TutorialFlow's view === 'list' swap, so a CSS `animation`
              (plays on mount) is what actually fires here, not a
              `transition` (needs an existing element's style to change
              across two paints, which this element never gets — same
              reasoning as ScreenHeader/CheckIndicator elsewhere in this
              app). Deliberately just opacity + a small translateY, no
              scale/spring — this card is still a lot of content at once,
              and the bouncy treatment that suits StepScreen's compact
              product card would read as heavy stretched across this much
              of it. */}
          <div
            className="flex flex-col rounded-[--radius-card] p-4 pb-10"
            style={{
              background: 'var(--color-surface)',
              boxShadow: 'var(--shadow-card)',
              animation: 'view-fade-in var(--duration-layout) var(--ease-out-quart)',
            }}
          >
            <div className="flex flex-col gap-10">
              {steps.map(({ step, listTitle, products }, groupIndex) => (
                <div
                  key={step}
                  className="flex flex-col gap-4"
                  style={{
                    // Same view-fade-in keyframe as the white card above
                    // (opacity + small rise, no scale/spring — quiet, not
                    // the product card's bouncy treatment), just staggered
                    // per group so the list settles in top-to-bottom
                    // rather than all 7 groups appearing at once. Staggers
                    // *groups*, not each individual product row — 20+ rows
                    // each on their own delay would make the list feel slow
                    // to finish arriving, working against what a list
                    // needs (get out of the way, let people scan). `both`
                    // fill mode holds the invisible/offset state through
                    // each group's delay, so a later group doesn't flash
                    // visible before its own turn.
                    animation: 'view-fade-in var(--duration-layout) var(--ease-out-quart) both',
                    animationDelay: `${groupIndex * 50}ms`,
                  }}
                >
                  <div className="flex items-center gap-4 py-3">
                    <p
                      className="flex-1 text-[length:var(--font-size-step-title)] opacity-50"
                      style={{ color: 'var(--color-text-primary)', fontWeight: 'var(--font-weight-semibold)' }}
                    >
                      {listTitle}
                    </p>
                    <div className="flex shrink-0 items-center gap-1">
                      <span
                        className="rounded-[--radius-badge] bg-[--color-badge-bg] px-1 py-[3px] text-[length:var(--font-size-badge)] opacity-50"
                        style={{ color: 'var(--color-text-primary)', fontWeight: 'var(--font-weight-medium)' }}
                      >
                        {step}/{TOTAL_STEPS}
                      </span>
                      <span
                        className="text-[length:var(--font-size-badge)] opacity-50"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        steps
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    {products.map((product) => {
                      const key = `${step}-${product.brand}-${product.name}`
                      const checked = checkedOverrides[key] ?? product.checked
                      return (
                        <ProductCard
                          key={key}
                          image={product.image}
                          brand={product.brand}
                          name={product.name}
                          shade={product.shade}
                          checked={checked}
                          animate={key === justToggledKey}
                          onToggleChecked={() => onToggleChecked(key, product.checked, step)}
                        />
                      )
                    })}
                  </div>
                </div>
              ))}

              <ActionButton label="Finish" variant="final" onClick={onFinish} />
            </div>
          </div>
        </div>
      </div>

      {/* Fade overlay pinned to the bottom of the viewport (a sibling of
          the scrollable region, not inside it) — hints that the list
          continues below, whatever happens to be scrolled into view
          underneath it. Fades to white to match the card's own surface
          color, since this sits directly over the card. Sized to match
          the card's own pb-10 (the card's bottom padding was bumped from
          p-4's default to reserve exactly this much clean white space
          below its last item) — any taller than that and it washes over
          the Finish button's solid black fill, which reads as a
          rendering glitch rather than a hint. */}
      <div
        className="pointer-events-none absolute inset-x-[--space-xs] bottom-0 h-10 rounded-b-[--radius-card]"
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, #fff 100%)' }}
      />
    </div>
  )
}
