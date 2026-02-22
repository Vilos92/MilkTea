import type {RefObject} from 'preact';
import {useEffect, useRef} from 'preact/hooks';

/*
 * Constants.
 */

const DEFAULT_THRESHOLD = 50;

/*
 * Hook.
 */

export function useSwipe(
  elementRef: RefObject<HTMLElement | null>,
  onSwipeLeft: () => void,
  onSwipeRight: () => void
) {
  const touchStart = useRef({x: 0, y: 0});
  const onSwipeLeftRef = useRef(onSwipeLeft);
  const onSwipeRightRef = useRef(onSwipeRight);
  onSwipeLeftRef.current = onSwipeLeft;
  onSwipeRightRef.current = onSwipeRight;

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const handleStart = (e: TouchEvent) => {
      touchStart.current = {x: e.touches[0].clientX, y: e.touches[0].clientY};
    };

    const handleEnd = (e: TouchEvent) => {
      const dX = e.changedTouches[0].clientX - touchStart.current.x;
      const dY = e.changedTouches[0].clientY - touchStart.current.y;

      if (Math.abs(dX) > Math.abs(dY) && Math.abs(dX) > DEFAULT_THRESHOLD) {
        if (dX > 0) onSwipeRightRef.current();
        if (dX < 0) onSwipeLeftRef.current();
      }
    };

    el.addEventListener('touchstart', handleStart, {passive: true});
    el.addEventListener('touchend', handleEnd, {passive: true});

    return () => {
      el.removeEventListener('touchstart', handleStart);
      el.removeEventListener('touchend', handleEnd);
    };
  }, [elementRef]);
}
