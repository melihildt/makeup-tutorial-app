import { HEADER_CHIP_STYLE } from './ScreenHeader'
import { CloseIcon } from './InfoOverlay'
import { Toast, useToast } from './Toast'

type AccountScreenProps = {
  onClose: () => void
  onOpenMyProducts: () => void
}

// Figma: node 749:10533 ("Home/Profile"), file Tech-Experimentation — opened
// from HomeScreen's own user-icon button. Icons below are hand-authored
// inline SVGs with real path data pulled from that node's exported assets
// (fi-br-box/-bookmark/-calculator/-angle-small-right), same convention as
// every other icon in this app (see HomeScreen.tsx's own module comment) —
// `fill="currentColor"` + baked `fillOpacity` (0.8 for the row icons, 0.5
// for the chevron, matching the exported assets exactly) rather than a raw
// `<img src>` of the remote asset, which would also expire in ~7 days.

function BoxIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        fill="currentColor"
        fillOpacity={0.8}
        d="M16 3.66666C15.9978 1.64253 14.3575 0.00221875 12.3333 0H3.66666C1.64253 0.00221875 0.00221875 1.64253 0 3.66666V4.33331C0.00025 4.94238 0.239656 5.527 0.666656 5.96131V12.3333C0.668875 14.3575 2.30922 15.9978 4.33334 16H11.6667C13.6908 15.9978 15.3312 14.3575 15.3333 12.3333V5.96134C15.7604 5.52703 15.9998 4.94241 16 4.33334V3.66666ZM2 3.66666C2 2.74619 2.74619 2 3.66666 2H12.3333C13.2538 2 14 2.74619 14 3.66666V4.33331C14 4.51741 13.8508 4.66666 13.6667 4.66666H2.33334C2.14925 4.66666 2 4.51741 2 4.33331V3.66666ZM13.3333 12.3333C13.3333 13.2538 12.5872 14 11.6667 14H4.33334C3.41288 14 2.66669 13.2538 2.66669 12.3333V6.66666H13.3333V12.3333V12.3333Z"
      />
      <path
        fill="currentColor"
        fillOpacity={0.8}
        d="M6.33336 8H9.66671C10.219 8 10.6667 8.44772 10.6667 9C10.6667 9.55228 10.219 10 9.66671 10H6.33336C5.78107 10 5.33335 9.55228 5.33335 9C5.33335 8.44772 5.78107 8 6.33336 8Z"
      />
    </svg>
  )
}

function BookmarkIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        fill="currentColor"
        fillOpacity={0.8}
        d="M11.6666 -5.08626e-06H4.33323C3.36114 0.00122975 2.42923 0.387935 1.74186 1.0753C1.0545 1.76267 0.667793 2.69458 0.666559 3.66666V13.648C0.66706 14.1149 0.807627 14.5709 1.07008 14.9571C1.33254 15.3432 1.70481 15.6418 2.13876 15.8141C2.57271 15.9864 3.04837 16.0246 3.50424 15.9237C3.96012 15.8227 4.37522 15.5874 4.69589 15.248L7.97056 11.7813L11.3126 15.2813C11.6342 15.6181 12.0494 15.851 12.5045 15.9498C12.9596 16.0487 13.4339 16.0091 13.8663 15.8362C14.2988 15.6633 14.6696 15.3648 14.931 14.9794C15.1924 14.5939 15.3325 14.1391 15.3332 13.6733V3.66666C15.332 2.69458 14.9453 1.76267 14.2579 1.0753C13.5706 0.387935 12.6386 0.00122975 11.6666 -5.08626e-06V-5.08626e-06ZM13.3332 13.6733C13.3331 13.7398 13.3131 13.8047 13.2758 13.8598C13.2385 13.9148 13.1856 13.9574 13.1239 13.9821C13.0622 14.0068 12.9945 14.0126 12.9295 13.9985C12.8645 13.9845 12.8052 13.9513 12.7592 13.9033L8.69256 9.64266C8.59886 9.54455 8.48617 9.46653 8.36136 9.41335C8.23655 9.36017 8.10223 9.33295 7.96656 9.33333C7.83094 9.33373 7.69682 9.36172 7.57235 9.41558C7.44789 9.46945 7.33568 9.54807 7.24256 9.64666L3.24256 13.8767C3.19792 13.9271 3.13849 13.9621 3.07275 13.9767C3.00702 13.9913 2.93835 13.9848 2.87656 13.958C2.81291 13.9357 2.75812 13.8936 2.7203 13.8377C2.68248 13.7819 2.66363 13.7154 2.66656 13.648V3.66666C2.66656 3.22463 2.84215 2.80071 3.15471 2.48815C3.46727 2.17559 3.8912 1.99999 4.33323 1.99999H11.6666C12.1086 1.99999 12.5325 2.17559 12.8451 2.48815C13.1576 2.80071 13.3332 3.22463 13.3332 3.66666V13.6733Z"
      />
    </svg>
  )
}

function CalculatorIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        fill="currentColor"
        fillOpacity={0.8}
        d="M12.3333 16H3.66667C2.69453 15.9989 1.76252 15.6123 1.07511 14.9249C0.387707 14.2375 0.00105878 13.3055 0 12.3333L0 3.66667C0.00105878 2.69453 0.387707 1.76252 1.07511 1.07511C1.76252 0.387707 2.69453 0.00105878 3.66667 0L12.3333 0C13.3055 0.00105878 14.2375 0.387707 14.9249 1.07511C15.6123 1.76252 15.9989 2.69453 16 3.66667V12.3333C15.9989 13.3055 15.6123 14.2375 14.9249 14.9249C14.2375 15.6123 13.3055 15.9989 12.3333 16ZM3.66667 2C3.22464 2 2.80072 2.17559 2.48816 2.48816C2.17559 2.80072 2 3.22464 2 3.66667V12.3333C2 12.7754 2.17559 13.1993 2.48816 13.5118C2.80072 13.8244 3.22464 14 3.66667 14H12.3333C12.7754 14 13.1993 13.8244 13.5118 13.5118C13.8244 13.1993 14 12.7754 14 12.3333V3.66667C14 3.22464 13.8244 2.80072 13.5118 2.48816C13.1993 2.17559 12.7754 2 12.3333 2H3.66667ZM12.6667 4.66667C12.6667 4.31304 12.5262 3.97391 12.2761 3.72386C12.0261 3.47381 11.687 3.33333 11.3333 3.33333H4.66667C4.31304 3.33333 3.97391 3.47381 3.72386 3.72386C3.47381 3.97391 3.33333 4.31304 3.33333 4.66667C3.33333 5.02029 3.47381 5.35943 3.72386 5.60948C3.97391 5.85952 4.31304 6 4.66667 6H11.3333C11.687 6 12.0261 5.85952 12.2761 5.60948C12.5262 5.35943 12.6667 5.02029 12.6667 4.66667ZM4.33333 7.66667C4.13555 7.66667 3.94221 7.72532 3.77776 7.8352C3.61331 7.94508 3.48514 8.10126 3.40945 8.28398C3.33377 8.46671 3.31396 8.66778 3.35255 8.86176C3.39113 9.05574 3.48637 9.23392 3.62623 9.37377C3.76608 9.51363 3.94426 9.60887 4.13824 9.64745C4.33222 9.68604 4.53329 9.66623 4.71602 9.59055C4.89874 9.51486 5.05492 9.38669 5.1648 9.22224C5.27468 9.05779 5.33333 8.86445 5.33333 8.66667C5.33333 8.40145 5.22798 8.1471 5.04044 7.95956C4.8529 7.77202 4.59855 7.66667 4.33333 7.66667ZM7.66667 7.66667C7.46889 7.66667 7.27555 7.72532 7.1111 7.8352C6.94665 7.94508 6.81847 8.10126 6.74279 8.28398C6.6671 8.46671 6.6473 8.66778 6.68588 8.86176C6.72447 9.05574 6.81971 9.23392 6.95956 9.37377C7.09941 9.51363 7.2776 9.60887 7.47158 9.64745C7.66556 9.68604 7.86662 9.66623 8.04935 9.59055C8.23208 9.51486 8.38826 9.38669 8.49814 9.22224C8.60802 9.05779 8.66667 8.86445 8.66667 8.66667C8.66667 8.40145 8.56131 8.1471 8.37377 7.95956C8.18624 7.77202 7.93188 7.66667 7.66667 7.66667ZM4.33333 10.6667C4.13555 10.6667 3.94221 10.7253 3.77776 10.8352C3.61331 10.9451 3.48514 11.1013 3.40945 11.284C3.33377 11.4667 3.31396 11.6678 3.35255 11.8618C3.39113 12.0557 3.48637 12.2339 3.62623 12.3738C3.76608 12.5136 3.94426 12.6089 4.13824 12.6475C4.33222 12.686 4.53329 12.6662 4.71602 12.5905C4.89874 12.5149 5.05492 12.3867 5.1648 12.2222C5.27468 12.0578 5.33333 11.8644 5.33333 11.6667C5.33333 11.4015 5.22798 11.1471 5.04044 10.9596C4.8529 10.772 4.59855 10.6667 4.33333 10.6667ZM7.66667 10.6667C7.46889 10.6667 7.27555 10.7253 7.1111 10.8352C6.94665 10.9451 6.81847 11.1013 6.74279 11.284C6.6671 11.4667 6.6473 11.6678 6.68588 11.8618C6.72447 12.0557 6.81971 12.2339 6.95956 12.3738C7.09941 12.5136 7.2776 12.6089 7.47158 12.6475C7.66556 12.686 7.86662 12.6662 8.04935 12.5905C8.23208 12.5149 8.38826 12.3867 8.49814 12.2222C8.60802 12.0578 8.66667 11.8644 8.66667 11.6667C8.66667 11.4015 8.56131 11.1471 8.37377 10.9596C8.18624 10.772 7.93188 10.6667 7.66667 10.6667ZM12.6667 11.6667C12.6667 11.4015 12.5613 11.1471 12.3738 10.9596C12.1862 10.772 11.9319 10.6667 11.6667 10.6667H11C10.7348 10.6667 10.4804 10.772 10.2929 10.9596C10.1054 11.1471 10 11.4015 10 11.6667C10 11.9319 10.1054 12.1862 10.2929 12.3738C10.4804 12.5613 10.7348 12.6667 11 12.6667H11.6667C11.9319 12.6667 12.1862 12.5613 12.3738 12.3738C12.5613 12.1862 12.6667 11.9319 12.6667 11.6667ZM12.6667 8.66667C12.6667 8.40145 12.5613 8.1471 12.3738 7.95956C12.1862 7.77202 11.9319 7.66667 11.6667 7.66667H11C10.7348 7.66667 10.4804 7.77202 10.2929 7.95956C10.1054 8.1471 10 8.40145 10 8.66667C10 8.93188 10.1054 9.18624 10.2929 9.37377C10.4804 9.56131 10.7348 9.66667 11 9.66667H11.6667C11.9319 9.66667 12.1862 9.56131 12.3738 9.37377C12.5613 9.18624 12.6667 8.93188 12.6667 8.66667Z"
      />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        fill="currentColor"
        fillOpacity={0.5}
        d="M13.125 7.93748L9.30337 4.11582C9.06887 3.88143 8.75087 3.7498 8.41932 3.74988C8.08778 3.74995 7.76984 3.88174 7.53545 4.11623C7.30107 4.35073 7.16944 4.66873 7.16951 5.00028C7.16959 5.33182 7.30137 5.64976 7.53587 5.88415L11.3575 9.70498C11.3963 9.74369 11.4271 9.78967 11.4481 9.84029C11.4691 9.89091 11.4799 9.94518 11.4799 9.99998C11.4799 10.0548 11.4691 10.1091 11.4481 10.1597C11.4271 10.2103 11.3963 10.2563 11.3575 10.295L7.53587 14.1158C7.30137 14.3502 7.16959 14.6681 7.16951 14.9997C7.16944 15.3312 7.30107 15.6492 7.53545 15.8837C7.76984 16.1182 8.08778 16.25 8.41932 16.2501C8.75087 16.2502 9.06887 16.1185 9.30337 15.8841L13.125 12.0625C13.6711 11.515 13.9777 10.7732 13.9777 9.99998C13.9777 9.22672 13.6711 8.48501 13.125 7.93748V7.93748Z"
      />
    </svg>
  )
}

