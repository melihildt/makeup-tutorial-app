import { useState } from 'react'
import { HEADER_CHIP_STYLE } from './ScreenHeader'
import { CloseIcon, MenuDotsIcon, PlusIcon } from './icons'
import { Toast, useToast } from './Toast'
import { ScrollEndFade, useAtScrollEnd } from './ScrollEndFade'
import { ProductDetailOverlay } from './ProductDetailOverlay'
import { getRoleButtonProps } from './rowActivation'
import { getMyProducts, type Product } from '../data/stepContent'

type MyProductsScreenProps = {
  onClose: () => void
}

// Figma: node 734:7550 ("Home/Profile-MyProducts") — opened from
// AccountScreen's "My Products" row. This screen's own icons (Plus,
// MenuDots) moved to icons.tsx along with every other icon in the app —
// see that file's own module comment for the consolidation.
//
// The Figma frame also has a dark "Finish" button pinned under the product
// list (node 734:7691) — byte-for-byte the tutorial flow's own Finish
// button (StepScreen.tsx/ActionButton.tsx), right down to the label.
// Omitted here: it doesn't have an obvious action on a product list and
// reads as a leftover copy/paste artifact from duplicating that screen,
// not something designed for this one.

/**
 * One product row — image, brand/name (+ optional shade), "⋮" menu. Same
 * visual language as ProductCard.tsx (same size/radius/spacing/type
 * tokens), but not that component itself: the trailing affordance here is
 * a non-functional menu button, not ProductCard's checkbox, which is a
 * genuinely different piece of behavior, not a restyle.
 *
 * The row itself opens ProductDetailOverlay on tap; the "⋮" is its own
 * separate, non-functional control (see Toast.tsx) nested inside it. A
 * `<button>` can't nest another `<button>` (invalid HTML, inconsistent
 * browser/AT behavior), so the row is a `role="button"` div with its own
 * keyboard handling instead — the "⋮" stays a real `<button>` and stops the
 * tap from bubbling up to the row's own onClick.
 */
function MyProductRow({
  product,
  onMenuClick,
  onSelect,
}: {
  product: Product
  onMenuClick: () => void
  onSelect: () => void
}) {
  return (
    <div
      {...getRoleButtonProps(onSelect)}
      // has-[button:active]:scale-100 (code review finding): without it,
      // pressing the "⋮" button below also matches this row's own :active
      // (native CSS behavior — a nested button's :active state bubbles to
      // ancestors regardless of the button's own stopPropagation, which
      // only affects JS click/keydown handling, not CSS pseudo-class
      // matching), compounding two independent scale transforms on one
      // tap. BookmarkRow (BookmarksScreen.tsx) already carries this fix
      // for the identical row shape; this row just hadn't copied that half
      // of the pattern along with the rest of it.
      className="flex w-full cursor-pointer items-start gap-4 active:scale-[0.98] has-[button:active]:scale-100"
      style={{ transition: 'transform var(--duration-instant) var(--ease-out-quart)' }}
    >
      <div className="h-[--size-product-image-h] w-[--size-product-image-w] shrink-0 overflow-hidden rounded-[--radius-image-list] border-[0.5px] border-[--color-border-hairline] bg-[--color-image-placeholder]">
        {product.image && <img src={product.image} alt="" className="size-full object-cover" />}
      </div>
      <div className={`flex flex-1 gap-[3px] ${product.shade ? 'h-[--size-product-image-h] items-start' : 'items-center'}`}>
        <div
          className={`flex flex-1 flex-col text-[--color-text-product] tracking-[--letter-spacing-tight] ${
            product.shade ? 'h-full justify-between' : ''
          }`}
        >
          <div>
            <p className="capitalize text-[length:var(--font-size-product-name)] font-[--font-weight-semibold] leading-[18px]">
              {product.brand}
            </p>
            <p className="text-[length:var(--font-size-product-name)] font-[--font-weight-medium] leading-[18px]">
              {product.name}
            </p>
          </div>
          {product.shade && (
            <p className="text-[length:var(--font-size-product-sub)] font-[--font-weight-medium] leading-[18px] tracking-[--letter-spacing-shade] text-[--color-text-primary] opacity-50">
              {product.shade}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onMenuClick()
          }}
          // stopPropagation on keydown too (code review finding), not just
          // click: without it, an Enter/Space keydown here still bubbles to
          // the row's own onKeyDown above, which preventDefaults and fires
          // onSelect() before this button's native keyboard-activation
          // click can fire — making this button unreachable by keyboard.
          // BookmarkRow's un-save button (BookmarksScreen.tsx) already
          // carries this same fix.
          onKeyDown={(e) => e.stopPropagation()}
          aria-label={`More options for ${product.brand} ${product.name}`}
          // header-icon-button (index.css) — reused here purely for its
          // shared hover/press feedback on a descendant <svg>
          // (scale(1.05) hover, scale(0.93) active, --duration-instant/
          // --ease-out-quart), not its chip background: this button has no
          // background/border classes, so only that svg-targeting rule
          // actually applies. find-animation-opportunities pass: this was
          // the only icon-only button in the app with no press feedback at
          // all — every other one already gets this for free via the same
          // class.
          className={`header-icon-button flex shrink-0 items-center justify-center p-2 ${product.shade ? 'self-start' : ''}`}
          style={{ color: 'var(--color-tutorial-card-text)' }}
        >
          <span className="flex size-[20px] items-center justify-center">
            <MenuDotsIcon />
          </span>
        </button>
      </div>
    </div>
  )
}

