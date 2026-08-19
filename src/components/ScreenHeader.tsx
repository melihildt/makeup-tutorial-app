import type { CSSProperties } from 'react'
import arrowLeftUrl from '../assets/icons/v2/arrow-left.svg'
import doneCheckUrl from '../assets/icons/v2/done-check.svg'
import searchEllipse1Url from '../assets/icons/v2/search-ellipse-1.svg'
import searchEllipse2Url from '../assets/icons/v2/search-ellipse-2.svg'
import searchHandleUrl from '../assets/icons/v2/search-handle.svg'
import widgetBar1Url from '../assets/icons/v2/widget-bar-1.svg'
import widgetBar2Url from '../assets/icons/v2/widget-bar-2.svg'

type ScreenHeaderProps = {
  /** Which view is currently showing — determines which of Search/Widget is highlighted. */
  activeView: 'step' | 'list'
  onBack?: () => void
  /** Search icon click — switches to the per-step view. */
  onSelectStepView?: () => void
  /** Widget icon click — switches to the All Steps list view (wired once that view exists). */
  onSelectListView?: () => void
  onDone?: () => void
}

function BackIcon() {
  return (
    <div className="relative h-[16.2px] w-[19.8px] shrink-0">
      <img src={arrowLeftUrl} alt="" className="absolute inset-0 block size-full max-w-none" />
    </div>
  )
}

