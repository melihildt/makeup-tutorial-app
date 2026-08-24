# 010 — Compose StepScreen's product-card y/scaleY shorthand into full transform strings

- **Status**: DONE
- **Commit**: 677c3d7
- **Severity**: HIGH
- **Category**: Performance
- **Estimated scope**: 1 file, 1 component's motion props (~4 line edits)

## Problem

`src/components/StepScreen.tsx`'s product-checklist card entrance/exit
uses Framer Motion's `y`/`scaleY` shorthand props, which — per
`AUDIT.md` category 5 — "are not hardware-accelerated... they run on the
main thread and drop frames under load," unlike a composed `transform`
string, which the browser can hand off to the compositor.

```tsx
/* src/components/StepScreen.tsx:636-648 — outer element (exit only), current */
            <motion.div
              key="product-card"
              className="px-[--space-xs]"
              // Bottom-anchored, matching the card's actual fixed position on
              // screen — both this exit and the entrance below rise/sink from
              // the bottom edge now, not the top, so the scale reads as
              // "growing up from where the card lives" rather than "dropping
              // in from somewhere above it."
              style={{ transformOrigin: 'bottom center' }}
              initial={false}
              exit={{ opacity: 0, y: 16, scaleY: 0.92 }}
              transition={cardExitTransition}
            >
```

```tsx
/* src/components/StepScreen.tsx:649-670 — inner element (enter spring), current */
              <motion.div
                key={step}
                // V5 (docs/figma-step-screen-restyle.md): top-corners-only
                // 32px radius (was --radius-card, 20px on all 4 corners) —
                // the card's bottom edge is now flush with the screen's own
                // bottom edge (see the pb-4 removal above), so square bottom
                // corners read correctly; kept as an inline arbitrary value
                // rather than promoted to a token since AllStepsView still
                // legitimately uses --radius-card as-is (deferred, not
                // re-verified against this pass). Padding: pt-[20px]
                // px-[16px] pb-[16px] (was uniform p-4) — top grows 4px,
                // sides/bottom unchanged.
                className="flex flex-col rounded-t-[32px] px-4 pb-4 pt-5"
                style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-card)', transformOrigin: 'bottom center' }}
                // Rises up from below into place (y: 16 → 0), not down from
                // above — the card is fixed to the bottom of the screen, so
                // entering from below reads as "arriving where it lives"
                // rather than falling in from above it.
                initial={{ opacity: 0, y: 16, scaleY: 0.94 }}
                animate={{ opacity: 1, y: 0, scaleY: 1 }}
                transition={cardSpring}
              >
```

`cardSpring` (`StepScreen.tsx:190-192`) is a real physics spring
(`stiffness: 300, damping: 26, mass: 0.9`), which re-samples every frame
for its whole duration — exactly the case AUDIT.md means by "drop frames
under load." This plays on **every** step Next/Back — the single most
frequent Framer-Motion animation in this entire flow (~7× per tutorial
completion). The codebase already demonstrates the correct pattern
elsewhere in the exact same commit: `src/App.tsx:37-44` builds a full
`transform: translateX(...)%` string for its own screen-slide — so this
is an inconsistency within the codebase's own established practice, not
an unprecedented ask.

## Target

Replace the `y`/`scaleY` shorthand keys with a single composed
`transform` string in all three motion objects (`exit`, `initial`,
`animate`). Framer Motion interpolates matching-shape transform strings
correctly as long as the function order is identical across all three —
`translateY(...) scaleY(...)` in every one, below:

```tsx
/* src/components/StepScreen.tsx:636-648 — outer element, target */
            <motion.div
              key="product-card"
              className="px-[--space-xs]"
              // Bottom-anchored, matching the card's actual fixed position on
              // screen — both this exit and the entrance below rise/sink from
              // the bottom edge now, not the top, so the scale reads as
              // "growing up from where the card lives" rather than "dropping
              // in from somewhere above it."
              style={{ transformOrigin: 'bottom center' }}
              initial={false}
              exit={{ opacity: 0, transform: 'translateY(16px) scaleY(0.92)' }}
              transition={cardExitTransition}
            >
```

