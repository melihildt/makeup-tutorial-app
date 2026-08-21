import { useEffect, useRef, useState } from 'react'
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
import cardGhostTextureNight from '../assets/looks/card-ghost-texture-night.png'
import cardGhostTextureGlam from '../assets/looks/card-ghost-texture-glam.png'
import type { LookType } from './HomeScreen'

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

/** Restart icon for the Start Over card (below) — node 666:2684
 *  ("fi-rr-rotate-right", Tech-Experimentation), real path data pulled via
 *  download_assets, not hand-approximated (same standard as BookmarkIcon
 *  above). Source export had its fill hardcoded to the literal hex
 *  #2C2926 — swapped for `var(--color-tutorial-card-text)` since that's
 *  the exact same color as a token already, matching how every other icon
 *  in this file is themed. */
function RotateRightIcon() {
  return (
    <svg width={48} height={48} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path
        d="M43.9241 25.75C43.5385 30.3097 41.6055 34.6004 38.4459 37.9104C35.2864 41.2204 31.0901 43.3507 26.5533 43.9479C22.0165 44.545 17.4119 43.5731 13.5034 41.1934C9.59492 38.8137 6.61751 35.1693 5.06513 30.8647C3.51276 26.5602 3.47873 21.8542 4.9687 17.5277C6.45867 13.2011 9.38307 9.51398 13.2567 7.07802C17.1304 4.64206 21.7205 3.60368 26.2654 4.13516C30.8104 4.66664 35.037 6.73603 38.2441 10H32.0001C31.4697 10 30.961 10.2107 30.5859 10.5858C30.2109 10.9609 30.0001 11.4696 30.0001 12C30.0001 12.5304 30.2109 13.0391 30.5859 13.4142C30.961 13.7893 31.4697 14 32.0001 14H40.2861C41.271 13.9995 42.2154 13.608 42.9118 12.9116C43.6081 12.2152 43.9996 11.2709 44.0001 10.286V2C44.0001 1.46957 43.7894 0.960859 43.4144 0.585787C43.0393 0.210714 42.5306 0 42.0001 0V0C41.4697 0 40.961 0.210714 40.5859 0.585787C40.2109 0.960859 40.0001 1.46957 40.0001 2V6.156C35.9775 2.56146 30.8599 0.428968 25.4751 0.103423C20.0903 -0.222122 14.753 1.27831 10.3266 4.36206C5.90026 7.44581 2.64352 11.9326 1.08317 17.0966C-0.477194 22.2607 -0.249938 27.8002 1.72818 32.8191C3.7063 37.838 7.31961 42.0429 11.9837 44.7537C16.6478 47.4645 22.09 48.5227 27.4301 47.7572C32.7702 46.9916 37.6959 44.4471 41.4106 40.5351C45.1252 36.6232 47.4117 31.5725 47.9001 26.2C47.926 25.9215 47.8935 25.6406 47.8048 25.3754C47.7161 25.1101 47.5731 24.8662 47.385 24.6592C47.1968 24.4523 46.9676 24.2868 46.712 24.1733C46.4563 24.0598 46.1799 24.0008 45.9001 24C45.4122 23.9941 44.9396 24.1701 44.5743 24.4936C44.2091 24.8171 43.9773 25.265 43.9241 25.75V25.75Z"
        fill="var(--color-tutorial-card-text)"
        fillOpacity={0.8}
      />
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

/** Which ghost-card texture goes with which filter chip — see HomeScreen's
 *  own LOOK_TYPES for the chip colors this is matching (day gold #e3b345,
 *  night blue #688db6, glam green #beef9e). Day keeps the original photo
 *  texture (card-ghost-texture.jpg, already gold-toned on its own); night/
 *  glam are new PNG exports the user supplied specifically for this,
 *  matched to their filter by actual pixel color rather than their
 *  original filenames — the files as first delivered were misnamed
 *  relative to which chip they visually matched (confirmed by sampling
 *  their average color against the chip tints above, and by the user's own
 *  reference mock once renamed to match). CardBehind and StartOverCard
 *  both read from this one map rather than each hardcoding their own
 *  three-way branch. */
const GHOST_TEXTURES: Record<LookType, string> = {
  day: cardGhostTexture,
  night: cardGhostTextureNight,
  glam: cardGhostTextureGlam,
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
 *  directly as the image (day: card-ghost-texture.jpg, downsized/
 *  recompressed PNG→JPEG from the original ~618KB export down to ~58KB, no
 *  visible difference), not layered under a separate
 *  --color-card-behind-tint overlay: the day photo is already gold-toned
 *  on its own, so the flat-swatch tint it stood in for is retired rather
 *  than kept as a redundant second layer on top of a photo that already
 *  reads as gold. `lookType` (new) picks which of GHOST_TEXTURES actually
 *  shows — see the map's own comment; `key={lookType}` + check-ring-in
 *  (index.css, the same "new content settling in after a state swap"
 *  keyframe LookSelectorChip's own icon already uses) gives the swap a
 *  quick fade+scale-in instead of an instant pop, since a bare `src`
 *  change on an already-mounted `<img>` has nothing to transition from —
 *  same "animation, not transition" reasoning as every other
 *  structurally-different-content swap in this app (see check-pop's own
 *  comment, index.css). `opacity` drives the reveal — see useCardMotion's
 *  contentOpacity. `backfaceVisibility: 'hidden'` is a permanent no-op for
 *  every card except the first tutorial slot mid-restart-flip (see
 *  TutorialStackCard's flipRotateY) — this layer never rotates on its own
 *  axis, so it only ever turns away from the viewer when its *parent*
 *  does, which happens nowhere else. */
export function CardBehind({
  opacity,
  lookType,
  className,
}: {
  opacity?: MotionValue<number>
  lookType: LookType
  className?: string
}) {
  return (
    <motion.div
      aria-hidden="true"
      className={`absolute inset-0 overflow-hidden ${className ?? ''}`}
      style={{
        borderRadius: 'var(--radius-tutorial-card)',
        boxShadow: 'var(--shadow-tutorial-card)',
        opacity,
        backfaceVisibility: 'hidden',
      }}
    >
      <img
        key={lookType}
        alt=""
        src={GHOST_TEXTURES[lookType]}
        className="size-full object-cover"
        style={{ animation: 'check-ring-in var(--duration-base) var(--ease-out-quart)' }}
      />
    </motion.div>
  )
}

/** The stack's terminal slot, node 665:2571 ("Home - Start Over") —
 *  replaces the old wrap-to-first-tutorial loop (see TutorialStack's
 *  module comment): swipe away the last tutorial and you land here
 *  instead of silently cycling back to the first one, so reaching the end
 *  of the deck is a deliberate boundary, not an invisible loop a user
 *  could lose track of. Deliberately reuses the same GHOST_TEXTURES map
 *  CardBehind reads from (not a second copy of the per-filter assets) —
 *  the design has this card *be* the ghost, permanently, with a restart
 *  icon + label on top rather than ever crossfading into some other "real"
 *  content the way a tutorial card does; recoloring with the selected
 *  filter is the one exception to "permanently," per the user's own call
 *  that this card shouldn't be exempt from that just because it isn't
 *  literally "a look." Root is the
 *  same role="button" whole-card-tappable pattern as TutorialLookCard
 *  (see its own comment for why a real <button> doesn't work here) —
 *  tapping (or Enter/Space) is what flips this card in place to reveal the
 *  first tutorial on its back face; see TutorialStackCard's
 *  handleStartOverTap and the back-face JSX in its render. */
function StartOverCard({
  onSelect,
  disabled,
  detailsOpacity,
  lookType,
}: {
  onSelect?: () => void
  disabled?: boolean
  detailsOpacity?: MotionValue<number>
  lookType: LookType
}) {
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
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect?.()
              }
            }
      }
      className={`relative flex h-full w-[338px] items-center justify-center overflow-hidden text-left active:scale-[0.97] ${disabled ? '' : 'cursor-pointer'}`}
      style={{
        borderRadius: 'var(--radius-tutorial-card)',
        boxShadow: 'var(--shadow-tutorial-card)',
        transition: 'transform var(--duration-instant) var(--ease-out-quart)',
      }}
    >
      {/* key={lookType} + check-ring-in — see CardBehind's own comment for
          why a bare src swap needs an animation, not a transition, and
          GHOST_TEXTURES for which asset goes with which filter. This front
          face recolors with the selected filter same as CardBehind (per
          the user's own call — StartOverCard isn't exempt just because
          it's not literally "a look"). */}
      <img
        key={lookType}
        alt=""
        src={GHOST_TEXTURES[lookType]}
        className="absolute inset-0 size-full object-cover"
        style={{ animation: 'check-ring-in var(--duration-base) var(--ease-out-quart)' }}
      />
      {/* Icon + label fade in on the same detailsOpacity band the front
          card's own title/byline use elsewhere — a card entering the peek
          slot behind the actual front card is already just this same
          ghost texture (see the comment above), so there's nothing to
          crossfade there; the icon/label are the only part of this card's
          "content" that needs its own reveal timing. */}
      <motion.div
        className="relative flex flex-col items-center gap-3"
        style={detailsOpacity ? { opacity: detailsOpacity } : undefined}
      >
        <RotateRightIcon />
        <p
          style={{
            color: 'var(--color-tutorial-card-text)',
            fontWeight: 'var(--font-weight-medium)',
            fontSize: '16px',
          }}
        >
          Start Over
        </p>
      </motion.div>
    </div>
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
  /** The selected Day/Night/Glam filter — see HomeScreen's own LookType.
   *  Doesn't filter which tutorials show (see this file's module comment,
   *  "until we add more cards"); only drives the ghost card's own color
   *  for now, threaded straight through to every TutorialStackCard as
   *  `lookType`. */
  lookType: LookType
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
  // front. `local <= 0` (front or already departed) always fully
  // revealed — the ghost is only ever for a card that hasn't arrived yet.
  // 0.35, not the original 0.55 — narrower band means the crossfade zone
  // (where any real content shows through at all) starts later, closer to
  // the front, so more of the peek's approach reads as pure yellow ghost
  // before it starts blending in the real photo — per the user's request
  // to see more of the yellow before the upcoming slide takes over. This
  // also means photos no longer reliably lead detailsOpacity's fixed 0.5
  // band (the "photos reveal a little before text" note that used to live
  // here) — content is now the bottleneck for both, so they blend in
  // closer together than before. Not a problem, just worth knowing if the
  // stagger ever looks off.
  const CONTENT_REVEAL_BAND = 0.35
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

/** How much of the raw drag distance actually reaches the Start Over
 *  card's own position while it's being dragged — that card can never
 *  commit (see TutorialStackCard's handleDrag/handleDragEnd), so a 1:1
 *  drag would either do nothing (looking broken/unresponsive) or move
 *  exactly like a real swipe right up until it doesn't commit (a
 *  confusing bait-and-switch). Damping it to a fraction of the real
 *  travel — "light rubber-band" per the user's own call — reads as the
 *  card visibly resisting instead of either extreme. */
const START_OVER_RESIST_FACTOR = 0.35

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

/** What this card slot actually renders/does. The Start Over slot (see
 *  StartOverCard above) shares every bit of pose/drag/fly-off machinery
 *  below with a real tutorial slot — it's positioned by the exact same
 *  `useCardMotion`, the exact same composed transform — so it's a variant
 *  of the *same* component rather than a separate one, with only content
 *  and a few interaction rules (see handleDrag/handleDragEnd/
 *  handleStartOverTap below) actually differing.
 *
 *  `firstTutorial`/`firstTutorialSaved` (start-over only): the Start Over
 *  card's own *back face* — see handleStartOverTap and the JSX below —
 *  is a static rendering of the first tutorial, so this slot needs that
 *  tutorial's data even though it isn't the one showing normally. */
type TutorialStackCardVariant =
  | { kind: 'tutorial'; tutorial: Tutorial; saved: boolean; onToggleSave: () => void }
  | { kind: 'start-over'; firstTutorial: Tutorial; firstTutorialSaved: boolean }

function TutorialStackCard({
  variant,
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
  hintTrigger,
  onInteraction,
  lookType,
}: {
  variant: TutorialStackCardVariant
  index: number
  total: number
  /** Which filter chip is selected — see HomeScreen's own LookType and
   *  LOOK_TYPES. Only actually consumed by CardBehind and (for the
   *  start-over slot) StartOverCard's own ghost texture; threaded through
   *  every card uniformly rather than singled out, same reasoning as every
   *  other shared prop here. */
  lookType: LookType
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
   *  flick, same family of issue as the onDrag fix above. Never updated
   *  by a Start Over drag (see handleDrag) — that gesture can never
   *  commit, so there's no real "progress toward advancing" for anything
   *  else in the stack to preview. */
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
  /** Ignored for the Start Over slot — tapping it calls handleStartOverTap
   *  instead (see below), never this. */
  onSelect?: () => void
  onCommitStart: () => void
  onAdvance: () => void
  /** Increments every ~4s that TutorialStack's front card sits untouched
   *  (see its own comment) — a standing "psst, you can swipe this" nudge,
   *  not a one-time tooltip: it keeps repeating for as long as the current
   *  front card stays idle, and re-arms fresh for whichever card becomes
   *  front next. Every card gets the same value, same as activeIndex/
   *  dragProgress; each decides for itself whether a given bump is meant
   *  for it via its own `isFrontCard` (plus `variant.kind === 'tutorial'`
   *  — see the hint effect's own comment for why Start Over opts out)
   *  rather than TutorialStack singling one out. */
  hintTrigger: number
  /** Fires on this card's own handleDragStart — TutorialStack's signal that
   *  the current front card has been touched, used to hold off the next
   *  repeat of the hint (see its own comment) until this card stops being
   *  front. Not scoped to the front card specifically in the type (every
   *  card technically has it available) because only the interactive one
   *  can ever actually call it — `isInteractive` already gates whether
   *  `handleDragStart` runs at all. */
  onInteraction: () => void
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
  // Flight fade/scale/z-dive — see handleDragEnd's committed branch. All
  // three sit at their rest values (1, 1, 0) except during an actual
  // fly-off, and get reset the instant that fly-off's onAdvance fires (same
  // "animate a fresh 0-duration tween, don't .set()" pattern as dragX/dragY
  // below — a bare .set() can still lose to a not-fully-settled tail end of
  // the fade/scale/zdrop animations themselves).
  const flightOpacity = useMotionValue(1)
  const flightScale = useMotionValue(1)
  const flightZDrop = useMotionValue(0)
  // Front card's z-index ceiling isn't always a flat 1000 any more — once a
  // fly-off starts diving (flightZDrop -> 1), it ramps down toward the
  // ordinary peek's own zIndex range so the departing card visibly tucks
  // *behind* the peek partway through its exit instead of staying on top
  // the whole time it's fading — the "moving behind, like a continuous
  // stack" feel this was asked for, not just "translate away and vanish."
  const frontZIndex = useTransform(flightZDrop, (d) => 1000 - d * 950)
  const zIndexFinal = isFrontCard ? frontZIndex : zIndex
  // Restart flip — see handleStartOverTap below for what drives this, and
  // the comment on the `transform` template further down for the 3D
  // mechanics. Only ever nonzero for the Start Over card itself, only for
  // the ~0.7s right after it's tapped — a complete no-op (0deg, identity)
  // for every tutorial card, always. Unlike an earlier version of this
  // mechanism, the flip never needs to force opacity/rotation/z-index
  // overrides on top of the ordinary pose math: the Start Over card stays
  // `isFrontCard` (see below) for its *entire* flip — the logical advance
  // to the first tutorial only happens once the flip has actually finished
  // (see handleStartOverTap) — so every other value this card already
  // computes (rest rotation 0, opacity 1, zIndex 1000) is already correct
  // for a flipping front card with zero special-casing.
  const flipRotateY = useMotionValue(0)
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
  // gripScale (picked-up feedback) and flightScale (fly-off shrink) are
  // both legitimate, independent reasons this card's own scale might not
  // be 1 — composed the same "always one continuous value" way as
  // totalRotate above, not two competing scale bindings.
  const totalScale = useTransform([gripScale, flightScale], ([grip, flight]) => grip * flight)
  // rotateY sits safely alongside the existing Z-axis `rotate` here: the
  // only card whose flipRotateY is ever nonzero is the Start Over card,
  // right after it's tapped, at which point it's still isFrontCard (see
  // handleStartOverTap) and dragRotate is 0 (nothing being dragged, drag
  // is disabled the instant the tap locks the stack) — so totalRotate is
  // guaranteed 0 for the entire flip, no competing rotation to fight.
  const transform = useMotionTemplate`translateX(${dragX}px) translateY(${dragY}px) rotate(${totalRotate}deg) rotateY(${flipRotateY}deg) scale(${totalScale})`

  function handleDragStart() {
    // Fast, fixed — button-press-feedback range (100-160ms), not a
    // "feel" choice worth a slider; the tunable part of grip is *how far*
    // it shrinks (tuning.gripScale), not how quickly.
    animateValue(gripScale, tuning.gripScale, { duration: 0.15 })
    // Evidence this card has been touched — holds off the next repeat of
    // TutorialStack's swipe-hint for as long as this card stays front (see
    // onInteraction's own doc comment). Harmless to call on every drag
    // start, not just the first on this card.
    onInteraction()
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
    if (variant.kind === 'start-over') {
      // Resistance, not a real drag: damped well under the actual finger
      // travel (START_OVER_RESIST_FACTOR, see its own comment) so it
      // visibly gives a little without ever tracking 1:1 — and
      // dragProgress deliberately never gets touched here. This card can
      // never commit (handleDragEnd below always cancels it), so there's
      // no genuine "progress toward advancing" for the peek behind it to
      // preview; leaving dragProgress alone keeps that peek completely
      // still through the whole resisting gesture.
      dragX.set(info.offset.x * START_OVER_RESIST_FACTOR)
      dragY.set(info.offset.y * START_OVER_RESIST_FACTOR)
      return
    }
    dragX.set(info.offset.x)
    dragY.set(info.offset.y)
    // See dragProgress's own doc comment above — this is what makes the
    // peek visibly start sliding into place while the front card is still
    // being held, not just at release.
    const distance = Math.hypot(info.offset.x, info.offset.y)
    dragProgress.set(Math.min(1, distance / tuning.commitDistance))
  }

  // A committed tutorial-card drag's departure — see handleDragEnd below.
  // The Start Over card no longer calls this (it flips in place instead,
  // see handleStartOverTap) — it used to share this exact function for its
  // own tap-triggered departure, back when tapping it made it fly away
  // like a swiped card; that read as "the card just vanishes" rather than
  // "it flips to reveal what's next," which is what this was actually
  // supposed to feel like, so that reuse was retired in favor of
  // handleStartOverTap's own dedicated flip.
  function flyOff(angle: number, velocity: { x: number; y: number }) {
    onCommitStart()
    // Fly-off continues in whatever direction was actually given (any
    // angle, not just left/right) — momentum-driven when there is any, so
    // a little bounce, and the release velocity is handed straight to the
    // spring (apple-design's "velocity handoff") so there's no seam
    // between the finger letting go and the card continuing on its own.
    // Not captured into a variable (used to be, for Promise.all below) —
    // see the fade-gates-onAdvance comment further down for why waiting
    // on these specifically was the actual cause of the lingering.
    animateValue(dragX, Math.cos(angle) * FLY_OFF_DISTANCE, {
      type: 'spring',
      velocity: velocity.x,
      bounce: tuning.flyOffBounce,
      duration: tuning.flyOffDuration,
    })
    animateValue(dragY, Math.sin(angle) * FLY_OFF_DISTANCE, {
      type: 'spring',
      velocity: velocity.y,
      bounce: tuning.flyOffBounce,
      duration: tuning.flyOffDuration,
    })
    // The *visible* disappearance is a separate, deliberately faster
    // animation from the translate spring above — flightX/flightY still
    // carry the card off in whatever direction it was actually thrown
    // (momentum-driven feel, unchanged), but a spring's tail decelerates
    // right near its target, so waiting for *that* to fully settle before
    // treating the card as "gone" is exactly what read as lingering at a
    // corner for a beat before disappearing. Fading + shrinking + diving
    // behind the peek (frontZIndex, above) on their own quicker timeline
    // sells "gone" well before the translate spring's long tail actually
    // finishes — and reads as the card receding into the stack rather
    // than just sailing off-screen.
    const FLIGHT_FADE_DURATION = tuning.flyOffDuration * 0.45
    // [0.25, 1, 0.5, 1] — the numeric form of this file's own
    // --ease-out-quart token (tokens.css), same curve already used for the
    // card's press-feedback transition below. Was 'easeIn', which starts
    // slow and accelerates at the *end* — for a fade-to-0 that meant the
    // card stayed near-fully-visible for most of this window and only
    // actually vanished right at the end, undermining the "sells gone
    // quickly" intent above. A strong ease-out front-loads the drop instead.
    const flightFade = animateValue(flightOpacity, 0, { duration: FLIGHT_FADE_DURATION, ease: [0.25, 1, 0.5, 1] })
    animateValue(flightScale, 0.55, { duration: FLIGHT_FADE_DURATION, ease: [0.25, 1, 0.5, 1] })
    animateValue(flightZDrop, 1, { duration: FLIGHT_FADE_DURATION, ease: [0.25, 1, 0.5, 1] })
    // Hand the stack forward once the card has actually *disappeared*
    // (the fade, not the translate) — see comment above. flightX/flightY
    // keep animating in the background and get cut off by the resets
    // below the moment this fires; that's intentional; they've already
    // done their job of carrying the card away from under your finger.
    flightFade.then(() => {
      onAdvance()
      // animate(..., {duration:0}), NOT .set() — matters here too:
      // without interrupting first, a bare .set() can still lose to a
      // not-fully-settled tail end of the animations above.
      animateValue(dragX, 0, { duration: 0 })
      animateValue(dragY, 0, { duration: 0 })
      animateValue(flightOpacity, 1, { duration: 0 })
      animateValue(flightScale, 1, { duration: 0 })
      animateValue(flightZDrop, 0, { duration: 0 })
    })
  }

  // Tapping (or Enter/Space on) the Start Over card — this card flips in
  // place to reveal the first tutorial on its back face (see the back-face
  // JSX below); it does not fly away. onCommitStart locks the whole stack
  // for the flip's duration, same protection every other commit gets.
  // Deliberately does NOT advance the logical stack (onAdvance) up front —
  // this card stays `isFrontCard` for its *entire* flip (activeCardIndex
  // only actually changes once the flip settles, below), which is what
  // lets every other pose value it already computes (rest rotation 0,
  // opacity 1, zIndex 1000) stay correct with zero extra overrides for the
  // whole ~0.7s: nothing about *this* card's own position/visibility ever
  // needs to react to "having advanced" until the swap below.
  function handleStartOverTap() {
    onCommitStart()
    const flip = animateValue(flipRotateY, 180, { type: 'spring', bounce: 0.15, duration: 0.7 })
    // Once the flip has actually turned all the way (back face now facing
    // the viewer, showing the same first-tutorial content this card's own
    // back face just displayed), hand off to the real, interactive card 0
    // instance — a separate TutorialStackCard that's been sitting in its
    // normal front pose the whole time, just occluded behind this one (see
    // zIndexFinal). onAdvance flips activeCardIndex to 0 via an instant
    // `.set()` (handleAdvance's existing wrapped-jump branch), not a tween
    // — invisible here for the same reason it always was: something is
    // already fully covering the jump, it's just this card's own settled
    // back face now, not an off-screen flown-away card. Resetting
    // flipRotateY back to 0 afterward is equally invisible: the instant
    // activeCardIndex changes, this card stops being isFrontCard and its
    // own opacity collapses to 0 via the ordinary "just departed" formula
    // (see useCardMotion's opacity), so nothing is left on screen to show
    // the reset happening.
    flip.then(() => {
      onAdvance()
      animateValue(flipRotateY, 0, { duration: 0 })
    })
  }

  // Swipe-hint nudge — see TutorialStack's own repeating idle timer for
  // what drives hintTrigger. Only the front card ever plays this (checked
  // via isFrontCard, not a fixed index — see hintTrigger's own doc comment
  // for why); every other card ignores it. Also opts out for the Start
  // Over slot specifically: swiping it never does anything (it only
  // resists and springs back, see handleDrag/handleDragEnd's start-over
  // branches) — tapping is the actual gesture there, so a swipe-shaped
  // nudge would be actively misleading rather than helpful. A small, quick
  // tug straight up and back — up because that's the direction this whole
  // feature already treats as canonical (see handleStartOverTap and
  // flyOff's own framing) — just enough to catch a glance without reading
  // as an actual commit-in-progress (NUDGE_DISTANCE is a fraction of
  // tuning.commitDistance). Reuses dragX/dragY directly rather than a
  // separate motion value: if the user grabs the card mid-nudge, Framer's
  // own onDrag keeps calling `.set()` every pointermove, which trivially
  // overrides whatever's left of this animation within a frame or two —
  // no special handoff needed, same as any other interruption in this
  // file. Repeats: hintTrigger itself increments every ~4s of continued
  // idleness on TutorialStack's end (not just once), so this effect just
  // naturally re-fires each time — nothing extra needed here to "repeat."
  useEffect(() => {
    if (!isFrontCard || variant.kind !== 'tutorial' || hintTrigger === 0) return
    const NUDGE_DISTANCE = 18
    const nudge = animateValue(dragY, -NUDGE_DISTANCE, { type: 'spring', bounce: 0.35, duration: 0.35 })
    nudge.then(() => {
      animateValue(dragY, 0, { type: 'spring', bounce: 0.25, duration: 0.4 })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed on hintTrigger alone: isFrontCard/dragY are stable-enough refs for this component instance, re-running on their identity isn't the intent here.
  }, [hintTrigger])

  function handleDragEnd(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    animateValue(gripScale, 1, { duration: 0.15 })
    if (variant.kind === 'start-over') {
      // Never commits, regardless of distance/velocity — this card only
      // ever advances via handleStartOverTap above. Always the same
      // settle-back-to-center a cancelled tutorial-card drag uses; the
      // velocity handed to it is scaled down to match the damped
      // resistance in handleDrag; feeding in the raw, undamped velocity
      // would make it visually "spring past" where it actually was.
      animateValue(dragX, 0, {
        type: 'spring',
        velocity: info.velocity.x * START_OVER_RESIST_FACTOR,
        bounce: 0,
        duration: tuning.cancelDuration,
      })
      animateValue(dragY, 0, {
        type: 'spring',
        velocity: info.velocity.y * START_OVER_RESIST_FACTOR,
        bounce: 0,
        duration: tuning.cancelDuration,
      })
      return
    }
    const distance = Math.hypot(info.offset.x, info.offset.y)
    const speed = Math.hypot(info.velocity.x, info.velocity.y)
    const committed = distance > tuning.commitDistance || speed > tuning.commitVelocity
    if (committed) {
      const angle = Math.atan2(info.offset.y, info.offset.x)
      flyOff(angle, { x: info.velocity.x, y: info.velocity.y })
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
      // flightOpacity is the one flat opacity at this level — separate
      // from ghost/content's own independent opacities below (those still
      // need to stay independent, see their own comment), but the fly-off
      // fade is a property of the *whole card as it leaves*, not either
      // layer specifically, so it multiplies on top of both uniformly. At
      // rest (not flying) it's always 1, a no-op.
      // transformStyle: 'preserve-3d' — needed so the two/three face
      // children below render as true 3D siblings sharing *this* element's
      // own 3D space, which is what makes their `backfaceVisibility:
      // 'hidden'` mean anything at all (see the transform comment above,
      // and the back-face layer's own comment below). Harmless for every
      // card that never rotates on Y.
      style={{ transform, zIndex: zIndexFinal, opacity: flightOpacity, transformStyle: 'preserve-3d' }}
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
      <CardBehind opacity={ghostOpacity} lookType={lookType} />
      {/* No rotation of its own — this is the "front face" in the
          reference implementation's terms (`.thefront`, no extra
          transform), always facing the viewer at flipRotateY===0 and
          turning away (backface-hidden) right alongside the parent as
          flipRotateY approaches 180 — which only ever happens for the
          Start Over card, during its own flip. Every other card's parent
          rotateY never leaves 0, so this is a permanent no-op there. */}
      <motion.div
        className="absolute inset-0"
        style={{ opacity: contentFinalOpacity, backfaceVisibility: 'hidden' }}
      >
        {variant.kind === 'tutorial' ? (
          <TutorialLookCard
            tutorial={variant.tutorial}
            onSelect={onSelect}
            disabled={!isInteractive}
            detailsOpacity={detailsOpacity}
            saved={variant.saved}
            onToggleSave={variant.onToggleSave}
          />
        ) : (
          <StartOverCard
            onSelect={handleStartOverTap}
            disabled={!isInteractive}
            detailsOpacity={detailsOpacity}
            lookType={lookType}
          />
        )}
      </motion.div>
      {/* The flip's "back face" (`.theback` in the reference implementation
          — statically pre-rotated 180°, backface-hidden) — only the Start
          Over slot has one. This is what tapping Start Over is actually
          revealing: a plain, non-interactive rendering of the first
          tutorial, sitting on the reverse side of the *same* card the
          "Start Over" content is printed on, not a separate card flying in
          from somewhere else. Hidden (backface-culled) at flipRotateY===0
          for exactly the same reason the content layer above is visible
          there; the two swap places as the parent crosses 90°. disabled +
          no onSelect/onToggleSave: this is decorative until the real,
          interactive card 0 instance (a completely separate
          TutorialStackCard, already sitting in its normal front pose
          underneath) takes over the instant handleStartOverTap's flip
          settles — see its own comment for why that handoff is invisible. */}
      {variant.kind === 'start-over' && (
        <div className="absolute inset-0" style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}>
          <TutorialLookCard tutorial={variant.firstTutorial} disabled saved={variant.firstTutorialSaved} />
        </div>
      )}
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
 * Doesn't actually loop any more: swiping away the last tutorial doesn't
 * silently wrap back to the first (an earlier version did — reaching the
 * end of the deck with no visible boundary read as confusing, no way to
 * tell whether you'd looped or just lost track). Instead it's a fixed
 * `tutorials.length + 1`-card cycle (`total` below) where that extra slot
 * is the Start Over card (see StartOverCard's own comment) — an explicit
 * dead end you have to deliberately tap (or Enter/Space) your way out of,
 * not something a swipe can carry you past. `% total`, not
 * `% tutorials.length` — see handleAdvance's wrapped-vs-forward split for
 * why the wrap specifically snaps instead of tweening; that logic is
 * otherwise unchanged, it just now also covers the Start Over → first-
 * tutorial wrap the same way it always covered last → first.
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

export function TutorialStack({ tutorials, onSelect, lookType }: TutorialStackProps) {
  const reduceMotion = useReducedMotion()
  // +1 for the Start Over slot (index === tutorials.length) — see this
  // component's own module comment above for why that's a real slot in
  // the cycle now instead of a plain `% tutorials.length` wrap.
  const total = tutorials.length + 1
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
  // Swipe-hint nudge: nudges the deck if the user hasn't touched the
  // *current* front card within 4s of it becoming front, and keeps
  // repeating every 4s for as long as that stays true — not a one-time
  // "teach it once" tooltip, a standing reminder that follows wherever
  // browsing currently is. Waits a beat rather than firing immediately on
  // arrival, since an instant nudge would play before anyone's had a
  // chance to even look at the screen, and the stack already gives a
  // visual cue (the peeking card + its tilt) that there's more here for
  // anyone who already gets it. A ref, not state, for the "have they
  // touched this one" flag: it's written from a card's onInteraction (a
  // plain callback, not a render) and only ever read inside the interval
  // below — no re-render should happen just because the user touched
  // something, that's what isAdvancing/activeCardIndex are for.
  const hasInteractedRef = useRef(false)
  // Bumped every 4s that hasInteractedRef is still false — threaded to
  // every card as `hintTrigger` (see TutorialStackCard's own doc comment
  // for why every card gets the same value instead of this component
  // singling one out; each decides via its own isFrontCard whether a given
  // bump is meant for it). Starts at 0, meaning "never triggered yet" (the
  // effect that watches it explicitly ignores 0 for that reason).
  const [hintTrigger, setHintTrigger] = useState(0)
  useEffect(() => {
    // reduceMotion skips this entirely: that branch renders a plain list
    // (see below) with no TutorialStackCard mounted at all, so nothing
    // would ever consume hintTrigger anyway — no point running an interval
    // whose only effect is an unread state update.
    if (reduceMotion) return
    // Resets the "have they touched this one" flag every time this effect
    // (re-)runs — i.e. every time activeCardIndex changes (see the
    // dependency array below) — so arriving at a new front card starts a
    // fresh 4s countdown regardless of whether an earlier card in this
    // same session was already interacted with. That's the whole point:
    // this isn't "has the user ever learned to swipe," it's "is *this*
    // card sitting idle right now."
    hasInteractedRef.current = false
    const interval = setInterval(() => {
      if (!hasInteractedRef.current) {
        setHintTrigger((c) => c + 1)
      }
    }, 4000)
    return () => clearInterval(interval)
    // activeCardIndex, not just reduceMotion: a new front card needs its
    // own fresh interval/flag, not a continuation of the previous card's.
  }, [reduceMotion, activeCardIndex])
  function handleInteraction() {
    hasInteractedRef.current = true
  }
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
    // % total, not % tutorials.length — see this component's own module
    // comment above. The only way to actually reach `next === 0` from
    // `activeCardIndex === tutorials.length` (the Start Over slot) is
    // handleStartOverTap calling this once its own flip has settled, never
    // a real drag commit (Start Over's own handleDragEnd never calls
    // onCommitStart/onAdvance at all) — so this generic advance path
    // staying exactly as it was for the ordinary last-tutorial case is
    // correct without needing to know *why* it was called.
    const next = (activeCardIndex + 1) % total
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
      // `wrapped` can only mean one thing now that there's a real Start
      // Over slot instead of a plain modulo (see this component's own
      // module comment): we just came *from* it, landing back on the
      // first tutorial — this time not because anything flew off, but
      // because handleStartOverTap's own flip just settled, and that
      // card's own turned-away back face is what's covering this jump
      // instead (see handleStartOverTap's own comment).
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
    // perspective: only the Start Over card's own restart flip ever puts
    // any 3D rotation on a card at all (see TutorialStackCard's
    // flipRotateY) — a shared perspective here just gives that one flip
    // real depth/foreshortening instead of looking like a flat mirror-
    // swap; every other card renders exactly as before, since perspective
    // is a no-op for children that never use a 3D transform in the first
    // place.
    <div className="relative mx-auto" style={{ width: CARD_WIDTH, height: CARD_HEIGHT, perspective: 1000 }}>
      {/* TEMPORARY — see MotionTuner's own comment above. Hidden for now:
          <MotionTuner tuning={tuning} onChange={setTuning} /> */}
      {tutorials.map((tutorial, index) => (
        <TutorialStackCard
          key={tutorial.id}
          variant={{ kind: 'tutorial', tutorial, saved: savedIds.has(tutorial.id), onToggleSave: () => handleToggleSave(tutorial.id) }}
          index={index}
          total={total}
          isLocked={isAdvancing}
          tuning={tuning}
          onCommitStart={handleCommitStart}
          activeIndex={activeIndex}
          dragProgress={dragProgress}
          activeCardIndex={activeCardIndex}
          onSelect={onSelect}
          onAdvance={handleAdvance}
          hintTrigger={hintTrigger}
          onInteraction={handleInteraction}
          lookType={lookType}
        />
      ))}
      {/* The stack's terminal slot — see this component's own module
          comment and StartOverCard's comment. index === tutorials.length,
          the one slot `total` (tutorials.length + 1) adds beyond the real
          tutorials. firstTutorial/firstTutorialSaved feed its back face
          (see TutorialStackCard's own JSX) — this app always has at least
          one tutorial, so tutorials[0] is never undefined in practice. */}
      <TutorialStackCard
        key="start-over"
        variant={{ kind: 'start-over', firstTutorial: tutorials[0], firstTutorialSaved: savedIds.has(tutorials[0].id) }}
        index={tutorials.length}
        total={total}
        isLocked={isAdvancing}
        tuning={tuning}
        onCommitStart={handleCommitStart}
        activeIndex={activeIndex}
        dragProgress={dragProgress}
        activeCardIndex={activeCardIndex}
        onAdvance={handleAdvance}
        hintTrigger={hintTrigger}
        onInteraction={handleInteraction}
        lookType={lookType}
      />
    </div>
  )
}
