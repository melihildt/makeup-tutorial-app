# 033 — Bookmarks catches up to the shadow/radius fixes already applied to its sibling screens

- **Status**: DEFERRED — user's call: treated as tied to the stale
  "Home/About" duplicate content rather than a confirmed Bookmarks-specific
  finding, even though the shadow/radius container itself was pulled from
  the "New" section like its siblings. Not executed; revisit only if the
  user brings it up again.
- **Severity**: MEDIUM
- **Category**: Cohesion & tokens (design-source sync)
- **Estimated scope**: 1 file (`src/components/BookmarksScreen.tsx`), 2
  small edits.
- **Source**: Figma file `6Mr7K0RONTS8SltZRJtqYj`, section "New", node
  `896:10559` — a duplicate of "Home/Profile-MyProducts" retitled
  "Bookmarks", not pulled in the original 6-plan pass (027-032), which
  extrapolated Bookmarks' values by analogy rather than confirming them
  directly. This plan is that confirmation.

## Problem

Plans 029 and 031 gave Step 7/All Steps/My Products/Account their own
elevated shadow and, where applicable, a 12px product-image radius —
Bookmarks was deliberately left out of both (its own Boundaries sections
say so explicitly) because it hadn't been pulled from Figma yet. It has
now been pulled, and confirms the exact same two fixes apply here too:

```tsx
/* BookmarksScreen.tsx:139 — current */
<div className="h-[90px] w-[80px] shrink-0 overflow-hidden rounded-[--radius-image] border-[0.5px] border-[--color-border-hairline] bg-[--color-image-placeholder]">
```

Figma's own pull (node `896:10571` etc.) shows this same image at
`rounded-[12px]` — matches `--radius-image-list` (12px, added in plan 031),
not `--radius-image` (8px).

```tsx
/* BookmarksScreen.tsx:326 — current */
className="mt-4 flex w-full flex-col gap-10 rounded-[--radius-card] bg-[--color-surface] px-[--space-sm] pb-10 pt-[--space-sm] shadow-[--shadow-card]"
```

Figma's own pull (node `896:10567`, "Container") shows
`shadow-[0px_0px_24px_6px_rgba(14,11,6,0.03)]` — `--shadow-card-elevated`
(added in plan 029), not `--shadow-card`. This container also has the
exact same bug plan 029 found and fixed in `MyProductsScreen.tsx`/
`AccountScreen.tsx`: `shadow-[--shadow-card]` is a Tailwind arbitrary-value
class that Tailwind interprets as a shadow *color*
(`--tw-shadow-color`), not the whole `box-shadow` — so this container has
been rendering with **zero shadow**, silently, this whole time.

## Target

```tsx
/* BookmarksScreen.tsx:139 — target */
<div className="h-[90px] w-[80px] shrink-0 overflow-hidden rounded-[--radius-image-list] border-[0.5px] border-[--color-border-hairline] bg-[--color-image-placeholder]">
```

```tsx
/* BookmarksScreen.tsx:326 — target */
className="mt-4 flex w-full flex-col gap-10 rounded-[--radius-card] bg-[--color-surface] px-[--space-sm] pb-10 pt-[--space-sm]"
style={{ boxShadow: 'var(--shadow-card-elevated)' }}
```

(Same fix shape as plan 029's `MyProductsScreen.tsx`/`AccountScreen.tsx`
correction: move off the broken `shadow-[...]` class onto inline
`style={{ boxShadow: 'var(...)' }}`.)

## Repo conventions to follow

- Same as plans 029/031 — this is purely catching Bookmarks up to a
  pattern already established and tokenized by those plans, not
  introducing anything new.

## Steps

1. Update `BookmarksScreen.tsx:139`'s `rounded-[--radius-image]` to
   `rounded-[--radius-image-list]`.
2. Update `BookmarksScreen.tsx:326`'s container: drop the
   `shadow-[--shadow-card]` class, add
   `style={{ boxShadow: 'var(--shadow-card-elevated)' }}`.
3. Run `npx tsc -b`.

## Boundaries

- Do NOT touch anything else in `BookmarksScreen.tsx` — its title font was
  already fixed by plan 030, and this pull didn't surface any other
  drift on this screen.
- If either current line no longer matches what's quoted above, STOP and
  report.

## Verification

- **Mechanical**: `npx tsc -b` — expect no errors.
  `grep -n "radius-image-list\|shadow-card-elevated" src/components/BookmarksScreen.tsx` — expect both.
- **Visual**: open Bookmarks with at least one saved tutorial — product
  images should read with the same rounder (12px) corner as My
  Products/All Steps, and the card should show the same soft elevated
  shadow as those screens (check `getComputedStyle` if it's too subtle to
  see by eye).
- **Done when**: Bookmarks' container and product images match the same
  tokens every sibling screen already uses.
