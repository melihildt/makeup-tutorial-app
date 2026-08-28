# 025 — Fix Toast's entrance/exit duration to match a real token

- **Status**: DONE
- **Commit**: 75a7936
- **Severity**: LOW
- **Category**: Cohesion & tokens
- **Estimated scope**: 1 file — `src/components/Toast.tsx` (one duration value)

## Problem

`src/components/Toast.tsx:76`, the "Coming soon" toast's entrance/exit
transition:

```tsx
/* src/components/Toast.tsx:73-76 — current */
initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -16 }}
animate={{ opacity: 1, y: 0 }}
exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -16 }}
transition={{ duration: reduceMotion ? 0.15 : 0.3, ease: EASE_OUT_QUART }}
```

`tokens.css` defines exactly five durations (`--duration-instant: 150ms`,
`--duration-base: 200ms`, `--duration-step-content: 280ms`,
`--duration-layout: 350ms`, `--duration-shimmer: 350ms`). Every other
hand-typed Framer Motion duration in this codebase lands on one of these
exactly — `0.15` (`ProductDetailOverlay.tsx:143`, `StepScreen.tsx:264`),
`0.2` (`ProductDetailOverlay.tsx:143`, `InfoOverlay.tsx:250/399`), `0.35`
(`ProductDetailOverlay.tsx:144/403`, `StepScreen.tsx:743`,
`TutorialCard.tsx:2334`) — this codebase doesn't have a shared JS-array
duration constant the way `EASE_OUT_QUART` exists for easing (confirmed:
no `DURATION_*` export anywhere in `src/`), so "hand-typed value that
exactly matches a token's ms/1000" is itself the established convention,
not a shortcut around one.

Toast's own `0.3` is the single exception: it doesn't match any of the
five tokens. The reduced-motion branch right next to it (`0.15`) *does*
match `--duration-instant` exactly, which is what makes the full-motion
branch's stray `0.3` read as a typo (0.3 vs. 0.35) rather than a
deliberate in-between choice — nothing else in this file's own doc
comments argues for a bespoke duration here.

**Why it matters**: Toast's own doc comment (`Toast.tsx:42-55`) describes
it as "a real banner at the top of the screen" — the same category of
surface as `ProductDetailOverlay`'s sheet, which uses exactly `0.35`
(`--duration-layout`) for its own analogous entrance/exit. A drifted,
uncommented duration is a small thing on its own, but it's the one
loose thread in an otherwise fully token-traceable set of motion values
across the app.

## Target

```tsx
/* src/components/Toast.tsx:73-76 — target */
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
```

Only the `0.3` → `0.35` change and its new comment — no other prop on
this `motion.div` changes.

## Repo conventions to follow

- Hand-typed decimal-second durations that exactly mirror a `tokens.css`
  duration are the established pattern in this codebase (see the Problem
  section's citations) — there is no shared JS duration constant to
  import, unlike `EASE_OUT_QUART` for easing. Don't introduce one as part
  of this plan; that's a separate, larger refactor (analogous to
  `plans/006-consolidate-ease-out-quart-array.md`) this single-value fix
  doesn't need.
- `EASE_OUT_QUART` is already imported at the top of this file
  (`Toast.tsx:3`) and unchanged by this plan.

## Steps

1. In `src/components/Toast.tsx`, change the `transition` prop's `0.3` to
   `0.35` (current line 76), and add the one-line comment shown in
   **Target** above immediately before it.
2. Run `npx tsc -b` to confirm no type errors.

## Boundaries

- Do NOT touch the reduced-motion branch's `0.15` — it already matches
  `--duration-instant` and is correct as-is.
- Do NOT touch `y: -16`, the `EASE_OUT_QUART` easing, or `TOAST_DURATION_MS`
  (the unrelated 4000ms auto-dismiss timer in `useToast`, line 6) — none of
  those are part of this finding.
- Do NOT add a shared duration constant/token-mirror module as part of this
  plan (see Repo conventions above) — out of scope for a one-value fix.
- If the current code doesn't match what's quoted above (drift since commit
  75a7936), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npx tsc -b` — expect no errors. `grep -n "duration:" src/components/Toast.tsx` — expect `reduceMotion ? 0.15 : 0.35`.
- **Feel check**: trigger the toast (e.g. MyProductsScreen's "+" button, or
  AccountScreen's Bookmarks row) and confirm the banner still slides down
  and fades in smoothly — the 50ms difference (0.3s → 0.35s) should be
  imperceptible as a "changed" feel, this is a cohesion fix, not a retune.
  In DevTools, set Animations playback to 10% and confirm the entrance
  takes visibly longer than before only in slow-motion, not at full speed.
  Toggle `prefers-reduced-motion` and confirm the toast still fades in/out
  at the unchanged `0.15`/`--duration-instant` speed with no vertical
  movement.
- **Done when**: `Toast.tsx` has no duration value left that doesn't trace
  to a real `tokens.css` duration, and the toast's visible feel is
  unchanged from before this plan.
