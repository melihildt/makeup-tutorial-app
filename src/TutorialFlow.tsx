import { useEffect, useState } from 'react'
import { StepScreen } from './components/StepScreen'
import { AllStepsView } from './components/AllStepsView'

const LAST_MAKEUP_STEP = 7
const DONE_STEP = 8 // terminal "You're done!" screen — see docs/figma-v2-redesign.md

type View = 'step' | 'list'

type TutorialFlowProps = {
  /** Called when the header's check/Done icon is tapped, on either view —
   *  hands control back to whatever's hosting the tutorial (the Home
   *  screen). Purely a "close/return" action for now, not a completion
   *  state — it fires the same regardless of which step the user is on. */
  onExit?: () => void
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
export function TutorialFlow({ onExit }: TutorialFlowProps) {
  const [step, setStep] = useState(1)
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
    if (lastToggledStep !== null) {
      setStep(lastToggledStep)
      setLastToggledStep(null)
    }
    setView('step')
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
      onSelectListView={() => setView('list')}
    />
  )
}
