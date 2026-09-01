# Animation plans

Produced by four `improve-animations` audits. **001-005** are from the
original audit (`src/components/TutorialCard.tsx` only, against commit
`628b8b7`). **006-007** are from a follow-up audit (Start Over redesign,
tutorial-card detail flip, `CardBehind`'s duck-and-reveal filter swap, the
stack's first-load entrance, `App.tsx`'s screen transition) — scoped to
`TutorialCard.tsx` + `App.tsx` + `HomeScreen.tsx`, against commit
`db1e1be`. **008-021** are all from the third audit covering the *whole
tutorial flow* end to end (HomeScreen → TutorialCard's stack/flip/Start
Over → TutorialFlow → StepScreen → AllStepsView), against commit
`677c3d7` — the first audit to fan out across every screen in the flow at
once rather than just the home-stack component. **008-011** were the four
findings picked first and executed same-session; **012-021** are the
audit's findings 5-14 (in that audit's own original numbering — the table
below uses each plan's own file number instead), written up as plans
afterward and, as of the latest session, all executed too — **001-021 are
all DONE or resolved-moot**. **022-024** are from a fourth audit, scoped to
just the About/Info overlay (`src/components/InfoOverlay.tsx`, opened from
`HomeScreen.tsx`'s info icon — a screen that didn't exist during the first
three audits), against commit `9f1aa24` — small enough in scope (one file
plus its two-line trigger) that it was audited directly rather than via
subagent fan-out. All three of that audit's findings were selected to
become plans, and all three are now executed too. **025-026** are from a
fifth audit, against commit `75a7936` — scoped to the newer surface area
the first four audits never covered: `AccountScreen.tsx` +
`MyProductsScreen.tsx` (came back clean, no findings), the "coming soon"
feature in `TutorialCard.tsx` (`ProductsPreview`'s coming-soon branch,
`ComingSoonButton`), and a whole-app cohesion/accessibility pass. Three
findings were confirmed; the user selected two (025, 026) to become
plans — the third (`ComingSoonButton`'s complete lack of tap feedback,
`TutorialCard.tsx:786-804`) was presented but not selected, and isn't
written up as a plan. Full findings
tables live in the conversations that produced each; this index tracks
execution. **025 and 026 both executed in the same session they were
written, directly in the working tree** (same reasoning as every prior
batch — the repo had uncommitted changes at execution time). Both
re-verified against current file content immediately before editing; no
drift found from the commit `75a7936` citations.

- **025 executed exactly as planned** — `Toast.tsx`'s `transition`
  `duration` changed from the untraceable `0.3` to `0.35` (`--duration-layout`),
  with the plan's own comment added immediately above it. Verified:
  `npx tsc -b` clean; `grep -n "duration:" src/components/Toast.tsx` shows
  exactly `reduceMotion ? 0.15 : 0.35`. Live-checked by triggering the
  toast from `MyProductsScreen`'s "Add product" button — it rendered,
  animated in and back out on its normal auto-dismiss timer, and produced
  no console or dev-server errors; this environment's browser tooling
  couldn't reliably catch the WAAPI animation itself mid-flight (the
  entrance/exit are fast relative to the async round-trip needed to query
  `getAnimations()`, and several `computer`-tool clicks timed out this
  session for reasons unrelated to this change — worked around via
  `element.click()` dispatched through `javascript_tool` throughout, same
  category of environment limitation as 009/018/022's own notes above), so
  the exact `0.35` duration is confirmed via source + `tsc`, not a live
  WAAPI timing readout.
