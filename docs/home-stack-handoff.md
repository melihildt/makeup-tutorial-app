# Handoff — Home screen tutorial stack & motion

Written to carry context into a fresh session/window without re-deriving
everything from scratch. Scoped to the **HomeScreen card stack** (drag,
tilt, fly-off, flips, filter-driven color) and its motion — a separate area
from `docs/handoff.md` (the step-flow/illustration doc, stale on the "no
home page" point — a home page exists now).

**Git state — read this before assuming anything else in this doc is
current.** Branch `feature/home-tutorial-stack` (off `main`, untouched).
Latest **commit**: `150ca7b` — "Fix fly-off easing, redesign Start Over as
a two-face flip, add swipe hint, recolor ghost card by filter." **On top of
that, uncommitted as of this doc's last update**: the tutorial-card
flip-to-details feature (level/duration/products/CTA — see its own section
below) — `src/components/TutorialCard.tsx` and `src/styles/tokens.css` both
show as modified in `git status`. Run `git status`/`git diff --stat` on a
fresh session start; if there's more beyond that uncommitted diff, it's
from later than this doc — read the diff before trusting this doc's
"current state" claims over the actual code.

**Immediate next tasks, per the user directly** — two concrete, scoped
fixes (see their own sections below for full detail):
1. Swipe-hint nudge fires too eagerly — needs to treat *any* interaction
   with the stack (not just a drag) as "the user found it." See "Swipe-hint
   nudge" below.
2. A card swiped away while flipped fades out still showing its detail
   (back) face, which looks odd — should fade out showing the front face
   instead. See "Tutorial detail flip" below.

Neither is implemented yet — both were raised in conversation, not yet
built. Everything else in "What's shipped" below **is** implemented (the
last item pending only a commit).

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

- **`Tutorial` type + `TUTORIALS` array** — title/brand/duration/images as
  before, plus (new, uncommitted) `level: TutorialLevel`
  (`'easy'|'medium'|'experienced'`) and `productsUsedCount: number` for the
  detail flip. All four tutorials currently carry **placeholder** level/
  product-count values — real ones wait until the other three tutorials
  have real content behind them the way Soft Smokey Eye does (user's own
  call). `placeholderColors` is still unused/legacy, kept on the type.
- **`TutorialLookCard`** — the front face, at rest. `onSelect` prop now
  means "flip this card" (wired to `handleCardTap`, not the real
  navigation) — the real "open tutorial" action moved to the CTA on
  `TutorialDetailCard`'s back face. Root is still a `role="button"` div,
  not a `<button>` (bookmark needs its own nested tappable control) — see
  its own module comment before touching tap behavior here.
- **`TutorialDetailCard`** (new, uncommitted) — the tutorial card's back
  face: a `DetailPill` for level (`LevelIcon` + label) and one for
  duration, a `ProductsPreview` (3 placeholder-swatch thumbnails +
  "+N products used" caption — see its own comment for why that number is
  *remaining*, not the raw total), and `StartTutorialButton` (black CTA,
  real `fi-rr-play` icon, `stopPropagation` so it doesn't also flip the
  card back). Same whole-card-tappable pattern as `TutorialLookCard` —
  tapping anywhere except the CTA flips back to front.
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
user's own reference mock). Swap driven by `key={lookType}` +
`check-ring-in` (reused, not a new keyframe) for a quick fade+scale-in
instead of an instant pop.

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

**Pending fix (not yet implemented) — the interaction-detection is too
narrow.** Right now `onInteraction()` (which resets `hasInteractedRef` and
holds off the next nudge) is only called from `handleDragStart` — meaning
**tapping a card to flip it does not count as an interaction**, so the hint
could still fire while the user is actively engaging with the stack via
taps rather than drags. Fix: call `onInteraction()` from `handleCardTap`
too (and consider `handleToggleSave`/the bookmark, and `handleStartOverTap`
— any tap-driven engagement with the stack, not just a drag). The user's
own framing: *"the flick should work only when I'm not interacting with the
page at all."* Scope call to make when picking this up: whether "the page"
means just the card stack (flip/bookmark/Start Over taps — the narrower,
safer reading) or something broader like the filter chips in `HomeScreen`
too (would need new prop threading between `HomeScreen` and
`TutorialStack`, not just within `TutorialCard.tsx`) — the user's example
was specifically about tapping to flip, so the narrower reading is the
safer default absent further clarification.

## Tutorial detail flip (level/duration/products/CTA) — uncommitted

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

**Content status**: level/product data is **placeholder** on all four
tutorials (see the `Tutorial` type comment) — Soft Smokey Eye's values
(easy/8 products) match the source Figma mockup's own example exactly
(25min/Easy/8 products → "+5" remaining). Product thumbnails are flat
placeholder swatches (`--color-product-placeholder`, `#e5e5e7` — Figma's
own placeholder-gray for the same not-yet-real image slots, not an
invented color), not real product photos — those don't exist yet.

**Pending fix (not yet implemented) — the departing-card visual gap.** If
you swipe away a card *while it's flipped* (showing details), it currently
flies off still showing the detail/back face, then fades out that way —
looks odd, since the user would expect to see "the card that's leaving,"
i.e. its normal front face, not whatever it happened to be showing at the
moment of swipe. The reset-to-front (`isFlipped` → `false`) currently only
fires once `isFrontCard` becomes `false`, which happens *after* the whole
fly-off (once `onAdvance()` runs) — too late to affect what's visible
during the fly-off itself. Fix direction: force `flipRotateY` back to 0
(and `isFlipped` to `false`) at the *start* of a committed drag/fly-off
(inside `flyOff()` or right where it's called from `handleDragEnd`'s
committed branch), not just once the card fully stops being front — so a
flipped card visually un-flips to its front face as part of leaving,
before or during the fly-off, rather than carrying its back face all the
way through the fade.

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

## MotionTuning / MotionTuner (temporary — hidden, not removed)

Unchanged from before: every drag/spring/reveal number lives on
`MotionTuning`/`DEFAULT_MOTION_TUNING`, `MotionTuner` still has live
sliders over all of them, still commented out in `TutorialStack` (search
"Hidden for now"). Current values:

```
commitDistance: CARD_WIDTH * 0.35 (~118px)
commitVelocity: 1200 px/s — settled on by feel
flyOffDuration: 0.7s      — settled on by feel
flyOffBounce:   0.15      — settled on by feel
cancelDuration: 0.4s
rotationRange:  20deg
gripScale:      0.96      — settled on by feel
```

Plus (not yet in `MotionTuning`, only informally settled): Start Over's
flip `{bounce: 0.15, duration: 0.7}`, tutorial-card flip
`{bounce: 0.15, duration: 0.45}`, swipe-hint nudge `{bounce: 0.35, duration: 0.35}`
out / `{bounce: 0.25, duration: 0.4}` back. `plans/003-fold-flip-values-into-motion-tuning.md`
(see "Animation audit" below) already specs folding some of these in.

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

(Full original reasoning for each preserved in git history / earlier
versions of this doc if you need the blow-by-blow, not just the summary.)

## Known deferred issues

**Ghost-card clipping on narrow phones** — old, on hold per the user's
explicit call, tracked in Claude's own memory file
(`tutorial-stack-ghost-card-clipping.md`). Numbers not re-verified against
the current `CARD_HEIGHT` (359). Surface again once the stack/motion work
is otherwise done.

**Animation audit** (`plans/` directory, from an `improve-animations` pass
this session) — 5 findings, 2 already executed and folded into "Bugs
fixed"-adjacent work above (fly-off fade easing, a since-superseded
restart-flip lock window). **3 still open**, full self-contained plans
already written: `003` (fold flip/hint feel-values into `MotionTuning`),
`004` (Start Over's drag resistance is flat linear damping, not real
rising rubber-band friction), `005` (a transform-composition consistency
nit, low-confidence/low-priority). See `plans/README.md` for the summary
table and execution-order notes (004 before 003 if both are done).

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

src/components/
  HomeScreen.tsx              Header + filter chips (LookSelector, owns `selectedType`/LookType) + <TutorialStack>
  TutorialCard.tsx            Everything described above — the whole stack feature lives here
  TutorialFlow.tsx            The step-by-step tutorial screen (only reachable via Soft Smokey Eye)

src/assets/
  looks/                      Per-tutorial photo pairs + card-ghost-texture.jpg (day) + -night.png/-glam.png
  filter-chips/                Shared woven texture, tinted per chip via mix-blend-mode

src/styles/tokens.css         --radius-tutorial-card, --shadow-tutorial-card, --duration-*/--ease-out-quart, --color-timer-badge-bg, --color-product-placeholder (new), etc. — search "tutorial-card". --color-card-behind-tint is deprecated.
```
