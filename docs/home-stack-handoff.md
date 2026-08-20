# Handoff — Home screen tutorial stack & motion

Written to carry context into a fresh session/window without re-deriving
everything from scratch. Scoped to the **HomeScreen card stack** (drag,
tilt, fly-off, loop) and its motion tuning — a separate area from
`docs/handoff.md` (the step-flow/illustration doc, now stale on the "no
home page" point — a home page exists now, see below).

**Nothing in this feature is committed yet.** `git status` shows
`index.html`, `AllStepsView.tsx`, `HomeScreen.tsx`, `StepScreen.tsx`,
`tokens.css` modified and `TutorialCard.tsx` untracked, all from this
work. Consider committing before starting a new session on top of it, or
at least know the working tree *is* the feature right now — there's no
committed baseline to diff against.

## What this covers

The home screen (`HomeScreen.tsx`) shows a stack of tutorial cards
(`TutorialCard.tsx`) — a front card plus one peeking card behind it. You
can tap the front card to open its tutorial, or drag/swipe it (any
direction) to advance to the next one, looping back to the first after
the last. Only "Soft Smokey Eye" has a real tutorial behind it
(`TutorialFlow`); the other three tutorials are real UI with placeholder
content, not wired to anything — same "not functional yet" spirit as the
Day/Night/Glam filter chips below the stack.

## Architecture — `src/components/TutorialCard.tsx`

One file, several pieces, roughly back-to-front:

- **`Tutorial` type + `TUTORIALS` array** — the 4 tutorials' data (title,
  brand, duration, real images for the one with content, placeholder
  colors for the other three).
- **`TutorialLookCard`** — one card's look, at rest. Dumb about
  scroll/drag; just renders a card given a `tutorial`, plus optional
  `detailsOpacity` (for the reveal system, below).
- **`CardBehind`** — the flat placeholder-tint layer, now embedded inside
  each card's own peek presentation (not a separate static prop like the
  first version — see "Ghost/mask reveal system").
- **`useCardMotion(activeIndex, cardIndex, total)`** — the core per-card
  pose math. Takes the stack's continuous `activeIndex` value and a
  card's own index, returns motion values for rotation, opacity, z-index,
  and the content-reveal band. `circularLocal()` is the key helper: signed
  distance from `cardIndex` to `activeIndex`, **wrapped** so the loop
  (last card → first card) doesn't produce a huge stale distance — this
  was a real, hard-to-spot bug (see "Bugs fixed" below).
- **`TutorialStackCard`** — one card's full behavior: composes rotation,
  drag position, grip scale into one `transform`; owns the drag gesture
  (`handleDragStart`/`handleDrag`/`handleDragEnd`); decides commit vs.
  cancel; only the front card is ever interactive.
- **`TutorialStack`** — owns `activeCardIndex` (state) and `activeIndex`
  (continuous motion value driving all the per-card math), advances on a
  committed drag, handles the wrap-to-first loop, renders the temporary
  `MotionTuner` panel (see below).

`HomeScreen.tsx` just renders `<TutorialStack tutorials={TUTORIALS}
onSelect={onSelectLook} />` — no scroll container, no ref threading. An
earlier version *was* scroll-linked (pin-and-scrub through the deck via
real page scroll) but that fought the page's own vertical scroll on a
real touchscreen constantly; it's fully drag-native now, no scroll
involvement at all. If "scroll to browse" ever comes back as a request,
re-read that reasoning in `TutorialStack`'s own module comment before
resurrecting the old approach — it was replaced for concrete, tested
reasons, not on a whim.

## Ghost/mask reveal system

While a card is the peek (not yet front), its real content doesn't show
immediately — it reveals over the *last* ~55% of its approach
(`CONTENT_REVEAL_BAND` in `useCardMotion`), photos slightly before text.
Before that, one of three treatments (`GhostStyle`, picked live via the
tuner panel):

