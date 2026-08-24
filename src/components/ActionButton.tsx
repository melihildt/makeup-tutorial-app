type ActionButtonVariant = 'default' | 'final'

type ActionButtonProps = {
  label: string
  variant: ActionButtonVariant
  onClick?: () => void
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
export function ActionButton({ label, variant, onClick }: ActionButtonProps) {
  const isFinal = variant === 'final'
  return (
    <button
      type="button"
      onClick={onClick}
      className="action-button flex h-[--height-action-button] w-full items-center justify-center gap-2 rounded-[--radius-button] border-[0.5px] px-3"
      style={{
        fontSize: 'var(--font-size-button)',
        // V5 (docs/figma-step-screen-restyle.md): both Step 1's "Next" and
        // Step 7's "Finish" pulls use Inter's Medium weight (500), not
        // Semibold (600) — this button reads its own weight explicitly
        // rather than sharing --font-weight-semibold (used elsewhere, e.g.
        // ProductCard's brand name), so only this component's weight
        // changes.
        fontWeight: 'var(--font-weight-medium)',
        color: isFinal ? 'var(--color-action-button-final-text)' : 'var(--color-text-primary)',
        background: isFinal ? 'var(--color-action-button-final-bg)' : 'var(--color-action-button)',
        borderColor: isFinal ? 'var(--color-action-button-final-bg)' : 'var(--color-action-button-border)',
      }}
    >
      {label}
    </button>
  )
}
