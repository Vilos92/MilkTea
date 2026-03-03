import type {RefObject} from 'preact';
import {useEffect, useState} from 'preact/hooks';

import {useReducedMotion} from '../../hooks/useReducedMotion';
import {useLocaleContext} from '../../provider/locale';
import {useTranslate} from '../../provider/translation';
import {Controls} from '../controls/controls';
import {useDragArea} from '../dragArea/useDragArea';
import {
  btn,
  btnSolid,
  overlay,
  overlayHideCursor,
  overlaySplash,
  splashButtonContent,
  splashCutout,
  splashCutoutColumn,
  splashDisclaimer,
  splashSubtext,
  splashTitleLine,
  trackNameLabel,
  trackNameLabelFading
} from './overlay.css.ts';

/*
 * Types.
 */

export type OverlayProps = {
  overlayRef: RefObject<HTMLDivElement>;
  started: boolean;
  start: () => void;
  isCanvasFullscreen: boolean;
  toggleFullscreen: () => void;
  controlsVisible: boolean;
  setControlsVisibility: (visibility: boolean) => void;
  changePreset: (delta: number) => void;
  trackName: string | undefined;
};

/*
 * Component.
 */

export function Overlay(props: OverlayProps) {
  const {
    overlayRef,
    started,
    start,
    isCanvasFullscreen,
    toggleFullscreen,
    controlsVisible,
    setControlsVisibility,
    changePreset,
    trackName
  } = props;
  const reducedMotion = useReducedMotion();
  const t = useTranslate();
  const {isDragging} = useDragArea();

  const [displayedTrack, setDisplayedTrack] = useState<string | undefined>(undefined);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (trackName === undefined) return;
    setDisplayedTrack(trackName);

    setIsFading(false);
    const id = setTimeout(() => setIsFading(true), 2500);
    return () => clearTimeout(id);
  }, [trackName]);

  const handleTrackNameTransitionEnd = () => {
    if (isFading) {
      setDisplayedTrack(undefined);
    }
  };

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

  if (!started && reducedMotion) {
    return (
      <div class={overlaySplash}>
        <div class={splashCutoutColumn}>
          {!isDragging && (
            <>
              <button type="button" onClick={start} class={btnSolid} aria-label={t('splash.ariaStart')}>
                {splashLabel}
              </button>
              <p class={splashDisclaimer}>{t('splash.disclaimer1')}</p>
              <p class={splashDisclaimer}>{t('splash.disclaimer2')}</p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div class={overlaySplash}>
        <div class={splashCutout}>
          {!isDragging && (
            <button type="button" onClick={start} class={btn} aria-label={t('splash.ariaStart')}>
              {splashLabel}
            </button>
          )}
        </div>
      </div>
    );
  }

  const overlayClass = controlsVisible ? overlay : [overlay, overlayHideCursor].join(' ');
  const trackNameClass = displayedTrack
    ? [trackNameLabel, isFading ? trackNameLabelFading : ''].filter(Boolean).join(' ')
    : '';

  return (
    <div ref={overlayRef} class={overlayClass}>
      {displayedTrack && (
        <div
          class={trackNameClass}
          onTransitionEnd={handleTrackNameTransitionEnd}
          role="status"
          aria-live="polite"
        >
          {displayedTrack}
        </div>
      )}
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
