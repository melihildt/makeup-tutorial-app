import { useState } from 'react'
import {
  animate as animateValue,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
  type PanInfo,
} from 'framer-motion'
import lookImage1 from '../assets/looks/soft-smokey-eye-1.jpg'
import lookImage2 from '../assets/looks/soft-smokey-eye-2.jpg'
import miaImage1 from '../assets/looks/mia-odyssey-1.jpg'
import miaImage2 from '../assets/looks/mia-odyssey-2.jpg'
import autumnImage1 from '../assets/looks/autumn-hermes-1.jpg'
import autumnImage2 from '../assets/looks/autumn-hermes-2.jpg'
import mattesImage1 from '../assets/looks/everyday-mattes-1.jpg'
import mattesImage2 from '../assets/looks/everyday-mattes-2.jpg'
import cardGhostTexture from '../assets/looks/card-ghost-texture.jpg'

/**
 * Tutorial stack card — "BigCard" component, node 642:5092
 * (Tech-Experimentation). TutorialLookCard is the card's own look, at
 * rest; TutorialStack (bottom of this file) is what drives a set of them
 * through a self-contained, drag-native deck (front card + one peeking
 * behind, advanced by swiping the front card — see TutorialStack's
 * module comment for why this isn't scroll-linked).
 *
 * Only "Soft Smokey Eye" has a real tutorial behind it (TutorialFlow is
 * hard-coded to that content) — the other three now have real photos too
 * (all four `images` are set, `placeholderColors` is unused/legacy at this
 * point, kept on the type rather than deleted in case a future entry needs
 * to fall back to it) but are still decorative taps, same "not wired up
 * yet" spirit as HomeScreen's Day/Night/Glam filter chips: looking real
 * now, not functional yet.
 */
export type Tutorial = {
  id: string
  title: string
  brand: string
  durationMinutes: number
  hasContent: boolean
  images: [string, string] | null
  placeholderColors: [string, string] | null
}

export const TUTORIALS: Tutorial[] = [
  {
    id: 'soft-smokey-eye',
    title: 'Soft Smokey Eye',
    brand: 'Tom Ford SS 2019',
    durationMinutes: 25,
    hasContent: true,
    images: [lookImage1, lookImage2],
    placeholderColors: null,
  },
  {
    id: 'mia-odyssey',
    title: 'Mia for The Odyssey',
    brand: 'Nina Park',
    durationMinutes: 15,
    hasContent: false,
    // Swapped from [miaImage1, miaImage2]: images[0] is ImagePair's right/
    // shorter slot, images[1] is the left/taller one — reversing the pair
    // moves what was on the left over to the right, and vice versa.
    images: [miaImage2, miaImage1],
    placeholderColors: null,
  },
  {
    id: 'autumn-hermes',
    title: 'Autumn by Hermès',
    brand: 'Gregoris Pyrpylis',
    durationMinutes: 15,
    hasContent: false,
    images: [autumnImage2, autumnImage1],
    placeholderColors: null,
  },
  {
    id: 'everyday-mattes',
    title: 'Everyday Mattes',
    brand: 'Westman Gucci',
    durationMinutes: 15,
    hasContent: false,
    images: [mattesImage2, mattesImage1],
    placeholderColors: null,
  },
]

/** Bookmark toggle icon — replaces the old decorative HeartIcon.
 *  `filled=false` is node 663:5946 ("Name=Bookmark, State=Normal", from
 *  the BigCard reference node 648:2): the hollow-ribbon outline,
 *  fill-opacity 0.5. `filled=true` is the real node 663:6184
 *  ("State=Selected") — user supplied the direct link after the tools
 *  available here couldn't surface it themselves (no Code Connect access
 *  on this file's plan, and a design-system search came back empty; ask
 *  next time instead of guessing). Turns out to be the *same* outline
 *  path's outer boundary (the ribbon silhouette, notch included) with its
 *  inner hole-cutout subpath dropped — i.e. the identical shape, just
 *  solid instead of hollow — painted at full opacity (Figma's "Dark/100%",
 *  no dimming), not the hand-approximated curve this had before. */
function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width={22}
      height={24}
      viewBox="0 0 22.0003 24.0035"
      fill="none"
      className={filled ? undefined : 'opacity-50'}
      aria-hidden="true"
    >
      {filled ? (
        <path
          d="M19.1371 24C18.7672 23.999 18.4011 23.9247 18.0601 23.7814C17.719 23.638 17.4097 23.4285 17.1501 23.165L11.0001 17.051L4.85012 23.169C4.45515 23.5697 3.94861 23.8422 3.39654 23.9508C2.84447 24.0594 2.27247 23.9992 1.75512 23.778C1.23264 23.5678 0.785669 23.205 0.472582 22.7369C0.159494 22.2688 -0.00515925 21.7171 0.000123236 21.154V5C0.000123236 3.67392 0.526908 2.40215 1.46459 1.46447C2.40227 0.526784 3.67404 0 5.00012 0L17.0001 0C17.6567 0 18.3069 0.129329 18.9135 0.380602C19.5202 0.631876 20.0714 1.00017 20.5357 1.46447C21 1.92876 21.3683 2.47996 21.6195 3.08658C21.8708 3.69321 22.0001 4.34339 22.0001 5V21.154C22.0057 21.7167 21.8417 22.268 21.5293 22.7361C21.217 23.2041 20.7709 23.5672 20.2491 23.778C19.8969 23.9253 19.5189 24.0008 19.1371 24Z"
          fill="var(--color-tutorial-card-text)"
        />
      ) : (
        <path
          d="M19.1371 24C18.7672 23.999 18.4011 23.9247 18.0601 23.7814C17.719 23.638 17.4097 23.4285 17.1501 23.165L11.0001 17.051L4.85012 23.169C4.45515 23.5697 3.94861 23.8422 3.39654 23.9508C2.84447 24.0594 2.27247 23.9992 1.75512 23.778C1.23264 23.5678 0.785669 23.205 0.472582 22.7369C0.159494 22.2688 -0.00515925 21.7171 0.000123236 21.154V5C0.000123236 3.67392 0.526908 2.40215 1.46459 1.46447C2.40227 0.526784 3.67404 0 5.00012 0L17.0001 0C17.6567 0 18.3069 0.129329 18.9135 0.380602C19.5202 0.631876 20.0714 1.00017 20.5357 1.46447C21 1.92876 21.3683 2.47996 21.6195 3.08658C21.8708 3.69321 22.0001 4.34339 22.0001 5V21.154C22.0057 21.7167 21.8417 22.268 21.5293 22.7361C21.217 23.2041 20.7709 23.5672 20.2491 23.778C19.8969 23.9253 19.5189 24.0008 19.1371 24ZM5.00012 2C4.20447 2 3.44141 2.31607 2.8788 2.87868C2.31619 3.44129 2.00012 4.20435 2.00012 5V21.154C1.99976 21.3206 2.04879 21.4836 2.14102 21.6224C2.23325 21.7612 2.36455 21.8695 2.51831 21.9337C2.67208 21.9979 2.84143 22.0151 3.00496 21.9831C3.1685 21.9512 3.31888 21.8714 3.43712 21.754V21.754L10.3001 14.933C10.4875 14.7468 10.7409 14.6422 11.0051 14.6422C11.2693 14.6422 11.5228 14.7468 11.7101 14.933L18.5651 21.752C18.6834 21.8694 18.8338 21.9492 18.9973 21.9811C19.1608 22.0131 19.3302 21.9959 19.4839 21.9317C19.6377 21.8675 19.769 21.7592 19.8612 21.6204C19.9535 21.4816 20.0025 21.3186 20.0021 21.152V5C20.0021 4.20435 19.6861 3.44129 19.1234 2.87868C18.5608 2.31607 17.7978 2 17.0021 2H5.00012Z"
          fill="var(--color-tutorial-card-text)"
        />
      )}
    </svg>
  )
}