- **`'yellow'`** — swap to the flat `CardBehind` placeholder entirely.
- **`'mask'`** — *current default.* Keep the real content visible the
  whole time, dim it with a dark scrim (`MASK_MAX_OPACITY = 0.35`) that
  lifts as it nears the front — apple-design's "dim to focus" materials
  pattern. This is what the user steered toward over the flat color swap.
- **`'off'`** — no treatment, real content fully visible immediately.

**Not yet settled** — the user was mid-test on `'mask'` vs the other two
when this doc was written. If they've confirmed a preference, hardcode
`DEFAULT_GHOST_STYLE` to it and strip `ghostStyle`/`onGhostStyleChange`
prop-threading + the picker row in `MotionTuner`, same lifecycle as the
numeric sliders (below).

## MotionTuning / MotionTuner (temporary)

Every drag/spring/reveal number is a field on the `MotionTuning` type
(`DEFAULT_MOTION_TUNING` for current values), live-editable via the
`MotionTuner` panel rendered top-left of the stack. **This is temporary
dev tooling** — same pattern this project has used a few times now
(`SegmentTuner`, `StackDebugReadout`, both already removed once their job
was done): once the user settles on final numbers, hardcode them into
`DEFAULT_MOTION_TUNING`/`DEFAULT_GHOST_STYLE` and delete `MotionTuner` +
the `tuning`/`ghostStyle` prop threading in `TutorialStack`/
`TutorialStackCard`. Don't mistake this panel for a permanent feature.

**Current values** (as of this doc):

```
commitDistance: CARD_WIDTH * 0.35 (~118px)
commitVelocity: 500 px/s
flyOffDuration: 0.7s   — settled on by feel
flyOffBounce:   0.15   — settled on by feel
cancelDuration: 0.4s
rotationRange:  20deg
gripScale:      0.96   — settled on by feel
ghostStyle:     'mask' — NOT yet confirmed final, see above
```

## Bugs fixed this session (worth knowing before you "fix" them again)

Framer Motion has a few sharp edges that produced real, confusing bugs.
If something in this area looks broken again, check these first:

1. **Never swap *which* MotionValue is bound to a style key across
   renders.** The wraparound bug (a stray blank tilted card appearing)
   traced back to `style.transform` being conditionally bound to one of
   two different MotionValue objects (`dragTransform` vs. `restTransform`)
   depending on `isActive`. Whichever wasn't currently bound could go
   stale — a card dragged once early in the session could render at its
   old flown-off position forever once it became the "rest" case again.
   Fix: always bind *one* continuous, composed transform; make the
   inactive contributions (drag offset when not dragging, rest-rotation
   when dragging) resolve to 0/no-op instead of switching bindings.

2. **A bare `.set()` doesn't stop an in-flight `animate()` on the same
   value.** The fly-off spring (`duration` + `bounce`) has a real settle
   time longer than its nominal duration. Calling `dragX.set(0)` while
   that spring is still ticking wins for exactly one frame before the
   spring's own next tick overwrites it right back toward its target.
   Fix: call `animate(dragX, 0, { duration: 0 })` instead — a new
   `animate()` call interrupts/replaces the prior one first, `.set()`
   does not.

