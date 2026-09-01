# 027 — Migrate ink tokens from alpha-derived grays to flat Figma swatches

- **Status**: DONE
- **Severity**: HIGH (blast radius) / confidence HIGH (evidence)
- **Category**: Cohesion & tokens (design-source sync)
- **Estimated scope**: 1 file for the token edits (`src/styles/tokens.css`,
  two token values) — cascades automatically to every consumer via
  `var(--color-tutorial-card-text)` / `var(--color-text-primary)` /
  `var(--color-info-overlay-heading)`, no per-component edits needed.
- **Source**: Figma file `6Mr7K0RONTS8SltZRJtqYj` ("Tech-Experimentation"),
  section "New" (node `906:12628`) — a newer iteration than whatever the
  current tokens were pulled from.

## Problem

`tokens.css` has two ink tokens built by hand-deriving alpha values on top
of one base near-black (`#2c2926`):

```css
/* tokens.css:212 — current */
--color-tutorial-card-text: #2c2926; /* V4: also reused as the home header/title/filter-chip ink color... */
```

```css
/* tokens.css:274 — current */
--color-info-overlay-heading: rgba(44, 41, 38, 0.5); /* "About" header label */
```

The current Figma file no longer has these as ad-hoc alpha values — it has
real named variables now: `BeNoApp/Chips Text Accessible/2: #21201F` (flat,
not alpha) and `BeNoApp/Chips Text Accessible/1: #656462` (also flat).
These are consistently the colors actually painted:

- **`#21201f`** (replacing `#2c2926`): Step 7's title/description/product
  names/Finish-button background/checked-ring (node `896:9714`), All Steps'
  group titles/product names/checked-ring (`896:9824`), My Products' product
  names (`896:10192`), Account's row labels (`896:10373`), and — decisively
  — **BigCard's own flipped-face tutorial title** in the newest
  `Home/DaySelected` duplicate (`906:12631`, node `906:12799`). That last
  one settles it: an earlier, staler pull of the same screen (`896:9994`,
  "Home/About") still showed `#2c2926` on that exact title, so this isn't a
  deliberate "Home screen keeps the old ink" split — it's a straight global
  migration that just hadn't finished propagating to every duplicate frame
  yet.
