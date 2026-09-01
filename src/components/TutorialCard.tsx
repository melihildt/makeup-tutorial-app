import { useEffect, useRef, useState, type CSSProperties } from 'react'
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
// Real product photography, already shot/cropped for the step-by-step flow
// (src/data/stepContent.ts) — reused here rather than re-sourced, for
// CardBack's own product preview. Three of the seven, picked for visual
// variety (a palette, a red-tubed mascara, a gold compact) rather than
// story order — this row is a preview, not a step sequence.
import previewEyeshadowImg from '../assets/product-images/Product_Eyeshadow.png'
import previewMascaraImg from '../assets/product-images/Product_Mascara.png'
import previewHighlightImg from '../assets/product-images/Product_Highlight.png'
// The remaining four of the same seven product photos — reused below as the
// "coming soon" thumbnails' blurred base image (see PLACEHOLDER_PRODUCT_IMAGES),
// rather than sourcing new stock photography for a placeholder state.
import previewConcealerImg from '../assets/product-images/Product_Concealer.png'
import previewConcealerBrushImg from '../assets/product-images/Product_Concealer-Bush.png'
import previewEyelinerImg from '../assets/product-images/Product_Eyeliner.png'
import previewMeritBrushImg from '../assets/product-images/Product_Merit-Brush.png'
import type { LookType } from './HomeScreen'
import { getRoleButtonProps } from './rowActivation'
import { BookmarkIcon, BookmarkOutlineIcon, LevelIcon, LockIcon, RotateRightIcon } from './icons'

/** The numeric (JS array) form of tokens.css's --ease-out-quart
 *  (cubic-bezier(0.25, 1, 0.5, 1)) — Framer Motion's animate()/transition
 *  props need a plain array, not a CSS custom property string, so this is
 *  the one shared source for that array instead of it being hand-typed at
 *  every call site. Import this into any other file that needs the same
 *  curve for a Framer animation (see App.tsx) rather than retyping it. */
export const EASE_OUT_QUART = [0.25, 1, 0.5, 1] as const

/** Toggles `value`'s membership in `set`, returning a new Set (never
 *  mutates the input) — shared by this file's own `flippedIds` toggle
 *  (below) and App.tsx's `toggleSavedTutorial`, rather than each hand-
 *  rolling the identical copy/delete-or-add/return body a third time
 *  (code review finding — a near-identical version used to live inline
 *  here for `savedIds` too, before that state moved to App.tsx). */
export function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  return next
}

/**
 * Tutorial stack card — "BigCard" component, node 642:5092
 * (Tech-Experimentation). TutorialLookCard is the card's own look, at
 * rest; TutorialStack (bottom of this file) is what drives a set of them
 * through a self-contained, drag-native deck (front card + one peeking
 * behind, advanced by swiping the front card — see TutorialStack's
 * module comment for why this isn't scroll-linked).
 *
 * Only "Soft Smokey Eye" has a real tutorial behind it (TutorialFlow is
 * hard-coded to that content, and doesn't even take a tutorial id — see
 * `hasContent`'s own comment) — every other entry is still a decorative
 * tap. The original four have real photos of their own (see `images`);
 * the eight added to fill Day/Night/Glam out to four cards each (see
 * `lookType`) reuse those same four image pairs as dummy placeholders
 * until real per-look photography lands — looking real now (and, since
 * HomeScreen actually filters on `lookType`, sorted into the right chip
 * now too), not functional yet.
 */
/** Node 674:3974 ("Icons", the level pill's own icon) — 'easy' lights only
 *  the shortest of the three ascending bars, 'medium' adds the middle one,
 *  'experienced' fills all three. See LevelIcon's own comment. */
export type TutorialLevel = 'easy' | 'medium' | 'experienced'

export type Tutorial = {
  id: string
  title: string
  brand: string
  /** Which Day/Night/Glam filter chip (HomeScreen's own LookType) this
   *  tutorial belongs to — HomeScreen filters `TUTORIALS` down to just the
   *  four whose `lookType` matches the selected chip before handing the
   *  list to TutorialStack, so this is what actually makes the filter row
   *  do something instead of just recoloring the ghost card. One type per
   *  tutorial, not a set: every tutorial here is still a placeholder look
   *  (see `hasContent`), so there's no real case yet for one look
   *  legitimately belonging to more than one category at once. */
  lookType: LookType
  durationMinutes: number
  /** Declared per-tutorial (true only for Soft Smokey Eye). HomeScreen's own
   *  card stack now gates on it too: TutorialDetailCard's CTA is
   *  StartTutorialButton (wired to `onSelect`/TutorialFlow) only when this
   *  is true, and ComingSoonButton — an inert disabled button, no
   *  TutorialFlow wiring at all — otherwise (see TutorialDetailCard's own
   *  comment). Previously every card's CTA opened the same hard-coded
   *  TutorialFlow (Soft Smokey Eye's real steps) regardless of this field,
   *  mislabeled for every other card; fixed per the user's own "coming
   *  soon" ask rather than left as the earlier known-accepted gap.
   *  BookmarksScreen.tsx gates on this field too (a tutorial with real
   *  content opens the flow from there; everything else shows a "coming
   *  soon" toast instead) — a separate mechanism (toast vs. disabled
   *  button) for a separate entry point, not a duplicate of this one. */
  hasContent: boolean
  images: [string, string]
  /** Drives the flipped card's level pill (LevelIcon + label) — see
   *  TutorialLevel. Placeholder values for now on every card, per the
   *  user's own call: real per-tutorial levels wait until each tutorial
   *  has real content behind it the way Soft Smokey Eye does. */
  level: TutorialLevel
  /** Total product count backing the flipped card's "+N products used"
   *  caption — PRODUCTS_PREVIEW_COUNT (ProductsPreview) are ever shown as
   *  photos, the caption is the *remaining* count beyond those, not the
   *  raw total (see ProductsPreview's own comment). Placeholder values for
   *  now, same reasoning as `level` — soft-smokey-eye's value (8) is the
   *  one the source Figma mockup itself demonstrates (25min/Easy/8
   *  products → "+5"), every other card's is invented for visual variety
   *  across the three levels while placeholder, not real counts yet. */
  productsUsedCount: number
  /** Real photos for the flipped card's product-preview row (ProductsPreview)
   *  — undefined falls back to the flat placeholder swatch there, same
   *  fallback pattern ProductCard already uses for a product with no
   *  `image`. Only Soft Smokey Eye has any (reused from the step-by-step
   *  flow's own product photography, src/data/stepContent.ts) — the other
   *  three don't have real tutorial content behind them yet (see `level`'s
   *  own comment), so a real photo here would be a specific claim about
   *  products this app doesn't actually have data for. Exactly
   *  PRODUCTS_PREVIEW_COUNT (3) when present — that's the array this row
   *  renders, not a separate cropped-down list. */
  productImages?: [string, string, string]
}

// Four cards per Day/Night/Glam chip (see HomeScreen's filter row and
// Tutorial's own `lookType` doc comment) — the real ask this data set now
// has to satisfy. Only the original four tutorials have real photography
// (src/assets/looks); the eight new ones added to fill out every chip to
// four reuse those same four image pairs round-robin rather than block on
// new photography, since the user is gathering real per-look images/copy
// separately and asked for dummy data to unblock the filter itself in the
// meantime. Swap `images`/`title`/`brand`/etc. in place per card once real
// assets land — `id`, `lookType`, and the shape of each entry aren't
// expected to change.
export const TUTORIALS: Tutorial[] = [
  // — Day —
  {
    id: 'everyday-mattes',
    title: 'Everyday Mattes',
    brand: 'Westman Gucci',
    lookType: 'day',
    durationMinutes: 15,
    hasContent: false,
    images: [mattesImage2, mattesImage1],
    level: 'easy',
    productsUsedCount: 5,
  },
  {
    id: 'sunlit-glow',
    title: 'Sunlit Glow',
    brand: 'Rare Beauty',
    lookType: 'day',
    durationMinutes: 12,
    hasContent: false,
    images: [lookImage2, lookImage1],
    level: 'easy',
    productsUsedCount: 4,
  },
  {
    id: 'fresh-face-five',
    title: 'Fresh Face Five',
    brand: 'Glossier',
    lookType: 'day',
    durationMinutes: 10,
    hasContent: false,
    images: [miaImage1, miaImage2],
    level: 'easy',
    productsUsedCount: 5,
  },
  {
    id: 'golden-hour-glow',
    title: 'Golden Hour Glow',
    brand: 'Rhode',
    lookType: 'day',
    durationMinutes: 18,
    hasContent: false,
    images: [autumnImage1, autumnImage2],
    level: 'medium',
    productsUsedCount: 7,
  },
  // — Night —
  {
    id: 'soft-smokey-eye',
    title: 'Soft Smokey Eye',
    brand: 'Tom Ford SS 2019',
    lookType: 'night',
    durationMinutes: 25,
    hasContent: true,
    images: [lookImage1, lookImage2],
    level: 'easy',
    productsUsedCount: 8,
    productImages: [previewEyeshadowImg, previewMascaraImg, previewHighlightImg],
  },
  {
    id: 'midnight-velvet',
    title: 'Midnight Velvet',
    brand: 'Pat McGrath Labs',
    lookType: 'night',
    durationMinutes: 30,
    hasContent: false,
    images: [mattesImage1, mattesImage2],
    level: 'experienced',
    productsUsedCount: 10,
  },
  {
    id: 'after-dark-liner',
    title: 'After Dark Liner',
    brand: 'Charlotte Tilbury',
    lookType: 'night',
    durationMinutes: 20,
    hasContent: false,
    images: [autumnImage2, autumnImage1],
    level: 'medium',
    productsUsedCount: 6,
  },
  {
    id: 'noir-romance',
    title: 'Noir Romance',
    brand: 'YSL Beauté',
    lookType: 'night',
    durationMinutes: 22,
    hasContent: false,
    images: [miaImage2, miaImage1],
    level: 'medium',
    productsUsedCount: 7,
  },
  // — Glam —
  {
    id: 'mia-odyssey',
    title: 'Mia for The Odyssey',
    brand: 'Nina Park',
    lookType: 'glam',
    durationMinutes: 15,
    hasContent: false,
    // Swapped from [miaImage1, miaImage2]: images[0] is ImagePair's right/
    // shorter slot, images[1] is the left/taller one — reversing the pair
    // moves what was on the left over to the right, and vice versa.
    images: [miaImage2, miaImage1],
    level: 'medium',
    productsUsedCount: 6,
  },
  {
    id: 'autumn-hermes',
    title: 'Autumn by Hermès',
    brand: 'Gregoris Pyrpylis',
    lookType: 'glam',
    durationMinutes: 15,
    hasContent: false,
    images: [autumnImage2, autumnImage1],
    level: 'experienced',
    productsUsedCount: 9,
  },
  {
    id: 'red-carpet-ready',
    title: 'Red Carpet Ready',
    brand: 'Fenty Beauty',
    lookType: 'glam',
    durationMinutes: 35,
    hasContent: false,
    images: [lookImage2, lookImage1],
    level: 'experienced',
    productsUsedCount: 11,
  },
  {
    id: 'diamond-cut',
    title: 'Diamond Cut',
    brand: 'Huda Beauty',
    lookType: 'glam',
    durationMinutes: 28,
    hasContent: false,
    images: [mattesImage1, mattesImage2],
    level: 'experienced',
    productsUsedCount: 9,
  },
]

