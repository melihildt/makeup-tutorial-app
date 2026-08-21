import { useState } from 'react'
import { HomeScreen } from './components/HomeScreen'
import { TutorialFlow } from './TutorialFlow'

type Screen = 'home' | 'tutorial'

function App() {
  const [screen, setScreen] = useState<Screen>('home')

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
      <div className="h-dvh w-full max-w-[402px] overflow-hidden md:h-[874px] md:max-h-[90dvh] md:rounded-2xl md:shadow-[--shadow-page-frame]">
        {screen === 'home' ? (
          <HomeScreen onSelectLook={() => setScreen('tutorial')} />
        ) : (
          <TutorialFlow onExit={() => setScreen('home')} />
        )}
      </div>
    </div>
  )
}

export default App
