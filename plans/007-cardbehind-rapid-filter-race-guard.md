# 007 — Guard CardBehind's duck-and-reveal against rapid filter switching

- **Status**: TODO
- **Commit**: db1e1be
- **Severity**: MEDIUM
- **Category**: Interruptibility
- **Estimated scope**: 1 file, 1 edit (one `useEffect` gains a cleanup guard)

## Problem

`src/components/TutorialCard.tsx` — `CardBehind`'s filter-color
duck-and-reveal effect has no cancellation guard on its async `.then()`
chain, so rapid filter switching (Day → Night → Glam tapped quickly) can
leave the ghost card showing the wrong color:

```tsx
// src/components/TutorialCard.tsx:774-797 — current
useEffect(() => {
  if (isFirstRender.current) {
    isFirstRender.current = false
    return
  }
  // Duck: cancel the parent's current tilt (see this component's own
  // doc comment for why `-parentRotate.get()` lands the *combined*
  // rotation at exactly 0) while fading the outgoing texture out, in
  // parallel — both finish together, not staggered.
  const duck = animateValue(behindRotate, -parentRotate.get(), {
    duration: 0.2,
    ease: EASE_OUT_QUART,
  })
  animateValue(imgOpacity, 0, { duration: 0.2, ease: EASE_OUT_QUART })
  duck.then(() => {
    setDisplayedLookType(lookType)
    // Swing back out: this card's own contribution returns to 0 (i.e.
    // back to just the parent's own tilt, its ordinary peek pose),
    // fading the new texture in over the same window.
    animateValue(behindRotate, 0, { duration: 0.2, ease: EASE_OUT_QUART })
    animateValue(imgOpacity, 1, { duration: 0.2, ease: EASE_OUT_QUART })
  })
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed on lookType alone: parentRotate/behindRotate/imgOpacity are read/written here, not reacted to.
}, [lookType])
```

Trace: tap Night (effect run #1, `lookType='night'`, schedules `duck1` and
its `.then()`). Before `duck1` resolves, tap Glam (effect run #2,
`lookType='glam'`, calls `animateValue` again on the *same* `behindRotate`/
`imgOpacity` motion values — Framer retargets those correctly, that part
is fine). But run #1's `duck1.then()` callback is still pending, closed
over `lookType='night'` from *its own* render. If Framer resolves that
stale promise at all (cancelled/superseded animations aren't guaranteed to
never resolve — this is the part that can't be fully confirmed from code
alone, hence the feel-check below), its callback calls
`setDisplayedLookType('night')` — reverting the ghost card to the wrong
color after run #2's own `.then()` already set the correct `'glam'`, and
starts a second, conflicting swing-back animation on top of run #2's.

## Target

Guard the `.then()` callback with a per-run cancellation flag, set by the
effect's own cleanup function — the standard React pattern for an async
effect whose result must not apply after a newer run has superseded it:

```tsx
/* target — src/components/TutorialCard.tsx, replacing lines 774-797 */
useEffect(() => {
  if (isFirstRender.current) {
    isFirstRender.current = false
    return
  }
  // Guards the .then() below against a newer effect run superseding this
  // one before it resolves (rapid filter switching) — see this effect's
  // own module comment for the exact race this closes. Set true by the
  // cleanup function, which React calls right before the *next* run of
  // this same effect (or on unmount) — never during this run itself.
  let cancelled = false
  // Duck: cancel the parent's current tilt (see this component's own
  // doc comment for why `-parentRotate.get()` lands the *combined*
  // rotation at exactly 0) while fading the outgoing texture out, in
  // parallel — both finish together, not staggered.
  const duck = animateValue(behindRotate, -parentRotate.get(), {
    duration: 0.2,
    ease: EASE_OUT_QUART,
  })
  animateValue(imgOpacity, 0, { duration: 0.2, ease: EASE_OUT_QUART })
  duck.then(() => {
    if (cancelled) return
    setDisplayedLookType(lookType)
    // Swing back out: this card's own contribution returns to 0 (i.e.
    // back to just the parent's own tilt, its ordinary peek pose),
    // fading the new texture in over the same window.
    animateValue(behindRotate, 0, { duration: 0.2, ease: EASE_OUT_QUART })
    animateValue(imgOpacity, 1, { duration: 0.2, ease: EASE_OUT_QUART })
  })
  return () => {
    cancelled = true
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed on lookType alone: parentRotate/behindRotate/imgOpacity are read/written here, not reacted to.
}, [lookType])
```