- **026 executed exactly as planned** — `product-preview-fade-in` added to
  `index.css` immediately after `product-preview-pop-in`; `popStyle` in
  `TutorialCard.tsx`'s `ProductsPreview` gained an `animationName`
  parameter, `popAnimationName` added (`tutorial.hasContent` branch), all
  three call sites updated. Verified: `npx tsc -b` clean; `grep -n
  "popStyle("` shows all three call sites now passing two arguments.
  Live-verified via `document.getAnimations()` on both branches after
  flipping each card to its detail face (dispatched via `.click()`,
  same tooling workaround as 025's note): the coming-soon tutorial
  ("Everyday Mattes", Day filter) ran `product-preview-fade-in` on all
  three thumbnail wrappers with keyframes confirmed as opacity-only (no
  `transform`) via `effect.getKeyframes()`; the one real-content tutorial
  ("Soft Smokey Eye", Night filter) still ran the original
  `product-preview-pop-in` with its full `translateY(24px) scale(0.7)` →
  rest keyframes, confirming the real-photo branch is pixel-for-pixel
  unchanged. Screenshots of both confirm the visual result matches: the
  coming-soon detail face's blurred/tinted thumbnails at rest with no pop
  artifacts, the real-photo detail face's product images unchanged. The
  reduced-motion gate (`justRevealed && !reduceMotion`) is untouched code
  by this plan, so it wasn't re-verified from scratch — already correct
  going in, per the plan's own Boundaries.

Mechanical check across both: `npx tsc -b` clean, no console or
dev-server errors during editing or the live verification passes above.

**For the
fuller current picture of this whole feature area** (Start Over's
redesign, the ghost-card recolor, the swipe-hint nudge, the tutorial
detail flip, and pending items that are bug fixes rather than audit
findings) **see `docs/home-stack-handoff.md`** — that doc is the primary
handoff, this README only tracks plan execution.

**027-032 are a different kind of pass** — not an `improve-animations`
audit, but a design-token sync against a newer Figma iteration (file
`6Mr7K0RONTS8SltZRJtqYj`, section "New", node `906:12628`) that turned out
to have real named variables (`BeNoApp/…`, `BeautyNotes/…`) where the file
previously had none. Six of the twelve top-level frames in that section
were pulled and diffed against `src/styles/tokens.css` and the current
component code: Step 7, All Steps, My Products, Account, About, and two
`Home/DaySelected` duplicates (one of which — the newest, rightmost one —
turned out to be more fully updated than the others, and settled an
otherwise-ambiguous finding). Six findings were confirmed; all six were
selected to become plans, ordered by blast radius/value: **027** (ink
color migration, biggest cascade), **028** (background gradient stop
correction), **029** (new elevated shadow token for sheet containers),
**030** (serif title font consolidation onto EB Garamond), **031**
(product-image radius split between StepScreen and AllStepsView/My
Products), **032** (header icon-button border, lowest priority —
cohesion-only). **All six executed in the same session they were
written**, directly in the working tree.

- **027 executed exactly as planned** — `--color-tutorial-card-text`
  (`#2c2926` → `#21201f`) and `--color-info-overlay-heading`
  (`rgba(44,41,38,0.5)` → `#656462`) updated in `tokens.css`, no component
  files touched (cascades entirely via `var(...)`). Live-verified computed
  color on HomeScreen's title (`rgb(33,32,31)`), BigCard's flipped-face
  title, and Account/My Products/Bookmarks/About's header titles
  (`rgb(101,100,98)`) — all match exactly.
- **028 executed exactly as planned** — `--gradient-bg-home` and
  `--gradient-bg-list`'s hex stops updated; `--gradient-bg-list`'s `53px`
  stop deliberately left as its own flagged gap, per the plan's own
  Boundaries.
- **029 executed with one on-the-fly fix beyond the plan** —
  `--shadow-card-elevated` added; `StepScreen.tsx`/`AllStepsView.tsx`
  repointed via their existing inline `boxShadow` style (worked
  immediately). `MyProductsScreen.tsx`/`AccountScreen.tsx` were originally
  planned as a `shadow-[--shadow-card-elevated]` Tailwind class edit, but
  live verification caught that this arbitrary-value syntax silently
  compiles to a **shadow *color*** (`--tw-shadow-color`) rather than the
  whole `box-shadow`, so `box-shadow` itself never gets set — computed
  style came back `none`. This means `MyProductsScreen.tsx`'s card had
  been shipping with **zero shadow since before this plan** (same
  pre-existing `shadow-[--shadow-card]` pattern, never actually working).
  Fixed by moving both to inline `style={{ boxShadow: 'var(...)' }}`,
  matching StepScreen/AllStepsView's already-correct pattern — confirmed
  live afterward (`rgba(14, 11, 6, 0.03) 0px 0px 24px 6px` on both).
  `BookmarksScreen.tsx:321` has the identical broken `shadow-[--shadow-card]`
  class and was left untouched (out of scope this round, not silently
  fixed) — worth a follow-up.
- **030 executed exactly as planned** — `index.html`'s Google Fonts link
  now also loads EB Garamond; `--font-family-serif-card` repointed to it;
  `--font-size-home-title`/`--letter-spacing-home-title` updated to
  24px/-0.24px; new `--font-size-title-serif`/`--letter-spacing-title-serif`
  tokens added and applied to `TutorialCard.tsx`'s BigCard title and all
  four overlay screens' header titles (Account/My Products/
  Bookmarks/About). Live-verified: `document.fonts.check("16px 'EB
  Garamond'")` returns `true`; computed `fontFamily` on all six titles
  reads `"EB Garamond", Georgia, "Times New Roman", serif` at `24px`/
  `-0.24px`.
