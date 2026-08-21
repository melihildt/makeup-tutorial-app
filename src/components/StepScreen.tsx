import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { EyeIllustration } from './EyeIllustration'
import { ProductCard } from './ProductCard'
import { ScreenHeader } from './ScreenHeader'
import { ActionButton } from './ActionButton'
import radialNoiseUrl from '../assets/icons/v2/radial-noise.svg'
import { STEP_CONTENT, TOTAL_STEPS } from '../data/stepContent'

type StepScreenProps = {
  step: number
  /** Checked state for every product across every step, keyed by
   *  `${step}-${brand}-${name}` — owned by TutorialFlow and shared with
   *  AllStepsView so both views stay in sync. */
  checkedOverrides: Record<string, boolean>
  /** The product key most recently toggled by an actual click — see
   *  TutorialFlow's own comment on this state for why it has to live
   *  there. Only that key's ProductCard should play its check animation;
   *  every other card is just being re-rendered/remounted, not toggled. */
  justToggledKey: string | null
  /** Third arg is which step the toggled product belongs to — lets
   *  TutorialFlow remember "the step of the last item touched" so
   *  switching back from AllStepsView can return there. See
   *  TutorialFlow's lastToggledStep comment for the full reasoning. */
  onToggleChecked: (key: string, defaultChecked: boolean, step: number) => void
  /** Called when "next" is clicked (steps 1-6). */
  onNextStep?: () => void
  /** Called when "Finish" is clicked (step 7). Advances to the step-8 "done" screen. */
  onFinish?: () => void
  onBack?: () => void
  onDone?: () => void
  /** Called when the header's Widget icon is clicked, to switch to the All Steps list view. */
  onSelectListView?: () => void
}

/**
 * One tutorial step screen: header (back, step/list tabs, Done), a static
 * "N/7 steps" progress badge, the eye illustration with its title +
 * instruction sentence, the product checklist, and the bottom action
 * button (final variant only on step 7). Step 8 is the terminal "done"
 * screen — no badge, no products, no button.
 */
