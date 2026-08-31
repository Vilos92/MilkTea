import {useTranslate} from '../../providers/translation';
import {Icon} from '../icon/icon';

import {helpButton, helpButtonAlwaysLight, helpButtonRoot} from './helpButton.css';

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
  const buttonClass = [helpButton, alwaysLight && helpButtonAlwaysLight].filter(Boolean).join(' ');
  const rootClass = className ? [helpButtonRoot, className].join(' ') : helpButtonRoot;

  return (
    <div class={rootClass}>
      <button
        type="button"
        class={buttonClass}
        data-active={active ? 'true' : undefined}
        onClick={onOpen}
        aria-label={t('common.help')}
        title={t('common.help')}
      >
        <Icon type="help" size="sm" />
      </button>
    </div>
  );
}
