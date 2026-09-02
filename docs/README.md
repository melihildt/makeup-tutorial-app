# Docs index

Read **[handoff.md](handoff.md)** and **[home-stack-handoff.md](home-stack-handoff.md)**
first — they're the two living reference docs, kept current, covering the
whole app between them. Everything else here is either a point-in-time Figma
diff (kept for its node-ID/measurement reference value, not as a source of
current state) or a scoped, still-open findings list.

| Doc | Covers | Status |
| --- | --- | --- |
| [handoff.md](handoff.md) | The step-by-step tutorial flow: `TutorialFlow.tsx`, `StepScreen.tsx`, `AllStepsView.tsx`, `EyeIllustration.tsx`, `ScreenHeader.tsx` | **Current** — reflects the code as of this doc's own last edit date, noted at its top |
| [home-stack-handoff.md](home-stack-handoff.md) | The home screen's tutorial-card stack: drag/tilt/fly-off, the two-face flips, filter-driven recoloring, `App.tsx`'s screen transition, the About overlay | **Current** — same convention |
| [accessibility-audit-remaining.md](accessibility-audit-remaining.md) | 5 open WCAG contrast findings from a 2026-09-02 audit (4 companion findings already shipped, see the doc) | **Current**, deliberately unfixed — user's call to defer |
| [figma-v2-redesign.md](figma-v2-redesign.md) | Figma node-ID reference for the "V2" redesign pass | **Historical reference** — implementation status lives in `handoff.md`, not here; still useful for node IDs when re-pulling a step |
| [figma-step-screen-restyle.md](figma-step-screen-restyle.md) | Full diff for the "V5" step-screen restyle pass, including every follow-up correction round | **Historical reference**, shipped — has its own "if you just need current values" quick-reference near the top |
| [figma-allsteps-restyle.md](figma-allsteps-restyle.md) | Full diff for the All Steps view restyle pass | **Historical reference**, shipped — same quick-reference convention |

**Not in this folder:** [../plans/README.md](../plans/README.md) is the
`improve-animations` audit ledger — every animation/motion finding across six
audit passes (001–054), what became a plan, and what's still open (currently
just plan 033, deferred by the user's call). It's a working ledger, not a
narrative doc — the status table at the top is the fastest way in.

## If a doc and the code disagree

Trust the code. Both `handoff.md` and `home-stack-handoff.md` are living
docs meant to be corrected in place when they drift, not archived and
replaced — if you find a stale claim, fix it there rather than adding a new
doc.
