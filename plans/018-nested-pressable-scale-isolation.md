# 018 — Stop nested pressables from compounding their ancestor's :active scale

- **Status**: TODO
- **Commit**: 677c3d7
- **Severity**: MEDIUM
- **Category**: Physicality & origin
- **Screen impact**: Home (the tutorial card stack's look/detail card faces)
- **Estimated scope**: 1 file (`src/components/TutorialCard.tsx`), 2 className edits

## Problem

`TutorialLookCard`'s root carries `active:scale-[0.97]`, and its nested
bookmark `<button>` calls `e.stopPropagation()` on its own `onClick` — but
`stopPropagation()` only stops JS event bubbling, not CSS `:active`
pseudo-class matching, which is browser-native UI state that still
applies to every ancestor of whichever element is actually being pressed,
regardless of what any click handler does:

```tsx
/* src/components/TutorialCard.tsx:389 — TutorialLookCard's root className, current */
      className={`relative flex h-full w-[338px] flex-col items-center gap-1 overflow-hidden pb-6 text-left active:scale-[0.97] ${disabled ? '' : 'cursor-pointer'}`}
```

```tsx
/* src/components/TutorialCard.tsx:434-443 — the nested bookmark button, current */
          <button
            type="button"
            disabled={disabled}
            aria-pressed={saved}
            aria-label={saved ? `Remove ${tutorial.title} from saved looks` : `Save ${tutorial.title}`}
            onClick={(e) => {
              e.stopPropagation()
              onToggleSave?.()
            }}
            className="relative shrink-0"
          >
```

Pressing the small bookmark icon also puts the entire 338px card into its
own `:active` state, scaling the whole card down 3% from a bookmark tap
alone.

The same pattern compounds worse on `TutorialDetailCard`, whose root also
carries `active:scale-[0.97]` and contains `StartTutorialButton` — which
has its *own* separate `active:scale-[0.97]`:

```tsx
/* src/components/TutorialCard.tsx:633 — TutorialDetailCard's root className, current */
      className={`relative flex h-full w-[338px] flex-col items-center gap-1 overflow-hidden border-[0.5px] border-solid pb-6 text-left active:scale-[0.97] ${disabled ? '' : 'cursor-pointer'}`}
```

```tsx
/* src/components/TutorialCard.tsx:562 — StartTutorialButton's own className, current */
      className="flex h-[52px] w-[290px] shrink-0 items-center justify-center overflow-hidden rounded-[30px] border-[0.5px] border-solid active:scale-[0.97]"
```

Pressing "Start Tutorial" — the one control this whole flip interaction
exists to surface — compounds both scales (~0.97 × 0.97 ≈ 0.94 combined),
producing a button that visibly shrinks *inside* an already-shrinking
card, instead of a single clean press cue.

**Why it matters**: this is the app's own primary CTA reading as
over-eager/double-shrinking on press, directly undercutting the "subtle"
press-feedback guidance AUDIT.md's Physicality & origin category sets
(0.95–0.98, a single clean scale — not two stacked ones).

## Target

Tailwind 3.4 (confirmed installed via `package.json`) supports the
`has-*` arbitrary-variant selector, which lets the ancestor's own
`:active` rule get overridden — with genuinely higher CSS specificity,
not just source-order luck — whenever a nested pressable is the thing
actually being pressed:

```tsx
/* src/components/TutorialCard.tsx:389 — TutorialLookCard's root className, target */
      className={`relative flex h-full w-[338px] flex-col items-center gap-1 overflow-hidden pb-6 text-left active:scale-[0.97] has-[button:active]:scale-100 ${disabled ? '' : 'cursor-pointer'}`}
```

```tsx
/* src/components/TutorialCard.tsx:633 — TutorialDetailCard's root className, target */
      className={`relative flex h-full w-[338px] flex-col items-center gap-1 overflow-hidden border-[0.5px] border-solid pb-6 text-left active:scale-[0.97] has-[button:active]:scale-100 ${disabled ? '' : 'cursor-pointer'}`}
```

`has-[button:active]:scale-100` compiles to
`.card:has(button:active) { transform: scale(1); }`, whose specificity
((0,2,1): one class for the card, `:has()` contributes the specificity of
its most specific argument, `button:active`, i.e. one type selector + one
pseudo-class) is strictly higher than `.card:active`'s own ((0,2,0)) —
so this correctly wins regardless of Tailwind's generated class order,
not by coincidence.

With this in place: pressing the bookmark leaves `TutorialLookCard`'s own
root at `scale(1)` (the bookmark itself has no press-scale of its own
today — untouched by this plan, see Boundaries); pressing "Start
Tutorial" leaves `TutorialDetailCard`'s root at `scale(1)` while the
button's *own* `active:scale-[0.97]` still applies normally — a single,
clean press cue instead of two compounding ones.

## Repo conventions to follow

- Both target `className` strings are already template literals (for the
  `disabled ? '' : 'cursor-pointer'` conditional) — add the new class
  inside the existing static portion of the string, immediately after
  `active:scale-[0.97]`, matching the order every other utility already
  appears in.
- No new CSS or JS needed — this is a Tailwind utility class addition
  only, resolved entirely by the existing build.

## Steps

1. In `src/components/TutorialCard.tsx`, on `TutorialLookCard`'s root
   `className` (current line 389), insert `has-[button:active]:scale-100`
   immediately after `active:scale-[0.97]` (before the trailing
   `${disabled ? '' : 'cursor-pointer'}`).
2. On `TutorialDetailCard`'s root `className` (current line 633), make the
   identical insertion.
3. Run `npx tsc --noEmit` (confirms no accidental syntax break in the
   template literal) — this change has no type-level effect, but the
   check catches a malformed string.

## Boundaries

- Do NOT add any press-scale of its own to the bookmark button
  (`TutorialCard.tsx:434-452`) — this plan only stops it from compounding
  with its ancestor, it doesn't add new feedback to the bookmark itself
  (that would be a separate, additive change, not part of this finding).
- Do NOT touch `StartTutorialButton`'s own `active:scale-[0.97]`
  (`TutorialCard.tsx:562`) — its own independent press feedback is
  correct and should keep working exactly as it does today; this plan
  only isolates it from its ancestor's scale, not from its own.
- Do NOT touch `StartOverCard`'s root (`TutorialCard.tsx:868`, also
  `active:scale-[0.97]`) — it has no nested `<button>` inside its own
  pressable root (the filter chips it recolors from live on `HomeScreen`,
  not inside this card), so it isn't part of this finding.