export function StepScreen({
  step,
  checkedOverrides,
  justToggledKey,
  onToggleChecked,
  onNextStep,
  onFinish,
  onBack,
  onDone,
  onSelectListView,
}: StepScreenProps) {
  const content = STEP_CONTENT[step]
  const isFinalStep = step === 7
  const isDoneScreen = step === 8

  // Whether `step` just increased or decreased, so the title/description
  // entrance below can slide in from the direction of travel (right on
  // Next, left on Back — standard push/pop stack-navigation convention).
  // Read during render (safe), written in an effect after commit (writing
  // directly during render risks divergence under Concurrent React's
  // double-invoke behavior).
  //
  // Correction to what used to be claimed here: StepScreen does NOT stay
  // mounted across every possible cause of a re-render — it only survives
  // actual step-to-step navigation. Switching to AllStepsView and back
  // unmounts StepScreen entirely (TutorialFlow renders StepScreen and
  // AllStepsView as separate trees, only one at a time), so this ref
  // resets on that return. Initializing it to `step` (the old behavior)
  // made `direction` default to 'forward' on every such remount — with no
  // real prior step to compare against, "you just moved forward" was
  // simply wrong, which is exactly the "switching views slides the text
  // like a step change" bug this was reported as. Starting at `null` lets
  // the render tell the difference: no known previous step means there's
  // nothing to compute a direction from, so the content below falls back
  // to a plain fade (same treatment AllStepsView uses for its own card)
  // instead of guessing a direction that isn't real.
  const prevStepRef = useRef<number | null>(null)
  const hasKnownDirection = prevStepRef.current !== null
  const direction = prevStepRef.current !== null && step < prevStepRef.current ? 'backward' : 'forward'
  useEffect(() => {
    prevStepRef.current = step
  }, [step])

  // Whether the product card is mid-exit after tapping Finish on step 7 —
  // see the card's JSX below for the full reasoning. `false` the rest of
  // the time; TutorialFlow's actual step-8 transition only fires once the
  // exit animation genuinely finishes (AnimatePresence's onExitComplete),
  // not on an assumed/guessed duration.
  const [isFinishing, setIsFinishing] = useState(false)

  function handleFinishClick() {
    if (!isFinishing) setIsFinishing(true)
  }

  // Guards the edge case where the user taps Back (or anything else that
  // changes `step`) during the ~150ms window while the card is still
  // folding away after Finish. A plain `isFinalStep`/`step === 7` check
  // inside onExitComplete's closure isn't safe here — that closure is
  // whatever was current at the moment AnimatePresence started the exit,
  // and if it's stale it would still see the step-7 values from back then,
  // not the fact that the user has since navigated to step 6. A ref is
  // mutable and always read live, even from an old closure, so it reflects
  // whatever step is *actually* current at the moment the exit finishes.
  const stepRef = useRef(step)
  useEffect(() => {
    stepRef.current = step
    // Eagerly clear isFinishing the moment `step` changes for any reason
    // other than the Finish exit's own onExitComplete (which already
    // clears it): if the user navigated away mid-exit, this restores the
    // card on whatever step they landed on right away, instead of leaving
    // it hidden until the original (by-then-stale) exit timer catches up.
    // A no-op in the normal case, since onExitComplete already reset it by
    // the time `step` actually changes to 8.
    setIsFinishing(false)
  }, [step])

  // Framer Motion's animations aren't CSS transitions/keyframes, so they
  // don't fall under index.css's global `prefers-reduced-motion` rule —
  // that only ever catches `animation-duration`/`transition-duration`.
  // Motion needs telling separately.
  const prefersReducedMotion = useReducedMotion()
  const cardSpring = prefersReducedMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 300, damping: 26, mass: 0.9 }
  // Deliberately not a spring — see the "Exit animations are faster than
  // entrances" guidance this app's motion work has followed throughout;
  // a bounce on the way *out* also tends to read as the card resisting
  // leaving, rather than a clean exit. Same curve as --ease-out-quart/
  // --duration-instant (tokens.css), just expressed as plain numbers
  // since Motion's transition prop doesn't read CSS custom properties.
  const cardExitTransition = prefersReducedMotion ? { duration: 0 } : { duration: 0.15, ease: [0.25, 1, 0.5, 1] as const }

  if (!content) {
    return null
  }

  return (
    // Fixed h-dvh (not min-h-dvh): the product card below is a flex
    // sibling of the scrollable region, not part of it, so its position
    // is only stable — pinned to the exact same spot from the bottom on
    // every step — if this outer frame can't grow taller than the
    // viewport itself. With min-h-dvh, any step whose content was even
    // slightly taller than the viewport made the *whole frame* grow to
    // fit (natural page scroll), shifting the card's position relative
    // to the viewport bottom by however much taller that step's content
    // was — which is exactly the inconsistency this fixes.
    // overflow-hidden: not fixing a visible bug here (md:py-6 below happens
    // to keep the header inset from the edges on desktop already, so
    // rounded-2xl was already showing there), but added to match
    // AllStepsView's root — see its own comment on the same property for
    // the actual problem it solves there. Genuine consistency, not just
    // papering over one symptom: both screens should clip to their rounded
    // shape the same way, not rely on one of them getting it right by
    // coincidence.
    // md:h-full: at the md breakpoint, App.tsx's wrapper switches this
    // frame from tracking the real browser viewport to a fixed 874px
    // desktop height (so it reads as a floating card, not a full-window
    // page) — h-full just means "fill whatever height that wrapper gives
    // me" instead of overriding it with another viewport-relative unit.
    // pt-4, not py-6: matches node 615:3037's Content wrapper (pt-[16px],
    // no bottom padding) — the mobile-real numbers this whole file was
    // re-tuned against. md:pt-6 md:pb-6 restores the old py-6 but desktop-
    // only, same reasoning as HomeScreen's root: that inset only earns its
    // keep on desktop, where it keeps the rounded corners visible against
    // the page backdrop; on mobile the frame fills the real viewport edge-
    // to-edge and rounding is dropped there too (md:rounded-2xl), so it
    // reads as a flush square screen — unconditional py-6 was just costing
    // ~48px of real content height for nothing — concretely part of why
    // the eye illustration was crowding the product card on a real device.
    <div
      className="relative mx-auto flex h-dvh w-full max-w-[402px] flex-col overflow-hidden pt-4 md:h-full md:rounded-2xl md:pb-6 md:pt-6"
      style={{ background: 'var(--gradient-bg-screen)' }}
    >
      <ScreenHeader
        activeView="step"
        onBack={onBack}
        onDone={onDone}
        onSelectListView={onSelectListView}
      />

      {/* Scrollable region: everything above the product card. flex-1
          makes it fill whatever space is left after the (fixed-height)
          header and card, so short steps' content just sits in a taller
          box (pushing nothing), and any step whose content is taller
          than that leftover space scrolls internally instead of growing
          the outer frame — the card's position never moves either way. */}
      {/* overflow-x-hidden alongside overflow-y-auto: setting only
          overflow-y leaves overflow-x at its default `visible`, making
          this a latent horizontally-scrollable surface even though
          nothing here currently overflows sideways — see HomeScreen.tsx's
          matching comment for the real bug this pattern caused there
          (the tutorial card stack's fly-off animation). Applied here too,
          defensively, since this container has the exact same shape. */}
      <div className="relative flex-1 overflow-y-auto overflow-x-hidden">
        {/* Paper-texture mask above the illustration — originally
            positioned at top-[114px] (see the old V1 874px-canvas
            derivation this replaced), computed from mt-[40px] + gap-[52px]
            above the illustration in this same div. The tighter node
            615:3037 spacing pass below removed exactly 40px above the
            illustration (p-[24px] + gap-[28px] instead of mt-[40px] +
            gap-[52px]) — shifted by that same 40px rather than re-derived
            from scratch, since the mask's own size/target position within
            the illustration didn't change, only how far down it now sits.

            z-index is required, not decorative: this div is
            position:absolute with z-index:auto, and EyeIllustration's
            own root is position:relative with z-index:auto too — both
            compete at the same CSS painting tier, ordered by DOM
            position, and EyeIllustration comes later in the tree.
            Without an explicit z-index here, the illustration's opaque
            layers paint *over* this mask instead of being veiled by it,
            so the grain only shows in the gaps around the artwork rather
            than on top of it. */}
        <div
          className="pointer-events-none absolute left-1/2 top-[74px] z-10 h-[273px] w-[322px] -translate-x-1/2"
          style={{ mixBlendMode: 'soft-light' }}
        >
          <img src={radialNoiseUrl} alt="" className="block size-full max-w-none" />
        </div>

        {/* Eye illustration + progress badge + title/description — node
            615:3037's "Graph + Step" block: p-[24px] all around, gap-28
            between each of the 3 children (badge, illustration, title
            block). Replaces the old 40/52/52px gaps (Figma's V1 Step_7
            spacing, node 509:7122) — those were tuned against the full
            874px desktop-style canvas, not the ~640px a real phone
            actually leaves after browser chrome (measured off node
            615:3037, a real 375x812 device frame), and were the main
            reason the illustration crowded the product card there. Flat
            flex column on purpose — EyeIllustration sizes itself via
            `width: 100%` of this direct parent, which only resolves
            correctly because this container has a definite (stretched)
            width; nesting badge+illustration in their own wrapper broke
            that (the wrapper's own width was indeterminate under
            items-center, so the percentage collapsed and the illustration
            rendered undersized) — don't reintroduce a wrapper here. */}
        <div className="relative flex flex-col items-center gap-[28px] p-[--space-lg]">
          {/* Kept in the layout (not unmounted) on the done screen — hiding
              it with `invisible` rather than skipping it entirely preserves
              the same 52px gap before the illustration, so the illustration
              and text land in the exact same spot as step 7 and the
              transition into this screen doesn't jump. */}
          {/* key={step}: forces a fresh mount on every step change so the
              fade-in below (a CSS `animation`, which plays on mount) always
              replays — same "animation, not transition" reasoning as
              ScreenHeader/CheckIndicator, just simpler here since it's a
              genuinely new step's badge every time, not an incidental
              remount to guard against. Kept deliberately quiet — a slow,
              opacity-only fade (no slide/scale) rather than the snappier
              feedback used elsewhere, since this is a passive progress
              hint, not something the user just acted on. */}
          <div
            key={`badge-${step}`}
            className={`flex items-center gap-1 ${isDoneScreen ? 'invisible' : ''}`}
            style={{ animation: 'step-fade-in var(--duration-layout) var(--ease-out-quart)' }}
          >
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

          {/* Step 8 has no illustration data of its own yet (phase 3) — the
              finished look visually matches step 7's completed eye, so reuse
              it rather than show the "not wired up" stub.

              Deliberately NOT keyed by step (unlike the badge/content
              blocks above) — EyeIllustration needs to stay mounted
              continuously across step changes so its own per-layer
              `key={layerKey}` reconciliation can tell which layers are
              genuinely new vs. already-there-just-recoloring; forcing a
              full remount here would make every layer replay its entrance
              on every step, which is exactly the "whole thing refreshes"
              feeling that was cut. See EyeIllustration.tsx for the actual
              diffing/stagger logic. One side effect: since step 8 passes
              the same effective illustration step (7) as step 7 itself,
              the 7→8 Finish transition plays no illustration motion — the
              artwork genuinely doesn't change, so that's correct; the
              title/description below still animates for that transition. */}
          <EyeIllustration step={isDoneScreen ? 7 : step} />

          {/* key={step} + direction-aware slide, same reasoning as the
              badge above. --content-slide-from (index.css's step-content-in
              keyframe) starts the content offset in the direction it's
              "coming from": positive (from the right) advancing forward,
              negative (from the left) going back.

              Only when hasKnownDirection, though — on the render right
              after a fresh mount (initial page load, or returning from
              AllStepsView) there's no real prior step to compare against,
              so this falls back to view-fade-in (index.css) instead: the
              same plain opacity + small-rise treatment AllStepsView uses
              for its own card, with no left/right implication. See
              prevStepRef's comment above for the full reasoning. */}
          <div
            key={`content-${step}`}
            className="flex flex-col items-center gap-2 text-center"
            style={
              hasKnownDirection
                ? ({
                    '--content-slide-from': direction === 'forward' ? '16px' : '-16px',
                    animation: 'step-content-in var(--duration-layout) var(--ease-out-quart)',
                  } as CSSProperties)
                : { animation: 'view-fade-in var(--duration-layout) var(--ease-out-quart)' }
            }
          >
            <p
              className="text-[length:var(--font-size-step-title)] opacity-50"
              style={{ color: 'var(--color-text-primary)', fontWeight: 'var(--font-weight-medium)' }}
            >
              {content.title}
            </p>
            <p
              className="text-balance text-[length:var(--font-size-step-description)] opacity-40"
              style={{
                color: 'var(--color-text-primary)',
                fontWeight: 'var(--font-weight-regular)',
                lineHeight: 1.3,
              }}
            >
              {content.description}
            </p>
          </div>
        </div>
      </div>

      {/* Product checklist card + bottom action button — a flex sibling
          of the scrollable region above, not part of it, so it's always
          exactly pb-4 from the bottom of the (fixed-height) frame on
          every step.

          Two nested motion elements doing two different jobs, both
          necessary:

          - The OUTER one (key="product-card", stable across every regular
            step) is what AnimatePresence actually tracks for entry/exit.
            Its `exit` animation only ever plays once — when Finish is
            tapped on step 7 and `isFinishing` removes it from this
            conditional — because its key never changes on a normal
            Next/Back, so AnimatePresence never sees it as "removed" for
            those. onExitComplete is what actually advances TutorialFlow to
            step 8 (via onFinish), *after* the exit genuinely finishes —
            not a guessed setTimeout duration.
          - The INNER one (key={step}) is what makes the card spring in
            fresh on every regular step change — remounting it is what
            replays `initial → animate`, same "animation needs a fresh
            mount" reasoning used throughout this app. It has no `exit` of
            its own, so a normal step change just swaps it instantly
            (no double animation) — only the outer element ever exits.

          If both used the same step-keyed identity, AnimatePresence would
          treat *every* regular step change as a removal-and-insertion too,
          playing the exit animation on every Next/Back — not just on
          Finish, which is the one moment it's meant for. */}
      <AnimatePresence
        onExitComplete={() => {
          // Only actually advance if step 7 is still where the user is —
          // see stepRef's own comment above for why a ref, not a plain
          // closure variable, is what makes this check trustworthy.
          if (stepRef.current === 7) {
            onFinish?.()
          }
          setIsFinishing(false)
        }}
      >
        {content.products.length > 0 && !isFinishing && (
          <motion.div
            key="product-card"
            className="px-[--space-xs] pb-4"
            // Bottom-anchored, matching the card's actual fixed position on
            // screen — both this exit and the entrance below rise/sink from
            // the bottom edge now, not the top, so the scale reads as
            // "growing up from where the card lives" rather than "dropping
            // in from somewhere above it."
            style={{ transformOrigin: 'bottom center' }}
            initial={false}
            exit={{ opacity: 0, y: 16, scaleY: 0.92 }}
            transition={cardExitTransition}
          >
            <motion.div
              key={step}
              className="flex flex-col rounded-[--radius-card] p-4"
              style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-card)', transformOrigin: 'bottom center' }}
              // Rises up from below into place (y: 16 → 0), not down from
              // above — the card is fixed to the bottom of the screen, so
              // entering from below reads as "arriving where it lives"
              // rather than falling in from above it.
              initial={{ opacity: 0, y: 16, scaleY: 0.94 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              transition={cardSpring}
            >
              {/* gap-3 (12px), not gap-4 — node 615:3037. */}
              <div className="flex flex-col gap-3">
                {content.products.map((product) => {
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
                <ActionButton
                  label={isFinalStep ? 'Finish' : 'Next'}
                  variant={isFinalStep ? 'final' : 'default'}
                  onClick={isFinalStep ? handleFinishClick : onNextStep}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
