# 044 — Promote a shared `DURATION` JS constant, mirroring tokens.css, like `EASE_OUT_QUART`

- **Status**: TODO
- **Commit**: 2d86cf3
- **Severity**: LOW
- **Category**: Cohesion & tokens (AUDIT.md §7)
- **Estimated scope**: 6 files, 16 call sites (1 new export + 15 literal-to-reference swaps)

## Problem

`EASE_OUT_QUART` (`src/components/TutorialCard.tsx:81`) is exported once and
imported everywhere it's needed — a real "CSS token → shared JS constant"
promotion. Durations have no equivalent: every Framer Motion call site that
means to mirror `--duration-instant` (150ms), `--duration-base` (200ms), or
`--duration-layout` (350ms) instead hand-types the raw number (`0.15`, `0.2`,
`0.35`), usually — but not consistently — with a comment tracing it back to
the token. That's 16 separate literals across 6 files that must be kept in
sync by hand if any of these three durations ever changes.

```ts
/* src/styles/tokens.css:123-125 — current, for reference */
--duration-instant: 150ms; /* button press, toggle */
--duration-base: 200ms;    /* hover, small state changes */
--duration-layout: 350ms;  /* larger layout/content changes */
```

Every current literal duration that mirrors one of these three tokens:

| # | Location | Current literal |
|---|---|---|
| 1 | `src/App.tsx:347` | `duration: reduceMotion ? 0.2 : 0.35` |
| 2 | `src/components/BookmarksScreen.tsx:124` | `duration: reduceMotion ? 0.15 : 0.2` |
| 3 | `src/components/ProductDetailOverlay.tsx:99` | `duration: reduceMotion ? 0.2 : 0.35` |
| 4 | `src/components/ProductDetailOverlay.tsx:189` | `duration: reduceMotion ? 0.2 : 0.35` (delay stays literal — see plan 046) |
| 5 | `src/components/ProductDetailOverlay.tsx:193` | `duration: 0.2` |
| 6 | `src/components/ProductDetailOverlay.tsx:194` | `duration: 0.35` |
| 7 | `src/components/StepScreen.tsx:264` | `duration: 0.15` (inside `cardExitTransition`) |
| 8 | `src/components/InfoOverlay.tsx:251` | `duration: 0.2` |
| 9 | `src/components/InfoOverlay.tsx:254` | `duration: 0.2` |
| 10 | `src/components/InfoOverlay.tsx:329` | `duration: reduceMotion ? 0.2 : 0.35` |
| 11 | `src/components/InfoOverlay.tsx:427` | `duration: reduceMotion ? 0.2 : 0.35` (delay stays literal — see plan 046) |
| 12 | `src/components/InfoOverlay.tsx:431` | `duration: 0.2` |
| 13 | `src/components/InfoOverlay.tsx:435` | `duration: 0.35` |
| 14 | `src/components/Toast.tsx:93` | `duration: reduceMotion ? 0.15 : 0.35` |
| 15 | `src/components/TutorialCard.tsx:2486` | `duration: 0.2` |
| 16 | `src/components/TutorialCard.tsx:2545` | `duration: 0.35` |

## Target

A new exported `DURATION` object next to `EASE_OUT_QUART`:

```ts
/* src/components/TutorialCard.tsx — new, placed immediately after the
   existing EASE_OUT_QUART export (line 81) */
// Mirrors tokens.css's --duration-instant/--duration-base/--duration-layout
// (seconds, since Framer Motion's `duration` reads seconds not ms) — the
// same "token → shared JS const" promotion EASE_OUT_QUART above already
// gets, extended to cover durations too (see plans/044). Only the three
// durations that are actually reused as literals across multiple files are
// included here — --duration-shimmer and --duration-step-content are each
// consumed purely through CSS `var(...)`, never hand-typed as a JS number
// anywhere, so they don't need a JS mirror.
export const DURATION = {
  instant: 0.15, // --duration-instant (150ms)
  base: 0.2, // --duration-base (200ms)
  layout: 0.35, // --duration-layout (350ms)
} as const
```

