# 029 — Give sheet/list containers their own elevated shadow token

- **Status**: DONE
- **Severity**: MEDIUM
- **Category**: Cohesion & tokens (design-source sync)
- **Estimated scope**: 5 files — `src/styles/tokens.css` (one new token),
  `StepScreen.tsx`, `AllStepsView.tsx`, `MyProductsScreen.tsx`,
  `AccountScreen.tsx` (one `boxShadow`/class change each; Account also
  gains a shadow it doesn't currently have at all).
- **Source**: Figma file `6Mr7K0RONTS8SltZRJtqYj`, section "New" (node
  `906:12628`).

## Problem

Four screens' own white "sheet" container — the card that holds the
product checklist or the account options list — currently renders
`--shadow-card` (`0px 0px 8px 2px rgba(14, 11, 6, 0.03)`,
tokens.css:106):

```tsx
/* StepScreen.tsx:784 — current */
style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-card)', transformOrigin: 'bottom center' }}
```

```tsx
/* AllStepsView.tsx:294-298 — current */
style={{
  background: 'var(--color-surface)',
  boxShadow: 'var(--shadow-card)',
  animation: 'view-fade-in var(--duration-layout) var(--ease-out-quart)',
}}
```

```tsx
/* MyProductsScreen.tsx:187 — current */
className="mt-4 flex w-full flex-col gap-10 rounded-[--radius-card] bg-[--color-surface] px-[--space-sm] pb-10 pt-[--space-sm] shadow-[--shadow-card]"
```

```tsx
/* AccountScreen.tsx:131 — current */
className="mt-6 flex w-full flex-col items-stretch rounded-[--radius-account-card] bg-white px-[--space-sm] py-[--space-2xs]"
```

Note Account's container has **no shadow class at all today** — a real
gap, not a value to bump.

The current Figma file shows a second, larger effect style
(`BeautyNotes/Shadow_2`: `0px 0px 24px 6px rgba(14, 11, 6, 0.03)`) on this
exact "Container" element in all four screens: Step 7 (`896:9740`), All
Steps (`896:9838`), My Products (`896:10202`), and Account
(`896:10380`) — same color as `--shadow-card`, just a bigger
blur/spread. Meanwhile `TutorialCard.tsx`'s BigCard shadow is confirmed
**unchanged** — still the original `Shadow_1` value (matches
`--shadow-tutorial-card` exactly) in the Home/About pull (`896:9998`).

**Why it matters**: this isn't a global shadow bump — it's specific to the
"sheet/list container" pattern across these 4 screens, distinct from the
tutorial stack card's own shadow, which stays as-is.

## Target

Add a new token to `src/styles/tokens.css`, immediately after
`--shadow-card` (current line 106):

```css
/* tokens.css — target, inserted after --shadow-card */
--shadow-card: 0px 0px 8px 2px rgba(14, 11, 6, 0.03); /* unchanged — see its own existing comment */
--shadow-card-elevated: 0px 0px 24px 6px rgba(14, 11, 6, 0.03); /* V6 —
  Figma's "New" section (node 906:12628), "BeautyNotes/Shadow_2". Same
  color as --shadow-card, bigger blur/spread. Confirmed on the "Container"
  element of Step 7, All Steps, My Products, and Account's own options
  card (896:9740/896:9838/896:10202/896:10380) — scoped to this
  sheet/list-container pattern only. --shadow-tutorial-card is unaffected;
  BigCard's own shadow is confirmed still the smaller Shadow_1 value. */
```

Repoint the four containers:

```tsx
/* StepScreen.tsx:784 — target */
style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-card-elevated)', transformOrigin: 'bottom center' }}
```

```tsx
/* AllStepsView.tsx:294-298 — target */
style={{
  background: 'var(--color-surface)',
  boxShadow: 'var(--shadow-card-elevated)',
  animation: 'view-fade-in var(--duration-layout) var(--ease-out-quart)',
}}
```

```tsx
/* MyProductsScreen.tsx:187 — target (as executed — see Execution note below) */
className="mt-4 flex w-full flex-col gap-10 rounded-[--radius-card] bg-[--color-surface] px-[--space-sm] pb-10 pt-[--space-sm]"
style={{ boxShadow: 'var(--shadow-card-elevated)' }}
```

```tsx
/* AccountScreen.tsx:131 — target (as executed — see Execution note below) */
className="mt-6 flex w-full flex-col items-stretch rounded-[--radius-account-card] bg-white px-[--space-sm] py-[--space-2xs]"
style={{ boxShadow: 'var(--shadow-card-elevated)' }}
```

**Execution note (found during live verification, not known when this plan
was written)**: the originally-planned `shadow-[--shadow-card-elevated]`
Tailwind arbitrary-value class does NOT work — Tailwind's arbitrary-value
type inference treats a bare custom-property inside `shadow-[...]` as a
*shadow color* (`--tw-shadow-color`), not the whole `box-shadow` value,
and since no `shadow-{size}` utility is also applied, `box-shadow` itself
never gets set (computed style: `none`). Confirmed live: MyProductsScreen's
card had already been shipping with **zero shadow, silently, since before
this plan** (it used the identical `shadow-[--shadow-card]` pattern
pre-existing in the codebase — a latent bug unrelated to this plan, just
surfaced by finally checking its computed value). Fixed by moving both
containers to inline `style={{ boxShadow: 'var(...)' }}`, matching
`StepScreen.tsx`/`AllStepsView.tsx`'s own already-correct pattern.
`BookmarksScreen.tsx:321` has the exact same broken
`shadow-[--shadow-card]` class and was NOT touched (out of scope per this
plan's own Boundaries) — flagged to the user as a separate, pre-existing
bug rather than silently fixed.

## Repo conventions to follow

- One token per meaning, even at a value that happens to share its color
  with another token — this file's own established pattern (see
  `--shadow-card` vs. `--shadow-tutorial-card`, already identical color,
  kept separate). `--shadow-card-elevated` follows the same rule; don't
  reuse `--shadow-card`'s name for a different value.
- Account's container previously had no shadow — adding one here is a
  real (if subtle) visual change for that screen specifically, not just a
  value bump like the other three; call this out if it reads as
  more noticeable than expected during the feel-check.

## Steps

1. Add `--shadow-card-elevated` to `tokens.css` immediately after
   `--shadow-card`, exactly as shown in **Target**.
2. Update `StepScreen.tsx:784`'s `boxShadow` value.
3. Update `AllStepsView.tsx:296`'s `boxShadow` value.
4. Update `MyProductsScreen.tsx:187`'s `shadow-[...]` class.
5. Update `AccountScreen.tsx:131`'s className to add `shadow-[--shadow-card-elevated]`.
6. Run `npx tsc -b`.

## Boundaries

- Do NOT touch `--shadow-tutorial-card` or any of `TutorialCard.tsx`'s own
  `boxShadow` usages (lines 419/868/973/1018) — confirmed unchanged this
  pass.
- Do NOT touch `BookmarksScreen.tsx`'s own `shadow-[--shadow-card]`
  container (line 321) — Bookmarks wasn't one of the screens pulled in
  this Figma section, so this finding isn't confirmed there. Leave it on
  `--shadow-card` until a future pass actually pulls that screen.
- Do NOT change `--shadow-card`'s own value — it stays as the smaller
  shadow for whatever else already correctly uses it.
- If any of the four current lines cited above no longer match the file
  (drift since this plan was written), STOP and report.

## Verification

- **Mechanical**: `npx tsc -b` — expect no errors.
  `grep -n "shadow-card-elevated" src/styles/tokens.css src/components/StepScreen.tsx src/components/AllStepsView.tsx src/components/MyProductsScreen.tsx src/components/AccountScreen.tsx` — expect the token definition plus 4 usages.
- **Visual**: StepScreen's bottom product sheet, AllStepsView's card,
  MyProductsScreen's card, and AccountScreen's options card should all
  read with a softer, wider-spread shadow than before — more "lifted off
  the page." Account's card goes from flat to lightly elevated, the most
  noticeable of the four; confirm it doesn't look out of place next to the
  others once compared side by side.
- **Done when**: all four containers use `--shadow-card-elevated`, and
  `TutorialCard.tsx`'s own shadow is confirmed pixel-for-pixel unchanged.
