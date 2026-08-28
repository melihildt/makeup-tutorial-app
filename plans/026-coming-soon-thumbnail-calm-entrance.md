# 026 — Give coming-soon thumbnails their own calmer entrance

- **Status**: DONE
- **Commit**: 75a7936
- **Severity**: MEDIUM
- **Category**: Purpose & frequency (signal mismatch)
- **Estimated scope**: 2 files — `src/index.css` (one new keyframe),
  `src/components/TutorialCard.tsx` (`ProductsPreview`'s `popStyle` helper
  + its three call sites)

## Problem

`ProductsPreview` (`TutorialCard.tsx:614-729`) reveals its three product
thumbnails with `product-preview-pop-in` (`index.css:247-250`) — a
"burst up and grow" entrance:

```css
/* src/index.css:247-250 — current */
@keyframes product-preview-pop-in {
  from { opacity: 0; transform: translateY(24px) scale(0.7); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
```

This exact animation plays identically whether the thumbnail is a real
product photo or a deliberately-obscured "coming soon" placeholder — the
two branches are wrapped in the same `popStyle(...)` call at all three
positions:

```tsx
/* src/components/TutorialCard.tsx:706-722 — current */
<div key={String(justRevealed)} className="flex items-center justify-center">
  <div
    className="mr-[-16px] flex h-[119px] w-[108px] shrink-0 items-center justify-center"
    style={popStyle(POP_BASE_DELAY_MS + POP_STAGGER_MS)}
  >
    {tutorial.hasContent ? thumbnail(-7, imageA) : comingSoonThumbnail(-7, placeholderImageA, tintA)}
  </div>
  <div className="mr-[-16px]" style={popStyle(POP_BASE_DELAY_MS)}>
    {tutorial.hasContent ? thumbnail(0, imageB) : comingSoonThumbnail(0, placeholderImageB, tintB)}
  </div>
  <div
    className="flex h-[119px] w-[108px] shrink-0 items-center justify-center"
    style={popStyle(POP_BASE_DELAY_MS + POP_STAGGER_MS)}
  >
    {tutorial.hasContent ? thumbnail(7, imageC) : comingSoonThumbnail(7, placeholderImageC, tintC)}
  </div>
</div>
```

```tsx
/* src/components/TutorialCard.tsx:639-642 — current */
const popStyle = (delayMs: number): CSSProperties | undefined =>
  justRevealed && !reduceMotion
    ? { animation: 'product-preview-pop-in var(--duration-base) var(--ease-out-quart) both', animationDelay: `${delayMs}ms` }
    : undefined
```

**Why it matters**: `comingSoonThumbnail`'s own doc comment
(`TutorialCard.tsx:651-661`) explains exactly what its blurred, tinted
look is meant to say: "there's a photo here, just not ready to show
yet" — deliberately withheld content, not a finished reveal. A
scale-from-0.7-and-rise "pop" is a celebratory unveiling — the right
gesture for a real photo snapping into view, the wrong one for a photo
the user is being told isn't ready. Since only one tutorial in the
current data (`Soft Smokey Eye`) has `hasContent: true`, this mismatch
plays on 11 of 12 tutorial cards — the majority-case experience, not an
edge case.

## Target

Add a second, calmer keyframe to `src/index.css`, immediately after
`product-preview-pop-in`:

```css
/* src/index.css:247-250 — current */
@keyframes product-preview-pop-in {
  from { opacity: 0; transform: translateY(24px) scale(0.7); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
```

```css
/* src/index.css — target, inserted immediately after product-preview-pop-in */
@keyframes product-preview-pop-in {
  from { opacity: 0; transform: translateY(24px) scale(0.7); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* Coming-soon thumbnails' own entrance (TutorialCard.tsx's
   ProductsPreview) — a plain fade, not product-preview-pop-in's
   scale-and-rise "burst" reveal. A blurred/tinted placeholder is
   deliberately-withheld content (see comingSoonThumbnail's own doc
   comment), not a finished photo snapping into view — the celebratory
   pop reads as the wrong gesture for it. */
@keyframes product-preview-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

Then in `src/components/TutorialCard.tsx`, let `popStyle` pick which
keyframe to play:

```tsx
/* src/components/TutorialCard.tsx:639-642 — target */
const popStyle = (delayMs: number, animationName: string): CSSProperties | undefined =>
  justRevealed && !reduceMotion
    ? { animation: `${animationName} var(--duration-base) var(--ease-out-quart) both`, animationDelay: `${delayMs}ms` }
    : undefined
// Real photos get the celebratory pop; coming-soon placeholders get a
// plain fade — see product-preview-fade-in's own comment (index.css) for
// why. Resolved once per row rather than per thumbnail: all three
// thumbnails in a given ProductsPreview are always the same branch
// (tutorial.hasContent doesn't vary within one row).
const popAnimationName = tutorial.hasContent ? 'product-preview-pop-in' : 'product-preview-fade-in'
```

```tsx
/* src/components/TutorialCard.tsx:706-722 — target */
<div key={String(justRevealed)} className="flex items-center justify-center">
  <div
    className="mr-[-16px] flex h-[119px] w-[108px] shrink-0 items-center justify-center"
    style={popStyle(POP_BASE_DELAY_MS + POP_STAGGER_MS, popAnimationName)}
  >
    {tutorial.hasContent ? thumbnail(-7, imageA) : comingSoonThumbnail(-7, placeholderImageA, tintA)}
  </div>
  <div className="mr-[-16px]" style={popStyle(POP_BASE_DELAY_MS, popAnimationName)}>
    {tutorial.hasContent ? thumbnail(0, imageB) : comingSoonThumbnail(0, placeholderImageB, tintB)}
  </div>
  <div
    className="flex h-[119px] w-[108px] shrink-0 items-center justify-center"
    style={popStyle(POP_BASE_DELAY_MS + POP_STAGGER_MS, popAnimationName)}
  >
    {tutorial.hasContent ? thumbnail(7, imageC) : comingSoonThumbnail(7, placeholderImageC, tintC)}
  </div>
