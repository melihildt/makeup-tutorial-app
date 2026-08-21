import { useState } from 'react'
import { TUTORIALS, TutorialStack } from './TutorialCard'
import dayTexture from '../assets/filter-chips/day-texture.jpg'
import nightTexture from '../assets/filter-chips/night-texture.jpg'
import glamTexture from '../assets/filter-chips/glam-texture.jpg'

type LookType = 'day' | 'night' | 'glam'

type HomeScreenProps = {
  /** Called when the (only, for now) look card is tapped — hands off to the tutorial flow. */
  onSelectLook?: () => void
}

// Sun/Moon/Diamond below are authored as single inline SVGs rather than the
// layered/rotated <img> stacks get_design_context returned — the same
// approach as the app's other hand-authored icons (see CheckIndicator.tsx):
// path data taken directly from the exported assets, repositioned into a
// shared viewBox, since redrawing them in one place is far more reliable
// than reproducing Figma's nested percentage/container-query transforms by
// hand.
//
// V2 (node 572:3875, smaller filter sheet): rendered at 24px instead of
// 36px. Moon dropped its sparkle in this version (single crescent path
// only) and Glam switched from a flame to a diamond outline — both re-
// pulled fresh rather than just scaled down, since they're genuinely
// different source shapes now, not the same icons at a smaller size.
//
// V4 (node 635:4792, "LookSelector" redesign): shrunk again to 20px, moved
// off --color-text-primary onto --color-tutorial-card-text (this whole
// header/filter section uses that warm-ink token now, not the old one —
// see tokens.css), and opacity bumped 50% → 80% to match the design's
// "Dark / 80%" style on the selected chip's icon. Also: a chip's icon now
// only renders while that chip is selected (see LOOK_TYPES/LookSelectorChip
// below) — confirmed against a fresh get_design_context pull that Night/Glam
// genuinely have no icon in their unselected state, not an isolated-pull
// omission this time.
//
// InfoIcon/UserIcon are new in V4 — the header's icon-button row didn't
// exist before. Both are reassembled the same way: path data taken from
// the exported fi-rr-info/fi-rr-user asset fragments, positions converted
// from their Figma inset percentages into simple translate() offsets on a
// shared 20x20 viewBox.

