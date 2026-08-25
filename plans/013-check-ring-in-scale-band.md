# 013 — Bring check-ring-in's entrance scale inside AUDIT.md's 0.9–0.97 band

- **Status**: TODO
- **Commit**: 677c3d7
- **Severity**: LOW
- **Category**: Physicality & origin (cross-referenced with Cohesion & tokens)
- **Screen impact**: Home, Tutorial step, All steps view (one shared keyframe, reused across all three)
- **Estimated scope**: 1 file, 1 value edit — affects 6 call sites across 4 components, none of which need their own changes

## Problem

`src/index.css:47-52`'s `check-ring-in` keyframe animates its entrance
from `scale(0.85)`:

```css
/* src/index.css:47-52 — current */
@keyframes check-ring-in {
  /* The ring (checked or unchecked) settling in after the swap — subtle,
     so it doesn't compete with the pop or the checkmark draw. */
  from { opacity: 0; transform: scale(0.85); }
  to { opacity: 1; transform: scale(1); }
}
```

AUDIT.md's Physicality & origin category is explicit: "Never `scale(0)`
— nothing in the real world appears from nothing. Target: `scale(0.9–0.97)`
+ `opacity: 0`." `0.85` falls outside that band.

This one keyframe is reused verbatim at **six call sites** across **four
components**, so the deviation isn't a one-off — it's the app's single
shared "new element settling in" motion, used on:

```tsx
/* src/components/CheckIndicator.tsx:76 and :104 — the product checklist's own checked/unchecked ring (Tutorial step + All steps view, via ProductCard) */
            style={animate ? { animation: 'check-ring-in var(--duration-base) var(--ease-out-quart)' } : undefined}
```

```tsx
/* src/components/ScreenHeader.tsx:219 and :234 — the active Search/Widget tab's own frosted-chip overlay (Tutorial step + All steps view, shared header) */
              style={{ ...HEADER_CHIP_STYLE, animation: 'check-ring-in var(--duration-base) var(--ease-out-quart)' }}
```

```tsx
/* src/components/HomeScreen.tsx:346 — a Day/Night/Glam filter chip's icon reveal (Home) */
        <span className="relative" style={{ animation: 'check-ring-in var(--duration-base) var(--ease-out-quart)' }}>
```

```tsx
/* src/components/TutorialCard.tsx:886 — StartOverCard's filter-color image swap (Home) */
        style={{ animation: 'check-ring-in var(--duration-base) var(--ease-out-quart)' }}
```

**Why it matters**: because it's shared, this is unusually high-leverage —
one value change improves cohesion at every one of these six sites
simultaneously, across every screen in the app that has any "settle in"
motion at all.

## Target

```css
/* src/index.css:47-52 — target */
@keyframes check-ring-in {
  /* The ring (checked or unchecked) settling in after the swap — subtle,
     so it doesn't compete with the pop or the checkmark draw. Scale
     starts at 0.92 (AUDIT.md's Physicality & origin band is 0.9–0.97;
     this was 0.85, outside it — nothing in the real world appears from
     nothing, so the entrance should read as a small settle, not a near-
     invisible-to-full pop). */
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}
```

`0.92` is chosen as a middle value in the 0.9–0.97 band — subtle enough to
stay quiet (this motion's own comment says it "shouldn't compete with the
pop or the checkmark draw"), clearly inside the audited range.

## Repo conventions to follow

- This is the one keyframe definition in `src/index.css` — no component
  file needs any change; all six call sites read the keyframe by name and
  pick up the new value automatically.
- Don't rename the keyframe or move it — only its `from` rule's
  `transform` value changes.

## Steps

1. In `src/index.css`, on the `check-ring-in` keyframe's `from` rule
   (current line 50), change `transform: scale(0.85)` to `transform:
   scale(0.92)`.
2. Update the keyframe's own doc comment (lines 48-49) to note the AUDIT
   band reasoning, as shown in **Target** above.

## Boundaries

- Do NOT touch any of the 6 call sites listed above — none of them need
  their own edits, the keyframe change alone applies everywhere.
- Do NOT change `to { transform: scale(1); }`, `opacity`, or the
  keyframe's duration/easing (those are set per call site via
  `--duration-base`/`--ease-out-quart`, already correct and out of
  scope).
- Do NOT touch any other keyframe in `index.css` (e.g. `check-pop`,
  `illustration-layer-in`, which have their own separate scale values,
  already inside or outside AUDIT's band for different reasons not part
  of this finding).
- If `check-ring-in`'s current `from` value isn't `scale(0.85)` (drift
  since commit 677c3d7), STOP and report instead of guessing at a
  replacement.

## Verification

- **Mechanical**: no build step needed — this is a pure CSS value change,
  no TypeScript involved. `grep -n "scale(0.85)" src/index.css` — expect
  zero matches after the edit.
- **Feel check**: run the app and trigger each of the 6 call sites at
  least once:
  - Toggle a product's checked state on a per-step screen (ProductCard →
    CheckIndicator) and in the All Steps list view — confirm the ring
    settles in with a slightly larger starting scale than before, still
    subtle.
  - Switch between the Search and Widget header tabs (works on any
    per-step screen or the All Steps view) — confirm the active tab's
    frosted-chip overlay settles in the same way.
  - Tap a Day/Night/Glam filter chip on the Home screen — confirm its
    icon reveal settles in.
  - Reach the Start Over card (swipe through all 4 tutorials) and tap a
    different filter chip while it's showing — confirm the ghost image
    swap's settle-in reads the same subtle way.
  - In DevTools Animations panel, set playback to 10% and step through
    one instance in slow motion — confirm it's a clean scale-up, no pop
    or overshoot (this keyframe has no bounce, only a linear scale from
    0.92→1).
- **Done when**: all six call sites visibly use the same, slightly larger
  starting scale, with no other change to timing, opacity, or shape.
