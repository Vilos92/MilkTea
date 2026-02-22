import type {RefObject} from 'preact';
import {useRef, useState} from 'preact/hooks';

import {btn, container, overlay, overlayHideCursor} from './app.css.ts';
import {Controls} from './components/controls/controls.tsx';
import {Visualizer} from './components/visualizer/visualizer.tsx';
import {useButterchurn} from './hooks/useButterchurn.ts';

/*
 * App.
 */

export function App() {
  const overlayRef = useRef<HTMLDivElement>(null);

  const {containerRef, canvasRef, isCanvasFullscreen, toggleFullscreen, started, start, changePreset} =
    useButterchurn();
  const [controlsVisibility, setControlsVisibility] = useState(true);

  return (
    <div ref={containerRef} class={container}>
      {renderOverlay(
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
    return (
      <div class={overlay}>
        <button type="button" onClick={start} class={btn} aria-label="Start visuals">
          TESSELLATE
        </button>
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
