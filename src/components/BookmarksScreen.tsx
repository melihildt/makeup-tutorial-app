import { useLayoutEffect } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { HEADER_CHIP_STYLE } from './ScreenHeader'
import { BookmarkIcon, CloseIcon } from './icons'
import { Toast, useToast } from './Toast'
import { ScrollEndFade, useAtScrollEnd, useHasOverflow } from './ScrollEndFade'
import { EASE_OUT_QUART, type Tutorial, type TutorialLevel } from './TutorialCard'
import { getRoleButtonProps } from './rowActivation'

type BookmarksScreenProps = {
  tutorials: Tutorial[]
  savedTutorialIds: Set<string>
  onToggleSavedTutorial: (id: string) => void
  onClose: () => void
  /** Opens the real tutorial flow — only ever called for a tutorial whose
   *  own `hasContent` is true (see BookmarkRow below). Takes no argument:
   *  every tutorial hands off to the same one hard-coded TutorialFlow
   *  (Soft Smokey Eye's steps) regardless of which card started it — see
   *  Tutorial's own `hasContent` doc comment (TutorialCard.tsx) — so
   *  there's nothing here to tell it which bookmark was tapped. */
  onOpenTutorial: () => void
}

// Figma: node 761:12020 ("Home/Profile-MyProducts" — a duplicate of the My
// Products frame, retitled "Bookmarks"; not a new frame of its own).
// Reuses that frame's exact shell (header, white rounded-[--radius-card]
// list container, ScrollEndFade) rather than a new one. Two real content
// differences from a plain copy:
//
// 1. The "More" affordance next to each row isn't a kebab menu here — it's
//    the same fi-rr-bookmark icon TutorialLookCard's own save button uses
//    (get_design_context named its instance "Icons"/"Bookmark", not
//    "fi-br-menu-dots-vertical" like My Products' rows), always shown
//    filled since everything on this screen is, definitionally, already
//    saved. Tapping it un-saves — a real, functional action, not a
//    "coming soon" placeholder, since it's the exact same toggle
//    HomeScreen's card stack already has.
//
// 2. The row's own third line replaces Figma's "25 min · Easy/Intermediate/
//    Hard" with "{duration} min · {level}" pulled from the real Tutorial
//    data (TutorialCard.tsx) — Figma's difficulty wording doesn't exist
//    anywhere in this app's actual data model (TutorialLevel is
//    'easy'/'medium'/'experienced', shown as EASY/MEDIUM/EXPERIENCED on
//    the flipped card, not "Intermediate"/"Hard"), so this uses the app's
//    own real vocabulary instead of copying Figma's placeholder text
//    verbatim (same reasoning as My Products' own step-name/shade
//    mismatches — see its module comment).
//
// No design exists for the empty-state case (Figma's own pull only shows
// four bookmarks already saved) — per the user's own ask to add one
// anyway, EmptyState below is this app's own simple, restrained take, not
// a reproduction of anything pulled from Figma.

function capitalizeLevel(level: TutorialLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1)
}

/** One saved tutorial — image, title/brand, duration · level, and the
 *  (always-filled) bookmark button that un-saves it. Same visual language
 *  as MyProductRow (MyProductsScreen.tsx) — image + text + trailing icon
 *  button, row itself tappable — but a differently-shaped image (80×90,
 *  not 57×64: Figma's own row here, not a reuse of that component) and a
 *  different trailing action (un-save, not a non-functional menu).
 *
 *  Code review (2026-08-26): this near-duplicated MyProductRow's own
 *  role="button"-row + nested-button structure — left as-is at first
 *  (extracting a shared piece meant touching MyProductsScreen.tsx, already
 *  shipped and working, for a DRY-ness benefit with no functional need
 *  behind it yet), noted to revisit if a third near-identical row showed
 *  up. A follow-up pass found five (three more in TutorialCard.tsx:
 *  TutorialLookCard/TutorialDetailCard/StartOverCard), past that
 *  threshold — the activation-props half of this row (role/tabIndex/
 *  onClick/onKeyDown) now comes from getRoleButtonProps
 *  (rowActivation.ts), shared by all five. The rest of this row (the
 *  differently-shaped image, the un-save button, the motion.div wrapper)
 *  still isn't shared with MyProductRow — only the one piece that was
 *  ever byte-for-byte identical across all five call sites got extracted.
 *
 *  Outer motion.div (layout + exit) is a separate element from the inner
 *  role="button" div (animation review, 2026-08-26): Framer Motion writes
 *  its own `transform` inline on whatever it's driving, which would
 *  otherwise permanently win over the CSS `active:scale-[0.98]` class's
 *  own `transform` — same reason TutorialLookCard/TutorialDetailCard
 *  (TutorialCard.tsx) keep their own press-feedback div plain rather than
 *  a motion.div, even where a Framer-Motion-driven ancestor exists. */