// Beauty Calculator's permanent disabled-state pill (already shown this way
// in the design itself, not something this app added) — same "Dark/80%"
// style (BeautyNotes/p-14) as elsewhere, reusing --color-badge-bg-list/
// --color-text-product rather than new tokens since both already carry
// exactly this value (AllStepsView's own per-group pill; ProductCard's
// product-name ink — see their own tokens.css comments). Tap feedback for
// Bookmarks/"+"/"⋮" (not permanently-disabled rows like this one) now goes
// through Toast.tsx instead of a variant of this pill — see useToast below.
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
  /** Present → row is tappable and shows a chevron (My Products navigates;
   *  Bookmarks shows the "coming soon" Toast instead — see AccountScreen
   *  below). Omitted → the row is permanently inert with `trailing` shown
   *  in the chevron's place (Beauty Calculator's own already-disabled
   *  state). */
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
      className="flex w-full items-center gap-4 py-3 disabled:cursor-default"
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
 * 749:10533, "Home/Profile"). Three options: My Products (real, drills into
 * MyProductsScreen.tsx), Bookmarks (no destination screen designed yet —
 * tapping it shows the "coming soon" Toast, see useToast/Toast.tsx), and
 * Beauty Calculator (already shown disabled with a "Coming soon" pill in
 * the design itself). Same screen-level structure as HomeScreen.tsx's own
 * root (gradient bg, screen-edge margin tokens) since App.tsx renders this
 * as a sibling `Screen`, not an overlay over Home the way InfoOverlay.tsx
 * is.
 */
