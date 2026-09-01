import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { EASE_OUT_QUART } from './TutorialCard'
import { HEADER_CHIP_STYLE } from './ScreenHeader'
import { CloseIcon } from './icons'
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

  // Shade/Category/Purchase-on info rows (node 896:10489-896:10501,
  // plans/037-product-detail-info-rows.md) — Category is real data
  // (Product.category already existed, just wasn't shown here); Purchase
  // on uses Product.purchasedAt, placeholder data added alongside this
  // section since no real purchase-tracking feature exists yet. Shade
  // reuses the existing Product.shade field, just moved into this row
  // layout instead of its old standalone muted line. Built as a list and
  // filtered rather than three separate conditionals so "is this the
  // first row" (for the shared top border) doesn't have to be
  // hand-tracked across three near-identical blocks.
  const detailRows = displayedProduct
    ? (
        [
          displayedProduct.shade ? { label: 'Shade', value: displayedProduct.shade } : null,
          { label: 'Category', value: displayedProduct.category },
          displayedProduct.purchasedAt ? { label: 'Purchase on', value: displayedProduct.purchasedAt } : null,
        ] as const
      ).filter((row): row is { label: string; value: string } => row !== null)
    : []

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          // md:py-6 — see InfoOverlay.tsx's own comment on this same class:
          // without it this overlay's header sits flush at the very top on
          // desktop instead of matching MyProductsScreen's own 24px inset
          // (inherited from copying InfoOverlay's structure — the bug was
          // already there, just unnoticed on that screen too until a real
          // ≥768px check).
          className="absolute inset-0 z-20 flex flex-col overflow-hidden md:rounded-2xl md:py-6"
          style={{
            background:
              // 180deg, not 0deg — same reversed-direction bug as
              // InfoOverlay.tsx's own copy of this line (fixed alongside
              // this one); see that file's comment for the full reasoning.
              'linear-gradient(180deg, var(--color-info-overlay-tint-top) 25.235%, var(--color-info-overlay-tint-bottom) 84.117%)',
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
              style={{
                fontFamily: 'var(--font-family-serif-card)',
                fontSize: 'var(--font-size-title-serif)',
                letterSpacing: 'var(--letter-spacing-title-serif)',
                color: 'var(--color-info-overlay-heading)',
                fontWeight: 'var(--font-weight-medium)',
              }}
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
              // --color-info-overlay-heading, not --color-tutorial-card-text
              // — see InfoOverlay.tsx's own close-button comment for why.
              style={{ ...HEADER_CHIP_STYLE, color: 'var(--color-info-overlay-heading)' }}
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
                    "Card" (node 759:11502).

                    Settle-in scale+fade, staggered slightly behind the
                    backdrop — copied verbatim from InfoOverlay.tsx's own
                    "About" card (see its own comment for why `transition`
                    is embedded per-target rather than shared: a shared prop
                    would also delay the *exit*, confirmed there via
                    getAnimations()). find-animation-opportunities pass:
                    this overlay reused InfoOverlay's backdrop but had
                    dropped this half of the pattern, so the image just
                    materialized flatly with the backdrop instead of
                    settling into place after it. Text below stays plain,
                    matching InfoOverlay's own Portfolio/Email links (also
                    un-animated below its card) — only the one hero visual
                    gets the treatment, not everything on screen. */}
                <motion.div
                  className="relative size-[282px] shrink-0 overflow-hidden rounded-[24px] border border-solid"
                  style={{
                    borderColor: 'var(--color-border-hairline)',
                    // V6 (plans/036-product-detail-hero-image-treatment.md):
                    // Figma's "New" section shows a distinct shadow value
                    // here (24px blur, 0 spread) — not --shadow-filter-chip
                    // (8px blur) or --shadow-card-elevated (24px/6px).
                    boxShadow: 'var(--shadow-product-detail-image)',
                    background: 'var(--color-image-placeholder)',
                  }}
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: 'scale(0.96)' }}
                  animate={{
                    opacity: 1,
                    transform: 'scale(1)',
                    transition: { duration: reduceMotion ? 0.2 : 0.35, ease: EASE_OUT_QUART, delay: reduceMotion ? 0 : 0.06 },
                  }}
                  exit={
                    reduceMotion
                      ? { opacity: 0, transition: { duration: 0.2, ease: EASE_OUT_QUART, delay: 0 } }
                      : { opacity: 0, transform: 'scale(0.96)', transition: { duration: 0.35, ease: EASE_OUT_QUART, delay: 0 } }
                  }
                >
                  {displayedProduct.image && (
                    <img src={displayedProduct.image} alt="" className="size-full object-contain" />
                  )}
                </motion.div>
                <div className="flex w-full max-w-[282px] flex-col gap-[8px]">
                  <div className="flex flex-col gap-[2px]">
                    <p
                      className="capitalize"
                      style={{
                        fontSize: 'var(--font-size-product-name)',
                        fontWeight: 'var(--font-weight-semibold)',
                        // 0.14px — positive, confirmed on the pull (node
                        // 896:10487). Not --letter-spacing-tight (-0.14px,
                        // ProductCard/MyProductRow's own brand-line
                        // tracking): same file convention, different sign,
                        // a genuinely different value for this headline
                        // treatment, not a typo carried over.
                        letterSpacing: '0.14px',
                        color: 'var(--color-tutorial-card-text)',
                      }}
                    >
                      {displayedProduct.brand}
                    </p>
                    {/* Product name as its own headline (node 896:10488) —
                        no longer sized/colored to match the brand line
                        above it, the same serif treatment every screen
                        title in this app now shares (plans/030, /035). */}
                    <p
                      style={{
                        fontFamily: 'var(--font-family-serif-card)',
                        fontSize: 'var(--font-size-product-detail-title)',
                        letterSpacing: 'var(--letter-spacing-product-detail-title)',
                        color: 'var(--color-tutorial-card-text)',
                      }}
                    >
                      {displayedProduct.name}
                    </p>
                  </div>
                  {/* Shade/Category/Purchase-on rows (node 896:10489-
                      896:10501) — see detailRows' own comment above for why
                      this is a mapped list instead of three hand-written
                      blocks. First row gets a top border too (closing off
                      the block from the name above it); every row gets its
                      own bottom border. */}
                  <div className="flex flex-col">
                    {detailRows.map(({ label, value }, index) => (
                      <div
                        key={label}
                        className="flex items-center justify-between py-4"
                        style={{
                          borderTop: index === 0 ? '0.5px solid var(--color-detail-row-border)' : undefined,
                          borderBottom: '0.5px solid var(--color-detail-row-border)',
                        }}
                      >
                        <p
                          className="uppercase"
                          style={{
                            fontSize: 'var(--font-size-detail-row-label)',
                            letterSpacing: 'var(--letter-spacing-detail-row-label)',
                            fontWeight: 'var(--font-weight-medium)',
                            color: 'var(--color-info-overlay-heading)',
                          }}
                        >
                          {label}
                        </p>
                        <p
                          style={{
                            fontSize: 'var(--font-size-detail-row-value)',
                            letterSpacing: 'var(--letter-spacing-detail-row-value)',
                            fontWeight: 'var(--font-weight-medium)',
                            color: 'var(--color-tutorial-card-text)',
                          }}
                        >
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