function SunIcon() {
  const rays = [0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
    const rad = (deg * Math.PI) / 180
    const sin = Math.sin(rad)
    const cos = Math.cos(rad)
    const r1 = 8.5
    const r2 = 11.5
    return {
      x1: 18 + r1 * sin,
      y1: 18 - r1 * cos,
      x2: 18 + r2 * sin,
      y2: 18 - r2 * cos,
    }
  })
  return (
    <svg width={20} height={20} viewBox="0 0 36 36" fill="none" className="opacity-80" aria-hidden="true">
      <circle cx={18} cy={18} r={6} stroke="var(--color-tutorial-card-text)" strokeWidth={2.8} />
      {rays.map((ray, i) => (
        <line
          key={i}
          x1={ray.x1}
          y1={ray.y1}
          x2={ray.x2}
          y2={ray.y2}
          stroke="var(--color-tutorial-card-text)"
          strokeWidth={2.8}
          strokeLinecap="round"
        />
      ))}
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" className="opacity-80" aria-hidden="true">
      <g transform="translate(7, 4) scale(0.822, 0.889)">
        <path
          d="M9.43839 14.7486L8.74326 15.4675L9.43839 14.7486ZM10.1664 15.5111L11.0386 15.0219L10.1664 15.5111ZM9.58116 16.9582L9.86808 17.9162L9.58116 16.9582ZM9.43858 3.25089L8.74341 2.53204L9.43858 3.25089ZM10.1653 2.4897L9.2933 2.00027V2.00027L10.1653 2.4897ZM9.43858 3.25089L8.74341 2.53204C7.05308 4.16671 6 6.46108 6 9.00027H7H8C8 7.02529 8.81684 5.24327 10.1338 3.96974L9.43858 3.25089ZM7 9.00027H6C6 11.5393 7.05309 13.8331 8.74326 15.4675L9.43839 14.7486L10.1335 14.0297C8.81677 12.7564 8 10.975 8 9.00027H7ZM9 17.0003V16.0003C5.13401 16.0003 2 12.8663 2 9.00027H1H0C0 13.9708 4.02944 18.0003 9 18.0003V17.0003ZM1 9.00027H2C2 5.13428 5.13401 2.00027 9 2.00027V1.00027V0.000274897C4.02944 0.000274897 0 4.02971 0 9.00027H1ZM9.43839 14.7486L8.74326 15.4675C8.96703 15.6839 9.11763 15.8297 9.22255 15.9376C9.27409 15.9906 9.30351 16.0232 9.31925 16.0419C9.33817 16.0644 9.32036 16.0468 9.29425 16.0003L10.1664 15.5111L11.0386 15.0219C10.9302 14.8287 10.7678 14.6579 10.6567 14.5436C10.5249 14.408 10.3473 14.2364 10.1335 14.0297L9.43839 14.7486ZM9 17.0003V18.0003C9.2374 18.0003 9.55534 18.0099 9.86808 17.9162L9.58116 16.9582L9.29425 16.0003C9.32261 15.9918 9.3335 15.9942 9.29049 15.9967C9.23484 15.9999 9.15785 16.0003 9 16.0003V17.0003ZM10.1664 15.5111L9.29425 16.0003V16.0003L9.58116 16.9582L9.86808 17.9162C11.0947 17.5488 11.665 16.1386 11.0386 15.0219L10.1664 15.5111ZM9 1.00027V2.00027C9.15748 2.00027 9.23419 2.00065 9.28963 2.00386C9.33241 2.00633 9.32154 2.00872 9.2933 2.00027L9.57993 1.04223L9.86656 0.0841938C9.55415 -0.00927496 9.23687 0.000274897 9 0.000274897V1.00027ZM9.43858 3.25089L10.1338 3.96974C10.3471 3.76339 10.5244 3.59213 10.656 3.45677C10.7669 3.34263 10.9291 3.17203 11.0374 2.97913L10.1653 2.4897L9.2933 2.00027C9.31937 1.95382 9.33715 1.93632 9.31828 1.95871C9.30259 1.97733 9.27323 2.00988 9.22179 2.06279C9.11708 2.17053 8.96678 2.31603 8.74341 2.53204L9.43858 3.25089ZM9.57993 1.04223L9.2933 2.00027V2.00027L10.1653 2.4897L11.0374 2.97913C11.6643 1.86208 11.0938 0.451356 9.86656 0.0841938L9.57993 1.04223Z"
          fill="var(--color-tutorial-card-text)"
        />
      </g>
    </svg>
  )
}

function DiamondIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" className="opacity-80" aria-hidden="true">
      <g transform="translate(4, 4) scale(0.901, 0.86)">
        <path
          d="M8.8756 17L1.5553 7.84963C1.22279 7.43398 1.05653 7.22616 1.01186 6.9757C0.967188 6.72525 1.05135 6.47276 1.21968 5.96779L1.96391 3.73509C2.40392 2.41505 2.62393 1.75504 3.1477 1.37752C3.67148 1 4.3672 1 5.75864 1H11.9926C13.384 1 14.0797 1 14.6035 1.37752C15.1273 1.75504 15.3473 2.41505 15.7873 3.73509L16.5315 5.96779C16.6999 6.47276 16.784 6.72525 16.7393 6.9757C16.6947 7.22616 16.5284 7.43398 16.1959 7.84963L8.8756 17ZM8.8756 17L12.3756 6M8.8756 17L5.3756 6M16.3756 7L12.3756 6M12.3756 6L10.8756 2M12.3756 6H5.3756M6.8756 2L5.3756 6M5.3756 6L1.3756 7"
          stroke="var(--color-tutorial-card-text)"
          strokeWidth={2}
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 20 20" fill="none" className="opacity-80" aria-hidden="true">
      <path
        d="M10 0C8.02219 0 6.08879 0.58649 4.4443 1.6853C2.79981 2.78412 1.51809 4.3459 0.761209 6.17317C0.00433286 8.00043 -0.193701 10.0111 0.192152 11.9509C0.578004 13.8907 1.53041 15.6725 2.92894 17.0711C4.32746 18.4696 6.10929 19.422 8.0491 19.8079C9.98891 20.1937 11.9996 19.9957 13.8268 19.2388C15.6541 18.4819 17.2159 17.2002 18.3147 15.5557C19.4135 13.9112 20 11.9778 20 10C19.9971 7.34872 18.9426 4.80684 17.0679 2.9321C15.1932 1.05736 12.6513 0.00286757 10 0V0ZM10 18.3333C8.35183 18.3333 6.74066 17.8446 5.37025 16.9289C3.99984 16.0132 2.93174 14.7117 2.30101 13.189C1.67028 11.6663 1.50525 9.99076 1.82679 8.37425C2.14834 6.75774 2.94201 5.27288 4.10745 4.10744C5.27289 2.94201 6.75774 2.14833 8.37425 1.82679C9.99076 1.50525 11.6663 1.67027 13.189 2.301C14.7118 2.93173 16.0132 3.99984 16.9289 5.37025C17.8446 6.74066 18.3333 8.35182 18.3333 10C18.3309 12.2094 17.4522 14.3276 15.8899 15.8899C14.3276 17.4522 12.2094 18.3309 10 18.3333V18.3333Z"
        fill="var(--color-tutorial-card-text)"
      />
      <g transform="translate(8.333, 8.333)">
        <path
          d="M1.66666 0H0.833332C0.612318 0 0.400357 0.0877975 0.244077 0.244078C0.0877974 0.400358 0 0.61232 0 0.833333C0 1.05435 0.0877974 1.26631 0.244077 1.42259C0.400357 1.57887 0.612318 1.66667 0.833332 1.66667H1.66666V6.66667C1.66666 6.88768 1.75446 7.09964 1.91074 7.25592C2.06702 7.4122 2.27898 7.5 2.5 7.5C2.72101 7.5 2.93297 7.4122 3.08925 7.25592C3.24553 7.09964 3.33333 6.88768 3.33333 6.66667V1.66667C3.33333 1.22464 3.15773 0.800716 2.84517 0.488156C2.53261 0.175595 2.10869 0 1.66666 0Z"
          fill="var(--color-tutorial-card-text)"
        />
      </g>
      <g transform="translate(8.75, 4.166)">
        <path
          d="M1.25 2.5C1.94036 2.5 2.5 1.94036 2.5 1.25C2.5 0.559644 1.94036 0 1.25 0C0.559644 0 0 0.559644 0 1.25C0 1.94036 0.559644 2.5 1.25 2.5Z"
          fill="var(--color-tutorial-card-text)"
        />
      </g>
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 20 20" fill="none" className="opacity-80" aria-hidden="true">
      <g transform="translate(5, 0)">
        <path
          d="M5 10C5.98891 10 6.95561 9.70676 7.77785 9.15735C8.6001 8.60794 9.24096 7.82705 9.6194 6.91342C9.99784 5.99979 10.0969 4.99446 9.90393 4.02455C9.711 3.05465 9.2348 2.16373 8.53553 1.46447C7.83627 0.765206 6.94536 0.289002 5.97545 0.0960758C5.00555 -0.0968503 4.00021 0.00216643 3.08658 0.380605C2.17295 0.759043 1.39206 1.39991 0.842652 2.22215C0.293245 3.0444 0 4.0111 0 5C0.00132369 6.32568 0.528533 7.59668 1.46593 8.53407C2.40332 9.47147 3.67432 9.99868 5 10ZM5 1.66667C5.65927 1.66667 6.30374 1.86217 6.8519 2.22844C7.40006 2.59471 7.82731 3.1153 8.0796 3.72439C8.33189 4.33348 8.3979 5.0037 8.26928 5.6503C8.14067 6.29691 7.8232 6.89085 7.35702 7.35702C6.89085 7.8232 6.2969 8.14067 5.6503 8.26929C5.0037 8.3979 4.33348 8.33189 3.72439 8.0796C3.1153 7.82731 2.59471 7.40007 2.22843 6.8519C1.86216 6.30374 1.66667 5.65927 1.66667 5C1.66667 4.11595 2.01786 3.2681 2.64298 2.64298C3.2681 2.01786 4.11595 1.66667 5 1.66667V1.66667Z"
          fill="var(--color-tutorial-card-text)"
        />
      </g>
      <g transform="translate(2.5, 11.668)">
        <path
          d="M7.5 0C5.51155 0.00220571 3.60518 0.79309 2.19914 2.19913C0.79309 3.60518 0.00220571 5.51155 0 7.5C0 7.72101 0.0877973 7.93298 0.244078 8.08926C0.400358 8.24554 0.61232 8.33333 0.833333 8.33333C1.05435 8.33333 1.26631 8.24554 1.42259 8.08926C1.57887 7.93298 1.66667 7.72101 1.66667 7.5C1.66667 5.9529 2.28125 4.46917 3.37521 3.37521C4.46917 2.28125 5.9529 1.66667 7.5 1.66667C9.0471 1.66667 10.5308 2.28125 11.6248 3.37521C12.7188 4.46917 13.3333 5.9529 13.3333 7.5C13.3333 7.72101 13.4211 7.93298 13.5774 8.08926C13.7337 8.24554 13.9457 8.33333 14.1667 8.33333C14.3877 8.33333 14.5996 8.24554 14.7559 8.08926C14.9122 7.93298 15 7.72101 15 7.5C14.9978 5.51155 14.2069 3.60518 12.8009 2.19913C11.3948 0.79309 9.48845 0.00220571 7.5 0V0Z"
          fill="var(--color-tutorial-card-text)"
        />
      </g>
    </svg>
  )
}