</div>
```

The delay/stagger timing (`POP_BASE_DELAY_MS`, `POP_STAGGER_MS`,
`--duration-base`, `--ease-out-quart`) stays identical for both
branches — only the keyframe (`transform` behavior) differs. The
coming-soon fade should land at the same moment the real-photo pop would
have, so CardBack's flip-reveal timing (the reasoning `POP_BASE_DELAY_MS`
itself documents, lines 618-635) still applies unchanged to both.

## Repo conventions to follow

- "Animation only plays on mount" + `key={String(justRevealed)}` forcing a
  remount on every flip is this row's existing mechanism
  (`TutorialCard.tsx:694-706`'s own comment) — unchanged by this plan,
  both keyframes are still plain CSS `animation`s gated the same way.
- `justRevealed && !reduceMotion` gating reduced-motion users out of any
  animation here (both the pop and the new fade) is unchanged — reduced-
  motion users already see the row appear instantly with no transition at
  all, which is correct for both branches and isn't part of this finding.
- Two sibling CSS keyframes living next to each other in `index.css`,
  switched between by a JS-computed animation-name string, has a direct
  precedent in this same function: `comingSoonThumbnail` and `thumbnail`
  are already two sibling render functions switched on `tutorial.hasContent`
  one line below where `popAnimationName` would be used — this plan adds
  the same real/coming-soon branch one layer up, at the entrance-animation
  level instead of the content level.

## Steps

1. In `src/index.css`, add the `product-preview-fade-in` keyframe
   immediately after `product-preview-pop-in` (current lines 247-250),
   exactly as shown in **Target** above.
2. In `src/components/TutorialCard.tsx`, change `popStyle`'s signature to
   accept `animationName: string` and interpolate it into the `animation`
   string (current lines 639-642), exactly as shown in **Target** above.
3. Add the `popAnimationName` constant immediately after `popStyle`'s
   declaration (before `thumbnail` is defined, current line 643).
4. Update all three `popStyle(...)` call sites (current lines 709, 713,
   718) to pass `popAnimationName` as the second argument, exactly as
   shown in **Target** above.
5. Run `npx tsc -b` to confirm no type errors (`popStyle` is called with
   two required args everywhere now — confirm there are exactly three call
   sites, all inside this one function, via `grep -n "popStyle(" src/components/TutorialCard.tsx`).

## Boundaries

- Do NOT change `POP_BASE_DELAY_MS`, `POP_STAGGER_MS`, `FLIP_VISIBLE_FRACTION`,
  `--duration-base`, or `--ease-out-quart` — the timing that already
  synchronizes this row with CardBack's flip reveal is correct and shared
  by both branches; this plan only changes the `transform` shape of the
  coming-soon branch's entrance, not when it plays.
- Do NOT give `product-preview-fade-in` its own separate delay/stagger
  values distinct from the real-photo branch — both should still land in
  sync with the same flip-reveal timing `POP_BASE_DELAY_MS` targets.
- Do NOT touch `comingSoonThumbnail` itself (the blur/tint rendering,
  lines 662-681) — this plan is about the entrance animation wrapping it,
  not the placeholder's own look.
- Do NOT apply `product-preview-fade-in` anywhere else in the app (e.g.
  don't "reuse" it for some other placeholder-style element) — this plan
  scopes it to `ProductsPreview`'s coming-soon branch only.
- If the current code doesn't match what's quoted above (drift since
  commit 75a7936), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npx tsc -b` — expect no errors. `grep -n "product-preview-fade-in" src/index.css src/components/TutorialCard.tsx` — expect one keyframe definition and at least two references (the `popAnimationName` ternary and its own doc comment) in the component file. `grep -n "popStyle(" src/components/TutorialCard.tsx` — expect exactly 3 call sites, each now passing two arguments.
- **Feel check**: open the app, tap a tutorial card with `hasContent: false`
  (11 of the 12 seeded tutorials — anything other than "Soft Smokey Eye")
  to flip it to its detail face and trigger `justRevealed`. Confirm the
  three blurred/tinted thumbnails now fade in in place — no rise, no
  scale-up, just opacity — while still landing in sync with the flip
  (not appearing before CardBack is visibly facing forward, not lagging
  noticeably behind it either; compare timing feel against a pre-fix
  screen recording or your memory of the current pop if unsure). Then
  tap "Soft Smokey Eye" (the one `hasContent: true` tutorial) and confirm
  its thumbnails still play the original scale-and-rise pop, completely
  unchanged. Toggle `prefers-reduced-motion` and confirm both tutorials'
  rows still appear instantly with no animation at all, same as before
  this plan.
- **Done when**: coming-soon thumbnails read as a calm reveal of withheld
  content rather than a celebratory unveiling, the one real-photo tutorial's
  pop-in is pixel-for-pixel unchanged, and both branches still time
  themselves to CardBack's flip exactly as before.
