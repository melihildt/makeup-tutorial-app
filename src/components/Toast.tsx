import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { EASE_OUT_QUART } from './TutorialCard'
import { CloseIcon } from './icons'

const TOAST_DURATION_MS = 4000

/**
 * One toast, one owner: each screen that can trigger it (AccountScreen's
 * Bookmarks row; MyProductsScreen's "+" and every row's "⋮") holds its own
 * `useToast()` instead of a shared global store — only one of those screens
 * is ever mounted at a time (see App.tsx's `Screen` union), so there's
 * nothing to coordinate across them. Re-triggering while already open just
 * restarts the auto-dismiss clock rather than stacking a second toast,
 * since every trigger on a given screen shows the exact same message.
 */
export function useToast(durationMs = TOAST_DURATION_MS): [boolean, () => void, () => void] {
  const [open, setOpen] = useState(false)
  const timeoutRef = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timeoutRef.current), [])

  function show() {
    setOpen(true)
    window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => setOpen(false), durationMs)
  }

  function hide() {
    window.clearTimeout(timeoutRef.current)
    setOpen(false)
  }

  return [open, show, hide]
}

type ToastProps = {
  open: boolean
  onClose: () => void
}

/**
 * "Coming soon" toast — replaces the earlier anchored-pill tap feedback
 * (AccountScreen.tsx's Bookmarks row, MyProductsScreen.tsx's "+"/"⋮") per
 * the user's own follow-up ask, once they'd seen that version: a real
 * banner at the top of the screen, dismissible via its own close button,
 * not just a pill hovering next to whatever was tapped.
 *
 * Positioned `absolute` against the screen's own root (each of
 * AccountScreen/MyProductsScreen's root divs is already `relative`), not
 * `fixed` against the viewport — same reasoning as every other overlay in
 * this app (InfoOverlay, the screen-transition frame itself): the app's
 * "screen" is that 402px-wide column, which on desktop is a rounded card
 * smaller than the real browser viewport, so `fixed` would place this
 * against the wrong box there.
 */
export function Toast({ open, onClose }: ToastProps) {
  const reduceMotion = useReducedMotion()

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center px-[--space-sm] pt-[--space-2xs]">
      <AnimatePresence>
        {open && (
          <motion.div
            role="status"
            aria-live="polite"
            className="pointer-events-auto flex w-full max-w-[370px] items-start gap-3 rounded-[--radius-filter-chip] border border-solid p-4"
            style={{
              background: 'var(--color-surface)',
              borderColor: 'var(--color-border-hairline)',
              boxShadow: 'var(--shadow-card)',
            }}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -16 }}
            // 0.35 = --duration-layout (tokens.css) — this banner is a "larger
            // layout/content change" surface, the same category ProductDetailOverlay
            // uses --duration-layout for on its own sheet entrance/exit
            // (ProductDetailOverlay.tsx:144/403). The reduced-motion branch's 0.15
            // already matches --duration-instant exactly; this was the one duration
            // in the app that didn't trace to a real token.
            transition={{ duration: reduceMotion ? 0.15 : 0.35, ease: EASE_OUT_QUART }}
          >
            <span
              aria-hidden="true"
              className="flex size-6 shrink-0 items-center justify-center rounded-full text-[13px] leading-none"
              style={{ background: 'var(--color-toast-accent)', color: '#fff', fontWeight: 'var(--font-weight-semibold)' }}
            >
              i
            </span>
            <div className="flex-1 pt-[1px]">
              <p
                className="text-[14px]"
                style={{ color: 'var(--color-tutorial-card-text)', fontWeight: 'var(--font-weight-semibold)' }}
              >
                Coming soon
              </p>
              <p className="mt-[2px] text-[13px]" style={{ color: 'var(--color-text-product)' }}>
                This feature is still in the discovery phase — it'll be added soon.
              </p>
            </div>
            {/* CloseIcon is a fixed 20x20 native asset (see InfoOverlay.tsx/
                ScreenHeader.tsx's own comments on why icons render at their
                real viewBox size rather than being forced smaller via CSS —
                a past source of visible distortion in this app) — sized
                here by shrinking the button's own padding, not the icon. */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Dismiss"
              className="header-icon-button -m-1 flex shrink-0 items-center justify-center p-1"
              // --color-info-overlay-heading, not --color-tutorial-card-text
              // — see InfoOverlay.tsx's own close-button comment for why.
              // No direct Figma pull for Toast's own close ✕ confirms this,
              // but it's the same shared CloseIcon glyph as every other
              // instance, so kept consistent rather than left as the one
              // outlier.
              style={{ color: 'var(--color-info-overlay-heading)' }}
            >
              <CloseIcon />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
