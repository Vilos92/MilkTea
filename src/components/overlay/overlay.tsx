import type {RefObject} from 'preact';
import {useEffect, useState} from 'preact/hooks';

import {useReducedMotion} from '../../hooks/useReducedMotion';
import {useLocaleContext} from '../../providers/locale';
import {useSettingsContext} from '../../providers/settings';
import {useTranslate} from '../../providers/translation';
import {faded} from '../../styles/util.css';
import {Controls} from '../controls/controls';
import {useDragArea} from '../dragArea/useDragArea';
import {
  btn,
  btnSolid,
  overlay,
  overlayHideCursor,
  overlaySplash,
  presetNameNotify,
  presetNameNotifyAtBottom,
  splashButtonContent,
  splashCutout,
  splashCutoutColumn,
  splashDisclaimer,
  splashSubtext,
  splashTitleLine,
  trackNameNotify
} from './overlay.css';

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
  presetName: string | undefined;
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
    presetName,
    changePreset,
    trackName
  } = props;
  const reducedMotion = useReducedMotion();
  const t = useTranslate();
  const {isDragging} = useDragArea();
  const {shouldShowPresetName, shouldShowTrackName} = useSettingsContext();

  const [displayedPreset, setDisplayedPreset] = useState<string | undefined>(undefined);
  const [isPresetFading, setIsPresetFading] = useState(false);
  const [displayedTrack, setDisplayedTrack] = useState<string | undefined>(undefined);
  const [isTrackFading, setIsTrackFading] = useState(false);

  useEffect(() => {
    if (presetName === undefined) return;
    setDisplayedPreset(presetName);

    setIsPresetFading(false);
    const id = setTimeout(() => setIsPresetFading(true), 2500);
    return () => clearTimeout(id);
  }, [presetName]);

  const handlePresetNameTransitionEnd = () => {
    if (isPresetFading) {
      setDisplayedPreset(undefined);
    }
  };

  useEffect(() => {
    if (trackName === undefined) return;
    setDisplayedTrack(trackName);

    setIsTrackFading(false);
    const id = setTimeout(() => setIsTrackFading(true), 2500);
    return () => clearTimeout(id);
  }, [trackName]);

  const handleTrackNameTransitionEnd = () => {
    if (isTrackFading) {
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
    ? [trackNameNotify, isTrackFading ? faded : ''].filter(Boolean).join(' ')
    : '';
  const presetClass = displayedPreset
    ? [presetNameNotify, controlsVisible ? '' : presetNameNotifyAtBottom, isPresetFading ? faded : '']
        .filter(Boolean)
        .join(' ')
    : '';

  return (
    <div ref={overlayRef} class={overlayClass}>
      {shouldShowTrackName && displayedTrack && (
        <div
          class={trackNameClass}
          onTransitionEnd={handleTrackNameTransitionEnd}
          role="status"
          aria-live="polite"
        >
          {displayedTrack}
        </div>
      )}
      {shouldShowPresetName && displayedPreset && (
        <div
          class={presetClass}
          onTransitionEnd={handlePresetNameTransitionEnd}
          role="status"
          aria-live="polite"
        >
          {displayedPreset}
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
