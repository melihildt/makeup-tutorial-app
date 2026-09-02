# Handoff — Home screen tutorial stack & motion

**Current as of 2026-09-02** — re-verified line-by-line against the actual
code on that date (several claims below had drifted from earlier sessions
and were corrected in place; see "History" at the bottom for what changed
and when). If you find a new stale claim after this point, fix it here
rather than appending another correction layer — that's what made this doc
hard to read before this pass.

Written to carry context into a fresh session/window without re-deriving
everything from scratch. Scoped to the **HomeScreen card stack** (drag,
tilt, fly-off, flips, filter-driven color, filtering) and its motion — a
separate area from `docs/handoff.md` (the step-flow/illustration doc,
covering `TutorialFlow.tsx` and everything under it).

**Git/branch state**: this feature is merged to `main` (`9f1aa24`), no
open branch work remaining in its own scope. Run `git status` /
`git log --oneline -5` on a fresh session start regardless — this note is a
snapshot, not a live value.

The Figma file used throughout is `Tech-Experimentation`, file key
`6Mr7K0RONTS8SltZRJtqYj`. Nodes pulled and worth reusing rather than
re-fetching: `642:5092` (front-card `BigCard` + "Unfold" ghost variant),
`651:5362` (full "Cards" composition, placement/rotation reference),
`635:4792` (header/filter chips), `665:2571` (Start Over card),
`673:3767`/`674:3974`/`674:3975` (tutorial detail/"Unfold" back face, its
level-icon variants, and the CTA-color update to black), `730:5706`
(the About/Info overlay).

## What this covers

