import {root, thumb, track} from './switch.css.ts';

/*
 * Types.
 */

export type SwitchProps = {
  class?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
};

/*
 * Component.
 */

export function Switch({class: className, checked, onChange, label, disabled = false}: SwitchProps) {
  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <span
      class={[root, className].filter(Boolean).join(' ')}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-disabled={disabled || undefined}
      // `data-*` attributes drive all CSS state selectors.
      data-checked={checked ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <span class={track} aria-hidden="true">
        <span class={thumb} />
      </span>
    </span>
  );
}
