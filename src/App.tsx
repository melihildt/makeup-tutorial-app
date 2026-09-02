import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { DURATION, EASE_OUT_QUART, TUTORIALS, toggleInSet } from './components/TutorialCard'
import { HomeScreen } from './components/HomeScreen'
import { AccountScreen } from './components/AccountScreen'
import { MyProductsScreen } from './components/MyProductsScreen'
import { BookmarksScreen } from './components/BookmarksScreen'
import { TutorialFlow } from './TutorialFlow'
import { type Screen, type TutorialOrigin, parseRoute, pathForRoute } from './router'

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
  // Seeded from the URL the app was loaded with (see router.ts) — each
  // lazy initializer runs once, on mount, so a direct load of e.g.
  // /step5 or /profile lands straight on that screen instead of always
  // starting at Home and needing a client-side redirect. Three separate
  // `useState`s (not one RouteState struct) because `tutorialStep` and
  // `aboutOpen` are each fed straight through as (mostly) ordinary props to
  // TutorialFlow/HomeScreen — see their own comments — the same shape they
  // already had before routing existed, just lifted one level.
  const [screen, setScreen] = useState<Screen>(() => parseRoute(window.location.pathname + window.location.search).screen)
  const [tutorialStep, setTutorialStep] = useState<number>(
    () => parseRoute(window.location.pathname + window.location.search).tutorialStep,
  )
  const [aboutOpen, setAboutOpen] = useState<boolean>(
    () => parseRoute(window.location.pathname + window.location.search).aboutOpen,
  )
  // Where exiting the tutorial should land — 'home' for the common case
  // (opened from HomeScreen's own card stack), 'bookmarks' when it was
  // opened by tapping a saved look on BookmarksScreen instead (per the
  // user's own ask: exiting there should return to Bookmarks, not always
  // Home). Not a generic back-stack — this app doesn't have one anywhere
  // else either (Account/My Products/Bookmarks below are each a fixed hop,
  // not a push/pop stack) — just enough state for this one specific
  // "same destination, two possible origins" case. Set by whichever
  // goToTutorial* function is actually called, read once by exitTutorial.
  //
  // Seeded from the URL like the other three (code review finding): this
  // used to be a bare `useState('home')` with no URL round-trip at all, so
  // a page reload taken mid-tutorial had no way to recover which origin was
  // in play and silently reset to 'home' — reloading a `/step3` reached
  // from Bookmarks, then tapping Exit, landed on Home instead of back on
  // Bookmarks. See router.ts's TutorialOrigin/`?from=` for the URL side.
  const [tutorialOrigin, setTutorialOrigin] = useState<TutorialOrigin>(
    () => parseRoute(window.location.pathname + window.location.search).tutorialOrigin,
  )
  // 1 = forward (Home → Tutorial), -1 = backward (Tutorial → Home) — set
  // right alongside `screen` in the same handlers, never read on its own,
  // so there's no case where a stale direction could apply to the wrong
  // transition. (The popstate handler below is the one exception: it
  // infers direction from the browser's own back/forward instead.)
  const [direction, setDirection] = useState<1 | -1>(1)
  const reduceMotion = useReducedMotion()

  // --- URL <-> state sync -------------------------------------------------
  //
  // One direction (state -> URL) is a single effect below that watches
  // {screen, tutorialStep, tutorialOrigin, aboutOpen} and keeps
  // `location.pathname` (+ search, for tutorialOrigin's `?from=`) in
  // step via pathForRoute — every forward navigation in this file (goTo*)
  // just sets state as it always did; it doesn't need to know about the
  // router at all, this effect is the only thing that ever calls
  // `pushState`. The other direction (URL -> state, i.e. the browser's own
  // Back/Forward buttons) is the `popstate` listener further down.
  //
  // `historyOrderRef` tags every entry *this app itself* pushes with an
  // incrementing counter (stored in `history.state.order`), and tracks the
  // current one — the only thing it's used for is telling forward from
  // backward on a `popstate` (comparing the popped-to order against the
  // last known one; plain string-diffing the paths can't do this, siblings
  // like /profile and /bookmarks don't order themselves).
  const historyOrderRef = useRef(0)
  // Sets while a state update is *already* reflected in the URL — either
  // the very first render (the URL we just parsed the initial state from)
  // or a `popstate`-driven update (the browser already moved
  // `location.pathname` before that event fires) — so the sync effect
  // below can skip pushing a redundant/duplicate entry for it.
  const skipNextPushRef = useRef(true)

  useEffect(() => {
    function handlePopState(event: PopStateEvent) {
      const order = event.state && typeof event.state.order === 'number' ? event.state.order : 0
      setDirection(order < historyOrderRef.current ? -1 : 1)
      historyOrderRef.current = order
      skipNextPushRef.current = true
      const route = parseRoute(window.location.pathname + window.location.search)
      setScreen(route.screen)
      setTutorialStep(route.tutorialStep)
      setTutorialOrigin(route.tutorialOrigin)
      setAboutOpen(route.aboutOpen)
    }
    window.addEventListener('popstate', handlePopState)
    // Tags the entry the app loaded on with a real timestamp, not a reset-
    // to-0 counter (code review finding): a per-load counter starting over
    // at 0 on every reload collides with whatever order value older
    // entries already sitting in `history` — pushed by this same app
    // during a *previous* page load, and still carrying their own real
    // order — happen to have. The first native Back after a reload pops to
    // one of those, and `order < historyOrderRef.current` compared a stale
    // higher order against the freshly-reset 0, misreading an actual Back
    // as forward. Date.now() doesn't have that problem: it keeps
    // increasing across a reload the same way it does within one session,
    // so any entry tagged now is guaranteed to compare correctly against
    // one tagged before the reload, with nothing needing to persist
    // anywhere for that to hold.
    historyOrderRef.current = Date.now()
    window.history.replaceState({ order: historyOrderRef.current }, '', window.location.pathname + window.location.search)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (skipNextPushRef.current) {
      skipNextPushRef.current = false
      return
    }
    const path = pathForRoute({ screen, tutorialStep, tutorialOrigin, aboutOpen })
    if (path === window.location.pathname + window.location.search) return
    historyOrderRef.current = Date.now()
    window.history.pushState({ order: historyOrderRef.current }, '', path)
  }, [screen, tutorialStep, tutorialOrigin, aboutOpen])

  // Every "leave this screen" action below (Account's close button,
  // Tutorial's exit, etc.) sets `screen` directly and lets the sync effect
  // above push a fresh URL for it — deliberately NOT `window.history.back()`,
  // even though that reads like the more "correct" way to implement a close
  // button. It isn't, here: this app doesn't reliably know it's exactly one
  // real history entry back to where it should land. That's obviously true
  // for the tutorial (Next/Back pushes one entry *per step*, so a Done tap
  // from step 4 needs to leave the flow entirely, not pop back to step 3 —
  // see exitTutorial below), but it was ALSO a real, confirmed bug for the
  // "simple" one-hop screens: Bookmarks → tutorial → tap the header's Done
  // icon pushes a fresh /bookmarks entry (since exitTutorial can't assume
  // how many step-entries preceded it either), which means the *real*
  // previous entry immediately behind that new /bookmarks in `history` is
  // now the tutorial itself, not Account — so Bookmarks' own close button,
  // if it called `history.back()`, would pop back into the tutorial instead
  // of Account, and every retry after that looped the same way, with no
  // path back to Home at all. Setting state directly and always pushing a
  // fresh entry sidesteps the whole class of bug: every close/back button
  // here lands on exactly the screen it names, regardless of how deep or
  // unusual the path that got here was. The one real cost is that the
  // browser's native Back button can retrace more steps than feels
  // necessary to fully leave the app — an acceptable trade for actually
  // working every time.

  // Lazy initializer (not a bare `new Set()`) so reading localStorage only
  // ever happens once, on mount — not on every re-render.
  const [savedTutorialIds, setSavedTutorialIds] = useState<Set<string>>(readSavedTutorialIds)

  // Code review finding, deferred: no cross-tab sync — this effect
  // unconditionally overwrites the whole key with whatever's in memory, so
  // two tabs open at once can silently clobber each other's saves (last
  // write wins, no `storage` event listener reconciling them). Not fixed
  // here: it'd add a genuinely new code path (a listener that can trigger
  // a re-render from an event source that didn't exist before) for a
  // multi-tab scenario this personal, single-user app doesn't really have
  // — revisit if that stops being true.
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
    setSavedTutorialIds((prev) => toggleInSet(prev, id))
  }

  // Default param (not two near-identical functions, code review finding)
  // — `origin` defaults to 'home' so this still works as a bare no-arg
  // callback everywhere it's passed as one (HomeScreen's onSelectLook is
  // invoked as `onSelect?.()`, no arguments); BookmarksScreen's own
  // onOpenTutorial wraps this in `() => goToTutorial('bookmarks')` instead
  // since it needs to pass the one non-default value.
  function goToTutorial(origin: TutorialOrigin = 'home') {
    setTutorialOrigin(origin)
    setDirection(1)
    setScreen('tutorial')
    // Always restart at step 1, even if a previous tutorial session (in the
    // same page load) had advanced tutorialStep further — TutorialFlow used
    // to get this for free by being fully unmounted/remounted on every
    // screen switch; lifting `step` up to here (so it can double as the
    // /stepN URL — see its own prop comment on TutorialFlow) means that
    // reset no longer happens automatically and has to be explicit here.
    setTutorialStep(1)
  }
  function exitTutorial() {
    // Always lands on `tutorialOrigin` directly (see the comment above on
    // why this isn't history.back()) regardless of which step the header's
    // Done/X icon was tapped from, or how many step-entries piled up
    // getting there.
    setDirection(-1)
    setScreen(tutorialOrigin)
  }
  // Account/My Products form their own fixed 3-deep chain off Home (Home →
  // Account → My Products), not a generic screen stack — every hop below,
  // forward or backward, just sets `screen` (+ `direction`) directly and
  // lets the sync effect push the URL for it (see that comment above).
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
            transition={{ duration: reduceMotion ? DURATION.base : DURATION.layout, ease: EASE_OUT_QUART }}
          >
            {screen === 'home' && (
              <HomeScreen
                onSelectLook={goToTutorial}
                onOpenAccount={goToAccount}
                savedTutorialIds={savedTutorialIds}
                onToggleSavedTutorial={toggleSavedTutorial}
                infoOpen={aboutOpen}
                onInfoOpenChange={setAboutOpen}
              />
            )}
            {screen === 'tutorial' && (
              <TutorialFlow onExit={exitTutorial} step={tutorialStep} setStep={setTutorialStep} />
            )}
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
                // 'bookmarks' origin — see tutorialOrigin's own comment
                // above: marks the exit as returning to Bookmarks instead
                // of Home. Otherwise the same hand-off as HomeScreen's own
                // card stack (see TutorialStackProps' own comment: every
                // tutorial routes to the one real TutorialFlow regardless
                // of *which* card started it, so this needs no argument
                // telling it which bookmark was tapped). BookmarksScreen
                // itself decides whether a given tap should call this at
                // all (only tutorials with real content do).
                onOpenTutorial={() => goToTutorial('bookmarks')}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default App
