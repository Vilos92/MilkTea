import {useTranslate} from '../../providers/translation';
import {Icon} from '../icon/icon';

import {commandPaletteButton, commandPaletteButtonAlwaysLight} from './commandPaletteButton.css';

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
  const baseClass = [commandPaletteButton, alwaysLight && commandPaletteButtonAlwaysLight]
    .filter(Boolean)
    .join(' ');
  const buttonClass = className ? [baseClass, className].join(' ') : baseClass;

  return (
    <button
      type="button"
      class={buttonClass}
      data-active={active ? 'true' : undefined}
      onClick={onOpen}
      aria-label={t('help.keyCommandPaletteAction')}
      title={t('help.keyCommandPaletteAction')}
    >
      <Icon type="command-palette" size="sm" />
    </button>
  );
}