/**
 * My Products screen — AccountScreen's "My Products" row opens this
 * (Figma node 734:7550). Data comes from `getMyProducts()`
 * (stepContent.ts), which groups and dedupes every product the tutorial
 * flow already uses — this screen has no product data of its own, it's a
 * different view onto STEP_CONTENT. The header's "+" and every row's "⋮"
 * are non-functional this pass — all three share one `useToast()` (see
 * Toast.tsx) rather than each getting its own, since only one "coming
 * soon" message is ever showing at a time regardless of which control was
 * tapped. My Products itself (the list/navigation, and tapping a row to
 * open ProductDetailOverlay) is fully real.
 */
export function MyProductsScreen({ onClose }: MyProductsScreenProps) {
  const [toastOpen, showToast, hideToast] = useToast()
  const { ref: scrollerRef, atEnd, onScroll } = useAtScrollEnd<HTMLDivElement>()
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const groups = getMyProducts()

  return (
    <div
      className="relative mx-auto flex h-dvh w-full max-w-[402px] flex-col overflow-hidden md:h-full md:rounded-2xl md:py-6"
      style={{ background: 'var(--gradient-bg-home)' }}
    >
      <Toast open={toastOpen} onClose={hideToast} />
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden px-[--space-sm] pb-2 pt-[--space-2xs]"
      >
        <div className="flex items-start justify-between">
          <p
            style={{
              fontFamily: 'var(--font-family-serif-card)',
              fontSize: 'var(--font-size-title-serif)',
              letterSpacing: 'var(--letter-spacing-title-serif)',
              color: 'var(--color-info-overlay-heading)',
              fontWeight: 'var(--font-weight-medium)',
            }}
          >
            My Products
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={showToast}
              aria-label="Add product"
              className="header-icon-button flex size-[40px] shrink-0 items-center justify-center rounded-[--radius-filter-chip] border-[0.5px] border-solid"
              style={{ ...HEADER_CHIP_STYLE, color: 'var(--color-tutorial-card-text)' }}
            >
              <PlusIcon />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="header-icon-button flex size-[40px] shrink-0 items-center justify-center rounded-[--radius-filter-chip] border-[0.5px] border-solid"
              style={{ ...HEADER_CHIP_STYLE, color: 'var(--color-tutorial-card-text)' }}
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <div
          // pb-10 (not p-[--space-sm] all around) — reserves the same 40px
          // of clean surface below the last row that ScrollEndFade's own
          // height covers, so the fade blends into real card background
          // instead of washing over the last product row (same reasoning
          // as AllStepsView's own card padding — see ScrollEndFade.tsx).
          className="mt-4 flex w-full flex-col gap-10 rounded-[--radius-card] bg-[--color-surface] px-[--space-sm] pb-10 pt-[--space-sm]"
          style={{ boxShadow: 'var(--shadow-card-elevated)' }}
          data-node-id="734:7560"
        >
          {groups.map((group) => (
            <div key={group.category} className="flex w-full flex-col gap-4">
              <div className="flex items-center gap-4 py-3">
                <p
                  className="flex-1 text-[length:var(--font-size-list-group-title)] tracking-[--letter-spacing-list-group-title]"
                  style={{ color: 'var(--color-tutorial-card-text)', fontWeight: 'var(--font-weight-medium)' }}
                >
                  {group.category}
                </p>
                <p
                  className="shrink-0 whitespace-nowrap text-[length:var(--font-size-badge)] tracking-[--letter-spacing-shade] text-[--color-text-product]"
                  style={{ fontWeight: 'var(--font-weight-medium)' }}
                >
                  {group.products.length} {group.products.length === 1 ? 'product' : 'products'}
                </p>
              </div>
              {group.products.map((product) => (
                <MyProductRow
                  key={`${product.brand}|${product.name}`}
                  product={product}
                  onMenuClick={showToast}
                  onSelect={() => setSelectedProduct(product)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      {/* Sibling of the scroller, not inside it — see ScrollEndFade.tsx's
          own doc comment for why. Default className already matches this
          card's shape (--space-sm inset, --radius-card rounding), same as
          AllStepsView's use of it. */}
      <ScrollEndFade hidden={atEnd} />
      <ProductDetailOverlay product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </div>
  )
}
