import {useCallback, useEffect, useRef, useState} from 'preact/hooks';

import {useHasFinePointer} from './useHasFinePointer';

/*
 * Constants.
 */

const PRESS_FEEDBACK_MS = 50;

/*
 * Hook.
 */

/**
 * Returns state and handlers to show a brief "pressed" state on mobile after tap.
 * Only active when the primary pointer is coarse (e.g. touch).
 */
export function useMobilePressFeedback(): {
  isActive: boolean;
  onPointerDown: (event: PointerEvent) => void;
  onPointerUp: (event: PointerEvent) => void;
  onPointerLeave: (event: PointerEvent) => void;
} {
  const hasFinePointer = useHasFinePointer();
  const enabled = !hasFinePointer;
  const [isActive, setIsActive] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPending = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => () => clearPending(), [clearPending]);

  const scheduleInactive = useCallback(() => {
    clearPending();
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      setIsActive(false);
    }, PRESS_FEEDBACK_MS);
  }, [clearPending]);

  const onPointerDown = useCallback(
    (event: PointerEvent) => {
      if (!enabled || event.pointerType === 'mouse') {
        return;
      }
      clearPending();
      setIsActive(true);
    },
    [enabled, clearPending]
  );

  const onPointerUp = useCallback(
    (event: PointerEvent) => {
      if (!enabled) {
        return;
      }
      void event;
      scheduleInactive();
    },
    [enabled, scheduleInactive]
  );

  const onPointerLeave = useCallback(
    (event: PointerEvent) => {
      if (!enabled) {
        return;
      }
      void event;
      scheduleInactive();
    },
    [enabled, scheduleInactive]
  );

  return {isActive, onPointerDown, onPointerUp, onPointerLeave};
}