The home screen (`HomeScreen.tsx`) shows a stack of tutorial cards
(`TutorialCard.tsx`) — a front card plus one peeking card behind it,
drag-native (swipe any direction to advance). **The Day/Night/Glam chips do
real filtering**: `HomeScreen.tsx` narrows `TUTORIALS` down to
`visibleTutorials` (matching `tutorial.lookType`) before handing the list to
`TutorialStack`, which is `key={selectedType}`-remounted per chip — a
genuinely fresh deck each time, not just a ghost-card recolor (see "Ghost
card recolor" below for that separate, earlier piece). Only "Soft Smokey
Eye" has a real tutorial behind it (`TutorialFlow`) — every other card's
`hasContent: false` gates its CTA to a disabled `ComingSoonButton` instead
of `StartTutorialButton`, and gates `BookmarksScreen.tsx`'s own entry point
to a "coming soon" toast instead of opening the flow. Real photos and
bookmark toggles work on all four regardless of `hasContent`.

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
  removed once that stopped being a real case), `lookType: LookType` (which
  Day/Night/Glam chip a tutorial belongs to — what makes the filter row
  actually filter, see "What this covers" above), `hasContent: boolean`
  (real only for Soft Smokey Eye — gates the detail-flip CTA between
  `StartTutorialButton` and `ComingSoonButton`, and gates
  `BookmarksScreen.tsx`'s own entry point the same way), plus
  `level: TutorialLevel` (`'easy'|'medium'|'experienced'`) and
  `productsUsedCount: number` for the detail flip. All four tutorials
  currently carry **placeholder** `level`/`productsUsedCount` values — real
  ones wait until the other three tutorials have real content behind them
  the way Soft Smokey Eye does (user's own call).
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
  `lookType` (threaded down from `HomeScreen`'s `selectedType`, also what
  `lastEntranceLookType` compares against — see "First-load entrance"
  below). `MotionTuner` itself is gone, not just commented out — see
  "MotionTuning" below.

`HomeScreen.tsx` renders `<TutorialStack key={selectedType}
tutorials={visibleTutorials} onSelect={onSelectLook} lookType={selectedType}
savedIds={savedTutorialIds} onToggleSave={onToggleSavedTutorial} />` —
`visibleTutorials` (not the full `TUTORIALS`) is what makes the filter
chips actually filter (see "What this covers" above), and `key={selectedType}`
is what forces the fresh remount that both the filter and the per-filter
entrance (below) depend on. `LookType` is now `export`ed from
`HomeScreen.tsx` (single source of truth — `TutorialCard.tsx` imports it as
a type-only import, no runtime circular-dependency issue). Still no scroll
container/ref threading — fully drag-native, see `TutorialStack`'s own
module comment if "scroll to browse" ever comes back as a request before
resurrecting the old scroll-linked approach.

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

**The duck-and-reveal gesture itself, `CardBehind` only** — StartOverCard
never gets the duck/rotate spatial treatment below, per the user's own
explicit call not to extend it there; it keeps its own separate, plain
crossfade instead (no longer the original `<img key={lookType}>` +
`check-ring-in` pop — replaced by plan 015 (see "Animation audit" further down) with
an interruptible JS-driven `imgOpacity` fade, same shape as `CardBehind`'s
own `imgOpacity` below minus the duck/rotate part). `CardBehind`'s own
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

**Was ghost-card color only when first built** — "until we add more cards,"
per the user's own framing at the time, since real filtering (`TUTORIALS`
narrowed by `lookType`, see "What this covers" above) landed later as a
separate, subsequent piece of work (plan 053's own prerequisite — see
`plans/README.md`). Both now coexist: switching a filter chip changes which
tutorials show *and* recolors the ghost card/Start Over texture to match.

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
003 and 004 both operated on (both now executed — see "Animation audit" further down),
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
tapFlipDuration:    0.45s     — settled on by feel (tutorial-card detail flip,
                                handleCardTap — deliberately its own field,
                                not a reuse of flipDuration: this is the
                                shorter/snappier everyday "browse a card's
                                details" flip vs. Start Over's rare once-a-
                                cycle restart. Also read by ProductsPreview's
                                own stagger delay, so retuning this retunes
                                that too.)
tapFlipBounce:      0.15      — settled on by feel (tutorial-card detail flip)
flightFadeFraction: 0.45      — settled on by feel (fraction of flyOffDuration
                                the disappear-faster fade actually takes)
startOverRubberBandCoefficient: 0.55 — the commonly-cited WebKit/UIKit
                                constant for the rubberBand() curve, kept
                                as a starting point (Start Over's drag
                                resistance)
```

All of the above now live in `MotionTuning`/`DEFAULT_MOTION_TUNING`,
including `tapFlipDuration`/`tapFlipBounce` (folded in after this doc's
last full pass — previously a bare literal on `handleCardTap` itself).
**Still genuinely outside `MotionTuning`, as plain literals**: the
swipe-hint nudge's two springs (`TutorialStackCard`'s `NUDGE_DISTANCE`
effect) — `{bounce: 0.15, duration: 0.35}` out, `{bounce: 0.15,
duration: 0.4}` back (both bounce values brought to the file's `0.15`
convention by plan 047; still not folded into the tuning object itself,
just their own values corrected). Folding these in, if wanted, is
separate follow-up work, not something blocking anything today.

## First-load entrance + screen transition (`App.tsx`)

Two gaps flagged in a broader home-page audit, both closed this session
— the first real motion work outside `TutorialCard.tsx` for this feature
area, so `App.tsx` is now also in scope for this doc, not just the file
map's "unrelated" framing of it before.

**Stack entrance** (`TutorialStack`, `src/components/TutorialCard.tsx`):
the whole stack fades + rises + gently scales up as one unit on mount —
`{opacity: 0, transform: 'translateY(16px) scale(0.96)'}` →
`{opacity: 1, transform: 'translateY(0px) scale(1)'}`, `DURATION.layout`
(350ms), `EASE_OUT_QUART` (both shared exports from this file — see plans
044/006 in `plans/README.md`). Deliberately **not** per-card staggered
(front/peek entering separately) — this plays on every filter switch (see
below), not once-ever, so it stays restrained rather than choreographed.

Gated by `lastEntranceLookType`, a **module-level** `LookType | null`
variable (not `useState`/`useRef` — those wouldn't survive `TutorialStack`
unmounting, which happens both on an `App.tsx` Home↔Tutorial swap and on
every `key={selectedType}` filter-chip remount): tracks *which filter's*
deck last played the entrance, not just whether one ever has. A mount for
the same filter you were already on (a tutorial round-trip) skips it; a
mount for a genuinely different filter — any Day/Night/Glam switch, even
to one you've visited before this session — always plays it, since
`key={selectedType}` already means a fresh deck of cards. (Plan 053,
`plans/README.md` — read that plan's own note if touching this: its first
draft read-and-wrote the module variable inside one `useState` lazy
initializer, which is broken under React 18 StrictMode's dev-mode
double-invoke; the shipped version splits the read from the write, the
write living in a `useEffect`.) `prefers-reduced-motion`: keeps a plain
opacity fade (no `y`/`scale`) rather than skipping outright, same "fewer
and gentler, not zero" reasoning as everywhere else in this file.

**Screen transition** (`App.tsx`): replaces a hard `screen === 'home' ?
<A/> : <B/>` conditional (zero motion) with a real push/pop —
`AnimatePresence` + the standard Framer "directional navigation" recipe (a
`direction: 1 | -1` set alongside `screen` in the same two handlers, fed
through `custom` into per-key `variants`). Forward (Home → Tutorial):
Tutorial slides in from the right while Home recedes left. Backward:
reversed. Percent-based `translateX` (relative to each screen's own
width), not pixels. Same `DURATION.layout`/`EASE_OUT_QUART` pair as the
stack entrance. Reduced motion is folded into the *same* `custom` payload
passed to `variants` (`{direction, reduceMotion}`) rather than a competing
`style` override applied alongside `variants` — two things driving one CSS
property is exactly the "never swap which value binds a style key"
mistake this file's own "Bugs fixed" list already paid for once (see #1
there) — under reduced motion `translateX` stays pinned at 0% throughout
and `opacity` carries the swap instead; under normal motion it's the
reverse emphasis, pure `translateX` with opacity pinned at 1 throughout,
matching a native push/pop's translate-only feel rather than fighting the
slide with a simultaneous crossfade.

## About/Info overlay (`src/components/InfoOverlay.tsx`)

New this session (post-merge, see "Git state" above). HomeScreen's info
icon (top-right, next to the still-decorative user icon) now opens a real
About/credits screen — Figma node `730:5706` ("Home/Info"), file
`Tech-Experimentation`. Header icon converted from a bare `<div>` to a
real `<button>` (`onClick={() => setInfoOpen(true)}`, `aria-label="About"`,
carries `.header-icon-button` — see the "missed opportunities" note above
for why that matters); `InfoOverlay` renders as an overlay on top of the
live `HomeScreen`, not a separate `App.tsx` screen — it behaves like a
modal (close button, not a back-stack entry), and Home's own content
staying mounted underneath is load-bearing for the next point.

**Backdrop is a real `backdrop-filter: blur()` over the live HomeScreen,
not Figma's own duplicated-and-blurred layer** — Figma fakes "blur
whatever's behind this" by copying the frame and blurring the copy, since
a static design tool has no other way to do it; a real overlay doesn't
need that trick and can't drift out of sync with Home's actual content
(card art, filter selection) the way a hand-copied duplicate could. Two
tuned constants at the top of the file, `BACKDROP_TINT_OPACITY` (0.68) and
`BACKDROP_BLUR_PX` (18), control how much of Home shows through — both
went through several rounds of user feedback (Figma's own literal
0.9/23px values, which bake in an extra opaque layer Figma didn't need to
fake blur, made Home basically invisible; a first cut down to 0.45/12px
swung too far the other way and read as distracting rather than "behind
glass") before landing here. Both are named, commented tweak knobs — turn
either down to reveal more of Home, up to hide more of it.

**Email is copy-to-clipboard, not `mailto:`** — real-device testing
surfaced that `navigator.clipboard` only exists in a secure context
(https, or `localhost` itself); a phone hitting the dev server over plain
`http://<lan-ip>:5173` (the normal way to test on a real device mid-dev)
doesn't qualify, so the modern Clipboard API is simply `undefined` there.
`copyToClipboard` tries it first, then falls back to the older
`document.execCommand('copy')` (via an off-screen, focused, selected
`<textarea>`) which still works over plain HTTP — confirmed fixed on the
user's own phone after this fallback was added. The label swaps to
"Copied!" (or "Couldn't copy" on a genuine failure, now with its own
shake cue — see plan 024) rather than either path silently doing nothing,
which is what an earlier pass's `catch { return }` used to do on failure.

**Icons**: `CloseIcon` (fi-br-cross-small), `LinkIcon` (fi-br-link),
`AtIcon` (fi-br-at) are hand-authored inline SVGs tracing real path data
pulled from Figma's exported assets — same convention as every other icon
in this app (`HomeScreen.tsx`'s `InfoIcon`/`UserIcon`,
`ScreenHeader.tsx`'s icon set), not `<img>` tags pointing at Figma's
asset URLs (those expire in ~7 days). `LinkIcon`/`AtIcon` keep their
source's baked-in gold (`#E3B345`) fill rather than the app's usual
`currentColor`/ink-token pattern — a real, intentional accent color in the
design, matching the About card's own gold texture.

**Background texture**: the About card's gold woven texture is
`src/assets/home/InfoCard.png` (2x, 564×480) — was already sitting in the
repo untracked before this session's own work touched it, reused as-is.
One real fix along the way: the card and the image inside it were both
independently rounding their corners (`rounded-[24px]` on both), and the
two independently-antialiased corners landed a hair apart, reading as a
cropped/doubled edge — fixed by rounding only the clipping container
(`overflow-hidden` + `rounded-[24px]`) and leaving the image plain, the
same single-clip-source pattern `TutorialCard.tsx`'s `CardBehind` already
uses.

**Portfolio** links to `https://melisahildt.com` (confirmed with the
user, not guessed) in a new tab.

Animation-audit findings/plans for this screen are the "fourth audit"
noted above — see `plans/022-infooverlay-link-press-feedback.md`,
`plans/023-infooverlay-card-entrance-stagger.md`,
`plans/024-copy-email-failure-shake.md`.

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

**Animation audit** — six `improve-animations` passes now, 054 plans total
(001-054), all executed except one deliberately deferred (033, Bookmarks
shadow/radius catch-up — see `plans/README.md`). Full findings tables,
severity/leverage ranking, and per-plan execution notes (including two
genuine bugs the audit's own Target code introduced and then fixed during
execution — worth reading before trusting a plan's diff at face value) live
entirely in **`plans/README.md`**, not duplicated here. A few
worth-knowing highlights that touch this doc's own scope: `003`/`004`
folded the Start Over flip and drag-resistance feel-values into
`MotionTuning` (see above); `006` consolidated a hand-typed cubic-bezier
array into the exported `EASE_OUT_QUART` constant; `007` closed a real
race in `CardBehind`'s duck-and-reveal effect (see "Ghost card recolor by
filter" above); `044`/`047`/`048` promoted a shared `DURATION` constant and
retuned the idle-hint nudge's spring bounce to match it (see "MotionTuning"
above); `053` made the stack's entrance replay per-filter, not just once
per session (see "First-load entrance" above). `005` was resolved as moot,
not executed — its target code no longer existed by the time anyone got to
it, a side effect of the flip-mechanism rebuild.

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
docs/handoff.md              Companion doc — the step-flow/illustration work (TutorialFlow.tsx and below), separate scope
docs/README.md               Index of every doc in this folder, with current-vs-historical status
plans/                       improve-animations audit — plans/README.md for the summary + execution order

src/App.tsx                  Home↔Tutorial screen swap — now a real AnimatePresence slide, not a hard conditional; see "First-load entrance + screen transition" above
src/TutorialFlow.tsx         The step-by-step tutorial screen (only reachable via Soft Smokey Eye) — note: directly in src/, not src/components/

src/components/
  HomeScreen.tsx              Header + filter chips (LookSelector, owns `selectedType`/LookType) + <TutorialStack>; info icon is a real button now, see InfoOverlay.tsx
  TutorialCard.tsx            Everything described above — the whole stack feature lives here
  InfoOverlay.tsx             About/credits overlay opened from HomeScreen's info icon — see "About/Info overlay" above

src/data/stepContent.ts       Step-by-step flow's own product photography — reused by TutorialCard.tsx's ProductsPreview for Soft Smokey Eye's real thumbnails (see "Tutorial detail flip" above)

src/assets/
  looks/                      Per-tutorial photo pairs + card-ghost-texture.jpg (day) + -night.png/-glam.png
  filter-chips/                Shared woven texture, tinted per chip via mix-blend-mode
  home/InfoCard.png             About card's gold woven texture (2x) — see "About/Info overlay" above
  product-images/              Real product photos (also src/data/stepContent.ts's own source)

src/styles/tokens.css         --radius-tutorial-card, --shadow-tutorial-card, --duration-*/--ease-out-quart, --color-timer-badge-bg, --color-product-placeholder (new), etc. — search "tutorial-card". --color-card-behind-tint is deprecated.
```

## History

Compact milestone list, newest first — the detailed reasoning behind each
lives in git history and `plans/README.md`, not repeated here. This
replaces what used to be a long, layered "2026-08-2x update" narrative at
the top of this doc; if that level of blow-by-blow detail is ever needed,
it's in this file's own git history.

- **2026-09-02**: doc re-verified end-to-end against the actual code and
  corrected in several places where it had drifted (real filtering by
  `lookType` had landed without this doc being updated; the entrance flag
  changed from a one-shot boolean to a per-filter comparison; a few
  `MotionTuning` fields and the idle-nudge spring values were stale).
- **Sixth `improve-animations` audit (plans 040-054)**: see `plans/README.md`.
- **About/Info overlay** shipped (`InfoOverlay.tsx`), plus its own
  3-finding audit (plans 022-024).
- **`feature/home-tutorial-stack` merged to `main`** (`9f1aa24`) — Start
  Over's two-face flip, ghost-card recolor by filter, the tutorial detail
  flip, first-load stack entrance, and `App.tsx`'s real screen transition
  all shipped as part of this branch.
- **Original + follow-up `improve-animations` passes** (plans 001-007) —
  see `plans/README.md`.
