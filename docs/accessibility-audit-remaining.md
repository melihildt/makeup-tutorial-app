# Accessibility audit — remaining findings

Written to carry the unfinished half of a `/accessibility-review` pass into a
fresh session. That pass (2026-09-02, against WCAG 2.1 AA) found 9 issues
across Perceivable and Operable. **The 4 Operable findings (#6-#9) are done**
— merged in [PR #19](https://github.com/melihildt/makeup-tutorial-app/pull/19),
commit `f88cf31`. **The 5 Perceivable/contrast findings below (#1-#5) are
still open** — deferred by the user's own call ("Do not fix the perceivable
for now"), to be picked up later. Verify each is still live before fixing —
this doc reflects the tokens as of `f88cf31`, and any later token-rename pass
could shift line numbers or, in principle, already fix one of these
incidentally.

## How these were found

Contrast ratios were computed directly from `tokens.css`'s literal hex/rgba
values (WCAG relative-luminance formula, not a screenshot sample), then
spot-checked live in the browser. All five are real token values, not
one-off inline styles — each fix is a `tokens.css` edit, cascading through
`var(...)` the same way every other color fix in this file's own history
has (see e.g. plans 027/032/034 in `plans/README.md`).

## #1 — Unchecked product ring, 1.4.11 Non-text Contrast

**Token**: `--check-stroke-unchecked: #cfcecc` (tokens.css)
**Against**: `--color-surface` / white backgrounds (product rows sit on
white cards in both StepScreen and AllStepsView)
**Ratio**: 1.57:1 — needs **3:1** (non-text UI component conveying state)
**Where it renders**: `CheckIndicator.tsx`'s unchecked ring — every
unchecked product row, on every step and in the All Steps list. This is the
single most-visible instance of the five: it's the primary visual state
indicator for "not checked off," present on nearly every screen of the
tutorial flow.
**Fix direction**: darken to something ≥3:1 against white, e.g. `#a8a6a4`
(≈3.0:1) or `#9c9a98` (≈3.4:1, more margin). Touches only this one token —
the checked-state ring (`--check-stroke-checked`, aliased to
`--color-tutorial-card-text`) is untouched, already passes at 16.27:1.

## #2 — Step badge text, 1.4.3 Contrast

**Tokens**: `--color-badge-text: #848281` on `--color-badge-bg: #f1efee`
**Ratio**: 3.34:1 — needs **4.5:1** (12px text, not large text)
**Where it renders**: StepScreen's own "N/7 · steps" badge, top of every
step screen.
**Fix direction**: darken `--color-badge-text` specifically, not
`--color-badge-bg` — that background token is shared with
`--color-container-border`/other elements per tokens.css's own
one-token-per-meaning convention, so it shouldn't move for this fix alone.
Something like `#5c5a58` would clear 4.5:1 against `#f1efee` while staying
in the same muted-gray family as the current value.

## #3 — List-context muted text, 1.4.3 Contrast

**Token**: `--color-text-muted-list: #848281` — same hex as #2, but this is
a separate token per file convention, on a different background.
**Against**: white (`--color-surface`)
**Ratio**: 3.82:1 — needs **4.5:1** (13px/12px, not large text)
**Where it renders**: `AllStepsView.tsx`'s per-group description sentence,
and `ProductCard.tsx`'s shade line in list context (`imageRadius="list"`).
**Fix direction**: same darkening direction as #2. Since this token and
`--color-badge-text` (#2) currently share the same hex by coincidence (not
by shared meaning — tokens.css is explicit that these are separate,
independently-sourced values), don't assume fixing one fixes both; each
needs its own contrast check against its own background once darkened.

## #4 — Toast "i" badge, 1.4.3 Contrast

**Values**: white text (`color: '#fff'`, inline in `Toast.tsx`) on
`--color-toast-accent: #e8871e`
**Ratio**: 2.65:1 — needs **4.5:1** (13px semibold doesn't clear the
large-text threshold, which needs ~18.7px bold)
**Where it renders**: the small circular "i" glyph at the start of every
toast (`Toast.tsx:95-101`). It's `aria-hidden="true"` (decorative to
screen readers, since the toast's real message is announced via
`aria-live`), but sighted low-vision users still see it — `aria-hidden`
doesn't exempt visible text from 1.4.3.
**Fix direction**: either darken `--color-toast-accent` until white clears
4.5:1 (would also change the toast's overall accent color everywhere else
it's used — check for other consumers first), or keep the accent as-is and
swap the glyph's own text color to something dark enough against it
instead — probably simpler, since this accent is described in tokens.css
as "a genuine orange... not a reuse of this file's existing gold accent,"
i.e. a deliberately-chosen color not worth perturbing for one glyph.

## #5 — Coming-soon lock icon, 1.4.11 Non-text Contrast

**Tokens**: `--color-coming-soon-icon: #848281` on
`--color-coming-soon-button-bg: #e2e0df`
**Ratio**: 2.91:1 — needs **3:1** (just under)
**Where it renders**: the lock icon inside every "Coming soon" button
(`TutorialCard.tsx`'s `ComingSoonButton`).
**Fix direction**: smallest fix in this list — a small nudge to either
value closes the ~0.1 gap. Darkening `--color-coming-soon-icon` slightly
(e.g. `#7a7876`) is the more contained change, since
`--color-coming-soon-button-bg` is also the pill's own background fill.

## Suggested order

#1 first — it's the only one flagged as affecting a primary, frequently-used
state indicator rather than secondary/muted text. #2 and #3 are the next
tier (real body/label text below 4.5:1). #4 and #5 are the smallest-impact,
smallest-fix items — reasonable to batch together at the end.

## Verification approach (matches how #6-#9 were verified)

Recompute each ratio after changing the token (Node one-liner with the
WCAG relative-luminance formula, or any contrast checker) before touching
the browser — confirms the fix clears the bar before spending a live check
on it. Then a quick live pass: `tsc --noEmit` clean, no console errors, and
a screenshot of each affected surface (step badge, an unchecked product row,
a toast, a coming-soon card) to confirm nothing else visually regressed.
