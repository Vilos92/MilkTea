import {useCallback, useEffect, useState} from 'preact/hooks';

/**
 * Manages keyboard-navigable active index for a filtered list.
 * Clamps automatically when the list length changes.
 */
export function useSearchableList(listSize: number) {
  const [activeIndex, setActiveIndex] = useState(0);

  const resetActiveIndex = useCallback(() => {
    setActiveIndex(0);
  }, []);

  const moveUp = useCallback(() => {
    setActiveIndex(i => Math.max(0, i - 1));
  }, []);

  const moveDown = useCallback(() => {
    setActiveIndex(i => Math.min(i + 1, listSize - 1));
  }, [listSize]);

  useEffect(() => {
    setActiveIndex(i => Math.min(i, Math.max(0, listSize - 1)));
  }, [listSize]);

  return {
    activeIndex,
    setActiveIndex,
    resetActiveIndex,
    moveUp,
    moveDown
  };
}
