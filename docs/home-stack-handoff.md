# Handoff — Home screen tutorial stack & motion

Written to carry context into a fresh session/window without re-deriving
everything from scratch. Originally scoped to the **HomeScreen card
stack** (drag, tilt, fly-off, loop) and its motion tuning — a separate
area from `docs/handoff.md` (the step-flow/illustration doc, now stale on
the "no home page" point — a home page exists now, see below). That
original scope is the active task again as of this update (see
"Immediate next task" below) after a detour through the rest of the home
screen.

**Committed** on branch `feature/home-tutorial-stack` (off `main`, which
is untouched — still on the commit before this feature). Latest relevant
commit: `628b8b7` — "Redesign home header/filters, add real card photos,
bookmark toggle, chip press-flash." Check `git log`/`git status` on a
fresh session start: if there are *more* uncommitted changes on top of
that, they're from later than whenever this doc was last updated — read
the diff before assuming this doc is fully current.

**Immediate next task, per the user directly**: "iterate the swipe" — back
to the drag/tilt/fly-off motion this doc was originally written for (see
"MotionTuning / MotionTuner" and "Bugs fixed" below, both still fully
current). The "rest of the page" detour this doc used to point to as the
next task (colors, filter chips, header, real photos, a bookmark toggle)
is now **done and committed** (`628b8b7`) — see that commit message for
the detailed "why" behind each piece rather than duplicating it here; the
short version, if useful context for swipe work: the filter sheet moved
from a bottom sheet to directly under the header, chips got a photo-
texture + per-type tint + press-flash treatment, all four tutorial cards
now have real photos, and the heart icon became a real bookmark
save/unsaved toggle (which is why `TutorialLookCard`'s root changed from
a `<button>` to a `role="button"` div — see Architecture below). None of
that touched the drag/motion mechanics this doc is actually about, with
one exception: **`CARD_HEIGHT` moved 346 → 359** (a bottom-padding fix,
unrelated to motion) which feeds `FLY_OFF_DISTANCE` — the fly-off
diagonal is very slightly longer now than the numbers below were tuned
against. Probably imperceptible, but worth knowing if fly-off distance
ever feels subtly off from what's documented.

The Figma file used throughout is `Tech-Experimentation`, file key
`6Mr7K0RONTS8SltZRJtqYj` — nodes already pulled and worth reusing rather
than re-fetching: `642:5092` (the `BigCard` component + its "Unfold"
ghost variant), `651:5362` (the full "Cards" composition, card
placement/rotation reference), `635:4792` (header/filter chips, now
implemented — see `628b8b7`).

## What this covers

The home screen (`HomeScreen.tsx`) shows a stack of tutorial cards
(`TutorialCard.tsx`) — a front card plus one peeking card behind it. You
can tap the front card to open its tutorial, or drag/swipe it (any
direction) to advance to the next one, looping back to the first after
the last. Only "Soft Smokey Eye" has a real tutorial behind it
(`TutorialFlow`); the other three tutorials have real photos and a real
bookmark toggle now, but are still not wired to an actual tutorial flow —
same "looks real, not functional yet" spirit as the Day/Night/Glam filter
chips above the stack (which also got real photo-texture styling and a
press-flash effect, `628b8b7`, but still don't filter anything).

## Architecture — `src/components/TutorialCard.tsx`

One file, several pieces, roughly back-to-front:

- **`Tutorial` type + `TUTORIALS` array** — the 4 tutorials' data (title,
  brand, duration, real images for all four now — `placeholderColors` is
  unused/legacy at this point, kept on the type rather than deleted in
  case a future entry ships without photos).
- **`TutorialLookCard`** — one card's look, at rest. Dumb about
  scroll/drag; just renders a card given a `tutorial`, plus optional
  `detailsOpacity` (for the reveal system, below) and `saved`/
  `onToggleSave` (the bookmark toggle, `628b8b7` — state is owned by
  `TutorialStack`, not local, so it survives this exact card instance
  staying mounted as it cycles through peek/front/peek). **Root is a
  `role="button"` div, not a `<button>`** — changed when the bookmark
  needed its own independently-tappable nested control, and a real
  `<button>` can't validly nest inside another `<button>`. Reproduces
  Enter/Space activation and tab order by hand; if you're touching tap
  behavior here, read that component's own module comment before
  assuming it's still a plain button.
