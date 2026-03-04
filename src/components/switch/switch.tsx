import {useId} from 'preact/hooks';

import * as styles from './switch.css.ts';

export type SwitchProps = {
  /** Controlled checked state */
  checked: boolean;
  /** Called with the next checked value when the user toggles */
  onChange: (checked: boolean) => void;
  /** Optional label rendered beside the switch */
  label?: string;
  /** Disables interaction */
  disabled?: boolean;
  /** Forwarded to the hidden <input>; defaults to a stable generated id */
  id?: string;
  /** Extra class applied to the root element */
  class?: string;
};

export function Switch({
  checked,
  onChange,
  label,
  disabled = false,
  id: idProp,
  class: className
}: SwitchProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;

  function handleClick() {
    if (!disabled) onChange(!checked);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleClick();
    }
  }

  return (
    <span
      class={[styles.root, className].filter(Boolean).join(' ')}
      // ARIA switch role is the semantic equivalent
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled || undefined}
      // data-* attrs drive all CSS state selectors
      data-checked={checked ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
      tabIndex={disabled ? -1 : 0}
      id={id}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <span class={styles.track} aria-hidden="true">
        <span class={styles.thumb} />
      </span>
      {label && <span class={styles.label}>{label}</span>}
    </span>
  );
}
