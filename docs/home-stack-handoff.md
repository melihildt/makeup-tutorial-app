# Handoff — Home screen tutorial stack & motion

Written to carry context into a fresh session/window without re-deriving
everything from scratch. Scoped to the **HomeScreen card stack** (drag,
tilt, fly-off, flips, filter-driven color) and its motion — a separate area
from `docs/handoff.md` (the step-flow/illustration doc, covering
`TutorialFlow.tsx` and everything under it — re-verified and rewritten
2026-08-21, no longer stale on the "no home page" point or several others
it used to get wrong; read that doc for anything in that file's own
scope).

**Git state — read this before assuming anything else in this doc is
current.** Branch `feature/home-tutorial-stack` (off `main`, untouched).
Pushed to `origin`, working tree clean, as of this doc's last update —
run `git status`/`git log --oneline -5` on a fresh session start
regardless to confirm nothing's changed since; if there's anything beyond
a clean tree, it's from later than this doc — read the diff before
trusting this doc's "current state" claims over the actual code.

**Plan 004 is now done** (`plans/004-start-over-rubber-band-friction.md`,
real rubber-band friction on the Start Over card's drag — replaced the
flat `0.35` linear multiplier with the standard `UIScrollView`-style
`rubberBand()` curve, resistance now rises smoothly with drag distance
instead of staying proportional; user tested on their own phone and
confirmed it feels right). 003, 006, 007 were already done — see
"Animation audit" further down and `plans/README.md`. **Plan 005 is now
resolved too, but as moot, not executed** — its quoted target
(`contentOwnRotateY`/`flipProgress` applied via a bare `rotateY:` style
shorthand) no longer exists anywhere in the file; a fresh search
confirmed zero bare `rotateY:` shorthands remain at all, because the
flip-mechanism rebuild (see "Tutorial detail flip" below) collapsed the
content layer's own rotation into the parent's single composed
`transform` as a side effect of unrelated work, not by anyone executing
this plan's own fix. See `plans/README.md`'s own note for the full
trace. **All five plans from the original animation-audit pass are now
closed out** (001/002/003/004 executed, 005 moot) — nothing left open
from that queue. Two other items were explicitly **deferred to later,
lower priority, per the user's own call**: the `CardBack`-fly-off-reads-abrupt issue (see "Known deferred
issues" below — several real fixes landed chasing it already, none
confirmed to close it, don't re-derive from scratch) and ghost-card
clipping on narrow phones (older, lower priority still).

**A second, follow-up animation audit ran this session** (against
`TutorialCard.tsx` + `App.tsx` + `HomeScreen.tsx`, not just the original
scope) — see "Animation audit" further down for the two findings it
produced (006, 007, both executed) and what came back clean.

**2026-08-24 — a third audit ran (a later session), this time across the
whole tutorial flow, not just this file's own Home-stack scope** —
findings 5 (leftover `console.log` debug instrumentation in this file,
left over from the "CardBack fly-off" diagnostic below) and 8 (reduced-
motion users skipping straight into the tutorial instead of getting the
same detail content a motion user reaches by flipping) both landed in
`TutorialCard.tsx` and are executed. Full findings table, every other
plan (spanning `StepScreen.tsx`/`ScreenHeader.tsx`/`TutorialFlow.tsx`/
`AllStepsView.tsx`, outside this doc's own scope), and execution status
live in **`plans/README.md`** — not duplicated here since most of that
work touches files this doc doesn't cover.

**Three more of that same third audit's findings executed in a later
session, two of which touch this doc's own scope**: plan 013
(`check-ring-in`'s entrance scale, `0.85` → `0.92`, brought inside the
0.9–0.97 physicality band — the shared keyframe used by `StartOverCard`'s
own filter-color swap above, plus five other call sites outside this
doc's scope) and plan 018 (`TutorialLookCard`'s and `TutorialDetailCard`'s
root `className`s gained `has-[button:active]:scale-100`, so pressing the
nested bookmark or `StartTutorialButton` no longer also shrinks the whole
card behind it — CSS `:active` bubbles to every ancestor of whatever's
actually being pressed regardless of `stopPropagation()`, which only stops
JS event bubbling). Plan 014 (`justToggledKey` view-switch race,
`TutorialFlow.tsx`) is outside this doc's own scope — see `docs/handoff.md`
for that one. `StartOverCard`'s own keyframe-restart-on-rapid-tap (plan
015, the same class of bug as "Ghost card recolor by filter" above, just
not yet fixed on this card) is still TODO.

The Figma file used throughout is `Tech-Experimentation`, file key
`6Mr7K0RONTS8SltZRJtqYj`. Nodes pulled and worth reusing rather than
re-fetching: `642:5092` (front-card `BigCard` + "Unfold" ghost variant),
`651:5362` (full "Cards" composition, placement/rotation reference),
`635:4792` (header/filter chips), `665:2571` (Start Over card),
`673:3767`/`674:3974`/`674:3975` (tutorial detail/"Unfold" back face, its
level-icon variants, and the CTA-color update to black).

## What this covers

The home screen (`HomeScreen.tsx`) shows a stack of tutorial cards
(`TutorialCard.tsx`) — a front card plus one peeking card behind it,
drag-native (swipe any direction to advance). Only "Soft Smokey Eye" has a
real tutorial behind it (`TutorialFlow`); the other three have real photos
and bookmark toggles but aren't wired to real content — same "looks real,
not functional yet" spirit as the Day/Night/Glam filter chips (which do
now change the stack's own ghost-card color, see below, but still don't
filter which tutorials show — see "Ghost card recolor" for the exact
scope call on that).