The only behavioral difference: if a *second* filter tap lands before the
first's duck-and-reveal finishes, the first tap's reveal (the
`setDisplayedLookType`/swing-back-out call) is skipped entirely — the
card is still mid-duck (rotated toward 0, faded toward 0) when the second
effect run starts, retargets `behindRotate`/`imgOpacity` toward its own
values, and only *that* run's `.then()` is allowed to actually reveal a
color. The visible result of a quick double-tap is one clean duck+reveal
landing on the *last* filter tapped, not two overlapping ones fighting
over which color sticks.

## Repo conventions to follow

- This exact `cancelled` cleanup-flag pattern isn't used elsewhere in this
  file yet (`CardBehind`'s effect is the only place with a promise-based
  side effect that outlives a single render) — this plan introduces it
  fresh, following React's own standard idiom for guarding async work in
  `useEffect` (an effect returning a cleanup function that flips a local
  flag, checked before any state update the async callback makes), not
  inventing a project-specific mechanism.
- Comment density/placement: match the existing comment right above
  `duck`'s declaration (explains *why* `-parentRotate.get()`) — the new
  `cancelled` flag gets its own comment immediately above its declaration,
  same style.

## Steps

1. Open `src/components/TutorialCard.tsx`. Locate `CardBehind`'s
   `useEffect` (search `if (isFirstRender.current) {`, currently lines
   774-797). Replace the entire effect body with the version in Target:
   adds the `let cancelled = false` declaration (with its own comment)
   right after the `isFirstRender` early-return block, adds `if
   (cancelled) return` as the first line inside `duck.then(() => { ... })`,
   and adds a `return () => { cancelled = true }` cleanup function as the
   effect's own return value, placed after `duck.then(...)` and before the
   existing `eslint-disable-next-line` comment (which stays exactly where
   it is, still applying to the `}, [lookType])` dependency array below
   it).
2. Nothing else in this file changes — `behindRotate`, `imgOpacity`,
   `displayedLookType`, `isFirstRender`, and the JSX below are untouched.

## Boundaries

- Do NOT change the effect's dependency array (`[lookType]`) or the `eslint-disable-next-line` comment governing it.
- Do NOT change the duck/swing-back timing (`duration: 0.2`, `EASE_OUT_QUART`) or the rotation-cancellation math (`-parentRotate.get()`) — this plan only adds cancellation guarding, it does not retune the animation.
- Do NOT add the same `cancelled`-flag pattern to any *other* effect in this file (e.g. the swipe-hint nudge effect, the isFrontCard-driven flip reset) — none of those have an async `.then()` chain with a state update that could race, so they don't have this problem; adding the pattern there would be unmotivated scope creep.
- If the code at these line numbers has drifted from what's quoted above, STOP and report the mismatch instead of improvising — but these lines were confirmed via a fresh read immediately before this plan was written, so drift is unlikely.

## Verification

- **Mechanical**: `npm run build` (`tsc -b && vite build`) — expect no new errors. `npx oxlint src/components/TutorialCard.tsx` — expect the same pre-existing warnings, no new ones.
- **Feel check**: this is the one part of the finding that couldn't be fully confirmed from code alone (whether Framer's cancelled-animation promise behavior actually reproduces the bug) — so confirm both the fix's mechanics *and* that nothing regressed:
  - Tap a single filter chip (e.g. Day → Night) and confirm the duck-and-reveal still plays exactly as before: card tilts toward flat, fades, texture swaps, swings back out revealing the new color. No change expected for a single, unhurried tap.
  - Tap through all three filter chips as fast as you can (Day → Night → Glam → Day, rapid taps, no pauses) and confirm the ghost card ends up showing whichever filter you tapped *last* — not an earlier one, and not a visibly broken/stuck-mid-rotation state.
  - Repeat the rapid-tap test a few times from different starting filters — this is a timing-dependent race, so a single pass isn't sufficient confirmation either way.
  - In DevTools, throttle CPU (Performance panel → CPU throttling, 6x slowdown) and repeat the rapid-tap test — a slower device makes the race window wider and easier to actually catch if it's still there.
- **Done when**: `CardBehind`'s effect has the `cancelled` guard exactly as shown in Target, the build/lint baseline is unchanged, a single filter tap still looks identical to before, and rapid filter tapping reliably lands on the last-tapped color across multiple attempts (including under CPU throttling).
