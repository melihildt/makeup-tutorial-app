# 001 — Fix ease-in on the fly-off's disappear-faster fade

- **Status**: DONE
- **Commit**: 628b8b7
- **Severity**: HIGH
- **Category**: Easing & duration
- **Estimated scope**: 1 file, 3 one-line value changes

## Problem

`src/components/TutorialCard.tsx`, inside the `flyOff()` function (shared by
a real committed drag and a Start Over tap), the card's disappear-faster fade
uses `ease: 'easeIn'` on all three of its motion values:

```tsx
// src/components/TutorialCard.tsx:941-944 — current
const FLIGHT_FADE_DURATION = tuning.flyOffDuration * 0.45
const flightFade = animateValue(flightOpacity, 0, { duration: FLIGHT_FADE_DURATION, ease: 'easeIn' })
animateValue(flightScale, 0.55, { duration: FLIGHT_FADE_DURATION, ease: 'easeIn' })
animateValue(flightZDrop, 1, { duration: FLIGHT_FADE_DURATION, ease: 'easeIn' })
```

`ease-in` starts slow and accelerates toward the end of the duration. For an
opacity-to-0 fade, that means the card stays close to fully visible for most
of `FLIGHT_FADE_DURATION` (~315ms at the current `flyOffDuration: 0.7`) and
only actually drops to invisible in the last fraction of that window.

This directly undermines the comment immediately above it, which documents
the *intent* of this exact code:

```tsx
// src/components/TutorialCard.tsx:930-940 — current (comment, unchanged by this plan)
// The *visible* disappearance is a separate, deliberately faster
// animation from the translate spring above — flightX/flightY still
// carry the card off in whatever direction it was actually thrown
// (momentum-driven feel, unchanged), but a spring's tail decelerates
// right near its target, so waiting for *that* to fully settle before
// treating the card as "gone" is exactly what read as lingering at a
// corner for a beat before disappearing. Fading + shrinking + diving
// behind the peek (frontZIndex, above) on their own quicker timeline
// sells "gone" well before the translate spring's long tail actually
// finishes — and reads as the card receding into the stack rather
// than just sailing off-screen.
```

The whole point of this code (per its own comment, and per the user request
that produced it) is to make the card disappear *faster*, not to relocate
the same "stays visible, then suddenly gone" problem into a shorter window.
`ease-in` on a disappearing element does close to that: most of the
perceived travel happens right at the end, not the start.

## Target

Swap `'easeIn'` for the repo's own strong ease-out curve on all three motion
values (duration and every other value in this block stays exactly as-is —
only the `ease` value changes):

```tsx
/* target */
const FLIGHT_FADE_DURATION = tuning.flyOffDuration * 0.45
const flightFade = animateValue(flightOpacity, 0, { duration: FLIGHT_FADE_DURATION, ease: [0.25, 1, 0.5, 1] })
animateValue(flightScale, 0.55, { duration: FLIGHT_FADE_DURATION, ease: [0.25, 1, 0.5, 1] })
animateValue(flightZDrop, 1, { duration: FLIGHT_FADE_DURATION, ease: [0.25, 1, 0.5, 1] })
```

`[0.25, 1, 0.5, 1]` is not an arbitrary choice — it is the exact numeric form
of this repo's own `--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1)` token
(`src/styles/tokens.css:68`), expressed as the array form Framer Motion's
`animate()` accepts in place of a CSS var (Framer runs these as JS-driven
tweens, so it cannot reference a CSS custom property directly). This is a
strong, fast-starting ease-out: most of the opacity/scale/z-drop change
happens in the *first* portion of the 315ms window, which is what "sells
gone" quickly instead of at the very end.

## Repo conventions to follow

