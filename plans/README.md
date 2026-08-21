# Animation plans

Produced by an `improve-animations` audit of the tutorial card stack
(`src/components/TutorialCard.tsx` — the home-screen drag/swipe/fly-off/
restart-flip deck). Full findings table lives in the conversation that
produced these; this index tracks execution.

| # | Plan | Severity | Category | Status |
| --- | --- | --- | --- | --- |
| 001 | [Fix ease-in on the fly-off's disappear-faster fade](001-fly-off-fade-easing.md) | HIGH | Easing & duration | DONE |
| 002 | [Close the interactive-before-flip-finishes window on the restart flip](002-restart-flip-lock-window.md) | MEDIUM | Interruptibility | DONE |
| 003 | [Fold the restart flip's feel values into MotionTuning](003-fold-flip-values-into-motion-tuning.md) | MEDIUM | Cohesion & tokens | TODO |
| 004 | [Replace Start Over's linear drag damping with real rubber-band friction](004-start-over-rubber-band-friction.md) | LOW | Physicality & origin | TODO |
| 005 | [Compose contentOwnRotateY into a full transform string](005-content-layer-composed-transform.md) | LOW | Performance | TODO |

Missed opportunities from the same audit (additive, not corrective — not
planned): tapping the front card hard-cuts into `TutorialFlow` with zero
connecting motion (`src/App.tsx:30`, confirmed no `motion.`/animate usage
anywhere in `TutorialFlow.tsx`); the stack has no first-load entrance
animation.

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
written against commit `628b8b7`.

## How to execute

Each plan is self-contained (exact file paths, current code, target code,
ordered steps, boundaries, verification). Hand a plan to any executor —
`improve-animations execute plans/003-fold-flip-values-into-motion-tuning.md`
dispatches an isolated-worktree executor and reviews the diff automatically;
any other agent or engineer can also just follow the plan directly.
