# 028 — Correct --gradient-bg-home's drifted hex/stop values

- **Status**: DONE
- **Severity**: MEDIUM
- **Category**: Cohesion & tokens (design-source sync)
- **Estimated scope**: 1 file, 1 token value (`src/styles/tokens.css`,
  `--gradient-bg-home`) — cascades to every consumer via `var(...)`.
  `--gradient-bg-list`'s color stops also update; its fixed-px stop is
  explicitly OUT of scope (see Boundaries).
- **Source**: Figma file `6Mr7K0RONTS8SltZRJtqYj`, section "New" (node
  `906:12628`).

## Problem

```css
/* tokens.css:180 — current */
--gradient-bg-home: linear-gradient(180deg, #f7e9ca 0%, #f9f3eb 7.179%);
```

Five of the six screens pulled from the current Figma file's "New" section
show a consistently different gradient on this exact background layer:
`#faf1de 0%` → `#faf9f6 13%` — Step 7 (`896:9714`), All Steps
(`896:9824`), My Products (`896:10192`), Account (`896:10373`), and both
`Home/DaySelected` duplicates checked (`903:12159` and the newest,
`906:12631`). All five agree on the same two hex values and the same 13%
stop, which is strong evidence this is a real, intentional value change on
the shared token, not noise from one stale frame.

**Why it matters**: this token is consumed directly by `AccountScreen.tsx`,
`BookmarksScreen.tsx`, `HomeScreen.tsx`, `MyProductsScreen.tsx`, and
`StepScreen.tsx` (all confirmed via `grep -rn "gradient-bg-home"`) — one
token correction fixes the background on every one of those screens at
once.

## Target

```css
/* tokens.css:180 — target */
--gradient-bg-home: linear-gradient(180deg, #faf1de 0%, #faf9f6 13%); /* V6
  (was #f7e9ca 0%, #f9f3eb 7.179%) — Figma's "New" section (node
  906:12628); confirmed identical across 5 of 6 screens pulled in that
  section (Step 7, All Steps, My Products, Account, both Home/DaySelected
  duplicates checked). See plans/028-home-gradient-stop-correction.md. */
```

`--gradient-bg-list` (tokens.css:201) shares the same two hex values by
design (its own comment: "same two hex values as `--gradient-bg-home`
above but a fixed 53px second stop instead of a percentage"). Update its
hex values to match, but leave its `53px` stop untouched — see Boundaries.

```css
/* tokens.css:201 — target (hex only, px unchanged) */
--gradient-bg-list: linear-gradient(180deg, #faf1de 0%, #faf9f6 53px);
```

## Repo conventions to follow

- `--gradient-bg-list` was deliberately NOT folded into `--gradient-bg-home`
  even though it shares hex values — that token's own comment explains why
  (percentage vs. fixed-px, different container heights). Keep them as two
  separate tokens; only update what's shared (the hex stops), not the
  shape.
- Versioned in place with a `V6` comment, same convention as every other
  token update in this file.

## Steps

1. In `src/styles/tokens.css`, update `--gradient-bg-home` (line 180) to
   the target value and comment above.
2. Update `--gradient-bg-list`'s two hex values (line 201) to match,
   leaving `53px` exactly as-is.
3. Run `npx tsc -b` (no errors expected — CSS-only change).

## Boundaries

- Do NOT recompute or change `--gradient-bg-list`'s `53px` stop. That value
  was derived from a fresh full-height pull of AllStepsView's actual
  scrollable content (2065px tall) in a prior pass — this round only
  pulled AllStepsView's single-viewport frame (`896:9824`, 702px tall,
  same height as every other screen checked), which cannot be used to
  re-derive the fixed-px equivalent without guessing. Per this project's
  own rule (don't hand-author a stand-in when the real asset isn't
  reachable), leave the px value as a flagged gap rather than scaling it
  proportionally — a fresh pull of the tall list export is needed to
  correct it for real, and that's a separate task if the percentage ratio
  itself changed.
- Do NOT touch `--gradient-bg-screen` (tokens.css:70, already deprecated
  with zero remaining consumers per its own comment) — leave it alone.
- If any of the five screens' background element no longer matches what's
  quoted in Problem (drift since this plan was written), STOP and report.

## Verification

- **Mechanical**: `npx tsc -b` — expect no errors. `grep -n "gradient-bg-home:\|gradient-bg-list:" src/styles/tokens.css` — expect `#faf1de 0%, #faf9f6 13%` and `#faf1de 0%, #faf9f6 53px` respectively.
- **Visual**: HomeScreen, AccountScreen, BookmarksScreen, MyProductsScreen,
  and StepScreen's background fade should look a touch warmer/lighter at
  the very top of the screen — a subtle shift, same family of cream tones,
  not a new palette.
- **Done when**: `--gradient-bg-home` matches the newest Figma pull exactly,
  and `--gradient-bg-list`'s color family is consistent with it (its own
  px-stop remains flagged, not silently guessed).
