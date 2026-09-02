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
  const isList = imageRadius === 'list'
  const radiusVar = isList ? '--radius-image-list' : '--radius-image'
  // Verify pass (2026-09-01): brand/name color used to branch on isList —
  // AllStepsView's context got the correct flat --color-tutorial-card-text
  // (confirmed earlier), while StepScreen's own (imageRadius="default")
  // stayed on the pre-V6 alpha-derived --color-text-product, on the theory
  // that node hadn't been re-pulled since. A fresh, direct pull of Step 7's
  // own product rows (node 896:9746-9748, 896:9756-9758) shows the exact
  // same flat #21201f swatch there too — not a different value after all,
  // just the same flat-swatch migration StepScreen's own product rows had
  // never actually been re-checked against. Collapsed to one unconditional
  // value; the isList flag still exists for the shade-line color below,
  // which genuinely does differ.
  const nameColorVar = '--color-tutorial-card-text'
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
          className={`flex flex-1 flex-col tracking-[--letter-spacing-tight] ${
            shade ? 'h-full justify-between' : ''
          }`}
          style={{ color: `var(${nameColorVar})` }}
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
              className={`text-[length:var(--font-size-product-sub)] font-[--font-weight-medium] leading-[18px] tracking-[--letter-spacing-shade] ${
                isList ? 'text-[--color-text-muted-list]' : 'text-[--color-text-primary] opacity-50'
              }`}
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
          // Accessibility audit (2026-09-02, finding #9): this button's own
          // hit area used to be exactly CheckIndicator's 36px box (p-0, no
          // explicit size) — short of WCAG 2.5.5's 44x44 target. Sized to
          // size-[44px] here instead of growing --size-check-indicator
          // itself: that token is a Figma-pixel-matched asset size used
          // elsewhere too (StepScreen's own product rows), not this
          // button's own hit-area choice to make alone. The row has enough
          // vertical room (63-72px product image height) for the extra 8px
          // without affecting layout; self-start still aligns this button's
          // own top edge to the column top when a shade line is present.
          className={`flex size-[44px] shrink-0 items-center justify-center border-0 bg-transparent disabled:cursor-default ${shade ? 'self-start' : ''}`}
        >
          <CheckIndicator checked={checked} animate={animate} />
        </button>
      </div>
    </div>
  )
}