/** One Day/Night/Glam option: label, its own photo-texture + mix-blend-mode
 * tint (see LookSelectorChip below), and the icon shown only while selected.
 * `glow` is a per-type colored ambient shadow used only on the selected
 * state — inferred from the one sample the source design shows selected
 * (Day: a gold-tinted glow matching its own gold overlay tint); Night/Glam
 * follow the same pattern with their own tint color rather than reusing
 * Day's gold glow verbatim.
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
const LOOK_TYPES: Array<{
  id: LookType
  label: string
  texture: string
  tint: string
  blend: 'overlay' | 'soft-light'
  glow: string
  flash?: { peak: string }
  Icon: () => React.JSX.Element
}> = [
  {
    id: 'day',
    label: 'Day',
    texture: dayTexture,
    tint: '#e3b345',
    blend: 'overlay',
    glow: 'rgba(227, 179, 69, 0.2)',
    flash: { peak: '#ffb200' },
    Icon: SunIcon,
  },
  {
    id: 'night',
    label: 'Night',
    texture: nightTexture,
    tint: '#688db6',
    blend: 'soft-light',
    glow: 'rgba(104, 141, 182, 0.2)',
    flash: { peak: '#0079ff' },
    Icon: MoonIcon,
  },
  {
    id: 'glam',
    label: 'Glam',
    texture: glamTexture,
    tint: '#beef9e',
    blend: 'soft-light',
    glow: 'rgba(190, 239, 158, 0.2)',
    flash: { peak: '#99ff58' },
    Icon: DiamondIcon,
  },
]

function LookSelectorChip({
  type,
  selected,
  onClick,
}: {
  type: (typeof LOOK_TYPES)[number]
  selected: boolean
  onClick: () => void
}) {
  const { label, texture, tint, blend, glow, flash, Icon } = type
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
      className="relative flex h-[46px] flex-1 select-none items-center justify-between overflow-hidden rounded-[--radius-filter-chip] border border-solid p-3 active:scale-[0.97]"
      style={{
        borderColor: selected ? 'var(--color-filter-chip-border-selected)' : 'var(--color-filter-chip-border)',
        boxShadow: selected ? `0px 0px 4px ${glow}, var(--shadow-filter-chip)` : 'var(--shadow-filter-chip)',
        transition:
          'border-color var(--duration-instant) var(--ease-out-quart), box-shadow var(--duration-instant) var(--ease-out-quart), transform var(--duration-instant) var(--ease-out-quart)',
      }}
    >
      {/* Photo-texture background + colored tint — same shared woven texture
          asset per option (see src/assets/filter-chips), just a different
          mix-blend-mode color per look. Day uses `overlay`, Night/Glam use
          `soft-light` — matches the per-type blend mode in the source design,
          not a stylistic choice. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-white" />
        <img alt="" src={texture} className="absolute inset-0 size-full object-cover object-bottom" />
        <div className="absolute inset-0" style={{ background: tint, mixBlendMode: blend }} />
      </div>
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
          style={{
            backgroundImage: `linear-gradient(90deg, transparent 35%, ${flash.peak} 50%, transparent 65%)`,
            backgroundSize: '300% 100%',
            mixBlendMode: blend,
            opacity: 0,
            animation: 'chip-flash-sweep var(--duration-shimmer) linear',
          }}
        />
      )}
      <span
        className="relative capitalize text-[14px]"
        style={{ color: 'var(--color-tutorial-card-text)', fontWeight: 'var(--font-weight-medium)' }}
      >
        {label}
      </span>
      {selected && (
        // Reuses check-ring-in verbatim (index.css) rather than a new
        // near-duplicate keyframe — same "new element settling in after a
        // state swap" shape this icon needs, already on --duration-base/
        // --ease-out-quart.
        <span className="relative" style={{ animation: 'check-ring-in var(--duration-base) var(--ease-out-quart)' }}>
          <Icon />
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
 * decision, see git history). The Day/Night/Glam filters still don't
 * actually filter anything — there's only one real look — but the chip
 * selection still visually toggles, and now also toggles which chip shows
 * its icon (see LookSelectorChip above). The info/user icon buttons in the
 * header are new and purely decorative — no tap handlers wired yet, same
 * "not functional yet" spirit as the filters.
 */