function BookmarkRow({
  tutorial,
  onToggleSavedTutorial,
  onOpenTutorial,
  onUnavailable,
}: {
  tutorial: Tutorial
  onToggleSavedTutorial: (id: string) => void
  onOpenTutorial: () => void
  onUnavailable: () => void
}) {
  const reduceMotion = useReducedMotion()

  // Factored out of onClick/onKeyDown (code review finding: the same
  // hasContent ternary was written out twice, once inline and once
  // expanded) — one branch, used by both activation paths.
  function handleActivate() {
    if (tutorial.hasContent) onOpenTutorial()
    else onUnavailable()
  }

  return (
    // layout (skipped under reduced motion, same "movement removed, fade
    // kept" call as App.tsx's own screen transition) lets the *remaining*
    // rows smoothly slide up into a removed row's space — paired with
    // AnimatePresence's mode="popLayout" below, which pulls the exiting
    // row out of flow immediately so that reflow isn't blocked waiting for
    // its own exit to finish. exit is opacity + scale, not height: an
    // explicit height collapse would work too, but only via animating a
    // layout property (banned — GPU-only rule); `layout`'s own FLIP-based
    // reflow already gets the "others slide up" effect without touching
    // height directly (animation review, 2026-08-26: un-saving used to
    // remove a row with no exit at all — content the user just acted on
    // vanishing instantly).
    <motion.div
      layout={!reduceMotion}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: 'scale(0.96)' }}
      transition={{ duration: reduceMotion ? 0.15 : 0.2, ease: EASE_OUT_QUART }}
    >
      <div
        {...getRoleButtonProps(handleActivate)}
        // has-[button:active]:scale-100 (animation review, 2026-08-26):
        // without it, pressing the un-save button also matches *this* row's
        // own :active (native CSS behavior — a nested button's :active
        // state bubbles to ancestors regardless of the button's own
        // stopPropagation, which only affects JS click/keydown handling,
        // not CSS pseudo-class matching), compounding two independent
        // scale transforms on one tap. TutorialDetailCard (TutorialCard.tsx)
        // already solved this exact situation the same way; this row just
        // hadn't copied that half of the pattern along with the rest of it.
        className="flex w-full cursor-pointer items-start gap-4 active:scale-[0.98] has-[button:active]:scale-100"
        style={{ transition: 'transform var(--duration-instant) var(--ease-out-quart)' }}
      >
        {/* --radius-image-list (12px), not --radius-image (8px) — a fresh
            pull of this row's own Image node (896:10571) shows 12px, the
            same list-context radius AllStepsView/MyProducts already use;
            this row just hadn't been checked against it before. */}
        <div className="h-[90px] w-[80px] shrink-0 overflow-hidden rounded-[--radius-image-list] border-[0.5px] border-[--color-border-hairline] bg-[--color-image-placeholder]">
          <img src={tutorial.images[0]} alt="" className="size-full object-cover" />
        </div>
        <div className="flex h-[90px] flex-1 flex-col justify-between">
          <div className="flex items-start gap-1">
            {/* Title and brand carry two genuinely different flat colors in
                the fresh pull (896:10575/896:10576) — flat ink
                (--color-tutorial-card-text, #21201f) for the title, flat
                --color-info-overlay-heading (#656462) for the brand line —
                not one shared alpha-derived --color-text-product like this
                block previously applied to both via the wrapping div. */}
            <div className="flex flex-1 flex-col gap-[4px]">
              <p
                className="capitalize text-[14px] leading-[normal]"
                style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-tutorial-card-text)' }}
              >
                {tutorial.title}
              </p>
              <p
                className="text-[12px] leading-[normal] tracking-[-0.12px]"
                style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-info-overlay-heading)' }}
              >
                {tutorial.brand}
              </p>
            </div>
            {/* p-2 + a fixed icon box — MyProductRow's own kebab-button recipe
                (MyProductsScreen.tsx), not the earlier -m-1/p-1 pair: that
                combination canceled itself out in the row's layout (padding
                added, then pulled back by an equal negative margin) but left
                the actual hit target at 30×32px — the smallest tap target
                in the app, on a control right next to a *different* action
                (the row's own tap-to-open), where a mis-tap costs more than
                usual. BookmarkIcon's own box is 24px (its taller dimension),
                not MenuDotsIcon's 20px, so this uses size-[24px] to land on
                the same 40×40 total MyProductRow's kebab gets. */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onToggleSavedTutorial(tutorial.id)
              }}
              // stopPropagation on keydown too, not just click (code review
              // finding): without it, pressing Enter/Space while focused on
              // this button doesn't un-save at all — the keydown bubbles to
              // the row's own onKeyDown first, which matches Enter/Space and
              // calls preventDefault() before this button's native keyboard
              // activation (which fires after bubbling completes) can run,
              // so the row's tap-to-open fires instead. Click never had this
              // problem (the row has no separate click-activation step to
              // race against), only the keyboard path did.
              onKeyDown={(e) => e.stopPropagation()}
              aria-label={`Remove ${tutorial.title} from bookmarks`}
              className="header-icon-button flex shrink-0 items-center justify-center p-2"
              style={{ color: 'var(--color-tutorial-card-text)' }}
            >
              <span className="flex size-[24px] items-center justify-center">
                <BookmarkIcon filled />
              </span>
            </button>
          </div>
          {/* --color-text-muted-list (flat #848281), not opacity-50 on ink
              — a fresh pull of this line (896:10579) shows the same flat
              "Chips Text (Solid)/2" swatch AllStepsView's own group
              description and ProductCard's list-context shade line already
              use, not an alpha derivation. */}
          <p className="text-[12px] leading-[normal] tracking-[-0.12px] text-[--color-text-muted-list]">
            {tutorial.durationMinutes} min · {capitalizeLevel(tutorial.level)}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

