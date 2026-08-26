import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { flushSync } from 'react-dom'
import { StepScreen } from './components/StepScreen'
import { AllStepsView } from './components/AllStepsView'

const LAST_MAKEUP_STEP = 7
const DONE_STEP = 8 // terminal "You're done!" screen — see docs/figma-v2-redesign.md

type View = 'step' | 'list'

/** Runs `updateState` (whatever state changes switch StepScreen<->
 *  AllStepsView, including but not limited to `setView`) inside the
 *  browser's View Transitions API when available, so the header's
 *  Search/Widget toggle highlight (`view-transition-name`, index.css) can
 *  visibly slide across the resulting unmount/remount instead of just
 *  snapping into place — see ScreenHeader.tsx's own comment on that
 *  element for the full reasoning on why a plain CSS `transition` can't
 *  do this on its own (StepScreen and AllStepsView are separate mounted
 *  trees, each with their own `<ScreenHeader>`).
 *
 *  `flushSync` forces React to actually commit `updateState`'s changes to
 *  the DOM synchronously inside `startViewTransition`'s callback —
 *  without it, React defers the real update to a later microtask, and the
 *  browser would capture its "after" snapshot before anything had
 *  actually changed yet (the well-documented pattern for combining React
 *  with this API).
 *
 *  Falls back to a plain, un-transitioned `updateState()` when
 *  `startViewTransition` isn't available (older Safari/Firefox — a
 *  graceful no-op, the exact same instant swap this already did before
 *  today) or when the user prefers reduced motion (checked directly via
 *  `matchMedia`, not Framer Motion's `useReducedMotion` — this file has
 *  no other Motion usage worth adding that import for just this one
 *  check). */
function switchViewWithTransition(updateState: () => void) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!document.startViewTransition || prefersReducedMotion) {
    updateState()
    return
  }
  document.startViewTransition(() => flushSync(updateState))
}

type TutorialFlowProps = {
  /** Called when the header's check/Done icon is tapped, on either view —
   *  hands control back to whatever's hosting the tutorial (the Home
   *  screen). Purely a "close/return" action for now, not a completion
   *  state — it fires the same regardless of which step the user is on. */
  onExit?: () => void
  /** Which makeup step (1-7) or the terminal "done" screen (8, see
   *  DONE_STEP) is showing. Lifted to App.tsx — not owned locally as it
   *  used to be — so the current step can double as this app's /stepN URL
   *  (see router.ts): App.tsx's own path-sync effect watches this value
   *  the same way it watches `screen`, and needs to be able to read it
   *  without TutorialFlow in between. `setStep` is passed straight through
   *  from App.tsx's own `useState` setter, so every existing call site
   *  below (Next/Back/Finish, and the list view's own jump-to-step) keeps
   *  working unchanged — only where the state itself lives moved. */
  step: number
  setStep: Dispatch<SetStateAction<number>>
}

/**
 * Owns the tutorial's current step and which view is showing (the
 * per-step screen or the All Steps list, toggled via the header's
 * Search/Widget icons). The bottom button on StepScreen moves to the next
 * step on steps 1-6; "Finish" (on step 7, or from the All Steps list)
 * advances to the step-8 "done" screen instead of a further makeup step.
 *
 * The card fade-out transition on Finish (per the Figma spec) isn't wired
 * yet — this just swaps content for now. See docs/figma-v2-redesign.md,
 * phase 5.
 */
