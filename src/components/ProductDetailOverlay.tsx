import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { EASE_OUT_QUART } from './TutorialCard'
import { HEADER_CHIP_STYLE } from './ScreenHeader'
import { CloseIcon } from './InfoOverlay'
import type { Product } from '../data/stepContent'

type ProductDetailOverlayProps = {
  /** Non-null opens the overlay for that product; null closes it. Not a
   *  separate `open` boolean — see `displayedProduct` below for why the
   *  content itself can't just read this prop directly. */
  product: Product | null
  onClose: () => void
}

/**
 * Product detail overlay — MyProductsScreen's own product rows open this
 * (Figma node 759:11483, a duplicate of the "Home/About" frame retitled
 * "Product Detail": same blurred-backdrop treatment, new content). Per the
 * user's own ask, reuses InfoOverlay.tsx's exact overlay mechanics rather
 * than a new pattern: real `backdrop-filter: blur()` over whatever's
 * genuinely rendered behind it (MyProductsScreen's own header/list here,
 * not Home — Figma's mock only shows Home behind because it duplicated
 * that screen's own template, the same "fake blur via a duplicated,
 * blurred layer" a static design tool has to resort to that InfoOverlay's
 * own module comment already explains), the same
 * --color-info-overlay-tint-top/-bottom and --blur-info-overlay-backdrop
 * tokens, the same fade transition, and the same header shape (muted title
 * + close chip).
 *
 * `displayedProduct` mirrors `product` but only ever updates to a non-null
 * value, and only *it* (never `product` directly) drives the rendered
 * content: gating on `product !== null` while also reading fields off
 * `product` inside the same conditional would blank the overlay's content
 * out on close in the same render that starts its exit fade — nothing left
 * for AnimatePresence to animate out. Keeping the last real product around
 * under a separate `open` check is what lets the fade-out actually show the
 * product it's closing, not a blank card.
 */
export function ProductDetailOverlay({ product, onClose }: ProductDetailOverlayProps) {
  const reduceMotion = useReducedMotion()
  const [displayedProduct, setDisplayedProduct] = useState(product)
  const open = product !== null

  useEffect(() => {
    if (product) setDisplayedProduct(product)
  }, [product])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-20 flex flex-col overflow-hidden md:rounded-2xl"
          style={{
            background:
              'linear-gradient(0deg, var(--color-info-overlay-tint-top) 25.235%, var(--color-info-overlay-tint-bottom) 84.117%)',
            backdropFilter: 'blur(var(--blur-info-overlay-backdrop))',
            WebkitBackdropFilter: 'blur(var(--blur-info-overlay-backdrop))',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.2 : 0.35, ease: EASE_OUT_QUART }}
        >
          {/* Header — identical shape/tokens to InfoOverlay's own (see its
              comment for the items-start/px-[--space-sm] reasoning) and to
              AccountScreen/MyProductsScreen's own title row. */}
          <div className="flex shrink-0 items-start justify-between px-[--space-sm] pt-[--space-2xs]">
            <p
              className="text-[20px] tracking-[-0.4px]"
              style={{ color: 'var(--color-info-overlay-heading)', fontWeight: 'var(--font-weight-medium)' }}
            >
              Product Detail
            </p>
            {/* "Close product detail", not just "Close" — unlike
                InfoOverlay (whose own "Close" never coexists with another
                element sharing that label), this overlay stays mounted
                over MyProductsScreen's own header, which has its own
                "Close" button for the whole screen. Two same-labeled
                controls live in the DOM at once whenever this is open, so
                the more specific label is what actually keeps them
                distinguishable (to a screen reader, not just visually). */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close product detail"
              className="header-icon-button flex size-[40px] shrink-0 items-center justify-center rounded-[--radius-filter-chip] border-[0.5px] border-solid"
              style={{ ...HEADER_CHIP_STYLE, color: 'var(--color-tutorial-card-text)' }}
            >
              <CloseIcon />
            </button>
          </div>

          {/* Centered in the remaining space, same technique as
              InfoOverlay's own card+links and HomeScreen's tutorial stack. */}
          <div className="flex flex-1 flex-col items-center justify-center gap-6 overflow-y-auto px-6 py-6">
            {displayedProduct && (
              <>
                {/* object-contain, not ProductCard/MyProductRow's
                    object-cover — this is a large single hero image, not a
                    small thumbnail crop, matching the design's own square
                    "Card" (node 759:11502). */}
                <div
                  className="relative size-[238px] shrink-0 overflow-hidden rounded-[24px] border border-solid"
                  style={{
                    borderColor: 'var(--color-border-hairline)',
                    boxShadow: '0px 0px 8px rgba(14, 11, 6, 0.03)',
                    background: 'var(--color-image-placeholder)',
                  }}
                >
                  {displayedProduct.image && (
                    <img src={displayedProduct.image} alt="" className="size-full object-contain" />
                  )}
                </div>
                <div className="flex w-full max-w-[238px] flex-col gap-[2px]">
                  <div
                    className="flex flex-col gap-[2px] text-[length:var(--font-size-product-name)] tracking-[--letter-spacing-tight] text-[--color-text-product]"
                  >
                    <p className="capitalize font-[--font-weight-semibold]">{displayedProduct.brand}</p>
                    <p className="font-[--font-weight-medium]">{displayedProduct.name}</p>
                  </div>
                  {displayedProduct.shade && (
                    <p className="text-[length:var(--font-size-product-sub)] font-[--font-weight-medium] tracking-[--letter-spacing-shade] text-[--color-text-primary] opacity-50">
                      {displayedProduct.shade}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