/** No Figma design for this case — see this file's own module comment.
 *  Same "icon in a soft chip circle + heading + one line of body copy"
 *  shape as Toast.tsx's own content block, at a larger scale appropriate
 *  for filling the screen rather than a banner.
 *
 *  Settle-in fade+scale on mount (animation review, 2026-08-26; this
 *  screen previously had zero motion here) — same recipe as
 *  ProductDetailOverlay's own hero image, since this is plausibly the
 *  very first thing a new user sees on this screen, the kind of rare/
 *  first-time moment the app's own frequency conventions treat as worth
 *  a beat of polish rather than appearing flat. */
function EmptyState() {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      className="flex flex-1 flex-col items-center justify-center gap-3 px-10 text-center"
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: 'scale(0.97)' }}
      animate={{ opacity: 1, transform: 'scale(1)' }}
      transition={{ duration: reduceMotion ? 0.2 : 0.3, ease: EASE_OUT_QUART }}
    >
      <span
        className="flex size-[64px] items-center justify-center rounded-full"
        style={{ background: 'var(--color-list-row-icon-bg)' }}
      >
        <BookmarkIcon filled={false} />
      </span>
      <p className="text-[16px]" style={{ color: 'var(--color-tutorial-card-text)', fontWeight: 'var(--font-weight-semibold)' }}>
        No saved looks yet
      </p>
      <p className="text-[14px]" style={{ color: 'var(--color-text-product)' }}>
        Tap the bookmark icon on a look you like to save it here.
      </p>
    </motion.div>
  )
}

