# 030 — Move shared serif title typography from Cactus Classical Serif to EB Garamond

- **Status**: DONE
- **Severity**: MEDIUM-HIGH (visually noticeable typeface change)
- **Category**: Cohesion & tokens (design-source sync)
- **Estimated scope**: 6 files — `index.html` (font link),
  `src/styles/tokens.css` (2 token values + 2 new tokens),
  `HomeScreen.tsx`, `TutorialCard.tsx`, `AccountScreen.tsx`,
  `MyProductsScreen.tsx`, `BookmarksScreen.tsx`, `InfoOverlay.tsx` (one
  title style each).
- **Source**: Figma file `6Mr7K0RONTS8SltZRJtqYj`, section "New" (node
  `906:12628`).

## Problem

This finding grew during research beyond its original scope ("BigCard's
title font") — it turned out to be one shared title typeface used in six
places, not one.

**Home screen's own title** currently renders at 32px in Cactus Classical
Serif:

```tsx
/* HomeScreen.tsx:355-361 — current */
<p
  className="capitalize"
  style={{
    fontFamily: 'var(--font-family-serif-card)',
    fontSize: 'var(--font-size-home-title)',
    letterSpacing: 'var(--letter-spacing-home-title)',
    color: 'var(--color-tutorial-card-text)',
  }}
>
  Beauty Notes
</p>
```

Both `Home/DaySelected` pulls checked (`903:12159` and the newest,
`906:12631`) show this exact title at `font-['EB_Garamond:Regular']
text-[24px] tracking-[-0.24px]` instead — a different family entirely, not
a Cactus variant, and a smaller size (24px, not 32px).

**BigCard's own flipped-face title** currently renders in the same Cactus
family, no explicit letter-spacing:

```tsx
/* TutorialCard.tsx:433-439 — current */
<p
  style={{
    fontFamily: 'var(--font-family-serif-card)',
    fontSize: '24px',
    color: 'var(--color-tutorial-card-text)',
  }}
>
  {tutorial.title}
</p>
```

The newest pull (`906:12631`, node `906:12799`) shows this same title now
in `font-['EB_Garamond:Regular'] text-[24px] tracking-[-0.24px]` — same
family switch, same 24px size it already has, but now with `-0.24px`
tracking it doesn't currently set.

**Account/My Products/Bookmarks/About's shared header title** — all four
currently share one plain sans-serif pattern with no font-family override
(inherits `--font-family`, Inter):

```tsx
/* AccountScreen.tsx:113-116, MyProductsScreen.tsx:152-155,
   BookmarksScreen.tsx:294-297, InfoOverlay.tsx:339-342 — current
   (identical at all four call sites) */
<p
  className="text-[20px] tracking-[-0.4px]"
  style={{ color: 'var(--color-info-overlay-heading)', fontWeight: 'var(--font-weight-medium)' }}
>
  {/* "Account" / "My Products" / "Bookmarks" / "About" */}
</p>
```

The Figma pulls for Account (`896:10373`) and My Products (`896:10192`)
show these same titles at `font-['EB_Garamond:Regular'] text-[24px]
tracking-[-0.24px]` — the exact same family/size/tracking the two findings
above converge on. (Bookmarks/About weren't independently re-pulled this
round beyond the About screen itself, which is stale per plan 027's own
finding — but given all three other sibling screens agree, treat this as
the same pattern rather than pulling a fourth confirmation.)

**Why it matters**: all three of these are the exact same typographic
treatment (EB Garamond, 24px, -0.24px tracking) — this reads as one
deliberate title-style consolidation across the whole app, not three
unrelated tweaks. Note this plan is typography only; each context keeps
its own existing *color* token (`--color-tutorial-card-text` for
Home/BigCard, `--color-info-overlay-heading` for the four overlay
screens) — color is plan 027's concern, not this one.

## Target

**Font loading** — `index.html` currently loads only Cactus Classical
Serif:

```html
<!-- index.html:15 — current -->
<link href="https://fonts.googleapis.com/css2?family=Cactus+Classical+Serif&display=swap" rel="stylesheet" />
```

Add EB Garamond alongside it (same request, comma-separated family, no
extra `<link>` needed):

```html
<!-- index.html:15 — target -->
<link href="https://fonts.googleapis.com/css2?family=Cactus+Classical+Serif&family=EB+Garamond&display=swap" rel="stylesheet" />
```

Cactus Classical Serif's own `<link>`/comment stays — see Boundaries for
why it isn't being removed yet.

**Tokens** — repoint `--font-family-serif-card` in place (this file's own
established convention: V4 already did this once, retargeting the same
token name from Goudy Bookletter to Cactus Classical Serif when the design
changed):

```css
/* tokens.css:211 — target */
--font-family-serif-card: 'EB Garamond', Georgia, 'Times New Roman', serif; /* V6
  (was 'Cactus Classical Serif' — see --font-family-serif-card's own git
  history) — Figma's "New" section (node 906:12628) moved every serif
  title in the app onto EB Garamond: Home screen's own title, BigCard's
  flipped-face title, and Account/My Products/Bookmarks/About's shared
  header title all confirmed on this exact family. See
  plans/030-serif-title-eb-garamond.md. */
```

Add two new tokens, deprecating the two `--font-size-home-title`/
`--letter-spacing-home-title` values in place (still used only by
HomeScreen, but now sharing the same numbers every other title in this
plan converges on — worth a shared name since a future 4th consumer
shouldn't have to guess which token to reach for):

```css
/* tokens.css:154-155 — target */
--font-size-home-title: 24px; /* V6 (was 32px) — see --font-size-title-serif below; kept as its own token since HomeScreen is still its only direct consumer, but now the same number */
--letter-spacing-home-title: -0.24px; /* V6 (was -0.64px) */
```

```css
/* tokens.css — target, new tokens, added near --font-size-home-title */
--font-size-title-serif: 24px; /* V6 — shared serif-title size: BigCard's
  own title (TutorialCard.tsx) and Account/My Products/Bookmarks/About's
  header title. Same number as --font-size-home-title above by design
  (same Figma title style, "BeautyNotes/H2-titleLook") — kept as a
  separate token since those are semantically different elements
  (app title vs. card title vs. nav-header label), matching this file's
  own one-token-per-meaning convention. */
--letter-spacing-title-serif: -0.24px; /* V6, pairs with --font-size-title-serif above */
```

Update the five non-Home call sites:

```tsx
/* TutorialCard.tsx:433-439 — target */
<p
  style={{
    fontFamily: 'var(--font-family-serif-card)',
    fontSize: 'var(--font-size-title-serif)',
    letterSpacing: 'var(--letter-spacing-title-serif)',
    color: 'var(--color-tutorial-card-text)',
  }}
>
  {tutorial.title}
</p>
```

```tsx
/* AccountScreen.tsx / MyProductsScreen.tsx / BookmarksScreen.tsx /
   InfoOverlay.tsx — target, all four identical */
<p
  style={{
    fontFamily: 'var(--font-family-serif-card)',
    fontSize: 'var(--font-size-title-serif)',
    letterSpacing: 'var(--letter-spacing-title-serif)',
    color: 'var(--color-info-overlay-heading)',
    fontWeight: 'var(--font-weight-medium)',
  }}
>
  {/* title text unchanged */}
</p>
```

(Drop the `text-[20px] tracking-[-0.4px]` Tailwind classes at those four
call sites — replaced by the two new inline style properties above.)

## Repo conventions to follow

- Retarget an existing token's *value* in place when the design intent
  changes (V4's Goudy→Cactus precedent) rather than adding a
  parallel-but-different token name for the same slot.
- One token per meaning even at identical values — `--font-size-home-title`
  and `--font-size-title-serif` end up numerically equal but stay separate
  tokens, matching `--shadow-card`/`--shadow-tutorial-card`'s own
  precedent elsewhere in this file.
- Font loading: this app already loads a display serif via Google Fonts
  `<link>` (not `@font-face`) — follow that same pattern for EB Garamond
  rather than introducing a different loading mechanism.

## Steps

1. In `index.html`, add `family=EB+Garamond` to the existing Google Fonts
   `<link>` (line 15).
2. In `tokens.css`, retarget `--font-family-serif-card` (line 211) to EB
   Garamond with the comment shown.
3. Update `--font-size-home-title`/`--letter-spacing-home-title` (lines
   154-155) to `24px`/`-0.24px`.
4. Add `--font-size-title-serif`/`--letter-spacing-title-serif` near them.
5. Update `TutorialCard.tsx`'s title style block (lines 433-439) to add
   the two new properties.
6. Update the four overlay screens' title `<p>` (AccountScreen.tsx,
   MyProductsScreen.tsx, BookmarksScreen.tsx, InfoOverlay.tsx) — move off
   the Tailwind `text-[20px] tracking-[-0.4px]` classes onto the inline
   style shown in Target, at all four call sites.
7. Run `npx tsc -b`.

## Boundaries

- Do NOT remove Cactus Classical Serif's own `<link>`/import from
  `index.html` yet — confirm nothing else in the app still renders in it
  before deleting the font load entirely (a quick
  `grep -rn "Cactus" src/` after this plan lands should come back empty if
  it's truly unused; if so, that's a small separate cleanup, not part of
  this plan).
- Do NOT change any *color* on these six title elements — color stays on
  whatever token each already uses (`--color-tutorial-card-text` or
  `--color-info-overlay-heading`); that's plan 027's job, not this one.
- Do NOT touch `--font-family-serif` (tokens.css:153, already marked
  deprecated/Goudy) — unrelated, already dead.
- Do NOT apply `--font-size-title-serif`/`--letter-spacing-title-serif` to
  any element other than the five named above (BigCard title + 4 overlay
  headers) — this plan doesn't scope a broader "use this everywhere serif
  text appears" change.
- If any of the six current call sites no longer match what's quoted
  above (drift since this plan was written), STOP and report.

## Verification

- **Mechanical**: `npx tsc -b` — expect no errors.
  `grep -n "font-family-serif-card:" src/styles/tokens.css` — expect
  `'EB Garamond'`. `grep -rn "font-size-title-serif\|letter-spacing-title-serif" src/components/*.tsx` — expect 5 usages (TutorialCard + 4 overlay screens).
- **Visual**: confirm EB Garamond actually loads (check the Network tab
  for the Google Fonts request, or `document.fonts.check("16px 'EB Garamond'")`
  in devtools) rather than silently falling back to Georgia — a broken
  font load would be easy to miss since the fallback is also serif.
  Compare Home screen's title, a tutorial card's flipped-face title, and
  the Account/My Products/Bookmarks/About headers side by side — all six
  should read as the same typeface family now, noticeably different from
  Cactus Classical Serif's more decorative letterforms.
- **Done when**: all six titles render in EB Garamond at the sizes/tracking
  above, and nothing else in the app still depends on Cactus Classical
  Serif being loaded (confirmed via the boundary check above, even if its
  removal is deferred to a follow-up).
