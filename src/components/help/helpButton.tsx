import {useEffect} from 'preact/hooks';

import {useTranslate} from '../../provider/translation';
import {helpButton, helpButtonAlwaysLight, helpButtonRoot, helpButtonRootInline} from './helpButton.css.ts';

/*
 * Types.
 */

type HelpButtonProps = {
  alwaysLight: boolean;
  setHelpOpen: (fn: (open: boolean) => boolean) => void;
  /** When true, root has no fixed position (for use inside leftCornerGroup). */
  inline?: boolean;
  class?: string;
};

/*
 * Component.
 */

export function HelpButton({alwaysLight, setHelpOpen, inline, class: className}: HelpButtonProps) {
  const t = useTranslate();
  const buttonClass = alwaysLight ? [helpButton, helpButtonAlwaysLight].join(' ') : helpButton;
  const root = inline ? helpButtonRootInline : helpButtonRoot;
  const rootClass = className ? [root, className].join(' ') : root;

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

type CommandPaletteButtonProps = {
  alwaysLight: boolean;
  onOpen: () => void;
  class?: string;
};

export function CommandPaletteButton({alwaysLight, onOpen, class: className}: CommandPaletteButtonProps) {
  const t = useTranslate();
  const buttonClass = alwaysLight ? [helpButton, helpButtonAlwaysLight].join(' ') : helpButton;
  return (
    <button
      type="button"
      class={className ? [buttonClass, className].join(' ') : buttonClass}
      onClick={onOpen}
      aria-label={t('help.keySettingsAction')}
      title={t('help.keySettingsAction')}
    >
      &gt;_
    </button>
  );
}
