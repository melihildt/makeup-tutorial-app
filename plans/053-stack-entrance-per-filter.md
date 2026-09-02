# 053 — Replay the tutorial stack's entrance on every filter switch, not just once per session

- **Status**: TODO
- **Commit**: 3ecf622
- **Severity**: MEDIUM
- **Category**: Missed opportunity (AUDIT.md §8)
- **Estimated scope**: 1 file, one module-level variable + its lazy initializer

## Problem

`HomeScreen.tsx` force-remounts `TutorialStack` on every Day/Night/Glam tap
(`key={selectedType}`) — a genuinely fresh deck of cards each time. But
`TutorialStack`'s own entrance animation is gated by a plain module-level
boolean that only ever allows the entrance to play once per page session,
full stop:

```tsx
/* src/components/TutorialCard.tsx:2297-2316 — current */
// Module-level, not component state — deliberately survives a
// TutorialStack unmount/remount (App.tsx swaps HomeScreen out entirely
// while TutorialFlow is showing, so a fresh TutorialStack instance mounts
// every time you return to Home), only resetting on an actual page
// reload. That's what makes the entrance below genuinely "first load of
// the session," not "every time you come back from a tutorial" — a
// useRef inside the component wouldn't survive the remount, this has to
// live outside it.
let hasPlayedStackEntrance = false

export function TutorialStack({ tutorials, onSelect, lookType, savedIds, onToggleSave }: TutorialStackProps) {
  const reduceMotion = useReducedMotion()
  // Lazy initializer runs exactly once per mount, reading *and* flipping
  // the module flag together — the next TutorialStack instance (a return
  // from TutorialFlow) sees it already true and skips the entrance.
  const [playEntrance] = useState(() => {
    if (hasPlayedStackEntrance) return false
    hasPlayedStackEntrance = true
    return true
  })
```

```tsx
/* src/components/HomeScreen.tsx:550-564 — current, for reference (the
   remount trigger this flag doesn't distinguish from a tutorial round-trip) */
{/* key={selectedType}: forces a fresh TutorialStack instance per
    chip instead of the same instance re-rendering with a swapped
    `tutorials` array — see this component's own module comment
    for why (activeCardIndex, the drag motion values, etc. are all
    internal to TutorialStack and keyed to array position, not
    tutorial identity; remounting is what resets them cleanly to
    the new deck's own front card). */}
<TutorialStack
  key={selectedType}
  tutorials={visibleTutorials}
  onSelect={onSelectLook}
  lookType={selectedType}
  savedIds={savedTutorialIds}
  onToggleSave={onToggleSavedTutorial}
/>
```

Every filter switch produces a `TutorialStack` remount exactly the same way
a tutorial round-trip does (both go through `App.tsx` unmounting/remounting
`HomeScreen` wholesale, or `key={selectedType}` changing) — but only the
very first `TutorialStack` mount of the whole session ever sees
`playEntrance: true`. Switch Day → Night → Glam → Day and the deck just
teleports into place on every one of those, even though each is a
completely different set of cards sliding into a completely fresh component
instance.

## Target

Track *which* filter last played its entrance instead of a plain
ever-played boolean. A mount for the same filter you were already on (a
tutorial round-trip, the exact case this flag was built to skip) still
skips the entrance. A mount for a genuinely different filter — any
Day/Night/Glam switch, even to a filter you've visited before this session
— always gets one, since `key={selectedType}` already treats that as a real
new-content moment.