// BookmarkIcon/RotateRightIcon/LevelIcon moved to icons.tsx along with
// every other icon in the app — see that file's own module comment for the
// consolidation. BookmarksScreen.tsx now imports BookmarkIcon from there
// directly rather than from this file.

/** Top-right timer pill — rounded-tr matches the card's own outer radius so
 *  the two curves read as one continuous corner (node 635:5048/5018/etc).
 *  Verify pass (2026-09-01, Home redesign, node 932:15424/932:15425): text
 *  color moved off --color-tutorial-card-text+opacity-80 (composited to a
 *  darker, warmer gray than the design) onto --color-tutorial-card-byline,
 *  the same flat #656462 swatch BigCard's own byline row uses — see that
 *  token's own tokens.css comment. opacity-80 class dropped since the flat
 *  color is already the exact match, no further dimming baked in. */
function TimerBadge({ minutes }: { minutes: number }) {
  return (
    <div className="flex w-full flex-col items-end">
      <div
        className="flex items-center justify-center rounded-bl-[16px] rounded-tr-[--radius-tutorial-card] py-[6px] pl-4 pr-6"
        style={{ background: 'var(--color-timer-badge-bg)' }}
      >
        <p
          className="whitespace-nowrap text-[12px] uppercase"
          style={{ color: 'var(--color-tutorial-card-byline)', fontWeight: 'var(--font-weight-semibold)' }}
        >
          {minutes} min
        </p>
      </div>
    </div>
  )
}

/** The two overlapping photos — every `TUTORIALS` entry has real ones now
 *  (`images` is non-nullable; the placeholder-swatch fallback this used to
 *  have was removed once that stopped being a real case, see git history
 *  if a future tutorial genuinely ships without photos). One shared
 *  geometry reused across every tutorial — the source design varies these
 *  numbers slightly per variant, but matching each variant's exact
 *  sub-pixel layout individually isn't worth chasing. */
function ImagePair({ tutorial }: { tutorial: Tutorial }) {
  // Verify pass (2026-09-01, Home redesign, node 932:15428/932:15429): was
  // a directional warm-brown shadow (0px 4px 20px rgba(67,48,35,0.2)) — a
  // fresh pull shows both photos now use this app's own soft ambient
  // shadow family instead (no y-offset, near-black at low alpha), just a
  // wider blur (24px) than --shadow-card's 8px and no spread, distinct
  // from any existing token so kept local like this file's other
  // hand-tuned shadows (see ProductsPreview's own `shadow` const below).
  const shadow = '0px 0px 24px 0px rgba(14, 11, 6, 0.03)'
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
          <img
            alt=""
            src={tutorial.images[0]}
            className="h-[166.44px] w-[143px] rounded-[20px] object-cover"
            style={{ boxShadow: shadow }}
          />
        </div>
      </div>
      {/* Taller image, left side. Exact Figma values: 143x213,
          rotate(-2.387deg). Offset -70.63px, same precision correction. */}
      <div className="absolute left-1/2 top-0 h-[218.771px] w-[151.747px] -translate-x-1/2" style={{ marginLeft: '-70.63px' }}>
        <div className="flex h-full w-full items-center" style={{ transform: 'rotate(-2.387deg)' }}>
          <img
            alt={`Model wearing the ${tutorial.title} look`}
            src={tutorial.images[1]}
            className="h-[213px] w-[143px] rounded-[20px] object-cover"
            style={{ boxShadow: shadow }}
          />
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
 *  careful stopPropagation everywhere). getRoleButtonProps (rowActivation.ts)
 *  reproduces exactly what the native button gave up (Enter/Space
 *  activation, tab order, disabled state), while leaving room for one real
 *  nested `<button>` for the bookmark. */
export function TutorialLookCard({ tutorial, onSelect, disabled, detailsOpacity, saved, onToggleSave }: TutorialLookCardProps) {
  return (
    <div
      {...getRoleButtonProps(onSelect, disabled)}
      // active:scale-[0.97] (motion audit, Home screen only): a plain tap
      // used to get zero acknowledgment before the screen changed — only a
      // drag got feedback, via gripScale on the wrapping motion.div in
      // TutorialStackCard. Safe alongside that: a disabled card (every
      // card but the front one) has no onClick/onKeyDown attached above,
      // so :active only ever fires on the one card that's actually
      // tappable, and stacks harmlessly with gripScale on the rare frame
      // both are transiently true (pointerdown-before-drag-threshold).
      className={`relative flex h-full w-[338px] flex-col items-center gap-1 overflow-hidden pb-6 text-left active:scale-[0.97] has-[button:active]:scale-100 ${disabled ? '' : 'cursor-pointer'}`}
      style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-tutorial-card)',
        // --shadow-card-elevated, not --shadow-tutorial-card (verify pass,
        // 2026-09-01, Home redesign): a fresh pull of this card's own root
        // (node 932:15422) shows "BeautyNotes/Shadow_2" (24px blur, 6px
        // spread) — the same shared elevated-sheet shadow Step 7/All
        // Steps/My Products/Account/Bookmarks already use, not the
        // smaller Shadow_1 this card used to cite (which stays correct
        // for CardBehind's own ghost/peek layer, untouched this pass).
        boxShadow: 'var(--shadow-card-elevated)',
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
                fontSize: 'var(--font-size-title-serif)',
                letterSpacing: 'var(--letter-spacing-title-serif)',
                color: 'var(--color-tutorial-card-text)',
              }}
            >
              {tutorial.title}
            </p>
            {/* Verify pass (2026-09-01, Home redesign, node 932:15433):
                color moved off --color-tutorial-card-text+opacity-70 onto
                the flat --color-tutorial-card-byline swatch (opacity-70
                kept — the fresh pull still shows this row at 70% even
                though the fill itself is already the flat, correct
                value), tracking (-0.12px) added (was missing entirely,
                same BeautyNotes/p-12 pair --letter-spacing-shade already
                names elsewhere), and the brand name's underline dropped
                — the fresh pull shows plain text now, no
                text-decoration. */}
            <div
              className="flex items-start gap-1 text-[12px] tracking-[--letter-spacing-shade]"
              style={{ fontWeight: 'var(--font-weight-medium)' }}
            >
              <p className="opacity-70" style={{ color: 'var(--color-tutorial-card-byline)' }}>
                By
              </p>
              <p className="opacity-70" style={{ color: 'var(--color-tutorial-card-byline)' }}>
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
              {/* BookmarkOutlineIcon, not BookmarkIcon filled={false} — see
                  that icon's own comment (icons.tsx) for why this card's
                  unsaved state now renders its own fresh-pulled asset
                  instead of the old shared dimmed-path branch. Saved stays
                  on BookmarkIcon (no new asset for that state yet). */}
              {saved ? <BookmarkIcon filled /> : <BookmarkOutlineIcon />}
            </span>
          </button>
        </motion.div>
      </div>
    </div>
  )
}