Every site in the Problem table then imports and references it instead of
retyping the number. Two representative before/afters:

```tsx
/* src/components/Toast.tsx:93 — before */
transition={{ duration: reduceMotion ? 0.15 : 0.35, ease: EASE_OUT_QUART }}
/* after */
transition={{ duration: reduceMotion ? DURATION.instant : DURATION.layout, ease: EASE_OUT_QUART }}
```

```tsx
/* src/components/ProductDetailOverlay.tsx:189 — before */
transition: { duration: reduceMotion ? 0.2 : 0.35, ease: EASE_OUT_QUART, delay: reduceMotion ? 0 : 0.06 },
/* after */
transition: { duration: reduceMotion ? DURATION.base : DURATION.layout, ease: EASE_OUT_QUART, delay: reduceMotion ? 0 : 0.06 },
```

## Repo conventions to follow

- Exact promotion pattern already established by `EASE_OUT_QUART`
  (`src/components/TutorialCard.tsx:81`, `export const EASE_OUT_QUART = [0.25,
  1, 0.5, 1] as const`) — a single exported `const`, imported by every
  consumer via `import { EASE_OUT_QUART } from './TutorialCard'`. `DURATION`
  follows the same file placement (TutorialCard.tsx, since that's already
  the established home for shared motion primitives) and the same import
  style.
- Every file in the Problem table already imports `EASE_OUT_QUART` from
  `./TutorialCard` (confirm each site still does before editing) — add
  `DURATION` to the same existing import statement rather than a new one.

## Steps

1. In `src/components/TutorialCard.tsx`, immediately after the
   `EASE_OUT_QUART` export (line 81), add the `DURATION` export exactly as
   shown in Target above.
2. In `src/App.tsx`, add `DURATION` to the existing `EASE_OUT_QUART` import
   from `./components/TutorialCard` (adjust the relative path only if the
   existing import differs from that). On line 347, replace `reduceMotion ?
   0.2 : 0.35` with `reduceMotion ? DURATION.base : DURATION.layout`.
3. In `src/components/BookmarksScreen.tsx`, add `DURATION` to the existing
   `EASE_OUT_QUART` import from `./TutorialCard`. On line 124, replace
   `reduceMotion ? 0.15 : 0.2` with `reduceMotion ? DURATION.instant :
   DURATION.base`. Line 236 (the separate `0.3` finding) is out of scope —
   see plan 045, do not touch it here.
4. In `src/components/ProductDetailOverlay.tsx`, add `DURATION` to the
   existing `EASE_OUT_QUART` import from `./TutorialCard`.
   - Line 99: replace `reduceMotion ? 0.2 : 0.35` with `reduceMotion ?
     DURATION.base : DURATION.layout`.
   - Line 189: replace `reduceMotion ? 0.2 : 0.35` with `reduceMotion ?
     DURATION.base : DURATION.layout` — leave the `delay:` value on this
     same line untouched (that's plan 046's scope).
   - Line 193: replace `duration: 0.2` with `duration: DURATION.base`.
   - Line 194: replace `duration: 0.35` with `duration: DURATION.layout`.
5. In `src/components/StepScreen.tsx`, add `DURATION` to the existing
   `EASE_OUT_QUART` import from `./TutorialCard`. On line 264, replace
   `duration: 0.15` with `duration: DURATION.instant` (inside
   `cardExitTransition`'s ternary — the `{ duration: 0 }` branch for
   `prefersReducedMotion` stays a literal `0`, not a token, since zero isn't
   one of the three mirrored durations).
