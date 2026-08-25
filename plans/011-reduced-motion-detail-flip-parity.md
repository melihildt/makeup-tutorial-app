# 011 — Give reduced-motion users the same tutorial detail content, not just less motion

- **Status**: DONE
- **Commit**: 677c3d7
- **Severity**: HIGH
- **Category**: Accessibility
- **Estimated scope**: 1 file (`src/components/TutorialCard.tsx`), 1 new state hook + 1 new handler + rewriting one `.map()` block (~25 lines net)

## Problem

`src/components/TutorialCard.tsx`'s `TutorialStack` component has two
completely different render paths depending on `useReducedMotion()`. Under
normal motion, tapping a tutorial card does **not** open the tutorial —
it flips the card to reveal `TutorialDetailCard`: a level pill, a
product-photo preview row with a "+N products used" caption, and an
explicit "Start Tutorial" button, which is the *only* thing that actually
opens the tutorial:

```tsx
/* src/components/TutorialCard.tsx:1820 — normal-motion path (front card) */
            onSelect={handleCardTap}
```

```tsx
/* src/components/TutorialCard.tsx:1885-1890 — normal-motion path (detail face) */
          <TutorialDetailCard
            tutorial={variant.tutorial}
            onFlipBack={isInteractive ? handleCardTap : undefined}
            onStart={isInteractive ? onSelect : undefined}
            disabled={!isInteractive}
          />
```

Under `prefers-reduced-motion: reduce`, `TutorialStack` skips all of this
and renders a plain scrollable list where **tapping a card opens the
tutorial directly** — `onSelect` (the real "open tutorial" callback) is
wired straight to the card's own tap handler:

```tsx
/* src/components/TutorialCard.tsx:2113-2136 — reduced-motion path, current, full block */
  if (reduceMotion) {
    return (
      // Reduced motion keeps a plain opacity fade on first load rather
      // than skipping the entrance outright — comprehension-neutral (it
      // doesn't move anything, just appears a beat softer than an instant
      // pop), which is what "fewer and gentler, not zero" means in
      // practice, not literally no transition anywhere.
      <motion.div
        className="mx-auto flex w-[338px] flex-col gap-4"
        initial={playEntrance ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: EASE_OUT_QUART }}
      >
        {tutorials.map((tutorial) => (
          <TutorialLookCard
            key={tutorial.id}
            tutorial={tutorial}
            onSelect={onSelect}
            saved={savedIds.has(tutorial.id)}
            onToggleSave={() => handleToggleSave(tutorial.id)}
          />
        ))}
      </motion.div>
    )
  }
```

**Why it matters**: `prefers-reduced-motion` is a request to reduce
*motion*, not to withdraw *information*. A reduced-motion user tapping a
card is sent straight into the tutorial with no way to see the level
(easy/medium/experienced), the product preview, or the "+N products used"
count first — content every motion user gets automatically as part of the
flip. This is a functional/content gap wearing an accessibility
preference's clothing, not a motion-only difference. AUDIT.md's own
accessibility guidance is explicit: reduced motion means "fewer and
gentler animations, not zero" — the fix below follows that same spirit:
strip the *animation* of the flip (already correctly absent — the list
below doesn't need one), but keep the *content* of the flip.

## Target

Add one small piece of state (mirroring the existing `savedIds` Set
pattern immediately above it) tracking which cards are currently
expanded, and render `TutorialDetailCard` in place of `TutorialLookCard`
for whichever tutorial ids are in that set — an instant, unanimated swap
(no new animation is being added here; reduced motion should stay
motion-light, this plan restores *content*, not motion):

```tsx
/* src/components/TutorialCard.tsx — target, inserted immediately after
   the existing `handleToggleSave` function (current line 2051), before
   `handleCommitStart` */

  // Reduced-motion equivalent of the normal-motion flip's `isFlipped` —
  // see this file's `handleCardTap`/`TutorialDetailCard` for the
  // non-reduced-motion version of the same idea. A Set (not a single id)
  // because this is a plain scrollable list, not a one-card-at-a-time
  // stack — more than one card can legitimately be expanded at once here,
  // unlike the stack's single front card.
  const [flippedIds, setFlippedIds] = useState<Set<string>>(() => new Set())

  function handleToggleFlip(id: string) {
    handleInteraction()
    setFlippedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }
```

```tsx
/* src/components/TutorialCard.tsx:2113-2136 — reduced-motion path, target, full block */
  if (reduceMotion) {
    return (
      // Reduced motion keeps a plain opacity fade on first load rather
      // than skipping the entrance outright — comprehension-neutral (it
      // doesn't move anything, just appears a beat softer than an instant
      // pop), which is what "fewer and gentler, not zero" means in
      // practice, not literally no transition anywhere.
      <motion.div
        className="mx-auto flex w-[338px] flex-col gap-4"
        initial={playEntrance ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: EASE_OUT_QUART }}
      >
        {tutorials.map((tutorial) =>
          flippedIds.has(tutorial.id) ? (
            // Same detail content a motion user reaches by flipping the
            // card (level, product preview, the actual "Start Tutorial"
            // CTA) — reduced motion drops the flip *animation*, not this
            // content. Swapped in instantly (no transition/animation
            // added here), matching "fewer and gentler, not zero": the
            // gentleness is in *not* adding new motion, not in hiding
            // content a sighted/motion user would otherwise get.
            <TutorialDetailCard
              key={tutorial.id}
              tutorial={tutorial}
              onFlipBack={() => handleToggleFlip(tutorial.id)}
              onStart={onSelect}
            />
          ) : (
            <TutorialLookCard
              key={tutorial.id}
              tutorial={tutorial}
              onSelect={() => handleToggleFlip(tutorial.id)}
              saved={savedIds.has(tutorial.id)}
              onToggleSave={() => handleToggleSave(tutorial.id)}
            />
          ),
        )}
      </motion.div>
    )
  }
```

Note the behavioral parity this achieves, matching the normal-motion path
exactly:
- Tapping a card's face (`TutorialLookCard`'s `onSelect`) now flips it to
  the detail face, exactly like `handleCardTap` does for the front card
  under normal motion — it no longer opens the tutorial directly.
