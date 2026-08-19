import { useState } from 'react'
import lookImage1 from '../assets/looks/soft-smokey-eye-1.jpg'
import lookImage2 from '../assets/looks/soft-smokey-eye-2.jpg'

type LookType = 'day' | 'night' | 'glam'

type HomeScreenProps = {
  /** Called when the (only, for now) look card is tapped — hands off to the tutorial flow. */
  onSelectLook?: () => void
}

type Look = {
  title: string
  brand: string
  durationMinutes: number
  level: string
  images: [string, string]
}

// Only one look exists so far — see the filter sheet below, which is
// deliberately non-functional until there's more than one to filter.
const LOOK: Look = {
  title: 'Soft Smokey Eye',
  brand: 'By Tom Ford SS 2019',
  durationMinutes: 25,
  level: 'Advanced',
  images: [lookImage1, lookImage2],
}

// Sun/Moon/Flame below are authored as single inline SVGs rather than the
// layered/rotated <img> stacks get_design_context returned — the source
// icons are simple stroke primitives (a circle + one short line reused via
// CSS rotation for all 8 sun rays; a filled crescent + sparkle for the
// moon; a stroked outline for the flame), so redrawing them directly in one
// viewBox is far more reliable than reproducing Figma's nested percentage/
// container-query transforms by hand. Moon and flame paths are the actual
// path data from the exported assets (get_design_context), repositioned
// into a shared 36x36 frame; the sun's 8 rays are drawn from the source
// circle/line geometry rather than 8 separately-transformed image layers.
// All use --color-text-primary/currentColor to match the design's #0E0B06.

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
    <svg width={36} height={36} viewBox="0 0 36 36" fill="none" className="opacity-50" aria-hidden="true">
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
    <svg width={36} height={36} viewBox="0 0 36 36" fill="none" className="opacity-50" aria-hidden="true">
      <g transform="translate(14.4, 7.5) scale(0.92, 0.88)">
        <path
          d="M11.9 1.4V0H11.8999L11.9 1.4ZM7.4 10.399L6 10.399V10.399H7.4ZM11.9 22.4L11.8999 23.8H11.9V22.4ZM1.4 11.9H0V11.9L1.4 11.9ZM12.9932 19.6836L12.3381 20.9209L12.9932 19.6836ZM15.4979 21.5687L16.8732 21.8305L15.4979 21.5687ZM11.9893 1.71927L12.7784 2.87572L11.9893 1.71927ZM11.9893 1.71927L11.2003 0.562826C8.06384 2.70286 6.00001 6.30984 6 10.399L7.4 10.399L8.8 10.399C8.80001 7.27422 10.3738 4.51641 12.7784 2.87572L11.9893 1.71927ZM7.4 10.399H6C6 14.9644 8.57139 18.9265 12.3381 20.9209L12.9932 19.6836L13.6484 18.4464C10.7616 16.9179 8.8 13.8866 8.8 10.399H7.4ZM13.0714 22.3353L12.9168 20.9439C12.5834 20.9809 12.2442 21 11.9 21V22.4V23.8C12.3478 23.8 12.7902 23.7752 13.2261 23.7267L13.0714 22.3353ZM11.9 22.4L11.9001 21C6.87436 20.9998 2.80001 16.9256 2.8 11.9L1.4 11.9L0 11.9C7.7486e-06 18.4721 5.32804 23.7998 11.8999 23.8L11.9 22.4ZM1.4 11.9H2.8C2.8 6.8744 6.87435 2.80019 11.9001 2.8L11.9 1.4L11.8999 0C5.32804 0.000247598 0 5.32789 0 11.9H1.4ZM12.9932 19.6836L12.3381 20.9209C13.242 21.3995 13.7985 21.697 14.133 21.9296C14.3007 22.0462 14.3052 22.0754 14.2637 22.019C14.1956 21.9265 14.0549 21.6622 14.1226 21.3068L15.4979 21.5687L16.8732 21.8305C16.9892 21.2213 16.7763 20.7092 16.5187 20.3592C16.2875 20.0452 15.9851 19.807 15.7313 19.6306C15.2229 19.2771 14.4787 18.886 13.6484 18.4464L12.9932 19.6836ZM13.0714 22.3353L13.2261 23.7267C13.9522 23.646 14.6638 23.5709 15.1911 23.4305C15.6679 23.3036 16.6602 22.949 16.8732 21.8305L15.4979 21.5687L14.1226 21.3068C14.171 21.0526 14.3214 20.8586 14.4617 20.7544C14.5577 20.6831 14.5996 20.6905 14.4706 20.7248C14.3544 20.7558 14.176 20.7894 13.9013 20.8272C13.6305 20.8645 13.3107 20.9001 12.9168 20.9439L13.0714 22.3353ZM11.9 1.4V2.8C11.276 2.8 10.838 2.35482 10.7116 1.89434C10.589 1.44826 10.7251 0.887037 11.2003 0.562826L11.9893 1.71927L12.7784 2.87572C13.3946 2.45529 13.5713 1.73443 13.4116 1.15277C13.2479 0.556704 12.6947 0 11.9 0V1.4Z"
          fill="var(--color-text-primary)"
        />
      </g>
      <g transform="translate(2.8, 5.6) scale(1.02)">
        <path
          d="M4.6464 8.56639L4.64641 8.56641L4.64641 8.56642C4.78833 8.99217 4.85929 9.20505 4.93027 9.29791C5.21044 9.66445 5.76238 9.66445 6.04255 9.29791C6.11352 9.20505 6.18448 8.99217 6.3264 8.56641L6.32641 8.5664L6.32641 8.56638C6.44089 8.22294 6.49813 8.05122 6.57218 7.89579C6.84847 7.31581 7.31581 6.84847 7.89579 6.57218C8.05122 6.49813 8.22295 6.44089 8.56639 6.32641L8.56641 6.32641L8.56642 6.3264C8.99217 6.18448 9.20505 6.11352 9.29791 6.04255C9.66445 5.76238 9.66445 5.21044 9.29791 4.93027C9.20505 4.85929 8.99217 4.78833 8.56641 4.64641L8.5664 4.64641L8.56638 4.6464C8.22294 4.53192 8.05122 4.47468 7.89579 4.40063C7.31581 4.12434 6.84847 3.657 6.57218 3.07702C6.49813 2.92159 6.44089 2.74986 6.32641 2.40642L6.32641 2.40641L6.3264 2.4064C6.18448 1.98064 6.11352 1.76776 6.04255 1.6749C5.76238 1.30837 5.21044 1.30837 4.93027 1.6749C4.85929 1.76776 4.78833 1.98064 4.64641 2.4064L4.64641 2.40641L4.6464 2.40642C4.53192 2.74986 4.47468 2.92159 4.40063 3.07702C4.12434 3.657 3.657 4.12434 3.07702 4.40063C2.92159 4.47468 2.74986 4.53192 2.40642 4.6464L2.40641 4.64641L2.4064 4.64641C1.98064 4.78833 1.76776 4.85929 1.6749 4.93027C1.30837 5.21044 1.30837 5.76238 1.6749 6.04255C1.76776 6.11352 1.98064 6.18448 2.4064 6.3264L2.40641 6.32641L2.40642 6.32641C2.74986 6.44089 2.92159 6.49813 3.07702 6.57218C3.657 6.84847 4.12434 7.31581 4.40063 7.89579C4.47468 8.05122 4.53192 8.22295 4.6464 8.56639Z"
          stroke="var(--color-text-primary)"
          strokeWidth={2.8}
        />
      </g>
    </svg>
  )
}

