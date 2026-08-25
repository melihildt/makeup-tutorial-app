# 006 — Consolidate the hand-typed ease-out-quart array into one constant

- **Status**: TODO
- **Commit**: db1e1be
- **Severity**: LOW
- **Category**: Cohesion & tokens
- **Estimated scope**: 2 files, ~11 small edits (1 new constant, 10 call-site swaps)

## Problem

`src/components/TutorialCard.tsx` and `src/App.tsx` — `--ease-out-quart`
(`tokens.css:68`, `cubic-bezier(0.25, 1, 0.5, 1)`) is this app's one
established easing curve, already reused consistently in CSS via the
custom property. But Framer Motion's `animate()`/`transition` props need a
plain JS array, not a CSS custom property string, and that array —
`[0.25, 1, 0.5, 1]` — is hand-typed at every call site instead of living
as one shared constant:

```tsx
// src/App.tsx:99 — current
transition={{ duration: reduceMotion ? 0.2 : 0.35, ease: [0.25, 1, 0.5, 1] }}
```

```tsx
// src/components/TutorialCard.tsx:777 — current
const duck = animateValue(behindRotate, -parentRotate.get(), {
  duration: 0.2,
  ease: [0.25, 1, 0.5, 1],
})
```

(and 8 more identical literals in `TutorialCard.tsx` — full list in Steps
below.)

The value itself isn't drifting today — every occurrence matches exactly.
The risk is future: retuning this curve means finding and hand-editing 10
call sites across 2 files, and one getting missed is exactly how a shared
curve silently splits into two. Confirmed via `grep -c "\[0.25, 1, 0.5,
1\]"` — 10 in `TutorialCard.tsx` (9 real call sites + 1 in a comment
citing the value), 1 in `App.tsx`.

## Target

One exported constant, imported wherever the array is currently
hand-typed:

```tsx
/* target — src/components/TutorialCard.tsx, near the top of the file,
   after the framer-motion import block */
/** The numeric (JS array) form of tokens.css's --ease-out-quart
 *  (cubic-bezier(0.25, 1, 0.5, 1)) — Framer Motion's animate()/transition
 *  props need a plain array, not a CSS custom property string, so this is
 *  the one shared source for that array instead of it being hand-typed at
 *  every call site. Import this into any other file that needs the same
 *  curve for a Framer animation (see App.tsx) rather than retyping it. */
export const EASE_OUT_QUART = [0.25, 1, 0.5, 1] as const
```

Every current `ease: [0.25, 1, 0.5, 1]` becomes `ease: EASE_OUT_QUART`;
every current `[0.25, 1, 0.5, 1]` passed as a bare `transition.ease` value
does the same. No numeric value changes — this is a pure extract-constant
refactor.

## Repo conventions to follow

- This file already exports plain constants near the top for shared
  values other functions consume (e.g. `CARD_WIDTH`/`CARD_HEIGHT`,
  `src/components/TutorialCard.tsx:915-916`) — `EASE_OUT_QUART` follows
  that same placement style, not a new pattern.
- `App.tsx` already imports named values from `TutorialCard.tsx` is not
  an existing pattern in this codebase (check before assuming) — if no
  such cross-import exists yet, this plan is what introduces the first
  one; use a plain named import (`import { EASE_OUT_QUART } from
  './components/TutorialCard'`), matching how `App.tsx` already imports
  `HomeScreen`/`TutorialFlow` from their own files.
- `as const` on the constant (shown in Target) so TypeScript infers the
  literal tuple type `readonly [0.25, 1, 0.5, 1]` rather than
  `number[]` — Framer Motion's `ease` prop type expects a tuple, not an
  arbitrary-length array, and `as const` is what makes that type-check
  cleanly without an explicit type annotation.

## Steps

1. Open `src/components/TutorialCard.tsx`. Near the top of the file,
   after the `framer-motion` import block (currently ends around line
   11, `} from 'framer-motion'`), add the `EASE_OUT_QUART` constant and
   its doc comment exactly as shown in Target.
