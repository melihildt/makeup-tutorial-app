import { HEADER_CHIP_STYLE } from './ScreenHeader'
import { CloseIcon } from './InfoOverlay'
import { Toast, useToast } from './Toast'
import { ScrollEndFade, useAtScrollEnd } from './ScrollEndFade'
import { getMyProducts, type Product } from '../data/stepContent'

type MyProductsScreenProps = {
  onClose: () => void
}

// Figma: node 734:7550 ("Home/Profile-MyProducts") — opened from
// AccountScreen's "My Products" row. Icons are hand-authored inline SVGs
// with real path data pulled from that node's exported assets
// (fi-br-plus-small, fi-br-menu-dots-vertical), same convention as every
// other icon in this app — see AccountScreen.tsx's own module comment for
// why (not a raw `<img src>` of the remote, ~7-day-expiring asset).
//
// The Figma frame also has a dark "Finish" button pinned under the product
// list (node 734:7691) — byte-for-byte the tutorial flow's own Finish
// button (StepScreen.tsx/ActionButton.tsx), right down to the label.
// Omitted here: it doesn't have an obvious action on a product list and
// reads as a leftover copy/paste artifact from duplicating that screen,
// not something designed for this one.

function PlusIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        fill="currentColor"
        fillOpacity={0.8}
        d="M13.75 8.75H11.25V6.25C11.25 5.91848 11.1183 5.60054 10.8839 5.36612C10.6495 5.1317 10.3315 5 10 5C9.66848 5 9.35054 5.1317 9.11612 5.36612C8.8817 5.60054 8.75 5.91848 8.75 6.25V8.75H6.25C5.91848 8.75 5.60054 8.8817 5.36612 9.11612C5.1317 9.35054 5 9.66848 5 10C5 10.3315 5.1317 10.6495 5.36612 10.8839C5.60054 11.1183 5.91848 11.25 6.25 11.25H8.75V13.75C8.75 14.0815 8.8817 14.3995 9.11612 14.6339C9.35054 14.8683 9.66848 15 10 15C10.3315 15 10.6495 14.8683 10.8839 14.6339C11.1183 14.3995 11.25 14.0815 11.25 13.75V11.25H13.75C14.0815 11.25 14.3995 11.1183 14.6339 10.8839C14.8683 10.6495 15 10.3315 15 10C15 9.66848 14.8683 9.35054 14.6339 9.11612C14.3995 8.8817 14.0815 8.75 13.75 8.75Z"
      />
    </svg>
  )
}

function MenuDotsIcon() {
  return (
    <svg width={4.16663} height={20} viewBox="0 0 4.16663 20" fill="none" aria-hidden="true">
      <path
        fill="currentColor"
        fillOpacity={0.5}
        d="M2.08331 4.16664C3.2339 4.16664 4.16663 3.23391 4.16663 2.08332C4.16663 0.932734 3.2339 0 2.08331 0C0.932731 0 0 0.932734 0 2.08332C0 3.23391 0.932731 4.16664 2.08331 4.16664Z"
      />
      <path
        fill="currentColor"
        fillOpacity={0.5}
        d="M2.08331 12.0833C3.2339 12.0833 4.16663 11.1506 4.16663 10C4.16663 8.84942 3.2339 7.91669 2.08331 7.91669C0.932731 7.91669 0 8.84942 0 10C0 11.1506 0.932731 12.0833 2.08331 12.0833Z"
      />
      <path
        fill="currentColor"
        fillOpacity={0.5}
        d="M2.08331 20C3.2339 20 4.16663 19.0673 4.16663 17.9167C4.16663 16.7661 3.2339 15.8334 2.08331 15.8334C0.932731 15.8334 0 16.7661 0 17.9167C0 19.0673 0.932731 20 2.08331 20Z"
      />
    </svg>
  )
}

/**
 * One product row — image, brand/name (+ optional shade), "⋮" menu. Same
 * visual language as ProductCard.tsx (same size/radius/spacing/type
 * tokens), but not that component itself: the trailing affordance here is
 * a non-functional menu button, not ProductCard's checkbox, which is a
 * genuinely different piece of behavior, not a restyle.
 */
function MyProductRow({ product, onMenuClick }: { product: Product; onMenuClick: () => void }) {
  return (
    <div className="flex w-full items-start gap-4">
      <div className="h-[--size-product-image-h] w-[--size-product-image-w] shrink-0 overflow-hidden rounded-[--radius-image] border-[0.5px] border-[--color-border-hairline] bg-[--color-image-placeholder]">
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
          onClick={onMenuClick}
          aria-label={`More options for ${product.brand} ${product.name}`}
          className={`flex shrink-0 items-center justify-center p-2 ${product.shade ? 'self-start' : ''}`}
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
 * tapped. My Products itself (the list/navigation) is fully real.
 */
export function MyProductsScreen({ onClose }: MyProductsScreenProps) {
  const [toastOpen, showToast, hideToast] = useToast()
  const { ref: scrollerRef, atEnd, onScroll } = useAtScrollEnd<HTMLDivElement>()
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
            className="text-[20px] tracking-[-0.4px]"
            style={{ color: 'var(--color-info-overlay-heading)', fontWeight: 'var(--font-weight-medium)' }}
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
          className="mt-4 flex w-full flex-col gap-10 rounded-[--radius-card] bg-[--color-surface] px-[--space-sm] pb-10 pt-[--space-sm] shadow-[--shadow-card]"
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
    </div>
  )
}
