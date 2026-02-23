import {useEffect} from 'preact/hooks';

import {useTranslate} from '../../provider/translation.tsx';
import {helpButton, helpButtonAlwaysLight, helpButtonRoot} from './helpButton.css.ts';

/*
 * Types.
 */

type HelpButtonProps = {
  alwaysLight: boolean;
  setHelpOpen: (fn: (open: boolean) => boolean) => void;
  class?: string;
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
