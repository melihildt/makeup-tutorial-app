import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { EyeIllustration } from './EyeIllustration'
import { ProductCard } from './ProductCard'
import { ScreenHeader } from './ScreenHeader'
import { ActionButton } from './ActionButton'
import { EASE_OUT_QUART } from './TutorialCard'
import radialNoiseUrl from '../assets/icons/v2/radial-noise.svg'
import { STEP_CONTENT, TOTAL_STEPS } from '../data/stepContent'

/** Fixed reserved height for the bottom product-sheet slot, in px —
 *  see the sheet wrapper's own comment (below, in StepScreen's JSX) for
 *  why the text above needs this to be a constant instead of each step's
 *  own actual card height. Measured live off the rendered card
 *  (`.getBoundingClientRect().height`) across every real step: 238px for
 *  a 2-product step (1-5, 7 all landed on this exact number — shade
 *  lines don't add height, since ProductCard's own row height is pinned
 *  to its fixed product-image box regardless of a shade line's extra
 *  text), 159px for a 1-product step (4, 6). 238 is the max of the two,
 *  so it's what every step reserves, including the shorter ones. If a
 *  future step ever ships 3+ products, this needs bumping to match, or
 *  that step's sheet grows taller than the reservation and pokes up past
 *  where the text above was centered against. */
const PRODUCT_SHEET_RESERVED_HEIGHT = 238

/** Fixed reserved height for the step description, in px — same "reserve
 *  the tallest real case" fix as PRODUCT_SHEET_RESERVED_HEIGHT above,
 *  applied to the other thing on this screen whose actual size varies per
 *  step: the description's own line count. The title is *not* a source of
 *  drift on its own — measured live across all 7 steps (some 27+
 *  characters, e.g. "Add Depth with a Dark Shade") and it's always
 *  exactly 1 line (24px) at this column's width, never wraps. The
 *  description does: anywhere from 1 line (step 2, 15.6px) to 3 (step 4,
 *  46.78px, its own longest copy). Both title and description sit inside
 *  the same flex-1 justify-center content block (see that div's own
 *  comment above), which centers {title, gap, description} as one unit —
 *  so a description that's sometimes 15.6px and sometimes 46.78px tall
 *  shifted the *title's* start position by roughly half that 31px swing
 *  between steps, on top of whatever slide the step-content-in animation
 *  itself was already playing. Reported as the title/paragraph "not
 *  looking smooth" through the transition — the horizontal slide was
 *  fine, but it had a real vertical jump riding along with it that
 *  varied by which step you'd landed on.
 *
 *  Reserving 48px (rounds up from the measured 46.78px 3-line case) on
 *  the description itself, and leaving it top-aligned inside that taller
 *  box (a plain <p>'s default flow — no extra alignment needed) rather
 *  than centered, makes {title, gap, description} add up to the exact
 *  same total height on every real step, so the centering math places
 *  the title — and the description's own top edge, right under it — at
 *  an identical spot regardless of the step's actual copy length. Any
 *  leftover reserved space, for a shorter description, lands invisibly
 *  below its own text, not above it. If a future step's description ever
 *  needs a 4th line, this needs bumping to match. */
const STEP_DESCRIPTION_RESERVED_HEIGHT = 48

/** Skin-tone radial wash's tuned position/size/color — was briefly a live
 *  WashTuner dev panel (same pattern as TutorialCard.tsx's now-removed
 *  MotionTuner, see that file's git history) while these numbers were
 *  being eyeballed directly on a real phone; now settled on and baked in
 *  as a plain constant, panel removed, same lifecycle MotionTuner went
 *  through. See the wash div's own comment (below, in this file's JSX)
 *  for the hard-edge top/bottom seam bug this shape caused, fixed
 *  independently of these particular values. */
const WASH_TUNING = {
  centerXPct: 50,
  centerYPct: 50,
  radiusX: 205,
  radiusY: 175,
  boxHeight: 370,
  colorR: 245,
  colorG: 231,
  colorB: 222,
  edgeFade: 50,
}