/** Shared pill container for the flipped card's level/duration row, node
 *  673:3746/673:3749 ("Timer") — a plain symmetric-radius pill, distinct
 *  from the front card's own TimerBadge (which has an asymmetric corner
 *  matching the card's own outer curve, meant specifically for that
 *  corner position). --color-timer-badge-bg is the same token TimerBadge
 *  already uses (rgba(44,41,38,0.05) — confirmed the exact value Figma
 *  specifies here too, not a coincidence worth a second token).
 *
 *  Verify pass (2026-09-01, node 934:16470): radius corrected 6px→20px —
 *  a fresh pull of both pills on this exact card shows a true pill radius
 *  (the Duration pill's own 28px height makes 20px fully round it either
 *  way, same math this file's other true-pill radii already lean on), not
 *  the small rounded-rect this used to be. */
function DetailPill({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex shrink-0 items-center gap-2 rounded-[20px] px-3 py-1.5"
      style={{ background: 'var(--color-timer-badge-bg)' }}
    >
      {children}
    </div>
  )
}

/** How many of a tutorial's products ever show as an actual preview photo
 *  — the "+N products used" caption is the *remaining* count beyond these
 *  three, not the tutorial's raw total (see ProductsPreview's own
 *  comment). */
const PRODUCTS_PREVIEW_COUNT = 3

/** The seven real product photos this app already has (three of them are
 *  Soft Smokey Eye's own real preview above) — reused as the *base* photo
 *  behind a "coming soon" thumbnail's blur+tint (see ComingSoonThumbnail),
 *  rather than inventing new placeholder imagery for a tutorial that has
 *  no real content yet. Not meant to claim these specific products are
 *  used in any given coming-soon look; they're just believable-looking
 *  makeup photography to blur, same spirit as --color-product-placeholder
 *  but with actual texture instead of a flat swatch. */
const PLACEHOLDER_PRODUCT_IMAGES = [
  previewEyeshadowImg,
  previewMascaraImg,
  previewHighlightImg,
  previewConcealerImg,
  previewConcealerBrushImg,
  previewEyelinerImg,
  previewMeritBrushImg,
]

/** "Saturated notes" for a coming-soon thumbnail's colored blur — three
 *  passes at the user's own request each time. First: vivid, varied hues
 *  (rose red/amber/blue/plum/sage/orchid), well past the source Figma
 *  mock's own near-pastel tints (rgba(240,224,227,0.5) etc, node
 *  754:11030). Second, per the user's follow-up: pulled all the way back
 *  to a washed-out beige/greige/taupe family — same warm neutral hues, but
 *  low enough saturation it read closer to the page's own ink/cream tokens
 *  than as a colored note at all. This third pass keeps that same warm
 *  beige/terracotta/caramel hue family (no blue/plum/sage — this stays a
 *  neutral palette, not the first pass's rainbow) but with noticeably more
 *  pigment in each color — the middle ground the user asked for between
 *  the two previous passes, not a full reversion to either. */
const COMING_SOON_TINTS = [
  'rgba(206, 156, 96, 0.5)', // gold sand
  'rgba(176, 128, 92, 0.5)', // clay
  'rgba(150, 98, 68, 0.5)', // mocha
  'rgba(198, 126, 108, 0.5)', // dusty rose
  'rgba(180, 148, 96, 0.5)', // bronze
  'rgba(210, 156, 88, 0.5)', // caramel
]

/** Cheap, dependency-free string hash — good enough to turn a tutorial's
 *  `id` into a stable seed (see pickDistinct below), not for anything
 *  security-sensitive. */
function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) | 0
  return Math.abs(hash)
}

/** Picks `count` distinct items out of `pool`, deterministically, from a
 *  numeric seed — "random" per the user's ask in the sense that different
 *  tutorials land on different combinations, but *stable* for a given
 *  tutorial across re-renders (ProductsPreview remounts on every flip, via
 *  its own `key={String(justRevealed)}` — a real Math.random() here would
 *  reshuffle the photos every time a card flips, which would read as
 *  broken rather than as a fixed placeholder look). Plain linear scan
 *  rather than a Fisher-Yates shuffle: `count` is always tiny (3) here, so
 *  there's no reason to shuffle the whole pool just to take a few items
 *  from it. */
function pickDistinct<T>(pool: T[], seed: number, count: number): T[] {
  const result: T[] = []
  let i = seed
  while (result.length < count) {
    const candidate = pool[i % pool.length]
    if (!result.includes(candidate)) result.push(candidate)
    i++
  }
  return result
}

/** The flipped card's product-photo row + caption, node 673:3751
 *  ("Images"). Three overlapping thumbnails (∓7° tilt on the outer two,
 *  matching ImagePair's own tilt-the-outer-two-oppositely shape above) —
 *  real photos when `tutorial.productImages` has them (currently only Soft
 *  Smokey Eye, reused from the step-by-step flow's own product photography
 *  — see the type's own comment), a flat placeholder swatch
 *  (--color-product-placeholder — Figma's own placeholder-gray, see the
 *  token's own comment, tokens.css) otherwise: still not an *invented*
 *  photo for a tutorial with no real content behind it — same reasoning
 *  ProductCard already uses for a product with no `image`.
 *
 *  Not a pixel-for-pixel reproduction of the source's compound
 *  absolute+translate positioning for the row-then-caption stack — a
 *  plain flex-col with a gap lands in the same visual spot without the
 *  double-centering math, same "close enough, not worth the exact copy"
 *  call this file already makes elsewhere (see ImagePair's own comment on
 *  approximated vs. exact-pulled numbers).
 *
 *  "+N products used": the source design's own example (25min/Easy/8
 *  products) shows "+5" — 8 total minus the 3 shown here, not the raw
 *  total. Clamped at 0 for a tutorial with fewer than
 *  PRODUCTS_PREVIEW_COUNT products total (an edge case placeholder data
 *  doesn't hit, but real data eventually might).
 *
 *  `justRevealed` (new) — true for exactly the render where this row
 *  should play its pop-in entrance (product-preview-pop-in, index.css):
 *  the tap-driven flip in TutorialStackCard, keyed by that card's own
 *  `isFlipped`. Not true for the reduced-motion stack (TutorialStack's
 *  own `reduceMotion` branch swaps this content in instantly with no
 *  transition at all, per that branch's own comment — "fewer and
 *  gentler, not zero" means removing motion there, not adding a
 *  different one), so callers that can't tell may just omit it; the
 *  `reduceMotion` check below is a second, independent guard either way
 *  (this device's own OS-level setting, not which call site rendered
 *  it). Deliberately keyed on the *row*, not on each thumbnail alone —
 *  see the `key` below. */