export function TutorialFlow({ onExit, step, setStep }: TutorialFlowProps) {
  const [view, setView] = useState<View>('step')

  // Keyed by step + product (not just product identity), so the same
  // product appearing on multiple steps — e.g. "Merit Brush No. 2" on
  // steps 2, 3 and 5 — is tracked per occurrence rather than as one
  // shared checkbox. Owned here (not by StepScreen/AllStepsView
  // individually) so checking a product in either view shows up
  // checked in the other too.
  const [checkedOverrides, setCheckedOverrides] = useState<Record<string, boolean>>({})

  // Which product key was *just* toggled by an actual click, as opposed to
  // merely being re-rendered — e.g. every ProductCard remounts wholesale
  // when switching step/list view (TutorialFlow renders StepScreen and
  // AllStepsView as two separate trees), which would otherwise replay
  // CheckIndicator's mount-triggered draw-in/pop animation on every
  // already-checked item, not just the one that changed. Owned here
  // (rather than inside StepScreen/AllStepsView) because it has to survive
  // that same remount to mean anything — state local to either view would
  // just reset to nothing on every swap. Cleared automatically after the
  // animation's own duration so a later, unrelated remount (switching
  // views well after the click) never replays it.
  const [justToggledKey, setJustToggledKey] = useState<string | null>(null)

  useEffect(() => {
    if (justToggledKey === null) return
    // 260ms: covers --duration-base's 200ms (tokens.css) plus a small
    // buffer, so the timeout can't race ahead of the animation and clear
    // the flag mid-play — that would mean nothing since the animation's
    // own end-state and the resting look are identical (see
    // CheckIndicator.tsx), but it also wouldn't show as motion at all,
    // which defeats the point.
    const id = setTimeout(() => setJustToggledKey(null), 260)
    return () => clearTimeout(id)
  }, [justToggledKey])

  // The step of the most recent product toggled *while in list view* —
  // consumed (jumped to, then cleared) the next time the user switches
  // back to step view, so returning there lands on whatever step they
  // last actually touched in the list rather than wherever StepScreen
  // happened to be paused before they left it. Deliberately NOT set for
  // toggles made in step view itself (see the `view === 'list'` guard
  // below) — a toggle there doesn't need "remembering," you're already on
  // that step — and deliberately cleared once consumed, not left to
  // linger: without that, checking something in the list, returning to
  // step view, then navigating further with Next/Back, then visiting the
  // list again without touching anything would otherwise snap you back to
  // the stale earlier step instead of respecting the Next/Back navigation
  // that happened since.
  const [lastToggledStep, setLastToggledStep] = useState<number | null>(null)

  function toggleProduct(key: string, defaultChecked: boolean, toggledStep: number) {
    setCheckedOverrides((prev) => ({
      ...prev,
      [key]: !(prev[key] ?? defaultChecked),
    }))
    setJustToggledKey(key)
    if (view === 'list') {
      setLastToggledStep(toggledStep)
    }
  }

  function handleSelectStepView() {
    // All three state changes wrapped together (not just setView) — see
    // switchViewWithTransition's own comment on why: flushSync flushes
    // whatever's pending as one synchronous commit regardless of which
    // call is technically "inside" its callback, but wrapping all of them
    // here keeps that explicit rather than relying on batching semantics.
    switchViewWithTransition(() => {
      if (lastToggledStep !== null) {
        setStep(lastToggledStep)
        setLastToggledStep(null)
      }
      // Clear synchronously, not just after the 260ms timeout above — a
      // view switch is itself a full remount of every ProductCard (see
      // justToggledKey's own comment), so without this, switching views
      // within that 260ms window replays the animation on a row in the
      // *new* view that the user never actually touched there.
      setJustToggledKey(null)
      setView('step')
    })
  }

  function handleNextStep() {
    setStep((current) => Math.min(LAST_MAKEUP_STEP, current + 1))
  }

  function handleBack() {
    // Step 1 is the start of the tutorial, not just the first stop within
    // it — there's nowhere further back to go inside the flow, so back
    // from here means leaving the flow entirely, same destination as the
    // header's check/Done icon.
    if (step === 1) {
      onExit?.()
      return
    }
    setStep((current) => Math.max(1, current - 1))
  }

  function handleFinish() {
    setStep(DONE_STEP)
    setView('step')
  }

  if (view === 'list') {
    return (
      <AllStepsView
        checkedOverrides={checkedOverrides}
        justToggledKey={justToggledKey}
        onToggleChecked={toggleProduct}
        onBack={handleBack}
        onDone={onExit}
        onSelectStepView={handleSelectStepView}
        onFinish={handleFinish}
      />
    )
  }

  return (
    <StepScreen
      step={step}
      checkedOverrides={checkedOverrides}
      justToggledKey={justToggledKey}
      onToggleChecked={toggleProduct}
      onNextStep={handleNextStep}
      onFinish={handleFinish}
      onBack={handleBack}
      onDone={onExit}
      onSelectListView={() => {
        // See handleSelectStepView's own comment (same reasoning,
        // opposite direction).
        switchViewWithTransition(() => {
          setJustToggledKey(null)
          setView('list')
        })
      }}
    />
  )
}