function FlameIcon() {
  return (
    <svg width={36} height={36} viewBox="0 0 36 36" fill="none" className="opacity-50" aria-hidden="true">
      <g transform="translate(10.5, 8.2) scale(0.83, 0.87)">
        <path
          d="M5.25 8.29438C5.25 7.10707 3.67083 6.79236 3.25187 7.90329C2.23842 10.5906 1.5 12.9946 1.5 14.2943C1.5 18.4364 4.85786 21.7943 9 21.7943C13.1421 21.7943 16.5 18.4364 16.5 14.2943C16.5 12.8979 15.6477 10.2269 14.5177 7.29942C13.0539 3.50712 12.322 1.61098 11.4185 1.50885C11.1294 1.47616 10.814 1.53492 10.5561 1.66951C9.75 2.09013 9.75 4.15821 9.75 8.29438C9.75 9.53701 8.74264 10.5444 7.5 10.5444C6.25736 10.5444 5.25 9.53701 5.25 8.29438Z"
          stroke="var(--color-text-primary)"
          strokeWidth={3}
        />
      </g>
      <g transform="translate(15, 21) scale(0.8, 0.71)">
        <path
          d="M2.25971 8.12293L1.86553 7.13747C1.1821 5.42891 1.47019 3.48484 2.61974 2.0479C3.20417 1.31737 4.31526 1.31737 4.89969 2.0479C6.04923 3.48484 6.33732 5.42891 5.6539 7.13747L5.25971 8.12293"
          stroke="var(--color-text-primary)"
          strokeWidth={3}
        />
      </g>
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" className="shrink-0 opacity-20" aria-hidden="true">
      <circle cx={8} cy={8} r={6} stroke="var(--color-look-card-text)" strokeWidth={1.33} />
      <path d="M8 4.7V8L10.5 8" stroke="var(--color-look-card-text)" strokeWidth={1.33} strokeLinecap="round" />
    </svg>
  )
}

