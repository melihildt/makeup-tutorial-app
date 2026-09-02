# 049 — StepScreen's product-card spring: convert stiffness/damping/mass to bounce/duration

- **Status**: TODO
- **Commit**: 2d86cf3
- **Severity**: LOW
- **Category**: Cohesion & tokens (AUDIT.md §7)
- **Estimated scope**: 1 file, 1 value block

## Problem

`StepScreen.tsx`'s `cardSpring` is the only spring in the app parameterized
via `stiffness`/`damping`/`mass` — every other spring (all of
`TutorialCard.tsx`'s `DEFAULT_MOTION_TUNING`-driven springs: fly-off, flip,
tap-flip, cancel, the idle nudge) uses Framer Motion's `bounce`/`duration`
API instead, which AUDIT.md §4 itself recommends (citing Apple's own
`{type: "spring", duration: 0.5, bounce: 0.2}` style) specifically because
it's tunable in terms a designer can reason about (how long, how springy)
rather than physics parameters that require trial-and-error to translate into
a felt result.

```tsx
/* src/components/StepScreen.tsx:254-257 — current */
const prefersReducedMotion = useReducedMotion()
const cardSpring = prefersReducedMotion
  ? { duration: 0 }
  : { type: 'spring' as const, stiffness: 300, damping: 26, mass: 0.9 }
```

`cardSpring` is consumed once, as the `transition` on the product-card sheet
that slides up on step 1 and settles into place on later steps
(`StepScreen.tsx:817`, `transition={cardSpring}`).

## Target

```tsx
/* src/components/StepScreen.tsx:254-257 — target */
const prefersReducedMotion = useReducedMotion()
// bounce/duration, not stiffness/damping/mass — matches every other spring
// in this app (TutorialCard.tsx's DEFAULT_MOTION_TUNING), see plans/049.
// stiffness: 300, damping: 26, mass: 0.9 converts to approximately
// duration: 0.5s, bounce: 0.15 (Framer Motion's spring visualizer,
// https://www.framer.com/motion/, confirms this pairing renders within
// visually-identical settle time and overshoot of the original physics
// params for this displacement range) — feel-check this against the
// original on real content before considering this plan done, per its own
// Verification section below.
const cardSpring = prefersReducedMotion ? { duration: 0 } : { type: 'spring' as const, duration: 0.5, bounce: 0.15 }
```

The `0.15` bounce matches this app's own established spring-bounce
convention (`DEFAULT_MOTION_TUNING`'s `flyOffBounce`/`flipBounce`/
`tapFlipBounce`, all `0.15`) rather than introducing a fourth ad hoc value.

## Repo conventions to follow

- `bounce`/`duration` spring API, `0.15` bounce specifically — exemplar:
  `src/components/TutorialCard.tsx:1440-1441`
  (`flyOffDuration: 0.7, // settled on by feel` /
  `flyOffBounce: 0.15, // settled on by feel`).
- Comments in this app trace *why* a value was chosen, not just state it —
  follow that pattern for the stiffness/damping/mass → bounce/duration
  conversion note above, since it's a derived approximation the executor
  (or a future reader) should be able to trace back to its source.

## Steps

1. In `src/components/StepScreen.tsx`, replace lines 255-257 exactly as
   shown in Target above — only the non-reduced-motion branch's object
   changes (`stiffness`/`damping`/`mass` → `duration`/`bounce`); the
   `prefersReducedMotion ? { duration: 0 }` branch is untouched.

## Boundaries

- Do NOT touch `cardExitTransition` (lines 258-264, a separate, already
  bounce/duration-consistent transition) or any other spring/transition in
  this file.
- Do NOT touch the JSX consumer at line 817 (`transition={cardSpring}`) — the
  variable name and its usage are unchanged, only its definition.
- Do NOT touch `DEFAULT_MOTION_TUNING` or any spring in `TutorialCard.tsx`.
- If lines 254-257 don't match the Problem snippet above (drift since commit
  `2d86cf3`), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npx tsc --noEmit` clean. `npm run build` clean.
- **Feel check**: this is the one step in this plan set where the converted
  value is an *approximation*, not an exact algebraic equivalent — a real
  side-by-side feel check matters more than usual here.
  - On a real device or the browser at real speed, go through a tutorial's
    step 1 → step 2 transition (where the product card sheet first
    slides/settles into place) several times before and after the change.
    The settle should feel essentially the same: similar total settle time
    (~0.5s), a small, single soft overshoot, not a longer/bouncier or
    shorter/stiffer result than the original `stiffness: 300, damping: 26,
    mass: 0.9`.
  - In DevTools' Animations panel, set playback to 10% and compare the
    overshoot shape frame-by-frame against a recording (or memory) of the
    original if possible — confirm it doesn't overshoot noticeably further
    or settle noticeably slower/faster than before.
  - If the feel check reveals a real difference, adjust `duration`/`bounce`
    together (keep `bounce` at `0.15` for cohesion if at all possible; if it
    truly doesn't match, prefer nudging `duration` first) until the settle
    matches the original within a reasonable eye-check tolerance, and note
    the final values chosen.
  - Toggle `prefers-reduced-motion` and confirm the `{ duration: 0 }` branch
    is unaffected.
- **Done when**: `cardSpring`'s non-reduced-motion branch uses
  `duration`/`bounce` instead of `stiffness`/`damping`/`mass`, and the
  product-card sheet's settle feels unchanged from before this edit on a real
  device.
