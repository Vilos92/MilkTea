import {useTranslate} from '../../providers/translation';
import {commandPaletteButton, commandPaletteButtonAlwaysLight} from './commandPaletteButton.css';

/*
 * Types.
 */

type CommandPaletteButtonProps = {
  class?: string;
  alwaysLight: boolean;
  onOpen: () => void;
};

/*
 * Component.
 */

export function CommandPaletteButton({class: className, alwaysLight, onOpen}: CommandPaletteButtonProps) {
  const t = useTranslate();
  const baseClass = alwaysLight
    ? [commandPaletteButton, commandPaletteButtonAlwaysLight].join(' ')
    : commandPaletteButton;
  const buttonClass = className ? [baseClass, className].join(' ') : baseClass;

  return (
    <button
      type="button"
      class={buttonClass}
      onClick={onOpen}
      aria-label={t('help.keySettingsAction')}
      title={t('help.keySettingsAction')}
    >
      &gt;_
    </button>
  );
}
