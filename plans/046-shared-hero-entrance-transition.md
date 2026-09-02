# 046 — Extract InfoOverlay/ProductDetailOverlay's duplicated hero-entrance transition to one shared constant

- **Status**: TODO
- **Commit**: 2d86cf3
- **Severity**: LOW
- **Category**: Cohesion & tokens (AUDIT.md §7)
- **Estimated scope**: 2 files (edit) + 1 file (new export, likely TutorialCard.tsx)

## Problem

`InfoOverlay.tsx` (its own card entrance) and `ProductDetailOverlay.tsx` (its
hero-image entrance) each contain a character-for-character identical
`transition` object, hand-typed separately in both files with no shared
source:

```tsx
/* src/components/InfoOverlay.tsx:423-437 — current (relevant lines: 427, 431, 435) */
initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: 'scale(0.96)' }}
animate={{
  opacity: 1,
  transform: 'scale(1)',
  transition: { duration: reduceMotion ? 0.2 : 0.35, ease: EASE_OUT_QUART, delay: reduceMotion ? 0 : 0.06 },
}}
exit={
  reduceMotion
    ? { opacity: 0, transition: { duration: 0.2, ease: EASE_OUT_QUART, delay: 0 } }
    : {
        opacity: 0,
        transform: 'scale(0.96)',
        transition: { duration: 0.35, ease: EASE_OUT_QUART, delay: 0 },
      }
}
```

```tsx
/* src/components/ProductDetailOverlay.tsx:185-195 — current (relevant lines: 189, 193, 194) */
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
```

Neither file's comment defends this as intentionally kept separate rather
than shared — it's a plain duplication.

## Target

A shared helper exported once, next to `EASE_OUT_QUART`, that both files
import and spread:

```ts
/* src/components/TutorialCard.tsx — new, placed immediately after
   EASE_OUT_QUART (line 81) */
// Shared hero-entrance animate/exit transition — identical values were
// independently hand-typed in InfoOverlay.tsx (its own card entrance) and
// ProductDetailOverlay.tsx (its hero image entrance); a function rather than
// a plain object since the reduceMotion branch changes both the values and
// which properties are present, not just numbers within a fixed shape (see
// plans/046). 0.35 = --duration-layout, 0.2 = --duration-base, 0.06s delay =
// the deliberate stagger behind each surface's own backdrop fade-in.
export function heroEntranceTransition(reduceMotion: boolean) {
  return {
    animateTransition: { duration: reduceMotion ? 0.2 : 0.35, ease: EASE_OUT_QUART, delay: reduceMotion ? 0 : 0.06 },
    exit: reduceMotion
      ? { opacity: 0, transition: { duration: 0.2, ease: EASE_OUT_QUART, delay: 0 } }
      : { opacity: 0, transform: 'scale(0.96)', transition: { duration: 0.35, ease: EASE_OUT_QUART, delay: 0 } },
  } as const
}
```

Both call sites become:

```tsx
/* target, both InfoOverlay.tsx and ProductDetailOverlay.tsx */
initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: 'scale(0.96)' }}
animate={{
  opacity: 1,
  transform: 'scale(1)',
  transition: heroEntranceTransition(reduceMotion).animateTransition,
}}
exit={heroEntranceTransition(reduceMotion).exit}
```

## Repo conventions to follow

- Exact promotion pattern `EASE_OUT_QUART` already establishes
  (`src/components/TutorialCard.tsx:81`) — a single exported primitive,
  imported by every consumer via `import { EASE_OUT_QUART } from
  './TutorialCard'`. `heroEntranceTransition` follows the same file
  placement and import style; both target files already import
  `EASE_OUT_QUART` from `./TutorialCard`, so add `heroEntranceTransition` to
  that same existing import line in each.
- If plan 044 (shared `DURATION` constant) lands in this codebase, use
  `DURATION.layout`/`DURATION.base` inside `heroEntranceTransition` instead
  of the raw `0.35`/`0.2` literals — check whether `TutorialCard.tsx` already
  exports `DURATION` before writing this function, and reference it if so.

## Steps

1. In `src/components/TutorialCard.tsx`, immediately after the
   `EASE_OUT_QUART` export (or after `DURATION` if plan 044 already landed),
   add the `heroEntranceTransition` function exactly as shown in Target
   above.
2. In `src/components/InfoOverlay.tsx`:
   - Add `heroEntranceTransition` to the existing `import { EASE_OUT_QUART }
     from './TutorialCard'` line.
   - Replace lines 424-437 (the `animate`/`exit` props on the card-entrance
     `motion.div`) with the target shown above. Leave the `initial` prop
     (line 423) untouched — it's identical already and not part of the
     duplication being fixed.
3. In `src/components/ProductDetailOverlay.tsx`:
   - Add `heroEntranceTransition` to the existing `import { EASE_OUT_QUART }
     from './TutorialCard'` line.
   - Replace lines 186-195 (the `animate`/`exit` props on the hero-image
     `motion.div`) with the target shown above. Leave `initial` (line 185)
     untouched.

## Boundaries

- Do NOT touch either file's `initial` prop — both already read
  `reduceMotion ? { opacity: 0 } : { opacity: 0, transform: 'scale(0.96)' }`
  identically and are not part of this consolidation.
- Do NOT touch any other `motion.div` in either file (e.g. InfoOverlay's own
  backdrop, its mobile-drawer variant with `EASE_IN_OUT` around line 251-254
  — a structurally different transition, out of scope).
- Do NOT change any of the four numeric values (`0.35`, `0.2`, `0.06`, `0`) —
  this is a pure extraction, not a retune.
- If the cited lines in either file don't match the Problem snippets above
  (drift since commit `2d86cf3`), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npx tsc --noEmit` clean — confirms `heroEntranceTransition`'s
  return shape satisfies both call sites' `animate`/`exit` prop types. `npm
  run build` clean.
- **Feel check**: open InfoOverlay (home screen's info icon) and separately
  open a ProductDetailOverlay (tap a product row's image).
  - Both should animate in and out exactly as before — 0.35s scale+fade in
    with a 60ms stagger, 0.35s scale+fade out, no perceptible change.
  - In DevTools' Animations panel, set playback to 10% on each and confirm
    identical timing/curve to what plan 040-045's baseline behavior showed
    (unchanged by this plan).
  - Toggle `prefers-reduced-motion` and confirm both still use the
    opacity-only 0.2s branch with zero delay.
- **Done when**: both files import and use `heroEntranceTransition` instead
  of their own hand-typed copy, and neither surface's entrance/exit timing
  has changed.
