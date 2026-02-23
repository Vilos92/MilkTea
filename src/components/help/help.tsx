import {useEffect} from 'preact/hooks';

import {useTranslate} from '../../provider/translation.tsx';
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
  overlayActive,
  overlaySplash,
  paragraph,
  paragraphSplash,
  section
} from './help.css.ts';

/*
 * Types.
 */

type HelpProps = {
  visualizerActive: boolean;
  onClose: () => void;
};

/*
 * Component.
 */

export function Help({onClose, visualizerActive}: HelpProps) {
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
          </ul>
        </section>
        <div class={closeRow}>
          <button type="button" class={closeBtnClass} onClick={onClose} aria-label={t('help.close')}>
            {t('help.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
