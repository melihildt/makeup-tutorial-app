import { useState } from 'react'
import { TUTORIALS, TutorialStack } from './TutorialCard'

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
// hand. All use --color-text-primary to match the design's #0E0B06.
//
// V2 (node 572:3875, smaller filter sheet): rendered at 24px instead of
// 36px. Moon dropped its sparkle in this version (single crescent path
// only) and Glam switched from a flame to a diamond outline — both re-
// pulled fresh rather than just scaled down, since they're genuinely
// different source shapes now, not the same icons at a smaller size.
//
// The close icon (below, CloseIcon) is the one icon reused verbatim from
// the very first Home pull (node 572:3666) — node 615:2884 confirmed it's
// still part of the design (an isolated pull of just the chip row, node
// 572:3875, had omitted it — see tokens.css's note on
// --shadow-filter-chip-selected for the same "isolated pull missed
// something a fuller-context pull caught" pattern).

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
    <svg width={24} height={24} viewBox="0 0 36 36" fill="none" className="opacity-50" aria-hidden="true">
      <circle cx={18} cy={18} r={6} stroke="var(--color-text-primary)" strokeWidth={2.8} />
      {rays.map((ray, i) => (
        <line
          key={i}
          x1={ray.x1}
          y1={ray.y1}
          x2={ray.x2}
          y2={ray.y2}
          stroke="var(--color-text-primary)"
          strokeWidth={2.8}
          strokeLinecap="round"
        />
      ))}
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" className="opacity-50" aria-hidden="true">
      <g transform="translate(7, 4) scale(0.822, 0.889)">
        <path
          d="M9.43839 14.7486L8.74326 15.4675L9.43839 14.7486ZM10.1664 15.5111L11.0386 15.0219L10.1664 15.5111ZM9.58116 16.9582L9.86808 17.9162L9.58116 16.9582ZM9.43858 3.25089L8.74341 2.53204L9.43858 3.25089ZM10.1653 2.4897L9.2933 2.00027V2.00027L10.1653 2.4897ZM9.43858 3.25089L8.74341 2.53204C7.05308 4.16671 6 6.46108 6 9.00027H7H8C8 7.02529 8.81684 5.24327 10.1338 3.96974L9.43858 3.25089ZM7 9.00027H6C6 11.5393 7.05309 13.8331 8.74326 15.4675L9.43839 14.7486L10.1335 14.0297C8.81677 12.7564 8 10.975 8 9.00027H7ZM9 17.0003V16.0003C5.13401 16.0003 2 12.8663 2 9.00027H1H0C0 13.9708 4.02944 18.0003 9 18.0003V17.0003ZM1 9.00027H2C2 5.13428 5.13401 2.00027 9 2.00027V1.00027V0.000274897C4.02944 0.000274897 0 4.02971 0 9.00027H1ZM9.43839 14.7486L8.74326 15.4675C8.96703 15.6839 9.11763 15.8297 9.22255 15.9376C9.27409 15.9906 9.30351 16.0232 9.31925 16.0419C9.33817 16.0644 9.32036 16.0468 9.29425 16.0003L10.1664 15.5111L11.0386 15.0219C10.9302 14.8287 10.7678 14.6579 10.6567 14.5436C10.5249 14.408 10.3473 14.2364 10.1335 14.0297L9.43839 14.7486ZM9 17.0003V18.0003C9.2374 18.0003 9.55534 18.0099 9.86808 17.9162L9.58116 16.9582L9.29425 16.0003C9.32261 15.9918 9.3335 15.9942 9.29049 15.9967C9.23484 15.9999 9.15785 16.0003 9 16.0003V17.0003ZM10.1664 15.5111L9.29425 16.0003V16.0003L9.58116 16.9582L9.86808 17.9162C11.0947 17.5488 11.665 16.1386 11.0386 15.0219L10.1664 15.5111ZM9 1.00027V2.00027C9.15748 2.00027 9.23419 2.00065 9.28963 2.00386C9.33241 2.00633 9.32154 2.00872 9.2933 2.00027L9.57993 1.04223L9.86656 0.0841938C9.55415 -0.00927496 9.23687 0.000274897 9 0.000274897V1.00027ZM9.43858 3.25089L10.1338 3.96974C10.3471 3.76339 10.5244 3.59213 10.656 3.45677C10.7669 3.34263 10.9291 3.17203 11.0374 2.97913L10.1653 2.4897L9.2933 2.00027C9.31937 1.95382 9.33715 1.93632 9.31828 1.95871C9.30259 1.97733 9.27323 2.00988 9.22179 2.06279C9.11708 2.17053 8.96678 2.31603 8.74341 2.53204L9.43858 3.25089ZM9.57993 1.04223L9.2933 2.00027V2.00027L10.1653 2.4897L11.0374 2.97913C11.6643 1.86208 11.0938 0.451356 9.86656 0.0841938L9.57993 1.04223Z"
          fill="var(--color-text-primary)"
        />
      </g>
    </svg>
  )
}

function DiamondIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" className="opacity-50" aria-hidden="true">
      <g transform="translate(4, 4) scale(0.901, 0.86)">
        <path
          d="M8.8756 17L1.5553 7.84963C1.22279 7.43398 1.05653 7.22616 1.01186 6.9757C0.967188 6.72525 1.05135 6.47276 1.21968 5.96779L1.96391 3.73509C2.40392 2.41505 2.62393 1.75504 3.1477 1.37752C3.67148 1 4.3672 1 5.75864 1H11.9926C13.384 1 14.0797 1 14.6035 1.37752C15.1273 1.75504 15.3473 2.41505 15.7873 3.73509L16.5315 5.96779C16.6999 6.47276 16.784 6.72525 16.7393 6.9757C16.6947 7.22616 16.5284 7.43398 16.1959 7.84963L8.8756 17ZM8.8756 17L12.3756 6M8.8756 17L5.3756 6M16.3756 7L12.3756 6M12.3756 6L10.8756 2M12.3756 6H5.3756M6.8756 2L5.3756 6M5.3756 6L1.3756 7"
          stroke="var(--color-text-primary)"
          strokeWidth={2}
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 20 20" fill="none" className="opacity-40" aria-hidden="true">
      <path d="M5 5L15 15" stroke="var(--color-text-primary)" strokeWidth={1.67} strokeLinecap="round" />
      <path d="M15 5L5 15" stroke="var(--color-text-primary)" strokeWidth={1.67} strokeLinecap="round" />
    </svg>
  )
}

type FilterChipProps = {
  icon: React.ReactNode
  label: string
  selected: boolean
  onClick: () => void
}

function FilterChip({ icon, label, selected, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-1 flex-col items-start gap-[8px] rounded-[--radius-filter-chip] border-2 border-solid p-3"
      style={{
        background: 'var(--color-filter-chip-bg)',
        borderColor: selected ? 'var(--color-filter-chip-border-selected)' : 'transparent',
      }}
    >
      {icon}
      <span
        className="capitalize text-[14px]"
        style={{ color: 'var(--color-text-primary)', fontWeight: 'var(--font-weight-semibold)' }}
      >
        {label}
      </span>
    </button>
  )
}

/**
 * Home screen: title/description header, the look card (tap → tutorial),
 * and a persistent bottom filter sheet. The Day/Night/Glam filters don't
 * actually filter anything yet — there's only one look — but the chip
 * selection still visually toggles. The sheet's close icon is rendered for
 * visual fidelity but isn't wired to dismiss anything; the sheet stays
 * on-screen (persistent, per product decision).
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
      style={{ background: 'var(--gradient-bg-screen)' }}
    >
      {/* Header text + tutorial stack as one block (node 615:2884's "Top
          Header": pt-20/px-12/pb-8, gap-40 between the text and the card)
          — flex-1 + overflow-y-auto so a future longer card list scrolls
          here without moving the filter sheet below, same pattern
          StepScreen/AllStepsView use. The stack itself is drag-only now,
          not scroll-linked (see TutorialCard.tsx's TutorialStack module
          comment for why), so at today's content length this shouldn't
          actually need to scroll — same "sized to fit" intent as the
          original single-card layout, just no longer load-bearing for
          the stack's own interaction. */}
      <div className="flex-1 overflow-y-auto px-3 pb-2 pt-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <p
            className="capitalize"
            style={{
              fontFamily: 'var(--font-family-serif)',
              fontSize: 'var(--font-size-home-title)',
              letterSpacing: 'var(--letter-spacing-home-title)',
              color: 'var(--color-text-primary)',
            }}
          >
            Beauty Notes
          </p>
          {/* Temporary copy — placeholder description, see conversation. */}
          <p
            className="opacity-50"
            style={{
              fontSize: 'var(--font-size-home-description)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-text-primary)',
            }}
          >
            Small app built with Claude Code and Figma MCP by Melisa Hildt. Still in early discovery. Screen size
            optimized for an iPhone 17.
          </p>
        </div>

        {/* Drag-native tutorial stack — node 642:5092's "BigCard". Front
            card + one peeking card; swipe the front card (any direction)
            to advance, wraps back to the first after the last. See
            TutorialCard.tsx's TutorialStack module comment. */}
        <div className="mt-[40px]">
          <TutorialStack tutorials={TUTORIALS} onSelect={onSelectLook} />
        </div>
      </div>

      {/* Persistent filter sheet. Smaller chips (24px icons, 12px
          padding/radius) than the original pull, per node 572:3875 —
          confirmed against the fuller-context node 615:2884 to still use
          the gray/border chip style (not the white+shadow this file tried
          first) and to still include the close icon (decorative only,
          matches — not wired to dismiss anything; the sheet stays
          persistent, per product decision). Sheet's own padding/gap
          (p-16, gap-16) also match 615:2884 exactly. */}
      <div className="px-3 pb-4 pt-2">
        <div
          className="relative flex w-full flex-col items-center gap-[16px] rounded-[--radius-card] p-4"
          style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-card)' }}
        >
          <p
            className="text-[12px] opacity-50"
            style={{ color: 'var(--color-text-primary)', fontWeight: 'var(--font-weight-medium)' }}
          >
            Which type of look you want today?
          </p>
          <div className="flex w-full items-start gap-2">
            <FilterChip icon={<SunIcon />} label="Day" selected={selectedType === 'day'} onClick={() => setSelectedType('day')} />
            <FilterChip icon={<MoonIcon />} label="Night" selected={selectedType === 'night'} onClick={() => setSelectedType('night')} />
            <FilterChip icon={<DiamondIcon />} label="Glam" selected={selectedType === 'glam'} onClick={() => setSelectedType('glam')} />
          </div>
          <div className="absolute right-3 top-3" aria-hidden="true">
            <CloseIcon />
          </div>
        </div>
      </div>
    </div>
  )
}