/**
 * Bookmarks screen — AccountScreen's "Bookmarks" row opens this (Figma node
 * 761:12020). Lists every tutorial in `savedTutorialIds` (App.tsx's own
 * lifted, localStorage-backed state — see its module comment for why this
 * couldn't stay owned inside TutorialCard.tsx's TutorialStack any more).
 * Tapping a row opens the real tutorial flow if it has one (only
 * "Soft Smokey Eye" does today); tapping any other bookmarked row shows the
 * same Toast component MyProductsScreen uses for its own not-yet-built
 * interactions, rather than silently doing nothing — with its own
 * tutorial-specific wording (Toast's `message` prop) instead of that
 * screen's generic "still in the discovery phase" copy.
 */
export function BookmarksScreen({
  tutorials,
  savedTutorialIds,
  onToggleSavedTutorial,
  onClose,
  onOpenTutorial,
}: BookmarksScreenProps) {
  const [toastOpen, showToast, hideToast] = useToast()
  const { ref: scrollerRef, atEnd, onScroll, recheck } = useAtScrollEnd<HTMLDivElement>()
  const savedTutorials = tutorials.filter((tutorial) => savedTutorialIds.has(tutorial.id))

  // Code review finding: useAtScrollEnd only recomputes `atEnd` on a real
  // onScroll event or once at mount (ScrollEndFade.tsx) — it has no way to
  // know the list itself just changed shape. This is the one screen in the
  // app where that matters: un-saving a bookmark can shrink the list down
  // to where it no longer overflows, with no scroll event ever firing, so
  // `atEnd` would stay stale and ScrollEndFade would keep showing its fade
  // over content with nothing left underneath it — exactly what that
  // component exists to prevent (its own module comment). AllStepsView and
  // MyProductsScreen never remove rows in place, so they've never hit this;
  // fixed here rather than in the shared hook to avoid touching two
  // already-shipped screens for a case only this one has. `recheck` (not
  // faking a UIEvent around `onScroll`, which this used to do) reads the
  // current scroller node internally — same formula, without needing a
  // synthetic event object to carry it.
  //
  // hasOverflow (user-reported): the card's own pb-10 exists purely so
  // ScrollEndFade has clean surface to fade against instead of washing
  // over the last row — but that class was unconditional, so a short list
  // (e.g. 1-2 bookmarks, comfortably under one viewport) still reserved
  // 40px of dead space below the last row even though the list never
  // scrolls and the fade is already hidden (atEnd) in that case. Figma's
  // own pull (896:10567) shows a plain, uniform 16px on every side, with no
  // such reserve — this only needs to widen past that when the list
  // actually overflows. useHasOverflow (ScrollEndFade.tsx) rechecks on
  // mount, on savedTutorials.length changing, AND on the scroller's own
  // ResizeObserver firing — the last of those is a code review finding:
  // this used to only recheck on mount/list-length, so a viewport resize
  // or device rotation that pushed a short, previously-non-overflowing
  // list past one screen's worth of height left it on the smaller no-
  // overflow padding, with ScrollEndFade's fade band sitting over real
  // content.
  const hasOverflow = useHasOverflow(scrollerRef, [savedTutorials.length])
  useLayoutEffect(() => {
    recheck()
  }, [savedTutorials.length, recheck])

  return (
    <div
      // Code review finding: this root + the title/close-button header
      // below duplicate AccountScreen.tsx/MyProductsScreen.tsx's own shell
      // class-for-class (a third copy now). Left as-is — extracting a
      // shared wrapper means touching two already-shipped screens for a
      // DRY-ness benefit with no functional need behind it yet; revisit if
      // a shared tweak (padding, radius, the overflow fix App.tsx's own
      // comment describes for a similar latent-scroll bug) needs applying
      // to all three at once.
      className="relative mx-auto flex h-dvh w-full max-w-[402px] flex-col overflow-hidden md:h-full md:rounded-2xl md:py-6"
      style={{ background: 'var(--gradient-bg-home)' }}
    >
      <Toast
        open={toastOpen}
        onClose={hideToast}
        message="We're still adding new tutorials — check back soon."
      />
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden px-[--space-sm] pb-2 pt-[--space-2xs]"
      >
        <div className="flex items-start justify-between">
          {/* --font-weight-regular, not --font-weight-medium — a fresh pull
              of this title (896:10562) shows 'EB_Garamond:Regular'/
              font-normal, unlike Account's and My Products' own titles
              (each independently confirmed Medium via their own pulls) —
              a genuine per-instance difference in the current file, not
              repointed here since it's a local inline style, not a shared
              token/component. */}
          <p
            style={{
              fontFamily: 'var(--font-family-serif-card)',
              fontSize: 'var(--font-size-title-serif)',
              letterSpacing: 'var(--letter-spacing-title-serif)',
              color: 'var(--color-info-overlay-heading)',
              fontWeight: 'var(--font-weight-regular)',
            }}
          >
            Bookmarks
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="header-icon-button flex size-[40px] shrink-0 items-center justify-center rounded-[--radius-filter-chip] border-[0.5px] border-solid"
            // --color-info-overlay-heading, not --color-tutorial-card-text
            // — see InfoOverlay.tsx's own close-button comment for why.
            style={{ ...HEADER_CHIP_STYLE, color: 'var(--color-info-overlay-heading)' }}
          >
            <CloseIcon />
          </button>
        </div>

        {savedTutorials.length === 0 ? (
          <EmptyState />
        ) : (
          <div
            // pb-10 only while hasOverflow — same ScrollEndFade
            // breathing-room reasoning as MyProductsScreen's own card (see
            // ScrollEndFade.tsx), but conditional now (see hasOverflow's
            // own comment above): a short list gets Figma's plain pb-4
            // (16px, matching pt-[--space-sm]/px-[--space-sm] on every
            // other side) instead of always paying the 40px reserve a
            // non-scrolling list never needs. The rest of this className
            // also duplicates that card's own classes verbatim (code review
            // finding) — same "not worth touching an already-shipped
            // screen for DRY-ness alone" call as the root shell above.
            //
            // border-[--color-container-border] + shadow-card-elevated (was
            // shadow-card, the smaller pre-V6 value) — a fresh pull of this
            // Container node (896:10567) confirms the same 0.5px #f1efee
            // hairline and the bigger "Shadow_2" blur/spread every other
            // --shadow-card-elevated sheet in the app already carries; this
            // screen was apparently built before that pass and never
            // brought in line with it.
            className={`mt-4 flex w-full flex-col gap-10 rounded-[--radius-card] border-[0.5px] border-solid border-[--color-container-border] bg-[--color-surface] px-[--space-sm] pt-[--space-sm] ${
              hasOverflow ? 'pb-10' : 'pb-4'
            }`}
            style={{ boxShadow: 'var(--shadow-card-elevated)' }}
            data-node-id="761:12030"
          >
            {/* mode="popLayout" (animation review, 2026-08-26) — pulls an
                exiting row out of document flow immediately instead of
                waiting for its own exit animation to finish, so the
                remaining rows' own `layout` transitions (BookmarkRow) start
                sliding up into the vacated space right away rather than
                looking frozen until the removed row disappears. */}
            <AnimatePresence mode="popLayout">
              {savedTutorials.map((tutorial) => (
                <BookmarkRow
                  key={tutorial.id}
                  tutorial={tutorial}
                  onToggleSavedTutorial={onToggleSavedTutorial}
                  onOpenTutorial={onOpenTutorial}
                  onUnavailable={showToast}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      {savedTutorials.length > 0 && (
        <ScrollEndFade hidden={atEnd} />
      )}
    </div>
  )
}
