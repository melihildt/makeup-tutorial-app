# Animation plans

Produced by two `improve-animations` audits of the tutorial card stack.
**001-005** are from the original audit (`src/components/TutorialCard.tsx`
only, against commit `628b8b7`). **006-007** are from a follow-up audit
this session, after the code had changed substantially (Start Over
redesign, tutorial-card detail flip, `CardBehind`'s duck-and-reveal filter
swap, the stack's first-load entrance, `App.tsx`'s screen transition) —
scoped to `TutorialCard.tsx` + `App.tsx` + `HomeScreen.tsx`, against
commit `db1e1be`. Full findings tables live in the conversations that
produced each; this index tracks execution. **For the fuller current
picture of this whole feature area** (Start Over's redesign, the
ghost-card recolor, the swipe-hint nudge, the tutorial detail flip, and
pending items that are bug fixes rather than audit findings) **see
`docs/home-stack-handoff.md`** — that doc is the primary handoff, this
README only tracks plan execution.

| # | Plan | Severity | Category | Status |
| --- | --- | --- | --- | --- |
| 001 | [Fix ease-in on the fly-off's disappear-faster fade](001-fly-off-fade-easing.md) | HIGH | Easing & duration | DONE |
| 002 | [Close the interactive-before-flip-finishes window on the restart flip](002-restart-flip-lock-window.md) | MEDIUM | Interruptibility | DONE (superseded — see note below) |
| 003 | [Fold the restart flip's feel values into MotionTuning](003-fold-flip-values-into-motion-tuning.md) | MEDIUM | Cohesion & tokens | DONE (one deviation — see note below) |
| 004 | [Replace Start Over's linear drag damping with real rubber-band friction](004-start-over-rubber-band-friction.md) | LOW | Physicality & origin | DONE |
| 005 | [Compose contentOwnRotateY into a full transform string](005-content-layer-composed-transform.md) | LOW | Performance | TODO — needs a rewrite, see note below |
| 006 | [Consolidate the hand-typed ease-out-quart array into one constant](006-consolidate-ease-out-quart-array.md) | LOW | Cohesion & tokens | DONE |
| 007 | [Guard CardBehind's duck-and-reveal against rapid filter switching](007-cardbehind-rapid-filter-race-guard.md) | MEDIUM | Interruptibility | DONE |

**002's specific fix (`isFlipping` local state) no longer exists in the
code** — it was removed during the Start Over two-face-flip redesign
(`docs/home-stack-handoff.md`, "Start Over card" section), which restructured
the flip so `isLocked` alone naturally spans the whole flip duration,
making the separate `isFlipping` flag redundant. The *problem* 002 fixed
(a card interactive before its own flip visually finishes) is still solved
in the current code, just via a different, simpler mechanism than the one
002 specified — left marked DONE since the underlying issue stayed fixed,
not because the plan's own diff is still literally in the codebase.

**003 executed** — `flipDuration`, `flipBounce`, `flightFadeFraction`
added to `MotionTuning`/`DEFAULT_MOTION_TUNING` with the plan's own exact
default values (0.7, 0.15, 0.45 — a pure relocation, not a retune), and
both call sites (`handleStartOverTap`'s flip spring, `flyOff`'s
`FLIGHT_FADE_DURATION`) now read from `tuning.*` instead of literals.
**One deviation from the plan as written**: Step 5 (add matching rows to
`MotionTuner`) was skipped — `MotionTuner` itself was removed entirely
since this plan was written (the dev panel was hidden when 003 was
authored, then deleted outright once the numbers felt settled; see
`docs/home-stack-handoff.md`'s "MotionTuning" section), so there's no
panel left to add rows to. **Scope call made**: left the tutorial-card
detail flip and swipe-hint nudge's own still-unfolded feel-values (both
postdate 003's authoring) untouched — 003's own file only specified Start
Over's two values, and its "if the code has drifted, STOP and report"
boundary argues for the narrower reading rather than silently expanding
scope. Folding those in, if wanted, is separate follow-up work, not part
of 003.

**Both of the original audit's "missed opportunities" are now built** —
see `docs/home-stack-handoff.md`'s "First-load entrance + screen
transition" section: `App.tsx`'s hard `screen === 'home' ? <A/> : <B/>`
swap is now a real `AnimatePresence` push/pop slide, and the stack plays
a fade+rise+scale entrance on true first load (gated to once per session
via a module-level flag, not replayed on returning from a tutorial).

**Two newer pending items are bug fixes from user testing, not audit
findings — tracked in `docs/home-stack-handoff.md` directly, not here**:
the swipe-hint nudge doesn't recognize tap-to-flip as user interaction,
and a card swiped away mid-flip fades out still showing its detail face
instead of the front. Full technical detail (exact cause, fix direction)
in that doc's own "Swipe-hint nudge" and "Tutorial detail flip" sections.

**006 executed** — `EASE_OUT_QUART` (`[0.25, 1, 0.5, 1]`, the JS-array
form of `tokens.css`'s `--ease-out-quart`) is now one exported constant in
`TutorialCard.tsx`, imported into `App.tsx`. All 10 real call sites that
previously hand-typed the array now reference the constant instead — a
pure relocation, no values changed. This introduced the first cross-import
between `App.tsx` and `TutorialCard.tsx` in this codebase (previously
`App.tsx` only imported whole components, `HomeScreen`/`TutorialFlow`).

**004 executed** — `START_OVER_RESIST_FACTOR` (flat `0.35` multiplier)
replaced with a `rubberBand(offset, dimension, coefficient)` helper (the
standard UIScrollView-style overscroll curve) and a size-derived
`START_OVER_RUBBER_BAND_DIMENSION` constant (`CARD_WIDTH * 0.4`, kept out
of `MotionTuning` per the plan's own convention, same status as
`FLY_OFF_DISTANCE`). All four call sites (`handleDrag`'s and
`handleDragEnd`'s start-over branches, both axes) now go through
`rubberBand(...)` instead of the flat multiply.
`startOverRubberBandCoefficient: 0.55` added to `MotionTuning`/
`DEFAULT_MOTION_TUNING`, appended after `flightFadeFraction` per this
file's own ordering note above (003 had already landed). The
`MotionTuner`-row step was skipped — that panel no longer exists (see
003's own note). Build/lint baseline confirmed unchanged via `git stash`
A/B (same pre-existing `tsc`/`oxlint` warnings, just shifted by line
offset). **Real-device drag confirmed working** — the user tested on
their own phone and reported it looks good, closing out this plan's own
"feel check" verification step (the one thing this environment's browser
tooling can never confirm itself, per `docs/home-stack-handoff.md`'s
"Testing notes").

**007 executed** — `CardBehind`'s duck-and-reveal `useEffect` (the
filter-color swap gesture built earlier this session, see
`docs/home-stack-handoff.md`'s "Ghost card recolor by filter" section) now
guards its async `.then()` callback with a `cancelled` flag, set by the
effect's own cleanup function — closes a real race where rapid filter
switching (tapping Day/Night/Glam quickly) could let a stale, superseded
effect run's callback fire after a newer one already landed the correct
color, reverting the ghost card to the wrong texture. Spot-checked in this session's browser environment (rapid
double-tap correctly lands on the last-tapped color) — the plan's own
verification section flags that this environment's tool-call timing can't
fully replicate the tightest possible real race window, so a slower,
more deliberate real-device stress test (or CPU throttling in DevTools,
per the plan's own feel-check) is still worth doing if this ever seems to
resurface.

## Recommended execution order

1. **001, 002** — already done (see Status column).
2. ~~004 before 003~~ — **003 went first** (per the user's own call), which
   the plan already anticipated as a valid order (see its own Boundaries
   section: "if plan 003 has already been executed, add
   `startOverRubberBandCoefficient` after its `flightFadeFraction`
   field/default instead of after `gripScale`"). So: **whoever executes
   004 now, append its new field after `flightFadeFraction`** (003's last
   addition to `MotionTuning`/`DEFAULT_MOTION_TUNING`), not after
   `gripScale` as 004's own Target code blocks show — those blocks were
   written assuming 004-first and are now stale on exactly this point,
   same "re-locate by content, don't trust quoted line numbers/positions
   literally" caveat as everywhere else in this file. `MotionTuner` no
   longer exists either way (see 003's own note above) — skip any
   `MotionTuner`-row step in 004 too.
3. **005 has no dependency on 003 or 004** — independent, touches a
   different part of the same component (the content-layer face's own
   transform, not the drag/tuning logic). Can run any time, before or after
   the others.
4. **006 and 007 are both done, and were independent of 001-005 and of
   each other** — 006 (the `EASE_OUT_QUART` constant) touches call sites
   in `flyOff`/the restart flip/the stack entrance/the screen transition,
   007 (the race guard) touches only `CardBehind`'s own effect; neither
   depends on whether 003/004/005 have run. No action needed here, purely
   historical note for anyone reading this order top-to-bottom.

001-005 touch only `src/components/TutorialCard.tsx` and were
written against commit `628b8b7` — **now well behind current** (see
`docs/home-stack-handoff.md`'s git-state note for the actual current
commit — don't hardcode it here too, it'll just go stale again). The file
has grown substantially since (roughly 986 lines → 2000+), so every line
number cited in 003/004/005 has almost certainly shifted. **003 was
executed successfully despite this** (re-located everything by content,
not line number, per the note below — its actual code shape hadn't
drifted, just its position in the file). **005 is a real exception**: it
references `contentOwnRotateY`/`flipProgress`, variable names that no
longer exist anywhere in the file (confirmed by search) — the restart
flip has been substantially rebuilt since 628b8b7 (now shares
`flipRotateY`/`isFlipped` with the tutorial-card detail flip, see
`docs/home-stack-handoff.md`'s "Tutorial detail flip" section). Whoever
picks up 005 needs to re-derive its actual target from the *current* flip
implementation, not adapt the plan's quoted snippets — treat it as
needing a rewrite, not just a re-location. Each plan's own
"if the code has drifted, STOP and report" boundary is the right way to
handle this: re-locate the cited code by its content/function name first,
don't trust the line numbers literally.

## How to execute

Each plan is self-contained (exact file paths, current code, target code,
ordered steps, boundaries, verification). Hand a plan to any executor —
`improve-animations execute plans/003-fold-flip-values-into-motion-tuning.md`
dispatches an isolated-worktree executor and reviews the diff automatically;
any other agent or engineer can also just follow the plan directly.
