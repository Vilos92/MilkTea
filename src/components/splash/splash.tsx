import {useEffect} from 'preact/hooks';

import {useReducedMotion} from '../../hooks/useReducedMotion';
import {useLocaleContext} from '../../providers/locale';
import {useSettingsContext} from '../../providers/settings';
import {useTranslate} from '../../providers/translation';
import {useDragArea} from '../dragArea/useDragArea';
import {LocaleSwitcher} from '../locale/localeSwitcher';
import {ThemeToggle} from '../themeToggle/themeToggle';

import {
  btn,
  btnSolid,
  splashButtonContent,
  splashCutout,
  splashCutoutColumn,
  splashDisclaimer,
  splashDisclaimerBelowPreferences,
  splashDisclaimerBlock,
  splashPreferences,
  splashOverlay,
  splashSubtext,
  splashTitleLine
} from './splash.css';

/*
 * Types.
 */

type SplashProps = {
  start: () => void;
};

/*
 * Component.
 */

export function Splash({start}: SplashProps) {
  const reducedMotion = useReducedMotion();
  const t = useTranslate();
  const {isDragging} = useDragArea();
  const {shouldSkipSplashOnLoad} = useSettingsContext();

  useEffect(() => {
    if (shouldSkipSplashOnLoad) {
      start();
    }
  }, [shouldSkipSplashOnLoad, start]);

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
  const preferences = (
    <div class={splashPreferences}>
      <LocaleSwitcher />
      <ThemeToggle />
    </div>
  );

  if (reducedMotion) {
    return (
      <div class={splashOverlay}>
        <div class={splashCutoutColumn}>
          {!isDragging && (
            <>
              <button type="button" onClick={start} class={btnSolid} aria-label={t('splash.ariaStart')}>
                {splashLabel}
              </button>
              {preferences}
              <div class={splashDisclaimerBlock}>
                <p class={splashDisclaimer}>{t('splash.disclaimer1')}</p>
                <p class={splashDisclaimer}>{t('splash.disclaimer2')}</p>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div class={splashOverlay}>
      <div class={splashCutout}>
        {!isDragging && (
          <button type="button" onClick={start} class={btn} aria-label={t('splash.ariaStart')}>
            {splashLabel}
          </button>
        )}
      </div>
      {!isDragging && preferences}
      <p class={[splashDisclaimer, splashDisclaimerBelowPreferences].join(' ')}>{t('splash.disclaimer2')}</p>
    </div>
  );
}
