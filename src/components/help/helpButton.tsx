import {useEffect} from 'preact/hooks';

import {useTranslate} from '../../providers/translation';
import {
  helpButton,
  helpButtonActive,
  helpButtonAlwaysLight,
  helpButtonAlwaysLightActive,
  helpButtonRoot
} from './helpButton.css';

/*
 * Types.
 */

type HelpButtonProps = {
  class?: string;
  alwaysLight: boolean;
  active?: boolean;
  onOpen: () => void;
};

/*
 * Component.
 */

export function HelpButton({alwaysLight, active, onOpen, class: className}: HelpButtonProps) {
  const t = useTranslate();
  const buttonClass = [
    helpButton,
    alwaysLight && helpButtonAlwaysLight,
    active && (alwaysLight ? helpButtonAlwaysLightActive : helpButtonActive)
  ]
    .filter(Boolean)
    .join(' ');
  const rootClass = className ? [helpButtonRoot, className].join(' ') : helpButtonRoot;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '?' && !(event.key === '/' && event.shiftKey)) return;
      event.preventDefault();
      onOpen();
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [onOpen]);

  return (
    <div class={rootClass}>
      <button
        type="button"
        class={buttonClass}
        onClick={onOpen}
        aria-label={t('help.openLabel')}
        title={t('help.openLabel')}
      >
        ❓
      </button>
    </div>
  );
}
