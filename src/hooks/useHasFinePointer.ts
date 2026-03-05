import {useEffect, useState} from 'react';

/*
 * Hook.
 */

/**
 * Returns true when the environment should be treated as having a "fine"
 * pointer (mouse/trackpad/pen) for the purpose of sizing UI elements.
 *
 * Behavior:
 * - In the browser, prefers `(pointer: fine)` but will also look at
 *   `(any-pointer: fine)` to avoid misclassifying some hybrids.
 * - On the server (or when `matchMedia` is unavailable), returns false.
 */
export function useHasFinePointer(): boolean {
  const [hasFinePointer, setHasFinePointer] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const pointerFineQuery = window.matchMedia('(pointer: fine)');
    // We also check `(any-pointer: fine)` to avoid misclassifying some hybrids.
    // e.g. a tablet with a mouse attached would be classfied as a fine pointer.
    const anyPointerFineQuery = window.matchMedia('(any-pointer: fine)');

    const checkHasFinePointer = () => {
      const hasFine = pointerFineQuery.matches || anyPointerFineQuery.matches;
      setHasFinePointer(hasFine);
    };

    checkHasFinePointer();

    const handlePointerFineChange = () => {
      checkHasFinePointer();
    };

    const handleAnyPointerFineChange = () => {
      checkHasFinePointer();
    };

    pointerFineQuery.addEventListener('change', handlePointerFineChange);
    anyPointerFineQuery.addEventListener('change', handleAnyPointerFineChange);

    return () => {
      pointerFineQuery.removeEventListener('change', handlePointerFineChange);
      anyPointerFineQuery.removeEventListener('change', handleAnyPointerFineChange);
    };
  }, []);

  return hasFinePointer;
}
