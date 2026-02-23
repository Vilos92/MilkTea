import type {RefObject} from 'preact';

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
  splashTitleLine
} from './overlay.css.ts';
import {useReducedMotion} from '../../hooks/useReducedMotion.ts';
import {useLocaleContext} from '../../provider/locale.tsx';
import {useTranslate} from '../../provider/translation.tsx';
import {Controls} from '../controls/controls.tsx';

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
    changePreset
  } = props;
  const reducedMotion = useReducedMotion();
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

  if (!started && reducedMotion) {
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

  if (!started) {
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