export function HomeScreen({ onSelectLook }: HomeScreenProps) {
  const [selectedType, setSelectedType] = useState<LookType>('day')

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
          pattern StepScreen/AllStepsView use. Horizontal/vertical padding
          here (px-3, pt-5/pb-2) is the app's own mobile-tuned spacing, kept
          as-is rather than switched to the Figma frame's literal p-16 —
          that frame is a desktop-width browser mockup, and this app already
          deliberately diverges from raw Figma outer spacing to fit real
          phones (see the md:py-6 comment above). gap-10 (40px) between the
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
      <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden px-3 pb-2 pt-5">
        <div className="flex flex-col gap-10">
          <div className="flex items-center justify-between">
            <p
              className="capitalize"
              style={{
                fontFamily: 'var(--font-family-serif-card)',
                fontSize: 'var(--font-size-home-title)',
                letterSpacing: 'var(--letter-spacing-home-title)',
                color: 'var(--color-tutorial-card-text)',
              }}
            >
              Beauty Notes
            </p>
            <div className="flex items-center gap-2">
              <div
                className="flex size-[40px] items-center justify-center rounded-[--radius-filter-chip] border-[0.5px] border-solid"
                style={{ background: 'var(--color-header-icon-bg)', borderColor: 'var(--color-header-icon-border)' }}
              >
                <InfoIcon />
              </div>
              <div
                className="flex size-[40px] items-center justify-center rounded-[--radius-filter-chip] border-[0.5px] border-solid"
                style={{ background: 'var(--color-header-icon-bg)', borderColor: 'var(--color-header-icon-border)' }}
              >
                <UserIcon />
              </div>
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
          <TutorialStack tutorials={TUTORIALS} onSelect={onSelectLook} />
        </div>
      </div>
    </div>
  )
}