/** Top-right timer pill — rounded-tr matches the card's own outer radius so
 *  the two curves read as one continuous corner (node 635:5048/5018/etc). */
function TimerBadge({ minutes }: { minutes: number }) {
  return (
    <div className="flex w-full flex-col items-end">
      <div
        className="flex items-center justify-center rounded-bl-[16px] rounded-tr-[--radius-tutorial-card] py-[6px] pl-4 pr-6"
        style={{ background: 'var(--color-timer-badge-bg)' }}
      >
        <p
          className="whitespace-nowrap text-[12px] uppercase opacity-80"
          style={{ color: 'var(--color-tutorial-card-text)', fontWeight: 'var(--font-weight-semibold)' }}
        >
          {minutes} min
        </p>
      </div>
    </div>
  )
}

/** The two overlapping photos (or placeholder swatches, if a future entry
 *  ever ships without real photos — all four `TUTORIALS` entries have them
 *  now). One shared geometry reused across every tutorial — the source
 *  design varies these numbers slightly per variant, but matching each
 *  variant's exact sub-pixel layout individually isn't worth chasing. */
function ImagePair({ tutorial }: { tutorial: Tutorial }) {
  const shadow = '0px 4px 20px 0px rgba(67, 48, 35, 0.2)'
  return (
    <div className="relative h-[219px] w-full">
      {/* Shorter image, right side. Exact values from the Figma inspector
          (not the get_design_context reconstruction, which had this right
          the first time — my "sign flip" edit last pass was wrong; ground
          truth confirms +1.773deg): 143x166.44, rotate(1.773deg). Offset
          (72.72px) is the precise pulled position, replacing an earlier
          rounded 84px that left the pair further apart than the design. */}
      <div className="absolute left-1/2 top-[30px] h-[170.784px] w-[148.081px] -translate-x-1/2" style={{ marginLeft: '72.72px' }}>
        <div className="flex h-full w-full items-center" style={{ transform: 'rotate(1.773deg)' }}>
          {tutorial.images ? (
            <img
              alt=""
              src={tutorial.images[0]}
              className="h-[166.44px] w-[143px] rounded-[20px] object-cover"
              style={{ boxShadow: shadow }}
            />
          ) : (
            <div
              className="h-[166.44px] w-[143px] rounded-[20px]"
              style={{ background: tutorial.placeholderColors![0], boxShadow: shadow }}
            />
          )}
        </div>
      </div>
      {/* Taller image, left side. Exact Figma values: 143x213,
          rotate(-2.387deg). Offset -70.63px, same precision correction. */}
      <div className="absolute left-1/2 top-0 h-[218.771px] w-[151.747px] -translate-x-1/2" style={{ marginLeft: '-70.63px' }}>
        <div className="flex h-full w-full items-center" style={{ transform: 'rotate(-2.387deg)' }}>
          {tutorial.images ? (
            <img
              alt={`Model wearing the ${tutorial.title} look`}
              src={tutorial.images[1]}
              className="h-[213px] w-[143px] rounded-[20px] object-cover"
              style={{ boxShadow: shadow }}
            />
          ) : (
            <div
              className="h-[213px] w-[143px] rounded-[20px]"
              style={{ background: tutorial.placeholderColors![1], boxShadow: shadow }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

type TutorialLookCardProps = {
  tutorial: Tutorial
  onSelect?: () => void
  /** True for every card except the one currently at the front of the
   *  stack — keeps mid-transition/peeking cards from being a stray tab
   *  stop or click target while they're not the active one. */
  disabled?: boolean
  /** Opacity for the timer badge and title/byline/heart row specifically,
   *  separate from the card's own overall opacity. Stacked cards overlap at different
   *  rotations as they cross-fade — two cards' *text* both fully legible
   *  at once reads as broken (found this scrolling the built stack: two
   *  titles literally overlapping mid-transition), where the same overlap
   *  on photos alone just reads as "there's another card underneath,"
   *  which is the effect this app wants. So text fades in on a narrower
   *  band than the card itself — only legible once a card's basically
   *  the front one, not for the whole time it's peeking. Undefined (the
   *  static, non-stacked usage) means always fully opaque. */
  detailsOpacity?: MotionValue<number>
  /** Bookmark toggle state — lifted all the way up to TutorialStack (see
   *  its own module comment) rather than local, so it survives this exact
   *  card staying mounted as it cycles through peek/front/peek again. */
  saved?: boolean
  onToggleSave?: () => void
}

/** The look of one card, at rest. TutorialStack (below) is what actually
 *  drives it through the scroll-linked stack — this component itself
 *  stays dumb about scroll/drag, it just renders a card.
 *
 *  Root is a `role="button"` div, not a real `<button>`: the bookmark
 *  toggle needs its own independently-tappable control (open the tutorial
 *  vs. save the look are two different actions now), and nesting a real
 *  `<button>` inside a `<button>` is invalid HTML — React's DOM API will
 *  still render it without the browser silently relocating it the way
 *  parsing raw HTML would, but it's broken for keyboard/screen-reader
 *  navigation (two activatable controls collapsed into one stop) and for
 *  click bubbling (the inner tap would also fire the outer one without
 *  careful stopPropagation everywhere). A div with role="button" +
 *  explicit tabIndex/onKeyDown reproduces exactly what the native button
 *  gave up (Enter/Space activation, tab order, disabled state), while
 *  leaving room for one real nested `<button>` for the bookmark. */
export function TutorialLookCard({ tutorial, onSelect, disabled, detailsOpacity, saved, onToggleSave }: TutorialLookCardProps) {
  return (
    <div
      role="button"
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      onClick={disabled ? undefined : onSelect}
      onKeyDown={
        disabled
          ? undefined
          : (e) => {
              // Space also scrolls the page on a native button unless the
              // default is prevented — replicating that here since this
              // is a div now, not a real button.
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect?.()
              }
            }
      }
      // active:scale-[0.97] (motion audit, Home screen only): a plain tap
      // used to get zero acknowledgment before the screen changed — only a
      // drag got feedback, via gripScale on the wrapping motion.div in
      // TutorialStackCard. Safe alongside that: a disabled card (every
      // card but the front one) has no onClick/onKeyDown attached above,
      // so :active only ever fires on the one card that's actually
      // tappable, and stacks harmlessly with gripScale on the rare frame
      // both are transiently true (pointerdown-before-drag-threshold).
      className={`relative flex h-full w-[338px] flex-col items-center gap-1 overflow-hidden pb-6 text-left active:scale-[0.97] ${disabled ? '' : 'cursor-pointer'}`}
      style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-tutorial-card)',
        boxShadow: 'var(--shadow-tutorial-card)',
        transition: 'transform var(--duration-instant) var(--ease-out-quart)',
      }}
    >
      <motion.div className="w-full" style={detailsOpacity ? { opacity: detailsOpacity } : undefined}>
        <TimerBadge minutes={tutorial.durationMinutes} />
      </motion.div>
      <div className="flex w-full flex-col items-center gap-6 px-6">
        <ImagePair tutorial={tutorial} />
        <motion.div
          className="flex w-full items-start justify-between"
          style={detailsOpacity ? { opacity: detailsOpacity } : undefined}
        >
          <div className="flex flex-col items-start gap-1">
            <p
              style={{
                fontFamily: 'var(--font-family-serif-card)',
                fontSize: '24px',
                color: 'var(--color-tutorial-card-text)',
              }}
            >
              {tutorial.title}
            </p>
            <div className="flex items-start gap-1 text-[12px]" style={{ fontWeight: 'var(--font-weight-medium)' }}>
              <p className="opacity-70" style={{ color: 'var(--color-tutorial-card-text)' }}>
                By
              </p>
              <p className="underline decoration-solid opacity-70" style={{ color: 'var(--color-tutorial-card-text)' }}>
                {tutorial.brand}
              </p>
            </div>
          </div>
          {/* Real nested <button>, not a div — see this component's own
              module comment for why the root had to stop being a <button>
              to make this valid. stopPropagation so tapping the bookmark
              doesn't also open the tutorial underneath it. key={saved...}
              forces a remount on toggle (same pattern as CheckIndicator)
              so check-pop reliably replays every time, not just the first —
              a bare re-render wouldn't restart a CSS `animation`. disabled
              mirrors the card's own disabled state: only the front card's
              bookmark is ever tappable, matching every other control here. */}
          <button
            type="button"
            disabled={disabled}
            aria-pressed={saved}
            aria-label={saved ? `Remove ${tutorial.title} from saved looks` : `Save ${tutorial.title}`}
            onClick={(e) => {
              e.stopPropagation()
              onToggleSave?.()
            }}
            className="relative shrink-0"
          >
            <span
              key={saved ? 'saved' : 'unsaved'}
              className="block"
              style={{ animation: 'check-pop var(--duration-instant) var(--ease-out-quart)' }}
            >
              <BookmarkIcon filled={!!saved} />
            </span>
          </button>
        </motion.div>
      </div>
    </div>
  )
}

/** Ghost "not-yet-revealed card" placeholder, node 635:5015 ("Card-Behind")
 *  — originally a fixed, separately-positioned/rotated static prop behind
 *  the front card (rotate(7deg), exact value from the Figma inspector).
 *  Now embedded *inside* each TutorialStackCard instead, at that card's
 *  own size and position with no rotation of its own — the parent already
 *  applies the card's live rotation, so this just needs to fill that same
 *  box; a second hardcoded rotate here would double up on top of it.
 *  --radius-tutorial-card (32px, matching the real card), not the
 *  original --radius-tutorial-card-behind (24px) — that number was right
 *  for a separately-sized static prop, but this now sits exactly inside
 *  the real card's own box, so it needs the real card's own corner radius
 *  or the two curves visibly disagree at the crossfade edge.
 *
 *  Purely decorative: doesn't represent a specific tutorial, just "here's
 *  the next one, not shown yet." Source design uses a photo texture tinted
 *  gold via mix-blend-overlay — this now uses the real texture asset
 *  (card-ghost-texture.jpg, downsized/recompressed PNG→JPEG from the
 *  original ~618KB export down to ~58KB, no visible difference) directly
 *  as the image, not layered under a separate --color-card-behind-tint
 *  overlay: the source photo is already gold-toned on its own, so the
 *  flat-swatch tint it stood in for is retired rather than kept as a
 *  redundant second layer on top of a photo that already reads as gold.
 *  `opacity` drives the reveal — see useCardMotion's contentOpacity. */
export function CardBehind({ opacity, className }: { opacity?: MotionValue<number>; className?: string }) {
  return (
    <motion.div
      aria-hidden="true"
      className={`absolute inset-0 overflow-hidden ${className ?? ''}`}
      style={{
        borderRadius: 'var(--radius-tutorial-card)',
        boxShadow: 'var(--shadow-tutorial-card)',
        opacity,
      }}
    >
      <img alt="" src={cardGhostTexture} className="size-full object-cover" />
    </motion.div>
  )
}

/** Card height is content-driven on TutorialLookCard normally, but the
 *  stack below positions every card `absolute inset-0` on top of each
 *  other (so it can cross-fade/rotate between them), which needs an
 *  explicit height to size that box. Every tutorial shares the same
 *  layout geometry (see ImagePair's module comment), so one constant is
 *  accurate for all of them, not an approximation.
 *
 *  359, not 346: the button's own `pb-6` (24px) was being silently
 *  clipped down to an 11px rendered gap — this fixed height was 13px
 *  short of what the content + a real 24px of bottom padding actually
 *  need, and `overflow-hidden` on the button ate the difference instead
 *  of erroring. Measured directly (byline bottom → card bottom) rather
 *  than guessed. */
const CARD_HEIGHT = 359
const CARD_WIDTH = 338

type TutorialStackProps = {
  tutorials: Tutorial[]
  /** Same handoff for every card regardless of which one is on top —
   *  only "Soft Smokey Eye" has a real tutorial behind it right now (see
   *  this file's module comment), so all 4 route to it for the time
   *  being rather than 3 of them silently doing nothing. */
  onSelect?: () => void
}

/** Signed distance from `cardIndex` to the current `v`, wrapped around a
 *  cycle of `total` cards so it's always the *shortest* way around — the
 *  plain `cardIndex - v` this replaced only worked before the deck could
 *  loop: right after wrapping from the last card back to the first (v
 *  jumps from e.g. 3 to 0), the just-departed last card's plain distance
 *  is +3, which is >= 0 and reads as "an upcoming peek" instead of "just
 *  left" — a second, blank, wrongly-tilted card sitting behind the real
 *  peek. Wrapping the distance into (-total/2, total/2] fixes that: that
 *  same card's *circular* distance comes out to -1, correctly matching
 *  the ordinary "just exited" case every other advance already handles.
 *  For any non-wrapping transition (the normal, everyday case) this
 *  returns the exact same value plain subtraction would — it only
 *  changes anything right at a wrap. */
function circularLocal(cardIndex: number, v: number, total: number) {
  const diff = cardIndex - v
  const half = total / 2
  return (((diff + half) % total) + total) % total - half
}

/** One card's position in the stack, as a function of the continuous
 *  `activeIndex` value — driven by TutorialStack whenever the front card
 *  changes (a spring tween on advance, an instant jump on wraparound; see
 *  TutorialStack), not read from scroll. (V1 of this stack *was*
 *  scroll-linked — pin-and-scrub through the deck — but real-device
 *  testing found it fighting the page's own vertical scroll constantly,
 *  a card advance visibly scrolling the header out of view, and drag
 *  leaking into native horizontal page-scroll. Swapped to a self-
 *  contained, drag-native deck: no more competing gesture surfaces, see
 *  TutorialStack's module comment for the full reasoning.)
 *
 *  `local` (circularLocal above): 0 while this card is the front card,
 *  positive while it's still an upcoming peek behind the front card,
 *  negative once it's just been advanced past. Rotation/opacity clamp it
 *  to ±1 — this app only ever shows a front card + one peeking card at a
 *  time, same as the static CardBehind look already approved. zIndex
 *  deliberately does NOT clamp: with 4 tutorials, every card 2+ steps
 *  from active shares the same clamped rotation/position, so an
 *  unclamped distance is the only thing that breaks the tie in favor of
 *  the *actually* next card — first build had this clamped too, which
 *  let a later tutorial in the array win the z-order tie and show as the
 *  peek instead of the real next one. */
function useCardMotion(activeIndex: MotionValue<number>, cardIndex: number, total: number) {
  // A number, not a pre-built "rotate(Xdeg)" string — TutorialStackCard
  // adds this to the drag-driven tilt into one always-live rotation
  // rather than ever swapping which MotionValue is bound to
  // style.transform (see its own comment for why that swap was the
  // actual bug).
  const restRotateDeg = useTransform(activeIndex, (v) => {
    const local = Math.max(-1, Math.min(1, circularLocal(cardIndex, v, total)))
    return local * 7
  })
  const opacity = useTransform(activeIndex, (v) => {
    const local = circularLocal(cardIndex, v, total)
    if (local >= 0) return 1
    return Math.max(0, 1 + local) // local -1..0 -> 0..1, the outgoing card's fade
  })
  const zIndex = useTransform(activeIndex, (v) => Math.round(100 - Math.abs(circularLocal(cardIndex, v, total)) * 50))
  // Narrower band than the card's own opacity/rotation: text only reads as
  // legible once a card is basically the front one, not for its whole
  // time peeking — see TutorialLookCardProps.detailsOpacity above.
  const detailsOpacity = useTransform(activeIndex, (v) => {
    const local = circularLocal(cardIndex, v, total)
    return Math.max(0, 1 - Math.abs(local) / 0.5)
  })
  // The peek's own reveal: a card entering the peek slot (local crossing
  // down from >1 into the visible range) starts as pure CardBehind ghost
  // — real photos/badge withheld — and only crossfades into its actual
  // content over the *last* CONTENT_REVEAL_BAND of its approach to the
  // front. Wider than detailsOpacity's band (0.5) on purpose: photos
  // reveal a little before the title/byline text does, so the sequence
  // reads as ghost → photos → text settling in, not everything popping
  // in at once. `local <= 0` (front or already departed) always fully
  // revealed — the ghost is only ever for a card that hasn't arrived yet.
  const CONTENT_REVEAL_BAND = 0.55
  const contentOpacity = useTransform(activeIndex, (v) => {
    const local = circularLocal(cardIndex, v, total)
    if (local <= 0) return 1
    return Math.max(0, 1 - local / CONTENT_REVEAL_BAND)
  })
  return { restRotateDeg, opacity, zIndex, detailsOpacity, contentOpacity }
}

/** How far off-screen the fly-off animation sends a committed card —
 *  needs to clear the card's own diagonal (a corner can be further from
 *  center than a straight edge) with room to spare so it's fully gone,
 *  not just mostly gone, before the reset in onAdvance. Not part of
 *  MotionTuning: this is a geometry constant (derived from the card's own
 *  size), not a feel choice. */
const FLY_OFF_DISTANCE = Math.hypot(CARD_WIDTH, CARD_HEIGHT)

/** Every value below was a hardcoded guess before — now a single object so
 *  they can come from the (temporary) MotionTuner sliders instead. See
 *  MotionTuner's own comment for the "temporary" half of that story. */
export type MotionTuning = {
  /** Total 2D drag distance (px) past which a release commits instead of
   *  cancelling. */
  commitDistance: number
  /** Total 2D release speed (px/s) past which a release commits even if
   *  the drag distance itself fell short — a fast flick counts even when
   *  it didn't travel far. */
  commitVelocity: number
  /** Fly-off spring's target duration (seconds) — its *real* settle time
   *  runs longer than this once bounce is added, which is exactly why
   *  onAdvance now awaits the animation instead of guessing a delay. */
  flyOffDuration: number
  /** Fly-off spring's bounce (0 = no overshoot, matches apple-design's
   *  "add bounce only when the gesture carried momentum" — this
   *  interaction always qualifies, so a small amount is the default
   *  rather than 0 here). */
  flyOffBounce: number
  /** Cancelled-drag settle-back-to-center spring's duration (seconds). */
  cancelDuration: number
  /** How far the card tilts (degrees) at a full CARD_WIDTH of horizontal
   *  drag. */
  rotationRange: number
  /** Scale while actively gripped (1 = no shrink) — the "picked up" cue
   *  that was missing entirely before: apple-design calls for feedback
   *  on pointer-*down*, continuously, not just at release, and there was
   *  none. Duration for the press/release of this scale is fixed at
   *  150ms (button-press-feedback range, not exposed as a slider — it's
   *  not the part anyone described as feeling wrong). */
  gripScale: number
}

export const DEFAULT_MOTION_TUNING: MotionTuning = {
  commitDistance: CARD_WIDTH * 0.35,
  commitVelocity: 1200, // settled on by feel
  flyOffDuration: 0.7, // settled on by feel
  flyOffBounce: 0.15, // settled on by feel
  cancelDuration: 0.4,
  rotationRange: 20,
  gripScale: 0.96, // settled on by feel (unchanged from the first guess)
}

function TutorialStackCard({
  tutorial,
  index,
  total,
  activeIndex,
  dragProgress,
  activeCardIndex,
  isLocked,
  tuning,
  onSelect,
  onCommitStart,
  onAdvance,
  saved,
  onToggleSave,
}: {
  tutorial: Tutorial
  index: number
  total: number
  /** The *settled* index — only changes on an actual advance (spring
   *  tween or wrap-snap), never during a live drag. */
  activeIndex: MotionValue<number>
  /** 0..1, live during an active drag on the front card — how far toward
   *  a commit the current gesture has gone (distance / tuning.commitDistance,
   *  clamped). Added to `activeIndex` for every *other* card's own pose
   *  (see `effectiveIndex` below) so the peek visibly starts sliding into
   *  place while you're still holding the front card, instead of standing
   *  completely still until release and then suddenly setting off from
   *  zero — the front card was already moving with your finger the whole
   *  time, so the rest of the stack standing frozen until release was
   *  exactly the kind of two-systems-out-of-sync seam that reads as a
   *  flick, same family of issue as the onDrag fix above. */
  dragProgress: MotionValue<number>
  activeCardIndex: number
  /** True from the instant a commit starts until onAdvance's state catch-up
   *  finishes (see TutorialStack) — closes the window where the still-
   *  "active" (state hasn't flipped yet) departing card could start a
   *  *second* drag mid-fly-off, which would schedule a second onAdvance
   *  and could land the deck somewhere other than where the first one
   *  intended. */
  isLocked: boolean
  tuning: MotionTuning
  onSelect?: () => void
  onCommitStart: () => void
  onAdvance: () => void
  /** Bookmark state for *this* tutorial specifically — owned by
   *  TutorialStack (see its module comment), just threaded through here. */
  saved: boolean
  onToggleSave: () => void
}) {
  // Two different questions, again (see isFrontCard/isInteractive below,
  // same shape): which index value THIS card's own pose should react to.
  // The front card must NOT fold dragProgress into its own rest-pose
  // computation — dragProgress is *driven by this exact card's own drag*,
  // so feeding it back into this card's own restRotateDeg would be a
  // feedback loop (it'd start rotating itself "away" on top of the
  // drag-driven tilt it already has, double-counting). Every other card
  // *should* react to it — that's the whole point. isFrontCard is a plain
  // prop-derived boolean, not a tracked motion-value input, so it's picked
  // via a plain ternary rather than branched inside a useTransform
  // combiner (see the ghost-reveal math below for why that distinction
  // matters).
  const isFrontCard = index === activeCardIndex
  const liveIndexForOthers = useTransform([activeIndex, dragProgress], ([a, d]) => a + d)
  const effectiveIndex = isFrontCard ? activeIndex : liveIndexForOthers
  const { restRotateDeg, opacity, zIndex, detailsOpacity, contentOpacity } = useCardMotion(effectiveIndex, index, total)
  // The live dragProgress preview (above) means the peek's own zIndex can
  // climb close to the front card's as the drag approaches a commit — at
  // dragProgress===1 they'd be numerically equal, a tie CSS breaks by DOM
  // order (the peek, rendered later in the tutorials.map, would win and
  // pop in front of the card you're physically holding). A card
  // being actively gripped has no business ever losing that tie, so it
  // gets an unambiguous fixed ceiling instead of relying on the same
  // formula as everyone else.
  const zIndexFinal = isFrontCard ? 1000 : zIndex
  // Peek reveal: locked in on the flat CardBehind placeholder (yellow)
  // that fades to the real card as it nears the front — the two
  // alternatives explored (a dark "mask" scrim over the real content, and
  // no treatment at all) are gone from the code now that this one's
  // settled, not just hidden behind a flag. Both still multiply by the
  // outer `opacity` so a departing card's fade-out applies (contentOpacity
  // is always 1 there, so ghostOpacity comes out to 0 — no ghost on exit,
  // only on approach; see contentOpacity's own comment in useCardMotion).
  const ghostOpacity = useTransform([opacity, contentOpacity], ([slot, content]) => slot * (1 - content))
  const contentFinalOpacity = useTransform([opacity, contentOpacity], ([slot, content]) => slot * content)
  // isFrontCard itself is computed above (needed earlier, for
  // effectiveIndex). Second question here: which card is allowed to
  // actually start a *new* gesture right now (blocked while locked,
  // closing the double-drag window in onAdvance) — unaffected by the
  // lock is whether it's still flying/shown via its own drag position (a
  // departing card's fly-off must keep running smoothly through the
  // whole lock window, not snap back to rest the instant it starts).
  const isInteractive = isFrontCard && !isLocked

  // dragX/dragY only ever move while THIS card is the one being dragged
  // (drag is only enabled when isInteractive) — for every other card
  // they just sit at 0. That's what makes composing safe below: adding a
  // value that's always 0 when inactive is a no-op, not a real
  // composition to reason about.
  const dragX = useMotionValue(0)
  const dragY = useMotionValue(0)
  // "Picked up" feedback — see MotionTuning.gripScale. Also part of the
  // one-continuous-transform composition, same reasoning as totalRotate
  // below: never a second, separately-bound style value.
  const gripScale = useMotionValue(1)
  // Tilt still comes from the horizontal component only, even though the
  // drag itself is free in any direction — a vertical-only drag with no
  // tilt at all still reads as "grabbed and moving," and tying rotation
  // to *both* axes tends to spin the card in a way that doesn't track
  // anywhere near as legibly as a pure x-tilt does.
  const dragRotate = useTransform(dragX, [-CARD_WIDTH, CARD_WIDTH], [-tuning.rotationRange, tuning.rotationRange])
  // One transform, always bound — never swapped for a different
  // MotionValue object depending on isActive. That swap (drag transform
  // vs. rest transform, picked per-render) was the actual wraparound bug:
  // whichever MotionValue *wasn't* currently bound to style.transform
  // could go stale, so a card that had been dragged once earlier in the
  // session could end up rendering at its old flown-off position forever
  // once it became the "rest" case again. Summing restRotateDeg (0 while
  // this card is the front one — that's the definition of local=0) with
  // dragRotate (0 whenever this card isn't the one being dragged) always
  // resolves to the same values the old conditional pose would have
  // picked, just from one continuous, always-live template instead of
  // two competing ones.
  const totalRotate = useTransform([restRotateDeg, dragRotate], ([rest, drag]) => rest + drag)
  const transform = useMotionTemplate`translateX(${dragX}px) translateY(${dragY}px) rotate(${totalRotate}deg) scale(${gripScale})`

  function handleDragStart() {
    // Fast, fixed — button-press-feedback range (100-160ms), not a
    // "feel" choice worth a slider; the tunable part of grip is *how far*
    // it shrinks (tuning.gripScale), not how quickly.
    animateValue(gripScale, tuning.gripScale, { duration: 0.15 })
  }

  // Keeps dragX/dragY (and therefore totalRotate/gripScale, since they're
  // all one composed template) live with the actual pointer the entire
  // time it's down — not just at release. Framer's drag gesture only
  // auto-syncs motion values bound through its own reserved style.x/
  // style.y keys; a custom composed `transform` string like this one
  // isn't that, so without this handler dragX/dragY would sit frozen at
  // whatever handleDragEnd last set them to (their fly-off target, then
  // 0) for the *entire* live drag, and only start reacting to the actual
  // gesture at release. That handoff — Framer's own untracked internal
  // positioning during the drag, replaced by mine only once release
  // finally touches dragX/dragY — was the actual "flicks... like doing
  // the rotation twice" bug: two different systems governing the same
  // card's position/rotation at two different times, meeting at a visible
  // seam right at release.
  function handleDrag(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    dragX.set(info.offset.x)
    dragY.set(info.offset.y)
    // See dragProgress's own doc comment above — this is what makes the
    // peek visibly start sliding into place while the front card is still
    // being held, not just at release.
    const distance = Math.hypot(info.offset.x, info.offset.y)
    dragProgress.set(Math.min(1, distance / tuning.commitDistance))
  }

  function handleDragEnd(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    const distance = Math.hypot(info.offset.x, info.offset.y)
    const speed = Math.hypot(info.velocity.x, info.velocity.y)
    const committed = distance > tuning.commitDistance || speed > tuning.commitVelocity
    animateValue(gripScale, 1, { duration: 0.15 })
    if (committed) {
      onCommitStart()
      // Fly-off continues in whatever direction the drag was actually
      // going (any angle, not just left/right) — momentum-driven, so a
      // little bounce, and the release velocity is handed straight to
      // the spring (apple-design's "velocity handoff") so there's no seam
      // between the finger letting go and the card continuing on its own.
      const angle = Math.atan2(info.offset.y, info.offset.x)
      const flightX = animateValue(dragX, Math.cos(angle) * FLY_OFF_DISTANCE, {
        type: 'spring',
        velocity: info.velocity.x,
        bounce: tuning.flyOffBounce,
        duration: tuning.flyOffDuration,
      })
      const flightY = animateValue(dragY, Math.sin(angle) * FLY_OFF_DISTANCE, {
        type: 'spring',
        velocity: info.velocity.y,
        bounce: tuning.flyOffBounce,
        duration: tuning.flyOffDuration,
      })
      // Hand the stack forward once the fly-off has *actually* finished,
      // not a fixed guess at how long that takes — that guess (a flat
      // 300ms) was wrong the moment the spring's real settle time (bounce
      // pushes it past the nominal duration) diverged from it: the next
      // card was becoming interactive while this one was still visibly
      // mid-flight, two clocks disagreeing. Awaiting the real animations
      // keeps it exactly in sync regardless of what the sliders are set
      // to.
      Promise.all([flightX, flightY]).then(() => {
        onAdvance()
        // animate(..., {duration:0}), NOT dragX.set(0) — matters here
        // too: without interrupting first, a bare .set() can still lose
        // to a not-fully-settled tail end of the spring above.
        animateValue(dragX, 0, { duration: 0 })
        animateValue(dragY, 0, { duration: 0 })
      })
    } else {
      // Cancelled: a settle back to center, not a released-momentum
      // motion, so no bounce (apple-design: bounce only when the gesture
      // itself carried momentum toward a genuinely new target). The peek's
      // live preview settles back in the same motion, same duration — it
      // was following this card's drag the whole time, so it un-follows
      // the same way rather than snapping back separately.
      animateValue(dragX, 0, { type: 'spring', velocity: info.velocity.x, bounce: 0, duration: tuning.cancelDuration })
      animateValue(dragY, 0, { type: 'spring', velocity: info.velocity.y, bounce: 0, duration: tuning.cancelDuration })
      animateValue(dragProgress, 0, { type: 'spring', bounce: 0, duration: tuning.cancelDuration })
    }
  }

  return (
    <motion.div
      className="absolute inset-0"
      // No flat opacity here anymore — transform/zIndex are shared by
      // both layers below (same position, same stacking), but ghost vs.
      // content need their own independent opacities, not one value the
      // whole slot shares.
      style={{ transform, zIndex: zIndexFinal }}
      // Free in both axes, per "it should feel more free, even
      // vertically" — `drag={true}` (not `"x"`) also sets touch-action:
      // none on this element, which is what actually stops it from
      // fighting the page's own vertical scroll on a real touchscreen: a
      // single-axis `"x"` drag leaves touch-action: pan-y in place, and
      // that's exactly what was reading a real swipe as a page scroll
      // roughly half the time.
      drag={isInteractive}
      dragMomentum={false}
      onDragStart={isInteractive ? handleDragStart : undefined}
      onDrag={isInteractive ? handleDrag : undefined}
      onDragEnd={isInteractive ? handleDragEnd : undefined}
    >
      <CardBehind opacity={ghostOpacity} />
      <motion.div className="absolute inset-0" style={{ opacity: contentFinalOpacity }}>
        <TutorialLookCard
          tutorial={tutorial}
          onSelect={onSelect}
          disabled={!isInteractive}
          detailsOpacity={detailsOpacity}
          saved={saved}
          onToggleSave={onToggleSave}
        />
      </motion.div>
    </motion.div>
  )
}

/**
 * The card stack: front card + one peeking card behind, both driven by a
 * single `activeIndex` value that advances only through direct
 * interaction — a drag/swipe past the commit threshold (see
 * TutorialStackCard), or a tap on the front card (which still just opens
 * the tutorial, unchanged). No scroll involvement at all: an earlier
 * version pinned the card and scrubbed through the deck via real page
 * scroll, but that meant the drag gesture and the page's own vertical
 * scroll were two systems fighting over the same touch input — on a real
 * phone, that read as the swipe "sometimes" scrolling the page instead,
 * and a successful swipe visibly scrolling the header out of view since
 * it was implemented as an actual scrollTop change. Going drag-only
 * removes the second gesture surface instead of trying to reconcile two
 * that kept conflicting.
 *
 * Loops: advancing past the last tutorial wraps back to the first
 * (`% tutorials.length`) — see handleAdvance's wrapped-vs-forward split
 * for why the wrap specifically snaps instead of tweening.
 *
 * `prefers-reduced-motion`: skips the whole drag-stack in favor of a
 * plain vertical list — same 4 tutorials, same tap-through, no gesture
 * required. Not a lesser feature, a different one that reaches the same
 * content.
 */

/** TEMPORARY — live sliders over MotionTuning, for feel-testing the drag/
 * fly-off/grip physics directly on a phone instead of guessing values and
 * redeploying (same pattern as the earlier, now-removed SegmentTuner).
 * Once numbers are settled on: report them back, and this + the `tuning`
 * prop threading in TutorialStack/TutorialStackCard should come out in
 * favor of plain DEFAULT_MOTION_TUNING constants again. */
function MotionTuner({ tuning, onChange }: { tuning: MotionTuning; onChange: (next: MotionTuning) => void }) {
  const rows: Array<{ key: keyof MotionTuning; label: string; min: number; max: number; step: number }> = [
    { key: 'commitDistance', label: 'commit dist', min: 40, max: 250, step: 5 },
    { key: 'commitVelocity', label: 'commit vel', min: 100, max: 1200, step: 25 },
    { key: 'flyOffDuration', label: 'fly-off dur', min: 0.2, max: 1.5, step: 0.05 },
    { key: 'flyOffBounce', label: 'fly-off bounce', min: 0, max: 0.6, step: 0.05 },
    { key: 'cancelDuration', label: 'cancel dur', min: 0.15, max: 1, step: 0.05 },
    { key: 'rotationRange', label: 'tilt range', min: 5, max: 40, step: 1 },
    { key: 'gripScale', label: 'grip scale', min: 0.85, max: 1, step: 0.01 },
  ]
  return (
    // fixed, not absolute — this used to be positioned relative to the
    // stack's own 346px-tall box (`-top-8`, meant to sit just above it),
    // which worked when it only had a few rows but started spilling down
    // into the card itself once it grew to 8. Pinning to the viewport
    // instead means its own height can never overlap the stack no matter
    // how many rows get added.
    <div className="fixed left-2 top-2 z-[999] w-[260px] rounded bg-black/80 px-2 py-1.5 font-mono text-[10px] leading-tight text-white">
      {rows.map(({ key, label, min, max, step }) => (
        <div key={key} className="flex items-center gap-1.5 py-0.5">
          <span className="w-[80px] shrink-0">{label}</span>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={tuning[key]}
            onChange={(e) => onChange({ ...tuning, [key]: Number(e.target.value) })}
            className="h-3 flex-1 accent-white"
          />
          <span className="w-[34px] shrink-0 text-right tabular-nums">{tuning[key]}</span>
        </div>
      ))}
    </div>
  )
}

export function TutorialStack({ tutorials, onSelect }: TutorialStackProps) {
  const reduceMotion = useReducedMotion()
  const [activeCardIndex, setActiveCardIndex] = useState(0)
  const activeIndex = useMotionValue(0)
  // See TutorialStackCard's dragProgress prop doc — this is that value,
  // owned here since it's shared across every sibling card, not local to
  // whichever one is currently being dragged.
  const dragProgress = useMotionValue(0)
  // True from the moment a drag commits until its onAdvance has actually
  // run — blocks every card's drag/tap during that window (now sized to
  // the real fly-off, not a guess — see handleDragEnd). Without this, the
  // front card is still nominally "active" (state hasn't caught up yet)
  // for the whole fly-off, so a second touch in that window could start a
  // second commit before the first one's onAdvance has landed.
  const [isAdvancing, setIsAdvancing] = useState(false)
  // TEMPORARY — see MotionTuner. Panel is hidden (not rendered) for now,
  // per request, so the stack is uninterrupted while iterating on the
  // rest of the home screen — the mechanism itself is untouched, current
  // values just aren't editable live at the moment. Uncomment the
  // <MotionTuner> line below to bring the panel back.
  const [tuning, setTuning] = useState(DEFAULT_MOTION_TUNING)
  // Bookmark state, per tutorial id. Owned here rather than inside
  // TutorialLookCard itself: that component is instantiated twice per
  // tutorial across the app's lifetime (once for the drag stack, once for
  // the prefers-reduced-motion static list — see the `reduceMotion` branch
  // below), and *within* the drag stack every card's own TutorialLookCard
  // instance stays mounted continuously as it cycles through peek/front/
  // peek again (only its pose changes) — so local state would technically
  // survive that, but would NOT survive a live prefers-reduced-motion
  // toggle switching which branch renders, and two independent copies of
  // "the same" saved state (one per branch) was never the intent. A Set
  // instead of Record<string, boolean>: only ever asking "is this id in
  // it", never iterating/serializing it elsewhere yet.
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set())

  function handleToggleSave(id: string) {
    setSavedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function handleCommitStart() {
    setIsAdvancing(true)
  }

  function handleAdvance() {
    const next = (activeCardIndex + 1) % tutorials.length
    const wrapped = next < activeCardIndex
    // Where the live preview had already gotten to (activeIndex is still
    // sitting at the old settled integer at this point — dragProgress is
    // the only thing that's been moving) — the whole point of folding
    // this in before animating is that the spring below starts from
    // wherever the drag had already visually brought things, not from a
    // standing start at the old integer (apple-design: "always animate
    // from the presentation value, never the target/logical value").
    const liveValue = activeCardIndex + dragProgress.get()
    setActiveCardIndex(next)
    setIsAdvancing(false)
    // Folded into activeIndex now, so it needs to stop contributing on
    // top of it — reset instant, not animated: the whole point was for
    // this number to already equal what dragProgress had been adding, so
    // there's nothing left to visibly settle.
    dragProgress.set(0)
    if (wrapped) {
      // A tween from e.g. 3 back to 0 would sweep *backward* through
      // every card in between (each one's `local` briefly passing back
      // through 0, flashing as "active") before landing — reads as
      // reverse-cycling through the whole deck, not advancing past the
      // end. The just-flown-off last card is already off-screen by the
      // time this fires, so an instant jump here is invisible; the
      // fly-off itself is the only motion this transition needs.
      activeIndex.set(next)
    } else {
      // Jump the settled value up to match the live preview first (no
      // visible change — dragProgress just went to 0 in the same tick, so
      // the combined total the other cards see is unchanged) — *then*
      // spring the remaining, usually much shorter, distance to `next`.
      // Same duration as the dragged card's own fly-off
      // (tuning.flyOffDuration, not a separate number) so the peeking
      // card's advance and the departing card's exit read as one
      // coordinated motion instead of two springs quietly disagreeing.
      activeIndex.set(liveValue)
      animateValue(activeIndex, next, { type: 'spring', bounce: 0, duration: tuning.flyOffDuration })
    }
  }

  if (reduceMotion) {
    return (
      <div className="mx-auto flex w-[338px] flex-col gap-4">
        {tutorials.map((tutorial) => (
          <TutorialLookCard
            key={tutorial.id}
            tutorial={tutorial}
            onSelect={onSelect}
            saved={savedIds.has(tutorial.id)}
            onToggleSave={() => handleToggleSave(tutorial.id)}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="relative mx-auto" style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}>
      {/* TEMPORARY — see MotionTuner's own comment above. Hidden for now:
          <MotionTuner tuning={tuning} onChange={setTuning} /> */}
      {tutorials.map((tutorial, index) => (
        <TutorialStackCard
          key={tutorial.id}
          tutorial={tutorial}
          index={index}
          total={tutorials.length}
          isLocked={isAdvancing}
          tuning={tuning}
          onCommitStart={handleCommitStart}
          activeIndex={activeIndex}
          dragProgress={dragProgress}
          activeCardIndex={activeCardIndex}
          onSelect={onSelect}
          onAdvance={handleAdvance}
          saved={savedIds.has(tutorial.id)}
          onToggleSave={() => handleToggleSave(tutorial.id)}
        />
      ))}
    </div>
  )
}
