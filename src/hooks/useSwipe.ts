import type {RefObject} from 'preact';
import {useEffect, useRef} from 'preact/hooks';

/*
 * Types.
 */

type Axis = (typeof Axis)[keyof typeof Axis];

type SwipeConfigHorizontal = {
  axis: typeof Axis.HORIZONTAL;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
};

type SwipeConfigVertical = {
  axis: typeof Axis.VERTICAL;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
};

export type SwipeConfig = SwipeConfigHorizontal | SwipeConfigVertical;

/*
 * Enums.
 */

export const Axis = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical'
} as const;

/*
 * Constants.
 */

const DEFAULT_THRESHOLD = 50;

/*
 * Hook.
 */

export function useSwipe(elementRef: RefObject<HTMLElement | null>, config: SwipeConfig) {
  const touchStart = useRef({x: 0, y: 0});
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) {
      return;
    }

    const handleStart = (event: TouchEvent) => {
      touchStart.current = {x: event.touches[0].clientX, y: event.touches[0].clientY};
    };

    const handleEnd = (event: TouchEvent) => {
      const dX = event.changedTouches[0].clientX - touchStart.current.x;
      const dY = event.changedTouches[0].clientY - touchStart.current.y;
      const swipeConfig = configRef.current;

      if (swipeConfig.axis === Axis.HORIZONTAL) {
        if (Math.abs(dX) > Math.abs(dY) && Math.abs(dX) > DEFAULT_THRESHOLD) {
          if (dX > 0) {
            swipeConfig.onSwipeRight?.();
          }
          if (dX < 0) {
            swipeConfig.onSwipeLeft?.();
          }
        }
      } else {
        if (Math.abs(dY) > Math.abs(dX) && Math.abs(dY) > DEFAULT_THRESHOLD) {
          if (dY > 0) {
            swipeConfig.onSwipeDown?.();
          }
          if (dY < 0) {
            swipeConfig.onSwipeUp?.();
          }
        }
      }
    };

    element.addEventListener('touchstart', handleStart, {passive: true});
    element.addEventListener('touchend', handleEnd, {passive: true});

    return () => {
      element.removeEventListener('touchstart', handleStart);
      element.removeEventListener('touchend', handleEnd);
    };
  }, [elementRef]);
}
