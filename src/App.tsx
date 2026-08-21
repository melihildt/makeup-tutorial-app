import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { EASE_OUT_QUART } from './components/TutorialCard'
import { HomeScreen } from './components/HomeScreen'
import { TutorialFlow } from './TutorialFlow'

type Screen = 'home' | 'tutorial'

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

  function goToTutorial() {
    setDirection(1)
    setScreen('tutorial')
  }
  function goToHome() {
    setDirection(-1)
    setScreen('home')
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
    // overflow-x-hidden here too, not just the inner frame below — belt and
    // suspenders against horizontal scroll/bounce (see index.css's global
    // html/body rule for the main fix and why).
    <div className="flex min-h-dvh w-full flex-col items-center overflow-x-hidden bg-[--color-page-backdrop] md:justify-center md:py-10">
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
            {screen === 'home' ? <HomeScreen onSelectLook={goToTutorial} /> : <TutorialFlow onExit={goToHome} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default App
