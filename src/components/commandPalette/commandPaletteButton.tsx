import {useTranslate} from '../../providers/translation';
import {
  commandPaletteButton,
  commandPaletteButtonActive,
  commandPaletteButtonAlwaysLight,
  commandPaletteButtonAlwaysLightActive
} from './commandPaletteButton.css';

/*
 * Types.
 */

type CommandPaletteButtonProps = {
  class?: string;
  alwaysLight: boolean;
  active?: boolean;
  onOpen: () => void;
};

/*
 * Component.
 */

export function CommandPaletteButton({
  class: className,
  alwaysLight,
  active,
  onOpen
}: CommandPaletteButtonProps) {
  const t = useTranslate();
  const baseClass = [
    commandPaletteButton,
    alwaysLight && commandPaletteButtonAlwaysLight,
    active && (alwaysLight ? commandPaletteButtonAlwaysLightActive : commandPaletteButtonActive)
  ]
    .filter(Boolean)
    .join(' ');
  const buttonClass = className ? [baseClass, className].join(' ') : baseClass;

  return (
    <button
      type="button"
      class={buttonClass}
      onClick={onOpen}
      aria-label={t('help.keyCommandPaletteAction')}
      title={t('help.keyCommandPaletteAction')}
    >
      &gt;_
    </button>
  );
}
