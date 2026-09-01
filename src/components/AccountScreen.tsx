import { HEADER_CHIP_STYLE } from './ScreenHeader'
import { BookmarkGlyphIcon, BoxIcon, CalculatorIcon, ChevronRightIcon, CloseIcon } from './icons'

type AccountScreenProps = {
  onClose: () => void
  onOpenMyProducts: () => void
  onOpenBookmarks: () => void
}

// Figma: node 749:10533 ("Home/Profile"), file Tech-Experimentation — opened
// from HomeScreen's own user-icon button. This row's own icons (Box,
// BookmarkGlyph, Calculator, ChevronRight) moved to icons.tsx — see that
// file's own module comment for the shared-icons consolidation and the
// BookmarkGlyphIcon rename in particular.

// Beauty Calculator's permanent disabled-state pill (already shown this way
// in the design itself, not something this app added) — same "Dark/80%"
// style (BeautyNotes/p-14) as elsewhere, reusing --color-badge-bg-list/
// --color-text-product rather than new tokens since both already carry
// exactly this value (AllStepsView's own per-group pill; ProductCard's
// product-name ink — see their own tokens.css comments). This is the only
// remaining non-functional row on this screen now that Bookmarks navigates
// for real — Toast.tsx (formerly used for Bookmarks' own "coming soon" tap
// feedback) isn't needed on this screen any more.
export function ComingSoonPill() {
  return (
    <span
      className="shrink-0 whitespace-nowrap rounded-full px-2 py-1 text-[length:var(--font-size-product-name)]"
      style={{
        background: 'var(--color-badge-bg-list)',
        color: 'var(--color-text-product)',
        fontWeight: 'var(--font-weight-medium)',
      }}
    >
      Coming soon
    </span>
  )
}

const ROW_ICON_STYLE = {
  background: 'var(--color-list-row-icon-bg)',
  borderColor: 'var(--color-border-hairline)',
  color: 'var(--color-tutorial-card-text)',
} as const

type AccountRowProps = {
  icon: React.ReactNode
  label: string
  /** Present → row is tappable and shows a chevron (My Products and
   *  Bookmarks both navigate for real now). Omitted → the row is
   *  permanently inert with `trailing` shown in the chevron's place
   *  (Beauty Calculator's own already-disabled state). */
  onClick?: () => void
  trailing?: React.ReactNode
}

/**
 * One Account row (icon box + label + trailing chevron/pill). Shared by all
 * three options — My Products, Bookmarks, and Beauty Calculator only differ
 * in what `trailing`/`onClick` they pass, not in layout.
 */
function AccountRow({ icon, label, onClick, trailing }: AccountRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      // active:scale-[0.98] + --duration-instant/--ease-out-quart — same
      // recipe MyProductsScreen.tsx's own tappable rows already use
      // (find-animation-opportunities pass: this row had no press feedback
      // at all, the only tappable row in the app without it). Beauty
      // Calculator's row has no onClick, so `disabled` is true there and
      // this never fires — nothing implies interactivity on a row that has
      // none.
      className="flex w-full items-center gap-4 py-3 active:scale-[0.98] disabled:cursor-default"
      style={{ transition: 'transform var(--duration-instant) var(--ease-out-quart)' }}
    >
      <span
        className="flex size-[40px] shrink-0 items-center justify-center rounded-[--radius-filter-chip] border-[0.5px] border-solid"
        style={ROW_ICON_STYLE}
      >
        {icon}
      </span>
      <span
        className="flex-1 text-left text-[16px]"
        style={{ color: 'var(--color-tutorial-card-text)', fontWeight: 'var(--font-weight-medium)' }}
      >
        {label}
      </span>
      {trailing ?? (onClick && <ChevronRightIcon />)}
    </button>
  )
}

/**
 * Account screen — HomeScreen's user-icon button opens this (Figma node
 * 749:10533, "Home/Profile"). Three options: My Products and Bookmarks both
 * drill into their own real screens (MyProductsScreen.tsx/
 * BookmarksScreen.tsx), Beauty Calculator stays shown disabled with a
 * "Coming soon" pill, matching the design itself. Same screen-level
 * structure as HomeScreen.tsx's own root (gradient bg, screen-edge margin
 * tokens) since App.tsx renders this as a sibling `Screen`, not an overlay
 * over Home the way InfoOverlay.tsx is.
 */
export function AccountScreen({ onClose, onOpenMyProducts, onOpenBookmarks }: AccountScreenProps) {
  return (
    <div
      className="relative mx-auto flex h-dvh w-full max-w-[402px] flex-col overflow-hidden md:h-full md:rounded-2xl md:py-6"
      style={{ background: 'var(--gradient-bg-home)' }}
    >
      <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden px-[--space-sm] pb-2 pt-[--space-2xs]">
        <div className="flex items-start justify-between">
          <p
            style={{
              fontFamily: 'var(--font-family-serif-card)',
              fontSize: 'var(--font-size-title-serif)',
              letterSpacing: 'var(--letter-spacing-title-serif)',
              color: 'var(--color-info-overlay-heading)',
              fontWeight: 'var(--font-weight-medium)',
            }}
          >
            Account
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

        <div
          className="mt-6 flex w-full flex-col items-stretch rounded-[--radius-account-card] bg-white px-[--space-sm] py-[--space-2xs]"
          style={{ boxShadow: 'var(--shadow-card-elevated)' }}
          data-node-id="749:10542"
        >
          <AccountRow icon={<BoxIcon />} label="My Products" onClick={onOpenMyProducts} />
          <AccountRow icon={<BookmarkGlyphIcon />} label="Bookmarks" onClick={onOpenBookmarks} />
          <AccountRow icon={<CalculatorIcon />} label="Beauty Calculator" trailing={<ComingSoonPill />} />
        </div>
      </div>
    </div>
  )
}