- Do NOT add `has-[button:active]:scale-100` to any element other than
  the two roots named above.
- If either target line's current content doesn't match what's quoted
  above (drift since commit 677c3d7), STOP and report instead of
  guessing at a different insertion point.

## Verification

- **Mechanical**: `npx tsc --noEmit` — expect no errors. Visual
  confirmation is the real test here (Tailwind's `has-*` variant has no
  compile-time type check of its own).
- **Feel check**: run the app, open the tutorial card stack, and:
  - Press-and-hold the bookmark icon on the front card's look face —
    confirm the *whole card* no longer visibly shrinks (only the
    bookmark's own `check-pop` animation plays on release, unchanged).
  - Tap the card elsewhere (not the bookmark) to flip to the detail face,
    then press-and-hold "Start Tutorial" — confirm only the *button*
    shrinks (its own clean `scale(0.97)`), and the card behind it stays
    at full size — no double-shrink.
  - Press-and-hold the detail card's own background (not the button) —
    confirm the card *itself* still shrinks normally on that press (this
    plan must not break the card's own legitimate press feedback, only
    the compounding case).
  - In DevTools, use the Elements panel's "force element state" → `:has`
    isn't directly forceable, so instead verify by real press/release
    (mouse or touch) rather than forced pseudo-class toggling, since
    `:has()` state depends on a *descendant's* live state, not the
    element's own.
- **Done when**: pressing a nested control (bookmark or "Start Tutorial")
  never also visibly shrinks its ancestor card, while both the nested
  control's own press feedback and the card's own direct-press feedback
  continue to work normally.
