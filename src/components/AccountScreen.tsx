import { HEADER_CHIP_STYLE } from './ScreenHeader'
import { BookmarkGlyphIcon, BoxIcon, CalculatorIcon, ChevronRightIcon, CloseIcon } from './icons'
import { useEscapeToClose } from './useEscapeToClose'

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
// in the design itself, not something this app added). This is the only
// remaining non-functional row on this screen now that Bookmarks navigates
// for real — Toast.tsx (formerly used for Bookmarks' own "coming soon" tap
// feedback) isn't needed on this screen any more.
//
// Verify pass (2026-09-01): this block used to claim the pill reused
// --color-badge-bg-list/--color-text-product as an exact-value match
// (BeautyNotes/p-14, 14px) — a fresh pull of this pill's own node
// (896:10402) shows that was wrong on every count: it's BeautyNotes/p-12
// (12px/-0.12px, not 14px/no tracking), a flat #e9e7e6 background (not
// --color-badge-bg-list's swatch — that token is a different named Figma
// variable, now confirmed AllStepsView-specific), #656462 text (not
// --color-text-product's 80%-alpha ink), and 10px horizontal padding (was
// 8px). Font-size/tracking now reuse --font-size-product-sub/
// --letter-spacing-shade (already the exact BeautyNotes/p-12 pair,
// confirmed elsewhere in tokens.css); background is the new
// --color-coming-soon-pill-bg; text color is --color-info-overlay-heading,
// already the right flat #656462 value.
export function ComingSoonPill() {
  return (
    <span
      className="shrink-0 whitespace-nowrap rounded-full px-[10px] py-1 text-[length:var(--font-size-product-sub)] tracking-[--letter-spacing-shade]"
      style={{
        background: 'var(--color-coming-soon-pill-bg)',
        color: 'var(--color-info-overlay-heading)',
        fontWeight: 'var(--font-weight-medium)',
      }}
    >
      Coming soon
    </span>
  )
}

// Verify pass (2026-09-01): `color` was --color-tutorial-card-text (#21201f)
// — a fresh pull + raw-asset download of these row icons (fi-br-box/
// -bookmark/-calculator, e.g. 896:10384) confirmed a flat #656462 fill
// instead, i.e. --color-info-overlay-heading, not the darker ink token
// (same class of fix as CloseIcon's own "info-overlay-heading, not
// tutorial-card-text" correction). `borderColor` is dropped entirely — the
// icon box itself (896:10383) carries no stroke in Figma, only the fill;
// the 0.5px border classes below came off the icon `<span>` for the same
// reason.
const ROW_ICON_STYLE = {
  background: 'var(--color-list-row-icon-bg)',
  color: 'var(--color-info-overlay-heading)',
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
        className="flex size-[40px] shrink-0 items-center justify-center rounded-[--radius-filter-chip]"
        style={ROW_ICON_STYLE}
      >
        {icon}
      </span>
      {/* text-[16px] → --font-size-account-row-label (15px), plus the
          tracking (-0.15px) it was missing entirely — BeautyNotes/p-18,
          confirmed on this row's own node (896:10386), see that token's
          own tokens.css comment. */}
      <span
        className="flex-1 text-left text-[length:var(--font-size-account-row-label)] tracking-[--letter-spacing-account-row-label]"
        style={{ color: 'var(--color-tutorial-card-text)', fontWeight: 'var(--font-weight-medium)' }}
      >
        {label}
      </span>
      {/* Chevron's own color wasn't set anywhere — it was silently
          inheriting the ambient (black) text color instead of the flat
          #cfcecc fi-br-angle-small-right actually bakes. */}
      {trailing ?? (onClick && (
        <span style={{ color: 'var(--color-chevron-icon)' }}>
          <ChevronRightIcon />
        </span>
      ))}
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
  // Accessibility audit (2026-09-02, finding #7) — see useEscapeToClose's
  // own doc comment for why this is a shared hook, not a local effect, and
  // why this screen (mounted only while it's the active `Screen`, no
  // separate `open` boolean) doesn't need a second argument the way
  // InfoOverlay/ProductDetailOverlay do.
  useEscapeToClose(onClose)

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
              // --font-weight-regular, not --font-weight-medium (verify
              // pass, 2026-09-01) — a fresh pull of this title (896:10376)
              // shows 'EB_Garamond:Regular'/font-normal, matching
              // BookmarksScreen's own title (already on -regular, see its
              // own comment) — Account/My Products/About/Product Detail's
              // titles were apparently never re-checked since Bookmarks got
              // this fix.
              fontWeight: 'var(--font-weight-regular)',
            }}
          >
            Account
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="header-icon-button flex size-[44px] shrink-0 items-center justify-center rounded-[--radius-filter-chip] border-[0.5px] border-solid"
            // --color-info-overlay-heading, not --color-tutorial-card-text
            // — see InfoOverlay.tsx's own close-button comment for why.
            style={{ ...HEADER_CHIP_STYLE, color: 'var(--color-info-overlay-heading)' }}
          >
            <CloseIcon />
          </button>
        </div>

        <div
          // border-[--color-container-border] — this sheet's own 0.5px
          // #F1EFEE stroke (see that token's own tokens.css comment): a
          // fresh pull confirmed it on this exact node (896:10380) too, and
          // it was missing here along with every other --shadow-card-elevated
          // container in the app until this pass.
          className="mt-6 flex w-full flex-col items-stretch rounded-[--radius-account-card] border-[0.5px] border-solid border-[--color-container-border] bg-white px-[--space-sm] py-[--space-2xs]"
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
