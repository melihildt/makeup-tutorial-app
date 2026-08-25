# 016 — Animate the product-sheet reserved-height collapse on Finish→Done

- **Status**: DONE
- **Commit**: 677c3d7
- **Severity**: MEDIUM
- **Category**: Missed opportunity (Interruptibility-adjacent)
- **Screen impact**: Tutorial step (the Finish → "You're done!" transition specifically)
- **Estimated scope**: 1 file (`src/components/StepScreen.tsx`), 1 element converted to `motion.div`

## Problem

`src/components/StepScreen.tsx:620-623` reserves a fixed height for the
bottom product sheet so the step-screen text above stays consistently
positioned across steps with different product counts. That reservation
is a plain, un-transitioned inline style:

```tsx
/* src/components/StepScreen.tsx:620-623 — current */
      <div
        className={content.products.length > 0 ? 'flex flex-col justify-end' : undefined}
        style={content.products.length > 0 ? { minHeight: PRODUCT_SHEET_RESERVED_HEIGHT } : undefined}
      >
```

`content.products.length` is `0` only for step 8 (the terminal "done"
screen — see `src/data/stepContent.ts`'s own step-8 entry, `products:
[]`). So this wrapper's `minHeight: 238` disappears in a single,
un-animated frame exactly when `onExitComplete` advances `step` to 8:

```tsx
/* src/components/StepScreen.tsx:624-633 — the AnimatePresence this wrapper contains, current, for context (unchanged by this plan) */
        <AnimatePresence
          onExitComplete={() => {
            if (stepRef.current === 7) {
              onFinish?.()
            }
            setIsFinishing(false)
          }}
        >
```

**Why it matters**: by the time `minHeight` disappears, the product
card's own 150ms exit animation has *already finished* (that's what
`onExitComplete` waits for) — but the scrollable region above (sized via
`min-h-full` against this element's real height, see that region's own
comment) reflows by up to 238px in the exact same frame the badge fades
in and the "You're done!" title/description start their own
`step-content-in` slide. This is the single rarest, highest-emotion
moment in the whole flow, and it currently rides in on a layout snap.

## Target

**Revision note**: the first version of this plan specified Framer
Motion's `layout` prop. That was executed, then live-verified (RAF-level
polling of the element's own `getBoundingClientRect().height` across the
real transition) to do *nothing* — `layout` uses the FLIP technique, which
visually compensates a layout change with an inverse transform computed
as `oldSize/newSize`; collapsing to a target height of 0 makes that ratio
divide by zero, so there's no valid inverse transform to animate from.
Confirmed: height snapped 238→0 with zero intermediate frames. A second
attempt animating the numeric `minHeight` value directly via `animate`
was also tried and also confirmed (same RAF-polling method) to snap
instantly with no interpolation — Framer Motion doesn't recognize
`minHeight` as an animatable style key, so it just sets the value
directly. Plain `height` **is** one of Motion's recognized animatable
properties (the standard expand/collapse pattern) — confirmed via the
same live measurement to actually interpolate frame-by-frame (238 → 230 →
188 → 153 → 122 → ... → 0 over ~300ms). This is what's specified below;
do not substitute `layout` or `minHeight` for `height`, both are
confirmed non-working for this specific case.

Convert the wrapper to a `motion.div`, animating `height` directly via
Motion's `animate` prop rather than `minHeight` or the `layout` prop:

```tsx
/* src/components/StepScreen.tsx:620-623 — target */
      <motion.div
        // Animates this wrapper's own reserved-height collapse instead of
        // letting it disappear in one frame — this only ever changes
        // (content.products.length flips from >0 to 0) on the Finish→Done
        // transition, the rarest and highest-emotion moment in this flow,
        // so it's worth a real transition rather than a layout snap.
        //
        // Two things verified live (RAF-level polling of the element's
        // own rendered height across the real transition, not assumed):
        // the `layout` prop does nothing here (FLIP's inverse-transform
        // math divides by zero when collapsing to a target height of 0 —
        // confirmed instant 238→0 snap, zero intermediate frames), and
        // animating `minHeight` directly also snaps instantly (Framer
        // Motion doesn't recognize `minHeight` as an animatable style
        // key). Plain `height` (below) IS recognized and genuinely
        // interpolates frame-by-frame — confirmed, not assumed from docs.
        //
        // A real layout-property tween (not FLIP) is what AUDIT.md's
        // Performance category would normally flag, but this is a
        // one-shot, rare transition (once per tutorial completion), not a
        // frequent one, so the tradeoff is deliberate here. `height`
        // instead of `minHeight` also means this box no longer *grows*
        // past PRODUCT_SHEET_RESERVED_HEIGHT if some future step's sheet
        // ever exceeds it (it would clip instead) — matches
        // PRODUCT_SHEET_RESERVED_HEIGHT's own comment that a future
        // 3+-product step already needs that constant bumped anyway; no
        // current step is affected.
        initial={false}
        animate={{ height: content.products.length > 0 ? PRODUCT_SHEET_RESERVED_HEIGHT : 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.35, ease: EASE_OUT_QUART }}
        className={content.products.length > 0 ? 'flex flex-col justify-end' : undefined}
      >
```

0.35s matches `--duration-layout`'s own value (350ms, "larger layout/
content changes" — tokens.css), the semantically correct token for this
specific, rare, real layout change (as opposed to finding 14/plan 021's
separate concern, which is about *StepScreen's frequent per-step* badge/
content swap being too slow at that same value — this is a different,
one-shot case where the slower pace is appropriate). `EASE_OUT_QUART` is
imported from `TutorialCard.tsx` — this plan was executed after plan 012
(which adds that import to this file), so it's used directly rather than
a hand-typed array; if executing this plan on a codebase where 012 hasn't
landed yet, either run 012 first or fall back to the literal
`[0.25, 1, 0.5, 1]` array (the same curve, matching `cardExitTransition`'s
own pre-012 form elsewhere in this file).

Note the `style` prop is removed entirely — `height` is now fully
controlled by the `animate` prop (Motion applies it as the element's
actual inline style), so there's nothing left for a separate `style`
object to set.

## Repo conventions to follow

- `prefersReducedMotion` (`StepScreen.tsx:189`) is already computed once
  near the top of this component and used to gate `cardSpring`/
  `cardExitTransition` — reuse that exact same variable, don't create a
  second `useReducedMotion()` call.
- `motion` is already imported from `framer-motion` in this file
  (`StepScreen.tsx:2`) — no new import needed.

## Steps

1. In `src/components/StepScreen.tsx`, change the opening tag of the
   wrapper `<div>` (current line 620) to `<motion.div`, and its closing
   tag (later in the file, currently a bare `</div>` immediately after
   `</AnimatePresence>`) to `</motion.div>`.
2. Add `initial={false}`, the `animate` prop, and the `transition` prop
   shown in **Target** above, placed before `className`.
3. Remove the `style` prop entirely — `height` is now controlled via
   `animate`, so there's nothing left for it to set.
4. Run `npx tsc --noEmit` to confirm no type errors.

## Boundaries

- Do NOT use `layout` or animate `minHeight` — both confirmed
  non-working for this case, see the revision note in **Target** above.
- Do NOT change `PRODUCT_SHEET_RESERVED_HEIGHT`'s value or the condition
  that drives the height (`content.products.length > 0`) — only how the
  resulting size change is animated.
- Do NOT touch the `AnimatePresence`/product-card motion elements this
  wrapper contains — untouched, out of scope.
- If the current code at this wrapper doesn't match what's quoted above
  (drift since commit 677c3d7), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npx tsc --noEmit` — expect no errors.
- **Feel check**: run the app, complete a tutorial through to step 7, and:
  - Tap "Finish" — confirm the product card exits as before (unchanged),
    and then, as the "You're done!" content fades/slides in, confirm the
    space where the product sheet used to be closes smoothly rather than
    snapping instantly. The scrollable content above should visibly
    settle into its new position instead of jumping.
  - Navigate through ordinary Next/Back on steps 1-7 — confirm no visible
    change to normal step-to-step behavior (this wrapper's size doesn't
    change on those transitions, since every real step has
    `products.length > 0`, all reserving the same 238px).
  - Toggle `prefers-reduced-motion` (Rendering panel) and repeat the
    Finish tap — confirm the collapse becomes instant (no visible
    transition duration) rather than disappearing outright or being
    stuck mid-animation.
  - For real proof rather than eyeballing: grab a live reference to the
    wrapper element before tapping Finish, then poll
    `wrapper.getBoundingClientRect().height` every animation frame for
    ~1 second after the tap (`requestAnimationFrame` loop, not a fixed
    `setInterval`) and confirm the recorded values show a real descending
    curve (e.g. 238 → 230 → 188 → 153 → ... → 0), not a single jump from
    238 straight to 0.
- **Done when**: the Finish→Done transition's height genuinely
  interpolates (verified via live polling, not just visual impression),
  with reduced motion correctly collapsing it to instant, and no change
  to any other step transition.