- **031 executed exactly as planned** — `--radius-image-list` (12px)
  added; `ProductCard.tsx` gained an `imageRadius` prop (default
  `'default'`, so `StepScreen.tsx`'s call site needed no change);
  `AllStepsView.tsx`'s one call site passes `imageRadius="list"`;
  `MyProductsScreen.tsx`'s own inline product-image block repointed
  directly. Live-verified: StepScreen's product images still `8px`;
  AllStepsView's and My Products' now `12px`.
- **032 executed exactly as planned** — `--color-header-icon-border`
  (`rgba(44,41,38,0.2)` → `#dad8d7`) updated in `tokens.css`; cascades via
  the existing `HEADER_CHIP_STYLE`. Live-verified: a header button's inset
  border resolved to `rgb(218, 216, 215)` (`#dad8d7`) exactly.

Mechanical check across all six: `npx tsc -b` clean throughout (including
after the 029 shadow fix); `oxlint` shows only pre-existing warnings
unrelated to these changes. One unrelated console error surfaced during
live verification (`InvalidStateError: Transition was aborted because of
invalid state`) — traced to this session's own rapid-fire `navigate()`
calls overlapping a view transition mid-flight, not a regression from any
of these six plans (none of them touch routing/transitions).

**033-036 are a second wave of the same pass**, prompted directly by the
user pushing back that the first wave still left visible drift ("I still
see things that didn't change... maybe it's worth going screen by
screen"). That challenge was correct: the original sampling of 6 of 12
frames had extrapolated Bookmarks' and About's values by analogy rather
than confirming them, and had completely missed
`ProductDetailOverlay.tsx` — a component whose Figma demo frame is a
*second* "Home/About" duplicate (node `896:10461`) repurposed to show
"Product Detail" instead, easy to miss since the frame's own internal name
never changed. Checking the three remaining unexplored duplicates
confirmed they were just repeat locked/coming-soon card states (nothing
new), but the second `Home/Profile-MyProducts` duplicate (`896:10559`)
turned out to be Bookmarks, not a repeat. **034-036 executed; 033 was
explicitly deferred by the user** ("ignore the 033, i think that's related
to the previous home design") even though its container was pulled from
the same "New" section as its siblings — left as-is per that call, not
silently dropped.

- **034 executed exactly as planned** — `--color-border-hairline`
  (`rgba(44,41,38,0.2)` → `#dad8d7`) updated in `tokens.css`, the same
  migration as plan 032 just missed on a sibling token. Live-verified: a
  product image's border and the Product Detail hero image's border both
  resolve to `rgb(218, 216, 215)` (`#dad8d7`).
- **035 executed exactly as planned** — `ProductDetailOverlay.tsx`'s
  "Product Detail" title moved onto the same
  `--font-family-serif-card`/`--font-size-title-serif`/
  `--letter-spacing-title-serif` tokens plan 030 already introduced (its
  fifth call site, missed the first time). Live-verified: computed
  `fontFamily` reads `"EB Garamond", Georgia, "Times New Roman", serif` at
  `24px`/`-0.24px`.
- **036 executed exactly as planned** — new `--shadow-product-detail-image`
  token added (`0px 0px 24px 0px rgba(14,11,6,0.03)` — a genuinely
  distinct value, not a rounding of any existing shadow token); the hero
  image `motion.div` resized `238px` → `282px` and repointed to it.
  Live-verified: computed `width`/`height` `282px`, `boxShadow`
  `rgba(14, 11, 6, 0.03) 0px 0px 24px 0px`.

The larger finding raised alongside these — the product name's 28px EB
Garamond headline treatment and a new "Shade/Category/Purchase on"
info-row section in `ProductDetailOverlay.tsx` — was held pending a data
question (the `Product` type had no purchase-date field, and category,
while already tracked, wasn't shown here). The user resolved it directly:
"add the categories missing in this page, put dummy data if needed" —
**037** executed on that basis. `Product.category` turned out to already
be real data, just unwired to this screen; only `purchasedAt` needed new
placeholder values (added per-product, e.g. `06/2025` for MERIT's The
Minimalist — matching Figma's own real example — through `11/2024` for
Chanel's Les 4 Ombres). The Shade row's second "undertone" value shown in
Figma's one example ("Ochre" / "Light (warm)") was deliberately *not*
fabricated — this app's existing shade data (e.g. "79 - Spices") doesn't
carry a second part, and inventing one per product would be more invented
than what was asked for.

Mechanical check across 034-037: `npx tsc -b` clean; `npm run lint` shows
only pre-existing warnings; no new console errors during live
verification (both a with-shade product, Chanel Les 4 Ombres, and a
without-shade product, MERIT The Minimalist, were checked to confirm the
Shade row correctly appears/disappears rather than rendering blank).

| # | Plan | Severity | Category | Screen impact | Status |
| --- | --- | --- | --- | --- | --- |
| 001 | [Fix ease-in on the fly-off's disappear-faster fade](001-fly-off-fade-easing.md) | HIGH | Easing & duration | Home | DONE |
| 002 | [Close the interactive-before-flip-finishes window on the restart flip](002-restart-flip-lock-window.md) | MEDIUM | Interruptibility | Home | DONE (superseded — see note below) |
| 003 | [Fold the restart flip's feel values into MotionTuning](003-fold-flip-values-into-motion-tuning.md) | MEDIUM | Cohesion & tokens | Home | DONE (one deviation — see note below) |
| 004 | [Replace Start Over's linear drag damping with real rubber-band friction](004-start-over-rubber-band-friction.md) | LOW | Physicality & origin | Home | DONE |
| 005 | [Compose contentOwnRotateY into a full transform string](005-content-layer-composed-transform.md) | LOW | Performance | Home | MOOT — target no longer exists, see note below |
| 006 | [Consolidate the hand-typed ease-out-quart array into one constant](006-consolidate-ease-out-quart-array.md) | LOW | Cohesion & tokens | Home (+ App shell) | DONE |
| 007 | [Guard CardBehind's duck-and-reveal against rapid filter switching](007-cardbehind-rapid-filter-race-guard.md) | MEDIUM | Interruptibility | Home | DONE |
| 008 | [Remove leftover flip-debug console logging](008-remove-flip-debug-instrumentation.md) | HIGH | Performance | Home | DONE |
| 009 | [Add press/hover feedback to ScreenHeader's four buttons](009-screenheader-press-feedback.md) | HIGH | Physicality & origin | Tutorial step, All steps view | DONE |
| 010 | [Compose StepScreen's product-card y/scaleY into full transform strings](010-step-card-composed-transform.md) | HIGH | Performance | Tutorial step | DONE |
| 011 | [Give reduced-motion users the same tutorial detail content](011-reduced-motion-detail-flip-parity.md) | HIGH | Accessibility | Home | DONE |
| 012 | [Import the shared EASE_OUT_QUART constant in StepScreen](012-stepscreen-ease-out-quart-import.md) | LOW | Cohesion & tokens | Tutorial step | DONE |
| 013 | [Bring check-ring-in's entrance scale inside the 0.9–0.97 band](013-check-ring-in-scale-band.md) | LOW | Physicality & origin | Home, Tutorial step, All steps view | DONE |
| 014 | [Clear justToggledKey synchronously on view switch](014-justtoggledkey-view-switch-clear.md) | MEDIUM | Interruptibility / Purpose | Tutorial step, All steps view | DONE |
| 015 | [Replace StartOverCard's keyframe-restart filter swap with an interruptible crossfade](015-startover-interruptible-crossfade.md) | MEDIUM | Interruptibility | Home | DONE |
| 016 | [Animate the product-sheet reserved-height collapse on Finish→Done](016-animate-product-sheet-reserved-height.md) | MEDIUM | Missed opportunity | Tutorial step | DONE |
| 017 | [Ignore rapid repeat taps on Next while content is animating](017-debounce-next-button.md) | MEDIUM | Interruptibility | Tutorial step | DONE |
| 018 | [Stop nested pressables from compounding their ancestor's :active scale](018-nested-pressable-scale-isolation.md) | MEDIUM | Physicality & origin | Home | DONE |
| 019 | [Drive the chip press-flash sweep via transform instead of background-position](019-chip-flash-sweep-transform.md) | MEDIUM | Performance | Home | DONE |
| 020 | [Move AllStepsView's scroll-shadow transition onto the app's tokens](020-allstepsview-scroll-shadow-tokens.md) | LOW | Cohesion & tokens | All steps view | DONE |
| 021 | [Give StepScreen's per-step content swap its own faster duration budget](021-step-content-duration-budget.md) | LOW | Easing & duration | Tutorial step | DONE |
| 022 | [Add press feedback to InfoOverlay's Portfolio/Email link rows](022-infooverlay-link-press-feedback.md) | MEDIUM | Physicality & origin | About/Info overlay | DONE |
| 023 | [Stagger InfoOverlay's card entrance behind its backdrop](023-infooverlay-card-entrance-stagger.md) | LOW | Cohesion & tokens | About/Info overlay | DONE (one correction — see note below) |
| 024 | [Give CopyEmailButton's "Couldn't copy" failure state its own motion cue](024-copy-email-failure-shake.md) | LOW | Missed opportunity | About/Info overlay | DONE |
| 025 | [Fix Toast's entrance/exit duration to match a real token](025-toast-duration-token.md) | LOW | Cohesion & tokens | Toast (Account, My Products) | DONE |
| 026 | [Give coming-soon thumbnails their own calmer entrance](026-coming-soon-thumbnail-calm-entrance.md) | MEDIUM | Purpose & frequency | Home (tutorial card detail face) | DONE |
| 027 | [Migrate ink tokens from alpha-derived grays to flat Figma swatches](027-ink-color-flat-migration.md) | HIGH | Cohesion & tokens | App-wide | DONE |
| 028 | [Correct --gradient-bg-home's drifted hex/stop values](028-home-gradient-stop-correction.md) | MEDIUM | Cohesion & tokens | Home, Account, Bookmarks, My Products, Tutorial step | DONE |
| 029 | [Give sheet/list containers their own elevated shadow token](029-sheet-container-elevated-shadow.md) | MEDIUM | Cohesion & tokens | Tutorial step, All steps view, My Products, Account | DONE |
| 030 | [Move shared serif title typography from Cactus Classical Serif to EB Garamond](030-serif-title-eb-garamond.md) | MEDIUM-HIGH | Cohesion & tokens | Home, Tutorial card, Account, My Products, Bookmarks, About | DONE |
| 031 | [Split product-image corner radius: AllStepsView/My Products want 12px, StepScreen stays 8px](031-product-image-radius-split.md) | MEDIUM | Cohesion & tokens | All steps view, My Products | DONE |
| 032 | [Header icon-button border: alpha approximation → flat Figma swatch](032-header-icon-border-flat-swatch.md) | LOW | Cohesion & tokens | App-wide (header icon buttons) | DONE |
| 033 | [Bookmarks catches up to the shadow/radius fixes already applied to its sibling screens](033-bookmarks-shadow-radius-catchup.md) | MEDIUM | Cohesion & tokens | Bookmarks | DEFERRED — user's call |
| 034 | [--color-border-hairline: alpha approximation → flat Figma swatch](034-border-hairline-flat-swatch.md) | LOW-MEDIUM | Cohesion & tokens | App-wide (product image borders) | DONE |
| 035 | [Product Detail overlay's title: same stale pattern plan 030 already fixed everywhere else](035-product-detail-title-typography.md) | MEDIUM | Cohesion & tokens | Product Detail overlay | DONE |
| 036 | [Product Detail overlay's hero image: bigger card, new shadow value](036-product-detail-hero-image-treatment.md) | MEDIUM | Cohesion & tokens | Product Detail overlay | DONE |
| 037 | [Add the Shade/Category/Purchase-on info rows to ProductDetailOverlay](037-product-detail-info-rows.md) | MEDIUM-HIGH | Missing feature / design-source sync | Product Detail overlay | DONE |
| 037 | [Product Detail overlay: product-name headline + Shade/Category/Purchase-on rows](037-product-detail-info-rows.md) | MEDIUM-HIGH | Missed content / cohesion & tokens | Product Detail overlay | DONE |
| 038 | [My Products screen: icon/text color bugs + missing sheet-container border](038-my-products-token-fixes.md) | MEDIUM | Cohesion & tokens | My Products (+ Account/All Steps/Step screen containers) | DONE |

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

**005 checked, found moot — not executed, not rewritten.** Investigated
picking this up (its quoted target, `contentOwnRotateY`/`flipProgress`,
was already known-gone per the note below) by searching for whatever the
*current* equivalent of the finding might be. There isn't one: a
file-wide search for a bare `rotateY:` style shorthand (the actual
anti-pattern this plan flags — an individual Framer transform prop
competing with a separately-composed `transform` string on the same CSS
property) turns up zero matches anywhere in `TutorialCard.tsx`. The
restart flip's content layer (`TutorialCard.tsx:1815-1827`, the front
face inside `TutorialStackCard`) has no rotation of its own at all now —
it inherits the parent's 3D rotation via `transformStyle: preserve-3d`
and only sets `opacity`/`backfaceVisibility`; the two back-face layers
(`:1877`, `:1890`) use a static literal `transform: 'rotateY(180deg)'`,
already a full transform string, not a shorthand prop. The one remaining
shorthand transform prop in the file (`rotate: behindRotate` in
`CardBehind`) is explicitly out of scope per this plan's own Boundaries,
and isn't actually the same problem shape either — that element has no
separate `transform` of its own for a shorthand to collide with. **Net
result: the flip-mechanism rebuild that happened between this plan's
authoring and now (sharing `flipRotateY`/`isFlipped` with the tutorial-
detail flip, see `docs/home-stack-handoff.md`'s "Tutorial detail flip"
section) eliminated this plan's target as a side effect of unrelated
work, not by executing this plan's own fix.** Per the plan's own "if the
code has drifted, STOP and report the mismatch instead of improvising"
boundary, no substitute target was invented — there's nothing matching
this finding left to change.

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

**008-011 all executed**, each exactly as specified — no drift found
between the plans' quoted "current" code and what was actually in the
files at execution time (008 and 010's citations matched byte for byte;
009 and 011 matched with only line-number shifts caused by 008's own
deletions earlier in the same file, expected and already covered by each
plan's "re-locate by content" boundary). Executed directly in the working
tree rather than via isolated git worktrees — the repo had uncommitted
changes in both target files (`StepScreen.tsx`, `TutorialCard.tsx`) at
execution time, and a fresh worktree checkout would have started from
clean `HEAD` without them, which is exactly the drift each plan's own
boundary says to stop and report on rather than improvise past.

- **008**: both debug blocks deleted (the always-on `dragX`/`dragY`
  `console.log` subscription and `flyOff`'s own log statement). Verified:
  `grep -rn "console\.\(log\|debug\)" src/` returns zero matches anywhere
  in the repo.
- **009**: `.header-icon-button` added to `index.css` right after
  `.action-button`, applied to all four `ScreenHeader` buttons. Verified:
  all four buttons carry `transition: transform 0.15s cubic-bezier(0.25,
  1, 0.5, 1)` in the live computed style, and `.header-icon-button:active
  { transform: scale(0.93); }` is confirmed present in the loaded
  stylesheet (`document.styleSheets`) — real `:active` presses can't be
  triggered by synthetic `PointerEvent`s in this environment's browser
  tooling, so the rule's *presence and correctness* was verified directly
  rather than a live press.
- **010**: both `motion.div`s' `y`/`scaleY` shorthand props replaced with
  composed `transform` strings. Verified: the product card's resting
  computed `transform` is the identity matrix (`matrix(1, 0, 0, 1, 0,
  0)`, i.e. `translateY(0px) scaleY(1)` correctly resolves to no visible
  offset), and stepping through several real Next transitions in the
  browser shows the same entrance feel as before the change.
- **011**: `flippedIds`/`handleToggleFlip` added, the reduced-motion
  branch's `.map()` now swaps between `TutorialLookCard` and
  `TutorialDetailCard`. Verified live: since this environment's browser
  tooling can set `window.matchMedia`'s override but Framer Motion caches
  the real `MediaQueryList` internally (the override didn't propagate to
  a freshly-mounted `TutorialStack`), verification instead used a
  temporary, clearly-marked `|| true` forced on `reduceMotion` at its own
  declaration, reloaded, exercised the full interaction (tap card → flips
  to detail face showing level/product-preview/"Start Tutorial" → tap
  detail face → flips back → tap "Start Tutorial" → opens the tutorial),
  confirmed working exactly as the plan specified, then reverted the
  temporary override before finishing (confirmed gone via `grep -n "TEMP
  TEST" src/components/TutorialCard.tsx`, zero matches, and a clean `tsc
  --noEmit`).

Mechanical check across all four: `npx tsc --noEmit` clean, no console
errors during any of the manual interaction above.

**012-021 written up as plans; all ten executed** — these are the same audit's findings 5-14
(its own original numbering; each plan file below carries its own 01x
number instead). Each plan's code citations were re-verified against the
actual current files (not just the original audit's snapshot) before
writing — `TutorialCard.tsx` and `StepScreen.tsx` had both shifted since
008/010/011 landed, so every quoted line number and surrounding code
block in 012-021 reflects the post-008-011 state, confirmed via fresh
`grep`/`Read` calls rather than trusted from the original findings table.
Executed directly in the working tree, same reasoning as 008-011 (the
repo still has uncommitted changes in `StepScreen.tsx`/`TutorialCard.tsx`
that a fresh git-worktree checkout would miss).

- **012 executed exactly as planned** — `EASE_OUT_QUART` imported from
  `./TutorialCard`, `cardExitTransition`'s hand-typed array replaced.
  Verified: `grep -n "\[0.25, 1, 0.5, 1\]" src/components/StepScreen.tsx`
  returns zero matches, `tsc --noEmit` clean, no circular-import issue
  (checked explicitly, since `StepScreen.tsx` now imports from
  `TutorialCard.tsx` — confirmed the reverse import doesn't exist).
- **016 executed, but with a real correction to the plan's own Target** —
  the plan as originally written specified Framer Motion's `layout` prop.
  That was tried first and **live-verified to not work**: polling the
  wrapper's own `getBoundingClientRect().height` every animation frame
  across the real Finish→Done transition showed an instant 238→0 snap
  with zero intermediate frames, not a smooth collapse. Root cause:
  `layout` uses the FLIP technique, which computes an inverse transform
  as `oldSize/newSize` to fake smooth motion — collapsing to a target
  height of exactly 0 makes that ratio divide by zero, so there's no
  valid transform to animate from. A second attempt animating the numeric
  `minHeight` value directly via `animate` was also tried and also
  confirmed (same live-polling method) to snap instantly — Framer Motion
  doesn't recognize `minHeight` as an animatable style key. The **actual
  working fix**, now reflected in `016`'s own file: animate plain
  `height` via `animate={{ height: content.products.length > 0 ? 238 : 0
  }}` — confirmed via the same RAF-polling method to genuinely
  interpolate (238 → 230 → 188 → 153 → 122 → ... → 0 over ~300ms, a real
  ease-out curve). This is a good example of why this skill's plans carry
  a feel-check verification step instead of trusting a mechanically
  plausible-sounding fix: the original Target read as reasonable
  (`layout` is Framer Motion's own recommended tool for animating
  arbitrary bounding-box changes) but was empirically wrong for this
  specific collapse-to-zero case, and a second reasonable-sounding
  fallback (`minHeight`) was *also* wrong — only direct measurement
  caught either.
- **017 executed exactly as planned** — `isAnimatingContentRef` +
  companion `useEffect` added, `handleNextClick` wraps `onNextStep`.
  Verified live with a real behavioral distinction worth recording: 6
  `.click()` calls fired in a single unyielding synchronous loop (no
  `await`/`setTimeout` between them) all land in the same React batch and
  bypass the guard entirely (advanced 6 full steps) — but this is not a
  real user-interaction pattern; no physical tap or even a scripted
  auto-clicker produces literally zero event-loop separation between
  clicks. Re-tested with even a `setTimeout(0)` yield between clicks
  (still far faster than any human tap) and the guard correctly engaged,
  blocking every repeat tap within the 350ms window and advancing only
  one step from six attempts.
- **021 executed exactly as planned** — `--duration-step-content: 280ms`
  added to `tokens.css`, applied to `StepScreen.tsx`'s badge
  (`step-fade-in`) and the `step-content-in` branch only; the
  `view-fade-in` fallback branch (line ~545) deliberately left on
  `--duration-layout`, per the plan's own Boundaries.

Mechanical check across all four: `npx tsc --noEmit` clean throughout. A
few `[vite] Internal server error` / `500` entries appeared in this
session's browser console and dev-server logs during the *editing*
process — all confirmed stale (timestamped exactly at moments between two
sequential edits to the same JSX element, e.g. `motion.div`'s opening tag
changed before its closing tag in the same edit sequence) by cross-
checking the dev server's own HMR log for a later, successful update
before treating any plan as verified; none reflect the final state of any
file.

**013, 014, 018 executed in a later session, all exactly as planned** —
re-verified against current file content before editing (per each plan's
own "re-locate by content, don't trust line numbers" boundary); all three
target lines matched byte-for-byte with no drift.

- **013 executed exactly as planned** — `check-ring-in`'s `from` rule
  changed from `scale(0.85)` to `scale(0.92)`, doc comment updated with the
  AUDIT band reasoning. Verified: `grep -n "scale(0.85)" src/index.css`
  returns zero matches; the live compiled `CSSKeyframesRule` in the
  browser confirms `scale(0.92)` on `0%`. No component file touched, all
  six call sites pick up the value automatically as the plan intended.
- **014 executed exactly as planned** — `setJustToggledKey(null)` added to
  `handleSelectStepView` (after the `lastToggledStep` clear, before
  `setView('step')`) and to the `onSelectListView` prop (expanded from a
  bare arrow to a block body, `setJustToggledKey(null)` before
  `setView('list')`). Verified live: toggled a product on a step screen,
  switched to the All Steps view, and the matching row showed its checked
  resting state with no spurious replay; toggling a product and staying in
  the same view still animates normally (regression check passed).
- **018 executed exactly as planned** — `has-[button:active]:scale-100`
  added to both `TutorialLookCard`'s and `TutorialDetailCard`'s root
  `className`, immediately after `active:scale-[0.97]`. Verified: the live
  compiled stylesheet shows the exact expected rule —
  `.has-\[button\:active\]\:scale-100:has(button:active) { ... scaleX(1)
  scaleY(1) ... }` — confirming Tailwind resolved the arbitrary `has-*`
  variant correctly. A true held-press `:active` state can't be forced
  through this environment's synthetic pointer events (same limitation the
  plan's own Verification section flags — `:has()` state depends on a
  live descendant press, not a forceable pseudo-class), so — as with 009's
  precedent for the same class of limitation — verification relied on
  confirming the rule's presence, selector, and specificity directly
  rather than a live press.

Mechanical check across all three: `npx tsc --noEmit` clean, no console or
dev-server errors during editing or the live interaction pass above.

**015 and 020 executed in a later session still, both exactly as
planned** — re-verified against current file content before editing, no
drift from either plan's own citations.

- **015 executed exactly as planned** — `StartOverCard` gained its own
  `imgOpacity`/`displayedLookType`/`isFirstRender` state and `useEffect`,
  copied from `CardBehind`'s already-proven interruptible-crossfade
  pattern minus the duck/rotate part; the `<img key={lookType}>` +
  `check-ring-in` swap replaced with a `<motion.img>` reading
  `displayedLookType`/`opacity: imgOpacity`. Verified live: a single
  filter tap still crossfades normally; Day → Night → Glam fired as fast
  as three sequential clicks land settles cleanly on Glam's texture with
  no flash, stutter, or reversion to an intermediate color — the actual
  regression this plan targets. No console/dev-server errors.
- **020 executed exactly as planned** — `transition-opacity duration-200`
  removed from the scroll-shadow `div`'s `className`, replaced with
  `transition: 'opacity var(--duration-base) var(--ease-out-quart)'`
  inline. Verified live: confirmed the live DOM node's `style` attribute
  carries exactly that token-based transition string (no Tailwind
  `transition-*`/`duration-*` classes left), and drove the scroll
  container's `scrollTop` directly (this environment's synthetic scroll
  gesture doesn't reliably reach a real touch/wheel scroll) to confirm the
  shadow's opacity actually flips 0↔1 in both directions through that
  same transition.

**019 executed in a later session still, closing out this entire
audit's queue** — re-verified against current file content before
editing, no drift from the plan's own citations. The outer clipping div
(`overflow-hidden`, `rounded-[--radius-filter-chip]`, `key={flashCount}`)
kept exactly as before; a new inner div added carrying `width: '300%'`
plus everything that used to be animated/blended on the single div
(`backgroundImage`, `mixBlendMode`, resting `opacity: 0`, the animation).
`chip-flash-sweep`'s keyframe now animates `transform: translateX(...)`
(`-66.6667%` → `0%`) instead of `background-position`. Verified live: the
compiled keyframe rule shows the exact target `transform` values; the
live element's `getAnimations()` confirms a real running `CSSAnimation`
(not a static style) whose computed `transform` interpolates smoothly
from `matrix(1, 0, 0, 1, -237.34, 0)` at 0% down to identity at 100% —
`-237.34px` is `-66.6667%` of the element's actual rendered 300%-width
(~356px), matching the plan's own math exactly; scrubbing `currentTime`
through the full range confirmed a clean linear interpolation with no
jumps, and the element correctly reverts to its resting `opacity: 0`/no
transform once the animation ends (default fill mode, matching the old
behavior). No console/dev-server errors, `tsc --noEmit` clean.

Every other LOW cohesion/polish item the same audit surfaced but didn't
rise to its own numbered finding (`EyeIllustration.tsx`'s 25ms stagger vs.
the 30-80ms band, `HomeScreen.tsx`'s chip-selection transition including
paint properties, `tokens.css`'s stale "no bounce" doc comment) was not
turned into a plan — noted in the original audit conversation as thin
enough to fold into other work rather than justify its own plan.

**022-024 all executed in the same session they were written, directly in
the working tree** (same reasoning as every other batch above — the repo
had uncommitted changes at execution time, and a fresh git-worktree
checkout would have missed them). All three re-verified against current
file content immediately before editing; no drift found from the commit
`9f1aa24` citations.

- **022 executed exactly as planned** — `LINK_ROW_CLASS` gained
  `cursor-pointer active:scale-[0.97]`, a new `LINK_ROW_STYLE` constant
  added (`transform var(--duration-instant) var(--ease-out-quart)`), both
  the Portfolio `<a>` and the Email `<button>` gained `style={LINK_ROW_STYLE}`.
  Verified: `getComputedStyle` on both elements shows the exact expected
  `transition: transform 0.15s cubic-bezier(0.25, 1, 0.5, 1)` and
  `cursor: pointer`; the live compiled stylesheet contains the expected
  `.active\:scale-\[0\.97\]:active` rule with `--tw-scale-x/-y: 0.97`. A true
  held `:active` state can't be forced through this environment's synthetic
  clicks (same limitation as 009/018's own notes above), so verification
  relied on confirming the rule's presence and the elements' computed
  transition rather than a live press.
- **023 executed, but with a real correction found during execution** — the
  plan's own Boundaries flagged a risk ("if the shared `transition` object
  actually produces a delayed exit... fix it") and told the executor to
  check for it, which is exactly what happened: applying the plan exactly
  as written (`delay: reduceMotion ? 0 : 0.06` in the card's single
  top-level `transition` prop) was checked live via
  `element.getAnimations()[].effect.getComputedTiming()` immediately after
  clicking the close button, and it **did** carry the 60ms delay into the
  exit (`cardDelay: [60, 60]` vs the backdrop's `overlayDelay: [0]`) — the
  card would have visibly lingered ~60ms after the backdrop had already
  faded on every close. Fixed per the plan's own prescribed remedy: the
  `transition` is now embedded per-target instead of shared — inside
  `animate` (with the 60ms entrance delay) and separately inside `exit`
  (with an explicit `delay: 0`) — rather than one top-level prop applied to
  both. Re-verified live after the fix: entrance still shows
  `overlayAnims: [0]` / `cardAnims: [60, 60]`; a fresh open-then-close now
  shows `cardAnims: []` at the delay-check point because (confirmed
  separately via direct `getComputedStyle` polling across the open→close
  sequence) the exit now starts and completes in sync with the backdrop,
  with `cardOpacityBefore: "1"` immediately before the close click —
  i.e. no lingering. This is a good example of why this skill's plans carry
  a feel-check step and an explicit "if this happens, here's the fix"
  contingency instead of assuming the mechanically-obvious version of a
  fix is automatically correct.
- **024 executed exactly as planned** — `--ease-in-out` added to
  `tokens.css` immediately after `--ease-out-quart`; `EASE_IN_OUT` added
  locally in `InfoOverlay.tsx`; `CopyEmailButton` gained its own
  `useReducedMotion()` call, a `shakeOnFailure` constant, and the
  conditional `animate`/`transition` shake on the label. Verified live by
  temporarily forcing both copy paths to fail (`navigator.clipboard =
  undefined`, `document.execCommand` stubbed to return `false`) and reading
  the mounted label's real `getAnimations()` output: a 6-keyframe
  `translateX` oscillation (`0 → -4 → 4 → -3 → 3 → 0`, 300ms) confirmed
  running alongside the 200ms opacity fade, only on the `'failed'` label.
  Reduced motion was verified using this repo's own established workaround
  for `useReducedMotion()`'s environment limitation (`window.matchMedia`
  overrides from outside don't propagate — see 011's note above): a
  temporary `|| true` forced directly on the hook's return value,
  confirmed the label still swaps to "Couldn't copy" with only the plain
  200ms fade and no shake, then reverted (confirmed gone via `grep -n
  "TEMP TEST" src/components/InfoOverlay.tsx`, zero matches, and a clean
  `tsc -b`). Also confirmed the "Copied!" success state is pixel-for-pixel
  unaffected — same plain fade, no shake, no keyframes.

Mechanical check across all three: `npx tsc -b` clean throughout, including
the final pass after all three plans and the 023 correction. No new
console/dev-server errors during editing or the live verification passes
above (the only console errors present in this session's history are
stale, timestamped to mid-edit HMR states from *before* this batch of
plans existed).

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
5. **008 and 011 both touch `TutorialCard.tsx`, but in non-overlapping
   regions** — 008 edits lines ~1392-1410 and ~1529-1538 (inside a single
   tutorial card's own component body); 011 edits lines ~2051-2136 (inside
   `TutorialStack`'s reduced-motion branch, a different function
   entirely). Safe to run in either order or execute both before merging,
   but if using isolated-worktree executors for each, merge/rebase
   carefully since they share a file — don't run them as two completely
   parallel, blind auto-merges. **009 and 010 touch entirely separate
   files** (`ScreenHeader.tsx`+`index.css`, and `StepScreen.tsx`
   respectively) and have no dependency on 008, 011, or each other — any
   order, including fully parallel.
6. **012-021: all ten done.** 012/016/017/021 touched `StepScreen.tsx`,
   executed sequentially in one session; 013/014/018 executed in a later
   session (013 alone in `index.css`, 014 alone in `TutorialFlow.tsx`, 018
   in `TutorialCard.tsx`); 015/020 in a session after that (015 in
   `TutorialCard.tsx`'s `StartOverCard`, 020 alone in `AllStepsView.tsx`);
   019 in a session after that (`index.css`'s `chip-flash-sweep` keyframe
   + `HomeScreen.tsx`). No merge conflicts across any of them — every
   shared-file pair (008/011, 012/016/017/021, 013/019 both touching
   `index.css`, 015/018 both touching `TutorialCard.tsx`) landed in
   non-overlapping regions, sequentially, exactly per this section's own
   guidance. Nothing left open from this queue.
7. **022-024, all done, all touch `src/components/InfoOverlay.tsx`
   but in non-overlapping regions**: 022 touches `LINK_ROW_CLASS`
   (~line 109) plus the two link elements' opening tags (~lines 202, 338);
   023 touches only the card `motion.div`'s `transition` prop (~line 306);
   024 touches the top-of-file constants (~line 3) plus `CopyEmailButton`'s
   body (~lines 186-227) and adds one line to `src/styles/tokens.css`. 022
   and 024 both edit code inside/around `CopyEmailButton` (022 adds a
   `style` prop to its `<button>` opening tag, 024 rewrites its
   `motion.span`) — safe to run in either order since they touch different
   lines within the same function, but if executing both, re-verify each
   plan's own "current code" citations against whichever one landed first
   rather than trusting the original line numbers, per each plan's own
   Boundaries. 023 is fully independent of both — different element,
   different prop, safe fully parallel with either.
8. **025 and 026 are both new, both TODO, and fully independent of each
   other and of everything else in this queue** — 025 touches only
   `Toast.tsx` (a one-line duration value); 026 touches `index.css` (one
   new keyframe) and `TutorialCard.tsx`'s `ProductsPreview` (a different
   function from every other `TutorialCard.tsx` plan above — 015/018
   touch `StartOverCard`/the card-family `className`s, not
   `ProductsPreview`). Any order, including fully parallel.

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
