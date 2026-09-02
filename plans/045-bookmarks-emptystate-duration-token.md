# 045 — BookmarksScreen EmptyState: trace its 0.3s duration to a real token

- **Status**: TODO
- **Commit**: 2d86cf3
- **Severity**: LOW
- **Category**: Cohesion & tokens (AUDIT.md §7)
- **Estimated scope**: 1 file, 1 line

## Problem

`BookmarksScreen.tsx`'s `EmptyState` settle-in animation uses `duration: 0.3`
(reduced-motion branch: `0.2`). `0.2` correctly mirrors `--duration-base`, but
`0.3` doesn't match any of this app's five duration tokens
(`--duration-instant` 150ms, `--duration-base` 200ms, `--duration-layout`
350ms, `--duration-shimmer` 350ms, `--duration-step-content` 280ms). The
surrounding comment defends *why* this element animates at all (a rare,
first-time moment worth a beat of polish) but never explains the specific
`0.3` value.

```tsx
/* src/components/BookmarksScreen.tsx:229-237 — current */
function EmptyState() {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      className="flex flex-1 flex-col items-center justify-center gap-3 px-10 text-center"
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: 'scale(0.97)' }}
      animate={{ opacity: 1, transform: 'scale(1)' }}
      transition={{ duration: reduceMotion ? 0.2 : 0.3, ease: EASE_OUT_QUART }}
    >
```

## Target

```tsx
/* src/components/BookmarksScreen.tsx:236 — target */
      transition={{ duration: reduceMotion ? 0.2 : 0.35, ease: EASE_OUT_QUART }}
```

`0.35` = `--duration-layout` — the closest existing token to the current
`0.3`, and the correct semantic fit: AUDIT.md's duration budgets put
first-time/rare settle-ins in the same "larger layout/content change" bucket
`--duration-layout` already covers elsewhere in this app (e.g. Toast's own
banner entrance, `Toast.tsx:93`, traces to this exact token for the same
"rare-ish surface entrance" reasoning). The reduced-motion branch (`0.2`,
already `--duration-base`) is untouched.

## Repo conventions to follow

- Every other duration literal in this codebase that isn't `0`, a
  `MotionTuning` "settled on by feel" field, or an intentional outlier
  (documented as such) traces to one of the five tokens in `tokens.css`.
  Exemplar: `Toast.tsx:87-92`'s own comment explicitly walks through why its
  `0.35` is `--duration-layout`, not an arbitrary number — use the same
  reasoning style if adding a comment here.
- If plan 044 (shared `DURATION` JS constant) is applied to this codebase
  before or alongside this plan, reference `DURATION.layout` instead of the
  literal `0.35` — check whether `src/components/BookmarksScreen.tsx` already
  imports `DURATION` from `./TutorialCard` before writing the literal.

## Steps

1. In `src/components/BookmarksScreen.tsx`, on line 236, replace `0.3` with
   `0.35`. Leave `reduceMotion ? 0.2 : ...` and `ease: EASE_OUT_QUART`
   untouched.
2. Optionally add a short comment tracing the value the way `Toast.tsx:87-92`
   does, e.g.: `// 0.35 = --duration-layout — first-time/rare settle-in,
   same bucket Toast's own banner entrance uses.`

## Boundaries

- Do NOT touch the `reduceMotion` branch (`0.2`) or any other prop on this
  `motion.div`.
- Do NOT touch any other `EmptyState`-like component in other files — this
  is specific to `BookmarksScreen.tsx`'s own empty state.
- If line 236 doesn't match the Problem snippet above (drift since commit
  `2d86cf3`), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npx tsc --noEmit` clean. `npm run build` clean.
- **Feel check**: open Bookmarks with zero saved looks (or clear all saves)
  to trigger `EmptyState`.
  - The settle-in should feel marginally slower/calmer than before (0.3s →
    0.35s is a subtle 50ms difference) — not a visible regression, just
    slightly more deliberate.
  - In DevTools' Animations panel, set playback to 10% and confirm the fade
    + scale-in still completes cleanly with no stutter.
  - Toggle `prefers-reduced-motion` and confirm the `0.2`s fade-only branch
    is unaffected.
- **Done when**: line 236 reads `0.35` instead of `0.3`, and the empty state
  entrance still looks correct.
