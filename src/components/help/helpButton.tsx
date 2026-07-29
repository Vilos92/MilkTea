import {useTranslate} from '../../providers/translation';
import {Icon} from '../icon/icon';

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

  return (
    <div class={rootClass}>
      <button
        type="button"
        class={buttonClass}
        onClick={onOpen}
        aria-label={t('common.help')}
        title={t('common.help')}
      >
        <Icon type="help" size="sm" />
      </button>
    </div>
  );
}