- Tapping "Start Tutorial" on the detail face (`TutorialDetailCard`'s
  `onStart`) is what actually opens the tutorial — wired to `onSelect`,
  the same prop `TutorialStack` already receives and threads through
  everywhere else (see `TutorialCard.tsx:1888`'s `onStart={isInteractive
  ? onSelect : undefined}` for the normal-motion equivalent).
- Tapping the detail face itself (`TutorialDetailCard`'s `onFlipBack`)
  flips back to the look face — same as `handleCardTap` flipping back
  under normal motion.
- The bookmark toggle (`saved`/`onToggleSave`) is untouched and still
  works identically on the look face.

`disabled` is intentionally omitted on both components in this branch
(same as the current code already does for `TutorialLookCard`) — the
reduced-motion list has no drag-lock/`isInteractive` concept, every card
in it is always interactive.

## Repo conventions to follow

- `savedIds`/`handleToggleSave` (`TutorialCard.tsx:2034-2051`),
  immediately above where this plan's new state goes, is the exact
  pattern to copy: a `useState<Set<string>>(() => new Set())` plus a
  toggle function that clones the Set rather than mutating it in place.
  Match that shape exactly for `flippedIds`/`handleToggleFlip`.
- `handleInteraction()` (`TutorialCard.tsx:2012-2014`) is already called
  at the top of `handleToggleSave` — call it the same way at the top of
  the new `handleToggleFlip`, for the same reason (marks the swipe-hint
  nudge's "has the user touched this" flag).
- `TutorialDetailCard`'s props (`tutorial`, `onFlipBack`, `onStart`,
  `disabled`) are defined at `TutorialCard.tsx:606-616` — this plan uses
  exactly that existing signature, no changes to `TutorialDetailCard`
  itself are needed or in scope.

## Steps

1. In `src/components/TutorialCard.tsx`, immediately after the closing
   `}` of `handleToggleSave` (current line 2051) and before `function
   handleCommitStart()` (current line 2053), insert the new
   `flippedIds` state and `handleToggleFlip` function shown in **Target**
   above.
2. Replace the entire `if (reduceMotion) { ... }` block (current lines
   2113-2136) with the target version shown above — the `tutorials.map()`
   callback changes from returning a single `TutorialLookCard`
   unconditionally to a ternary choosing between `TutorialDetailCard` (if
   `flippedIds.has(tutorial.id)`) and `TutorialLookCard` (otherwise).
3. Run `npx tsc --noEmit` to confirm both components' props are satisfied
   correctly (in particular, that `TutorialDetailCard` is not passed
   `disabled` or any prop it doesn't accept).

## Boundaries

- Do NOT modify `TutorialDetailCard`, `TutorialLookCard`, or
  `handleCardTap` themselves — this plan only changes which component
  `TutorialStack`'s reduced-motion branch renders and how, reusing both
  components exactly as they already exist.
- Do NOT add any transition/animation to the flip swap in this branch —
  the fix is restoring *content*, not adding motion; an instant swap is
  the correct, intentional target here, not an oversight to "finish
  later."
- Do NOT touch the normal-motion path (everything after the `if
  (reduceMotion)` block) — it's already correct and out of scope.
- Do NOT touch `playEntrance`, the outer `motion.div`'s fade-in, or
  anything about the list's own mount animation — only the `.map()`
  body inside it changes.
- If the current code at lines 2113-2136 (or the `handleToggleSave`
  function it sits near) doesn't match what's quoted above (drift since
  commit 677c3d7), STOP and report instead of improvising a different
  insertion point.

## Verification

- **Mechanical**: `npx tsc --noEmit` — expect no errors.
- **Feel check**: enable `prefers-reduced-motion: reduce` (DevTools
  Rendering panel → "Emulate CSS media feature prefers-reduced-motion:
  reduce") and reload the app, then:
  - Confirm the home screen shows the plain scrollable list (unchanged
    from before this fix).
  - Tap any tutorial card's face (not the bookmark) — confirm it swaps
    instantly (no animation, by design) to the detail face, showing the
    level pill, product preview thumbnails, "+N products used" caption,
    and a "Start Tutorial" button — the same content a motion user would
    see after flipping that same card.
  - Tap the detail face anywhere *except* "Start Tutorial" — confirm it
    swaps back to the look face instantly.
  - Tap "Start Tutorial" specifically — confirm it opens the tutorial
    (same destination as the normal-motion path's own CTA).
  - Tap the bookmark icon on the look face — confirm it still saves/
    unsaves correctly and does not also flip the card (its own
    `stopPropagation` should still isolate it).
  - Expand two different cards' detail faces at once (tap card A, then
    tap card B without flipping A back) — confirm both stay expanded
    independently (this is the one deliberate behavioral difference from
    the stack's single-card-at-a-time model, and is correct for a plain
    list).
  - Toggle `prefers-reduced-motion` back off and confirm the normal-motion
    stack (drag, flip, fly-off) is completely unaffected — this plan
    touches only the `reduceMotion` branch.
- **Done when**: a reduced-motion user can reach the exact same
  level/product-preview/CTA content a motion user reaches via the flip,
  through an unanimated tap-to-expand list item, with the bookmark and
  "open tutorial" actions both still working correctly.
