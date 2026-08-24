import type { CSSProperties } from 'react'

type ScreenHeaderProps = {
  /** Which view is currently showing — determines which of Search/Widget is highlighted. */
  activeView: 'step' | 'list'
  onBack?: () => void
  /** Search icon click — switches to the per-step view. */
  onSelectStepView?: () => void
  /** Widget icon click — switches to the All Steps list view (wired once that view exists). */
  onSelectListView?: () => void
  onDone?: () => void
}

// V5 (docs/figma-step-screen-restyle.md): every header icon rebuilt from
// scratch here — the old set (arrow-left.svg, done-check.svg, the
// search/widget ellipse+handle+bar sub-assets) was hand-decomposed from an
// older Figma pull's multi-layer vector groups and doesn't match this
// pass's icons at all. This pull's icons (fi-rr-arrow-small-left,
// fi-rr-search, fi-rr-list-check, fi-rr-check) are each a single flat
// glyph — downloaded directly via download_assets (nodes 685:4155/4158/
// 4160/4162) and inlined as `d` path data below, `fill="currentColor"` so
// color/opacity are still controlled via CSS like every other icon in
// this app, rather than baked into an imported file. Each `<svg>` is
// sized to its own native viewBox (no scaling at all) and centered by its
// parent button's own `flex items-center justify-center` — not scaled to
// fill a 20x20 box. Two wrong attempts before this, both from trusting
// Figma's raw export shape at face value instead of checking what it
// actually implies: (1) `preserveAspectRatio="none"` at a forced 20x20 —
// visibly stretched non-square icons (caught on Back/Check, both
// genuinely wide glyphs); (2) `preserveAspectRatio="xMidYMid meet"` still
// at a forced 20x20 — fixed the distortion but scaled every glyph *up* to
// fill that box, reading oversized (caught on Back specifically). The
// real fix, per get_metadata: each icon's Figma *instance* frame is
// declared 20x20, but the exported glyph's tight bounding box (Back:
// 11.67x9.99, Check: 20.0017x13.6703) is already expressed in that same
// local coordinate space — it's not a smaller shape meant to be scaled up
// to fill the frame, it's the glyph sitting with real padding inside its
// own 20x20 component slot (e.g. Back only occupies ~58% of its frame's
// width). Rendering at native size reproduces that padding directly, no
// separate padding value needed. Search (20.0164x20.0164, essentially
// square) and Widget (20.0007x18.3142) barely changed either fix — this
// only mattered visibly for Back/Check.
//
// Opacity: the downloaded SVGs have `fill-opacity` baked in — 0.8 for
// arrow/search/check, 0.5 for widget (list-check) — all four pulled from
// the *same* single frame (Step 1's header, where Search is active and
// Widget isn't). Since Back/Done have no "inactive" state and both sit at
// 0.8 too, 0.8 reads as this app's standard icon weight (matching the ~80%
// -opacity ink already used for text throughout this pass) rather than an
// "active" signal specific to Search — but Widget sitting distinctly
// lower, at 0.5, in that exact same frame is real evidence of dimming on
// the *inactive* toggle icon. This reverses what this file's own V5
// rebuild first assumed (no dimming, chip-only signal) — corrected here
// once the actual icon assets were inspected, not just their wrapping
// classNames (get_design_context's Tailwind-className scan doesn't surface
// an opacity baked into a referenced image/vector asset, only classes on
// the JSX elements themselves — a real gap in the earlier check, not a
// design change since then).
const ICON_OPACITY_ACTIVE = 0.8
const ICON_OPACITY_INACTIVE = 0.5