function ProductsPreview({ tutorial, justRevealed = false }: { tutorial: Tutorial; justRevealed?: boolean }) {
  const reduceMotion = useReducedMotion()
  const shadow = '0px 2px 8px 0px rgba(67, 48, 35, 0.1)'
  const remaining = Math.max(0, tutorial.productsUsedCount - PRODUCTS_PREVIEW_COUNT)
  // Base delay estimates when CardBack actually becomes visible, not when
  // this row mounts: cardBackFlipOpacity (TutorialStackCard) only starts
  // rising once the flip's flipRotateY crosses 105 of its 180deg travel —
  // FLIP_VISIBLE_FRACTION below. Derived from
  // DEFAULT_MOTION_TUNING.tapFlipDuration (code review finding: this used
  // to be a hardcoded `260`, linked to handleCardTap's own spring duration
  // only by a comment doing the "0.58 × 450 ≈ 260" arithmetic by hand — a
  // future retune of tapFlipDuration there would silently desync it).
  // Without this delay, the pop-in (mount-triggered) would run and finish
  // while CardBack is still at opacity 0, invisible, so by the time the
  // flip actually reveals it the photos would already be sitting at rest
  // with nothing left to see. +60ms stagger on top of that (skill's
  // 30-80ms band) for "pop from the middle": center first, the two outer
  // photos a beat behind, reading as bursting outward rather than all
  // three at once. FLIP_VISIBLE_FRACTION itself is still approximated from
  // the spring's nominal numbers, not measured frame-by-frame — worth a
  // feel-check on a real device against the actual flip if the pop ever
  // reads late/early relative to the reveal.
  const FLIP_VISIBLE_FRACTION = 0.58
  const POP_BASE_DELAY_MS = Math.round(DEFAULT_MOTION_TUNING.tapFlipDuration * 1000 * FLIP_VISIBLE_FRACTION)
  const POP_STAGGER_MS = 60
  const popStyle = (delayMs: number, animationName: string): CSSProperties | undefined =>
    justRevealed && !reduceMotion
      ? { animation: `${animationName} var(--duration-base) var(--ease-out-quart) both`, animationDelay: `${delayMs}ms` }
      : undefined
  // Real photos get the celebratory pop; coming-soon placeholders get a
  // plain fade — see product-preview-fade-in's own comment (index.css) for
  // why. Resolved once per row rather than per thumbnail: all three
  // thumbnails in a given ProductsPreview are always the same branch
  // (tutorial.hasContent doesn't vary within one row).
  const popAnimationName = tutorial.hasContent ? 'product-preview-pop-in' : 'product-preview-fade-in'
  const thumbnail = (rotateDeg: number, image?: string) => (
    <div
      className="h-[108px] w-[96px] shrink-0 overflow-hidden rounded-[18px] border-[3px] border-solid border-white"
      style={{ background: 'var(--color-product-placeholder)', boxShadow: shadow, transform: rotateDeg ? `rotate(${rotateDeg}deg)` : undefined }}
    >
      {image && <img src={image} alt="" className="size-full object-cover" />}
    </div>
  )
  // No real tutorial yet (see Tutorial's own `hasContent` doc comment) —
  // node 754:11030 of the "Coming Soon" reference mock (Tech-Experimentation)
  // shows this same row as a real photo with a colored blur laid over it,
  // rather than the flat --color-product-placeholder swatch `thumbnail`
  // above renders for a plain missing image. A sharp 3px rim (the white
  // border every thumbnail already has) framing a blurred, tinted center
  // reads as "there's a photo here, just not ready to show yet" — instead
  // of either an invented real-looking product photo (this tutorial has no
  // real products behind it to show) or the same flat gray every other
  // "no image" case in this app uses (which reads as broken/missing here,
  // not deliberately withheld).
  const comingSoonThumbnail = (rotateDeg: number, image: string, tint: string) => (
    <div
      className="relative h-[108px] w-[96px] shrink-0 overflow-hidden rounded-[18px] border-[3px] border-solid border-white"
      style={{ boxShadow: shadow, transform: rotateDeg ? `rotate(${rotateDeg}deg)` : undefined }}
    >
      <img src={image} alt="" className="absolute inset-0 size-full object-cover" />
      {/* backdrop-blur (not a blur on the img itself): blurring the img
          directly would also have to fight this div's own rounded-corner
          clip re-revealing a hard edge at the seam. inset-0, flush with the
          image and the white border around it — not inset-[3px] the way
          the source Figma mock built this (node 754:11035/38/41, an
          exactly-3px-inset blur layer): that left a 3px ring of the raw,
          unblurred photo showing between the white border and the blurred
          center, which reads as an unwanted second (often gray, since
          these product photos have light studio backgrounds right at
          their edges) border — the user's own catch, comparing this
          against the real-photo thumbnail's plain single white border. */}
      <div className="absolute inset-0 rounded-[15px] backdrop-blur-[6px]" style={{ background: tint }} />
    </div>
  )
  const [imageA, imageB, imageC] = tutorial.productImages ?? []
  // Seeded off the tutorial's own id (see pickDistinct's own comment for
  // why not Math.random()) — a `+ 1` offset on the tint seed so a given
  // tutorial doesn't always land on "photo N paired with tint N," which
  // would make the seed pattern visually obvious across cards.
  const placeholderSeed = hashString(tutorial.id)
  const [placeholderImageA, placeholderImageB, placeholderImageC] = tutorial.hasContent
    ? []
    : pickDistinct(PLACEHOLDER_PRODUCT_IMAGES, placeholderSeed, 3)
  const [tintA, tintB, tintC] = tutorial.hasContent ? [] : pickDistinct(COMING_SOON_TINTS, placeholderSeed + 1, 3)
  return (
    <div className="flex w-full flex-col items-center gap-2 px-6 pt-6">
      {/* key={String(justRevealed)}: forces this row to remount every time
          justRevealed flips (both directions — the false-state remount is
          harmless, CardBack is invisible then anyway), same "animation
          needs a fresh mount" reasoning as CheckIndicator/ScreenHeader —
          product-preview-pop-in is a CSS `animation`, which only plays on
          mount, and this row otherwise stays mounted continuously across
          flips (CardBack itself never unmounts, see TutorialStackCard's
          own comment on that), so without a key it would only ever play
          once, on this card's very first render. Animation styles live on
          each thumbnail's own wrapper below (not on the thumbnail div
          itself), so the wrapper's fresh `transform: scale()` never fights
          that div's own static `rotate()`. */}
      <div key={String(justRevealed)} className="flex items-center justify-center">
        <div
          className="mr-[-16px] flex h-[119px] w-[108px] shrink-0 items-center justify-center"
          style={popStyle(POP_BASE_DELAY_MS + POP_STAGGER_MS, popAnimationName)}
        >
          {tutorial.hasContent ? thumbnail(-7, imageA) : comingSoonThumbnail(-7, placeholderImageA, tintA)}
        </div>
        <div className="mr-[-16px]" style={popStyle(POP_BASE_DELAY_MS, popAnimationName)}>
          {tutorial.hasContent ? thumbnail(0, imageB) : comingSoonThumbnail(0, placeholderImageB, tintB)}
        </div>
        <div
          className="flex h-[119px] w-[108px] shrink-0 items-center justify-center"
          style={popStyle(POP_BASE_DELAY_MS + POP_STAGGER_MS, popAnimationName)}
        >
          {tutorial.hasContent ? thumbnail(7, imageC) : comingSoonThumbnail(7, placeholderImageC, tintC)}
        </div>
      </div>
      <p
        className="text-center text-[12px] opacity-70"
        style={{ color: 'var(--color-tutorial-card-text)', fontWeight: 'var(--font-weight-medium)' }}
      >
        +{remaining} products used
      </p>
    </div>
  )
}

/** "Start Tutorial" CTA, node 673:3759 ("Back-button") — black/ink
 *  background regardless of the selected filter (per the user's own
 *  call, updating the source design from the original gold to match),
 *  which is why this reads `var(--color-tutorial-card-text)` directly
 *  rather than GHOST_TEXTURES-style per-filter branching: there's only
 *  ever one value. stopPropagation so tapping this doesn't also fire the
 *  flipped card's own "tap anywhere flips back to front" handler (same
 *  pattern as the front card's bookmark button, see TutorialLookCard's
 *  own comment).
 *
 *  290x52, rounded-[30px] (a true pill at this height), 15px label, no
 *  icon: re-pulled from a fresh get_design_context on node 673:3759 — the
 *  source design dropped the play icon and grew the button (was 240x44,
 *  rounded-[12px], 12px label + PlayIcon), per the user's own explicit
 *  ask to size this up and remove its icon rather than an inferred
 *  restyle.
 *
 *  Verify pass (2026-09-01, node 934:16470): background is the user's own
 *  explicit ask, a literal `#21201F` — not `var(--color-tutorial-card-text)`
 *  even though that token already resolves to the same hex today, so this
 *  button's own background can't drift if that shared ink token is ever
 *  retuned for its other (unrelated) call sites. Label also corrected
 *  16px→15px and gained the `-0.15px` tracking it was missing — both
 *  confirmed on this exact node, the same BeautyNotes/p-18 pair the
 *  chip labels use (HomeScreen.tsx). */
function StartTutorialButton({ onStart, disabled }: { onStart?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        onStart?.()
      }}
      className="flex h-[52px] w-[290px] shrink-0 items-center justify-center overflow-hidden rounded-[30px] border-[0.5px] border-solid active:scale-[0.97]"
      style={{
        background: '#21201F',
        borderColor: 'rgba(44, 41, 38, 0.1)',
        transition: 'transform var(--duration-instant) var(--ease-out-quart)',
      }}
    >
      <span className="text-[15px] tracking-[-0.15px] text-white" style={{ fontWeight: 'var(--font-weight-medium)' }}>
        Start Tutorial
      </span>
    </button>
  )
}

// LockIcon moved to icons.tsx along with every other icon in the app — see
// that file's own module comment for the consolidation.

/** "Coming soon" CTA — replaces StartTutorialButton for a tutorial with no
 *  real content yet (`!tutorial.hasContent`, see that field's own doc
 *  comment). A real disabled `<button>`, not a styled div: a disabled
 *  button doesn't dispatch click at all, so tapping it neither "starts"
 *  anything nor bubbles up to flip the card back to front (no
 *  stopPropagation needed here the way StartTutorialButton's onClick
 *  needs one) — it just inertly communicates "not tappable," matching the
 *  lock icon. Same 290x52 pill footprint as StartTutorialButton so
 *  swapping between the two doesn't reflow anything else in the card.
 *
 *  Verify pass (2026-09-01): re-pulled against node 903:12079
 *  ("Back-button", Home/DaySelected — the real in-context mock, not the
 *  older isolated 754:11044 reference this was originally built from).
 *  Three things were wrong: background was rgba(44,41,38,0.1) (should be
 *  flat --color-coming-soon-button-bg); there was a 0.5px border (Figma
 *  has none — removed entirely); and the icon came after the label
 *  (Figma orders it icon-then-label). Text opacity-80 also dropped in
 *  favor of the fresh pull's flat --color-coming-soon-text. */
function ComingSoonButton() {
  return (
    <button
      type="button"
      disabled
      aria-label="Coming soon — this tutorial isn't available yet"
      className="flex h-[52px] w-[290px] shrink-0 items-center justify-center gap-2 overflow-hidden rounded-[30px]"
      style={{ background: 'var(--color-coming-soon-button-bg)' }}
    >
      <LockIcon />
      <span
        className="text-[15px]"
        style={{ color: 'var(--color-coming-soon-text)', fontWeight: 'var(--font-weight-medium)', letterSpacing: '-0.15px' }}
      >
        Coming soon
      </span>
    </button>
  )
}