/** Skill-level bars — drawn with plain CSS borders in the Figma source
 *  (not an exported image), so reproduced the same way here. */
function LevelIcon() {
  return (
    <div className="relative size-[16px] shrink-0 opacity-20">
      <div
        className="absolute rounded-[0.667px] border-[1.333px] border-solid"
        style={{ borderColor: 'var(--color-look-card-text)', bottom: '16.67%', left: '75%', right: '8.33%', top: '29.17%' }}
      />
      <div
        className="absolute rounded-[0.667px] border-[1.333px] border-solid"
        style={{ borderColor: 'var(--color-look-card-text)', inset: '54.17% 41.67% 16.67% 41.67%' }}
      />
      <div
        className="absolute rounded-[0.667px] border-[1.333px] border-solid"
        style={{ borderColor: 'var(--color-look-card-text)', bottom: '16.67%', left: '8.33%', right: '75%', top: '37.5%' }}
      />
    </div>
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
      className="flex flex-1 flex-col items-start gap-[28px] rounded-[--radius-filter-chip] border-2 border-solid px-3 py-4"
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
 * visual fidelity to the Figma design but isn't wired to dismiss anything;
 * the sheet stays on-screen (persistent, per product decision).
 */
export function HomeScreen({ onSelectLook }: HomeScreenProps) {
  const [selectedType, setSelectedType] = useState<LookType>('day')

  return (
    <div
      className="relative mx-auto flex h-dvh w-full max-w-[402px] flex-col overflow-hidden rounded-2xl py-6 md:h-full"
      style={{ background: 'var(--gradient-bg-screen)' }}
    >
      <div className="flex flex-col items-center gap-2 px-3 py-2 text-center">
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

      {/* Card list — just the one look for now. flex-1 + overflow-y-auto so
          a future longer list scrolls here without moving the filter sheet
          below, same pattern StepScreen/AllStepsView use for their own
          scrollable region vs. fixed-position bottom card. */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <button
          type="button"
          onClick={onSelectLook}
          className="flex w-full flex-col items-start gap-[37px] rounded-[--radius-look-card] p-4 text-left"
          style={{ background: 'var(--color-look-card-bg)' }}
        >
          <div className="relative h-[219px] w-full">
            <div
              className="absolute left-1/2 top-[1px] h-[171px] w-[148px] -translate-x-1/2"
              style={{ marginLeft: '84px' }}
            >
              <div className="h-full w-full" style={{ transform: 'rotate(1.77deg)' }}>
                <img
                  alt=""
                  src={LOOK.images[0]}
                  className="h-[166px] w-[143px] rounded-[20px] object-cover"
                  style={{ boxShadow: '0px 4px 20px 0px rgba(67, 48, 35, 0.2)' }}
                />
              </div>
            </div>
            <div
              className="absolute left-1/2 top-0 h-[219px] w-[152px] -translate-x-1/2"
              style={{ marginLeft: '-82px' }}
            >
              <div className="h-full w-full" style={{ transform: 'rotate(-2.39deg)' }}>
                <img
                  alt="Model wearing the Soft Smokey Eye look"
                  src={LOOK.images[1]}
                  className="h-[213px] w-[143px] rounded-[20px] object-cover"
                  style={{ boxShadow: '0px 4px 20px 0px rgba(67, 48, 35, 0.2)' }}
                />
              </div>
            </div>
          </div>

          <div className="flex w-full items-start justify-between">
            <div className="flex flex-col items-start gap-1">
              <p
                className="capitalize whitespace-nowrap text-[16px]"
                style={{ color: 'var(--color-look-card-text)', fontWeight: 'var(--font-weight-semibold)' }}
              >
                {LOOK.title}
              </p>
              <p
                className="whitespace-nowrap text-[12px] opacity-50"
                style={{ color: 'var(--color-look-card-text)', fontWeight: 'var(--font-weight-medium)' }}
              >
                {LOOK.brand}
              </p>
            </div>
            <div className="flex flex-col items-end justify-center gap-1">
              <div className="flex items-end justify-end gap-1">
                <p
                  className="whitespace-nowrap text-[10px] opacity-50"
                  style={{ color: 'var(--color-look-card-text)', fontWeight: 'var(--font-weight-medium)', letterSpacing: '-0.1px' }}
                >
                  {LOOK.durationMinutes} min
                </p>
                <ClockIcon />
              </div>
              <div className="flex items-end gap-1">
                <p
                  className="whitespace-nowrap text-[10px] opacity-50"
                  style={{ color: 'var(--color-look-card-text)', fontWeight: 'var(--font-weight-medium)', letterSpacing: '-0.1px' }}
                >
                  {LOOK.level}
                </p>
                <LevelIcon />
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Persistent filter sheet. */}
      <div className="px-3 pb-4 pt-2">
        <div
          className="relative flex w-full flex-col items-center gap-4 rounded-[--radius-card] px-4 pb-4 pt-6"
          style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-card)' }}
        >
          <p
            className="text-[12px] opacity-50"
            style={{ color: 'var(--color-text-primary)', fontWeight: 'var(--font-weight-medium)' }}
          >
            Which type of look you want today?
          </p>
          <div className="flex w-full items-end gap-2">
            <FilterChip icon={<SunIcon />} label="Day" selected={selectedType === 'day'} onClick={() => setSelectedType('day')} />
            <FilterChip icon={<MoonIcon />} label="Night" selected={selectedType === 'night'} onClick={() => setSelectedType('night')} />
            <FilterChip icon={<FlameIcon />} label="Glam" selected={selectedType === 'glam'} onClick={() => setSelectedType('glam')} />
          </div>
          {/* Decorative only — not wired to dismiss the sheet (kept persistent, see doc comment above). */}
          <svg
            width={20}
            height={20}
            viewBox="0 0 20 20"
            fill="none"
            className="absolute right-3 top-3 opacity-40"
            aria-hidden="true"
          >
            <path d="M5 5L15 15" stroke="var(--color-text-primary)" strokeWidth={1.67} strokeLinecap="round" />
            <path d="M15 5L5 15" stroke="var(--color-text-primary)" strokeWidth={1.67} strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
  )
}
