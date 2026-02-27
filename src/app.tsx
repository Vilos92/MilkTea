import {useEffect, useRef, useState} from 'preact/hooks';

import {
  container,
  containerSplash,
  containerStarted,
  topCorner,
  topFaded,
  topLeftCorner,
  topRightCorner,
  topVisible
} from './app.css.ts';
import {DragArea} from './components/dragArea/dragArea.tsx';
import {Help} from './components/help/help.tsx';
import {HelpButton} from './components/help/helpButton.tsx';
import {LocaleSwitcher} from './components/locale/localeSwitcher.tsx';
import {Overlay} from './components/overlay/overlay.tsx';
import {Visualizer} from './components/visualizer/visualizer.tsx';
import {useButterchurn} from './hooks/useButterchurn.ts';
import {LocaleProvider} from './provider/locale.tsx';
import {TranslateProvider} from './provider/translation.tsx';

/*
 * App.
 */

export function App() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const {containerRef, canvasRef, isCanvasFullscreen, toggleFullscreen, started, start, changePreset} =
    useButterchurn();
  const [controlsVisibility, setControlsVisibility] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    if (started) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        start();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [started, start]);

  return (
    <LocaleProvider>
      <TranslateProvider>
        <DragArea>
          <div ref={containerRef} class={[container, started ? containerStarted : containerSplash].join(' ')}>
            <Overlay
              overlayRef={overlayRef}
              started={started}
              start={start}
              isCanvasFullscreen={isCanvasFullscreen}
              toggleFullscreen={toggleFullscreen}
              controlsVisible={controlsVisibility}
              setControlsVisibility={setControlsVisibility}
              changePreset={changePreset}
            />
            <Visualizer canvasRef={canvasRef} />

            <HelpButton
              class={[topCorner, topLeftCorner, controlsVisibility || !started ? topVisible : topFaded].join(
                ' '
              )}
              alwaysLight={started}
              setHelpOpen={setHelpOpen}
            />
            <LocaleSwitcher
              class={[topCorner, topRightCorner, controlsVisibility || !started ? topVisible : topFaded].join(
                ' '
              )}
              alwaysLight={started}
            />

            {helpOpen && <Help visualizerActive={started} onClose={() => setHelpOpen(false)} />}
          </div>
        </DragArea>
      </TranslateProvider>
    </LocaleProvider>
  );
}
