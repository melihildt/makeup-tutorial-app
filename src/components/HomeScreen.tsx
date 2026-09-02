import { useState } from 'react'
import { TUTORIALS, TutorialStack } from './TutorialCard'
import { InfoOverlay } from './InfoOverlay'
import { HEADER_CHIP_STYLE } from './ScreenHeader'
import { DiamondIcon, InfoIcon, MoonIcon, SunIcon, UserIcon } from './icons'
import dayTexture from '../assets/filter-chips/day-texture.jpg'
import nightTexture from '../assets/filter-chips/night-texture.jpg'
import glamTexture from '../assets/filter-chips/glam-texture.jpg'

// Exported: TutorialCard.tsx's ghost card (CardBehind/StartOverCard) reads
// this same type — the selected filter now drives the ghost card's own
// background color, not just this file's chip styling, so both sides need
// to agree on the exact same set of values rather than each defining their
// own near-duplicate union.
export type LookType = 'day' | 'night' | 'glam'

type HomeScreenProps = {
  /** Called when the (only, for now) look card is tapped — hands off to the tutorial flow. */
  onSelectLook?: () => void
  /** Called when the user icon is tapped — opens AccountScreen. */
  onOpenAccount?: () => void
  /** Bookmark toggle state — lifted to App.tsx (see its own comment) so
   *  BookmarksScreen, a sibling of this screen rather than a descendant,
   *  can read the same state. Threaded straight through to TutorialStack,
   *  which owns none of it locally any more. */
  savedTutorialIds: Set<string>
  onToggleSavedTutorial: (id: string) => void
  /** Whether the info icon's About/credits overlay (InfoOverlay.tsx) is
   *  open — lifted to App.tsx for the same reason `savedTutorialIds` is:
   *  it now doubles as this app's /about URL (see router.ts), and App.tsx's
   *  path-sync effect needs to read it without HomeScreen in between. */
  infoOpen: boolean
  onInfoOpenChange: (open: boolean) => void
}

// Sun/Moon/Diamond/Info/User icons moved to icons.tsx along with every
// other icon in the app — see that file's own module comment for the
// consolidation, and its Home-screen section specifically for these five
// icons' own V2/V4 revision history (why they're single inline SVGs, the
// 24px→20px size/opacity changes, InfoIcon/UserIcon being new in V4).

