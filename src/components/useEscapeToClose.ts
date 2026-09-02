import { useEffect } from 'react'

/**
 * Escape-to-close for a dismissible overlay/screen — accessibility audit
 * (2026-09-02, finding #7): every overlay/screen in this app already has a
 * visible Close (or Back) control and correctly `inert`s whatever's behind
 * it (see each call site's own comment on that), but none of them wired the
 * Escape key, which the WAI-ARIA dialog pattern — and keyboard users in
 * general — expect to work as an alternative to reaching for the close
 * button. Extracted straight to a shared hook rather than five near-
 * identical `useEffect(() => { ... }, [open])` copies: this file's own
 * `getRoleButtonProps` precedent (rowActivation.ts) already deferred that
 * exact call until "a third near-identical [thing] shows up" — this one has
 * five call sites already (InfoOverlay, ProductDetailOverlay, AccountScreen,
 * MyProductsScreen, BookmarksScreen), past that threshold from the start.
 *
 * `active` defaults to true — AccountScreen/MyProductsScreen/BookmarksScreen
 * are swapped in/out wholesale by App.tsx's own router rather than toggled
 * via an `open` boolean, so for them "mounted" already means "showing," and
 * they can just call `useEscapeToClose(onClose)` with no second argument.
 * InfoOverlay/ProductDetailOverlay stay mounted across their own open/closed
 * states (Framer Motion needs the exit animation to still play), so they
 * pass their own `open` condition explicitly rather than relying on mount
 * timing.
 */
export function useEscapeToClose(onClose: () => void, active = true) {
  useEffect(() => {
    if (!active) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [active, onClose])
}