3. **A custom composed `transform` string needs its own `onDrag` handler.**
   Framer's drag gesture auto-syncs motion values bound via the *reserved*
   `style.x`/`style.y` keys. A custom `useMotionTemplate`-composed
   `transform` string doesn't use those keys, so nothing auto-updates your
   own `dragX`/`dragY` during the live gesture — only at
   `onDragEnd`, when you first touch them yourself. Symptom: a visible
   "flick"/pop right at release (two different systems handing off:
   Framer's own untracked internal drag positioning, then yours). Fix:
   wire `onDrag` to manually `dragX.set(info.offset.x)` etc.

4. **`useTransform`'s combiner doesn't reliably react to a plain closed-
   over variable — only to its *listed* MotionValue inputs.** Branching
   inside a `useTransform(...)` combiner on a prop like `ghostStyle`
   (`useTransform([opacity, contentOpacity], ([s,c]) => ghostStyle ===
   'mask' ? ... : 0)`) can go stale: toggling `ghostStyle` alone doesn't
   necessarily re-invoke the combiner, only a change to `opacity`/
   `contentOpacity` does. Fix: compute all variants unconditionally as
   separate motion values, then *pick* between them with a plain JS
   ternary at the top level (`ghostStyle === 'mask' ? maskBase : zero`) —
   an ordinary React re-render (which a prop change always causes)
   decides the binding, not the derivation itself.

5. **Circular/looping stacks need wrapped distance math, not plain
   subtraction.** `circularLocal()` in `useCardMotion` — see its own
   comment for the exact reasoning (a card just passed after a wrap has a
   *huge* plain distance that reads as "still upcoming" instead of "just
   departed" without wrapping into `(-total/2, total/2]`).

## Known deferred issue (not part of this session's fixes)

**Ghost-card clipping on narrow phones** — a separate, older issue, on
hold per the user's explicit call, tracked in Claude's own memory file
(`tutorial-stack-ghost-card-clipping.md` in this project's memory dir).
Root cause: a rotated 338×346 card has a ~377.6px bounding box, wider
than the ~351px of room on a 375px phone (`375 - 2×12px` padding), so a
tilted peek card's corners clip on real narrow phones. Surface this again
once the stack/motion work is otherwise done.

## Testing notes — important limitation

**The browser automation tool in this environment cannot reliably
trigger Framer Motion's drag gesture.** Confirmed multiple times: neither
the tool's own `left_click_drag` nor a hand-built `pointerdown` →
`pointermove` × N → `pointerup` sequence dispatched via
`javascript_tool` reaches Framer's gesture recognizer (zero `onDrag`/
`onDragEnd` firing despite correct on-element coordinates) — plain clicks
work fine against the same page, so it's specifically a drag/gesture gap,
not a general input problem. **Any change to drag/tilt/fly-off physics
needs the user to test on their own phone or a real mouse drag** — verify
what you can via computed styles / DOM inspection (`getComputedStyle`,
reading motion-value snapshots) and static rendering, but don't claim a
gesture "works" without the user confirming the actual feel.

LAN dev server: `vite.config.ts` already has `host: true`. Typical flow
this session: `npm run dev` (or the `makeup-tutorial-dev` preview_start
config), find the Mac's LAN IP (`ipconfig getifaddr en0`), give the user
`http://<ip>:5173` to open on their phone (same WiFi). If it doesn't load,
that's most likely the Mac's firewall — the user has to allow it
themselves, it's not something fixable from here.

## Not yet touched — "rest of the home" screen

The user's own words when asking for this doc: "refine the animation and
rest of the home." Beyond the stack itself, largely unexamined this
session:

- **Filter sheet** (Day/Night/Glam chips below the stack) — still
  decorative-only, doesn't filter anything (only one tutorial has real
  content, so there's nothing to filter yet). No animation/polish pass
  done on it.
- **Heart/favorite icon** on each card — decorative, no state, no tap
  handler.
- **Header text** ("Beauty Notes" + description) — untouched this
  session, static.
- General **mobile viewport polish** beyond the one deferred clipping
  issue above — worth a fresh look once the stack feel is finalized.

## Quick file map

```
docs/home-stack-handoff.md   This file
docs/handoff.md              Older doc — step-flow/illustration work, now stale on "no home page"
docs/figma-v2-redesign.md    Step-flow Figma reference (unrelated to this feature)

src/components/
  HomeScreen.tsx              Renders header text + <TutorialStack> + filter sheet
  TutorialCard.tsx            Everything described above — the whole stack feature lives here
  TutorialFlow.tsx            The step-by-step tutorial screen (only reachable via Soft Smokey Eye)

src/styles/tokens.css         --color-card-behind-tint, --radius-tutorial-card, etc. — search "tutorial-card" / "card-behind"
```
