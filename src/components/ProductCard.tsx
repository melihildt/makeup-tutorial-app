import { CheckIndicator } from './CheckIndicator'

type ProductCardProps = {
  /** Product photo URL. Renders a --color-image-placeholder box when omitted. */
  image?: string
  brand: string
  name: string
  /** Optional shade/variant line, e.g. "79 - Spices". Renders as a third, muted line. */
  shade?: string
  checked: boolean
  /** Whether CheckIndicator should play its toggle animation (draw-in,
   *  ring fade, pop) — false when this card is merely being rendered/
   *  remounted (e.g. a step/list view switch) rather than actually just
   *  clicked. See TutorialFlow's `justToggledKey` for where this comes
   *  from. Defaults true so any future caller that doesn't pass it still
   *  gets the animation rather than silently losing it. */
  animate?: boolean
  /** Image corner radius variant. 'default' (--radius-image, 8px) is
   *  StepScreen's own per-step product row. 'list' (--radius-image-list,
   *  12px) is AllStepsView's per-step-group list — a real, confirmed
   *  difference in the current Figma file even though both call this same
   *  shared component, not a rounding of one value into the other. */
  imageRadius?: 'default' | 'list'
  onToggleChecked?: () => void
}

/**
 * A single row in the product checklist — 64x72 rounded image, brand +
 * product name (+ optional shade line), and a CheckIndicator on the
 * right. Matches the V2 "Product 1/2" card layout — see
 * docs/figma-v2-redesign.md.
 *
 * With a shade line, the row stretches to the image's full height with
 * brand/name pinned to the top and shade to the bottom (matching Figma);
 * without one, the row is simply vertically centered.
 */
export function ProductCard({ image, brand, name, shade, checked, animate = true, imageRadius = 'default', onToggleChecked }: ProductCardProps) {
  const radiusVar = imageRadius === 'list' ? '--radius-image-list' : '--radius-image'
  return (
    <div className="flex w-full items-start gap-4">
      <div
        className="h-[--size-product-image-h] w-[--size-product-image-w] shrink-0 overflow-hidden border-[0.5px] border-[--color-border-hairline] bg-[--color-image-placeholder]"
        style={{ borderRadius: `var(${radiusVar})` }}
      >
        {image && <img src={image} alt="" className="size-full object-cover" />}
      </div>
      <div
        className={`flex flex-1 gap-[3px] ${shade ? 'h-[--size-product-image-h] items-start' : 'items-center'}`}
      >
        <div
          className={`flex flex-1 flex-col text-[--color-text-product] tracking-[--letter-spacing-tight] ${
            shade ? 'h-full justify-between' : ''
          }`}
        >
          <div>
            <p className="text-[length:var(--font-size-product-name)] font-[--font-weight-semibold] leading-[18px]">
              {brand}
            </p>
            <p className="text-[length:var(--font-size-product-name)] font-[--font-weight-medium] leading-[18px]">
              {name}
            </p>
          </div>
          {shade && (
            <p
              className="text-[length:var(--font-size-product-sub)] font-[--font-weight-medium] leading-[18px] tracking-[--letter-spacing-shade] text-[--color-text-primary] opacity-50"
            >
              {shade}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onToggleChecked}
          disabled={!onToggleChecked}
          aria-pressed={checked}
          aria-label={`${checked ? 'Uncheck' : 'Check'} ${brand} ${name}`}
          className={`flex shrink-0 items-center justify-center border-0 bg-transparent p-0 disabled:cursor-default ${shade ? 'self-start' : ''}`}
        >
          <CheckIndicator checked={checked} animate={animate} />
        </button>
      </div>
    </div>
  )
}
