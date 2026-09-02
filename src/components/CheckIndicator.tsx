type CheckIndicatorProps = {
  checked: boolean
  /** Play the mount animation (draw-in, ring fade, pop)? Defaults true.
   *  Callers pass false when this instance is being remounted for a
   *  reason unrelated to an actual click — see ProductCard's doc comment
   *  on the same prop for why that distinction has to be made at all. */
  animate?: boolean
}

// Checkmark path traced from src/assets/icons/v2/check-checked.svg (V2 —
// a curved, stroked path with rounded caps, not the V1 filled shape).
const CHECKMARK_PATH =
  'M25 14L18.2141 20.9798C17.2834 21.9371 16.818 22.4158 16.2247 22.4427C15.6313 22.4697 15.1245 22.0353 14.1107 21.1663L11 18.5'

// Measured via path.getTotalLength() in-browser — used as the stroke-dasharray
// for the draw-in animation below (rounded up slightly from ~18.88 so the
// dash never leaves a hairline gap once fully drawn).
const CHECKMARK_PATH_LENGTH = 19

/**
 * 36x36 circular check indicator, matching the V2 check assets in
 * src/assets/icons/v2/check-*.svg (checked: check-checked.svg, one flat
 * asset; unchecked: check-unchecked-1/2.svg, two layered assets — both
 * reproduced here as plain SVG shapes rather than embedded images, since
 * they're simple enough to redraw exactly and stay themeable via tokens).
 * Colors come from the --check-* tokens in tokens.css.
 *
 * checked/unchecked render structurally different children (ring+path vs.
 * one dashed circle) — not the same elements with different attributes —
 * so React always unmounts one and mounts the other on toggle, same as
 * ScreenHeader's segmented toggle. That's *why* the motion below uses CSS
 * `animation` (plays automatically whenever an element is first painted)
 * rather than `transition` (needs the same element's style to change
 * across two paints, which these elements never get — see ScreenHeader.tsx
 * for the full writeup of that pitfall). The root `key` below makes that
 * remount explicit and guarantees the pop animation reliably replays on
 * every toggle, in both directions, rather than depending on incidental
 * structural diffing.
 *
 * That same "animation plays on every mount" behavior is exactly what
 * makes `animate` necessary: this component also remounts wholesale
 * whenever its parent view does (switching step/list view unmounts one of
 * StepScreen/AllStepsView and mounts the other), which has nothing to do
 * with anyone actually clicking this particular checkbox. Without gating
 * the animation on `animate`, every already-checked item would replay its
 * draw-in/pop on every view switch — the "jumps when you switch views"
 * bug this prop fixes. Each keyframe's end state (opacity 1/scale 1,
 * dashoffset 0) is identical to its un-animated resting appearance, so
 * skipping the animation entirely (animate=false) still renders the
 * correct final look, just without playing the motion to get there.
 */
export function CheckIndicator({ checked, animate = true }: CheckIndicatorProps) {
  return (
    <svg
      key={checked ? 'checked' : 'unchecked'}
      width={36}
      height={36}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={checked ? 'Checked' : 'Unchecked'}
      style={animate ? { animation: 'check-pop var(--duration-instant) var(--ease-out-quart)' } : undefined}
    >
      <circle cx={18} cy={18} r={18} fill="var(--check-fill)" />
      {checked ? (
        <>
          <circle
            cx={18}
            cy={18}
            r={16.5}
            stroke="var(--check-stroke-checked)"
            strokeWidth="var(--check-stroke-checked-width)"
          />
          <path
            d={CHECKMARK_PATH}
            fill="none"
            stroke="var(--check-stroke-checked)"
            strokeWidth="var(--check-stroke-checked-width)"
            strokeLinecap="round"
            strokeDasharray={CHECKMARK_PATH_LENGTH}
          />
        </>
      ) : (
        <circle
          cx={18}
          cy={18}
          r={17}
          stroke="var(--check-stroke-unchecked)"
          strokeWidth="var(--check-stroke-unchecked-width)"
          strokeDasharray="var(--check-stroke-unchecked-dash)"
          strokeLinecap="square"
        />
      )}
    </svg>
  )
}
