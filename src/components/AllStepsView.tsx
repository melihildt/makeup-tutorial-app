import { useLayoutEffect, useRef, useState } from 'react'
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

  // Drives the header's frosted background (below) — off at the very top of
  // the list (scrollTop 0), on once there's actually something scrolled up
  // underneath it to frost. Reintroduced after briefly being removed: the
  // frost was originally always-on, and at rest (nothing scrolled beneath
  // the header yet, since it's the first thing in the document) that just
  // read as a flat white-ish wash sitting over the page's own gradient
  // background rather than a glass effect over content — the user asked
  // for it to only kick in once there's real content behind it to justify
  // the effect.
  const [isScrolled, setIsScrolled] = useState(false)

  // Drives the *bottom* fade overlay (below) — hidden once the list is
  // scrolled all the way to its real end, since past that point there's
  // nothing left underneath to "hint continues below," so the overlay was
  // just sitting there as a stray band of gradient + rounded corner over
  // the card's own already-flat white bottom edge — a rendering-glitch
  // read, not a hint, and exactly what got reported. `scrollerRef` +
  // the layout effect below cover the case where the list is short enough
  // to start already-at-bottom (or not overflow at all), since `onScroll`
  // never fires on its own without an actual scroll gesture.
  const [hasReachedBottom, setHasReachedBottom] = useState(false)
  const scrollerRef = useRef<HTMLDivElement>(null)

  // docs/figma-allsteps-restyle.md, item 5 — hides the sticky header on
  // scroll-down, reveals it on scroll-up, like a native iOS collapsing nav
  // bar. AllStepsView-local, not built into ScreenHeader itself: StepScreen
  // (the header's other user) has no scrollable region at all, so there's
  // nothing there for this to react to — see the doc's "Scope" note.
  //
  // Compares each scroll event to the *previous* one (lastScrollTopRef),
  // not to a fixed origin, with asymmetric thresholds rather than a raw
  // "any movement" toggle: real trackpad/wheel input fires many small,
  // noisy scroll events per gesture, and reacting to every single one reads
  // as jittery. Hiding needs more cumulative downward movement than
  // revealing needs upward — deliberately easier to bring back than to
  // dismiss, the standard convention for this pattern (iOS Safari,
  // Twitter/X, Medium): someone scrolling back up is almost always looking
  // for the header, so it should come back fast, not need convincing.
  // HEADER_HIDE_MIN_SCROLL keeps it visible near the very top regardless of
  // direction, so a small scroll right at the start can never hide it.
  //
  // That threshold also has to clear the white card's own rounded top
  // corner (--radius-card, 20px), not just roughly match the header's own
  // height (~64px mobile / ~72px desktop) — the card starts immediately
  // after the header in document flow, no gap, so the rounded-corner region
  // sits right at ~64-92px. Hiding the header is a `translateY`, not a
  // layout change, so whatever's scrolled to y=0 once the header's own box
  // slides away is whatever the document actually has there — if that
  // threshold sat inside the corner's own range, hiding could expose the
  // card's curved corner poking up at the very top of the viewport, read
  // as a stray rounded-corner artifact (reported after shipping the
  // hide/show behavior — it can't happen while the header is permanently
  // visible, only once it can move). 120px clears both breakpoints' corner
  // zones with a safety margin, comfortably inside "still early in a
  // scroll gesture."
  //
  // All three numbers are a reasoned starting guess, not measured against
  // a real scroll gesture — same "ship a first guess, tune by feel" pass
  // this codebase's other hand-tuned values went through (WASH_TUNING in
  // StepScreen.tsx, the removed MotionTuner/WashTuner dev panels).
  const HEADER_HIDE_MIN_SCROLL = 120 // px — always visible at/under this
  const HEADER_HIDE_DELTA = 12 // px downward since the last event, to hide
  const HEADER_REVEAL_DELTA = 4 // px upward since the last event, to reveal
  const lastScrollTopRef = useRef(0)
  const [isHeaderHidden, setIsHeaderHidden] = useState(false)

  function updateScrollState(el: HTMLDivElement) {
    const { scrollTop } = el
    const delta = scrollTop - lastScrollTopRef.current
    lastScrollTopRef.current = scrollTop

    setIsScrolled(scrollTop > 0)
    // <= 1px tolerance for sub-pixel scroll-position rounding (seen across
    // browsers/zoom levels) rather than requiring an exact 0.
    setHasReachedBottom(el.scrollHeight - scrollTop - el.clientHeight <= 1)

    if (scrollTop <= HEADER_HIDE_MIN_SCROLL) setIsHeaderHidden(false)
    else if (delta > HEADER_HIDE_DELTA) setIsHeaderHidden(true)
    else if (delta < -HEADER_REVEAL_DELTA) setIsHeaderHidden(false)
    // else: small delta, leave the current hidden/visible state alone —
    // this is what actually prevents the jitter described above.
  }

  useLayoutEffect(() => {
    if (scrollerRef.current) updateScrollState(scrollerRef.current)
  }, [])

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
      // docs/figma-allsteps-restyle.md: this view is on the same cream
      // palette (#f7e9ca → #f9f3eb) as the home screen's gradient, not the
      // pinkish --gradient-bg-screen this comment originally (and
      // wrongly) assumed every step screen still used — StepScreen.tsx
      // had already moved to --gradient-bg-home independently, during the
      // earlier V5 pass (docs/figma-step-screen-restyle.md's own "Screen
      // background gradient" section), --gradient-bg-screen itself is
      // unused dead CSS now (see its own tokens.css comment). Confirmed
      // via a fresh pull of this view's own frame (node 702:2694). Own
      // --gradient-bg-list token, not --gradient-bg-home directly: same
      // colors, but a fixed-px fade distance instead of a percentage — see
      // --gradient-bg-list's own comment in tokens.css for why reusing
      // --gradient-bg-home's percentage here landed the fade at the wrong
      // pixel offset (a real, user-reported mismatch, not a style choice).
      style={{ background: 'var(--gradient-bg-list)' }}
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
        ref={scrollerRef}
        className="relative flex-1 overflow-y-auto overflow-x-hidden"
        onScroll={(e) => updateScrollState(e.currentTarget)}
      >
        {/* Sticky header — frosted-glass background (--color-list-header-bg,
            translucent white, + --blur-list-header's backdrop-filter blur),
            sized to just the header row itself. z-10 to paint above the
            list. No separate fade tail below it anymore — an earlier pass
            had one (to blend a *flat* header color into the content below
            once scrolled), but the user asked for the tinted gradient it
            painted to go, and now that the header itself is translucent +
            blurred rather than flat, the blur already does the "blend into
            scrolled content" job on its own; the tail was redundant on top
            of it, not load-bearing.

            The frost itself is gated on isScrolled, not always-on: at rest
            (scrollTop 0) there's nothing scrolled up underneath the header
            yet — it's the first thing in the document, the white card
            starts right after it — so a permanent translucent-white wash
            there just sat over the page's own gradient background as a
            flat haze, not a glass effect over content. Gating it means the
            header is fully transparent (no tint, no blur — just the plain
            gradient background showing through, matching the very-top
            resting look) until there's actually something behind it worth
            frosting.

            docs/figma-allsteps-restyle.md, item 5: this header now also
            hides on scroll-down and reveals on scroll-up, via
            isHeaderHidden — translateY(-100%) + opacity, not display/
            height, so it can't reflow the list or feed back into the
            scroll container's own scrollHeight. `inert` while hidden takes
            its buttons out of tab order instead of leaving them invisibly
            focusable off-screen; pointerEvents:none is the mouse/touch
            equivalent for browsers where `inert` isn't enough on its own.
            The frosted background is what makes this read as a native-style
            collapsing nav bar rather than a flat panel popping in and out —
            content sliding underneath it shows through, blurred, while
            it's up. */}
        {/* pt-[--space-2xs] md:pt-6, not pt-6 — matches StepScreen's own
            root split (see its comment on the same values): 8px on mobile
            is the app-wide screen-edge top-margin guideline (tokens.css,
            Figma node 738:8822) both screens now share; the extra bump to
            md:pt-6 on desktop only exists to keep this header's position
            identical to StepScreen's (whose own inset there serves the
            rounded-corner/backdrop look), not because this sticky header
            needs it. Without matching them, the toggle would sit at a
            different vertical position in each view on mobile — a visible
            jump switching between them. */}
        <div
          className="sticky top-0 z-10 pb-2 pt-[--space-2xs] md:pt-6"
          style={{
            background: isScrolled ? 'var(--color-list-header-bg)' : 'transparent',
            // 'blur(0px)', not 'none', for the off state — both render
            // identically (no visible blur), but only the former lets the
            // backdrop-filter transition below actually animate: 'none' and
            // a blur() function aren't interpolatable, so animating between
            // them would just snap instead of smoothly fading the frost in.
            backdropFilter: isScrolled ? 'blur(var(--blur-list-header))' : 'blur(0px)',
            WebkitBackdropFilter: isScrolled ? 'blur(var(--blur-list-header))' : 'blur(0px)',
            transform: isHeaderHidden ? 'translateY(-100%)' : 'translateY(0)',
            opacity: isHeaderHidden ? 0 : 1,
            pointerEvents: isHeaderHidden ? 'none' : 'auto',
            transition:
              'transform var(--duration-base) var(--ease-out-quart), opacity var(--duration-base) var(--ease-out-quart), background-color var(--duration-base) var(--ease-out-quart), backdrop-filter var(--duration-base) var(--ease-out-quart)',
          }}
          inert={isHeaderHidden}
        >
          <ScreenHeader
            activeView="list"
            onBack={onBack}
            onDone={onDone}
            onSelectStepView={onSelectStepView}
          />
        </div>

        {/* px-[--space-sm] (16px), not the old px-[--space-xs] (12px) —
            app-wide screen-edge margin guideline (tokens.css, Figma node
            738:8822), so this card's left/right edges line up with the
            header above it instead of sitting 4px further in. */}
        <div className="px-[--space-sm] pb-4">
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
              {steps.map(({ step, listTitle, description, products }, groupIndex) => (
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
                  {/* "Header + Description" — title/badge row plus the
                      instruction sentence, grouped as one unit with its own
                      pb-4 (16px), matching Figma's own nesting: that pb-4
                      stacks with the outer gap-4 below to put 32px between
                      the description and the first product row, vs. no gap
                      at all between the title row and the description
                      directly above it (neither Figma nor this wrapper
                      applies one there — only the title row's own py-3
                      and the paragraph's line-height separate them). */}
                  <div className="flex flex-col pb-4">
                    <div className="flex items-center gap-4 py-3">
                      {/* docs/figma-allsteps-restyle.md: was opacity-50 +
                          semibold + --font-size-step-title (16px, shared
                          with StepScreen's own big title) + no tracking — a
                          fresh pull of this view's own frame shows this
                          inline group title is full-opacity, Medium weight,
                          a smaller 15px: a different node from StepScreen's
                          title, not the same style reused. Tracking started
                          at -0.3px from that same pull, then the user opened
                          it up to -0.15px after seeing it on-device — see
                          --letter-spacing-list-group-title's own comment. */}
                      <p
                        className="flex-1 text-[length:var(--font-size-list-group-title)] tracking-[--letter-spacing-list-group-title]"
                        style={{ color: 'var(--color-text-primary)', fontWeight: 'var(--font-weight-medium)' }}
                      >
                        {listTitle}
                      </p>
                      <div className="flex shrink-0 items-center gap-1">
                        {/* docs/figma-allsteps-restyle.md: was opacity-50
                            stacked on top of a solid --color-text-primary,
                            reading ~40% dark instead of the intended 80% —
                            the fresh pull's badge/label color already has
                            that 80% alpha baked in (--color-text-product,
                            otherwise only used by ProductCard), so no extra
                            opacity utility belongs here. Badge background is
                            --color-badge-bg-list (10%), not the 5%
                            --color-badge-bg StepScreen's own top badge
                            uses — confirmed as a genuinely different value
                            on this view's own frame, not a shared token. */}
                        <span
                          className="rounded-[--radius-badge] bg-[--color-badge-bg-list] px-1 py-[3px] text-[length:var(--font-size-badge)] tracking-[--letter-spacing-shade]"
                          style={{ color: 'var(--color-text-product)', fontWeight: 'var(--font-weight-medium)' }}
                        >
                          {step}/{TOTAL_STEPS}
                        </span>
                        <span
                          className="text-[length:var(--font-size-badge)] tracking-[--letter-spacing-shade]"
                          style={{ color: 'var(--color-text-product)', fontWeight: 'var(--font-weight-medium)' }}
                        >
                          steps
                        </span>
                      </div>
                    </div>
                    {/* docs/figma-allsteps-restyle.md: the per-step
                        instruction sentence was never rendered in this view
                        at all — the data's been sitting unused in
                        STEP_CONTENT[step].description since this component
                        only ever read listTitle/products from it. 12px /
                        50%-opacity / Medium, matching the badge's own
                        "dimmed caption" treatment above (rather than
                        StepScreen's own description, which is a different,
                        larger 80%-opacity treatment for a different-sized
                        title). Tracking added after the user tightened it up
                        on-device — see --letter-spacing-shade's own comment
                        for why this reuses that token rather than a new one. */}
                    <p
                      className="text-[length:var(--font-size-product-sub)] opacity-50 tracking-[--letter-spacing-shade]"
                      style={{ color: 'var(--color-text-primary)', fontWeight: 'var(--font-weight-medium)' }}
                    >
                      {description}
                    </p>
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

              {/* docs/figma-allsteps-restyle.md: this Finish button's own
                  border-radius is 24px in a fresh pull of this view's
                  frame — a real pill (--height-action-button is 44px, so
                  24px clamps past the half-height point), not
                  ActionButton's usual 12px (--radius-button, shared with
                  StepScreen's step-7 Finish, left untouched). Scoped to
                  this call site via ActionButton's style-override prop
                  rather than changing the component's default. */}
              <ActionButton label="Finish" variant="final" onClick={onFinish} style={{ borderRadius: 24 }} />
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
          rendering glitch rather than a hint.

          docs/figma-allsteps-restyle.md: hidden once hasReachedBottom —
          without this it stayed pinned to the viewport bottom even once
          the list was scrolled all the way to its actual end, sitting over
          the card's already-flat, already-white bottom edge as a stray
          rounded-corner band with nothing left to fade out underneath it
          (reported as "I see the rounded corners at the end of the page").
          Same opacity-transition treatment as the header's own fade tail
          above, not an abrupt show/hide. */}
      {/* inset-x-[--space-sm] — must track the card wrapper's own
          horizontal inset above (also --space-sm now, was --space-xs) so
          this fade's rounded bottom corners actually land on the card's
          real edges rather than sitting narrower than it. */}
      <div
        className="pointer-events-none absolute inset-x-[--space-sm] bottom-0 h-10 rounded-b-[--radius-card]"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, #fff 100%)',
          opacity: hasReachedBottom ? 0 : 1,
          transition: 'opacity var(--duration-base) var(--ease-out-quart)',
        }}
      />
    </div>
  )
}
