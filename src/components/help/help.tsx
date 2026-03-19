import {useEffect} from 'preact/hooks';

import {useHasFinePointer} from '../../hooks/useHasFinePointer';
import {isMac} from '../../lib/platform';
import {type Translate, useTranslate} from '../../providers/translation';
import {Icon} from '../icon/icon';
import {LocaleSwitcher} from '../locale/localeSwitcher';
import {closeBtnAdaptive, closeBtnDark, headingRow} from '../picker/picker.css';
import {
  actionCell,
  blueskyWrapActive,
  blueskyWrapSplash,
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
  const hasFinePointer = useHasFinePointer();

  const overlayClass = visualizerActive ? overlayActive : overlaySplash;
  const headingClass = visualizerActive ? heading : headingSplash;
  const paragraphClass = visualizerActive ? paragraph : paragraphSplash;
  const listClass = visualizerActive ? list : listSplash;
  const closeBtnClass = visualizerActive ? closeBtnDark : closeBtnAdaptive;

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
    <div class={overlayClass} role="dialog" aria-modal="true" aria-labelledby="help-title">
      <div class={content}>
        <div class={headingRow}>
          <h2 id="help-title" class={headingClass}>
            <Icon type="help" size="sm" />
            {t('common.help')}
          </h2>
          <button
            type="button"
            class={closeBtnClass}
            onClick={onClose}
            aria-label={t('common.close')}
            title={t('common.close')}
          >
            <Icon type="close" size="sm" />
          </button>
        </div>
        <div class={scrollArea}>
          <div class={localeRow}>
            <LocaleSwitcher />
          </div>
          <section class={section} aria-labelledby="help-about">
            <h2 id="help-about" class={headingClass}>
              {t('help.about')}
            </h2>
            <p class={paragraphClass}>{t('help.aboutText')}</p>
            <a
              href={`https://bsky.app/intent/compose?text=${encodeURIComponent(t('help.shareToBlueskyMessage'))}`}
              target="_blank"
              rel="noopener noreferrer"
              class={visualizerActive ? blueskyWrapActive : blueskyWrapSplash}
              title={t('common.shareToBluesky')}
              aria-label={t('common.shareToBluesky')}
            >
              <Icon type="bluesky" size="lg" />
            </a>
          </section>
          <section class={section} aria-labelledby={hasFinePointer ? 'help-hotkeys' : 'help-gestures'}>
            <h2 id={hasFinePointer ? 'help-hotkeys' : 'help-gestures'} class={headingClass}>
              {hasFinePointer ? t('help.hotkeys') : t('help.gestures')}
            </h2>
            <ul class={listClass}>
              {hasFinePointer ? renderDesktopHotkeys(t, isMac) : renderMobileHotkeys(t)}
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
      </div>
    </div>
  );
}

/*
 * Helpers.
 */

function renderMobileHotkeys(t: Translate): preact.VNode[] {
  return [
    <li class={hotkeyRow}>
      <span class={keyCell}>{t('help.swipePrevKeys')}</span>
      <span class={actionCell}>{t('help.swipePrevAction')}</span>
    </li>,
    <li class={hotkeyRow}>
      <span class={keyCell}>{t('help.swipeNextKeys')}</span>
      <span class={actionCell}>{t('help.swipeNextAction')}</span>
    </li>
  ];
}

function renderDesktopHotkeys(t: Translate, isMac: boolean): preact.VNode[] {
  return [
    <li class={hotkeyRow}>
      <span class={keyCell}>{t('help.keyHelpKeys')}</span>
      <span class={actionCell}>{t('help.keyHelpAction')}</span>
    </li>,
    <li class={hotkeyRow}>
      <span class={keyCell}>{t('help.keyPrevKeys')}</span>
      <span class={actionCell}>{t('help.keyPrevAction')}</span>
    </li>,
    <li class={hotkeyRow}>
      <span class={keyCell}>{t('help.keyNextKeys')}</span>
      <span class={actionCell}>{t('help.keyNextAction')}</span>
    </li>,
    <li class={hotkeyRow}>
      <span class={keyCell}>{t('help.keySemicolonKeys')}</span>
      <span class={actionCell}>{t('help.keySemicolonAction')}</span>
    </li>,
    <li class={hotkeyRow}>
      <span class={keyCell}>{t('help.keySpaceKeys')}</span>
      <span class={actionCell}>{t('help.keySpaceAction')}</span>
    </li>,
    <li class={hotkeyRow}>
      <span class={keyCell}>{t('help.keyFullscreenKeys')}</span>
      <span class={actionCell}>{t('help.keyFullscreenAction')}</span>
    </li>,
    renderCommandPaletteRow(t, isMac)
  ];
}

function renderCommandPaletteRow(t: Translate, isMac: boolean): preact.VNode {
  if (isMac) {
    return (
      <li class={hotkeyRow}>
        <span class={keyCell}>{t('help.keyCommandPaletteKeysMac')}</span>
        <span class={actionCell}>{t('help.keyCommandPaletteAction')}</span>
      </li>
    );
  }
  return (
    <li class={hotkeyRow}>
      <span class={keyCell}>{t('help.keyCommandPaletteKeysWindows')}</span>
      <span class={actionCell}>{t('help.keyCommandPaletteAction')}</span>
    </li>
  );
}
