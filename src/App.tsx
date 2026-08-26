import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { EASE_OUT_QUART, TUTORIALS } from './components/TutorialCard'
import { HomeScreen } from './components/HomeScreen'
import { AccountScreen } from './components/AccountScreen'
import { MyProductsScreen } from './components/MyProductsScreen'
import { BookmarksScreen } from './components/BookmarksScreen'
import { TutorialFlow } from './TutorialFlow'

type Screen = 'home' | 'tutorial' | 'account' | 'my-products' | 'bookmarks'

// localStorage-backed saved-tutorial ids — lifted here (not owned inside
// TutorialCard.tsx's TutorialStack, where it used to live) for two reasons:
// BookmarksScreen is a sibling of HomeScreen, not a descendant, so it needs
// this state at a common ancestor either way; and TutorialStack's own state
// didn't even survive navigating Home → Account and back (it unmounts along
// with HomeScreen on every screen switch — see App.tsx's own conditional
// render below), which a real Bookmarks page would make immediately obvious
// as broken. Persisted to localStorage (not just lifted here as in-memory
// state) per the user's own call, so a bookmark actually survives a page
// reload, not just in-app navigation.
const SAVED_TUTORIALS_STORAGE_KEY = 'beautynotes:saved-tutorial-ids'

function readSavedTutorialIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SAVED_TUTORIALS_STORAGE_KEY)
    if (!raw) return new Set()
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? new Set(parsed.filter((id): id is string => typeof id === 'string')) : new Set()
  } catch {
    // Malformed JSON (hand-edited/corrupted storage) or localStorage itself
    // unavailable (private browsing in some browsers, storage disabled) —
    // either way, starting from "nothing saved" is the only sane fallback,
    // not a crash.
    return new Set()
  }
}

/** Home↔Tutorial slide — standard Framer Motion "directional navigation"
 *  recipe (AnimatePresence + a `custom` payload fed into per-key
 *  variants), not a bespoke invention: entering and exiting screens move
 *  in the *same* direction at once (forward: Tutorial slides in from the
 *  right while Home recedes to the left; backward: reversed), which is
 *  what makes it read as a real push/pop rather than "new screen covers
 *  old." Percent-based translateX (not pixels) — relative to each
 *  screen's own width, correct whether the layout is at its mobile
 *  max-w-[402px] column or some other size later. `EASE_OUT_QUART`
 *  (imported from TutorialCard.tsx — the shared JS-array form of
 *  tokens.css's --ease-out-quart, see its own doc comment) + 350ms
 *  (`--duration-layout`'s value, inlined since this file has no tokens of
 *  its own to import as CSS custom properties) — TutorialCard.tsx's own
 *  established "large layout/content change" pair, not invented for this.
 *
 *  `reduceMotion` is folded into the *same* `custom` payload (not a
 *  competing `style` override applied alongside `variants` — two things
 *  driving one CSS property is exactly the "never swap which value binds
 *  a style key" mistake TutorialCard.tsx's own bugs-fixed history already
 *  paid for once): under reduced motion, translateX stays pinned at 0%
 *  the whole time and opacity carries the swap instead (0 → 1 entering,
 *  1 → 0 exiting) — movement removed, a comprehension-aiding fade kept,
 *  same "fewer and gentler, not zero" call as the stack's own first-load
 *  entrance. Under normal motion it's the reverse emphasis: pure
 *  translateX, opacity pinned at 1 throughout, matching a native
 *  push/pop's own translate-only feel — no crossfade fighting the slide. */
