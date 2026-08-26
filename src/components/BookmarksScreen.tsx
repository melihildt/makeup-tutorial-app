import { HEADER_CHIP_STYLE } from './ScreenHeader'
import { CloseIcon } from './InfoOverlay'
import { Toast, useToast } from './Toast'
import { ScrollEndFade, useAtScrollEnd } from './ScrollEndFade'
import { BookmarkIcon, type Tutorial, type TutorialLevel } from './TutorialCard'

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
 *  different trailing action (un-save, not a non-functional menu). */
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
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={tutorial.hasContent ? onOpenTutorial : onUnavailable}
      onKeyDown={(e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return
        e.preventDefault()
        if (tutorial.hasContent) onOpenTutorial()
        else onUnavailable()
      }}
      className="flex w-full cursor-pointer items-start gap-4 active:scale-[0.98]"
      style={{ transition: 'transform var(--duration-instant) var(--ease-out-quart)' }}
    >
      <div className="h-[90px] w-[80px] shrink-0 overflow-hidden rounded-[--radius-image] border-[0.5px] border-[--color-border-hairline] bg-[--color-image-placeholder]">
        <img src={tutorial.images[0]} alt="" className="size-full object-cover" />
      </div>
      <div className="flex h-[90px] flex-1 flex-col justify-between">
        <div className="flex items-start gap-1">
          <div className="flex flex-1 flex-col gap-[4px] text-[--color-text-product]">
            <p
              className="capitalize text-[14px] leading-[normal]"
              style={{ fontWeight: 'var(--font-weight-semibold)' }}
            >
              {tutorial.title}
            </p>
            <p className="text-[12px] leading-[normal] tracking-[-0.12px]" style={{ fontWeight: 'var(--font-weight-medium)' }}>
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
            aria-label={`Remove ${tutorial.title} from bookmarks`}
            className="header-icon-button flex shrink-0 items-center justify-center p-2"
            style={{ color: 'var(--color-tutorial-card-text)' }}
          >
            <span className="flex size-[24px] items-center justify-center">
              <BookmarkIcon filled />
            </span>
          </button>
        </div>
        <p className="text-[12px] leading-[normal] tracking-[-0.12px] opacity-50" style={{ color: 'var(--color-tutorial-card-text)' }}>
          {tutorial.durationMinutes} min · {capitalizeLevel(tutorial.level)}
        </p>
      </div>
    </div>
  )
}

/** No Figma design for this case — see this file's own module comment.
 *  Same "icon in a soft chip circle + heading + one line of body copy"
 *  shape as Toast.tsx's own content block, at a larger scale appropriate
 *  for filling the screen rather than a banner. */
function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-10 text-center">
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
    </div>
  )
}

/**
 * Bookmarks screen — AccountScreen's "Bookmarks" row opens this (Figma node
 * 761:12020). Lists every tutorial in `savedTutorialIds` (App.tsx's own
 * lifted, localStorage-backed state — see its module comment for why this
 * couldn't stay owned inside TutorialCard.tsx's TutorialStack any more).
 * Tapping a row opens the real tutorial flow if it has one (only
 * "Soft Smokey Eye" does today); tapping any other bookmarked row shows the
 * same "coming soon" Toast MyProductsScreen already uses for its own
 * not-yet-built interactions, rather than silently doing nothing.
 */
export function BookmarksScreen({
  tutorials,
  savedTutorialIds,
  onToggleSavedTutorial,
  onClose,
  onOpenTutorial,
}: BookmarksScreenProps) {
  const [toastOpen, showToast, hideToast] = useToast()
  const { ref: scrollerRef, atEnd, onScroll } = useAtScrollEnd<HTMLDivElement>()
  const savedTutorials = tutorials.filter((tutorial) => savedTutorialIds.has(tutorial.id))

  return (
    <div
      className="relative mx-auto flex h-dvh w-full max-w-[402px] flex-col overflow-hidden md:h-full md:rounded-2xl md:py-6"
      style={{ background: 'var(--gradient-bg-home)' }}
    >
      <Toast open={toastOpen} onClose={hideToast} />
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden px-[--space-sm] pb-2 pt-[--space-2xs]"
      >
        <div className="flex items-start justify-between">
          <p
            className="text-[20px] tracking-[-0.4px]"
            style={{ color: 'var(--color-info-overlay-heading)', fontWeight: 'var(--font-weight-medium)' }}
          >
            Bookmarks
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="header-icon-button flex size-[40px] shrink-0 items-center justify-center rounded-[--radius-filter-chip] border-[0.5px] border-solid"
            style={{ ...HEADER_CHIP_STYLE, color: 'var(--color-tutorial-card-text)' }}
          >
            <CloseIcon />
          </button>
        </div>

        {savedTutorials.length === 0 ? (
          <EmptyState />
        ) : (
          <div
            // pb-10 — same ScrollEndFade breathing-room reasoning as
            // MyProductsScreen's own card (see ScrollEndFade.tsx).
            className="mt-4 flex w-full flex-col gap-10 rounded-[--radius-card] bg-[--color-surface] px-[--space-sm] pb-10 pt-[--space-sm] shadow-[--shadow-card]"
            data-node-id="761:12030"
          >
            {savedTutorials.map((tutorial) => (
              <BookmarkRow
                key={tutorial.id}
                tutorial={tutorial}
                onToggleSavedTutorial={onToggleSavedTutorial}
                onOpenTutorial={onOpenTutorial}
                onUnavailable={showToast}
              />
            ))}
          </div>
        )}
      </div>
      {savedTutorials.length > 0 && (
        <ScrollEndFade hidden={atEnd} />
      )}
    </div>
  )
}