function DoneIcon() {
  return (
    <div className="relative size-[32px]">
      <div
        className="absolute flex items-center justify-center"
        style={{ top: '25%', bottom: '29.17%', left: '20.83%', right: '25%', containerType: 'size' }}
      >
        <div className="flex-none" style={{ width: '100cqh', height: '100cqw', transform: 'rotate(90deg)' }}>
          <div className="relative size-full">
            <div className="absolute" style={{ inset: '-7.69% -5.68% -7.69% -9.09%' }}>
              <img src={doneCheckUrl} alt="" className="block size-full max-w-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SearchIcon() {
  return (
    <div className="relative size-[24px]">
      <div className="absolute" style={{ top: '16.67%', bottom: '25%', left: '16.67%', right: '25%' }}>
        <div className="absolute" style={{ inset: '-7.14%' }}>
          <img src={searchEllipse1Url} alt="" className="block size-full max-w-none" />
        </div>
      </div>
      <div className="absolute" style={{ inset: '33.33% 41.67% 41.67% 33.33%' }}>
        <div className="absolute" style={{ inset: '-16.67% 33.33% 33.33% -16.67%' }}>
          <img src={searchEllipse2Url} alt="" className="block size-full max-w-none" />
        </div>
      </div>
      <div className="absolute" style={{ inset: '70.83% 16.67% 16.67% 70.83%' }}>
        <div className="absolute" style={{ inset: '-33.33%' }}>
          <img src={searchHandleUrl} alt="" className="block size-full max-w-none" />
        </div>
      </div>
    </div>
  )
}

function WidgetIcon() {
  return (
    <div className="relative size-[24px]">
      {/* Top box outline — plain CSS border, no image in the source design. */}
      <div
        className="absolute rounded-[2px] border-2 border-solid"
        style={{
          top: '12.5%',
          bottom: '50%',
          left: '8.33%',
          right: '8.33%',
          borderColor: 'var(--color-text-primary)',
        }}
      />
      <div
        className="absolute flex items-center justify-center"
        style={{ top: '75%', bottom: '16.67%', left: '33.33%', right: '33.33%', containerType: 'size' }}
      >
        <div className="flex-none" style={{ width: '100cqw', height: '100cqh', transform: 'rotate(180deg) scaleX(-1)' }}>
          <div className="relative size-full">
            <div className="absolute" style={{ inset: '-50% -12.5% 0 -12.5%' }}>
              <img src={widgetBar1Url} alt="" className="block size-full max-w-none" />
            </div>
          </div>
        </div>
      </div>
      <div
        className="absolute flex items-center justify-center"
        style={{ inset: '58.33% 20.83% 33.33% 20.83%', containerType: 'size' }}
      >
        <div className="flex-none" style={{ width: '100cqw', height: '100cqh', transform: 'rotate(180deg) scaleX(-1)' }}>
          <div className="relative size-full">
            <div className="absolute" style={{ inset: '-50% -7.14% 0 -7.14%' }}>
              <img src={widgetBar2Url} alt="" className="block size-full max-w-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Shared top header for the per-step screens and the All Steps list view:
 * back button, a Search/Widget tab pair that switches between those two
 * views, and an icon-only Done button. Matches Figma's V2 header — see
 * docs/figma-v2-redesign.md.
 */
export function ScreenHeader({
  activeView,
  onBack,
  onSelectStepView,
  onSelectListView,
  onDone,
}: ScreenHeaderProps) {
  const isListView = activeView === 'list'

  return (
    <div className="flex w-full items-start justify-between px-[12px]">
      {/* No back button on the All Steps list view — it's reached by
          switching the Search/Widget toggle below, not by drilling in, so
          there's nothing to go "back" from. Kept as an equal-size spacer
          (rather than just omitted) so the toggle pill and Done button
          stay in the same spots as the per-step header. */}
      {isListView ? (
        <div className="size-[40px] shrink-0" aria-hidden="true" />
      ) : (
        <button
          type="button"
          onClick={onBack}
          className="flex size-[40px] shrink-0 items-center justify-center rounded-[--radius-pill]"
        >
          <BackIcon />
        </button>
      )}

      {/*
        Both icons are pinned to a fixed center point (20px / 65px from the
        left — i.e. half the highlight circle's diameter in from each edge
        of this 85px pill) via left/top + translate(-50%,-50%), so toggling
        which one is active never shifts either icon's own position — only
        the shared highlight circle (below) needs to move, by sliding
        between those same two fixed points. Sizing them from a shared flex
        row instead would shift the whole block — and both icons — sideways
        as the two buttons swapped size.
      */}
      <div className="relative h-[40px] w-[85px] shrink-0 rounded-[40px] bg-[rgba(255,255,255,0.2)]">
        {/* One shared highlight circle, not two independently-fading ones —
            it's positioned at the Search icon's center (left:20px) by
            default and translated the full 45px to the Widget icon's
            center (65-20) when list view is active, so it visibly *slides*
            between the two rather than crossfading in place. pointer-
            events-none + aria-hidden since it's purely decorative and sits
            behind both buttons in paint order (buttons come later in the
            DOM, so they still receive clicks/taps over it without needing
            an explicit z-index).

            This uses a CSS *animation* (--slide-from → --slide-to, defined
            in index.css), not a transition, and that's not a style
            preference — it's required here. TutorialFlow renders
            <StepScreen> and <AllStepsView> as two entirely separate trees
            (only one is ever mounted), so ScreenHeader itself is destroyed
            and recreated on every toggle, not updated in place. A
            transition needs the *same* element's computed style to change
            across two paints; this element never gets that; it's born
            already in its final position. An `animation` plays on mount
            regardless, so it's the only way to get real motion out of a
            component that's fully remounted every time — animate FROM the
            opposite slot TO this instance's actual slot, every time. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute size-[40px] rounded-full"
          style={
            {
              left: '20px',
              top: '20px',
              background: 'rgba(255,255,255,0.4)',
              '--slide-from': `${isListView ? 0 : 45}px`,
              '--slide-to': `${isListView ? 45 : 0}px`,
              animation: 'header-toggle-slide var(--duration-base) var(--ease-out-quart) forwards',
            } as CSSProperties
          }
        />
        <button
          type="button"
          onClick={onSelectStepView}
          aria-pressed={!isListView}
          className="absolute flex size-[40px] items-center justify-center rounded-full"
          style={{ left: '20px', top: '20px', transform: 'translate(-50%, -50%)' }}
        >
          {/* Same remount reasoning as the indicator above — animation, not
              transition, animating from the opposite opacity every mount. */}
          <span
            className="relative"
            style={
              {
                '--fade-from': isListView ? 1 : 0.3,
                '--fade-to': isListView ? 0.3 : 1,
                animation: 'header-toggle-fade var(--duration-base) var(--ease-out-quart) forwards',
              } as CSSProperties
            }
          >
            <SearchIcon />
          </span>
        </button>
        <button
          type="button"
          onClick={onSelectListView}
          aria-pressed={isListView}
          className="absolute flex size-[40px] items-center justify-center rounded-full"
          style={{ left: '65px', top: '20px', transform: 'translate(-50%, -50%)' }}
        >
          <span
            className="relative"
            style={
              {
                '--fade-from': isListView ? 0.3 : 1,
                '--fade-to': isListView ? 1 : 0.3,
                animation: 'header-toggle-fade var(--duration-base) var(--ease-out-quart) forwards',
              } as CSSProperties
            }
          >
            <WidgetIcon />
          </span>
        </button>
      </div>

      <button
        type="button"
        onClick={onDone}
        className="flex size-[40px] shrink-0 items-center justify-center rounded-[--radius-pill]"
      >
        <DoneIcon />
      </button>
    </div>
  )
}
