import {useEffect} from 'preact/hooks';

import {useTranslate} from '../../providers/translation';
import {LocaleSwitcher} from '../locale/localeSwitcher';
import {
  actionCell,
  closeBtn,
  closeBtnSplash,
  closeRow,
  content,
  heading,
  headingSplash,
  hotkeyRow,
  keyCell,
  list,
  listSplash,
  localeRow,
  overlayActive,
  overlaySplash,
  paragraph,
  paragraphSplash,
  scrollArea,
  section
} from './help.css.ts';

/*
 * Types.
 */

type HelpProps = {
  visualizerActive: boolean;
  presetName: string | undefined;
  trackName: string | undefined;
  onClose: () => void;
};

/*
 * Component.
 */

export function Help({visualizerActive, presetName, trackName, onClose}: HelpProps) {
  const t = useTranslate();

  const overlayClass = visualizerActive ? overlayActive : overlaySplash;
  const headingClass = visualizerActive ? heading : headingSplash;
  const paragraphClass = visualizerActive ? paragraph : paragraphSplash;
  const listClass = visualizerActive ? list : listSplash;
  const closeBtnClass = visualizerActive ? closeBtn : closeBtnSplash;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div class={overlayClass} role="dialog" aria-modal="true" aria-labelledby="help-about">
      <div class={content}>
        <div class={scrollArea}>
          <div class={localeRow}>
            <LocaleSwitcher />
          </div>
          <section class={section} aria-labelledby="help-about">
            <h2 id="help-about" class={headingClass}>
              {t('help.about')}
            </h2>
            <p class={paragraphClass}>{t('help.aboutText')}</p>
          </section>
          <section class={section} aria-labelledby="help-hotkeys">
            <h2 id="help-hotkeys" class={headingClass}>
              {t('help.hotkeys')}
            </h2>
            <ul class={listClass}>
              <li class={hotkeyRow}>
                <span class={keyCell}>{t('help.keyHelpKeys')}</span>
                <span class={actionCell}>{t('help.keyHelpAction')}</span>
              </li>
              <li class={hotkeyRow}>
                <span class={keyCell}>{t('help.keyPrevKeys')}</span>
                <span class={actionCell}>{t('help.keyPrevAction')}</span>
              </li>
              <li class={hotkeyRow}>
                <span class={keyCell}>{t('help.keyNextKeys')}</span>
                <span class={actionCell}>{t('help.keyNextAction')}</span>
              </li>
              <li class={hotkeyRow}>
                <span class={keyCell}>{t('help.keyFullscreenKeys')}</span>
                <span class={actionCell}>{t('help.keyFullscreenAction')}</span>
              </li>
              <li class={hotkeyRow}>
                <span class={keyCell}>{t('help.keySettingsKeys')}</span>
                <span class={actionCell}>{t('help.keySettingsAction')}</span>
              </li>
            </ul>
          </section>
          {presetName && (
            <section class={section} aria-labelledby="help-preset-name">
              <h2 id="help-preset-name" class={headingClass}>
                {t('help.presetName')}
              </h2>
              <p class={paragraphClass}>{presetName}</p>
            </section>
          )}
          {trackName && (
            <section class={section} aria-labelledby="help-track-name">
              <h2 id="help-track-name" class={headingClass}>
                {t('help.trackName')}
              </h2>
              <p class={paragraphClass}>{trackName}</p>
            </section>
          )}
        </div>
        <div class={closeRow}>
          <button type="button" class={closeBtnClass} onClick={onClose} aria-label={t('help.close')}>
            {t('help.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