**No more infinite loop.** Swiping past the last tutorial lands on a
**Start Over** card instead of silently wrapping back to the first — see
its own section below.

**Tapping the front card no longer opens the tutorial directly** — it
flips the card in place to a detail face (level, duration, products, a
real CTA) — see "Tutorial detail flip" below.

## Architecture — `src/components/TutorialCard.tsx`

One file, most pieces still roughly back-to-front:

- **`Tutorial` type + `TUTORIALS` array** — title/brand/duration/images
  (now non-nullable, all four have real photos — `placeholderColors` was
  removed once that stopped being a real case), plus `level: TutorialLevel`
  (`'easy'|'medium'|'experienced'`) and `productsUsedCount: number` for the
  detail flip. All four tutorials currently carry **placeholder** level/
  product-count values — real ones wait until the other three tutorials
  have real content behind them the way Soft Smokey Eye does (user's own
  call). `hasContent: boolean` is declared per-tutorial but not consumed
  anywhere yet — the CTA/tap on any tutorial opens the same hard-coded
  `TutorialFlow` regardless (see the type's own comment) — known, accepted
  for now, not a bug to fix today.
- **`TutorialLookCard`** — the front face, at rest. `onSelect` prop now
  means "flip this card" (wired to `handleCardTap`, not the real
  navigation) — the real "open tutorial" action moved to the CTA on
  `TutorialDetailCard`'s back face. Root is still a `role="button"` div,
  not a `<button>` (bookmark needs its own nested tappable control) — see
  its own module comment before touching tap behavior here.
- **`TutorialDetailCard`** — the tutorial card's back face: a `DetailPill`
  for level (`LevelIcon` + label) and one for duration, a `ProductsPreview`
  (3 thumbnails — real photos for Soft Smokey Eye via `Tutorial.productImages`
  reused from the step-by-step flow, a flat placeholder swatch for the
  other three — plus "+N products used" caption, see its own comment for
  why that number is *remaining*, not the raw total), and
  `StartTutorialButton` (black CTA, real `fi-rr-play` icon,
  `stopPropagation` so it doesn't also flip the card back). Same
  whole-card-tappable pattern as `TutorialLookCard` — tapping anywhere
  except the CTA flips back to front.
- **`LevelIcon`** (new) — the 3-bar "signal strength" level icon, real
  path data (5 distinct bar/state SVGs pulled via `download_assets`).
  Shortest bar always filled; middle bar filled from 'medium' up; tallest
  bar filled only at 'experienced'. Verified programmatically (not just
  visually) that the right bars render solid vs. hollow per level.
- **`StartOverCard`** — the terminal slot's front face (icon + "Start
  Over" label on the ghost texture). See "Start Over" section below for
  the full flip mechanism it's part of.
- **`CardBehind`** — the peek/ghost layer. Now takes a `lookType` prop and
  picks its texture from `GHOST_TEXTURES` (gold/blue/green) instead of a
  single hardcoded image — see "Ghost card recolor" below.
- **`useCardMotion(activeIndex, cardIndex, total)`** — unchanged core
  per-card pose math; `circularLocal()` still the key wrapped-distance
  helper (see "Bugs fixed" below, still fully current).
- **`TutorialStackCard`** — one card's full behavior. Now owns **two**
  different flips sharing the same `flipRotateY` motion value (never both
  on one card instance, since a card is exactly one `variant.kind`):
  `handleStartOverTap` (Start Over's one-shot reveal) and `handleCardTap`
  (a tutorial card's bidirectional front↔detail toggle, `isFlipped`
  state). Also owns the swipe-hint nudge effect and `onInteraction`.
- **`TutorialStack`** — owns `activeCardIndex`/`activeIndex`/
  `dragProgress` as before, plus `total = tutorials.length + 1` (the extra
  slot is Start Over), `hintTrigger`/`hasInteractedRef` (swipe-hint), and
  `lookType` (threaded down from `HomeScreen`'s `selectedType`). Still
  renders the `MotionTuner` panel commented out (see below, unchanged).

`HomeScreen.tsx` renders `<TutorialStack tutorials={TUTORIALS}
onSelect={onSelectLook} lookType={selectedType} />`. `LookType` is now
`export`ed from `HomeScreen.tsx` (single source of truth — `TutorialCard.tsx`
imports it as a type-only import, no runtime circular-dependency issue).
Still no scroll container/ref threading — fully drag-native, see
`TutorialStack`'s own module comment if "scroll to browse" ever comes back
as a request before resurrecting the old scroll-linked approach.

## Start Over card — two-face flip (not a fly-off)

Swiping past the last tutorial lands on a **Start Over** slot
(`total = tutorials.length + 1`) instead of wrapping. Tapping it used to
make it fly away like a swiped card — that read as "the card just
vanishes" instead of "it flips to reveal what's next," so it was rebuilt:

**Tapping Start Over now flips the card itself in place** — a real
two-sided card, front face "Start Over" (icon + label on the ghost
texture), back face a static, non-interactive render of the first
tutorial. `handleStartOverTap` deliberately does **not** advance
`activeCardIndex` until the flip settles — the card stays `isFrontCard` for
its whole ~0.7s flip, which is what lets its normal pose math (rest
rotation 0, opacity 1, zIndex 1000) stay correct with zero overrides. Once
the flip completes, `onAdvance()` fires (an instant `.set()`, not a tween —
the existing wrapped-jump path, now covering this transition instead of a
plain modulo wrap) and hands off to the real, separately-rendered card-0
instance that's been sitting in its normal front pose underneath the whole
time, occluded by Start Over's own z-index ceiling.

This *replaced* an earlier version that routed through `flyOff()` — if you
see `flyOff` referenced only for tutorial-card drag commits now, that's
correct; Start Over no longer calls it at all.

## Ghost card recolor by filter

The ghost card (peek layer + Start Over's own front face) now recolors to
match the selected Day/Night/Glam chip — gold/blue/green, via
`GHOST_TEXTURES: Record<LookType, string>`. Assets: `card-ghost-texture.jpg`
(day, original), `card-ghost-texture-night.png`, `card-ghost-texture-glam.png`
(both `src/assets/looks/`, added and renamed by the user this session — the
files as first delivered were misnamed relative to which chip they visually
matched; matched by actual pixel color instead, confirmed against the
user's own reference mock).

**The swap itself, `CardBehind` only** — StartOverCard keeps its own
separate, plain fade+pop swap (its own `<img key={lookType}>` +
`check-ring-in`, unchanged) even while peeking, per the user's own
explicit call not to extend the treatment below there. `CardBehind`'s own
swap was rebuilt this session from a flat `key={lookType}` + `check-ring-in`
pop into a "duck behind the front card, swap, swing back out" gesture —
the user's own read that a plain crossfade didn't lean into this card's
actual spatial role (a tilted card sitting behind the front one, not a
static swatch). Verified against the real pose math *before* building:
`useCardMotion`/`TutorialStackCard`'s transform gives the peek card *zero*
position offset from the front card — only rotation and z-index/opacity
differ — so this card's own rotation landing at exactly 0° really does
mean pixel-for-pixel alignment with (hidden behind) the front card, not
an approximation. Mechanically: `behindRotate` (`CardBehind`'s own,
*additional* rotation, layered on top of the parent `TutorialStackCard`'s
own `totalRotate` via ordinary nested-transform composition) animates to
`-parentRotate.get()` — read once, at the moment the swap starts, not a
live subscription — landing the *combined* rotation at 0 regardless of
which card (front, ±7° peek, mid-drag) is calling it; the texture
(`displayedLookType` state, separate from the `lookType` prop) swaps at
that ducked midpoint, alongside a fade (`imgOpacity`, JS-driven via
Framer, not `check-ring-in` — a scale-pop on a whole card-sized ghost
layer read as too busy layered on top of the rotation), then both ease
back to 0/1 to swing out and reveal. 0.2s per phase (duck+fade-out, then
swing+fade-in), `EASE_OUT_QUART` throughout (the exported constant —
`--ease-out-quart`'s numeric JS-array form, see plan 006 below). Known,
accepted gap: a filter tap that lands exactly mid-drag (this card's own
tilt actively changing that same instant) targets an already-stale
cancel-out value by the time the duck settles — deliberately not solved,
too rare an overlap (two-tap filter chip + a live drag, at the same time)
to justify live-tracking `parentRotate` for.

**Race-guarded against rapid filter switching (plan 007, "Animation
audit" below)** — the duck-and-reveal effect's async `.then()` callback
now checks a `cancelled` flag (set by the effect's own cleanup function)
before applying its result. Without this, tapping Day/Night/Glam quickly
could let a stale, superseded effect run's callback fire *after* a newer
tap already landed the correct color — reverting the ghost card to the
wrong texture and starting a second swing-back animation on top of the
current one. Spot-checked working in this session's browser tooling;
real-device rapid-tap testing (or CPU-throttled DevTools) is the more
convincing confirmation if this ever needs re-checking.

**Scope, per the user's own framing**: this is ghost-card color only —
"until we add more cards" — Day/Night/Glam still don't filter which
tutorials actually show. Don't read the recolor as a sign that filtering
is coming next; it's a separate, larger task the user has not asked for
yet.

## Swipe-hint nudge

A small upward tug on the front card if it sits untouched, repeating every
4s per idle card (not a one-time tooltip) — re-arms fresh for whichever
card is front next, cancels the moment that card is touched. Direction is
up (this file's established canonical swipe direction). Skipped entirely
under `prefers-reduced-motion`. Excludes the Start Over card (swiping it
never does anything, so a swipe-shaped hint there would be misleading).

**Fixed** — `onInteraction()` now fires from `handleDragStart`,
`handleCardTap`, `handleStartOverTap`, and `handleToggleSave` (the
bookmark) — any tap-driven engagement with the stack, not just a drag.
Scoped narrowly to the card stack itself, not `HomeScreen`'s filter chips
(the user's own example was specifically about tapping to flip, so that's
the reading this went with).

## Tutorial detail flip (level/duration/products/CTA)

Tapping the front card now flips it (not navigates) to reveal:
level (`LevelIcon` + label), duration (reusing `durationMinutes`), a
3-thumbnail product preview + "+N products used" caption, and a real
"Start Tutorial" CTA (black, per the user's update to the source Figma —
was gold in the first pull) that's what actually opens the tutorial now.
Tapping anywhere else on the flipped card flips it back to front.
`isFlipped` resets to `false` the instant a card stops being front (swiped
away or otherwise), so a card always starts fresh next time it cycles back
around.

Mechanically this reuses the *exact* `preserve-3d`/`backfaceVisibility`/
`flipRotateY` machinery Start Over's flip already established — bidirectional
here (`isFlipped` state + `handleCardTap` toggle) rather than one-shot, and
much simpler than Start Over's version since it never touches
`activeCardIndex` at all (purely local to the card, no stack-advance
involved, so none of the z-index/opacity overrides Start Over's flip
needed). Duration is 0.45s, deliberately snappier than Start Over's 0.7s —
this is a browsing interaction someone might trigger repeatedly, not a
rare once-a-cycle reveal.

**Content status**: level/product-count data is **placeholder** on all
four tutorials (see the `Tutorial` type comment) — Soft Smokey Eye's
values (easy/8 products) match the source Figma mockup's own example
exactly (25min/Easy/8 products → "+5" remaining). Product **thumbnails**:
Soft Smokey Eye now shows real photos (`Tutorial.productImages`, reused
from the step-by-step flow's own product photography — see "Bugs
fixed"-adjacent work / `ProductsPreview`'s own comment); the other three
still show a flat placeholder swatch (`--color-product-placeholder`,
`#e5e5e7` — Figma's own placeholder-gray), since they don't have real
tutorial content behind them yet.

**Resolved, then reversed — the departing-card visual gap.** If you swipe
away a card *while it's flipped* (showing details), the original ask was
for it to un-flip to front as it leaves rather than carrying its detail
face through the fade. That was built (an instant `flipRotateY`/`isFlipped`
reset at the top of `flyOff()`), but on real-phone testing the user called
it wrong the other way — seeing the card snap to front on release read as
the bug, not the fix. **Reverted**: `flyOff()` now deliberately leaves
`isFlipped`/`flipRotateY` alone, so a flipped card keeps showing its detail
face for the whole fly-off, only resetting to front once it's safely
off-screen (the existing `isFrontCard`-driven effect near `isFlipped`'s
declaration, which fires after `onAdvance()`). If this comes back as a
request, it's the front-face-during-flyoff version described above,
already implemented once — check git history (the commit right after "Add
tutorial-card flip-to-details, refresh handoff docs") for the diff to
reapply rather than re-deriving it.

## Ghost reveal system — locked in

While a card is the peek (not yet front), its real content doesn't show
immediately — it reveals over the *last* ~35% of its approach
(`CONTENT_REVEAL_BAND` in `useCardMotion` — narrowed from 0.55 to 0.35 this
session per the user's own request to see more of the yellow/ghost color
before the real card takes over). Before that, `CardBehind`'s ghost
texture shows instead (now per-filter, see above) — **the reveal
*mechanism* is the locked-in choice**, independent of what `CardBehind`
renders. Two alternatives were explored and explicitly rejected, code
gone, not just hidden: a dark "mask" scrim over still-visible real content,
and no treatment at all. If either comes back as a request, it's a
rebuild — check git history for the removed `GhostStyle` type if reference
code would help.

## MotionTuning (the `MotionTuner` dev panel is gone)

`MotionTuner` (the live-slider dev panel, already hidden/commented out)
is now actually **removed**, per the user's own call once the numbers
felt settled — check git history if a similar tuning UI is ever needed
again. `MotionTuning`/`DEFAULT_MOTION_TUNING` themselves **stay** — every
drag/spring/reveal number still lives there, `TutorialStackCard` still
reads everything through `tuning.*`, and this exact shape is what plans
003 and 004 both operated on (both now executed — see "Animation audit"),
which is why it wasn't collapsed back into plain constants at the same
time. `tuning` itself is now a plain
`const = DEFAULT_MOTION_TUNING` inside `TutorialStack`, not `useState` —
nothing has ever called a setter since the panel doesn't exist, so state
with no writer was just indirection. Current values:

```
commitDistance:     CARD_WIDTH * 0.35 (~118px)
commitVelocity:     1200 px/s — settled on by feel
flyOffDuration:     0.7s      — settled on by feel
flyOffBounce:       0.15      — settled on by feel
cancelDuration:     0.4s
rotationRange:      20deg
gripScale:          0.96      — settled on by feel
flipDuration:       0.7s      — settled on by feel (Start Over's flip)
flipBounce:         0.15      — settled on by feel (Start Over's flip)
flightFadeFraction: 0.45      — settled on by feel (fraction of flyOffDuration
                                the disappear-faster fade actually takes)
startOverRubberBandCoefficient: 0.55 — the commonly-cited WebKit/UIKit
                                constant for the rubberBand() curve, kept
                                as a starting point (Start Over's drag
                                resistance)
```

Three of these (`flipDuration`, `flipBounce`, `flightFadeFraction`) were
folded in from bare literals by plan 003 (see "Animation audit" below) —
a pure relocation, values unchanged. `startOverRubberBandCoefficient` is
new as of plan 004 (also below), replacing what used to be a flat
`START_OVER_RESIST_FACTOR = 0.35` constant outside this object entirely —
not a relocation, a real behavior change (linear damping → real
rubber-band friction), confirmed on a real phone. **Still not folded in**
(postdate 003's own scope, deliberately left for follow-up rather than
silently expanding 003 — see `plans/README.md`'s own note): the
tutorial-card detail flip's spring (`{bounce: 0.15, duration: 0.45}`,
`handleCardTap`) and the swipe-hint nudge's two springs (`{bounce: 0.35,
duration: 0.35}` out / `{bounce: 0.25, duration: 0.4}` back).

## First-load entrance + screen transition (`App.tsx`)

Two gaps flagged in a broader home-page audit, both closed this session
— the first real motion work outside `TutorialCard.tsx` for this feature
area, so `App.tsx` is now also in scope for this doc, not just the file
map's "unrelated" framing of it before.

**Stack entrance** (`TutorialStack`, `src/components/TutorialCard.tsx`):
the whole stack fades + rises + gently scales up as one unit on mount —
`{opacity: 0, transform: 'translateY(16px) scale(0.96)'}` →
`{opacity: 1, transform: 'translateY(0px) scale(1)'}`, 0.35s,
`EASE_OUT_QUART` (the exported constant, see plan 006 below). Deliberately **not** per-card
staggered (front/peek entering separately) — this plays every session,
not once-ever, so it stays restrained rather than choreographed.
Gated to true first load only via `hasPlayedStackEntrance`, a **module-level**
flag (not `useState`/`useRef` — those wouldn't survive `TutorialStack`
unmounting, which happens every time `App.tsx` swaps `HomeScreen` out for
`TutorialFlow`): reads-and-flips it in one `useState` lazy initializer, so
only the very first mount of the session plays it — returning from a
tutorial back to Home does not replay it (the screen transition below
already carries that "arriving back" motion instead). `prefers-reduced-motion`:
keeps a plain opacity fade (no `y`/`scale`) rather than skipping outright,
same "fewer and gentler, not zero" reasoning as everywhere else in this
file. The `reduceMotion` static-list branch gets an equivalent, simpler
opacity-only version.

**Screen transition** (`App.tsx`): replaces a hard `screen === 'home' ?
<A/> : <B/>` conditional (zero motion, a known gap from the earlier
`improve-animations` pass, see "Animation audit" below) with a real
push/pop — `AnimatePresence` + the standard Framer "directional
navigation" recipe (a `direction: 1 | -1` set alongside `screen` in the
same two handlers, fed through `custom` into per-key `variants`).
Forward (Home → Tutorial): Tutorial slides in from the right while Home
recedes left. Backward: reversed. Percent-based `translateX` (relative to
each screen's own width), not pixels. Same 350ms/`--ease-out-quart` pair
as the stack entrance. Reduced motion is folded into the *same* `custom`
payload passed to `variants` (`{direction, reduceMotion}`) rather than a
competing `style` override applied alongside `variants` — two things
driving one CSS property is exactly the "never swap which value binds a
style key" mistake this file's own "Bugs fixed" list already paid for
once (see #1 there) — under reduced motion `translateX` stays pinned at
0% throughout and `opacity` carries the swap instead; under normal motion
it's the reverse emphasis, pure `translateX` with opacity pinned at 1
throughout, matching a native push/pop's translate-only feel rather than
fighting the slide with a simultaneous crossfade.

## Bugs fixed (worth knowing before you "fix" them again)

Framer Motion sharp edges that produced real, confusing bugs. Still fully
current — nothing here has changed:

1. **Never swap *which* MotionValue is bound to a style key across
   renders.** Always bind one continuous, composed transform; make
   inactive contributions resolve to 0/no-op instead of switching bindings.
2. **A bare `.set()` doesn't stop an in-flight `animate()` on the same
   value.** Use `animate(x, target, { duration: 0 })` to interrupt, not
   `.set()`.
3. **A custom composed `transform` string needs its own `onDrag` handler**
   — Framer's drag gesture only auto-syncs motion values bound via the
   *reserved* `style.x`/`style.y` keys.
4. **`useTransform`'s combiner doesn't reliably react to a plain closed-over
   variable — only to its *listed* MotionValue inputs.** Compute variants
   unconditionally, pick with a plain JS ternary at the top level instead.
5. **Circular/looping stacks need wrapped distance math, not plain
   subtraction** — `circularLocal()`.
6. **A "flick" can survive every per-card transform fix if the *rest of the
   stack* doesn't track the live gesture at all** — fixed with a live
   `dragProgress` value folded into every *other* card's own pose.
7. **A live-tracking peek can numerically tie the dragged card's z-index**
   — the actively-interactive card gets an unambiguous fixed ceiling
   (`1000`) instead of the shared formula.
8. **Not a Framer bug — a real WebKit one, confirmed fixed on a real
   phone, not reproducible in this environment's browser tool at all.**
   Near the end of a `rotateY` flip (either direction), CardFront/CardBack
   (this file's names for the flip's front/back layers) would briefly show
   the *wrong, mirrored* face for a frame — Safari failing to honor
   `backface-visibility: hidden` reliably *while* the rotation is actively
   animating, only once it settles, so for a frame there's nothing telling
   the browser not to render that face's own mirrored "back" (no distinct
   back texture is defined on the face itself — that's what the sibling
   layer is for). `WebkitTransformStyle`/`willChange`/`WebkitBackfaceVisibility`
   (vendor-prefixed duplicates + forced GPU layer) were a first pass at
   this and weren't the fix that actually closed it. **What worked:**
   stop relying on `backface-visibility` timing at all — cross-fade real
   `opacity` in sync with `flipRotateY` itself (`cardFrontFlipOpacity`/
   `cardBackFlipOpacity`, a 30° window straddling the 90° crossover), so
   both faces are already near-invisible right at the moment any culling
   glitch could show, independent of whatever Safari's doing underneath.
   The vendor-prefixed properties are still in place as defense in depth,
   just no longer load-bearing.
9. **A committed (or cancelled) drag can spawn a real, native `click` on
   whatever nested element sits under the finger at release — not a Framer
   bug either, but a real DOM one.** Framer's `drag` only suppresses *its
   own* internal tap gesture on the exact element it's bound to; it does
   nothing about the browser's ordinary click synthesis on a *different*
   nested element (here, CardFront's/CardBack's own whole-card `onClick`,
   see `handleCardTap`/`handleStartOverTap`) — and since `drag` already
   sets `touch-action: none`, the browser never engages the scroll/pan
   heuristics that would normally suppress a trailing synthetic click on
   mobile. Symptom this actually caused: swiping away a flipped card, the
   ghost click's `handleCardTap` call un-flipped it *during* the fly-off,
   at the same time flyOff's own translate/fade was running — looked like
   "the fade shows the front face, not the back one," a totally different
   bug from #8 above despite a superficially similar description. Fixed
   with `justDraggedRef` (own doc comment at its declaration): set the
   instant Framer recognizes a real drag (`handleDragStart`, which only
   fires past Framer's own movement threshold — never for a genuine tap),
   checked and swallowed once by `handleCardTap`/`handleStartOverTap`,
   reset via `setTimeout(0)` in `handleDragEnd` so the reset lands *after*
   the synchronous ghost click has already had its chance to fire and be
   caught.
10. **CardFront's departure fade had a backstop CardBack didn't.** Fixed
    #8's crossfade (`cardFrontOpacity`/what's now `cardBackOpacity`) composed
    CardFront with `contentFinalOpacity` (the ordinary per-card, distance-
    from-front fade — the same one that governs a normal, non-flipped
    card's whole ~0.7s departure) but composed CardBack with *only* the
    flip-crossfade value, no `contentFinalOpacity`. Consequence: right when
    `flyOff`'s own quick fade (~0.3s) finishes and several motion values get
    reset to their neutral "at rest" state for reuse next cycle (see
    `flightFade.then()` in `flyOff`) — a deliberate, pre-existing pattern,
    not itself a bug — CardFront stayed hidden anyway because
    `contentFinalOpacity` was independently, still fading it out over the
    full advance; CardBack had nothing backing it up, so it could pop back
    toward full opacity right at that reset instant before the stack
    caught up. Fix: compose `cardBackOpacity` the same way as
    `cardFrontOpacity` — `contentFinalOpacity * cardBackFlipOpacity`, not
    `cardBackFlipOpacity` alone. **A real, worthwhile fix on its own merits
    — but not what was actually causing the user's reported symptom** (see
    #11 immediately below); don't revert it chasing #11's own cause.
11. **The "CardBack's fly-off just disappears, CardFront scales-and-fades"
    complaint (raised even after #10 above) — root cause was contrast, not
    motion, confirmed with real on-device data, not guessed.** Two rounds
    of guessing (a ghost-click theory, then re-confirming #10's math) both
    failed to fix it, so instead of a third guess, temporary `console.log`
    instrumentation went into `handleDragStart`/`handleCardTap`/`flyOff`/
    the `flightFade.then()` callback, plus live `.on('change', ...)`
    subscriptions on `cardBackOpacity`/`flightOpacity`/`flightScale` — the
    user connected their phone via Safari's remote Web Inspector (Mac:
    Develop menu → the connected iPhone → the page; needs Settings →
    Safari → Advanced → Web Inspector on, USB connection was needed to get
    the phone to actually show up in the menu) and sent back real console
    output. That data **fully exonerated the motion system**: `isFlipped`/
    `flipRotateY` never move during a real fly-off (no ghost click, ever),
    and `flightOpacity`/`flightScale` animate perfectly smoothly (logged
    dozens of intermediate values) over the full ~300ms window, identical
    in form to what the front face gets — there is no code-level asymmetry
    left between the two paths, full stop. The actual cause: `CardBack`'s
    `--color-surface` fill is `#ffffff`, fading against this app's own
    page gradient (`--gradient-bg-screen`, bottoms out at `#fbf7f5` —
    visually near-identical to white) and a barely-there 3%-opacity shadow
    (`--shadow-tutorial-card`) — so it crosses below *perceptible* well
    before its opacity numerically reaches 0, while the front face's photo
    stays trackable through nearly the whole fade. Same animation, very
    different perceived duration — a content/contrast problem, not a
    timing bug. Fix: a low-alpha dark border on `TutorialDetailCard`'s
    root (`border-[0.5px] border-solid`, `rgba(44, 41, 38, 0.1)` — reused
    from `StartTutorialButton`'s own existing border rather than a new
    value), since a dark element blended over a near-white background
    stays visibly darker as it fades, unlike a near-white fill blending
    into a near-white background regardless of alpha. **Not verified on a
    real phone as of this writing** — the border is confirmed applied
    (computed style checked), but whether it actually reads as long enough
    now needs a real swipe to confirm, same limitation as every other fix
    in this doc.
12. **An async `useEffect` callback with no cancellation guard is a race
    waiting for a fast-enough user, not a hypothetical.** `CardBehind`'s
    duck-and-reveal effect (see "Ghost card recolor by filter" above)
    scheduled its reveal — `setDisplayedLookType` + the swing-back
    animations — inside a `duck.then(() => {...})`, with nothing stopping
    that callback from firing after a *newer* effect run (a second filter
    tap before the first's duck finished) had already superseded it.
    Found by a follow-up `improve-animations` audit (plan 007), not by
    live testing — the kind of bug that's real in the code regardless of
    whether a session happens to catch it by hand. Fix: the standard React
    async-effect guard — a `let cancelled = false` set by the effect's own
    cleanup function (which React calls right before the next run, or on
    unmount), checked at the top of the `.then()` callback before it does
    anything.

(Full original reasoning for each preserved in git history / earlier
versions of this doc if you need the blow-by-blow, not just the summary.)

## Known deferred issues

**CardBack's fly-off reads as more abrupt than CardFront's — unresolved
after several real fixes, paused per the user's own call to document
instead of keep iterating.** ("CardFront"/"CardBack" are this doc's own
names for `TutorialLookCard`/`TutorialDetailCard` as they render inside
`TutorialStackCard` — the flip's two faces.) User's report, consistent
across every retest: swiping away a non-flipped card visibly scales back
and fades; swiping away a flipped card (showing its detail face) just
disappears, no visible fade/shrink read.

Three separate, real bugs were found and fixed along the way chasing this
— all worth keeping, none of them turned out to be *the* cause:

1. A ghost native `click` (not a Framer gesture) that a completed drag
   could spawn on `CardBack`'s own whole-card tappable root, capable of
   un-flipping a departing card mid-flight. Fixed with `justDraggedRef`
   (see "Bugs fixed" #9 above). **Ruled out as this issue's cause**,
   confirmed directly: real on-device console logs (Safari's remote Web
   Inspector, connected over USB) across multiple actual swipes show
   `isFlipped`/`flipRotateY` staying rock-solid (`true`/`180`) all the way
   from `flyOff` starting to `flightFade` resolving — the ghost click
   never fires during a real fly-off.
2. `cardBackOpacity` was missing the `contentFinalOpacity` factor
   `cardFrontOpacity` already had (see "Bugs fixed" #10). Fixed to mirror
   `cardFrontOpacity`'s composition exactly. **Also ruled out as this
   issue's cause** — the user retested after this fix and still saw the
   same difference.
3. Real on-device logging additionally confirmed `flightOpacity` fades
   smoothly 1→0 and `flightScale` shrinks smoothly 1→0.55 over the full
   ~300ms window, and `dragX`/`dragY` genuinely translate toward the
   fly-off target — all identical in form and timing to what the shared
   code path already does for `CardFront`. There is no remaining
   *numeric* asymmetry between the two faces' departure — confirmed with
   real data, not inferred from reading the code.

**What actually explains the visible difference** (from a real screen
recording, examined via `ffmpeg`-extracted frames at 30fps, comparing two
`CardFront` swipes against two `CardBack` swipes): `CardFront` visibly
ghosts/turns translucent over several frames before it's gone — a
graceful dissolve, matching the numbers. `CardBack` shrinks and tilts over
a comparable number of frames, but stays fully opaque and legible (badge,
thumbnails, CTA all readable) the *entire* time, then vanishes in exactly
one frame — no dissolve phase visible at all, despite `flightOpacity`
animating identically underneath. Working theory: a flat, low-contrast
white fill (`CardBack`'s `--color-surface` background, close in tone to
the page's own gradient) doesn't give the eye the "internal detail
washing out" cue a colorful photo provides as it fades via CSS opacity —
so the fade is numerically real but not perceptually visible, and the
*shrink*, which stops at scale 0.55 (still a decent, legible size), is
all that's left to notice — cutting to nothing from there reads as
abrupt.

Two changes were made on that theory, both worth keeping, **neither
confirmed to close the gap** per the user's own retest:

- A low-alpha dark border on `TutorialDetailCard`'s root
  (`rgba(44, 41, 38, 0.1)`, reusing `StartTutorialButton`'s own existing
  border value) — a dark element fading against a light background stays
  perceptible further into a fade than a near-white fill blending into a
  near-white background does, regardless of alpha.
- Real product photos (3, reused from the step-by-step flow's own
  photography in `src/data/stepContent.ts`) on Soft Smokey Eye's
  `CardBack`, replacing its flat gray placeholder swatches — gives the
  card actual color/detail to fade with, on top of being a real feature
  ask on its own merits. Scoped to Soft Smokey Eye only (`Tutorial.
  productImages`, optional) since the other three tutorials don't have
  real content behind them yet — see `level`'s own comment for the same
  scope call already established.

**Proposed but not yet tried**: shrink `flightScale`'s target further
(currently `0.55`) so there's no large, legible shape left by the time the
mid-flight reset happens — this would make the final "cut" smaller and
likely less noticeable regardless of whether the opacity fade itself ever
becomes perceptually visible. Untried because the user paused here to
document rather than keep iterating blind.

**Where this actually stands**: genuinely at an impasse, worth being
honest about rather than declaring solved. Every plausible *code-level*
cause has been checked with real on-device evidence (console logs from an
actual phone, plus a screen recording examined frame-by-frame) and ruled
out or fixed — the shared motion values are confirmed correct and
identical between the two paths. The user still perceives a difference
after all of it. Claude cannot independently confirm whether a difference
still remains: this environment cannot simulate a real drag/swipe gesture
at all (see "Testing notes" below), and comparing extracted video frames
is a much coarser instrument than a person actually feeling the
interaction live on their own device. If this resurfaces:
(a) try the untried `flightScale` fix above first, it's low-risk and
independently justified regardless of whether it's the real cause;
(b) get a side-by-side video of both swipes performed with *matched*
gesture speed/distance — every comparison so far has been between
different individual swipes, never a true apples-to-apples pair, so some
of the perceived difference could still be ordinary swipe-to-swipe
variance rather than a `CardFront`/`CardBack` difference at all;
(c) consider that this might be a felt/perceptual quality genuinely
outside what static frames or motion-value logs can surface, and ask the
user to pin down one exact frame or moment rather than adding more
instrumentation, which has now been tried three times without closing it.

**Ghost-card clipping on narrow phones** — old, on hold per the user's
explicit call, tracked in Claude's own memory file
(`tutorial-stack-ghost-card-clipping.md`). Numbers not re-verified against
the current `CARD_HEIGHT` (359). Surface again once the stack/motion work
is otherwise done.

**Animation audit** (`plans/` directory) — two separate `improve-animations`
passes now. **Original pass** (against `TutorialCard.tsx` alone, commit
`628b8b7`): 5 findings — `001`/`002` done early, `003` (fold flip/hint
feel-values into `MotionTuning`), `006`/`007` (below), and now `004`
(Start Over's drag resistance was flat linear damping, replaced with a
real `rubberBand()` curve — asymptotic resistance rising with drag
distance instead of a flat proportional multiplier; `startOverRubberBandCoefficient`
folded into `MotionTuning` alongside it; real-phone-tested and confirmed
by the user) all done. `005` (a transform-composition consistency nit,
low-priority) is **resolved as moot, not executed** — its quoted code
(`contentOwnRotateY`/`flipProgress`) no longer exists anywhere in the
file, and a search for the underlying anti-pattern (a bare `rotateY:`
style shorthand) came back completely empty: the flip-mechanism rebuild
already eliminated it as a side effect, before anyone got to this plan.
All 5 findings from the original pass are now closed out. **Follow-up pass this session** (`TutorialCard.tsx` + `App.tsx` +
`HomeScreen.tsx`, commit `db1e1be`, prompted by how much had changed since
the original pass): 2 findings, both executed — `006` consolidated a
hand-typed `[0.25, 1, 0.5, 1]` cubic-bezier array (11 occurrences across 2
files) into one exported `EASE_OUT_QUART` constant in `TutorialCard.tsx`;
`007` closed a real race in `CardBehind`'s duck-and-reveal effect
(rapid Day/Night/Glam filter switching could leave the ghost card showing
a stale, wrong color — see the "Ghost card recolor by filter" section
above for the fix). Everything else the follow-up pass checked came back
clean — no `ease-in`, no `scale(0)`, no `transition: all`, no animated
layout properties, reduced-motion already handled correctly at both the
CSS and JS level. Two minor, additive "missed opportunities" were noted
but not turned into plans (not asked for): `ProductsPreview`'s 3
thumbnails could use a 30-80ms stagger when a card flips to its back
face, and the header info/profile icon buttons have no press feedback at
all. See `plans/README.md` for the full summary table, execution notes,
and dependencies between plans.

## Testing notes — important limitation

**The browser automation tool in this environment cannot reliably trigger
Framer Motion's drag gesture.** Confirmed multiple times across sessions —
plain clicks work fine (and were used to verify the Start Over flip,
tutorial detail flip, ghost recolor, and bookmark toggle live, this
session), but drag/swipe cannot be simulated. **Any change to drag/tilt/
fly-off physics needs the user to test on their own phone or a real mouse
drag** — verify what you can via computed styles/DOM inspection and static
rendering, but don't claim a gesture "works" without the user confirming
the actual feel. Separately (also confirmed this session): rapid automated
DOM polling right after a state change can read stale paint, since Framer
flushes motion-value changes on the browser's animation-frame loop and
this environment throttles rAF for background/automated tabs — if a
programmatic `animate()`/`.set()` seems to not reach the DOM under
automated polling, suspect this before assuming the code is broken; a
`.on('change', ...)` subscription or a deliberately shortened delay for
testing purposes can help confirm the underlying value really is moving.

LAN dev server: `vite.config.ts` already has `host: true`. Typical flow:
`npm run dev` (or the `makeup-tutorial-dev` preview_start config), find the
Mac's LAN IP (`ipconfig getifaddr en0`), give the user `http://<ip>:5173`
to open on their phone (same WiFi). If it doesn't load, that's most likely
the Mac's firewall — the user has to allow it themselves.

## Quick file map

```
docs/home-stack-handoff.md   This file
docs/handoff.md              Older doc — step-flow/illustration work, stale on "no home page"
docs/figma-v2-redesign.md    Step-flow Figma reference (unrelated to this feature)
plans/                       improve-animations audit — plans/README.md for the summary + execution order

src/App.tsx                  Home↔Tutorial screen swap — now a real AnimatePresence slide, not a hard conditional; see "First-load entrance + screen transition" above
src/TutorialFlow.tsx         The step-by-step tutorial screen (only reachable via Soft Smokey Eye) — note: directly in src/, not src/components/

src/components/
  HomeScreen.tsx              Header + filter chips (LookSelector, owns `selectedType`/LookType) + <TutorialStack>
  TutorialCard.tsx            Everything described above — the whole stack feature lives here

src/data/stepContent.ts       Step-by-step flow's own product photography — reused by TutorialCard.tsx's ProductsPreview for Soft Smokey Eye's real thumbnails (see "Tutorial detail flip" above)

src/assets/
  looks/                      Per-tutorial photo pairs + card-ghost-texture.jpg (day) + -night.png/-glam.png
  filter-chips/                Shared woven texture, tinted per chip via mix-blend-mode
  product-images/              Real product photos (also src/data/stepContent.ts's own source)

src/styles/tokens.css         --radius-tutorial-card, --shadow-tutorial-card, --duration-*/--ease-out-quart, --color-timer-badge-bg, --color-product-placeholder (new), etc. — search "tutorial-card". --color-card-behind-tint is deprecated.
```
