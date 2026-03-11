import {useTranslate} from '../../providers/translation';
import {previewLabel, splashOverlay} from './splashOverlay.css';

/*
 * Component.
 */

export function SplashOverlay() {
  const t = useTranslate();

  return (
    <div class={splashOverlay}>
      <span class={previewLabel} aria-hidden="true">
        {t('splash.button')}
      </span>
    </div>
  );
}