6. In `src/components/InfoOverlay.tsx`, add `DURATION` to the existing
   `EASE_OUT_QUART` import from `./TutorialCard`.
   - Line 251: replace `duration: 0.2` with `duration: DURATION.base`.
   - Line 254: replace `duration: 0.2` with `duration: DURATION.base`.
   - Line 329: replace `reduceMotion ? 0.2 : 0.35` with `reduceMotion ?
     DURATION.base : DURATION.layout`.
   - Line 427: replace `reduceMotion ? 0.2 : 0.35` with `reduceMotion ?
     DURATION.base : DURATION.layout` — leave `delay:` untouched (plan 046).
   - Line 431: replace `duration: 0.2` with `duration: DURATION.base`.
   - Line 435: replace `duration: 0.35` with `duration: DURATION.layout`.
   - Leave line 252 (`transform: { duration: 0.3, ease: EASE_IN_OUT }`)
     untouched — `0.3` doesn't mirror any of the three tokens, out of scope.
7. In `src/components/Toast.tsx`, add `DURATION` to the existing
   `EASE_OUT_QUART` import from `./TutorialCard`. On line 93, replace
   `reduceMotion ? 0.15 : 0.35` with `reduceMotion ? DURATION.instant :
   DURATION.layout`.
8. In `src/components/TutorialCard.tsx` itself (already has `DURATION` in
   scope from step 1, no import needed):
   - Line 2486: replace `duration: 0.2` with `duration: DURATION.base`.
   - Line 2545: replace `duration: 0.35` with `duration: DURATION.layout`.

## Boundaries

- Do NOT touch any duration value that doesn't exactly match 0.15, 0.2, or
  0.35 as a literal — in particular, leave `InfoOverlay.tsx:252`'s `0.3`,
  `BookmarksScreen.tsx:236`'s `0.3`, every `delay:` value, every `duration: 0`
  literal, and every `TutorialCard.tsx` `MotionTuning` field (`flyOffDuration`,
  `cancelDuration`, etc. — those are runtime-tunable "settled on by feel"
  values, not token mirrors) exactly as they are.
- Do NOT touch `--duration-shimmer` or `--duration-step-content` in
  `tokens.css`, or any CSS `animation`/`transition` declaration that already
  consumes a duration via `var(--duration-*)` — this plan only touches
  hand-typed JS number literals.
- Do NOT rename or restructure `EASE_OUT_QUART` itself.
- Do NOT add `DURATION` to any file not listed in Steps above.
- If any cited line's current value doesn't match what's listed in the
  Problem table (drift since commit `2d86cf3`), STOP and report that one site
  rather than guessing — apply the rest of the plan to unaffected sites and
  flag the mismatch.

## Verification

- **Mechanical**: `npx tsc --noEmit` clean — this is a pure refactor
  (numbers replaced by identically-valued named constants), so this is the
  primary correctness check: if any site was mis-migrated (wrong token, typo)
  it would still typecheck but produce a behavior diff, so also run:
  `grep -rn "0\.15\|0\.2\|0\.35" src/App.tsx src/components/BookmarksScreen.tsx src/components/ProductDetailOverlay.tsx src/components/StepScreen.tsx src/components/InfoOverlay.tsx src/components/Toast.tsx src/components/TutorialCard.tsx`
  afterward and manually confirm every remaining match is one of the
  explicitly-excluded values from Boundaries (delays, `0.3`, `duration: 0`,
  `MotionTuning` fields), not a missed site from the table above. `npm run
  build` clean.
- **Feel check**: this plan is a values-preserving refactor — every duration
  is numerically identical before and after. Spot-check 2-3 of the affected
  surfaces (a toast, InfoOverlay opening, ProductDetailOverlay opening) and
  confirm they feel and time exactly as they did before this change; any
  perceptible difference means a site was migrated to the wrong `DURATION`
  key.
- **Done when**: `DURATION` is exported once from `TutorialCard.tsx`, all 16
  sites in the Problem table reference it instead of a raw literal, and no
  visual/timing behavior has changed anywhere.
