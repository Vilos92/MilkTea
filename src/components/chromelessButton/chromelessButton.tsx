import type {ComponentProps, RefObject} from 'preact';
import {useCallback, useEffect, useRef, useState} from 'preact/hooks';

import {useHasFinePointer} from '../../hooks/useHasFinePointer';
import type {VibrationPattern} from '../../lib/vibrate';

import {chromeless} from './chromelessButton.css';

/*
 * Constants.
 */

const PRESS_FEEDBACK_MS = 50;

/*
 * Types.
 */

export type ChromelessButtonProps = Omit<
  ComponentProps<'button'>,
  'onPointerDown' | 'onPointerUp' | 'onPointerLeave' | 'type' | 'onClick' | 'ref'
> & {
  type?: 'button' | 'submit' | 'reset';
  buttonRef?: RefObject<HTMLButtonElement>;
  pressActiveClass?: string;
  /** If set, vibrates on `click` before your `onClick` runs (optimistic; skipped when `disabled`). */
  vibration?: VibrationPattern;
  onClick?: ComponentProps<'button'>['onClick'];
  onPointerDown?: (event: PointerEvent) => void;
  onPointerUp?: (event: PointerEvent) => void;
  onPointerLeave?: (event: PointerEvent) => void;
};

/*
 * Component.
 */

export function ChromelessButton({
  buttonRef,
  class: className,
  pressActiveClass,
  vibration,
  disabled,
  type = 'button',
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onClick,
  ...rest
}: ChromelessButtonProps) {
  const hasFinePointer = useHasFinePointer();
  const pressEnabled = !hasFinePointer;
  const [isPressActive, setIsPressActive] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPending = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => () => clearPending(), [clearPending]);

  const schedulePressInactive = useCallback(() => {
    clearPending();
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      setIsPressActive(false);
    }, PRESS_FEEDBACK_MS);
  }, [clearPending]);

  const handleClick = useCallback(
    (event: Parameters<NonNullable<ComponentProps<'button'>['onClick']>>[0]) => {
      if (!disabled && vibration != null) {
        navigator.vibrate?.(vibration);
      }
      onClick?.(event);
    },
    [onClick, disabled, vibration]
  );

  const handlePointerDown = useCallback(
    (event: PointerEvent) => {
      onPointerDown?.(event);
      if (disabled) {
        return;
      }
      if (!pressEnabled || event.pointerType === 'mouse') {
        return;
      }
      clearPending();
      setIsPressActive(true);
    },
    [onPointerDown, disabled, pressEnabled, clearPending]
  );

  const handlePointerUp = useCallback(
    (event: PointerEvent) => {
      onPointerUp?.(event);
      if (!pressEnabled || disabled) {
        return;
      }
      schedulePressInactive();
    },
    [onPointerUp, pressEnabled, disabled, schedulePressInactive]
  );

  const handlePointerLeave = useCallback(
    (event: PointerEvent) => {
      onPointerLeave?.(event);
      if (!pressEnabled || disabled) {
        return;
      }
      schedulePressInactive();
    },
    [onPointerLeave, pressEnabled, disabled, schedulePressInactive]
  );

  const mergedClass = [chromeless, className, pressActiveClass && isPressActive ? pressActiveClass : '']
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      {...rest}
      ref={buttonRef}
      class={mergedClass}
      disabled={disabled}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
    />
  );
}