/** The card's back face, node 673:3771 ("BigCard", state="Unfold") —
 *  level + duration, a product-photo preview, and the CTA that actually
 *  opens the tutorial (see TutorialStackCard's flip wiring for why the
 *  whole-card tap no longer does that directly). Root is the same
 *  role="button" whole-card-tappable pattern as TutorialLookCard (see its
 *  own comment) — tapping anywhere *except* the CTA flips back to the
 *  front face; the CTA itself stops that propagation (see
 *  StartTutorialButton's own comment) so it can do something different
 *  (open the tutorial) instead. detailsOpacity isn't threaded in here the
 *  way TutorialLookCard's is: this face can only ever become visible once
 *  a card is already fully front and settled (see TutorialStackCard's
 *  isFlipped — flipping is only ever wired up once isInteractive), at
 *  which point the ordinary ghost-reveal opacity is already 1 regardless,
 *  so there's no crossfade band left to narrow.
 *
 *  `border` (new) — pure diagnostic finding, not a guess: real on-device
 *  logging (Safari Web Inspector, a whole session's worth) proved
 *  flightOpacity/flightScale/cardBackOpacity all animate identically and
 *  correctly for this face during a fly-off, same as the front face's —
 *  no code asymmetry left to find. The user's "it just disappears" was a
 *  *contrast* problem, not a timing one: --color-surface (#ffffff) fading
 *  against this app's own page gradient (bottoms out at #fbf7f5, near-
 *  identical to white) crosses below perceptible well before its opacity
 *  numerically reaches 0 — while the front face's photo stays trackable
 *  through nearly the whole fade. A low-alpha *dark* border keeps enough
 *  contrast to stay visible much further into the fade than a near-white
 *  fill can (blending dark-over-light shows clearly at low alpha; near-
 *  white-over-near-white doesn't, regardless of alpha) — same rgba this
 *  card's own CTA button already uses (StartTutorialButton's borderColor),
 *  reused here rather than inventing a second value. */
