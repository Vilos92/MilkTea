import type {RefObject} from 'preact';
import {useEffect, useRef, useState} from 'preact/hooks';

import {
  btn,
  btnSolid,
  container,
  containerSplash,
  containerStarted,
  overlay,
  overlayHideCursor,
  overlaySplash,
  splashButtonContent,
  splashCutout,
  splashCutoutColumn,
  splashDisclaimer,
  splashSubtext,
  splashTitleLine
} from './app.css.ts';
import {Controls} from './components/controls/controls.tsx';
import {LocaleSwitcher} from './components/locale/localeSwitcher.tsx';
import {Visualizer} from './components/visualizer/visualizer.tsx';
import {useButterchurn} from './hooks/useButterchurn.ts';
import {useReducedMotion} from './hooks/useReducedMotion.ts';
import {LocaleProvider, useLocaleContext} from './provider/locale.tsx';
import {TranslateProvider, useTranslate} from './provider/translation.tsx';

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
        <LocaleSwitcher alwaysLight={started} />
        <div ref={containerRef} class={[container, started ? containerStarted : containerSplash].join(' ')}>
          <Overlay
            reducedMotion={reducedMotion}
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
        </div>
      </TranslateProvider>
    </LocaleProvider>
  );
}

/*
 * Overlay (uses translate context for aria-labels and copy).
 */

type OverlayProps = {
  reducedMotion: boolean;
  overlayRef: RefObject<HTMLDivElement>;
  started: boolean;
  start: () => void;
  isCanvasFullscreen: boolean;
  toggleFullscreen: () => void;
  controlsVisible: boolean;
  setControlsVisibility: (visibility: boolean) => void;
  changePreset: (delta: number) => void;
};

function Overlay(props: OverlayProps) {
  const {
    reducedMotion,
    overlayRef,
    started,
    start,
    isCanvasFullscreen,
    toggleFullscreen,
    controlsVisible,
    setControlsVisibility,
    changePreset
  } = props;
  const t = useTranslate();
  const {locale} = useLocaleContext();
  const isEnglish = locale === 'en';
  const splashLabel = isEnglish ? (
    t('splash.button')
  ) : (
    <span class={splashButtonContent}>
      <span class={splashTitleLine}>{t('splash.button')}</span>
      <span class={splashSubtext}>MilkTea</span>
    </span>
  );

  if (!started) {
    if (reducedMotion) {
      return (
        <div class={overlaySplash}>
          <div class={splashCutoutColumn}>
            <button type="button" onClick={start} class={btnSolid} aria-label={t('splash.ariaStart')}>
              {splashLabel}
            </button>
            <p class={splashDisclaimer}>{t('splash.disclaimer1')}</p>
            <p class={splashDisclaimer}>{t('splash.disclaimer2')}</p>
          </div>
        </div>
      );
    }

    return (
      <div class={overlaySplash}>
        <div class={splashCutout}>
          <button type="button" onClick={start} class={btn} aria-label={t('splash.ariaStart')}>
            {splashLabel}
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
