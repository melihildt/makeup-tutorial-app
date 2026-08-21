# 002 — Close the interactive-before-flip-finishes window on the restart flip

- **Status**: DONE
- **Commit**: 628b8b7
- **Severity**: MEDIUM
- **Category**: Interruptibility
- **Estimated scope**: 1 file, ~4 small edits, all inside `TutorialStackCard`

## Problem

`src/components/TutorialCard.tsx` — after a Start Over tap, `TutorialStack`
unlocks the whole stack for interaction well before the arriving card's own
entrance flip has actually finished playing.

The unlock timing comes from `TutorialStack`'s `isAdvancing` state:

```tsx
// src/components/TutorialCard.tsx:1197 — current, TutorialStack
const [isAdvancing, setIsAdvancing] = useState(false)
```

```tsx
// src/components/TutorialCard.tsx:1238-1240 — current, TutorialStack
function handleCommitStart() {
  setIsAdvancing(true)
}
```

`setIsAdvancing(false)` happens inside `handleAdvance`, which
`TutorialStackCard`'s `flyOff()` calls once the *departing* card's own fade
resolves (`flightFade.then(() => { onAdvance() ... })` —
`src/components/TutorialCard.tsx:950-960`). `FLIGHT_FADE_DURATION` is
`tuning.flyOffDuration * 0.45` — at the current default (`flyOffDuration:
0.7`), that's ~315ms.

Meanwhile, the arriving card's own restart flip is a *separate* animation
with a longer, independent duration:

```tsx
// src/components/TutorialCard.tsx:979-1001 — current, TutorialStackCard
useEffect(() => {
  if (index !== 0 || flipTrigger === 0) return
  // ...
  animateValue(flipProgress, 1, { duration: 0 })
  const flip = animateValue(flipRotateY, 180, { type: 'spring', bounce: 0.15, duration: 0.7 })
  flip.then(() => {
    animateValue(flipRotateY, 0, { duration: 0 })
    animateValue(flipProgress, 0, { duration: 0 })
  })
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed on flipTrigger alone: index/flipRotateY/flipProgress are stable-enough refs for this component instance, re-running on their identity isn't the intent here.
}, [flipTrigger])
```

That's a 700ms spring. Interactivity for every card (including the one
mid-flip) is gated by:

```tsx
// src/components/TutorialCard.tsx:801 — current, TutorialStackCard
const isInteractive = isFrontCard && !isLocked
```