type StepScreenProps = {
  step: number
  /** Checked state for every product across every step, keyed by
   *  `${step}-${brand}-${name}` — owned by TutorialFlow and shared with
   *  AllStepsView so both views stay in sync. */
  checkedOverrides: Record<string, boolean>
  /** Product keys most recently toggled by an actual click — see
   *  TutorialFlow's own comment on this state for why it has to live
   *  there (a Set, not a single key: two products toggled within the same
   *  ~260ms window must each finish their own animation independently).
   *  Only a key in this set should have its ProductCard play the check
   *  animation; every other card is just being re-rendered/remounted, not
   *  toggled. */
  justToggledKeys: Set<string>
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
  justToggledKeys,
  onToggleChecked,
  onNextStep,
  onFinish,
  onBack,
  onDone,
  onSelectListView,
}: StepScreenProps) {
  const content = STEP_CONTENT[step]
  // Derived from TOTAL_STEPS (code review finding, was a raw `=== 7`/`=== 8`
  // pair here, independent of the TOTAL_STEPS this same file already
  // imports for display two lines up) — see TutorialFlow.tsx's own
  // LAST_MAKEUP_STEP/DONE_STEP for the sibling constants derived the same
  // way.
  const isFinalStep = step === TOTAL_STEPS
  const isDoneScreen = step === TOTAL_STEPS + 1

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

  // hasKnownDirection/direction, frozen per step instead of recomputed on
  // every render — fixes a real bug, not just a defensive rewrite. Reading
  // prevStepRef.current fresh on every render (the old approach) meant its
  // value silently changed between this step's *own* first and second
  // render: null on the first (nothing committed yet), but already set to
  // `step` itself by the time any later render of that same step happens,
  // since the effect below runs right after that first commit. So
  // hasKnownDirection flipped false → true, and the content div's
  // `animation` style two effects down actually changed value — from
  // view-fade-in to step-content-in — on the *second* render of a step the
  // user never actually navigated away from. A changed animation-name
  // always (re)starts that animation, so any re-render of the step screen
  // for an unrelated reason (checking a product, most commonly — step 1's
  // first product ships pre-checked, so the very first tap a user makes
  // there is on the second product) replayed the title/description
  // slide-in. Reported as "the text and description animate when I check
  // the second product" and confirmed live: getAnimations() on that div
  // showed a fresh step-content-in run (currentTime 0) starting right on
  // that tap, not just on Next/Back. Computing this once per step — the
  // first time that step's content renders — and reusing it for every
  // later render of the *same* step keeps the style value (and therefore
  // the animation) stable until the step genuinely changes.
  const contentAnimRef = useRef<{ step: number; hasKnownDirection: boolean; direction: 'forward' | 'backward' } | null>(
    null,
  )
  if (contentAnimRef.current === null || contentAnimRef.current.step !== step) {
    contentAnimRef.current = {
      step,
      hasKnownDirection: prevStepRef.current !== null,
      direction: prevStepRef.current !== null && step < prevStepRef.current ? 'backward' : 'forward',
    }
  }
  const { hasKnownDirection, direction } = contentAnimRef.current
  useEffect(() => {
    prevStepRef.current = step
  }, [step])

  // Guards against rapid double/triple-tapping Next before the badge/
  // content's own step-content-in keyframe finishes playing — see
  // AUDIT.md's Interruptibility category: a keyframe (not a transition)
  // getting remounted mid-play by a second tap restarts it from zero,
  // reading as a strobe rather than a continuation. Ref, not state: this
  // only needs to gate a callback, never needs to trigger a re-render of
  // its own.
  const isAnimatingContentRef = useRef(false)
  useEffect(() => {
    isAnimatingContentRef.current = true
    // 350ms matches --duration-layout, the exact duration step-fade-in/
    // step-content-in themselves already run at (see their own
    // `animation` values below).
    const id = setTimeout(() => {
      isAnimatingContentRef.current = false
    }, 350)
    return () => clearTimeout(id)
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

  function handleNextClick() {
    if (isAnimatingContentRef.current) return
    onNextStep?.()
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
  const cardExitTransition = prefersReducedMotion ? { duration: 0 } : { duration: 0.15, ease: EASE_OUT_QUART }

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
    // pt-[--space-2xs] (8px), not py-6: the app-wide screen-edge margin
    // guideline (tokens.css's own note, Figma node 738:8822) — supersedes
    // the older pt-4/16px this was tuned to against node 615:3037's
    // Content wrapper, a less-authoritative earlier pull. AllStepsView's
    // own sticky header intentionally mirrors this exact value (see that
    // file's comment on its own pt-[--space-2xs]) so the header sits at
    // the same vertical position in both views — keep them in sync if this
    // ever changes again. md:pt-6 md:pb-6 restores the old py-6 but
    // desktop-only, same reasoning as HomeScreen's root: that inset only
    // earns its keep on desktop, where it keeps the rounded corners
    // visible against the page backdrop; on mobile the frame fills the
    // real viewport edge-to-edge and rounding is dropped there too
    // (md:rounded-2xl), so it reads as a flush square screen —
    // unconditional py-6 was just costing ~48px of real content height for
    // nothing — concretely part of why the eye illustration was crowding
    // the product card on a real device.
    <div
      className="relative mx-auto flex h-dvh w-full max-w-[402px] flex-col overflow-hidden pt-[--space-2xs] md:h-full md:rounded-2xl md:pb-6 md:pt-6"
      // V5 (docs/figma-step-screen-restyle.md): background moved off the
      // shared --gradient-bg-screen token (#e6d6d1 → #f5e7de → #fbf7f5,
      // still 3-stop) onto --gradient-bg-home (#f7e9ca → #f9f3eb 7.179%,
      // 2-stop) — confirmed identical on Step 1/7/8's pulls, and it's
      // literally the same gradient the home screen's V4 pass already
      // defined, not a new value. Points at --gradient-bg-home directly
      // rather than changing --gradient-bg-screen's own value, because
      // that token is still shared with AllStepsView (which also hardcodes
      // its start color, #e6d6d1, into its sticky header) — AllStepsView
      // is explicitly deferred, so its background stays exactly as-is
      // until its own Figma pass.
      style={{ background: 'var(--gradient-bg-home)' }}
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
        {/* Skin-tone radial wash, BEHIND everything in this region — V5
            (docs/figma-step-screen-restyle.md): missing entirely before
            this pass. Figma's own "Background-eye-radial" layer (a
            warm off-white ellipse fading to transparent, replacing flat
            yellowish background right behind the eye) sits as a sibling
            *behind* "Content" at the full-screen level, roughly centered
            on "Graph + Step" but bleeding ~8% of its height above and
            ~17% below (measured via get_metadata: wash spans y=110-626,
            "Graph + Step" spans y=142-556, both in Figma's own 874px
            canvas). Our DOM doesn't split header/content the same way
            Figma's mockup does (no separate 94px address-bar chroming
            "Content" off from this scrollable region), so the "above"
            bleed has nowhere real to go — clamped to top:0 instead of a
            small negative offset, which would just get clipped by
            overflow-y-auto invisibly anyway. Height (440px) and center
            position derived from the *live* "Graph + Step" block's own
            measured height (376.98px in the browser) scaled by Figma's
            same bleed ratios, not hardcoded from Figma's absolute 516px
            (which assumes a taller canvas than this screen actually has).
            Ellipse radii and color stops (40%→100%) were originally
            Figma's own values (327x258, decoded from its
            `gradientTransform` matrix on the source SVG radial gradient),
            then re-tuned live on a real phone via a temporary WashTuner
            dev panel (same lifecycle as TutorialCard.tsx's now-removed
            MotionTuner) once the box-height/edge-fade seam below made the
            wash's real position/size worth seeing clearly — settled on
            radiusX 205 / radiusY 175 / boxHeight 370, tighter and shorter
            than Figma's own numbers, and baked into WASH_TUNING above.

            maskImage: fixes a visible hard-edge seam at this div's own
            top AND bottom edges — top reported first as "a line between
            the toggle and the eye illustration," then the exact same bug
            on the *bottom* edge reported separately as "a line between
            the eye illustration and the bottom sheet" once the step-
            centering work (see the content column's own comment) started
            reliably leaving open background space right around where
            this div's bottom edge lands. Root cause, confirmed by
            inspecting the live box in the browser (not guessed): the
            ellipse is centered at 50% of this box (y=boxHeight/2 from
            either edge), with a vertical radius bigger than that
            half-height — so *both* edges sit partway through the
            gradient's own 40%→100% fade, not all the way at 100% (fully
            transparent). That leaves real, non-zero alpha still painted
            on the div's very first *and* very last pixel rows, jumping to
            true zero the instant you step outside the div in either
            direction — a hard edge, not a fade, on both ends. (Swapping
            the wash to solid red during diagnosis made the top one
            obvious; the bottom one is the exact same shape, just easy to
            miss since it used to land inside the illustration/text block
            rather than in open background — the step-centering pass is
            what pushed it into visible territory on every step, not
            something that pass broke on its own.) A short opacity ramp on
            *both* the div's own top and bottom edgeFade px forces alpha
            to actually reach 0 right at each seam and ease from there,
            instead of arriving pre-loaded with partial opacity —
            independent of the gradient's own math, so it can't
            reintroduce either cutoff if those numbers ever change.
            Values (color, position, radii, box height, edge fade) come
            from the WASH_TUNING constant above rather than being inlined
            here directly, since the mask math below needs boxHeight and
            edgeFade twice each. One deliberate simplification made
            alongside the re-tune: the original had two slightly different
            RGB values (245,231,222 at the 40% stop vs. 251,247,245 at the
            100%-transparent stop) — visually a no-op at alpha 0, but the
            browser still interpolates *both* RGB and alpha across the
            fade, so the two colors were quietly tinting the fade-out's
            own midpoint. Using the *same* RGB for both stops (varying
            only alpha) means WASH_TUNING's single color governs the
            wash's entire visible tint, with nothing hidden behind it. */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0"
          style={{
            height: WASH_TUNING.boxHeight,
            backgroundImage: `radial-gradient(ellipse ${WASH_TUNING.radiusX}px ${WASH_TUNING.radiusY}px at ${WASH_TUNING.centerXPct}% ${WASH_TUNING.centerYPct}%, rgba(${WASH_TUNING.colorR},${WASH_TUNING.colorG},${WASH_TUNING.colorB},1) 40%, rgba(${WASH_TUNING.colorR},${WASH_TUNING.colorG},${WASH_TUNING.colorB},0) 100%)`,
            maskImage: `linear-gradient(to bottom, transparent 0, black ${WASH_TUNING.edgeFade}px, black ${WASH_TUNING.boxHeight - WASH_TUNING.edgeFade}px, transparent ${WASH_TUNING.boxHeight}px)`,
            WebkitMaskImage: `linear-gradient(to bottom, transparent 0, black ${WASH_TUNING.edgeFade}px, black ${WASH_TUNING.boxHeight - WASH_TUNING.edgeFade}px, transparent ${WASH_TUNING.boxHeight}px)`,
          }}
        />

        {/* Paper-texture mask above the illustration — top-[58px]/
            h-[250px]/w-[300px], opacity 0.4, scale-90% grain, soft-light
            blend. V5 (docs/figma-step-screen-restyle.md) went through
            several rounds landing here: a Figma-matched re-derivation
            (top-[33px]/h-[264px], numerically closer to Figma but read
            smaller/more cramped on review) → reverted to the pre-V5
            top-[74px]/h-[273px] → that read as barely-noticeable grain →
            tuned live via a temporary dev-only panel (now removed) through
            two more rounds of opacity/blend-mode/scale (0.35/overlay/1x →
            0.6/soft-light/0.9x → final 0.4/soft-light/0.9x). These are
            real, deliberately-chosen values now, not a placeholder — don't
            "fix" them back toward Figma's own raw numbers without a fresh
            reason to revisit.

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
          className="pointer-events-none absolute left-1/2 top-[58px] z-10 h-[250px] w-[300px] -translate-x-1/2 opacity-40"
          style={{ mixBlendMode: 'soft-light' }}
        >
          <img
            src={radialNoiseUrl}
            alt=""
            className="block size-full max-w-none"
            style={{ transform: 'scale(0.9)' }}
          />
        </div>

        {/* Eye illustration + progress badge + title/description — node
            615:3037's "Graph + Step" block was p-[24px] all around;
            horizontal is now px-[--space-sm] (16px) instead, matching the
            app-wide screen-edge margin guideline (tokens.css, Figma node
            738:8822) so this block's left/right edges line up with the
            header and product sheet below rather than sitting 8px further
            in. Vertical stays py-[--space-lg] (24px, split out rather than
            changed) — that's this column's own top/bottom breathing room
            against the header above and product sheet below, unrelated to
            the horizontal margin guideline, and min-h-full/the reserved-
            height constants below already account for it as-is. Gap
            between each of the 3 children (badge, illustration, title
            block) was 28px under that V3 spacing pass, replacing the old
            40/52/52px gaps (Figma's V1 Step_7 spacing, node 509:7122) —
            those were tuned against the full 874px desktop-style canvas,
            not the ~640px a real phone actually leaves after browser
            chrome. V5 (docs/figma-step-screen-restyle.md) bumped the gap
            again, 28px → 40px — confirmed on Step 1/2/3/5/6/7's pulls, a
            real increase back toward (not all the way to) the pre-V3
            number, not V3 being undone. Flat flex column on purpose —
            EyeIllustration sizes itself via `width: 100%` of this direct
            parent, which only resolves correctly because this container
            has a definite (stretched) width; nesting badge+illustration in
            their own wrapper broke that (the wrapper's own width was
            indeterminate under items-center, so the percentage collapsed
            and the illustration rendered undersized) — don't reintroduce a
            wrapper here.

            min-h-full (new): on real mobile (h-dvh, ~640-740px of real
            content height) this column's own natural content height
            already roughly fills the scrollable region above the product
            card, so there was never much leftover to notice. On the
            desktop/browser frame (App.tsx's md:h-[874px], routinely taller
            than any real phone) the same natural-height column left a big
            *unclaimed* gap between the description and the product card
            below it — reported as "more space between the eye
            illustration and the text," i.e. the text reads as jammed
            right under the illustration with all the slack dumped below
            it instead, rather than sitting centered in the room it
            actually has. min-h-full stretches this column to the
            scrollable region's own full height (that region's height is
            already just "screen minus header minus product card," so
            100% of it is exactly the space between the illustration and
            the product sheet) so the flex-1 content block below has
            something real to grow into and center itself inside.
            min-height, not height: a short viewport with a long
            description still needs to grow *past* 100% and let the
            ancestor's overflow-y-auto scroll, not get clipped at exactly
            the available height. */}
        <div className="relative flex min-h-full flex-col items-center gap-[40px] px-[--space-sm] py-[--space-lg]">
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
            style={{ animation: 'step-fade-in var(--duration-step-content) var(--ease-out-quart)' }}
          >
            {/* Verify pass (2026-09-01): both spans used to be
                --color-text-primary + opacity-50, composited to a darker,
                warmer gray than Figma's own badge — a fresh pull of this
                exact badge (node 896:9731-9733, Step 7) shows a flat
                #f1efee bg / #848281 text pair instead, plus tracking
                (-0.12px) neither span had at all. Reuses --letter-spacing-
                shade rather than a new token — same shared "BeautyNotes/
                p-12" tracking AllStepsView's own badge already reuses it
                for (see that token's own comment); this was the one
                sibling badge left out of that convention. */}
            <span
              className="rounded-[--radius-badge] bg-[--color-badge-bg] px-1 py-[3px] text-[length:var(--font-size-badge)] tracking-[--letter-spacing-shade]"
              style={{ color: 'var(--color-badge-text)', fontWeight: 'var(--font-weight-medium)' }}
            >
              {step}/{TOTAL_STEPS}
            </span>
            <span
              className="text-[length:var(--font-size-badge)] tracking-[--letter-spacing-shade]"
              style={{ color: 'var(--color-badge-text)', fontWeight: 'var(--font-weight-medium)' }}
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
              prevStepRef's comment above for the full reasoning.

              flex-1 justify-center (new, see the column's own min-h-full
              comment above): this is the one child that claims the
              column's leftover height and centers *itself* inside it —
              badge and EyeIllustration stay exactly as they were, sized
              to their own content and pinned to the top of the column, so
              only the text moves. Deliberately not centering the whole
              column instead (e.g. justify-center on the outer flex
              column): that would also push the illustration itself down
              off the top edge on a tall/desktop frame, which isn't what
              was asked for — the illustration+badge group stays anchored
              to the top, only the text floats in the room left below it.
              On mobile, where the column's natural content height already
              consumes ~all of min-h-full, flex-1 has no real leftover
              space to grow into and justify-center is a no-op — same
              tight spacing as before, matching "I don't see this on
              mobile." */}
          <div
            key={`content-${step}`}
            className="flex flex-1 flex-col items-center justify-center gap-2 text-center"
            style={
              hasKnownDirection
                ? ({
                    '--content-slide-from': direction === 'forward' ? '16px' : '-16px',
                    animation: 'step-content-in var(--duration-step-content) var(--ease-out-quart)',
                  } as CSSProperties)
                : { animation: 'view-fade-in var(--duration-layout) var(--ease-out-quart)' }
            }
          >
            {/* V5 (docs/figma-step-screen-restyle.md): both title and
                description dropped their old opacity pairing (opacity-50 /
                opacity-40) — title is now full opacity, description is
                opacity-80. Confirmed identically across Step 1/2/3/5/6/7's
                pulls, not just Step 1. */}
            <p
              className="text-[length:var(--font-size-step-title)] tracking-[--letter-spacing-step-title]"
              style={{ color: 'var(--color-text-primary)', fontWeight: 'var(--font-weight-medium)' }}
            >
              {content.title}
            </p>
            {/* Verify pass (2026-09-01): color was --color-text-primary +
                opacity-80 (composites to a darker ink than Figma's own
                flat swatch) and had no tracking set — a fresh pull of this
                exact paragraph (node 896:9738, Step 7) shows a flat
                #656462 fill (--color-info-overlay-heading, the same
                "BeNoApp/Chips Text Accessible/1" swatch used elsewhere in
                this app) plus -0.12px tracking (--letter-spacing-shade,
                same reasoning as the badge above). */}
            <p
              className="text-balance text-[length:var(--font-size-step-description)] tracking-[--letter-spacing-shade]"
              style={{
                color: 'var(--color-info-overlay-heading)',
                // V5: was --font-weight-regular (400) — Figma's title +
                // description share one Inter Medium (500) wrapper, the
                // description was never actually Regular weight.
                fontWeight: 'var(--font-weight-medium)',
                lineHeight: 1.3,
                // See STEP_DESCRIPTION_RESERVED_HEIGHT's own comment: pins
                // the title (and this paragraph's own top edge) to the
                // same spot on every step regardless of how many lines
                // this step's copy actually needs. A plain <p> flows its
                // text from the top by default, so a shorter description
                // just leaves quiet unused space below itself here, not
                // above — nothing else to opt into for top-alignment.
                minHeight: STEP_DESCRIPTION_RESERVED_HEIGHT,
              }}
            >
              {content.description}
            </p>
          </div>
        </div>
      </div>

      {/* Product checklist card + bottom action button — a flex sibling
          of the scrollable region above, not part of it, so it's always
          flush with the bottom of the (fixed-height) frame on every step.
          V5 (docs/figma-step-screen-restyle.md): dropped the pb-4 that
          used to inset it from the bottom edge — Figma's own "Products"
          wrapper has no bottom padding at all, the card's bottom edge is
          the wrapper's own edge. Side padding is now px-[--space-sm]
          (16px) — was px-[--space-xs] (12px) under that V5 pull; the
          app-wide screen-edge margin guideline (tokens.css, Figma node
          738:8822 — that node's own "Products" > "Container" sits at
          x=16, 370px wide inside a 402px frame) supersedes it, so this
          sheet's edges now line up with the header and content column
          above instead of sitting 4px further in. Only the *sides*
          changed here; the *bottom* is still the wrapper's own edge, no
          bottom padding.

          minHeight wrapper (new) — fixes the step-screen text (above)
          landing at a different height depending on which step's sheet
          is showing. The scrollable region above sizes itself via
          min-h-full against *this* element's real, rendered height (the
          two are flex siblings in the same root column, splitting
          whatever height isn't already claimed by the header) — so a
          158px 1-product sheet (steps 4/6) used to leave the scrollable
          region ~79px taller than a 238px 2-product sheet (every other
          step), and the step-screen content's own flex-1-centered text
          block landed correspondingly lower on the short-sheet steps.
          Reserving a fixed PRODUCT_SHEET_RESERVED_HEIGHT here — sized to
          the tallest real sheet, not each step's own actual one — makes
          every step yield the *same* height to this slot regardless of
          how many products are actually in it, so the scrollable region
          above (and the text centered inside it) comes out identical on
          every step. flex flex-col justify-end keeps the actual
          (possibly shorter) sheet bottom-anchored within that reserved
          box, same as it was already bottom-anchored against the screen
          itself before this wrapper existed — a short sheet just leaves
          blank reserved space above itself now, inside this box, rather
          than never having claimed that space at all. Only reserved when
          a sheet can actually appear this step (products.length > 0) —
          step 8 (the done screen) never shows one, in any variation, so
          there's nothing for it to be inconsistent *with*; reserving here
          too would just add a mysterious blank block under it.

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
      <motion.div
        // Animates this wrapper's own reserved-height collapse instead of
        // letting it disappear in one frame — this only ever changes
        // (content.products.length flips from >0 to 0) on the Finish→Done
        // transition, the rarest and highest-emotion moment in this flow,
        // so it's worth a real transition rather than a layout snap.
        //
        // Two things verified live, both by directly polling the
        // element's own rendered height across the transition (RAF-level
        // sampling, not assumed):
        //
        // 1. NOT the `layout` prop: tried first, but it does nothing here
        //    — `layout` uses the FLIP technique, which visually
        //    compensates a layout change with an inverse transform
        //    computed as oldSize/newSize; collapsing to a *target* height
        //    of 0 makes that ratio divide by zero, so there's no valid
        //    inverse transform to animate from — confirmed the height
        //    snapped instantly (238→0, zero intermediate frames).
        // 2. NOT animating `minHeight` via `animate` either: also tried,
        //    also confirmed snapping instantly with no interpolation —
        //    Framer Motion doesn't recognize `minHeight` as an animatable
        //    style key, so it just sets the value directly rather than
        //    tweening it. Plain `height` (below) IS one of Motion's
        //    recognized animatable properties (the standard expand/
        //    collapse pattern) — confirmed this one actually interpolates
        //    frame-by-frame, not just by reasoning from Motion's docs.
        //
        // A real layout-property tween (not FLIP) is what AUDIT.md's
        // Performance category would normally flag, but this is a
        // one-shot, rare transition (once per tutorial completion), not a
        // frequent one, so the tradeoff is deliberate here. `height`
        // instead of `minHeight` also means this box no longer *grows*
        // past PRODUCT_SHEET_RESERVED_HEIGHT if some future step's sheet
        // ever exceeds it (it would clip instead) — matches
        // PRODUCT_SHEET_RESERVED_HEIGHT's own comment that a future
        // 3+-product step already needs that constant bumped anyway; no
        // current step is affected.
        initial={false}
        animate={{ height: content.products.length > 0 ? PRODUCT_SHEET_RESERVED_HEIGHT : 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.35, ease: EASE_OUT_QUART }}
        className={content.products.length > 0 ? 'flex flex-col justify-end' : undefined}
      >
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
              className="px-[--space-sm]"
              // Bottom-anchored, matching the card's actual fixed position on
              // screen — both this exit and the entrance below rise/sink from
              // the bottom edge now, not the top, so the scale reads as
              // "growing up from where the card lives" rather than "dropping
              // in from somewhere above it."
              style={{ transformOrigin: 'bottom center' }}
              initial={false}
              exit={{ opacity: 0, transform: 'translateY(16px) scaleY(0.92)' }}
              transition={cardExitTransition}
            >
              <motion.div
                key={step}
                // V5 (docs/figma-step-screen-restyle.md) claimed top-
                // corners-only 32px radius here — a verify pass (2026-09-01,
                // fresh get_design_context on this exact node, 896:9740)
                // reads a literal rounded-tl-[20px] rounded-tr-[20px] in
                // Figma's own output instead, i.e. --radius-card's usual
                // 20px, just top-corners-only rather than all four (the
                // bottom-flush-with-screen reasoning below is still
                // correct, only the radius number was wrong). Treated as
                // the design having moved on since that V5 pull rather than
                // re-litigating a settled call: this is a second,
                // independent, node-specific pull directly contradicting
                // the first, not ambiguity within one pull. Padding:
                // pt-[20px] px-[16px] pb-[16px] (was uniform p-4) — top
                // grows 4px, sides/bottom unchanged, still correct.
                // border: Figma only strokes the top/left/right edges of
                // this container (border-l/border-r/border-t, no
                // border-b) — the bottom edge is flush with the screen's
                // own bottom edge, nothing to separate it from. Was
                // border on all four sides, which drew a stray hairline
                // right at the viewport's bottom edge. Color itself
                // (--color-container-border, 0.5px #F1EFEE) still
                // confirmed on this same node, unchanged.
                className="flex flex-col rounded-t-[20px] border-x-[0.5px] border-t-[0.5px] border-solid border-[--color-container-border] px-4 pb-4 pt-5"
                style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-card-elevated)', transformOrigin: 'bottom center' }}
                // Rises up from below into place (translateY 16px → 0), not
                // down from above — the card is fixed to the bottom of the
                // screen, so entering from below reads as "arriving where it
                // lives" rather than falling in from above it. Composed as a
                // single `transform` string (not the `y`/`scaleY` shorthand
                // props) so this animates on the compositor instead of the
                // main thread — Framer Motion's x/y/scale shorthands are not
                // hardware-accelerated.
                initial={{ opacity: 0, transform: 'translateY(16px) scaleY(0.94)' }}
                animate={{ opacity: 1, transform: 'translateY(0px) scaleY(1)' }}
                transition={cardSpring}
              >
                {/* gap-4 (16px) — V5 (was gap-3/12px under node 615:3037's
                    tighter V3 spacing pass), confirmed on every pulled step. */}
                <div className="flex flex-col gap-4">
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
                        animate={justToggledKeys.has(key)}
                        onToggleChecked={() => onToggleChecked(key, product.checked, step)}
                      />
                    )
                  })}
                  <ActionButton
                    label={isFinalStep ? 'Finish' : 'Next'}
                    variant={isFinalStep ? 'final' : 'default'}
                    onClick={isFinalStep ? handleFinishClick : handleNextClick}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