export function AccountScreen({ onClose, onOpenMyProducts }: AccountScreenProps) {
  const [toastOpen, showToast, hideToast] = useToast()

  return (
    <div
      className="relative mx-auto flex h-dvh w-full max-w-[402px] flex-col overflow-hidden md:h-full md:rounded-2xl md:py-6"
      style={{ background: 'var(--gradient-bg-home)' }}
    >
      <Toast open={toastOpen} onClose={hideToast} />
      <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden px-[--space-sm] pb-2 pt-[--space-2xs]">
        <div className="flex items-start justify-between">
          <p
            className="text-[20px] tracking-[-0.4px]"
            style={{ color: 'var(--color-info-overlay-heading)', fontWeight: 'var(--font-weight-medium)' }}
          >
            Account
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

        <div
          className="mt-6 flex w-full flex-col items-stretch rounded-[--radius-account-card] bg-white px-[--space-sm] py-[--space-2xs]"
          data-node-id="749:10542"
        >
          <AccountRow icon={<BoxIcon />} label="My Products" onClick={onOpenMyProducts} />
          <AccountRow icon={<BookmarkIcon />} label="Bookmarks" onClick={showToast} />
          <AccountRow icon={<CalculatorIcon />} label="Beauty Calculator" trailing={<ComingSoonPill />} />
        </div>
      </div>
    </div>
  )
}