where `isLocked` is `TutorialStack`'s `isAdvancing` prop, passed straight
through. Since `isAdvancing` clears at ~315ms but the flip runs for 700ms,
there's a ~385ms window where `isInteractive` is already `true` for tutorial
#1 while its own `flipRotateY` spring is still visibly turning. A user who
swipes again inside that window can grab and throw the card mid-flip — the
exact class of bug `isLocked` exists to prevent for the *departing* card
(see its own doc comment, `src/components/TutorialCard.tsx:699-704`: "closes
the window where the still-'active' ... departing card could start a
*second* drag mid-fly-off"), just not extended to cover the *arriving*
card's flip.

## Target

Add a card-local `isFlipping` state that stays `true` for the exact duration
of *this card's own* flip, and require it to be `false` before the card can
be interactive — independent of (in addition to) `isLocked`:

```tsx
/* target — new state, declared next to flipRotateY/flipProgress */
const flipRotateY = useMotionValue(0)
const flipProgress = useMotionValue(0)
const [isFlipping, setIsFlipping] = useState(false)
```

```tsx
/* target — isInteractive now also requires the flip to be done */
const isInteractive = isFrontCard && !isLocked && !isFlipping
```

```tsx
/* target — the flipTrigger effect sets/clears isFlipping around the flip */
useEffect(() => {
  if (index !== 0 || flipTrigger === 0) return
  animateValue(flipProgress, 1, { duration: 0 })
  setIsFlipping(true)
  const flip = animateValue(flipRotateY, 180, { type: 'spring', bounce: 0.15, duration: 0.7 })
  flip.then(() => {
    animateValue(flipRotateY, 0, { duration: 0 })
    animateValue(flipProgress, 0, { duration: 0 })
    setIsFlipping(false)
  })
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed on flipTrigger alone: index/flipRotateY/flipProgress are stable-enough refs for this component instance, re-running on their identity isn't the intent here.
}, [flipTrigger])
```

This is fully local to `TutorialStackCard`: `isFlipping` starts `false` and
only the `index === 0` card's effect ever touches it, so no other card's
`isInteractive` computation changes. `TutorialStack`'s `isAdvancing` timing
is untouched — the fix closes the gap by holding this one card back a little
longer, not by making the shared lock last longer for everyone.

## Repo conventions to follow

- `isInteractive`'s existing shape — `isFrontCard && !isLocked` — is a plain
  `&&`-chained boolean of independent gating conditions computed at render
  time (`src/components/TutorialCard.tsx:801`). Adding `&& !isFlipping`
  follows that exact pattern; do not restructure it into something else
  (e.g. a `useMemo`, a different boolean shape).
- `useState` is already imported at the top of the file
  (`src/components/TutorialCard.tsx:1`: `import { useEffect, useState }
  from 'react'`) and already used inside `TutorialStackCard`'s sibling
  component `TutorialStack` (e.g. `const [isAdvancing, setIsAdvancing] =
  useState(false)`, line 1197) — no new import needed.
- The existing `isLocked` doc comment
  (`src/components/TutorialCard.tsx:699-704`) documents exactly this kind
  of "close the window where a still-active element could start a second
  gesture" reasoning — `isFlipping` is the same idea, scoped to the flip
  instead of the fly-off. Add a comment of the same character (see Steps).

## Steps

1. Open `src/components/TutorialCard.tsx`. Locate the `flipRotateY`/
   `flipProgress` declarations inside `TutorialStackCard` (search `const
   flipRotateY = useMotionValue(0)`, currently line 774).
2. Immediately after `const flipProgress = useMotionValue(0)` (line 775),
   add:
   ```tsx
   // True for exactly this card's own restart flip duration (set/cleared
   // by the flipTrigger effect below) — isInteractive must wait on this
   // too, not just isLocked: isLocked clears once the *departing* Start
   // Over card's own fade is done (~315ms), but this card's own flip is a
   // separate, longer 700ms spring. Without this, the card is draggable
   // for ~385ms while it's still visibly mid-flip — same class of bug
   // isLocked exists to prevent for the departing-card case, just not
   // previously extended to cover the arriving card's own animation.
   const [isFlipping, setIsFlipping] = useState(false)
   ```
3. Locate `const isInteractive = isFrontCard && !isLocked` (currently line
   801). Change it to:
   ```tsx
   const isInteractive = isFrontCard && !isLocked && !isFlipping
   ```
4. Locate the `flipTrigger`-watching `useEffect` (currently lines 979-1001,
   search `if (index !== 0 || flipTrigger === 0) return`). Add
   `setIsFlipping(true)` right after `animateValue(flipProgress, 1, {
   duration: 0 })` and before the `animateValue(flipRotateY, 180, ...)`
   call. Add `setIsFlipping(false)` as the last line inside the `flip.then(()
   => { ... })` callback, after the existing two `animateValue(...,
   { duration: 0 })` reset calls. The full effect body becomes:
   ```tsx
   useEffect(() => {
     if (index !== 0 || flipTrigger === 0) return
     animateValue(flipProgress, 1, { duration: 0 })
     setIsFlipping(true)
     const flip = animateValue(flipRotateY, 180, { type: 'spring', bounce: 0.15, duration: 0.7 })
     flip.then(() => {
       animateValue(flipRotateY, 0, { duration: 0 })
       animateValue(flipProgress, 0, { duration: 0 })
       setIsFlipping(false)
     })
     // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed on flipTrigger alone: index/flipRotateY/flipProgress are stable-enough refs for this component instance, re-running on their identity isn't the intent here.
   }, [flipTrigger])
   ```
   (Keep every existing comment above this effect as-is — only the body
   changes.)

## Boundaries

- Do NOT touch `TutorialStack`'s `isAdvancing` state, `handleCommitStart`, or `handleAdvance` — the fix is entirely local to `TutorialStackCard`, do not change the shared lock's timing.
- Do NOT change `flipRotateY`'s spring config (`{ type: 'spring', bounce: 0.15, duration: 0.7 }`) — that's a separate, not-yet-selected finding (audit finding #3, folding feel-values into `MotionTuning`); out of scope here.
- Do NOT add `isFlipping` (or any derived value from it) to any other card's `isInteractive` computation — it must only ever be read/set by the `index === 0` card itself, matching the existing `flipTrigger` effect's own `index !== 0` guard.
- Do NOT change how `flipTrigger` itself is computed or bumped in `TutorialStack`.
- If the code at these line numbers has drifted from what's quoted above, STOP and report the mismatch instead of improvising a fix.

## Verification

- **Mechanical**: `npm run build` (`tsc -b && vite build`) — expect the same pre-existing warnings this file already had, no new errors. `npx oxlint src/components/TutorialCard.tsx` — expect the same 4 pre-existing warnings, no new ones.
- **Feel check**: gesture-driven — per this file's own documented testing limitation (`docs/home-stack-handoff.md`, "Testing notes"), browser automation here cannot trigger Framer Motion's drag gesture. Verify on a real phone or with a real mouse drag:
  - Swipe through all 4 tutorial cards, then tap "Start Over."
  - Immediately (within the first half-second) try to swipe the card that appears. Before this fix, a fast swipe here could grab and throw the card mid-flip. After this fix, the card should simply not respond to a drag attempt until its own flip has visibly finished settling — no dead/broken feeling, just genuinely non-interactive for that brief window, same as how the rest of the stack already behaves during `isLocked`.
  - Confirm the *normal* case is unaffected: swipe through a couple of ordinary tutorial-to-tutorial advances (not through Start Over) and confirm there's no new added delay before the next card becomes interactive — `isFlipping` should never become `true` outside of the Start Over → first-tutorial transition.
  - In Chrome DevTools' Animations panel, find the `rotateY` animation on the first card during the restart flip and set playback to 25%; confirm the card does not respond to a simulated drag (or that `drag` is effectively disabled — check via React DevTools that `isInteractive` is `false`) until that animation completes.
- **Done when**: `isFlipping` gates `isInteractive` alongside `isLocked`, only the `index === 0` card is ever affected, the build/lint baseline is unchanged, and a real-device test confirms the newly-arrived first card ignores drag attempts until its own flip has visibly finished.