const screenVariants = {
  enter: ({ direction, reduceMotion }: { direction: 1 | -1; reduceMotion: boolean }) => ({
    transform: `translateX(${reduceMotion ? 0 : direction * 100}%)`,
    opacity: reduceMotion ? 0 : 1,
  }),
  center: { transform: 'translateX(0%)', opacity: 1 },
  exit: ({ direction, reduceMotion }: { direction: 1 | -1; reduceMotion: boolean }) => ({
    transform: `translateX(${reduceMotion ? 0 : direction * -100}%)`,
    opacity: reduceMotion ? 0 : 1,
  }),
}

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  // 1 = forward (Home → Tutorial), -1 = backward (Tutorial → Home) — set
  // right alongside `screen` in the same two handlers, never read on its
  // own, so there's no case where a stale direction could apply to the
  // wrong transition.
  const [direction, setDirection] = useState<1 | -1>(1)
  const reduceMotion = useReducedMotion()

  // Lazy initializer (not a bare `new Set()`) so reading localStorage only
  // ever happens once, on mount — not on every re-render.
  const [savedTutorialIds, setSavedTutorialIds] = useState<Set<string>>(readSavedTutorialIds)

  useEffect(() => {
    try {
      localStorage.setItem(SAVED_TUTORIALS_STORAGE_KEY, JSON.stringify([...savedTutorialIds]))
    } catch {
      // Storage full/disabled — the toggle itself already succeeded in
      // memory for this session, silently failing to persist is the
      // correct degrade here, not surfacing an error for a background save.
    }
  }, [savedTutorialIds])

  function toggleSavedTutorial(id: string) {
    setSavedTutorialIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function goToTutorial() {
    setDirection(1)
    setScreen('tutorial')
  }
  function goToHome() {
    setDirection(-1)
    setScreen('home')
  }
  // Account/My Products form their own fixed 3-deep chain off Home (Home →
  // Account → My Products), not a generic screen stack — each pair below
  // just mirrors goToTutorial/goToHome's own explicit direction-setting
  // convention rather than introducing new machinery for what's only ever
  // these two extra hops.
  function goToAccount() {
    setDirection(1)
    setScreen('account')
  }
  function goToMyProducts() {
    setDirection(1)
    setScreen('my-products')
  }
  function goToAccountFromProducts() {
    setDirection(-1)
    setScreen('account')
  }
  function goToHomeFromAccount() {
    setDirection(-1)
    setScreen('home')
  }
  function goToBookmarks() {
    setDirection(1)
    setScreen('bookmarks')
  }
  function goToAccountFromBookmarks() {
    setDirection(-1)
    setScreen('account')
  }

  return (
    // Mobile (below md): the inner frame stays h-dvh (see each screen's own
    // root), filling the real viewport exactly — this outer div never gets
    // the chance to show its background or extra height, so it's a no-op
    // there, same as before.
    //
    // Desktop (md+): the inner frame switches to a fixed height instead
    // (md:h-full, sized by *this* wrapper's md:h-[874px] — 874px matches
    // the app's own design reference, see StepScreen's comment on the
    // Step_1 SVG export size), so it stops matching the browser window's
    // actual height and needs this wrapper to center it and show a visible
    // backdrop + shadow around it — otherwise it'd just be top-left content
    // on a blank page. md:py-10 keeps some breathing room on short windows
    // before md:max-h-[90dvh] (on the inner frame) kicks in to shrink it
    // instead of overflowing.
    // overflow-hidden (was overflow-x-hidden only) — belt and suspenders
    // against horizontal scroll/bounce (see index.css's global html/body
    // rule for the main fix and why), but the switch to the shorthand,
    // hiding *both* axes, is a real bug fix, not just tidying: setting only
    // overflow-x makes the CSS Overflow spec silently promote the other,
    // still-default axis from `visible` to `auto` (the exact same "latent
    // scrollable surface" gotcha AllStepsView.tsx's own scroll container and
    // HomeScreen.tsx's card stack already call out in their own comments,
    // just the mirrored axis here). Confirmed as a real, reproducible bug,
    // not just a defensive worry: at the md breakpoint this wrapper switches
    // to `md:justify-center md:py-10` (centering the fixed-height inner
    // frame with padding around it), and the accidental overflow-y:auto
    // made this wrapper itself a valid scroll target — a real mouse-wheel
    // scroll gesture anywhere over the app got captured by its own empty,
    // invisible scroll range instead of ever reaching AllStepsView's nested
    // overflow-y-auto list underneath, i.e. exactly the "can't scroll on
    // desktop" bug this was reported as. Verified via getComputedStyle
    // (overflowY read back as 'auto' despite no overflow-y class ever being
    // set) and by patching just that one property to 'hidden' at runtime,
    // which fixed desktop wheel-scrolling immediately. Below md this
    // wrapper is `min-h-dvh` with content that exactly fills it, so the same
    // accidental auto never had anything to actually scroll — that's why
    // this only ever showed up on desktop.
    <div className="flex min-h-dvh w-full flex-col items-center overflow-hidden bg-[--color-page-backdrop] md:justify-center md:py-10">
      {/* relative + overflow-hidden (already had the latter): the slide
          needs a positioned ancestor its own size to lay the entering/
          exiting screen's `absolute inset-0` against, and to actually
          clip whichever one is currently off to the side mid-transition —
          without overflow-hidden here the off-screen screen would show up
          in the page's own horizontal scroll/gutter for the transition's
          duration. */}
      <div className="relative h-dvh w-full max-w-[402px] overflow-hidden md:h-[874px] md:max-h-[90dvh] md:rounded-2xl md:shadow-[--shadow-page-frame]">
        <AnimatePresence initial={false} custom={{ direction, reduceMotion: !!reduceMotion }}>
          <motion.div
            key={screen}
            className="absolute inset-0"
            custom={{ direction, reduceMotion: !!reduceMotion }}
            variants={screenVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: reduceMotion ? 0.2 : 0.35, ease: EASE_OUT_QUART }}
          >
            {screen === 'home' && (
              <HomeScreen
                onSelectLook={goToTutorial}
                onOpenAccount={goToAccount}
                savedTutorialIds={savedTutorialIds}
                onToggleSavedTutorial={toggleSavedTutorial}
              />
            )}
            {screen === 'tutorial' && <TutorialFlow onExit={goToHome} />}
            {screen === 'account' && (
              <AccountScreen
                onClose={goToHomeFromAccount}
                onOpenMyProducts={goToMyProducts}
                onOpenBookmarks={goToBookmarks}
              />
            )}
            {screen === 'my-products' && <MyProductsScreen onClose={goToAccountFromProducts} />}
            {screen === 'bookmarks' && (
              <BookmarksScreen
                tutorials={TUTORIALS}
                savedTutorialIds={savedTutorialIds}
                onToggleSavedTutorial={toggleSavedTutorial}
                onClose={goToAccountFromBookmarks}
                // Same hand-off as HomeScreen's own card stack — see
                // TutorialStackProps' own comment: every tutorial ends up
                // routing to the one real TutorialFlow (Soft Smokey Eye's
                // steps) regardless of *which* card started it, so this
                // needs no argument telling it which bookmark was tapped.
                // BookmarksScreen itself decides whether a given tap should
                // call this at all (only tutorials with real content do).
                onOpenTutorial={goToTutorial}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default App
