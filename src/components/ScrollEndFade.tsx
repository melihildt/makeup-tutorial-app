import { useLayoutEffect, useRef, useState, type UIEvent } from 'react'

/**
 * Tracks whether a scrollable element is scrolled all the way to its own
 * end — pairs with `<ScrollEndFade>` below. Extracted for screens that only
 * need this one piece of scroll state: attach `ref` to the actual
 * `overflow-y-auto` element and `onScroll` to that same element, then pass
 * `atEnd` to `<ScrollEndFade hidden={atEnd}>`.
 *
 * AllStepsView.tsx keeps its own equivalent check inline rather than
 * switching to this hook — there it's one piece of a combined handler that
 * also drives its sticky header's frost/hide-on-scroll behavior off the
 * same scroll event, and splitting that apart isn't worth the churn. Same
 * two details either way, though: <=1px tolerance for sub-pixel
 * scroll-position rounding (seen across browsers/zoom levels) rather than
 * requiring an exact 0, and a mount-time check (not just `onScroll`) for
 * content short enough to start already at its own end, since `onScroll`
 * never fires on its own without an actual scroll gesture.
 */
export function useAtScrollEnd<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [atEnd, setAtEnd] = useState(false)

  function check(el: T) {
    setAtEnd(el.scrollHeight - el.scrollTop - el.clientHeight <= 1)
  }

  useLayoutEffect(() => {
    if (ref.current) check(ref.current)
  }, [])

  function onScroll(e: UIEvent<T>) {
    check(e.currentTarget)
  }

  return { ref, atEnd, onScroll }
}

type ScrollEndFadeProps = {
  /** True once the scrollable content has nothing left below to hint at —
   *  from `useAtScrollEnd` above, or a screen's own equivalent state
   *  (AllStepsView.tsx). */
  hidden: boolean
  /** Horizontal inset + bottom-corner rounding, since those track whatever
   *  card this fade sits over. Defaults to the shape every current use
   *  site shares (a `--radius-card` card inset by `--space-sm`) — override
   *  for a differently-shaped card (e.g. AccountScreen's
   *  `--radius-account-card`, if it ever grows scrollable content). */
  className?: string
}

/**
 * Bottom scroll-hint gradient — fades a card's own surface color to
 * transparent, hinting there's more to scroll below, and fades itself out
 * once the content is scrolled all the way to its real end (so it doesn't
 * sit there as a stray band of gradient + rounded corner over content with
 * nothing left underneath it — the exact bug this guarded against when
 * first built, see git history). First built directly in AllStepsView.tsx
 * (docs/figma-allsteps-restyle.md); pulled out here once
 * MyProductsScreen.tsx needed the identical pattern, per the user's own
 * ask that it live as one reusable piece rather than a second hand-copied
 * version — `--gradient-scroll-end-fade` (tokens.css) + this component are
 * now the one shared source for it.
 *
 * Render as a sibling of the scrollable region, both children of the same
 * `relative` screen root — not inside the scroller itself. It needs to
 * stay pinned to the bottom of the screen regardless of scroll position,
 * with content scrolling underneath it, not scrolling away along with it.
 */
export function ScrollEndFade({ hidden, className = 'inset-x-[--space-sm] rounded-b-[--radius-card]' }: ScrollEndFadeProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute bottom-0 h-10 ${className}`}
      style={{
        background: 'var(--gradient-scroll-end-fade)',
        opacity: hidden ? 0 : 1,
        transition: 'opacity var(--duration-base) var(--ease-out-quart)',
      }}
    />
  )
}
