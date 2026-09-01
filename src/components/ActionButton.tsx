import type { CSSProperties } from 'react'

type ActionButtonVariant = 'default' | 'final'

type ActionButtonProps = {
  label: string
  variant: ActionButtonVariant
  onClick?: () => void
  /** Per-call-site style overrides, merged on top of the variant's own
   *  computed style (spread last, so these win). Exists for
   *  AllStepsView's "Finish" button specifically — see its own call site
   *  for why: that button's border-radius diverges from StepScreen's
   *  step-7 "Finish" (24px pill vs. this component's usual 12px), a real
   *  difference confirmed via a fresh pull of AllStepsView's own frame
   *  (docs/figma-allsteps-restyle.md, node 702:2694), not something to
   *  apply to every caller of this shared component. */
  style?: CSSProperties
}

/**
 * Bottom action button, inset within its card's own padding (not a
 * full-width footer). Default: subtle tinted background, black text.
 * Final: solid near-black background, off-white text. Used for the
 * per-step "next"/"Finish" button and the All Steps list view's "Finish".
 *
 * `action-button` (index.css) adds hover/press feedback — a persistent
 * element reacting to its own pseudo-class state, so plain CSS transitions
 * are correct here (contrast ScreenHeader/CheckIndicator, which need
 * mount-triggered `animation`s instead because they remount).
 */
export function ActionButton({ label, variant, onClick, style }: ActionButtonProps) {
  const isFinal = variant === 'final'
  return (
    <button
      type="button"
      onClick={onClick}
      className="action-button flex h-[--height-action-button] w-full items-center justify-center gap-2 rounded-[--radius-button] border-[0.5px] px-3 tracking-[--letter-spacing-button]"
      style={{
        fontSize: 'var(--font-size-button)',
        // V5 (docs/figma-step-screen-restyle.md): both Step 1's "Next" and
        // Step 7's "Finish" pulls use Inter's Medium weight (500), not
        // Semibold (600) — this button reads its own weight explicitly
        // rather than sharing --font-weight-semibold (used elsewhere, e.g.
        // ProductCard's brand name), so only this component's weight
        // changes.
        fontWeight: 'var(--font-weight-medium)',
        // Verify pass (2026-09-01): the default variant's text was
        // --color-text-primary (#21201f, the app-wide flat-migrated ink
        // token) — a fresh pull of this button specifically (Step 5's own
        // grey "Next", node 932:16246) shows a flat #2c2926 instead, an
        // older "Dark / 100%" swatch this element hadn't been re-checked
        // against since the rest of the app moved to #21201f. Its own
        // token (--color-action-button-text) since the two values
        // genuinely differ here, not a typo to fold into the shared one.
        color: isFinal ? 'var(--color-action-button-final-text)' : 'var(--color-action-button-text)',
        background: isFinal ? 'var(--color-action-button-final-bg)' : 'var(--color-action-button)',
        borderColor: isFinal ? 'var(--color-action-button-final-bg)' : 'var(--color-action-button-border)',
        ...style,
      }}
    >
      {label}
    </button>
  )
}