/** One Day/Night/Glam option: label, its own photo-texture + two-layer
 * mix-blend-mode tint (see LookSelectorChip below — a flat `overlayTint`/
 * `overlayBlend` layer, plus a `gradient` layer on top), and the icon —
 * both now shown only while the chip is selected. `glow` is a per-type
 * colored ambient shadow used only on the selected state — inferred from
 * the one sample the source design shows selected (Day: a gold-tinted
 * glow matching its own gold overlay tint); Night/Glam follow the same
 * pattern with their own tint color rather than reusing Day's gold glow
 * verbatim.
 *
 * Verify pass (2026-09-01, Home redesign, node 644:2630 — the LookSelector
 * component's own 6 named variants, Type={Day,Night,Glam} x
 * Selected?={Selected,Unselected}): a fresh pull of all six states at once
 * (rather than inferring Night/Glam from Day's one sample) surfaced real
 * per-type differences this file's single `tint`/`blend` pair couldn't
 * express:
 * - The resting/unselected chip no longer shows any texture or icon at
 *   all — a plain translucent chip (see LookSelectorChip below) — so
 *   `overlayTint`/`overlayBlend`/`gradient`/icon only ever render for the
 *   selected chip now.
 * - Two stacked tint layers when selected, not one: a flat `overlayTint`
 *   (`overlayBlend`), then a `gradient` layer on top of that. Day/Glam's
 *   flat layer blends via `overlay`; Night's via `soft-light`. Night's
 *   flat color also changed (#688db6 → #81b6f0) — this file's `tint`
 *   field is kept only for the *flash sweep*'s own blend target below,
 *   not the resting-layer color, so it's intentionally NOT the same value
 *   as `overlayTint` for Night.
 * - `overlayBlend` and `blend` (the flash sweep's own blend mode) can
 *   differ per type on purpose: Glam's fresh-pulled flat layer blends via
 *   `overlay`, but the flash sweep stays on `soft-light` — the one the
 *   user already confirmed separately (see `flash`'s own comment below) —
 *   so these are two independent fields, not one shared value.
 * - `borderSelected`/`deepTint` (new): the selected chip's border and
 *   label/icon color are each their own fresh-pulled value, not derived
 *   from `tint` by a shared formula — Day's border is its own tint at 50%
 *   opacity, but Night's is the shared ink color at 50% (the same value
 *   this app's old, since-removed --color-filter-chip-border-selected
 *   token had) and Glam's is a third, distinct muted-sage rgba — so each
 *   is its own literal per-type value rather than computed.
 *
 * `flash` is the press-flash sweep (see chip-flash-sweep, index.css) — just
 * `peak` now, the one color that actually moves. The gradient's own two
 * outer stops are hardcoded `transparent` in LookSelectorChip below, not a
 * per-type "edge" color: an earlier version used this type's own flat
 * `tint` there, blended via the same mix-blend-mode as the chip's resting
 * tint layer — which sounds like it should cancel out to "no visible
 * change," but stacking the same soft-light tint twice compounds it
 * instead of it being a no-op, so the sides read as visibly brighter than
 * true rest (user-reported color seam). `transparent` sides mean there's
 * nothing there to blend at all — only the peak paints anything, fading to
 * genuinely nothing on both sides via alpha, not via a color-matching
 * trick that turned out not to match. Glam only for now, per the user's
 * exact peak color; undefined here means LookSelectorChip just doesn't
 * render the sweep at all, so Day/Night are unaffected until they get
 * their own real value — now all three do. */
// Exported (Storybook) alongside LookSelectorChip below — both were
// module-private (only this file's own filter row used them), but the
// per-type texture/tint/blend/glow/flash shape is exactly what a design-
// system story needs to show all three chips side by side.
export const LOOK_TYPES: Array<{
  id: LookType
  label: string
  texture: string
  /** The flash sweep's own blend target (chip-flash-sweep, index.css) —
   *  not necessarily the same value as `overlayBlend` below, see this
   *  const's own module comment (Glam in particular). */
  tint: string
  blend: 'overlay' | 'soft-light'
  /** Selected chip's flat tint layer. */
  overlayTint: string
  overlayBlend: 'overlay' | 'soft-light'
  /** Selected chip's second tint layer, on top of overlayTint/overlayBlend. */
  gradient: { from: string; to: string; blend: 'soft-light' | 'color-burn' }
  glow: string
  /** Selected chip's own border color — its own literal per-type value,
   *  not `tint`/`overlayTint` at a shared alpha (see this const's own
   *  module comment). */
  borderSelected: string
  /** Selected chip's label + icon color. */
  deepTint: string
  flash?: { peak: string }
  /** Takes `color` now (V5, icons.tsx) — each type's own `deepTint`, not a
   *  shared ink color any more, see LOOK_TYPES' and icons.tsx's own
   *  comments. */
  Icon: (props: { color: string }) => React.JSX.Element
}> = [
  {
    id: 'day',
    label: 'Day',
    texture: dayTexture,
    tint: '#e3b345',
    blend: 'overlay',
    overlayTint: '#e3b345',
    overlayBlend: 'overlay',
    gradient: { from: '#d4cd6c', to: '#ff6969', blend: 'soft-light' },
    glow: 'rgba(227, 179, 69, 0.2)',
    borderSelected: 'rgba(227, 179, 69, 0.5)',
    deepTint: '#5a260b',
    flash: { peak: '#ffb200' },
    Icon: SunIcon,
  },
  {
    id: 'night',
    label: 'Night',
    texture: nightTexture,
    tint: '#688db6',
    blend: 'soft-light',
    overlayTint: '#81b6f0',
    overlayBlend: 'soft-light',
    gradient: { from: 'rgba(136, 39, 255, 0.15)', to: 'rgba(32, 120, 167, 0.15)', blend: 'color-burn' },
    glow: 'rgba(104, 141, 182, 0.2)',
    // Figma re-pull (node 644:2624, 2026-09-01): border-[rgba(32,120,167,0.3)]
    // — no longer matches the shared ink-based value the other two types
    // don't use either (see this field's own doc comment above).
    borderSelected: 'rgba(32, 120, 167, 0.3)',
    deepTint: '#0c2560',
    flash: { peak: '#0079ff' },
    Icon: MoonIcon,
  },
  {
    id: 'glam',
    label: 'Glam',
    texture: glamTexture,
    tint: '#beef9e',
    blend: 'soft-light',
    overlayTint: '#beef9e',
    overlayBlend: 'overlay',
    gradient: { from: '#fff133', to: '#3c7c13', blend: 'soft-light' },
    glow: 'rgba(190, 239, 158, 0.2)',
    borderSelected: 'rgba(134, 167, 132, 0.5)',
    deepTint: '#113c0e',
    flash: { peak: '#99ff58' },
    Icon: DiamondIcon,
  },
]