function BackIcon() {
  return (
    <svg
      width={11.6667}
      height={9.99278}
      viewBox="0 0 11.6667 9.99278"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      style={{ color: 'var(--color-tutorial-card-text)', opacity: ICON_OPACITY_ACTIVE }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="currentColor"
        d="M10.8333 4.16732H2.5L5.24167 1.42566C5.31977 1.34819 5.38177 1.25602 5.42408 1.15447C5.46638 1.05292 5.48817 0.944002 5.48817 0.833993C5.48817 0.723983 5.46638 0.615062 5.42408 0.513512C5.38177 0.411963 5.31977 0.319796 5.24167 0.242327C5.08553 0.0871178 4.87432 0 4.65417 0C4.43401 0 4.2228 0.0871178 4.06667 0.242327L0.491667 3.82566C0.178677 4.13678 0.00186066 4.55934 0 5.00065V5.00065C0.00405549 5.43907 0.180704 5.85824 0.491667 6.16732L4.06667 9.75065C4.14437 9.8278 4.2365 9.88889 4.33781 9.93044C4.43912 9.97198 4.54762 9.99317 4.65711 9.99278C4.76661 9.99239 4.87496 9.97044 4.97597 9.92818C5.07698 9.88592 5.16868 9.82418 5.24583 9.74648C5.32298 9.66878 5.38408 9.57665 5.42562 9.47534C5.46717 9.37403 5.48835 9.26553 5.48796 9.15604C5.48758 9.04654 5.46563 8.93819 5.42337 8.83718C5.38111 8.73617 5.31937 8.64447 5.24167 8.56732L2.5 5.83399H10.8333C11.0543 5.83399 11.2663 5.74619 11.4226 5.58991C11.5789 5.43363 11.6667 5.22167 11.6667 5.00065C11.6667 4.77964 11.5789 4.56768 11.4226 4.4114C11.2663 4.25512 11.0543 4.16732 10.8333 4.16732Z"
      />
    </svg>
  )
}

function DoneIcon() {
  return (
    <svg
      width={20.0017}
      height={13.6703}
      viewBox="0 0 20.0017 13.6703"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      style={{ color: 'var(--color-tutorial-card-text)', opacity: ICON_OPACITY_ACTIVE }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="currentColor"
        d="M18.5761 0.245241L7.06024 11.7602C6.98282 11.838 6.8908 11.8996 6.78949 11.9417C6.68817 11.9838 6.57954 12.0055 6.46982 12.0055C6.36011 12.0055 6.25148 11.9838 6.15016 11.9417C6.04884 11.8996 5.95683 11.838 5.87941 11.7602L1.42607 7.30274C1.34865 7.22501 1.25664 7.16333 1.15532 7.12125C1.054 7.07916 0.945369 7.0575 0.835658 7.0575C0.725946 7.0575 0.617314 7.07916 0.515996 7.12125C0.414677 7.16333 0.322666 7.22501 0.245241 7.30274V7.30274C0.16751 7.38016 0.105833 7.47218 0.0637486 7.5735C0.0216639 7.67482 0 7.78345 0 7.89316C0 8.00287 0.0216639 8.1115 0.0637486 8.21282C0.105833 8.31414 0.16751 8.40615 0.245241 8.48357L4.70024 12.9377C5.1702 13.4068 5.80707 13.6703 6.47107 13.6703C7.13508 13.6703 7.77195 13.4068 8.24191 12.9377L19.7569 1.42524C19.8345 1.34783 19.8961 1.25587 19.9381 1.15463C19.9801 1.05339 20.0017 0.944853 20.0017 0.835241C20.0017 0.725629 19.9801 0.617093 19.9381 0.515852C19.8961 0.41461 19.8345 0.322651 19.7569 0.245241C19.6795 0.167511 19.5875 0.105833 19.4862 0.0637488C19.3848 0.0216641 19.2762 0 19.1665 0C19.0568 0 18.9481 0.0216641 18.8468 0.0637488C18.7455 0.105833 18.6535 0.167511 18.5761 0.245241Z"
      />
    </svg>
  )
}

function SearchIcon({ active }: { active: boolean }) {
  return (
    <svg
      width={20.0164}
      height={20.0164}
      viewBox="0 0 20.0164 20.0164"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      style={{ color: 'var(--color-tutorial-card-text)', opacity: active ? ICON_OPACITY_ACTIVE : ICON_OPACITY_INACTIVE }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="currentColor"
        d="M19.7825 18.6042L14.8083 13.63C16.1639 11.9722 16.8303 9.85675 16.6699 7.72131C16.5094 5.58587 15.5344 3.59378 13.9463 2.15711C12.3583 0.720433 10.2788 -0.050916 8.13804 0.00261049C5.99725 0.056137 3.95893 0.930443 2.44468 2.44468C0.930443 3.95893 0.056137 5.99725 0.00261049 8.13804C-0.050916 10.2788 0.720433 12.3583 2.15711 13.9463C3.59378 15.5344 5.58587 16.5094 7.72131 16.6699C9.85675 16.8303 11.9722 16.1639 13.63 14.8083L18.6042 19.7825C18.7613 19.9343 18.9718 20.0183 19.1903 20.0164C19.4088 20.0145 19.6179 19.9269 19.7724 19.7724C19.9269 19.6179 20.0145 19.4088 20.0164 19.1903C20.0183 18.9718 19.9343 18.7613 19.7825 18.6042ZM8.36001 15.0267C7.04147 15.0267 5.75253 14.6357 4.65621 13.9031C3.55988 13.1706 2.70539 12.1294 2.20081 10.9112C1.69623 9.69306 1.5642 8.35261 1.82144 7.05941C2.07867 5.7662 2.71361 4.57831 3.64596 3.64596C4.57831 2.71361 5.7662 2.07867 7.05941 1.82144C8.35261 1.5642 9.69306 1.69623 10.9112 2.20081C12.1294 2.70539 13.1706 3.55988 13.9031 4.65621C14.6357 5.75253 15.0267 7.04147 15.0267 8.36001C15.0247 10.1275 14.3217 11.822 13.0719 13.0719C11.822 14.3217 10.1275 15.0247 8.36001 15.0267Z"
      />
    </svg>
  )
}

function WidgetIcon({ active }: { active: boolean }) {
  return (
    <svg
      width={20.0007}
      height={18.3142}
      viewBox="0 0 20.0007 18.3142"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      style={{ color: 'var(--color-tutorial-card-text)', opacity: active ? ICON_OPACITY_ACTIVE : ICON_OPACITY_INACTIVE }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="currentColor"
        d="M3.33399 4.98092C3.00545 4.98178 2.68 4.91749 2.37647 4.79176C2.07294 4.66602 1.79735 4.48135 1.56565 4.24842L0.278986 3.10342C0.113889 2.95623 0.0140269 2.74948 0.00136818 2.52865C-0.0112905 2.30783 0.0642913 2.09102 0.211486 1.92592C0.358682 1.76082 0.565433 1.66096 0.786257 1.6483C1.00708 1.63564 1.22389 1.71123 1.38899 1.85842L2.70982 3.03675C2.78543 3.12167 2.87762 3.19021 2.98072 3.23816C3.08381 3.28611 3.19563 3.31246 3.30928 3.31558C3.42294 3.31871 3.53604 3.29854 3.64161 3.25632C3.74718 3.2141 3.84299 3.15072 3.92315 3.07009L6.92649 0.210921C7.08798 0.0671465 7.29904 -0.00822951 7.51507 0.000713824C7.73111 0.00965716 7.93521 0.10222 8.08427 0.25885C8.23333 0.415481 8.31567 0.623916 8.31391 0.840131C8.31215 1.05635 8.22641 1.26341 8.07482 1.41759L5.08399 4.26259C4.8538 4.49144 4.58076 4.67267 4.28048 4.79593C3.9802 4.91918 3.65857 4.98205 3.33399 4.98092V4.98092ZM20.0007 3.31425C20.0007 3.09324 19.9129 2.88128 19.7566 2.725C19.6003 2.56872 19.3883 2.48092 19.1673 2.48092H10.834C10.613 2.48092 10.401 2.56872 10.2447 2.725C10.0885 2.88128 10.0007 3.09324 10.0007 3.31425C10.0007 3.53527 10.0885 3.74723 10.2447 3.90351C10.401 4.05979 10.613 4.14759 10.834 4.14759H19.1673C19.3883 4.14759 19.6003 4.05979 19.7566 3.90351C19.9129 3.74723 20.0007 3.53527 20.0007 3.31425ZM5.08399 10.9293L8.07482 8.08425C8.1583 8.00994 8.22597 7.91959 8.27382 7.81858C8.32166 7.71758 8.3487 7.60798 8.35332 7.49631C8.35794 7.38464 8.34006 7.27318 8.30072 7.16857C8.26139 7.06395 8.20142 6.96832 8.12437 6.88736C8.04732 6.8064 7.95477 6.74176 7.85223 6.6973C7.74969 6.65283 7.63926 6.62945 7.5275 6.62854C7.41574 6.62763 7.30494 6.6492 7.20168 6.69199C7.09843 6.73478 7.00484 6.79789 6.92649 6.87759L3.92649 9.73675C3.76785 9.88845 3.55681 9.97311 3.33732 9.97311C3.11783 9.97311 2.90679 9.88845 2.74815 9.73675L1.42315 8.41592C1.26598 8.26412 1.05548 8.18013 0.836985 8.18203C0.618488 8.18392 0.409478 8.27157 0.254971 8.42607C0.100464 8.58058 0.0128234 8.78959 0.0109247 9.00809C0.00902603 9.22658 0.0930214 9.43709 0.24482 9.59425L1.56565 10.9151C2.03205 11.3816 2.66392 11.6449 3.32357 11.6475C3.98322 11.6502 4.61719 11.392 5.08732 10.9293H5.08399ZM20.0007 9.98092C20.0007 9.75991 19.9129 9.54795 19.7566 9.39167C19.6003 9.23539 19.3883 9.14759 19.1673 9.14759H10.834C10.613 9.14759 10.401 9.23539 10.2447 9.39167C10.0885 9.54795 10.0007 9.75991 10.0007 9.98092C10.0007 10.2019 10.0885 10.4139 10.2447 10.5702C10.401 10.7265 10.613 10.8143 10.834 10.8143H19.1673C19.3883 10.8143 19.6003 10.7265 19.7566 10.5702C19.9129 10.4139 20.0007 10.2019 20.0007 9.98092ZM5.08399 17.5959L8.07149 14.7509C8.15496 14.6766 8.22264 14.5863 8.27048 14.4853C8.31833 14.3842 8.34537 14.2746 8.34999 14.163C8.35461 14.0513 8.33672 13.9399 8.29739 13.8352C8.25806 13.7306 8.19808 13.635 8.12103 13.554C8.04399 13.4731 7.95144 13.4084 7.8489 13.364C7.74636 13.3195 7.63593 13.2961 7.52417 13.2952C7.4124 13.2943 7.3016 13.3159 7.19835 13.3587C7.0951 13.4014 7.00151 13.4646 6.92315 13.5443L3.92315 16.4034C3.84299 16.4841 3.74718 16.5474 3.64161 16.5897C3.53604 16.6319 3.42294 16.652 3.30928 16.6489C3.19563 16.6458 3.08381 16.6194 2.98072 16.5715C2.87762 16.5235 2.78543 16.455 2.70982 16.3701L1.38899 15.1918C1.22389 15.0446 1.00708 14.969 0.786257 14.9816C0.565433 14.9943 0.358682 15.0942 0.211486 15.2593C0.0642913 15.4244 -0.0112905 15.6412 0.00136818 15.862C0.0140269 16.0828 0.113889 16.2896 0.278986 16.4368L1.56565 17.5818C2.03205 18.0483 2.66392 18.3115 3.32357 18.3142C3.98322 18.3168 4.61719 18.0587 5.08732 17.5959H5.08399ZM20.0007 16.6476C20.0007 16.4266 19.9129 16.2146 19.7566 16.0583C19.6003 15.9021 19.3883 15.8143 19.1673 15.8143H10.834C10.613 15.8143 10.401 15.9021 10.2447 16.0583C10.0885 16.2146 10.0007 16.4266 10.0007 16.6476C10.0007 16.8686 10.0885 17.0806 10.2447 17.2368C10.401 17.3931 10.613 17.4809 10.834 17.4809H19.1673C19.3883 17.4809 19.6003 17.3931 19.7566 17.2368C19.9129 17.0806 20.0007 16.8686 20.0007 16.6476Z"
      />
    </svg>
  )
}

// V5 (docs/figma-step-screen-restyle.md): shared "frosted chip" chrome for
// every active/standalone header button — Back, Done, and whichever of
// Search/Widget is active. Exactly the same tokens + shape HomeScreen.tsx
// already uses for its own header icons (--color-header-icon-bg/border,
// --radius-filter-chip — see that token's own tokens.css comment: "V4
// reuses this same radius for the header icon boxes too"), reused here
// rather than duplicated under a new name.
const HEADER_CHIP_STYLE: CSSProperties = {
  background: 'var(--color-header-icon-bg)',
  borderColor: 'var(--color-header-icon-border)',
}

/**
 * Shared top header for the per-step screens and the All Steps list view:
 * back button, a Search/Widget tab pair that switches between those two
 * views, and an icon-only Done button.
 *
 * V5 rebuild (docs/figma-step-screen-restyle.md): replaces the old
 * rounded-full pill + sliding-highlight-circle toggle with two independent
 * rounded-[--radius-filter-chip] buttons — a real structural change, not a
 * reskin, confirmed against Figma's pulled markup (Step 1/2/3/5/6/7/8 all
 * show the same shape). The active button gets its own frosted chip
 * (HEADER_CHIP_STYLE); the inactive one is bare — no dimmed opacity on its
 * icon either, unlike the old V2 header's opacity-30 inactive state
 * (figma-v2-redesign.md): none of this pass's pulls show an opacity class
 * on the inactive CTA, so that dimming was dropped in this iteration, not
 * missed. Back and Done now get the same frosted-chip treatment too — they
 * were bare icon-only buttons before.
 */
export function ScreenHeader({
  activeView,
  onBack,
  onSelectStepView,
  onSelectListView,
  onDone,
}: ScreenHeaderProps) {
  const isListView = activeView === 'list'

  return (
    <div className="flex w-full items-start justify-between px-[12px]">
      {/* No back button on the All Steps list view — it's reached by
          switching the Search/Widget toggle below, not by drilling in, so
          there's nothing to go "back" from. Kept as an equal-size spacer
          (rather than just omitted) so the toggle group and Done button
          stay in the same spots as the per-step header. */}
      {isListView ? (
        <div className="size-[40px] shrink-0" aria-hidden="true" />
      ) : (
        <button
          type="button"
          onClick={onBack}
          className="header-icon-button flex size-[40px] shrink-0 items-center justify-center rounded-[--radius-filter-chip] border-[0.5px] border-solid"
          style={HEADER_CHIP_STYLE}
        >
          <BackIcon />
        </button>
      )}

      {/* Outer group: content-sized (two 40px buttons, no fixed width
          needed now that there's no sliding element to travel across a
          wider track) — rgba(255,255,255,0.6), matching Figma exactly
          (was rgba(255,255,255,0.2) under the old pill). */}
      <div className="flex h-[40px] shrink-0 items-center rounded-[--radius-filter-chip] bg-[rgba(255,255,255,0.6)]">
        <button
          type="button"
          onClick={onSelectStepView}
          aria-pressed={!isListView}
          className="header-icon-button relative flex size-[40px] items-center justify-center rounded-[--radius-filter-chip]"
        >
          {/* The chip itself is a separate absolutely-positioned overlay,
              not chrome on the button — that's what lets it play a fresh
              "settling in" animation on mount (a plain style on the button
              would just appear, no motion). Only rendered when active, so
              there's nothing to animate *out* — the button reverts to bare
              instantly when the other one becomes active, same "no exit,
              only entrance" treatment as CheckIndicator's own ring. Reuses
              check-ring-in directly (see this component's doc comment). */}
          {!isListView && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-[--radius-filter-chip] border-[0.5px] border-solid"
              style={{ ...HEADER_CHIP_STYLE, animation: 'check-ring-in var(--duration-base) var(--ease-out-quart)' }}
            />
          )}
          <SearchIcon active={!isListView} />
        </button>
        <button
          type="button"
          onClick={onSelectListView}
          aria-pressed={isListView}
          className="header-icon-button relative flex size-[40px] items-center justify-center rounded-[--radius-filter-chip]"
        >
          {isListView && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-[--radius-filter-chip] border-[0.5px] border-solid"
              style={{ ...HEADER_CHIP_STYLE, animation: 'check-ring-in var(--duration-base) var(--ease-out-quart)' }}
            />
          )}
          <WidgetIcon active={isListView} />
        </button>
      </div>

      <button
        type="button"
        onClick={onDone}
        className="header-icon-button flex size-[40px] shrink-0 items-center justify-center rounded-[--radius-filter-chip] border-[0.5px] border-solid"
        style={HEADER_CHIP_STYLE}
      >
        <DoneIcon />
      </button>
    </div>
  )
}
