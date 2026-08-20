# Handoff — Home screen tutorial stack & motion

Written to carry context into a fresh session/window without re-deriving
everything from scratch. Scoped to the **HomeScreen card stack** (drag,
tilt, fly-off, loop) and its motion tuning — a separate area from
`docs/handoff.md` (the step-flow/illustration doc, now stale on the "no
home page" point — a home page exists now, see below).

**Committed** on branch `feature/home-tutorial-stack` (off `main`, which
is untouched — still on the commit before this feature). Check
`git log`/`git status` on a fresh session start: if there are *more*
uncommitted changes on top of that branch, they're from later in this
same work than whenever this doc was last updated — read the diff before
assuming this doc is fully current.

**Immediate next task, per the user directly**: "iterate the rest of the
page (colors, filters style, like you saw on the figma)" — the stack
itself is in a good place; the ask now is the rest of HomeScreen (see
"Not yet touched," below). The Figma file already used this whole
session is `Tech-Experimentation`, file key `6Mr7K0RONTS8SltZRJtqYj` —
nodes already pulled and worth reusing rather than re-fetching:
`642:5092` (the `BigCard` component + its "Unfold" ghost variant),
`651:5362` (the full "Cards" composition, card placement/rotation
reference).

**`635:4792` already covers the filter chips and header** — pulled once
this session but not yet acted on (attention stayed on the card stack).
Worth re-reading rather than re-fetching before touching either. What it
showed, from memory (verify against a fresh pull before trusting exact
numbers):

- **Header** — "Beauty Notes" in the serif font at 32px (bigger than the
  current 24px), tight tracking (-1.28px); an icon row (info + user,
  each in a rounded-12 white/60%-opacity + hairline-border box) that
  doesn't exist in the current build at all.
- **Filter chips redesigned as "LookSelector"** — a materially different
  style than the current flat `--color-filter-chip-bg` (`#f5f5f5`)
  chips: each has a photo-texture background with a colored
  `mix-blend-overlay`/`mix-blend-soft-light` tint per option (Day: gold
  `#e3b345` overlay + a gold-tinted shadow; Night: blue `#688db6`
  soft-light; Glam: green `#beef9e` soft-light), plus a per-state border
  (selected: `rgba(44,41,38,0.5)`; unselected: `rgba(44,41,38,0.1)`).
  This is a materially bigger visual change than a color swap — it needs
  actual texture/tint assets or a CSS approximation of the blend-mode
  effect, not just new hex values in the existing chip component.

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
- **`CardBehind`** — the flat placeholder-tint (yellow) layer, embedded
  inside each card's own peek presentation, not a separate static prop
  like the first version — see "Ghost reveal system," now locked in.
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
Before that, it shows the flat `CardBehind` yellow placeholder instead —
**this is the final, locked-in choice.** Two alternatives were explored
and explicitly rejected, and their code is gone, not just hidden:

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