export function LookSelectorChip({
  type,
  selected,
  onClick,
}: {
  type: (typeof LOOK_TYPES)[number]
  selected: boolean
  onClick: () => void
}) {
  const { label, texture, blend, overlayTint, overlayBlend, gradient, glow, borderSelected, deepTint, flash, Icon } = type
  // Counts presses, not just "is flashing" — needs a value that's
  // different every time so `key={flashCount}` (below) actually forces a
  // remount on every press, not just the first. Starts at 0 and the
  // overlay isn't rendered at all until it's > 0, so nothing plays on
  // initial mount — only on an actual press, per the ask.
  const [flashCount, setFlashCount] = useState(0)
  return (
    <button
      type="button"
      onClick={() => {
        onClick()
        if (flash) setFlashCount((c) => c + 1)
      }}
      // active:scale + the border-color/box-shadow transition are both new
      // (motion audit, Home screen only): selecting a chip used to teleport
      // — border, glow, and the icon all snapped instantly, and the button
      // had no press feedback at all. duration-instant/ease-out-quart below
      // are the app's own tokens, not new ones — same pair CheckIndicator.tsx
      // and ScreenHeader.tsx already use for state-swap feedback.
      //
      // select-none: a press/hold on this chip was landing on mobile as a
      // text-selection callout on the label instead of registering as a
      // tap — this is a press-driven control, not selectable text.
      //
      // Verify pass (2026-09-01, Home redesign, node 644:2630): border and
      // shadow both moved off the old shared ink-based tokens onto
      // per-type/state values — see LOOK_TYPES' own module comment for why
      // `borderSelected` is a literal per-type value rather than a shared
      // formula. Unselected shadow reuses --shadow-card-elevated directly
      // (confirmed exact match via its own named Figma variable,
      // "BeautyNotes/Shadow_2" — the same elevated-sheet shadow every
      // other container in the app already cites), not --shadow-filter-chip
      // (deprecated — see its own tokens.css comment). Selected shadow's
      // ambient component is its own fresh-pulled value (16px blur), also
      // distinct from the old --shadow-filter-chip's 8px.
      className="relative flex h-[46px] flex-1 select-none items-center justify-between overflow-hidden rounded-[--radius-filter-chip] border border-solid p-3 active:scale-[0.97]"
      style={{
        borderColor: selected ? borderSelected : 'var(--color-filter-chip-border)',
        boxShadow: selected ? `0px 0px 4px ${glow}, 0px 0px 16px 0px rgba(14, 11, 6, 0.03)` : 'var(--shadow-card-elevated)',
        transition:
          'border-color var(--duration-instant) var(--ease-out-quart), box-shadow var(--duration-instant) var(--ease-out-quart), transform var(--duration-instant) var(--ease-out-quart)',
      }}
    >
      {/* Photo-texture background + two-layer colored tint — same shared
          woven texture asset per option (see src/assets/filter-chips), a
          flat `overlayTint`/`overlayBlend` layer, then a `gradient` layer
          on top (see LOOK_TYPES' own comment for why this is two layers
          now, and why they're not simply `tint`/`blend` under new names).
          Verify pass (2026-09-01, Home redesign, node 644:2630): only
          rendered for the *selected* chip now — a fresh pull of all six
          Type×Selected states shows the resting/unselected chip as a
          plain translucent card with no texture or tint at all, not this
          layer at a dimmed opacity. */}
      {selected && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-white" />
          <img alt="" src={texture} className="absolute inset-0 size-full object-cover object-bottom" />
          <div className="absolute inset-0" style={{ background: overlayTint, mixBlendMode: overlayBlend }} />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to left, ${gradient.from}, ${gradient.to})`,
              mixBlendMode: gradient.blend,
            }}
          />
        </div>
      )}
      {/* Press-flash sweep — see chip-flash-sweep's own comment (index.css)
          for the exact background-position direction/opacity reasoning.
          key={flashCount} forces a fresh mount on every press so the CSS
          `animation` reliably replays (same pattern as CheckIndicator's
          check-pop) — a re-render alone wouldn't restart it. Resting
          opacity: 0 is set here on the element itself, not left to the
          animation's own fill behavior, so it's invisible both before the
          first press and after each flash finishes.

          `transparent` on both sides, not this type's own `tint` — see
          LOOK_TYPES' own comment above for why a flat matching color
          turned out not to actually match (stacking the same soft-light
          tint twice compounds it instead of cancelling out; user-reported
          color seam). Only `peak` paints anything now, so it's the only
          thing mix-blend-mode is doing any work on — still soft-light
          (user confirmed the blend character itself, separately from this
          fix, was fine), just no longer also asked to make a second flat
          layer disappear into the first.

          Stops at 35%/50%/65% (user's own reference gradient,
          ~35.15/50.11/65.08 — close enough to round): compressing the
          transition into a ~30-point window is what makes this a narrow
          band instead of a slow wash across the whole sweep.

          background-size: 300%, not 200% — this is what actually gives
          the flash a fade-in/fade-out *transition*, without any separate
          opacity keyframe. At 200%, the math works out so the peak is
          already at the chip's edge, at full brightness, in the very
          first/last frame — nothing eases it in, it just pops fully
          formed at the boundary and pops back out (user feedback: wanted
          an actual transition, not that instant appear/disappear). At
          300%, the transparent-to-peak-to-transparent band is narrow
          enough relative to the extra travel room that it's fully out of
          view at both t=0% and t=100% — so the *first* thing that enters
          the chip is the transparent leading edge of the ramp, not the
          peak itself, and it exits the same way. The fade is baked into
          the gradient's own alpha, arriving and leaving purely through
          motion — no second opacity animation competing with the sweep
          (that's the mistake the earlier 15%/85% opacity gate made,
          before it was removed for clipping the sweep's own edges — see
          chip-flash-sweep's own comment, index.css). Verified by walking
          through the actual overlap math (image-space window vs. the
          gradient's own 35–65% zone at each keyframe), not eyeballed.

          borderRadius here too, not just relying on the button's own
          overflow-hidden: a mix-blend-mode child clipped only by a
          parent's overflow+radius is a known cross-browser soft spot —
          the blend can rasterize a sliver past the intended rounding at
          the anti-aliased corner (user-reported: green visible past the
          chip's rounded corners). Giving this element its own explicit
          radius (plus its own overflow-hidden, redundant with the parent
          in the well-behaved case but the actual fix in the buggy one)
          is the standard fix for that specific bleed. */}
      {flash && flashCount > 0 && (
        <div
          key={flashCount}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-[--radius-filter-chip]"
        >
          <div
            className="absolute inset-y-0 left-0 h-full"
            style={{
              width: '300%',
              backgroundImage: `linear-gradient(90deg, transparent 35%, ${flash.peak} 50%, transparent 65%)`,
              mixBlendMode: blend,
              opacity: 0,
              animation: 'chip-flash-sweep var(--duration-shimmer) linear',
            }}
          />
        </div>
      )}
      {/* Verify pass (2026-09-01, Home redesign, node 644:2630): size moved
          14px→15px with -0.15px tracking added (was missing), and both are
          now shared by every state — the fresh pull shows this uniformly
          across all six Type×Selected variants, not split by state the
          way color/weight are. Color/weight do still split by state: flat
          --color-tutorial-card-text at font-weight-medium at rest, this
          type's own `deepTint` at font-weight-semibold once selected —
          confirmed on the one state the earlier Home-only pull could show
          (Day) and now on all three via this component's own six-variant
          pull. */}
      <span
        className="relative capitalize text-[15px] tracking-[-0.15px]"
        style={{
          color: selected ? deepTint : 'var(--color-tutorial-card-text)',
          fontWeight: selected ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)',
        }}
      >
        {label}
      </span>
      {selected && (
        // Reuses check-ring-in verbatim (index.css) rather than a new
        // near-duplicate keyframe — same "new element settling in after a
        // state swap" shape this icon needs, already on --duration-base/
        // --ease-out-quart.
        <span className="relative" style={{ animation: 'check-ring-in var(--duration-base) var(--ease-out-quart)' }}>
          <Icon color={deepTint} />
        </span>
      )}
    </button>
  )
}

/**
 * Home screen: title + icon-button row, the Day/Night/Glam filter row, and
 * the look card (tap → tutorial) — all one scrolling block now, no separate
 * bottom sheet. V4 (node 635:4792, "LookSelector" redesign): the filter row
 * moved up to sit directly under the header, replacing the old persistent
 * bottom sheet + close icon entirely (a real layout change, confirmed with
 * the user rather than assumed — the prior sheet was a deliberate product
 * decision, see git history). The Day/Night/Glam filters now actually
 * filter: `TUTORIALS` carries a `lookType` per entry (see that field's own
 * doc comment in TutorialCard.tsx for the current data set — 4 Day/3
 * Night/6 Glam as of the V3 real-photography pass, not an even four per
 * chip anymore), and `visibleTutorials` below narrows the full list down
 * to the selected chip's own cards before handing them to TutorialStack.
 * The chip selection still also toggles
 * which chip shows its icon (see LookSelectorChip above) and the tutorial
 * stack's own ghost card color (`selectedType` threaded down as `lookType`
 * — see TutorialStack's own prop and CardBehind/StartOverCard in
 * TutorialCard.tsx). TutorialStack is keyed on `selectedType` (below) so
 * switching chips mounts a fresh stack — front card back to index 0, no
 * stale drag/position state left over from the previous chip's deck —
 * rather than trying to reconcile the old stack's internal index against a
 * swapped-out `tutorials` array. The info icon opens InfoOverlay.tsx's
 * About/credits modal (Figma node 730:5706, see that file's own doc
 * comment); the user icon now opens AccountScreen.tsx (`onOpenAccount`,
 * an App.tsx `Screen`, not an in-place overlay like InfoOverlay — its own
 * design is a full opaque screen, not a blur-over-Home modal) rather than
 * being purely decorative.
 */
export function HomeScreen({
  onSelectLook,
  onOpenAccount,
  savedTutorialIds,
  onToggleSavedTutorial,
  infoOpen,
  onInfoOpenChange,
}: HomeScreenProps) {
  const [selectedType, setSelectedType] = useState<LookType>('day')
  // The filter's actual effect — see this component's own module comment.
  // Not memoized: TUTORIALS is a module-level constant (never changes
  // identity) and this only re-filters when selectedType itself changes,
  // which is already the one thing that triggers this component's own
  // re-render here — a useMemo would just be indirection over a filter
  // that's cheap over a dozen-item array.
  const visibleTutorials = TUTORIALS.filter((tutorial) => tutorial.lookType === selectedType)

  return (
    // md:py-6, not py-6: this inset only exists to keep the rounded-2xl
    // corners visible against the desktop page backdrop (App.tsx's
    // wrapper) — on mobile the frame fills the real viewport edge-to-edge,
    // and rounding is dropped there too (md:rounded-2xl, matching App.tsx's
    // own wrapper), so a real device shows a flush, square-cornered screen
    // instead of the backdrop color peeking through rounded corners. That
    // mattered concretely here: node 615:2884 (a real 375x812 device
    // frame with actual browser chrome) measured only ~640px of content
    // height, and the old unconditional py-6 was eating almost 8% of that
    // on top of the header/card/sheet spacing already tuned to fit it.
    <div
      className="relative mx-auto flex h-dvh w-full max-w-[402px] flex-col overflow-hidden md:h-full md:rounded-2xl md:py-6"
      style={{ background: 'var(--gradient-bg-home)' }}
    >
      {/* Header + filters + tutorial stack as one scrolling block — flex-1 +
          overflow-y-auto so a future longer card list scrolls here, same
          pattern StepScreen/AllStepsView use. Horizontal/top padding here
          is now px-[--space-sm] pt-[--space-2xs] (16px sides, 8px top) —
          the app-wide screen-edge margin guideline (tokens.css, Figma node
          738:8822), which supersedes the old px-3/pt-5 this was tuned to
          as a standalone mobile-only divergence from Figma's outer
          spacing. pb-2 (bottom) is unrelated to that guideline and stays
          as-is. gap-10 (40px) between the
          title/icons row and the filter row is the Figma frame's own
          internal content gap, not outer safe-area padding, so it's taken
          as-is.

          overflow-x-hidden alongside overflow-y-auto is load-bearing, not
          defensive: setting only overflow-y leaves overflow-x at its
          default `visible`, so this div was a real (if usually invisible,
          clipped further out by App.tsx's own overflow-hidden frame)
          horizontally-scrollable surface — and the tutorial card stack's
          fly-off animation deliberately throws the swiped card ~490px
          sideways past its resting footprint (FLY_OFF_DISTANCE,
          TutorialCard.tsx) so the throw reads as leaving the screen. A
          touch fling on that swipe could grab this div's own horizontal
          scroll and hand it to the page — which is exactly the "scroll
          comes back after swiping the first card" bug this fixes, in both
          Chrome and Safari, not the iOS-only rubber-band bounce the
          earlier html/body lock (index.css) was for. */}
      {/* inert while the About overlay is open (code review finding): this
          div sits *before* InfoOverlay in DOM order, so without it, Tab
          from the just-clicked info button lands on the very next
          focusable element in document order — the Account button right
          next to it — even though InfoOverlay (an `absolute inset-0`
          sibling, mounted last) visually covers the whole screen at that
          point. Activating it (goToAccount) left `aboutOpen` untouched
          (nothing resets it on navigation), so returning to Home from
          Account silently popped the overlay back open with no visible
          trigger. `inert` removes this entire subtree from both focus and
          pointer interaction while the overlay's showing, which is the
          general fix — it closes off every route back into this content,
          not just the one keyboard path that surfaced it. */}
      <div
        className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden px-[--space-sm] pb-2 pt-[--space-2xs]"
        inert={infoOpen}
      >
        <div className="flex flex-col gap-10">
          {/* items-start, not items-center — found while double-checking the
              screen-edge margin guideline (tokens.css, Figma node
              738:8822): the title's own line box (32px serif) is taller
              than the 40px icon buttons next to it, so items-center was
              splitting that extra height evenly above/below each button —
              landing their actual top edge 4px below this row's own top
              (12px from the screen edge) instead of flush with it (8px),
              even though the row's padding-top was already the same
              --space-2xs every other screen's header uses. items-start
              pins every child's top edge to the row's own top instead, so
              the buttons land at the same 8px inset as InfoOverlay's close
              button and StepScreen/AllStepsView's header icons (all three
              already used items-start/items-center on same-height children
              only, which never hit this). */}
          <div className="flex items-start justify-between">
            <p
              className="capitalize"
              style={{
                fontFamily: 'var(--font-family-serif-card)',
                fontSize: 'var(--font-size-home-title)',
                letterSpacing: 'var(--letter-spacing-home-title)',
                // --color-info-overlay-heading, not --color-tutorial-card-text
                // (verify pass, 2026-09-01, Home redesign): a fresh pull of
                // this title (node 932:15402) shows the same flat #656462
                // swatch every other screen's own header title already
                // uses (Account/My Products/Bookmarks/About, see each of
                // their own comments) — this was apparently the one
                // header title never brought in line with that pass,
                // still on the darker near-black ink token.
                color: 'var(--color-info-overlay-heading)',
              }}
            >
              Beauty Notes
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onInfoOpenChange(true)}
                aria-label="About"
                className="header-icon-button flex size-[40px] items-center justify-center rounded-[--radius-filter-chip] border-[0.5px] border-solid"
                style={HEADER_CHIP_STYLE}
              >
                <InfoIcon />
              </button>
              <button
                type="button"
                onClick={onOpenAccount}
                aria-label="Account"
                className="header-icon-button flex size-[40px] items-center justify-center rounded-[--radius-filter-chip] border-[0.5px] border-solid"
                style={HEADER_CHIP_STYLE}
              >
                <UserIcon />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <p
              className="text-[16px]"
              style={{ color: 'var(--color-tutorial-card-text)', fontWeight: 'var(--font-weight-medium)' }}
            >
              Which type of look you want today?
            </p>
            <div className="flex items-center gap-2">
              {LOOK_TYPES.map((type) => (
                <LookSelectorChip
                  key={type.id}
                  type={type}
                  selected={selectedType === type.id}
                  onClick={() => setSelectedType(type.id)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Drag-native tutorial stack — node 642:5092's "BigCard". Front
            card + one peeking card; swipe the front card (any direction)
            to advance, wraps back to the first after the last. See
            TutorialCard.tsx's TutorialStack module comment. Centered
            (flex-1 + items-center/justify-center) in the space between the
            filter row and the bottom of the screen, rather than a fixed
            margin below the filters — per the user's own alternative to a
            flat "+16px" gap: this scales with whatever room is actually
            left instead of guessing one fixed number, and degrades
            gracefully (collapses toward the filter row, no extra gap) on a
            short viewport where header + card barely fit together. */}
        <div className="flex flex-1 items-center justify-center">
          {/* key={selectedType}: forces a fresh TutorialStack instance per
              chip instead of the same instance re-rendering with a swapped
              `tutorials` array — see this component's own module comment
              for why (activeCardIndex, the drag motion values, etc. are all
              internal to TutorialStack and keyed to array position, not
              tutorial identity; remounting is what resets them cleanly to
              the new deck's own front card). */}
          <TutorialStack
            key={selectedType}
            tutorials={visibleTutorials}
            onSelect={onSelectLook}
            lookType={selectedType}
            savedIds={savedTutorialIds}
            onToggleSave={onToggleSavedTutorial}
          />
        </div>
      </div>

      <InfoOverlay open={infoOpen} onClose={() => onInfoOpenChange(false)} />
    </div>
  )
}
