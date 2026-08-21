# 005 — Compose contentOwnRotateY into a full transform string

- **Status**: TODO
- **Commit**: 628b8b7
- **Severity**: LOW
- **Category**: Performance
- **Estimated scope**: 1 file, 2 small edits

## Problem

`src/components/TutorialCard.tsx` — the restart flip's content-layer face
uses Framer Motion's individual `rotateY` style shorthand prop instead of
this file's own established composed-transform-string pattern:

```tsx
// src/components/TutorialCard.tsx:865 — current
const contentOwnRotateY = useTransform(flipProgress, (f) => (f > 0 ? 180 : 0))
```

```tsx
// src/components/TutorialCard.tsx:1095-1101 — current
<motion.div
  className="absolute inset-0"
  style={{
    opacity: contentFinalOpacity,
    rotateY: contentOwnRotateY,
    backfaceVisibility: 'hidden',
  }}
>
```

Every *other* transform in this file is deliberately composed into one full
`transform` string via `useMotionTemplate`, specifically to avoid Framer's
individual-property shorthands — this is stated repeatedly and explicitly:

```tsx
// src/components/TutorialCard.tsx:852 — current, the outer card's own transform (unchanged by this plan)
const transform = useMotionTemplate`translateX(${dragX}px) translateY(${dragY}px) rotate(${totalRotate}deg) rotateY(${flipRotateY}deg) scale(${totalScale})`
```

`contentOwnRotateY` is the one exception — it's applied as a bare `rotateY:`
value in the `style` object, which lets Framer Motion auto-compose the
underlying `transform` CSS for that element via its own individual-prop
system instead. Confidence on real-world impact here is low: this is a
single, low-frequency (once per full deck cycle) animation, not a busy list
or anything hit under load — the audit category this falls under
(Performance) specifically warns about shorthand props "on busy pages,"
which this isn't. The value of this plan is consistency with the file's own
repeatedly-stated rule, not a measured performance problem.

## Target

Compose `contentOwnRotateY` into an explicit `transform` string the same way
the outer card element does, and bind it via `style.transform` instead of
the `rotateY` shorthand:

```tsx
/* target — src/components/TutorialCard.tsx, immediately after contentOwnRotateY's declaration */
const contentOwnRotateY = useTransform(flipProgress, (f) => (f > 0 ? 180 : 0))
const contentTransform = useMotionTemplate`rotateY(${contentOwnRotateY}deg)`
```

```tsx
/* target — src/components/TutorialCard.tsx, the content-layer motion.div */
<motion.div
  className="absolute inset-0"
  style={{
    opacity: contentFinalOpacity,
    transform: contentTransform,
    backfaceVisibility: 'hidden',
  }}
>
```

## Repo conventions to follow

- `useMotionTemplate` is already imported at the top of the file
  (`src/components/TutorialCard.tsx:5`, in the `framer-motion` import) and
  used exactly this way for the outer card's own `transform`
  (`src/components/TutorialCard.tsx:852`) — `contentTransform` follows the
  identical pattern, just with a single transform function instead of five.
- Variable naming: the outer transform is named `transform`; name this
  file's second composed-transform value `contentTransform` (not `transform`
  again — that identifier is already taken by the outer element's own
  `const transform = useMotionTemplate...` in the same component scope) to
  avoid a naming collision within `TutorialStackCard`.

## Steps

1. Open `src/components/TutorialCard.tsx`. Locate `const contentOwnRotateY
   = useTransform(flipProgress, (f) => (f > 0 ? 180 : 0))` (currently line
   865). Immediately after that line, add:
   ```tsx
   const contentTransform = useMotionTemplate`rotateY(${contentOwnRotateY}deg)`
   ```
2. Locate the content-layer `<motion.div>` (search `rotateY: contentOwnRotateY,`,
   currently around line 1099, inside the block with the comment "rotateY +
   backfaceVisibility here are contentOwnRotateY's half of the flip pair").
   Replace the `rotateY: contentOwnRotateY,` line in its `style` object with
   `transform: contentTransform,`. The full `style` object becomes:
   ```tsx
   style={{
     opacity: contentFinalOpacity,
     transform: contentTransform,
     backfaceVisibility: 'hidden',
   }}
   ```
3. `contentOwnRotateY` itself stays exactly as it was (it's now consumed by
   `contentTransform` instead of directly by the JSX `style` object) — do
   not remove or rename it.

## Boundaries

- Do NOT touch the outer card element's own `transform`/`useMotionTemplate` line (`src/components/TutorialCard.tsx:852`) — that one is already correct and is the pattern being matched, not the target of the change.
- Do NOT touch `CardBehind`'s `backfaceVisibility: 'hidden'` styling (`src/components/TutorialCard.tsx:397`) — it has no transform of its own and is out of scope.
- Do NOT change `contentOwnRotateY`'s own derivation (`useTransform(flipProgress, (f) => (f > 0 ? 180 : 0))`) — only how its output is *applied* to the DOM changes.
- If the code at these line numbers has drifted from what's quoted above, STOP and report the mismatch instead of improvising.

## Verification

- **Mechanical**: `npm run build` (`tsc -b && vite build`) — expect the same pre-existing warnings this file already had, no new errors. `npx oxlint src/components/TutorialCard.tsx` — expect the same 4 pre-existing warnings, no new ones.
- **Feel check**: this is a pure implementation-detail change with no intended visual difference.
  - Swipe through all 4 tutorials and tap Start Over; confirm the restart flip looks and feels exactly the same as before this change (same rotation, same timing, same face swap at the midpoint).
  - In browser DevTools, inspect the content-layer `<motion.div>` element during the flip (Elements panel, computed style) and confirm its `transform` computed value is `rotateY(...)` at the expected angle — i.e. the CSS actually being produced is equivalent to before, just arrived at via `style.transform` instead of Framer's shorthand.
- **Done when**: the content-layer element's rotateY is applied via a `useMotionTemplate`-composed `transform` string bound through `style.transform`, no `rotateY:` shorthand remains anywhere in this file, the build/lint baseline is unchanged, and the feel-check confirms the flip is visually unchanged.