- **`CardBehind`** — the peek/ghost layer, embedded inside each card's
  own peek presentation, not a separate static prop like the first
  version — see "Ghost reveal system," now locked in. Renders a real
  photo texture (`card-ghost-texture.jpg`, `628b8b7`) now, not the flat
  yellow tint swatch described in older versions of this doc.
- **`useCardMotion(activeIndex, cardIndex, total)`** — the core per-card
  pose math. Takes an index value (see `effectiveIndex` in
  `TutorialStackCard` — not always literally the stack's `activeIndex`,
  read that comment before assuming) and a card's own index, returns
  motion values for rotation, opacity, z-index, and the content-reveal
  band. `circularLocal()` is the key helper: signed distance from
  `cardIndex` to the index value, **wrapped** so the loop (last card →
  first card) doesn't produce a huge stale distance — this was a real,
  hard-to-spot bug (see "Bugs fixed" below).
- **`TutorialStackCard`** — one card's full behavior: composes rotation,
  drag position, grip scale into one `transform`; owns the drag gesture
  (`handleDragStart`/`handleDrag`/`handleDragEnd`); decides commit vs.
  cancel; only the front card is ever interactive. Also where
  `dragProgress` gets folded into (or excluded from) this card's own pose
  — see bug #6 below, it's not optional plumbing.
- **`TutorialStack`** — owns `activeCardIndex` (state), `activeIndex` (the
  settled motion value), and `dragProgress` (the live one) — advances on
  a committed drag, handles the wrap-to-first loop. Also renders the
  `MotionTuner` panel, currently commented out (see below).

`HomeScreen.tsx` just renders `<TutorialStack tutorials={TUTORIALS}
onSelect={onSelectLook} />` — no scroll container, no ref threading. An
earlier version *was* scroll-linked (pin-and-scrub through the deck via
real page scroll) but that fought the page's own vertical scroll on a
real touchscreen constantly; it's fully drag-native now, no scroll
involvement at all. If "scroll to browse" ever comes back as a request,
re-read that reasoning in `TutorialStack`'s own module comment before
resurrecting the old approach — it was replaced for concrete, tested
reasons, not on a whim.

## Ghost reveal system — locked in

While a card is the peek (not yet front), its real content doesn't show
immediately — it reveals over the *last* ~55% of its approach
(`CONTENT_REVEAL_BAND` in `useCardMotion`), photos slightly before text.
Before that, it shows `CardBehind`'s photo-texture ghost layer instead
(a real image now, `card-ghost-texture.jpg` — was a flat yellow tint
swatch in older versions of this doc, see Architecture above) —
**the reveal *mechanism* is the final, locked-in choice**, independent of
what `CardBehind` itself happens to render. Two alternatives to the
mechanism were explored and explicitly rejected, and their code is gone,
not just hidden:

- A dark "mask" scrim over the still-visible real content (apple-design's
  "dim to focus" pattern) — user's own idea initially, but decided
  against it after comparing live.
- No treatment at all (real content visible immediately).

If either comes back as a request, it's a rebuild, not an un-hide — check
git history around this commit for the removed `GhostStyle`
type/`MASK_MAX_OPACITY`/mask-scrim JSX if reference code would help
rather than starting from scratch.

## MotionTuning / MotionTuner (temporary — hidden, not removed)

Every drag/spring/reveal number is a field on the `MotionTuning` type
(`DEFAULT_MOTION_TUNING` for current values). There's still a
`MotionTuner` component with live sliders over all of them, and
`TutorialStack` still holds `tuning` state and threads it down — **but
the panel itself is currently commented out**, not rendered, per the
user's request to see the stack uninterrupted while iterating on the
rest of the page. To bring it back: uncomment the `<MotionTuner
tuning={tuning} onChange={setTuning} />` line in `TutorialStack` (search
"Hidden for now" in `TutorialCard.tsx`). Once the user settles on truly
final numbers (they may still want to adjust after seeing the rest of
the page redesigned around the stack), hardcode them into
`DEFAULT_MOTION_TUNING` and delete `MotionTuner` + the `tuning`
prop-threading entirely — same end-of-life pattern as `SegmentTuner` and
`StackDebugReadout` before it, both fully removed once their job was
done. Don't mistake "hidden" for "done with."

**Current values**:

```
commitDistance: CARD_WIDTH * 0.35 (~118px)
commitVelocity: 1200 px/s — settled on by feel
flyOffDuration: 0.7s      — settled on by feel
flyOffBounce:   0.15      — settled on by feel
cancelDuration: 0.4s
rotationRange:  20deg
gripScale:      0.96      — settled on by feel
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

6. **A "flick" can survive every per-card transform fix if the *rest of
   the stack* doesn't track the live gesture at all.** After fixing 1-3
   above, the user still saw a flick — root cause this time: `activeIndex`
   (which every non-dragged card's pose is computed from) sat completely
   frozen for the whole drag, only starting to animate *after* release.
   So the peek had to accelerate from a standing start at the exact
   instant the dragged card was already flying at real velocity — two
   very different motion states meeting at one frame. Fixed with a live
   `dragProgress` value (0..1, distance dragged ÷ commitDistance) added to
   `activeIndex` for every card *except* the one currently being dragged
   (folding it into that card's own rest-pose would be a feedback loop —
   its own drag would make it also react to its own drag). On commit, the
   settled `activeIndex` jumps to match wherever the live preview had
   already gotten to (same tick, invisible) before springing the
   remaining — usually much shorter — distance, instead of restarting the
   whole journey from the old integer. This is also the apple-design
   principle directly: "always animate from the presentation value, never
   the target/logical value."

7. **A live-tracking peek can numerically tie the dragged card's z-index**
   — direct consequence of #6: as `dragProgress` approaches 1, the peek's
   own z-index formula approaches the same value the front card's has,
   and a CSS tie resolves by DOM order, which could put the peek
   *in front of* the card the user is physically holding. Fixed by giving
   the actively-interactive card an unambiguous fixed ceiling (`1000`)
   instead of computing its z-index the same way as everyone else.

## Known deferred issue (not part of this session's fixes)

**Ghost-card clipping on narrow phones** — a separate, older issue, on
hold per the user's explicit call, tracked in Claude's own memory file
(`tutorial-stack-ghost-card-clipping.md` in this project's memory dir).
Root cause (numbers below are pre-`628b8b7` — `CARD_HEIGHT` moved
346 → 359 since, see "Immediate next task" above; the bounding-box math
hasn't been re-verified against the new height): a rotated 338×346 card
has a ~377.6px bounding box, wider than the ~351px of room on a 375px
phone (`375 - 2×12px` padding), so a tilted peek card's corners clip on
real narrow phones. Surface this again
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

## Done since this doc was last "not yet touched" — see `628b8b7`

Everything this section used to list as untouched is now done: the
filter chips (real photo texture + per-type tint + press-flash, moved
from a bottom sheet to directly under the header), the heart icon (now a
real bookmark save/unsaved toggle), and the header text (32px Cactus
Classical Serif + a new info/user icon row). Full "why" for each is in
the commit message, not repeated here.

**Still open, not part of this doc's original scope**: general mobile
viewport polish beyond the one deferred clipping issue below — worth a
fresh look once the swipe/motion feel is finalized again. A horizontal
scroll/bounce bug *was* found and fixed properly this round (two real
causes: iOS's page-level rubber-band, and a genuine scrollable-surface
gap the fly-off animation could trigger in `HomeScreen`'s own scroll
container) — if anything like it resurfaces, check `overflow-x` is still
set everywhere `overflow-y-auto` is, and that `html`/`body` are still
locked in `index.css`, before re-diagnosing from scratch.

## Quick file map

```
docs/home-stack-handoff.md   This file
docs/handoff.md              Older doc — step-flow/illustration work, now stale on "no home page"
docs/figma-v2-redesign.md    Step-flow Figma reference (unrelated to this feature)

src/components/
  HomeScreen.tsx              Header + filter chips (LookSelector) + <TutorialStack>, top to bottom
  TutorialCard.tsx            Everything described above — the whole stack feature lives here
  TutorialFlow.tsx            The step-by-step tutorial screen (only reachable via Soft Smokey Eye)

src/assets/
  looks/                      Per-tutorial photo pairs (all 4 tutorials now) + card-ghost-texture.jpg
  filter-chips/                Shared woven texture, tinted per chip via mix-blend-mode

src/styles/tokens.css         --radius-tutorial-card, --shadow-tutorial-card, --duration-*/--ease-out-quart, etc. — search "tutorial-card". --color-card-behind-tint is deprecated (CardBehind uses a real photo now, see Architecture above).
```