```tsx
/* src/components/TutorialCard.tsx:2297-2316 — target */
// Module-level, not component state — deliberately survives a
// TutorialStack unmount/remount (App.tsx swaps HomeScreen out entirely
// while TutorialFlow is showing, so a fresh TutorialStack instance mounts
// every time you return to Home), only resetting on an actual page
// reload. Tracks *which* filter's deck last played its entrance, not just
// whether one ever has (plans/053) — returning to Home on the SAME filter
// you left (e.g. after a tutorial) skips the entrance, same as before;
// switching to a DIFFERENT filter (Day/Night/Glam) always gets one, since
// key={selectedType} (HomeScreen.tsx) already forces a full remount with a
// genuinely different deck of cards on every such switch — that's a real
// "new content" moment, not a repeat view of the same screen. A useRef
// inside the component wouldn't survive the remount, this has to live
// outside it.
let lastEntranceLookType: LookType | null = null

export function TutorialStack({ tutorials, onSelect, lookType, savedIds, onToggleSave }: TutorialStackProps) {
  const reduceMotion = useReducedMotion()
  // Lazy initializer runs exactly once per mount, reading *and* updating
  // the module value together. Compares by lookType, not a plain boolean
  // (plans/053): a mount for the same filter as last time (a tutorial
  // round-trip) skips the entrance; a mount for a *different* filter (an
  // actual Day/Night/Glam switch) always gets one, even if that filter has
  // already been visited earlier this session.
  const [playEntrance] = useState(() => {
    if (lastEntranceLookType === lookType) return false
    lastEntranceLookType = lookType
    return true
  })
```

No other line changes — the rest of `TutorialStack` (the entrance
`motion.div`, `total`, `activeCardIndex`, etc.) is untouched, since
`playEntrance` still resolves to the same `boolean` type it always did.

## Repo conventions to follow

- `LookType` is already imported into this file
  (`src/components/TutorialCard.tsx:71`, `import type { LookType } from
  './HomeScreen'`) — reuse it directly rather than inventing a new type or
  widening to `string`.
- Module-level (not `useRef`/`useState`-only) state that deliberately
  survives a remount is already this exact variable's own established
  pattern — this plan only changes what it tracks, not the module-level
  architecture itself.

## Steps

1. In `src/components/TutorialCard.tsx`, replace lines 2297-2316 exactly as
   shown in Target above: rename `hasPlayedStackEntrance` (a `boolean`) to
   `lastEntranceLookType` (a `LookType | null`, initialized to `null`), and
   update its own module comment plus the `playEntrance` lazy initializer's
   comment and logic to compare by `lookType` instead of checking/flipping a
   boolean.

## Boundaries

- Do NOT touch `HomeScreen.tsx` — `key={selectedType}`'s remount behavior is
  already correct and is the mechanism this fix relies on, not something to
  change.
- Do NOT touch the entrance `motion.div` itself (`initial`/`animate`/
  `transition` props, further down in `TutorialStack`) — only how
  `playEntrance` is computed changes, not how it's consumed.
- Do NOT add any new prop, context, or persisted (e.g. `localStorage`) state
  — this stays a plain module-level variable, same lifecycle as before.
- If lines 2297-2316 don't match the Problem snippet above (drift since
  commit `3ecf622`), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npx tsc --noEmit` clean (confirms `LookType | null`
  satisfies every comparison/assignment site). `npm run build` clean.
- **Feel check**: reload the app fresh, watch the first stack load (float up
  — unchanged, this is the pre-existing first-mount case).
  - Tap Night: the new deck should now float up the same way the first load
    did. Tap Glam: same. Tap back to Day: same — even though Day was the
    very first filter shown this session, switching back to it is treated
    as a new deck moment now, so it should float up again too.
  - Start a tutorial from any filter, then tap Back until you exit back to
    Home on that *same* filter — confirm the deck does **not** replay its
    entrance on this return (the original bug this flag existed to prevent
    must stay fixed).
  - Repeat that same round-trip test on a different filter (e.g. start a
    tutorial from Night, exit back to Home still on Night) — same result,
    no replay.
  - In DevTools' Animations panel, set playback to 10% while switching
    filters and confirm the fade + translateY + scale entrance plays
    cleanly on each switch, matching the very first load's own motion.
  - Toggle `prefers-reduced-motion` and confirm filter switches still skip
    the entrance animation correctly (the `reduceMotion` branch elsewhere in
    this component is unaffected by this plan).
- **Done when**: every Day/Night/Glam switch plays the stack's float-up
  entrance, a tutorial round-trip back to the same filter still does not,
  and reduced-motion behavior is unchanged.
