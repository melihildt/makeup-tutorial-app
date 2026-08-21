# Animation plans

Produced by an `improve-animations` audit of the tutorial card stack
(`src/components/TutorialCard.tsx` — the home-screen drag/swipe/fly-off/
flip deck). Full findings table lives in the conversation that produced
these; this index tracks execution. **For the fuller current picture of
this whole feature area** (Start Over's redesign, the ghost-card recolor,
the swipe-hint nudge, the tutorial detail flip, and two newer pending
items that are bug fixes rather than audit findings) **see
`docs/home-stack-handoff.md`** — that doc is the primary handoff, this
README only tracks the original 5-finding audit specifically.

| # | Plan | Severity | Category | Status |
| --- | --- | --- | --- | --- |
| 001 | [Fix ease-in on the fly-off's disappear-faster fade](001-fly-off-fade-easing.md) | HIGH | Easing & duration | DONE |
| 002 | [Close the interactive-before-flip-finishes window on the restart flip](002-restart-flip-lock-window.md) | MEDIUM | Interruptibility | DONE (superseded — see note below) |
| 003 | [Fold the restart flip's feel values into MotionTuning](003-fold-flip-values-into-motion-tuning.md) | MEDIUM | Cohesion & tokens | TODO (scope has drifted — see note below) |
| 004 | [Replace Start Over's linear drag damping with real rubber-band friction](004-start-over-rubber-band-friction.md) | LOW | Physicality & origin | TODO |
| 005 | [Compose contentOwnRotateY into a full transform string](005-content-layer-composed-transform.md) | LOW | Performance | TODO |

**002's specific fix (`isFlipping` local state) no longer exists in the
code** — it was removed during the Start Over two-face-flip redesign
(`docs/home-stack-handoff.md`, "Start Over card" section), which restructured
the flip so `isLocked` alone naturally spans the whole flip duration,
making the separate `isFlipping` flag redundant. The *problem* 002 fixed
(a card interactive before its own flip visually finishes) is still solved
in the current code, just via a different, simpler mechanism than the one
002 specified — left marked DONE since the underlying issue stayed fixed,
not because the plan's own diff is still literally in the codebase.

**003's scope predates three things that now also have unfolded feel-values**:
the tutorial-card detail flip (`handleCardTap`'s spring, `{bounce: 0.15,
duration: 0.45}`) and the swipe-hint nudge (`{bounce: 0.35, duration: 0.35}`
out / `{bounce: 0.25, duration: 0.4}` back) both live as bare literals the
same way Start Over's flip values did when 003 was written — none of
them existed yet at the time. Whoever executes 003 should decide whether
to fold those in too (matching the same reasoning 003 already gives for
Start Over's flip values) or treat that as separate follow-up scope — 003's
own file only covers what existed at the time it was written, per its own
"if the code has drifted, STOP and report" boundary.

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

## Recommended execution order

1. **001, 002** — already done (see Status column).
2. **004 before 003.** Both touch `MotionTuning`/`DEFAULT_MOTION_TUNING`/
   `MotionTuner`'s rows, and 004 fully retires `START_OVER_RESIST_FACTOR`
   (replaces it with a different mechanism and its own new tunable field).
   Plan 003 deliberately does *not* fold `START_OVER_RESIST_FACTOR` into
   `MotionTuning` for exactly this reason — see its own Boundaries section.
   Doing 004 first means there's nothing stale to clean up; doing 003 first
   still works (003's own scope already excludes the value 004 replaces),
   but 004 second must remember to append its new field after whatever 003
   already added rather than assuming `gripScale` is still the last field
   (004's own Boundaries section covers this either-order case explicitly).
3. **005 has no dependency on 003 or 004** — independent, touches a
   different part of the same component (the content-layer face's own
   transform, not the drag/tuning logic). Can run any time, before or after
   the others.

All five plans touch only `src/components/TutorialCard.tsx` and were
written against commit `628b8b7` — **now well behind current** (HEAD is
`150ca7b`, plus further uncommitted work on top, see
`docs/home-stack-handoff.md`'s git-state note). The file has grown
substantially since (roughly 986 lines → 1700+), so every line number
cited in 003/004/005 has almost certainly shifted — each plan's own
"if the code has drifted, STOP and report" boundary is the right way to
handle this: re-locate the cited code by its content/function name first,
don't trust the line numbers literally.

## How to execute

Each plan is self-contained (exact file paths, current code, target code,
ordered steps, boundaries, verification). Hand a plan to any executor —
`improve-animations execute plans/003-fold-flip-values-into-motion-tuning.md`
dispatches an isolated-worktree executor and reviews the diff automatically;
any other agent or engineer can also just follow the plan directly.