- **`#656462`** (replacing `rgba(44,41,38,0.5)`): the same "About" header
  label pattern reused verbatim by Account/My Products/Bookmarks (node
  `896:10373`/`896:10192`), and also the "Beauty Notes" home title in its
  newest form (see plan 030 — that title's *color* stays on
  `--color-tutorial-card-text`/`#656462`-adjacent per-screen, its
  *typography* is 030's separate concern).

**Why it matters**: this is the single highest-leverage fix in the whole
round — one token flip each, cascading correctly through the existing
`--color-text-primary: var(--color-tutorial-card-text)` alias to every
screen already built on these tokens (no hardcoded hex anywhere to hunt
down and fix individually — confirmed via `grep -rn "#2c2926"` returning no
component hits, only the token definitions themselves).

## Target

```css
/* tokens.css:212 — target */
--color-tutorial-card-text: #21201f; /* V6 (was #2c2926) — Figma's "New"
  section (node 906:12628) replaced the alpha-derived ink family with real
  named variables ("BeNoApp/Chips Text Accessible/2"); confirmed as a
  global migration, not a Home-screen-specific split, via the newest
  Home/DaySelected duplicate (906:12631) showing BigCard's own title moved
  off #2c2926 too — see plans/027-ink-color-flat-migration.md. */
```

```css
/* tokens.css:274 — target */
--color-info-overlay-heading: #656462; /* V6 (was rgba(44,41,38,0.5)) —
  same migration as --color-tutorial-card-text above; "BeNoApp/Chips Text
  Accessible/1" in Figma's current file. Now a flat token, not an alpha
  derivation of #2c2926/#21201f — do not compute this from the other ink
  token. */
```

No other line in `tokens.css` changes. Every consumer listed below picks
up the new value automatically through the existing `var(...)` — do not
touch these files directly:

- `--color-tutorial-card-text` direct/aliased consumers: `AccountScreen.tsx`,
  `BookmarksScreen.tsx`, `InfoOverlay.tsx`, `HomeScreen.tsx`,
  `MyProductsScreen.tsx`, `ProductDetailOverlay.tsx`, `Toast.tsx`,
  `TutorialCard.tsx`, `icons.tsx` (every icon stroke/fill that reads this
  token), `ActionButton.tsx`/`AllStepsView.tsx`/`StepScreen.tsx`/
  `ProductCard.tsx` (via `--color-text-primary`), and
  `--check-stroke-checked` (tokens.css:237, itself `var(--color-tutorial-card-text)`).
- `--color-info-overlay-heading` consumers: `AccountScreen.tsx`,
  `MyProductsScreen.tsx`, `BookmarksScreen.tsx`, `InfoOverlay.tsx` (all four
  share the exact same `text-[20px] tracking-[-0.4px]` title pattern this
  token colors).

## Repo conventions to follow

- Tokens are versioned in place with a comment explaining what changed and
  why (see every `V2`/`V4`/`V5` note already in this file) — this is a
  `V6` update, same convention, not a new token name.
- `--color-text-primary` already exists purely as an alias
  (`tokens.css:36`) precisely so a change like this only needs one real
  edit — do not also touch `--color-text-primary`'s own line.
- Per this file's own "one token per meaning" pattern (see
  `--shadow-card`/`--shadow-tutorial-card`), `--color-info-overlay-heading`
  stays its own token even though it's now the same literal value family as
  `--color-tutorial-card-text` was — don't collapse them into one token,
  they mean different things (a muted nav-header label vs. primary body
  ink) and could diverge again later.

## Steps

1. In `src/styles/tokens.css`, change line 212's hex value and comment as
   shown in **Target**.
2. Change line 274's value and comment the same way.
3. Run `npx tsc -b` (no type errors expected — this is a CSS-only change).
4. Do not edit any `.tsx` file for this plan.

## Boundaries

- Do NOT touch `--color-look-card-text` (tokens.css:158, already marked
  deprecated) — it's dead, leave it alone.
- Do NOT touch `--color-text-caption`, `--color-text-subtle`,
  `--color-text-product`, `--color-badge-bg`, `--color-badge-bg-list`,
  `--color-border-hairline`, or any other `rgba(44, 41, 38, ...)`/
  `rgba(0,0,0,...)` token not named above — this pass only confirmed the
  two tokens above; the others weren't part of this pull and may or may
  not have their own equivalent migration (don't guess/batch them in).
- Do NOT touch BookmarksScreen.tsx's own product-thumbnail
  `--color-border-hairline`/`--color-image-placeholder` usage — unrelated
  tokens, not part of this finding.
- If any current consumer file has since drifted from what's cited above
  (i.e. no longer reads these two tokens the way `grep` showed), STOP and
  report instead of improvising.

## Verification

- **Mechanical**: `npx tsc -b` — expect no errors.
  `grep -n "color-tutorial-card-text:\|color-info-overlay-heading:" src/styles/tokens.css`
  — expect `#21201f` and `#656462` respectively.
- **Visual, per screen** (open the app, compare against the Figma frames
  cited above or your own recollection of the current app): HomeScreen's
  title/filter-chip labels, StepScreen's title/description/Finish button,
  AllStepsView's group titles, MyProductsScreen's product names,
  AccountScreen/BookmarksScreen/InfoOverlay's header titles and row labels
  all read a hair darker/cooler than before — a subtle shift, not a
  dramatic one (`#2c2926` → `#21201f` is a small delta). Nothing should
  look broken or unreadable; this is a tone correction, not a redesign.
- **Done when**: `tokens.css` has no `#2c2926` or `rgba(44,41,38,0.5)`
  literal left on these two specific tokens, and the app's ink color reads
  consistent with the newest Figma pulls across every screen touched.
