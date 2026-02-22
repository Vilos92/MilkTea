import type {RefObject} from 'preact';
import {useEffect, useRef, useState} from 'preact/hooks';

import {
  btn,
  btnSolid,
  container,
  overlay,
  overlayHideCursor,
  overlaySplash,
  splashCutout,
  splashCutoutColumn,
  splashDisclaimer
} from './app.css.ts';
import {Controls} from './components/controls/controls.tsx';
import {Visualizer} from './components/visualizer/visualizer.tsx';
import {useButterchurn} from './hooks/useButterchurn.ts';
import {useReducedMotion} from './hooks/useReducedMotion.ts';

/*
 * App.
 */

export function App() {
  const reducedMotion = useReducedMotion();

  const overlayRef = useRef<HTMLDivElement>(null);

  const {containerRef, canvasRef, isCanvasFullscreen, toggleFullscreen, started, start, changePreset} =
    useButterchurn();
  const [controlsVisibility, setControlsVisibility] = useState(true);

  useEffect(() => {
    if (started) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        start();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [started, start]);

  return (
    <div ref={containerRef} class={container}>
      {renderOverlay(
        reducedMotion,
        overlayRef,
        started,
        start,
        isCanvasFullscreen,
        toggleFullscreen,
        controlsVisibility,
        setControlsVisibility,
        changePreset
      )}
      <Visualizer canvasRef={canvasRef} />
    </div>
  );
}

/*
 * Renderers.
 */

function renderOverlay(
  reducedMotion: boolean,
  overlayRef: RefObject<HTMLDivElement>,
  started: boolean,
  start: () => void,
  isCanvasFullscreen: boolean,
  toggleFullscreen: () => void,
  controlsVisible: boolean,
  setControlsVisibility: (visibility: boolean) => void,
  changePreset: (delta: number) => void
) {
  if (!started) {
    if (reducedMotion) {
      return (
        <div class={overlaySplash}>
          <div class={splashCutoutColumn}>
            <button type="button" onClick={start} class={btnSolid} aria-label="Start visuals">
              TESSELLATE
            </button>
            <p class={splashDisclaimer}>
              Given its unconventional interactions, this exhibit may not fully adhere to common accessibility
              expectations. Thank you for your understanding.
            </p>
            <p class={splashDisclaimer}>Click the button above to load the visual demonstration.</p>
          </div>
        </div>
      );
    }

    return (
      <div class={overlaySplash}>
        <div class={splashCutout}>
          <button type="button" onClick={start} class={btn} aria-label="Start visuals">
            TESSELLATE
          </button>
        </div>
      </div>
    );
  }

  const overlayClass = controlsVisible ? overlay : [overlay, overlayHideCursor].join(' ');
  return (
    <div ref={overlayRef} class={overlayClass}>
      <Controls
        overlayRef={overlayRef}
        isFullscreen={isCanvasFullscreen}
        toggleFullscreen={toggleFullscreen}
        changePreset={changePreset}
        setControlsVisibility={setControlsVisibility}
      />
    </div>
  );
}
