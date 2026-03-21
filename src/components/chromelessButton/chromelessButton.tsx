import type {ComponentProps} from 'preact';
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
  'onPointerDown' | 'onPointerUp' | 'onPointerLeave' | 'type' | 'onClick'
> & {
  type?: 'button' | 'submit' | 'reset';
  pressActiveClass?: string;
  vibration?: VibrationPattern;
  /**
   * `pointerdown`: haptic as soon as the finger touches (can fire during scroll gestures).
   * `click`: haptic only when the button activates (skips touch-scroll that never produces a click).
   */
  vibrationTrigger?: 'pointerdown' | 'click';
  onClick?: ComponentProps<'button'>['onClick'];
  onPointerDown?: (event: PointerEvent) => void;
  onPointerUp?: (event: PointerEvent) => void;
  onPointerLeave?: (event: PointerEvent) => void;
};

/*
 * Component.
 */

export function ChromelessButton({
  ref,
  class: className,
  pressActiveClass,
  vibration,
  vibrationTrigger = 'pointerdown',
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
      onClick?.(event);
      if (disabled || vibration == null || vibrationTrigger !== 'click') {
        return;
      }
      navigator.vibrate?.(vibration);
    },
    [onClick, disabled, vibration, vibrationTrigger]
  );

  const handlePointerDown = useCallback(
    (event: PointerEvent) => {
      onPointerDown?.(event);
      if (disabled) {
        return;
      }
      if (vibration != null && vibrationTrigger === 'pointerdown' && event.pointerType !== 'mouse') {
        navigator.vibrate?.(vibration);
      }
      if (!pressEnabled || event.pointerType === 'mouse') {
        return;
      }
      clearPending();
      setIsPressActive(true);
    },
    [onPointerDown, disabled, vibration, vibrationTrigger, pressEnabled, clearPending]
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
      ref={ref}
      type={type}
      {...rest}
      class={mergedClass}
      disabled={disabled}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
    />
  );
}
