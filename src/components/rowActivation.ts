import type { KeyboardEvent } from 'react'

/**
 * Props for a `<div role="button">` that should behave like a real button —
 * Enter/Space activation (with the Space-also-scrolls-the-page default
 * prevented, same as a native `<button>` handles for free), `aria-disabled`
 * + `tabIndex={-1}` when disabled — without actually being a `<button>`.
 * Every call site nests its own real `<button>` inside the row for a
 * second, independent action (a bookmark toggle, an un-save, a "⋮" menu),
 * and a `<button>` can't nest another `<button>` (invalid HTML, inconsistent
 * browser/AT behavior) — see each call site's own comment for the full
 * reasoning on why the row itself has to be a div instead.
 *
 * A plain prop-getter function, not a hook (no internal `useState`/
 * `useEffect` — it has no state of its own to hold across renders), so it's
 * exempt from the Rules of Hooks: fine to call conditionally, in a loop, or
 * skip entirely, same as any other function.
 *
 * Extracted (code review finding) from five near-identical hand-copies of
 * this exact block — TutorialLookCard/TutorialDetailCard/StartOverCard
 * (TutorialCard.tsx), MyProductRow (MyProductsScreen.tsx), and BookmarkRow
 * (BookmarksScreen.tsx) — after BookmarkRow's own comment explicitly
 * deferred this extraction "until a third near-identical row shows up";
 * five had shown up by the time of this review, past that threshold.
 *
 * `disabled` defaults to false — the two rows that never disable
 * (MyProductRow, BookmarkRow) just omit it, matching their prior behavior
 * byte-for-byte: `aria-disabled` renders as `undefined` (not rendered at
 * all) rather than `false` when not disabled, same as every call site's own
 * `disabled || undefined` did before this was extracted.
 */
export function getRoleButtonProps(onActivate: (() => void) | undefined, disabled = false) {
  return {
    role: 'button' as const,
    'aria-disabled': disabled || undefined,
    tabIndex: disabled ? -1 : 0,
    onClick: disabled ? undefined : onActivate,
    onKeyDown: disabled
      ? undefined
      : (e: KeyboardEvent) => {
          if (e.key !== 'Enter' && e.key !== ' ') return
          e.preventDefault()
          onActivate?.()
        },
  }
}