- This exact curve is already in use, by name, elsewhere in this same file
  for other UI motion — the press-feedback transition on the card root:
  `src/components/TutorialCard.tsx:295` —
  `transition: 'transform var(--duration-instant) var(--ease-out-quart)'`.
  That's the CSS-string form of the same curve; this plan just needs the
  equivalent numeric array because `flyOff()` drives motion values via
  Framer's JS `animate()`, not a CSS `transition`.
- Do not invent a new curve or pull the generic `--ease-out:
  cubic-bezier(0.23, 1, 0.32, 1)` suggested in AUDIT.md's own default list —
  this repo already has its own ease-out token in active use; match that
  one, not a generic substitute.
- Every other `animateValue(...)` call in this file that specifies an
  explicit `ease` (there are only these three) should use the same value —
  don't leave one of the three on `'easeIn'` by mistake.

## Steps

1. Open `src/components/TutorialCard.tsx`. Locate the `flyOff` function
   (search `function flyOff(angle: number, velocity`).
2. In the three-line block that creates `flightFade` and animates
   `flightScale`/`flightZDrop` (currently lines 942-944), replace every
   `ease: 'easeIn'` with `ease: [0.25, 1, 0.5, 1]`. All other object fields
   (`duration: FLIGHT_FADE_DURATION`, the target values `0`, `0.55`, `1`)
   stay unchanged.
3. Do not touch the two `animateValue(dragX, ...)` / `animateValue(dragY,
   ...)` spring calls immediately above this block (lines 918-929) — those
   are unrelated springs for the physical translate, not part of this
   finding.
4. Do not touch `handleStartOverTap` or `handleDragEnd` — both call into
   `flyOff()`, so they inherit the fix automatically; no separate edit
   needed there.

## Boundaries

- Do NOT touch any file other than `src/components/TutorialCard.tsx`.
- Do NOT change `FLIGHT_FADE_DURATION`'s value or formula (`tuning.flyOffDuration * 0.45`) — this plan is about the curve, not the duration.
- Do NOT change the target values (`0`, `0.55`, `1`) that `flightOpacity`/`flightScale`/`flightZDrop` animate to.
- Do NOT touch the `dragX`/`dragY` spring calls in the same function, or anything in `handleDragEnd`'s cancel branch.
- Do NOT fold these values into `MotionTuning` — that's a separate, not-yet-selected finding (see the audit's finding #3); out of scope here.
- If the code at these line numbers has drifted from what's quoted above (different surrounding code, different values already in place), STOP and report the mismatch instead of improvising a fix.

## Verification

- **Mechanical**: `npm run build` (runs `tsc -b && vite build`) — expect the same pre-existing TS18046/TS6133 warnings this file already had before this change (unrelated `useTransform` array-combiner typing and the hidden `MotionTuner`/`setTuning`), and no *new* errors. `npx oxlint src/components/TutorialCard.tsx` — expect the same 4 pre-existing warnings (2 unused-var, 2 `only-export-components`), no new ones.
- **Feel check**: this is gesture-driven — per this file's own documented testing limitation (see `docs/home-stack-handoff.md`, "Testing notes"), browser automation in this environment cannot trigger Framer Motion's drag gesture. Verify on a real phone or with a real mouse drag:
  - Swipe a tutorial card away (any direction, past the commit threshold). The card should visibly start shrinking/fading almost immediately after release, not hang at near-full visibility for a beat before suddenly vanishing.
  - Do the same via the Start Over card's tap-triggered flight (swipe through all 4 tutorials, tap "Start Over"). Same check: the Start Over card should visibly begin fading right away, not linger.
  - In Chrome DevTools' Animations panel (or equivalent), find the fly-off's opacity animation and set playback to 25%. Confirm the opacity trace drops steeply in the first third of the timeline rather than staying flat until the last third.
- **Done when**: all three `animateValue` calls in `flyOff()`'s fade block use `ease: [0.25, 1, 0.5, 1]`, the build/lint baseline is unchanged, and a real-device swipe confirms the card visibly starts disappearing immediately on release rather than lingering.
