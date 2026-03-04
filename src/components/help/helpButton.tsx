import {useEffect} from 'preact/hooks';

import {useTranslate} from '../../providers/translation';
import {helpButton, helpButtonAlwaysLight, helpButtonRoot} from './helpButton.css';

/*
 * Types.
 */

type HelpButtonProps = {
  class?: string;
  alwaysLight: boolean;
  setHelpOpen: (fn: (open: boolean) => boolean) => void;
};

/*
 * Component.
 */

export function HelpButton({alwaysLight, setHelpOpen, class: className}: HelpButtonProps) {
  const t = useTranslate();
  const buttonClass = alwaysLight ? [helpButton, helpButtonAlwaysLight].join(' ') : helpButton;
  const rootClass = className ? [helpButtonRoot, className].join(' ') : helpButtonRoot;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '?' && !(event.key === '/' && event.shiftKey)) return;
      event.preventDefault();
      setHelpOpen(open => !open);
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [setHelpOpen]);

  return (
    <div class={rootClass}>
      <button
        type="button"
        class={buttonClass}
        onClick={() => setHelpOpen(open => !open)}
        aria-label={t('help.openLabel')}
        title={t('help.openLabel')}
      >
        ❓
      </button>
    </div>
  );
}