// Exported (Storybook) so its own states — hasContent true/false, each
// TutorialLevel — can be reviewed in isolation without driving
// TutorialStack's drag/flip gesture to reach them; still module-private to
// every other consumer (only TutorialStackCard renders it in the real app).
export function TutorialDetailCard({
  tutorial,
  onFlipBack,
  onStart,
  disabled,
  justRevealed,
}: {
  tutorial: Tutorial
  onFlipBack?: () => void
  onStart?: () => void
  disabled?: boolean
  /** Passed straight through to ProductsPreview — see that component's
   *  own comment. */
  justRevealed?: boolean
}) {
  return (
    <div
      {...getRoleButtonProps(onFlipBack, disabled)}
      className={`relative flex h-full w-[338px] flex-col items-center gap-1 overflow-hidden border-[0.5px] border-solid pb-6 text-left active:scale-[0.97] has-[button:active]:scale-100 ${disabled ? '' : 'cursor-pointer'}`}
      style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-tutorial-card)',
        boxShadow: 'var(--shadow-tutorial-card)',
        borderColor: 'rgba(44, 41, 38, 0.1)',
        transition: 'transform var(--duration-instant) var(--ease-out-quart)',
      }}
    >
      <div className="flex w-full items-start justify-between px-5 py-4">
        {/* opacity-80 removed (verify pass, 2026-09-01, node 934:16470): a
            fresh pull shows this pill's text at the same flat, undimmed
            #21201f as its Duration sibling below — this was the one of
            the two pills still carrying the old dimming. */}
        <DetailPill>
          <LevelIcon level={tutorial.level} />
          <p className="whitespace-nowrap text-[12px] uppercase" style={{ color: 'var(--color-tutorial-card-text)', fontWeight: 'var(--font-weight-semibold)' }}>
            {tutorial.level}
          </p>
        </DetailPill>
        <DetailPill>
          <p className="whitespace-nowrap text-[12px] uppercase" style={{ color: 'var(--color-tutorial-card-text)', fontWeight: 'var(--font-weight-semibold)' }}>
            {tutorial.durationMinutes} min
          </p>
        </DetailPill>
      </div>
      <ProductsPreview tutorial={tutorial} justRevealed={justRevealed} />
      <div className="flex w-full flex-1 items-end justify-center pt-4">
        {tutorial.hasContent ? (
          <StartTutorialButton onStart={disabled ? undefined : onStart} disabled={disabled} />
        ) : (
          <ComingSoonButton />
        )}
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
 *  own size and position, filling that same box.
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
 *  reads as gold. `opacity` drives the peek reveal — see useCardMotion's
 *  contentOpacity. `backfaceVisibility: 'hidden'` is a permanent no-op for
 *  every card except the first tutorial slot mid-restart-flip (see
 *  TutorialStackCard's flipRotateY) — this layer's *inherited* rotation
 *  only ever turns it away from the viewer when its *parent* does, which
 *  happens nowhere else.
 *
 *  Renders `lookType`'s texture directly, no transition on a filter change
 *  (code review finding, removed): this used to animate a "duck behind the
 *  front card, swap, swing back out" gesture on `lookType` changing, keyed
 *  off a `useEffect(() => {...}, [lookType])`. That effect could never
 *  actually fire as a transition — HomeScreen keys `TutorialStack` on
 *  `selectedType` (see its own module comment), so every filter tap fully
 *  unmounts and remounts the whole stack rather than changing this
 *  component's `lookType` prop on an already-mounted instance; the effect's
 *  own `isFirstRender` guard silently swallowed the one invocation it ever
 *  got, on mount, with the *new* value already baked in. ~90 lines of
 *  motion/state for an animation that could never run — removed rather
 *  than reworked (the fix that would actually make it fire means not
 *  remounting the stack on filter change at all, real surgery on
 *  TutorialStackCard's own ~20 interacting motion values, out of scope for
 *  a correctness pass — the user's own call between the two). */
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
      <img alt="" src={GHOST_TEXTURES[lookType]} className="size-full object-cover" />
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
      {...getRoleButtonProps(onSelect, disabled)}
      className={`relative flex h-full w-[338px] items-center justify-center overflow-hidden text-left active:scale-[0.97] ${disabled ? '' : 'cursor-pointer'}`}
      style={{
        borderRadius: 'var(--radius-tutorial-card)',
        boxShadow: 'var(--shadow-tutorial-card)',
        transition: 'transform var(--duration-instant) var(--ease-out-quart)',
      }}
    >
      {/* Renders `lookType`'s texture directly, no transition on a filter
          change (code review finding, removed) — this used to be an
          interruptible JS crossfade (an imgOpacity motion value + a
          displayedLookType state, swapped via useEffect(..., [lookType])),
          replacing an even older key={lookType} remount that restarted a
          CSS keyframe from zero on every rapid filter tap. Turns out that
          whole effect could never fire as a transition either, same root
          cause as CardBehind's own (removed) duck/swap/swing-back gesture
          above: HomeScreen keys TutorialStack itself on selectedType, so
          this component is fully unmounted and remounted on every filter
          tap with the new lookType already baked in — the effect's
          isFirstRender guard swallowed the only invocation it ever got. */}
      <img alt="" src={GHOST_TEXTURES[lookType]} className="absolute inset-0 size-full object-cover" />
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
// Exported (Storybook) so TutorialLookCard/TutorialDetailCard stories can
// size their own container to exactly what TutorialStackCard gives these
// cards in the real app (both have `h-full`/`w-[338px]` internally — with
// no ancestor height, `h-full` alone collapses to 0).
export const CARD_HEIGHT = 359
export const CARD_WIDTH = 338

type TutorialStackProps = {
  tutorials: Tutorial[]
  /** Same handoff for every card regardless of which one is on top —
   *  only "Soft Smokey Eye" has a real tutorial behind it right now (see
   *  this file's module comment), so every card routes to it for the time
   *  being rather than the rest silently doing nothing. */
  onSelect?: () => void
  /** The selected Day/Night/Glam filter — see HomeScreen's own LookType.
   *  HomeScreen has already filtered `tutorials` down to this type's own
   *  four cards before this component ever sees them (see Tutorial's own
   *  `lookType` doc comment) — this prop itself still just drives the
   *  ghost card's own color, threaded straight through to every
   *  TutorialStackCard as `lookType`. */
  lookType: LookType
  /** Bookmark toggle state, lifted all the way up to App.tsx now (and from
   *  there persisted to localStorage) — no longer owned here. Moved once
   *  BookmarksScreen.tsx needed the same state from a sibling screen: this
   *  component's own local `useState` never survived HomeScreen unmounting
   *  (every screen switch in App.tsx), which a real Bookmarks page would
   *  make an obvious, immediate bug rather than a latent one. */
  savedIds: Set<string>
  onToggleSave: (id: string) => void
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

/** Classic rubber-band curve (UIScrollView-style overscroll): resistance
 *  rises smoothly as `offset` grows, asymptotically approaching `dimension`
 *  px of visual travel no matter how far the raw drag goes — a small drag
 *  moves almost freely, a large one is strongly damped, and there's a real
 *  soft cap instead of unbounded proportional movement. `coefficient` is
 *  the standard constant cited for this exact formula (WebKit/UIKit's own
 *  overscroll uses ~0.55); lower = more resistance, higher = looser. */
function rubberBand(offset: number, dimension: number, coefficient: number) {
  const sign = offset < 0 ? -1 : 1
  const distance = Math.abs(offset)
  return sign * ((distance * dimension * coefficient) / (dimension + coefficient * distance))
}

/** How far (px) the Start Over card can ever visually travel under
 *  resistance, no matter how far the raw drag goes — see rubberBand above.
 *  A size-derived cap, not a feel dial (same status as FLY_OFF_DISTANCE):
 *  CARD_WIDTH * 0.4 keeps the card's visible "give" comfortably inside its
 *  own footprint. */
const START_OVER_RUBBER_BAND_DIMENSION = CARD_WIDTH * 0.4

/** Every value below was a hardcoded guess before — now a single object,
 *  originally so they could come from a live-slider dev panel
 *  (`MotionTuner`, removed once the numbers settled — see git history if
 *  a similar tuning UI is ever needed again). Still a single object
 *  rather than folded back into plain constants: `TutorialStackCard`
 *  reads every field through `tuning.*` throughout, and the pending
 *  animation-audit plans (003, 004 — see `plans/README.md`) both operate
 *  on this exact shape. */
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
  /** Restart flip's spring duration (seconds) — see handleStartOverTap.
   *  Same "settled on by feel" status as flyOffDuration. */
  flipDuration: number
  /** Restart flip's spring bounce (0 = no overshoot) — same considerations
   *  as flyOffBounce. */
  flipBounce: number
  /** Tap-to-flip-a-tutorial-card spring duration (seconds) — see
   *  handleCardTap. Deliberately its own field, not a reuse of flipDuration:
   *  this is the shorter/snappier everyday "browse a card's details" flip,
   *  handleStartOverTap's is the rare once-a-cycle restart gesture (see
   *  handleCardTap's own comment for why they diverge). Also read by
   *  ProductsPreview's POP_BASE_DELAY_MS (code review finding: that value
   *  used to be a hand-computed literal linked to this only by a comment,
   *  not by code — a future retune here would silently desync it). */
  tapFlipDuration: number
  /** Tap-to-flip spring bounce (0 = no overshoot) — see tapFlipDuration. */
  tapFlipBounce: number
  /** Fraction of flyOffDuration the disappear-faster fade/shrink/z-dive
   *  actually takes (see flyOff's FLIGHT_FADE_DURATION) — smaller means the
   *  card visually vanishes sooner relative to how long the physical
   *  fly-off itself runs. */
  flightFadeFraction: number
  /** rubberBand's coefficient for the Start Over card's drag resistance
   *  (see the rubberBand helper's own comment) — lower means more
   *  resistance, higher means looser. 0.55 is the commonly-cited WebKit/
   *  UIKit constant for this exact formula; kept as a starting point. */
  startOverRubberBandCoefficient: number
}

export const DEFAULT_MOTION_TUNING: MotionTuning = {
  commitDistance: CARD_WIDTH * 0.35,
  commitVelocity: 1200, // settled on by feel
  flyOffDuration: 0.7, // settled on by feel
  flyOffBounce: 0.15, // settled on by feel
  cancelDuration: 0.4,
  rotationRange: 20,
  gripScale: 0.96, // settled on by feel (unchanged from the first guess)
  flipDuration: 0.7, // settled on by feel
  flipBounce: 0.15, // settled on by feel
  tapFlipDuration: 0.45, // settled on by feel
  tapFlipBounce: 0.15, // settled on by feel
  flightFadeFraction: 0.45, // settled on by feel
  startOverRubberBandCoefficient: 0.55,
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
  /** Fires on any tap-driven engagement with this card — handleDragStart,
   *  handleCardTap, handleStartOverTap — as well as the bookmark toggle
   *  (TutorialStack's own handleToggleSave calls it directly, since that
   *  handler lives up there, not on this component). TutorialStack's signal
   *  that the current front card has been touched, used to hold off the
   *  next repeat of the hint (see its own comment) until this card stops
   *  being front. Scope call: "any interaction with the *card stack*", not
   *  the filter chips in HomeScreen — narrower reading, per the user's own
   *  framing ("the flick should work only when I'm not interacting with the
   *  page at all") being specifically about tapping to flip. Not scoped to
   *  the front card specifically in the type (every card technically has it
   *  available) because only the interactive one can ever actually call
   *  it — `isInteractive` already gates whether `handleDragStart`/
   *  `handleCardTap`/`handleStartOverTap` run at all. */
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
  // Explicit `number[]` annotation on the destructured callback param —
  // framer-motion's array-form useTransform overload types its callback
  // as `(input: I[]) => O` (MultiTransformer, dist/index.d.ts), a plain
  // array, not a fixed-length tuple. Destructuring a bare `([a, d]) => …`
  // with no annotation left TS unable to infer `I` from the union input
  // type (MotionValue<string>[] | MotionValue<number>[] | ...), so both
  // `a`/`d` came back `unknown` — a real `tsc -b` build failure, not
  // visible under `tsc --noEmit` alone the same way. `number[]` (not
  // `[number, number]` — a tuple is a *different*, incompatible type from
  // what `I[]` actually resolves to, confirmed the hard way: annotating
  // it as a tuple satisfies this call site but breaks the overload
  // resolution for every other array-form useTransform call in this file,
  // cascading into ~17 new errors elsewhere). Every array-form
  // useTransform call below needed this same `number[]` annotation, not
  // just this one.
  const liveIndexForOthers = useTransform([activeIndex, dragProgress], ([a, d]: number[]) => a + d)
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
  // Shared by two different flips now — Start Over's one-shot reveal (see
  // handleStartOverTap) and a tutorial card's own bidirectional front↔detail
  // flip (see isFlipped/handleCardTap below) — never both on the same card
  // instance, since a card is exactly one variant.kind or the other.
  // Neither flip needs to force opacity/rotation/z-index overrides on top
  // of the ordinary pose math the way an earlier version of the Start Over
  // flip did: both keep this card `isFrontCard` (see below) for the flip's
  // entire duration (Start Over's logical stack-advance only happens once
  // its flip settles; a tutorial card's flip never touches activeCardIndex
  // at all), so every other value this card already computes (rest
  // rotation 0, opacity 1, zIndex 1000) is already correct with zero
  // special-casing either way.
  const flipRotateY = useMotionValue(0)
  // Explicit opacity crossfade tied to flipRotateY, layered on top of (not
  // instead of) `backfaceVisibility: 'hidden'` on both faces below. Reason:
  // a real WebKit bug (found on a real phone, not reproducible in this
  // environment's own browser tool) where backface culling isn't reliably
  // honored *while* the rotateY transform is actively animating, only once
  // it settles — for a frame near the crossover, CardFront's own back side
  // (nothing authored for it, so the browser mirrors CardFront's own
  // content) can bleed through before CardBack visibly takes over. Fading
  // each face to 0 over a window straddling the 90°-crossover (where
  // "looking at the back" starts) means that whatever the browser is doing
  // with culling right at that moment, both faces are already close to
  // invisible — the glitch stops being visible regardless of whether the
  // underlying browser timing bug is actually fixed. 75–105 (a 30° window,
  // not a hair-trigger one) rather than something tighter around exactly
  // 90: gives enough real time (~40ms of a ~0.45s flip) to reliably cover
  // a dropped frame, while still reading as a snappy flip, not a slow
  // dissolve — and if a bounce spring lingers near 90° for a moment, this
  // window is wide enough to still be fully faded through that too.
  const cardFrontFlipOpacity = useTransform(flipRotateY, [0, 75, 105, 180], [1, 1, 0, 0])
  const cardBackFlipOpacity = useTransform(flipRotateY, [0, 75, 105, 180], [0, 0, 1, 1])
  // Ghost-click guard. CardFront's/CardBack's own tap-to-flip (handleCardTap,
  // via onSelect/onFlipBack below) and Start Over's tap-to-flip
  // (handleStartOverTap) are both plain native `onClick` handlers on nested
  // DOM elements, not Framer's own drag-aware gesture system — Framer only
  // suppresses *its own* internal tap gesture when a drag on the *same*
  // element wins, it does nothing about the browser's ordinary click
  // synthesis on a *different*, nested element. On a real touchscreen (this
  // card already sets touch-action: none via `drag`, so the browser never
  // treats the gesture as a scroll/pan to begin with, which is normally
  // what suppresses a trailing synthetic click), a real committed swipe can
  // still spawn a genuine click on whatever's under the finger at release —
  // here, CardBack's whole-card tappable root — *at the same moment* the
  // card is flying away, which is exactly what un-flipped a departing
  // flipped card back to front mid-fade. Fixed by tracking "did a real drag
  // just happen" (handleDragStart only fires past Framer's own movement
  // threshold, so a genuine tap never touches this) and having
  // handleCardTap/handleStartOverTap swallow the very next call while it's
  // true — see handleDragEnd for where it resets.
  const justDraggedRef = useRef(false)
  // Bidirectional flip state for a tutorial card specifically (see
  // handleCardTap) — Start Over doesn't need an equivalent; its own flip
  // only ever goes one direction, once, and never needs to remember "am I
  // currently showing the back." Reset to false the instant this card
  // stops being front (whether by being swiped away or the deck otherwise
  // moving on) — see the effect below — so a card that was left flipped
  // always starts fresh (front-facing) the *next* time it comes back
  // around, per the user's own call ("moves to another card unflipped").
  const [isFlipped, setIsFlipped] = useState(false)
  useEffect(() => {
    if (isFrontCard || !isFlipped) return
    setIsFlipped(false)
    // duration: 0, not animated — this card is either already off-screen
    // (mid fly-off) or about to be occluded by whatever's now front, same
    // "reset once safely masked" pattern as dragX/dragY/flightOpacity
    // elsewhere in this file.
    animateValue(flipRotateY, 0, { duration: 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed on isFrontCard alone: isFlipped/flipRotateY are read/written here, not reacted to — listing isFlipped would re-run this same reset on every flip toggle, not just on becoming/stopping-being front.
  }, [isFrontCard])
  // Peek reveal: locked in on the flat CardBehind placeholder (yellow)
  // that fades to the real card as it nears the front — the two
  // alternatives explored (a dark "mask" scrim over the real content, and
  // no treatment at all) are gone from the code now that this one's
  // settled, not just hidden behind a flag. Both still multiply by the
  // outer `opacity` so a departing card's fade-out applies (contentOpacity
  // is always 1 there, so ghostOpacity comes out to 0 — no ghost on exit,
  // only on approach; see contentOpacity's own comment in useCardMotion).
  const ghostOpacity = useTransform([opacity, contentOpacity], ([slot, content]: number[]) => slot * (1 - content))
  const contentFinalOpacity = useTransform([opacity, contentOpacity], ([slot, content]: number[]) => slot * content)
  // CardFront's actual rendered opacity — contentFinalOpacity (peek-reveal/
  // departure fade, unrelated to flipping) composed with cardFrontFlipOpacity
  // (the anti-flicker crossfade, see flipRotateY's own comment). Same
  // "always one continuous composed value" approach this file uses
  // everywhere else rather than picking between two competing opacities.
  const cardFrontOpacity = useTransform(
    [contentFinalOpacity, cardFrontFlipOpacity],
    ([content, flip]: number[]) => content * flip,
  )
  // CardBack's own equivalent — same reasoning as cardFrontOpacity just
  // above, composed with cardBackFlipOpacity instead. Without
  // contentFinalOpacity factored in here too, CardBack's visibility during
  // a fly-off rested entirely on the fly-off's own quick flightOpacity fade
  // (~0.3s) and the flip crossfade (pinned at 1 the whole time, since a
  // departing flipped card no longer un-flips mid-flight) — with nothing
  // backing it up once flightOpacity gets reset to its neutral "at rest"
  // value partway through onAdvance (a deliberate, existing reuse-for-next-
  // cycle pattern, see flyOff's flightFade.then() comment). CardFront never
  // showed that pop because contentFinalOpacity was *independently* still
  // fading it out over the full, longer stack-advance (~0.7s) at that exact
  // moment — CardBack had no equivalent backstop, so the reset read as an
  // abrupt cut instead of the same graceful fade CardFront gets.
  const cardBackOpacity = useTransform(
    [contentFinalOpacity, cardBackFlipOpacity],
    ([content, flip]: number[]) => content * flip,
  )
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
  const totalRotate = useTransform([restRotateDeg, dragRotate], ([rest, drag]: number[]) => rest + drag)
  // gripScale (picked-up feedback) and flightScale (fly-off shrink) are
  // both legitimate, independent reasons this card's own scale might not
  // be 1 — composed the same "always one continuous value" way as
  // totalRotate above, not two competing scale bindings.
  const totalScale = useTransform([gripScale, flightScale], ([grip, flight]: number[]) => grip * flight)
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
    // See justDraggedRef's own doc comment (near its declaration) — this
    // only fires once Framer has actually recognized a drag (past its own
    // small internal movement threshold), never for a plain tap, which is
    // exactly what makes it safe to gate ghost-click suppression on.
    justDraggedRef.current = true
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
      // Resistance, not a real drag: a rubber-band curve (rubberBand, see
      // its own comment) so it visibly gives more easily on a short pull
      // and resists harder the further it's dragged, asymptotically
      // capped, instead of tracking 1:1 — and dragProgress deliberately
      // never gets touched here. This card can never commit (handleDragEnd
      // below always cancels it), so there's no genuine "progress toward
      // advancing" for the peek behind it to preview; leaving dragProgress
      // alone keeps that peek completely still through the whole resisting
      // gesture.
      dragX.set(rubberBand(info.offset.x, START_OVER_RUBBER_BAND_DIMENSION, tuning.startOverRubberBandCoefficient))
      dragY.set(rubberBand(info.offset.y, START_OVER_RUBBER_BAND_DIMENSION, tuning.startOverRubberBandCoefficient))
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
    // Deliberately does NOT touch isFlipped/flipRotateY here — a card
    // swiped away while flipped keeps showing its detail face for the
    // whole fly-off, un-flipping only once it's safely off-screen (the
    // isFrontCard-driven reset near isFlipped's declaration, which fires
    // after onAdvance). An earlier version forced an instant un-flip to
    // front right here, on the theory that the departing card should show
    // its "normal" face — reverted per the user's own live-testing call
    // (on a real phone, seeing it snap to front read as wrong, not seeing
    // the detail face read as expected instead).
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
    const FLIGHT_FADE_DURATION = tuning.flyOffDuration * tuning.flightFadeFraction
    // EASE_OUT_QUART — this file's own --ease-out-quart token (tokens.css)
    // in its numeric (JS array) form, same curve already used for the
    // card's press-feedback transition below. Was 'easeIn', which starts
    // slow and accelerates at the *end* — for a fade-to-0 that meant the
    // card stayed near-fully-visible for most of this window and only
    // actually vanished right at the end, undermining the "sells gone
    // quickly" intent above. A strong ease-out front-loads the drop instead.
    const flightFade = animateValue(flightOpacity, 0, { duration: FLIGHT_FADE_DURATION, ease: EASE_OUT_QUART })
    animateValue(flightScale, 0.55, { duration: FLIGHT_FADE_DURATION, ease: EASE_OUT_QUART })
    animateValue(flightZDrop, 1, { duration: FLIGHT_FADE_DURATION, ease: EASE_OUT_QUART })
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
    // See justDraggedRef's own doc comment — a real drag that just settled
    // back to center can still spawn a ghost click here at release; swallow
    // it rather than letting it trigger a real flip.
    if (justDraggedRef.current) return
    onCommitStart()
    // Tap-driven engagement with the stack — same as handleDragStart, see
    // onInteraction's own doc comment: holds off the next swipe-hint repeat.
    onInteraction()
    const flip = animateValue(flipRotateY, 180, { type: 'spring', bounce: tuning.flipBounce, duration: tuning.flipDuration })
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

  // Tapping (or Enter/Space on) a tutorial card — flips it in place to
  // reveal level/duration/products + the real "Start Tutorial" CTA on its
  // back face (see TutorialDetailCard), toggling back to front on a
  // second tap anywhere except the CTA itself. Unlike handleStartOverTap,
  // this never touches onCommitStart/onAdvance at all — no stack state
  // changes here, ever; it's purely local to this card, which is also why
  // there's no isLocked window to worry about (isInteractive already
  // gates whether this can even be called, see the JSX below). Shorter/
  // snappier than the Start Over flip's 0.7s: that one is a rare,
  // once-a-cycle reveal, this is a card-browsing interaction someone might
  // trigger repeatedly while comparing tutorials, so it stays on the
  // quicker end of this file's spring durations rather than matching the
  // rare one's leisurely pace.
  function handleCardTap() {
    // See justDraggedRef's own doc comment — the actual bug this guards
    // against: a real committed (or cancelled) swipe can spawn a ghost
    // click on this card's own root right at release, which — without this
    // — un-flips (or flips) the card via the exact same handler at the
    // exact moment it's flying away or settling back.
    if (justDraggedRef.current) return
    // Tap-driven engagement with the stack — see onInteraction's own doc
    // comment. This was the actual gap: the swipe-hint used to only listen
    // for handleDragStart, so flipping a card to browse its details didn't
    // count as "found it" and the nudge could still fire mid-browse.
    onInteraction()
    animateValue(flipRotateY, isFlipped ? 0 : 180, { type: 'spring', bounce: tuning.tapFlipBounce, duration: tuning.tapFlipDuration })
    setIsFlipped(!isFlipped)
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
    // See justDraggedRef's own doc comment. Deliberately NOT reset
    // synchronously here — a browser's native "click" (the ghost click this
    // whole guard exists for) dispatches synchronously right after this
    // handler returns, still within the same task, so resetting the flag
    // now would clear it before that click ever gets a chance to check it.
    // setTimeout(0) defers the reset to the *next* task, after the ghost
    // click (if there is one) has already been swallowed by
    // handleCardTap/handleStartOverTap — same "let the synchronous
    // consequence happen first, tidy up after" pattern, just via a real
    // event-loop tick instead of a Promise, since there's no animation to
    // await here. Applies uniformly to every branch below (committed,
    // cancelled, and the start-over early return), so it's done once here
    // rather than duplicated in each.
    setTimeout(() => {
      justDraggedRef.current = false
    }, 0)
    animateValue(gripScale, 1, { duration: 0.15 })
    if (variant.kind === 'start-over') {
      // Never commits, regardless of distance/velocity — this card only
      // ever advances via handleStartOverTap above. Always the same
      // settle-back-to-center a cancelled tutorial-card drag uses; the
      // velocity handed to it goes through the same rubber-band curve as
      // handleDrag's resistance; feeding in the raw, undamped velocity
      // would make it visually "spring past" where it actually was.
      animateValue(dragX, 0, {
        type: 'spring',
        velocity: rubberBand(info.velocity.x, START_OVER_RUBBER_BAND_DIMENSION, tuning.startOverRubberBandCoefficient),
        bounce: 0,
        duration: tuning.cancelDuration,
      })
      animateValue(dragY, 0, {
        type: 'spring',
        velocity: rubberBand(info.velocity.y, START_OVER_RUBBER_BAND_DIMENSION, tuning.startOverRubberBandCoefficient),
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
      // card that never rotates on Y. WebkitTransformStyle + willChange:
      // fixes a real flicker reported on a phone — Safari can fail to
      // GPU-promote a `preserve-3d` element *before* its rotateY animation
      // starts, and ends up compositing the flip mid-flight instead, which
      // reads as a one-frame flash of the wrong face right near the end.
      // will-change: transform forces the layer to exist up front; this
      // element already animates transform constantly (drag alone), so
      // there's no added cost from making that promotion permanent instead
      // of on-demand.
      style={{
        transform,
        zIndex: zIndexFinal,
        opacity: flightOpacity,
        transformStyle: 'preserve-3d',
        WebkitTransformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
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
          flipRotateY approaches 180 — which happens for the Start Over
          card during its own flip, and for a tutorial card once tapped
          (see handleCardTap). onSelect is no longer what a tutorial
          card's own tap does — see handleCardTap's own comment for why
          that moved to the CTA on its back face below. */}
      <motion.div
        className="absolute inset-0"
        style={{
          opacity: cardFrontOpacity,
          backfaceVisibility: 'hidden',
          // See the parent's own WebkitTransformStyle/willChange comment —
          // same Safari flicker, other half of the fix: the *unprefixed*
          // backfaceVisibility alone isn't reliably honored mid-animation
          // on every WebKit build tested, only once settled. cardFrontOpacity
          // (see its own comment) is the actual fix, this is defense in depth.
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        {variant.kind === 'tutorial' ? (
          <TutorialLookCard
            tutorial={variant.tutorial}
            onSelect={handleCardTap}
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
          — statically pre-rotated 180°, backface-hidden). Two different
          reasons a card might have one now:
          - Start Over: a plain, non-interactive rendering of the first
            tutorial, sitting on the reverse side of the *same* card the
            "Start Over" content is printed on, not a separate card flying
            in from somewhere else. disabled + no onSelect/onToggleSave:
            decorative until the real, interactive card 0 instance (a
            completely separate TutorialStackCard, already sitting in its
            normal front pose underneath) takes over the instant
            handleStartOverTap's flip settles — see its own comment for
            why that handoff is invisible.
          - A tutorial card: the real detail view (TutorialDetailCard) —
            level/duration/products + the CTA that now actually opens the
            tutorial. Fully interactive whenever this card is (gated the
            same `!isInteractive` way as the front face), unlike Start
            Over's back face, since there's no handoff-to-a-different-card
            happening here — this *is* the same card, just showing its
            other side.
          Either way, hidden (backface-culled) at flipRotateY===0 for
          exactly the same reason the content layer above is visible
          there; the two swap places as the parent crosses 90°.
          cardBackOpacity mirrors cardFrontOpacity's own composition (see
          its own comment) — same anti-flicker crossfade *and* the same
          distance-based departure backstop, so this needs to be a
          motion.div now, not a plain div, to take a MotionValue as its
          opacity. */}
      {variant.kind === 'start-over' && (
        <motion.div
          className="absolute inset-0"
          style={{
            transform: 'rotateY(180deg)',
            opacity: cardBackOpacity,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          <TutorialLookCard tutorial={variant.firstTutorial} disabled saved={variant.firstTutorialSaved} />
        </motion.div>
      )}
      {variant.kind === 'tutorial' && (
        <motion.div
          className="absolute inset-0"
          style={{
            transform: 'rotateY(180deg)',
            opacity: cardBackOpacity,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          <TutorialDetailCard
            tutorial={variant.tutorial}
            onFlipBack={isInteractive ? handleCardTap : undefined}
            onStart={isInteractive ? onSelect : undefined}
            disabled={!isInteractive}
            justRevealed={isFlipped}
          />
        </motion.div>
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

// Module-level, not component state — deliberately survives a
// TutorialStack unmount/remount (App.tsx swaps HomeScreen out entirely
// while TutorialFlow is showing, so a fresh TutorialStack instance mounts
// every time you return to Home), only resetting on an actual page
// reload. That's what makes the entrance below genuinely "first load of
// the session," not "every time you come back from a tutorial" — a
// useRef inside the component wouldn't survive the remount, this has to
// live outside it.
let hasPlayedStackEntrance = false

export function TutorialStack({ tutorials, onSelect, lookType, savedIds, onToggleSave }: TutorialStackProps) {
  const reduceMotion = useReducedMotion()
  // Lazy initializer runs exactly once per mount, reading *and* flipping
  // the module flag together — the next TutorialStack instance (a return
  // from TutorialFlow) sees it already true and skips the entrance.
  const [playEntrance] = useState(() => {
    if (hasPlayedStackEntrance) return false
    hasPlayedStackEntrance = true
    return true
  })
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
  // Plain constant, not useState — nothing calls a setter to change this
  // live any more now that MotionTuner's gone (see MotionTuning's own
  // comment), so state with no writer was just indirection. 003/004
  // (plans/README.md) still fold more values into `MotionTuning`/
  // `DEFAULT_MOTION_TUNING` itself, unaffected by this being a plain
  // reference instead of a state value.
  const tuning = DEFAULT_MOTION_TUNING
  // handleInteraction() first, then the real (now lifted, see
  // TutorialStackProps' own comment) toggle — a thin local wrapper so every
  // call site below keeps calling one `handleToggleSave(id)`, same as
  // before this state moved to App.tsx, rather than needing its own
  // "mark interacted, then toggle" pair inline at each of the (several)
  // call sites.
  function handleToggleSave(id: string) {
    // Tap-driven engagement with the stack — see TutorialStackCard's
    // onInteraction prop doc comment. Called directly (not via a card's own
    // onInteraction prop) since this handler lives up here, not on
    // TutorialStackCard itself.
    handleInteraction()
    onToggleSave(id)
  }

  // Reduced-motion equivalent of the normal-motion flip's `isFlipped` —
  // see this file's `handleCardTap`/`TutorialDetailCard` for the
  // non-reduced-motion version of the same idea. A Set (not a single id)
  // because this is a plain scrollable list, not a one-card-at-a-time
  // stack — more than one card can legitimately be expanded at once here,
  // unlike the stack's single front card.
  const [flippedIds, setFlippedIds] = useState<Set<string>>(() => new Set())

  function handleToggleFlip(id: string) {
    handleInteraction()
    setFlippedIds((prev) => toggleInSet(prev, id))
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
      // Reduced motion keeps a plain opacity fade on first load rather
      // than skipping the entrance outright — comprehension-neutral (it
      // doesn't move anything, just appears a beat softer than an instant
      // pop), which is what "fewer and gentler, not zero" means in
      // practice, not literally no transition anywhere.
      <motion.div
        className="mx-auto flex w-[338px] flex-col gap-4"
        initial={playEntrance ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: EASE_OUT_QUART }}
      >
        {tutorials.map((tutorial) =>
          flippedIds.has(tutorial.id) ? (
            // Same detail content a motion user reaches by flipping the
            // card (level, product preview, the actual "Start Tutorial"
            // CTA) — reduced motion drops the flip *animation*, not this
            // content. Swapped in instantly (no transition/animation
            // added here), matching "fewer and gentler, not zero": the
            // gentleness is in *not* adding new motion, not in hiding
            // content a sighted/motion user would otherwise get.
            <TutorialDetailCard
              key={tutorial.id}
              tutorial={tutorial}
              onFlipBack={() => handleToggleFlip(tutorial.id)}
              onStart={onSelect}
            />
          ) : (
            <TutorialLookCard
              key={tutorial.id}
              tutorial={tutorial}
              onSelect={() => handleToggleFlip(tutorial.id)}
              saved={savedIds.has(tutorial.id)}
              onToggleSave={() => handleToggleSave(tutorial.id)}
            />
          ),
        )}
      </motion.div>
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
    //
    // First-load entrance (playEntrance): the whole stack settles in as
    // one unit — fade + rise + a gentle scale-up, not scale(0) (nothing in
    // the real world appears from nothing) — rather than choreographing
    // the front/peek cards separately, which would over-produce a moment
    // that should read as light, not showy (this plays every session, not
    // once-ever, so it stays in the "occasional" tier, not "delight").
    // initial={false} when playEntrance is false skips the animation
    // entirely — the stack renders straight at its settled values, no
    // wasted transition on a screen the user's already seen this session.
    // Full `transform` string (not the x/y/scale shorthands), matching
    // this file's own established GPU-only-properties discipline
    // elsewhere. duration/ease reuse --duration-layout (350ms) and
    // --ease-out-quart's numeric form — this file's own existing tokens
    // for "larger layout/content change," not new ones invented for this.
    <motion.div
      className="relative mx-auto"
      style={{ width: CARD_WIDTH, height: CARD_HEIGHT, perspective: 1000 }}
      initial={playEntrance ? { opacity: 0, transform: 'translateY(16px) scale(0.96)' } : false}
      animate={{ opacity: 1, transform: 'translateY(0px) scale(1)' }}
      transition={{ duration: 0.35, ease: EASE_OUT_QUART }}
    >
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
    </motion.div>
  )
}
