# 023 — Stagger InfoOverlay's card entrance behind its backdrop

- **Status**: DONE (with one correction found during execution — see plans/README.md)
- **Commit**: 9f1aa24
- **Severity**: LOW
- **Category**: Cohesion & tokens
- **Estimated scope**: 1 file — `src/components/InfoOverlay.tsx` (one new `transition.delay`)

## Problem

`src/components/InfoOverlay.tsx` animates the backdrop and the card as two
separate `motion.div`s, but with fully identical duration and easing and no
offset between them:

```tsx
/* src/components/InfoOverlay.tsx:254-264 — backdrop, current */
        <motion.div
          className="absolute inset-0 z-20 flex flex-col overflow-hidden md:rounded-2xl"
          style={{
            background: `linear-gradient(0deg, rgba(249,243,235,${BACKDROP_TINT_OPACITY}) 25.235%, rgba(247,233,202,${BACKDROP_TINT_OPACITY}) 84.117%)`,
            backdropFilter: `blur(${BACKDROP_BLUR_PX}px)`,
            WebkitBackdropFilter: `blur(${BACKDROP_BLUR_PX}px)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.2 : 0.35, ease: EASE_OUT_QUART }}
        >
```

```tsx
/* src/components/InfoOverlay.tsx:300-306 — card, current */
            <motion.div
              className="relative flex w-full max-w-[282px] flex-col items-start gap-4 overflow-hidden rounded-[24px] border border-solid px-10 py-12"
              style={{ borderColor: 'rgba(44, 41, 38, 0.1)', boxShadow: '0px 0px 8px rgba(14, 11, 6, 0.03)' }}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: 'scale(0.96)' }}
              animate={{ opacity: 1, transform: 'scale(1)' }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: 'scale(0.96)' }}
              transition={{ duration: reduceMotion ? 0.2 : 0.35, ease: EASE_OUT_QUART }}
            >
```

**Why it matters**: both elements start and finish at exactly the same
instant, so the whole modal — backdrop blur/tint and the card sitting on
top of it — pops in as one flat block. A brief stagger, with the card
following the backdrop rather than arriving in lockstep, would let the
entrance read as backdrop-first-then-card — a more considered, layered
appearance instead of everything materializing at once. This is
AUDIT.md §7's stagger guidance (30–80ms band, for group entrances),
applied to a two-element compound entrance rather than a list.

## Target

Add a `delay` to the card's `transition` only — the backdrop's transition is
unchanged. Use 60ms (mid-band, AUDIT.md's 30–80ms range), applied only on
entrance, not on exit (an exiting modal should feel like it leaves as one
unit — delaying the card's exit as well would make the card visibly hang
around after the backdrop has already started fading, which reads as
sluggish, not considered):

```tsx
/* src/components/InfoOverlay.tsx:300-306 — card, target */
            <motion.div
              className="relative flex w-full max-w-[282px] flex-col items-start gap-4 overflow-hidden rounded-[24px] border border-solid px-10 py-12"
              style={{ borderColor: 'rgba(44, 41, 38, 0.1)', boxShadow: '0px 0px 8px rgba(14, 11, 6, 0.03)' }}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: 'scale(0.96)' }}
              animate={{ opacity: 1, transform: 'scale(1)' }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: 'scale(0.96)' }}
              transition={{
                duration: reduceMotion ? 0.2 : 0.35,
                ease: EASE_OUT_QUART,
                delay: reduceMotion ? 0 : 0.06,
              }}
            >
```

The backdrop's own `transition` (lines 261-264) is left exactly as it is —
this plan only touches the card.

Note the `delay` is `0` under reduced motion, same reasoning as this file's
existing `duration: reduceMotion ? 0.2 : 0.35` branches elsewhere — reduced
motion should feel *faster and more direct*, not add an extra wait on top
of an already-shortened fade.

## Repo conventions to follow

- `transition: { duration: ..., ease: ..., delay: ... }` as one object
  literal, with the `reduceMotion ? x : y` ternary pattern inline per field
  — this file already does exactly this for `duration` on both `motion.div`s
  (lines 264, 306); this plan adds one more field to the same object using
  the identical ternary style, not a new pattern.
- `EASE_OUT_QUART` stays the easing for both elements — this plan does not
  introduce a second curve; only the timing offset changes.

## Steps

1. In `src/components/InfoOverlay.tsx`, locate the card's `motion.div`
   (current lines 300-306, identified by its
   `className="relative flex w-full max-w-[282px] ..."` — re-locate by this
   content if line numbers have shifted).
2. Change its `transition` prop from
   `{{ duration: reduceMotion ? 0.2 : 0.35, ease: EASE_OUT_QUART }}` to the
   three-field version shown in **Target** above, adding
   `delay: reduceMotion ? 0 : 0.06`.
3. Do not change the backdrop `motion.div`'s `transition` (lines 261-264) —
   it keeps its original two-field object with no delay.
4. Run `npx tsc -b` to confirm no type errors.

## Boundaries

- Do NOT add a `delay` to the backdrop's own transition — only the card
  should be delayed, so the backdrop still starts (and finishes) first.
- Do NOT add a delay to either element's `exit` behavior — Framer Motion
  applies the same `transition` object to enter and exit alike here, and
  AUDIT.md gives no reason to slow down a close; if avoiding a delayed exit
  requires splitting `transition` into separate enter/exit values, do that
  rather than accept a delayed close — but first re-confirm in a real
  browser (per the Feel check below) whether the shared `transition` object
  actually produces a delayed exit in practice, since Framer Motion's exit
  timing can differ from a naive reading of the object. If it does delay the
  exit, split `transition` into an explicit `initial`/`animate`-only delay
  (e.g. a separate object passed via a `custom`/variants approach, or two
  literal transition objects controlled by a boolean) rather than leaving
  the close sluggish — but keep this split minimal and scoped to the card
  only.
- Do NOT change the 60ms value without re-reading AUDIT.md §7's 30–80ms
  band — stay inside it.
- Do NOT touch the backdrop's `background`/`backdropFilter` values
  (`BACKDROP_TINT_OPACITY`/`BACKDROP_BLUR_PX`) — unrelated to this plan.
- If the current code doesn't match what's quoted above (drift since commit
  9f1aa24), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npx tsc -b` — expect no errors.
- **Feel check**: run the app, tap the info icon to open the overlay, and:
  - Confirm the backdrop blur/tint is visibly underway before the card
    starts scaling/fading in — the two should no longer look like a single
    simultaneous pop.
  - In DevTools, set Animations playback to 10% (or use the Animations
    panel's scrubber) and confirm the card's animation genuinely starts
    ~60ms after the backdrop's, not at the same frame.
  - Close the overlay (tap ✕) and confirm the close does NOT feel slower or
    more sluggish than before this change — if the card visibly lingers
    after the backdrop has faded, that's the delayed-exit case flagged in
    Boundaries above; fix it there rather than shipping a sluggish close.
  - Toggle `prefers-reduced-motion` (Rendering panel), reopen the overlay,
    and confirm both elements now appear together with no perceptible
    stagger (delay resolves to 0).
- **Done when**: the card visibly follows the backdrop on open by a short,
  noticeable-but-not-sluggish beat, the close remains just as snappy as
  before this change, and reduced motion shows no stagger at all.