2. Replace all 9 real call-site occurrences of the literal array with
   `EASE_OUT_QUART` (search `[0.25, 1, 0.5, 1]` to find each — do not
   touch the one at the current line 1535, which is inside a comment,
   not code; see Step 4 for that one instead):
   - `CardBehind`'s duck-and-reveal effect (currently lines 777, 779,
     785, 786 — 4 occurrences, all inside the same `useEffect`).
   - `flyOff`'s fade/scale/z-dive trio (currently lines 1542, 1543, 1544
     — 3 occurrences, all inside the same function, right after the
     comment that names the curve).
   - The stack's first-load entrance `transition` (currently line 2096,
     the `reduceMotion` branch's `motion.div`).
   - The stack's first-load entrance `transition` (currently line 2139,
     the main non-reduced-motion branch's `motion.div`).
3. Open `src/App.tsx`. Add `import { EASE_OUT_QUART } from
   './components/TutorialCard'` to the import block at the top (after
   the existing `HomeScreen`/`TutorialFlow` imports). Replace the one
   call-site occurrence (currently line 99, the screen-transition
   `motion.div`'s `transition` prop) with `EASE_OUT_QUART`.
4. Back in `src/components/TutorialCard.tsx`, update the comment at the
   current line 1535 (`// [0.25, 1, 0.5, 1] — the numeric form of this
   file's own --ease-out-quart token...`) so it references
   `EASE_OUT_QUART` by name instead of re-quoting the raw array literal
   — the comment is explaining *why* this curve was chosen, that
   reasoning stays, only the "here's the literal you're looking at"
   framing needs to point at the named constant now that one exists.

## Boundaries

- Do NOT change any duration value, or any `ease`/curve value *other than* replacing the literal array with the named constant — this is a pure extract-constant refactor, not a retune.
- Do NOT touch `tokens.css`'s own `--ease-out-quart` CSS custom property — it's unrelated to this plan (that's the CSS-side token; this plan only consolidates the JS-side array Framer Motion needs).
- Do NOT add `EASE_OUT_QUART` anywhere it isn't already used as a literal today — this plan relocates existing usages, it does not introduce the curve to new call sites.
- Do NOT touch any other exported constant or the file's other imports beyond what Steps 1 and 3 specify.
- If the code at these line numbers has drifted from what's quoted above, STOP and report the mismatch instead of improvising — but note this plan's own values (the array itself, its 10 call sites) were confirmed via a fresh `grep` immediately before this plan was written, so drift here is less likely than in the older 003/004/005 plans.

## Verification

- **Mechanical**: `npm run build` (`tsc -b && vite build`) — expect no new errors; in particular, no TypeScript error on any `transition`/`ease` prop (would indicate `EASE_OUT_QUART`'s inferred type doesn't match what Framer Motion's `Transition` type expects — if that happens, confirm `as const` is present on the constant declaration). `npx oxlint src/components/TutorialCard.tsx src/App.tsx` — expect the same pre-existing warnings, no new ones.
- **Feel check**: this plan is a pure relocation — no animation should look or feel any different before and after.
  - Switch the Day/Night/Glam filter chip and confirm the ghost card's duck-and-reveal still plays identically.
  - Swipe a tutorial card away and confirm the fly-off/disappear timing feels identical.
  - Reload the page (or navigate Home → Tutorial → Home) and confirm the first-load stack entrance and the screen slide transition both still look identical.
- **Done when**: `EASE_OUT_QUART` is declared once in `TutorialCard.tsx` and imported into `App.tsx`; all 10 real call sites (9 in `TutorialCard.tsx`, 1 in `App.tsx`) reference the constant instead of a hand-typed array; the explanatory comment at the old line 1535 references the constant by name; the build/lint baseline is unchanged; and the feel-check confirms no behavior actually changed.
