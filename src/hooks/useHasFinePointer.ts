import {useEffect, useRef, useState} from 'react';

/*
 * Hook.
 */

/**
 * Returns true when the environment should be treated as having a "fine"
 * pointer (mouse/trackpad) for the purpose of sizing UI elements.
 *
 * Behavior:
 * - In the browser, uses `(pointer: fine)` to detect the primary pointer.
 * - On the server (or when `matchMedia` is unavailable), returns false.
 */
export function useHasFinePointer(): boolean {
  const queryRef = useRef<MediaQueryList | null>(null);
  if (queryRef.current === null && typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    queryRef.current = window.matchMedia('(pointer: fine)');
  }

  const [hasFinePointer, setHasFinePointer] = useState(() => queryRef.current?.matches ?? false);

  useEffect(() => {
    const query = queryRef.current;
    if (!query) {
      return;
    }

    const handleChange = () => {
      setHasFinePointer(query.matches);
    };

    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  return hasFinePointer;
}