```tsx
/* src/components/StepScreen.tsx:649-670 — inner element, target */
              <motion.div
                key={step}
                className="flex flex-col rounded-t-[32px] px-4 pb-4 pt-5"
                style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-card)', transformOrigin: 'bottom center' }}
                // Rises up from below into place (translateY 16px → 0), not
                // down from above — the card is fixed to the bottom of the
                // screen, so entering from below reads as "arriving where it
                // lives" rather than falling in from above it. Composed as a
                // single `transform` string (not the `y`/`scaleY` shorthand
                // props) so this animates on the compositor instead of the
                // main thread — see AUDIT.md category 5 ("Framer Motion x/y/
                // scale shorthands are not hardware-accelerated").
                initial={{ opacity: 0, transform: 'translateY(16px) scaleY(0.94)' }}
                animate={{ opacity: 1, transform: 'translateY(0px) scaleY(1)' }}
                transition={cardSpring}
              >
```

(Doc comments above the `className`/`style` lines that aren't about the
`y`/`scaleY` values themselves — the V5 radius/padding comment on the
inner element — are unchanged and omitted here for brevity; keep them
exactly as they are in the file, only the `initial`/`animate`/`exit`
lines and the one comment directly above them change.)

## Repo conventions to follow

- `src/App.tsx:37-44` is the exemplar already in this codebase: its own
  doc comment explicitly frames this as "Percent-based translateX (not
  pixels)... `EASE_OUT_QUART`... 350ms" composed into one `transform`
  string on the `screenVariants` object, for the same reason (compositor-
  only animation). Match that same shape: one `transform:` key per motion
  object, never split across separate `x`/`y`/`scale` keys.
- Keep `transformOrigin: 'bottom center'` exactly as-is on both elements
  — that's unrelated to this fix (it's the anchor point, not the
  animated value) and already correct per AUDIT.md category 3.

## Steps

1. In `src/components/StepScreen.tsx`, on the outer `motion.div`'s `exit`
   prop (current line 646), replace `{ opacity: 0, y: 16, scaleY: 0.92 }`
   with `{ opacity: 0, transform: 'translateY(16px) scaleY(0.92)' }`.
2. On the inner `motion.div`'s `initial` prop (current line 667), replace
   `{ opacity: 0, y: 16, scaleY: 0.94 }` with `{ opacity: 0, transform:
   'translateY(16px) scaleY(0.94)' }`.
3. On the same inner `motion.div`'s `animate` prop (current line 668),
   replace `{ opacity: 1, y: 0, scaleY: 1 }` with `{ opacity: 1,
   transform: 'translateY(0px) scaleY(1)' }`.
4. Add one short comment line above the inner element's `initial` prop
   noting why it's a composed string now (see **Target** above for exact
   wording) — replacing/extending the existing "Rises up from below..."
   comment rather than duplicating it.

## Boundaries

- Do NOT touch `cardSpring`/`cardExitTransition` themselves
  (`StepScreen.tsx:189-199`) — this plan only changes which style keys
  carry the motion values, not the timing/curve.
- Do NOT touch any other `motion.div` in this file (the badge/content
  blocks use plain CSS `@keyframes`, not Framer Motion — out of scope).
- Do NOT change `transformOrigin`, `className`, or any non-motion style
  on either element.
- If the current code at these lines doesn't match what's quoted above
  (drift since commit 677c3d7), STOP and report instead of guessing at
  the right replacement.

## Verification

- **Mechanical**: `npx tsc --noEmit` — expect no errors (the `transform`
  key is a valid Framer Motion animatable property, no type changes
  needed).
- **Feel check**: run the app, open a tutorial, and:
  - Step through Next a few times — confirm the product card still rises
    up from the bottom with the same spring bounce/settle feel as before
    this change (this must be visually identical to the pre-fix
    behavior, only the underlying implementation changes).
  - On step 7, tap "Finish" — confirm the card still exits downward
    (opacity fades, sinks 16px, scales down to 0.92 vertically) over the
    same ~150ms.
  - In DevTools, open the Performance panel, record while rapidly
    tapping Next several times in a row, and confirm the `transform`
    animation shows up as compositor-only work (no unexpected "Layout"/
    "Recalculate Style" entries tied to this specific animation).
  - In DevTools Animations panel, set playback to 10% and step through
    one entrance in slow motion — confirm the translateY and scaleY move
    together smoothly, with no visible desync or stutter between them
    (confirms Framer Motion is interpolating the composed string
    correctly).
  - Toggle `prefers-reduced-motion` (Rendering panel) and confirm
    `cardSpring`/`cardExitTransition` still collapse to `duration: 0`
    (unaffected by this change — that branch, `StepScreen.tsx:190-199`,
    is untouched).
- **Done when**: the product card's entrance/exit is visually identical
  to before, but driven entirely by composed `transform` strings instead
  of `y`/`scaleY` shorthand props, matching `App.tsx`'s own established
  pattern.
